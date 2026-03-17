from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.goal import Goal
from app.schemas.task_schema import GoalCreate, TaskCreate
from app.services.planner import planner_service
from app.services.task_service import send_task
import uuid
import logging

logger = logging.getLogger(__name__)

async def create_goal(db: AsyncSession, data: GoalCreate, owner_id: str):
    goal_id = str(uuid.uuid4())
    db_goal = Goal(
        goal_id=goal_id,
        description=data.description,
        target_outcome=data.target_outcome,
        status="planning",
        owner_id=owner_id
    )
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)

    # Trigger Autonomous Planning
    plan = await planner_service.generate_plan(db, data.description, owner_id)
    if plan:
        logger.info(f"Goal {goal_id} planned: {plan.summary}")
        
        # Map of temporary plan index to real task_id
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
            ))
            
            task_id_map[i] = created_task["task_id"]
            
        db_goal.status = "active"
        await db.commit()
    else:
        logger.warning(f"Goal {goal_id} planning failed. Manual intervention needed.")
        db_goal.status = "failed_planning"
        await db.commit()

    return db_goal

async def get_goal(db: AsyncSession, goal_id: str):
    return await db.get(Goal, goal_id)

async def list_goals(db: AsyncSession):
    stmt = select(Goal).order_by(Goal.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def update_goal_status(db: AsyncSession, goal_id: str, status: str):
    goal = await get_goal(db, goal_id)
    if goal:
        goal.status = status
        await db.commit()
        return True
    return False
