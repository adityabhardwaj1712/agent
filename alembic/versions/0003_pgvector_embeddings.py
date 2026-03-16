"""pgvector embeddings

Revision ID: 0003_pgvector_embeddings
Revises: 0002_auth_scopes_audit
Create Date: 2026-03-16

"""

from alembic import op
import sqlalchemy as sa

revision = "0003_pgvector_embeddings"
down_revision = "0002_auth_scopes_audit"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.add_column("memories", sa.Column("embedding", sa.Text(), nullable=True))
    # Convert to vector type if possible (pgvector)
    op.execute("ALTER TABLE memories ALTER COLUMN embedding TYPE vector(1536) USING NULLIF(embedding,'')::vector(1536)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_memories_embedding ON memories USING ivfflat (embedding vector_l2_ops) WITH (lists=100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_memories_embedding")
    op.drop_column("memories", "embedding")

