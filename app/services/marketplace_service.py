from typing import List, Optional, Dict, Any, Union, Tuple
import uuid
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from loguru import logger

from ..models.marketplace import AgentTemplate, TemplatePurchase, TemplateReview
from ..models.agent import Agent
from ..schemas.marketplace_schema import AgentTemplateCreate, AgentTemplateUpdate

class MarketplaceService:
    """
    Manages the Agent Marketplace lifecycle, including template discovery, 
    purchasing, and autonomous agent deployment.
    """

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
        """
        Retrieves a list of published agent templates with filtering and sorting.
        
        Args:
            db (AsyncSession): Database session.
            category (Optional[str]): Filters templates by category.
            search (Optional[str]): Full-text search on name or description.
            sort (str): Sorting criteria ('popular', 'rating', 'newest').
            free_only (bool): If True, only returns free templates.
            skip (int): Offset for pagination.
            limit (int): Cap on results returned.
            
        Returns:
            List[AgentTemplate]: A list of matching templates.
        """
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
        """
        Registers a new agent template in the marketplace.
        
        Args:
            db (AsyncSession): Database session.
            creator_id (str): UUID of the creator user.
            creator_name (str): Name of the creator.
            schema (AgentTemplateCreate): Template creation metadata.
            
        Returns:
            AgentTemplate: The newly created template record.
        """
        template = AgentTemplate(
            template_id=str(uuid.uuid4()),
            creator_id=creator_id,
            creator_name=creator_name,
            **schema.dict()
        )
        db.add(template)
        try:
            await db.commit()
            await db.refresh(template)
            logger.info(f"Published new template '{template.name}' by {creator_name}")
            return template
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create template: {e}")
            raise

    async def purchase_template(
        self, db: AsyncSession, buyer_id: str, template_id: str, stripe_payment_id: Optional[str] = None
    ) -> TemplatePurchase:
        """
        Manages the acquisition of an agent template by a user.
        
        Handles price calculation, commission splits, and payment status updates.
        
        Args:
            db (AsyncSession): Database session.
            buyer_id (str): UUID of the purchasing user.
            template_id (str): UUID of the target template.
            stripe_payment_id (Optional[str]): External payment reference.
            
        Returns:
            TemplatePurchase: The purchase transaction record.
            
        Raises:
            ValueError: If the template does not exist.
        """
        template = await db.get(AgentTemplate, template_id)
        if not template:
            logger.warning(f"Purchase abort: Template {template_id} not found.")
            raise ValueError("Template not found")
            
        purchase = TemplatePurchase(
            purchase_id=str(uuid.uuid4()),
            template_id=template_id,
            buyer_id=buyer_id,
            price_paid=template.price,
            commission=template.price * 0.25,
            stripe_payment_id=stripe_payment_id,
            payment_status="completed" if template.price == 0 or stripe_payment_id else "pending"
        )
        
        db.add(purchase)
        template.downloads += 1
        
        try:
            await db.commit()
            await db.refresh(purchase)
            logger.info(f"Purchase confirmed: {buyer_id} purchased template {template_id}")
            return purchase
        except Exception as e:
            await db.rollback()
            logger.error(f"Purchase transaction failed: {e}")
            raise

    async def deploy_template(
        self, db: AsyncSession, user_id: str, template_id: str
    ) -> Agent:
        """
        Instantiates a fully functional autonomous agent from a purchased template.
        
        Args:
            db (AsyncSession): Database session.
            user_id (str): UUID of the owner.
            template_id (str): UUID of the template to deploy.
            
        Returns:
            Agent: The newly deployed agent record.
            
        Raises:
            PermissionError: If the template has not been purchased.
        """
        query = select(TemplatePurchase).where(
            TemplatePurchase.template_id == template_id,
            TemplatePurchase.buyer_id == user_id,
            TemplatePurchase.payment_status == "completed"
        )
        purchase = await db.scalar(query)
        if not purchase:
            logger.warning(f"Deployment denied: User {user_id} lacks purchase record for {template_id}")
            raise PermissionError("Template not purchased or payment pending")
            
        template = await db.get(AgentTemplate, template_id)
        config = template.config_json or {}
        
        agent = Agent(
            agent_id=str(uuid.uuid4()),
            name=template.name,
            role=config.get("role", "General Assistant"),
            description=config.get("description", template.description),
            personality_config=json.dumps(config.get("personality", {})),
            owner_id=user_id,
            model_name=config.get("model", "gpt-4o"),
        )
        
        db.add(agent)
        try:
            await db.commit()
            await db.refresh(agent)
            logger.info(f"Agent Deployed: '{agent.name}' (ID: {agent.agent_id}) for user {user_id}")
            return agent
        except Exception as e:
            await db.rollback()
            logger.error(f"Agent deployment from template failed: {e}")
            raise

marketplace_service = MarketplaceService()
