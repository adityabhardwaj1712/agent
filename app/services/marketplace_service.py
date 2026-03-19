from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional, Tuple
import uuid
import json
from ..models.marketplace import AgentTemplate, TemplatePurchase, TemplateReview
from ..models.agent import Agent
from ..schemas.marketplace_schema import AgentTemplateCreate, AgentTemplateUpdate

class MarketplaceService:
    async def list_templates(
        self, 
        db: AsyncSession, 
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "popular",
        free_only: bool = False,
        skip: int = 0,
        limit: int = 20
    ) -> List[AgentTemplate]:
        query = select(AgentTemplate).where(AgentTemplate.is_published == True)
        
        if category:
            query = query.where(AgentTemplate.category == category)
        if free_only:
            query = query.where(AgentTemplate.price == 0)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    AgentTemplate.name.ilike(search_term),
                    AgentTemplate.description.ilike(search_term)
                )
            )
            
        if sort == "popular":
            query = query.order_by(AgentTemplate.downloads.desc())
        elif sort == "rating":
            query = query.order_by(AgentTemplate.rating.desc())
        else:
            query = query.order_by(AgentTemplate.created_at.desc())
            
        result = await db.execute(query.offset(skip).limit(limit))
        return result.scalars().all()

    async def create_template(
        self, db: AsyncSession, creator_id: str, creator_name: str, schema: AgentTemplateCreate
    ) -> AgentTemplate:
        template = AgentTemplate(
            template_id=str(uuid.uuid4()),
            creator_id=creator_id,
            creator_name=creator_name,
            **schema.dict()
        )
        db.add(template)
        await db.commit()
        await db.refresh(template)
        return template

    async def purchase_template(
        self, db: AsyncSession, buyer_id: str, template_id: str, stripe_payment_id: Optional[str] = None
    ) -> TemplatePurchase:
        template = await db.get(AgentTemplate, template_id)
        if not template:
            raise ValueError("Template not found")
            
        purchase = TemplatePurchase(
            purchase_id=str(uuid.uuid4()),
            template_id=template_id,
            buyer_id=buyer_id,
            price_paid=template.price,
            commission=template.price * 0.25, # 25% cut
            stripe_payment_id=stripe_payment_id,
            payment_status="completed" if template.price == 0 or stripe_payment_id else "pending"
        )
        
        db.add(purchase)
        template.downloads += 1
        await db.commit()
        await db.refresh(purchase)
        return purchase

    async def deploy_template(
        self, db: AsyncSession, user_id: str, template_id: str
    ) -> Agent:
        # Verify purchase
        query = select(TemplatePurchase).where(
            TemplatePurchase.template_id == template_id,
            TemplatePurchase.buyer_id == user_id,
            TemplatePurchase.payment_status == "completed"
        )
        purchase = await db.scalar(query)
        if not purchase:
            raise PermissionError("Template not purchased or payment pending")
            
        template = await db.get(AgentTemplate, template_id)
        config = template.config_json
        
        agent = Agent(
            agent_id=str(uuid.uuid4()),
            name=template.name,
            role=config.get("role"),
            description=config.get("description"),
            personality_config=json.dumps(config.get("personality", {})),
            owner_id=user_id
        )
        
        db.add(agent)
        await db.commit()
        await db.refresh(agent)
        return agent

marketplace_service = MarketplaceService()
