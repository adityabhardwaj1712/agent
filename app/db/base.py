from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here to ensure they are registered with Base
from ..models.agent import Agent
from ..models.memory import Memory
from ..models.task import Task
from ..models.audit_log import AuditLog
from ..models.protocol_message import ProtocolMessage
from ..models.approval import ApprovalRequest
from ..models.event import Event
