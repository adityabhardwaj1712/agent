from sqlalchemy.orm import declarative_base, declared_attr
from sqlalchemy import Column, String
import sqlalchemy as sa

class TenantMixin:
    """Base mixin to inject Multi-Tenancy (org_id) into every table"""
    @declared_attr
    def org_id(cls):
        return Column(String, server_default='default', index=True, nullable=False)

Base = declarative_base(cls=TenantMixin)
