"""auth scopes + audit logs

Revision ID: 0002_auth_scopes_audit
Revises: 0001_init_tables
Create Date: 2026-03-16

"""

from alembic import op
import sqlalchemy as sa

revision = "0002_auth_scopes_audit"
down_revision = "0001_init_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "agents",
        sa.Column(
            "scopes",
            sa.Text(),
            nullable=True,
            server_default="READ_MEMORY,WRITE_MEMORY,RUN_TASKS,SEND_PROTOCOL",
        ),
    )

    op.create_table(
        "audit_logs",
        sa.Column("log_id", sa.String(), primary_key=True),
        sa.Column("agent_id", sa.String(), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("method", sa.String(), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("status_code", sa.String(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_column("agents", "scopes")

