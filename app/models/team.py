from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from ..db.base import Base
import datetime
import uuid

# Association table for Agents and Teams
agent_team_association = Table(
    "agent_team_association",
    Base.metadata,
    Column("agent_id", String, ForeignKey("agents.agent_id")),
    Column("team_id", String, ForeignKey("teams.team_id"))
)

class Team(Base):
    __tablename__ = "teams"

    team_id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(String, ForeignKey("users.user_id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User")
    agents = relationship("Agent", secondary=agent_team_association, back_populates="teams")
