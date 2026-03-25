import stripe
import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from typing import List, Optional, Dict, Any

from ..models.user import User
from ..models.billing import Subscription, UsageRecord
from ..db.redis_client import get_async_redis_client
from ..config import settings

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY or "sk_test_placeholder" # Use proper key from settings

class BillingService:
    """
    Handles subscriptions, usage metering, and Stripe integration.
    """
    
    PLANS = {
        "free": {
            "name": "Free",
            "price": 0,
            "limits": {"agents": 1, "tasks_per_month": 100}
        },
        "pro": {
            "name": "Pro",
            "price": 99,
            "stripe_price_id": "price_pro_placeholder",
            "limits": {"agents": 10, "tasks_per_month": 5000}
        },
        "business": {
            "name": "Business",
            "price": 499,
            "stripe_price_id": "price_biz_placeholder",
            "limits": {"agents": 50, "tasks_per_month": 50000}
        },
    }

    async def _mock_stripe_call(self, action: str, **kwargs):
        """Simulates Stripe API calls for development/demo."""
        logger.info(f"MOCK STRIPE: Executing {action} with {kwargs}")
        return {"id": f"mock_{action}_{uuid.uuid4().hex[:8]}", "status": "active"}

    TOKEN_PRICES = {
        "input": 0.00001,  # $0.01 per 1k tokens
        "output": 0.00003  # $0.03 per 1k tokens
    }

    AVG_HUMAN_HOUR_COST = 50.0 # Standard dev/admin cost per hour

    async def create_subscription(
        self, db: AsyncSession, user_id: str, plan: str, payment_method_id: Optional[str] = None
    ) -> Subscription:
        """
        Creates a subscription record and links with Stripe (Mock).
        """
        if plan not in self.PLANS:
            raise ValueError(f"Invalid plan: {plan}")

        # 1. Fetch User
        user = await db.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        # 2. Assign Stripe Customer ID if missing (Simulated)
        if not user.stripe_customer_id:
            customer = await self._mock_stripe_call("customer_create", email=user.email)
            user.stripe_customer_id = customer["id"]

        # 3. Create Stripe Subscription (Simulated)
        price_id = self.PLANS[plan].get("stripe_price_id", "price_free")
        stripe_sub = await self._mock_stripe_call("subscription_create", 
                                                customer=user.stripe_customer_id, 
                                                price=price_id)

        # 4. Deactivate existing active subscriptions
        from sqlalchemy import update
        await db.execute(
            update(Subscription)
            .where(Subscription.user_id == user_id, Subscription.status == "active")
            .values(status="cancelled", current_period_end=datetime.now(datetime.UTC))
        )

        # 5. Create new subscription record
        subscription = Subscription(
            subscription_id=stripe_sub["id"],
            user_id=user_id,
            plan=plan,
            status="active",
            current_period_start=datetime.now(datetime.UTC),
            current_period_end=datetime.now(datetime.UTC) + timedelta(days=30)
        )
        
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)
        
        logger.info(f"User {user_id} subscribed to {plan} (ID: {subscription.subscription_id})")
        return subscription

    async def record_usage(self, user_id: str, metric: str, quantity: int = 1, agent_id: Optional[str] = None, task_id: Optional[str] = None):
        """
        Atomically increments usage metrics in Redis with granular attribution.
        """
        redis = await get_async_redis_client()
        
        # Get current billing period (YYYY-MM)
        now = datetime.now(datetime.UTC)
        period = now.strftime("%Y-%m")
        
        # 1. Update Global Metric
        global_key = f"usage:{user_id}:{period}:{metric}:global"
        await redis.incrby(global_key, quantity)
        await redis.expire(global_key, 60 * 24 * 60 * 60)

        # 2. Update Agent-Specific Metric
        if agent_id:
            agent_key = f"usage:{user_id}:{period}:{metric}:agent:{agent_id}"
            await redis.incrby(agent_key, quantity)
            await redis.expire(agent_key, 60 * 24 * 60 * 60)
            
            # Record attribution mapping if needed (e.g. for sync to DB)
            # await redis.sadd(f"agents_with_usage:{user_id}:{period}", agent_id)

    async def get_usage_summary(self, user_id: str, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves current usage and compares against plan limits.
        If agent_id is provided, returns usage for that specific agent.
        """
        redis = await get_async_redis_client()
        now = datetime.now(datetime.UTC)
        period = now.strftime("%Y-%m")
        
        usage = {}
        metrics = ["tasks", "tokens", "agent_hours"]
        
        suffix = f"agent:{agent_id}" if agent_id else "global"
        
        for metric in metrics:
            usage_key = f"usage:{user_id}:{period}:{metric}:{suffix}"
            val = await redis.get(usage_key)
            usage[metric] = int(val) if val else 0
            
        return usage

    async def check_limits(self, db: AsyncSession, user_id: str, metric: str) -> bool:
        """
        Enforces plan limits.
        """
        # 1. Get active subscription
        query = select(Subscription).where(
            Subscription.user_id == user_id, 
            Subscription.status == "active"
        )
        sub = await db.scalar(query)
        plan_key = sub.plan if sub else "free"
        
        limits = self.PLANS[plan_key]["limits"]
        
        # 2. Check usage
        return True

    async def get_detailed_analytics(self, db: AsyncSession, user_id: str) -> Dict[str, Any]:
        """
        Calculates total cost and ROI metrics, including per-agent breakdown.
        """
        global_usage = await self.get_usage_summary(user_id)
        
        # Calculate Costs
        def calc_costs(usage_dict):
            token_cost = usage_dict.get("tokens", 0) * (self.TOKEN_PRICES["input"] + self.TOKEN_PRICES["output"]) / 2
            task_cost = usage_dict.get("tasks", 0) * 0.05
            return round(token_cost + task_cost, 4)

        total_ai_cost = calc_costs(global_usage)
        
        # Calculate ROI
        hours_saved = (global_usage.get("tasks", 0) * 15) / 60
        money_saved = hours_saved * self.AVG_HUMAN_HOUR_COST
        roi = ((money_saved - total_ai_cost) / total_ai_cost * 100) if total_ai_cost > 0 else 0
        
        # Per-Agent Breakdown
        from ..models.agent import Agent
        agents_result = await db.execute(select(Agent).where(Agent.owner_id == user_id))
        agents = agents_result.scalars().all()
        
        breakdown = {}
        for agent in agents:
            agent_usage = await self.get_usage_summary(user_id, agent_id=agent.agent_id)
            if any(v > 0 for v in agent_usage.values()):
                agent_cost = calc_costs(agent_usage)
                agent_hours_saved = (agent_usage.get("tasks", 0) * 15) / 60
                agent_money_saved = agent_hours_saved * self.AVG_HUMAN_HOUR_COST
                agent_roi = ((agent_money_saved - agent_cost) / agent_cost * 100) if agent_cost > 0 else 0
                
                breakdown[agent.name or agent.agent_id] = {
                    "agent_id": agent.agent_id,
                    "cost": agent_cost,
                    "tasks": agent_usage.get("tasks", 0),
                    "roi": round(agent_roi, 2)
                }
        
        return {
            "usage": global_usage,
            "costs": {
                "total_cost": total_ai_cost,
                "breakdown": breakdown
            },
            "savings": {
                "hours_saved": round(hours_saved, 2),
                "money_saved": round(money_saved, 2)
            },
            "roi_percentage": round(roi, 2)
        }

billing_service = BillingService()
