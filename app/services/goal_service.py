from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.goal import Goal
from app.schemas.task_schema import GoalCreate, TaskCreate
from app.services.planner import planner_service
from app.services.task_service import send_task
import uuid
import logging
import asyncio

logger = logging.getLogger(__name__)

from .billing_service import billing_service

async def create_goal(db: AsyncSession, data: GoalCreate, owner_id: str):
    # 1. Check Plan Limits (Active Goals)
    if not await billing_service.check_limits(db, owner_id, "active_goals"):
        raise PermissionError("Plan active goals limit reached")

    goal_id = str(uuid.uuid4())
    db_goal = Goal(
        goal_id=goal_id,
        description=data.description,
        target_outcome=data.target_outcome,
        status="planning",
        user_id=owner_id
    )

    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)

    # Trigger Autonomous Planning with 60s timeout
    try:
        plan = await asyncio.wait_for(
            planner_service.generate_plan(db, data.description, owner_id),
            timeout=60.0
        )
    except asyncio.TimeoutError:
        logger.error(f"Goal {goal_id} planning timed out after 60s.")
        db_goal.status = "failed_planning"
        await db.commit()
        return db_goal

    if plan:
        logger.info(f"Goal {goal_id} planned for user {owner_id}: {plan.summary}")
        
        task_id_map = {}
        for i, task_plan in enumerate(plan.tasks):
            parent_id = None
            if task_plan.depends_on is not None:
                parent_id = task_id_map.get(task_plan.depends_on)
                
            created_task = await send_task(db, TaskCreate(
                payload=task_plan.task_payload,
                agent_id=task_plan.agent_id,
                goal_id=goal_id,
                parent_task_id=parent_id
            ), user_id=owner_id) # Pass user_id
            
            task_id_map[i] = created_task["task_id"]
            
        db_goal.status = "active"
        await db.commit()
    else:
        logger.warning(f"Goal {goal_id} planning failed for user {owner_id}.")
        db_goal.status = "failed_planning"
        await db.commit()

    return db_goal

async def get_goal(db: AsyncSession, goal_id: str, owner_id: str):
    query = select(Goal).where(Goal.goal_id == goal_id, Goal.user_id == owner_id)

    result = await db.execute(query)
    return result.scalars().first()

async def list_goals(db: AsyncSession, owner_id: str):
    stmt = select(Goal).where(Goal.user_id == owner_id).order_by(Goal.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()

async def update_goal_status(db: AsyncSession, goal_id: str, owner_id: str, status: str):
    goal = await get_goal(db, goal_id, owner_id)
    if goal:
        goal.status = status
        await db.commit()
        return True
    return False
