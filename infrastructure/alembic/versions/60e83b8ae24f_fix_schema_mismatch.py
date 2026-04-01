"""fix_schema_mismatch

Revision ID: 60e83b8ae24f
Revises: 50e83b8ae23e
Create Date: 2026-03-27 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '60e83b8ae24f'
down_revision = '50e83b8ae23e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Update agents table
    op.add_column('agents', sa.Column('status', sa.String(), nullable=True, server_default='idle'))
    op.create_index(op.f('ix_agents_status'), 'agents', ['status'], unique=False)

    # 2. Update audit_logs table
    # Add new columns
    op.add_column('audit_logs', sa.Column('task_id', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('goal_id', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('action_type', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('action_detail', sa.JSON(), nullable=True))
    op.add_column('audit_logs', sa.Column('ip_address', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('timestamp', sa.DateTime(), nullable=True, server_default=sa.text('now()')))

    # Create indexes
    op.create_index(op.f('ix_audit_logs_task_id'), 'audit_logs', ['task_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_goal_id'), 'audit_logs', ['goal_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action_type'), 'audit_logs', ['action_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)

    # Modify existing columns to be nullable
    op.alter_column('audit_logs', 'action', nullable=True)
    op.alter_column('audit_logs', 'method', nullable=True)
    op.alter_column('audit_logs', 'path', nullable=True)

    # Add Foreign Key for task_id
    op.create_foreign_key('fk_audit_logs_tasks', 'audit_logs', 'tasks', ['task_id'], ['task_id'])


def downgrade() -> None:
    # 1. Revert agents table
    op.drop_index(op.f('ix_agents_status'), table_name='agents')
    op.drop_column('agents', 'status')

    # 2. Revert audit_logs table
    op.drop_constraint('fk_audit_logs_tasks', 'audit_logs', type_='foreignkey')
    op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_goal_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_task_id'), table_name='audit_logs')

    op.alter_column('audit_logs', 'path', nullable=False)
    op.alter_column('audit_logs', 'method', nullable=False)
    op.alter_column('audit_logs', 'action', nullable=False)

    op.drop_column('audit_logs', 'timestamp')
    op.drop_column('audit_logs', 'ip_address')
    op.drop_column('audit_logs', 'action_detail')
    op.drop_column('audit_logs', 'action_type')
    op.drop_column('audit_logs', 'goal_id')
    op.drop_column('audit_logs', 'task_id')
