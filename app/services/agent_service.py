import uuid
from sqlalchemy.orm import Session
from ..models.agent import Agent
from ..core.auth import create_token
from ..core.scopes import parse_scopes
from ..schemas.agent_schema import AgentCreate

def register_agent(db: Session, data: AgentCreate):
    agent_id = str(uuid.uuid4())
    db_agent = Agent(
        agent_id=agent_id,
        name=data.name,
        owner_id=data.owner_id
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    
    scopes = sorted(list(parse_scopes(getattr(db_agent, "scopes", None))))
    token = create_token(agent_id, scopes=scopes)
    
    return {
        "agent_id": agent_id,
        "name": db_agent.name,
        "owner_id": db_agent.owner_id,
        "scopes": scopes,
        "token": token,
    }

def get_agent(db: Session, agent_id: str):
    return db.query(Agent).filter(Agent.agent_id == agent_id).first()
