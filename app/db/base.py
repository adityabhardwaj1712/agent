from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import String

class TenantMixin:
    """Base mixin to inject Multi-Tenancy (org_id) into every table"""
    org_id: Mapped[str] = mapped_column(String, server_default='default', index=True, nullable=False)

Base = declarative_base(cls=TenantMixin)
