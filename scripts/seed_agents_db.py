import asyncio
import json
import uuid
import os
import sys

# Add project root to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import AsyncSessionLocal
from app.models.agent import Agent
from app.models.user import User
from sqlalchemy.future import select

# List of 44 Agents Provide by the USER (Truncated for demonstration to the 15 provided)
agents_data = [
    {
        "name": "Startup Co-Founder AI",
        "description": "Helps brainstorm business models, validate ideas, and plan go-to-market strategies.",
        "role": "Strategy",
        "model_name": "gpt-4o",
        "temperature": 0.7,
        "system_prompt": "You are a Startup Co-Founder AI..."
    },
    {
        "name": "Full-Stack Developer AI",
        "description": "Writes, reviews, and debugs code across multiple frameworks (React, Python, Node.js).",
        "role": "Developer",
        "model_name": "gpt-4o",
        "temperature": 0.2,
        "system_prompt": "You are an expert Full-Stack Developer AI..."
    },
    {
        "name": "Data Scientist & Analyst AI",
        "description": "Analyzes datasets, creates python scripts for visualization, and tests hypotheses.",
        "role": "Analyst",
        "model_name": "gpt-4o",
        "temperature": 0.2,
        "system_prompt": "You are a Data Scientist AI..."
    },
    {
        "name": "Digital Marketing Manager AI",
        "description": "Creates comprehensive marketing campaigns, ad copy, and tracks conversion metrics.",
        "role": "Marketing",
        "model_name": "gpt-4o",
        "temperature": 0.8,
        "system_prompt": "You are a Digital Marketing Manager AI..."
    },
    {
        "name": "SEO Copywriter AI",
        "description": "Writes perfectly optimized blog posts, landing pages, and long-form content.",
        "role": "Writer",
        "model_name": "gpt-4o",
        "temperature": 0.7,
        "system_prompt": "You are an SEO Copywriter AI..."
    },
    {
        "name": "HR & Recruitment AI",
        "description": "Drafts job descriptions, screens resumes, and creates interview questions.",
        "role": "HR",
        "model_name": "gpt-4o",
        "temperature": 0.5,
        "system_prompt": "You are an HR & Recruitment AI..."
    },
    {
        "name": "Financial Controller AI",
        "description": "Builds financial models, tracks SaaS metrics, and predicts runway.",
        "role": "Finance",
        "model_name": "gpt-4o",
        "temperature": 0.1,
        "system_prompt": "You are a Financial Controller AI..."
    },
    {
        "name": "Sales & Lead Gen AI",
        "description": "Writes personalized cold outreach emails and LinkedIn connection requests.",
        "role": "Sales",
        "model_name": "gpt-4o",
        "temperature": 0.7,
        "system_prompt": "You are a Sales & Lead Gen AI..."
    },
    {
        "name": "Product Manager AI",
        "description": "Writes PRDs, user stories, and prioritizes feature backlogs.",
        "role": "Product",
        "model_name": "gpt-4o",
        "temperature": 0.6,
        "system_prompt": "You are a Product Manager AI..."
    },
    {
        "name": "UI/UX Designer AI",
        "description": "Creates component structures, color palettes, and wireframe descriptions.",
        "role": "Design",
        "model_name": "gpt-4o",
        "temperature": 0.8,
        "system_prompt": "You are a UI/UX Designer AI..."
    },
    {
        "name": "Customer Support AI",
        "description": "Handles tier 1 support tickets with empathy and clear resolution steps.",
        "role": "Support",
        "model_name": "gpt-4o",
        "temperature": 0.4,
        "system_prompt": "You are a Customer Support AI..."
    },
    {
        "name": "Security Auditor AI",
        "description": "Reviews code and architecture for OWASP top 10 vulnerabilities.",
        "role": "Security",
        "model_name": "gpt-4o",
        "temperature": 0.1,
        "system_prompt": "You are a Security Auditor AI..."
    },
    {
        "name": "DevOps Engineer AI",
        "description": "Designs CI/CD pipelines, Dockerfiles, and Terraform infrastructure.",
        "role": "DevOps",
        "model_name": "gpt-4o",
        "temperature": 0.2,
        "system_prompt": "You are a DevOps Engineer AI..."
    },
    {
        "name": "Legal Coordinator AI",
        "description": "Drafts standard NDAs, TS, and reviews compliance checklists.",
        "role": "Legal",
        "model_name": "gpt-4o",
        "temperature": 0.1,
        "system_prompt": "You are a Legal Coordinator AI..."
    },
    {
        "name": "Scrum Master AI",
        "description": "Facilitates sprint planning, retrospectives, and unblocks clearly.",
        "role": "Agile",
        "model_name": "gpt-4o",
        "temperature": 0.5,
        "system_prompt": "You are a Scrum Master AI..."
    }
]

async def seed_database():
    print("Starting database seed...")
    async with AsyncSessionLocal() as db:
        # Create an admin user if not exists to own the agents
        admin_stmt = select(User).where(User.email == 'admin@example.com')
        admin_result = await db.execute(admin_stmt)
        admin = admin_result.scalars().first()
        
        if not admin:
            print("Creating default admin user...")
            admin = User(
                user_id=str(uuid.uuid4()),
                email='admin@example.com',
                name='Admin User',
                hashed_password='seeder_password_hash',
                is_superuser=True
            )
            db.add(admin)
            await db.commit()
            
        success_count = 0
        for data in agents_data:
            stmt = select(Agent).where(Agent.name == data["name"])
            result = await db.execute(stmt)
            if not result.scalars().first():
                agent = Agent(
                    agent_id=str(uuid.uuid4()),
                    name=data["name"],
                    description=data["description"],
                    role=data["role"],
                    owner_id=admin.user_id,
                    model_name=data["model_name"],
                    personality_config=json.dumps({
                        "system_prompt": data["system_prompt"],
                        "temperature": data["temperature"]
                    })
                )
                db.add(agent)
                success_count += 1
                print(f"Added agent: {data['name']}")
            else:
                print(f"Skipped agent: {data['name']} (Already exists)")
                
        await db.commit()
        print(f"Database seed complete! Added {success_count} agents.")

if __name__ == "__main__":
    asyncio.run(seed_database())
