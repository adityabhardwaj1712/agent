"""add_user_id_to_memories

Revision ID: 50e83b8ae23e
Revises: 40f73e9c1db5
Create Date: 2026-03-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '50e83b8ae23e'
down_revision = '40f73e9c1db5'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('memories', sa.Column('user_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_memories_user_id'), 'memories', ['user_id'], unique=False)
    op.create_index(op.f('ix_memories_agent_id'), 'memories', ['agent_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_memories_agent_id'), table_name='memories')
    op.drop_index(op.f('ix_memories_user_id'), table_name='memories')
    op.drop_column('memories', 'user_id')
