import asyncio
import sys
import os
import uuid

# Add project root to sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal
from app.models.agent import Agent
from app.models.user import User

AGENT_ROSTER = [
    # Core
    {"name": "Planner Agent", "role": "planner", "desc": "Break goals into steps", "model": "gpt-4o"},
    {"name": "Executor Agent", "role": "executor", "desc": "Executes standard tasks", "model": "gpt-4o"},
    {"name": "Validator Agent", "role": "validator", "desc": "Checks output quality", "model": "gpt-4o"},
    {"name": "Retry Agent", "role": "retry", "desc": "Handles failures and retries", "model": "gpt-4o"},
    {"name": "Goal Agent", "role": "goal", "desc": "Manages full goal execution", "model": "gpt-4o"},
    
    # Intelligence
    {"name": "Memory Agent", "role": "memory", "desc": "Stores & retrieves past context", "model": "gpt-4o"},
    {"name": "Learning Agent", "role": "learning", "desc": "Improves performance over time", "model": "gpt-4o"},
    {"name": "Decision Agent", "role": "decision", "desc": "Chooses best strategy/model", "model": "gpt-4o"},
    {"name": "Optimization Agent", "role": "optimizer", "desc": "Optimizes cost & speed", "model": "gpt-4o"},
    {"name": "Prediction Agent", "role": "predictor", "desc": "Predicts failures or load", "model": "gpt-4o"},
    
    # DevOps
    {"name": "Deployment Agent", "role": "deployment", "desc": "Deploy apps (Docker/K8s)", "model": "gpt-4o"},
    {"name": "Monitoring Agent", "role": "monitor", "desc": "Track system health", "model": "gpt-4o"},
    {"name": "Logging Agent", "role": "logger", "desc": "Collect & analyze logs", "model": "gpt-4o"},
    {"name": "Incident Agent", "role": "incident", "desc": "Detect & handle failures", "model": "gpt-4o"},
    {"name": "Scaling Agent", "role": "scaler", "desc": "Auto scale resources", "model": "gpt-4o"},
    
    # Security
    {"name": "Security Agent", "role": "security", "desc": "Detect threats", "model": "gpt-4o"},
    {"name": "Compliance Agent", "role": "compliance", "desc": "Check policy violations", "model": "gpt-4o"},
    {"name": "Access Control Agent", "role": "access", "desc": "Manage permissions", "model": "gpt-4o"},
    {"name": "Audit Agent", "role": "audit", "desc": "Track system activity", "model": "gpt-4o"},

    # Analytics
    {"name": "Analytics Agent", "role": "analytics", "desc": "Generate insights", "model": "gpt-4o"},
    {"name": "Reporting Agent", "role": "reporting", "desc": "Create reports", "model": "gpt-4o"},
    {"name": "Cost Analysis Agent", "role": "cost", "desc": "Track usage cost", "model": "gpt-4o"},
    {"name": "Performance Agent", "role": "performance", "desc": "Analyze performance", "model": "gpt-4o"},

    # Integrations
    {"name": "API Agent", "role": "api", "desc": "Call external APIs", "model": "gpt-4o"},
    {"name": "Webhook Agent", "role": "webhook", "desc": "Trigger events based on webhooks", "model": "gpt-4o"},
    {"name": "GitHub Agent", "role": "github", "desc": "Manage repositories and PRs", "model": "gpt-4o"},
    {"name": "Slack Agent", "role": "slack", "desc": "Send Slack notifications", "model": "gpt-4o"},

    # Multi-Agent Coordination
    {"name": "Delegation Agent", "role": "delegation", "desc": "Assign tasks to other agents", "model": "gpt-4o"},
    {"name": "Collaboration Agent", "role": "collaborator", "desc": "Coordinate multiple agents", "model": "gpt-4o"},
    {"name": "Supervisor Agent", "role": "supervisor", "desc": "Monitor all system agents", "model": "gpt-4o"},

    # AI Special
    {"name": "Copilot Agent", "role": "copilot", "desc": "Chat-based intelligent assistant", "model": "gpt-4o"},
    {"name": "Root Cause Agent", "role": "rca", "desc": "Explain deep system failures", "model": "gpt-4o"},
    {"name": "Prompt Engineer Agent", "role": "prompt", "desc": "Improve prompts automatically", "model": "gpt-4o"},
    {"name": "RAG Agent", "role": "rag", "desc": "Search and query knowledge base", "model": "gpt-4o"},
    {"name": "Experiment Agent", "role": "experimenter", "desc": "Compare models and prompts", "model": "gpt-4o"},

    # Automation
    {"name": "Scheduler Agent", "role": "scheduler", "desc": "Run tasks on cron", "model": "gpt-4o"},
    {"name": "Event Agent", "role": "event", "desc": "Trigger executions from system events", "model": "gpt-4o"},
    {"name": "Workflow Agent", "role": "workflow", "desc": "Execute structured workflow definitions", "model": "gpt-4o"},

    # Startup Level
    {"name": "Self-Healing Agent", "role": "healer", "desc": "Auto fix system states", "model": "gpt-4o"},
    {"name": "Autonomous Agent", "role": "autonomous", "desc": "Run system completely isolated without input", "model": "gpt-4o"},
    {"name": "Strategy Agent", "role": "strategy", "desc": "Plan long-term execution", "model": "gpt-4o"},
    {"name": "Resource Manager Agent", "role": "resource", "desc": "Optimize infra usage", "model": "gpt-4o"},
]

async def seed():
    async with AsyncSessionLocal() as session:
        # Get first user to act as owner
        from sqlalchemy import select
        res = await session.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        
        user_id = user.user_id if user else "system_default"
        
        # Check existing
        existing_res = await session.execute(select(Agent.name))
        existing_names = set(row[0] for row in existing_res.all())
        
        added = 0
        for data in AGENT_ROSTER:
            if data['name'] not in existing_names:
                new_agent = Agent(
                    agent_id=str(uuid.uuid4()),
                    name=data['name'],
                    role=data['role'],
                    description=data['desc'],
                    owner_id=user_id,
                    model_name=data['model']
                )
                session.add(new_agent)
                added += 1
                
        if added > 0:
            await session.commit()
            print(f"Successfully added {added} agents to the registry.")
        else:
            print("All agents already exist.")

if __name__ == "__main__":
    asyncio.run(seed())
