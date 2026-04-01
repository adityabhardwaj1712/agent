"""Initial reset migration

Revision ID: 0001_initial_reset
Revises: 
Create Date: 2026-03-24 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = '0001_initial_reset'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 0. Extensions
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))

    # 1. users
    op.create_table(
        'users',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=True),
        sa.Column('stripe_customer_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_stripe_customer_id'), 'users', ['stripe_customer_id'], unique=True)
    op.create_index(op.f('ix_users_user_id'), 'users', ['user_id'], unique=False)

    # 2. agents
    op.create_table(
        'agents',
        sa.Column('agent_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.String(), nullable=True),
        sa.Column('scopes', sa.Text(), nullable=True),
        sa.Column('reputation_score', sa.Float(), nullable=True),
        sa.Column('total_tasks', sa.Integer(), nullable=True),
        sa.Column('successful_tasks', sa.Integer(), nullable=True),
        sa.Column('failed_tasks', sa.Integer(), nullable=True),
        sa.Column('personality_config', sa.Text(), nullable=True),
        sa.Column('model_name', sa.String(), nullable=True),
        sa.Column('base_cost', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('agent_id')
    )
    op.create_index(op.f('ix_agents_agent_id'), 'agents', ['agent_id'], unique=False)
    op.create_index(op.f('ix_agents_owner_id'), 'agents', ['owner_id'], unique=False)

    # 3. tasks
    op.create_table(
        'tasks',
        sa.Column('task_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('goal_id', sa.String(), nullable=True),
        sa.Column('parent_task_id', sa.String(), nullable=True),
        sa.Column('payload', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('result', sa.Text(), nullable=True),
        sa.Column('thought_process', sa.Text(), nullable=True),
        sa.Column('input_data', sa.Text(), nullable=True),
        sa.Column('output_data', sa.Text(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('model_used', sa.String(), nullable=True),
        sa.Column('task_hash', sa.String(), nullable=True),
        sa.Column('priority_level', sa.Integer(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('max_retries', sa.Integer(), nullable=True),
        sa.Column('is_cached_result', sa.Boolean(), nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('task_id')
    )
    op.create_index(op.f('ix_tasks_agent_id'), 'tasks', ['agent_id'], unique=False)
    op.create_index(op.f('ix_tasks_goal_id'), 'tasks', ['goal_id'], unique=False)
    op.create_index(op.f('ix_tasks_parent_task_id'), 'tasks', ['parent_task_id'], unique=False)
    op.create_index(op.f('ix_tasks_task_hash'), 'tasks', ['task_hash'], unique=False)
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)

    # 4. goals
    op.create_table(
        'goals',
        sa.Column('goal_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('target_outcome', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('goal_id')
    )
    op.create_index(op.f('ix_goals_user_id'), 'goals', ['user_id'], unique=False)

    # 5. events
    op.create_table(
        'events',
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('task_id', sa.String(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('event_id')
    )
    op.create_index(op.f('ix_events_agent_id'), 'events', ['agent_id'], unique=False)
    op.create_index(op.f('ix_events_event_type'), 'events', ['event_type'], unique=False)
    op.create_index(op.f('ix_events_task_id'), 'events', ['task_id'], unique=False)
    op.create_index(op.f('ix_events_timestamp'), 'events', ['timestamp'], unique=False)
    op.create_index(op.f('ix_events_user_id'), 'events', ['user_id'], unique=False)

    # 6. tools
    op.create_table(
        'tools',
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('parameters_schema', sa.JSON(), nullable=False),
        sa.Column('implementation_code', sa.Text(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('name')
    )

    # 7. memories
    op.create_table(
        'memories',
        sa.Column('memory_id', sa.String(), nullable=False),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('embedding', Vector(dim=1536), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('memory_id')
    )

    # 8. protocol_messages
    op.create_table(
        'protocol_messages',
        sa.Column('message_id', sa.String(), nullable=False),
        sa.Column('from_agent_id', sa.String(), nullable=False),
        sa.Column('to_agent_id', sa.String(), nullable=False),
        sa.Column('message_type', sa.String(), nullable=False),
        sa.Column('payload', sa.Text(), nullable=False),
        sa.Column('correlation_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('message_id')
    )

    # 9. traces
    op.create_table(
        'traces',
        sa.Column('trace_id', sa.String(), nullable=False),
        sa.Column('task_id', sa.String(), nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('step', sa.String(), nullable=True),
        sa.Column('input_data', sa.JSON(), nullable=True),
        sa.Column('output_data', sa.JSON(), nullable=True),
        sa.Column('metadata_info', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('trace_id')
    )
    op.create_index(op.f('ix_traces_agent_id'), 'traces', ['agent_id'], unique=False)
    op.create_index(op.f('ix_traces_task_id'), 'traces', ['task_id'], unique=False)

    # 10. approval_requests
    op.create_table(
        'approval_requests',
        sa.Column('request_id', sa.String(), nullable=False),
        sa.Column('task_id', sa.String(), nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('goal_id', sa.String(), nullable=True),
        sa.Column('operation', sa.String(), nullable=True),
        sa.Column('payload', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('processed_by', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('request_id')
    )
    op.create_index(op.f('ix_approval_requests_agent_id'), 'approval_requests', ['agent_id'], unique=False)
    op.create_index(op.f('ix_approval_requests_goal_id'), 'approval_requests', ['goal_id'], unique=False)
    op.create_index(op.f('ix_approval_requests_task_id'), 'approval_requests', ['task_id'], unique=False)

    # 11. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('log_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('method', sa.String(), nullable=False),
        sa.Column('path', sa.String(), nullable=False),
        sa.Column('status_code', sa.String(), nullable=True),
        sa.Column('detail', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('log_id')
    )
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

    # 12. workflow_runs
    op.create_table(
        'workflow_runs',
        sa.Column('run_id', sa.String(), nullable=False),
        sa.Column('workflow_name', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('final_state', sa.JSON(), nullable=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('total_duration_ms', sa.Integer(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('run_id')
    )
    op.create_index(op.f('ix_workflow_runs_run_id'), 'workflow_runs', ['run_id'], unique=False)
    op.create_index(op.f('ix_workflow_runs_status'), 'workflow_runs', ['status'], unique=False)
    op.create_index(op.f('ix_workflow_runs_user_id'), 'workflow_runs', ['user_id'], unique=False)
    op.create_index(op.f('ix_workflow_runs_workflow_name'), 'workflow_runs', ['workflow_name'], unique=False)

    # 13. workflow_node_results
    op.create_table(
        'workflow_node_results',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('run_id', sa.String(), nullable=False),
        sa.Column('node_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('output', sa.Text(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['run_id'], ['workflow_runs.run_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflow_node_results_id'), 'workflow_node_results', ['id'], unique=False)
    op.create_index(op.f('ix_workflow_node_results_node_id'), 'workflow_node_results', ['node_id'], unique=False)

    # 14. circuit_breaker_log
    op.create_table(
        'circuit_breaker_log',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('agent_id', sa.String(), nullable=False),
        sa.Column('state_from', sa.String(), nullable=False),
        sa.Column('state_to', sa.String(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_circuit_breaker_log_agent_id'), 'circuit_breaker_log', ['agent_id'], unique=False)
    op.create_index(op.f('ix_circuit_breaker_log_id'), 'circuit_breaker_log', ['id'], unique=False)

    # 15. dlq_events
    op.create_table(
        'dlq_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('task_id', sa.String(), nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('payload', sa.Text(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dlq_events_agent_id'), 'dlq_events', ['agent_id'], unique=False)
    op.create_index(op.f('ix_dlq_events_id'), 'dlq_events', ['id'], unique=False)
    op.create_index(op.f('ix_dlq_events_task_id'), 'dlq_events', ['task_id'], unique=False)

    # 16. agent_templates
    op.create_table(
        'agent_templates',
        sa.Column('template_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('long_description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('creator_id', sa.String(), nullable=False),
        sa.Column('creator_name', sa.String(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('config_json', sa.JSON(), nullable=False),
        sa.Column('version', sa.String(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('downloads', sa.Integer(), nullable=True),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('review_count', sa.Integer(), nullable=True),
        sa.Column('thumbnail_url', sa.String(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['creator_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('template_id')
    )
    op.create_index(op.f('ix_agent_templates_category'), 'agent_templates', ['category'], unique=False)
    op.create_index(op.f('ix_agent_templates_creator_id'), 'agent_templates', ['creator_id'], unique=False)
    op.create_index(op.f('ix_agent_templates_template_id'), 'agent_templates', ['template_id'], unique=False)

    # 17. template_purchases
    op.create_table(
        'template_purchases',
        sa.Column('purchase_id', sa.String(), nullable=False),
        sa.Column('template_id', sa.String(), nullable=False),
        sa.Column('buyer_id', sa.String(), nullable=False),
        sa.Column('price_paid', sa.Float(), nullable=True),
        sa.Column('commission', sa.Float(), nullable=True),
        sa.Column('stripe_payment_id', sa.String(), nullable=True),
        sa.Column('payment_status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.user_id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['agent_templates.template_id'], ),
        sa.PrimaryKeyConstraint('purchase_id')
    )
    op.create_index(op.f('ix_template_purchases_buyer_id'), 'template_purchases', ['buyer_id'], unique=False)
    op.create_index(op.f('ix_template_purchases_template_id'), 'template_purchases', ['template_id'], unique=False)

    # 18. template_reviews
    op.create_table(
        'template_reviews',
        sa.Column('review_id', sa.String(), nullable=False),
        sa.Column('template_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('is_verified_purchase', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['agent_templates.template_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('review_id')
    )
    op.create_index(op.f('ix_template_reviews_template_id'), 'template_reviews', ['template_id'], unique=False)
    op.create_index(op.f('ix_template_reviews_user_id'), 'template_reviews', ['user_id'], unique=False)

    # 19. subscriptions
    op.create_table(
        'subscriptions',
        sa.Column('subscription_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('plan', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(), nullable=True),
        sa.Column('current_period_start', sa.DateTime(), nullable=True),
        sa.Column('current_period_end', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('subscription_id')
    )
    op.create_index(op.f('ix_subscriptions_stripe_subscription_id'), 'subscriptions', ['stripe_subscription_id'], unique=False)
    op.create_index(op.f('ix_subscriptions_user_id'), 'subscriptions', ['user_id'], unique=False)

    # 20. usage_records
    op.create_table(
        'usage_records',
        sa.Column('record_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('period', sa.String(), nullable=True),
        sa.Column('metric', sa.String(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.Column('agent_id', sa.String(), nullable=True),
        sa.Column('task_id', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.agent_id'], ),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.task_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('record_id')
    )
    op.create_index(op.f('ix_usage_records_agent_id'), 'usage_records', ['agent_id'], unique=False)
    op.create_index(op.f('ix_usage_records_metric'), 'usage_records', ['metric'], unique=False)
    op.create_index(op.f('ix_usage_records_period'), 'usage_records', ['period'], unique=False)
    op.create_index(op.f('ix_usage_records_task_id'), 'usage_records', ['task_id'], unique=False)
    op.create_index(op.f('ix_usage_records_user_id'), 'usage_records', ['user_id'], unique=False)

    # 21. api_keys
    op.create_table(
        'api_keys',
        sa.Column('key_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('hashed_secret', sa.String(), nullable=False),
        sa.Column('prefix', sa.String(), nullable=False),
        sa.Column('label', sa.String(), nullable=True),
        sa.Column('scopes', sa.JSON(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('key_id')
    )
    op.create_index(op.f('ix_api_keys_key_id'), 'api_keys', ['key_id'], unique=False)


def downgrade() -> None:
    op.drop_table('api_keys')
    op.drop_table('usage_records')
    op.drop_table('subscriptions')
    op.drop_table('template_reviews')
    op.drop_table('template_purchases')
    op.drop_table('agent_templates')
    op.drop_table('dlq_events')
    op.drop_table('circuit_breaker_log')
    op.drop_table('workflow_node_results')
    op.drop_table('workflow_runs')
    op.drop_table('audit_logs')
    op.drop_table('approval_requests')
    op.drop_table('traces')
    op.drop_table('protocol_messages')
    op.drop_table('memories')
    op.drop_table('tools')
    op.drop_table('events')
    op.drop_table('goals')
    op.drop_table('tasks')
    op.drop_table('agents')
    op.drop_table('users')
