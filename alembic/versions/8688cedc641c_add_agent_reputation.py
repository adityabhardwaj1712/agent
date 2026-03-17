"""add_agent_reputation

Revision ID: 8688cedc641c
Revises: 8d7bb944b389
Create Date: 2026-03-17 11:23:44.913832

"""
from alembic import op
import sqlalchemy as sa



revision = '8688cedc641c'
down_revision = '8d7bb944b389'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('agents', sa.Column('reputation_score', sa.Float(), nullable=True))
    op.add_column('agents', sa.Column('total_tasks', sa.Integer(), nullable=True))
    op.add_column('agents', sa.Column('successful_tasks', sa.Integer(), nullable=True))
    op.add_column('agents', sa.Column('failed_tasks', sa.Integer(), nullable=True))
    # Initialize values for existing agents
    op.execute("UPDATE agents SET reputation_score = 50.0, total_tasks = 0, successful_tasks = 0, failed_tasks = 0")


def downgrade() -> None:
    op.drop_column('agents', 'failed_tasks')
    op.drop_column('agents', 'successful_tasks')
    op.drop_column('agents', 'total_tasks')
    op.drop_column('agents', 'reputation_score')

