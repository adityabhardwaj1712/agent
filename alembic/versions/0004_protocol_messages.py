"""protocol messages

Revision ID: 0004_protocol_messages
Revises: 0003_pgvector_embeddings
Create Date: 2026-03-16

"""

from alembic import op
import sqlalchemy as sa

revision = "0004_protocol_messages"
down_revision = "0003_pgvector_embeddings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "protocol_messages",
        sa.Column("message_id", sa.String(), primary_key=True),
        sa.Column("from_agent_id", sa.String(), nullable=False),
        sa.Column("to_agent_id", sa.String(), nullable=False),
        sa.Column("message_type", sa.String(), nullable=False),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("correlation_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("protocol_messages")

