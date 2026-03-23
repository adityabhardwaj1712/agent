import asyncio
import os
import sys

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import app.models  # This imports __init__.py which imports all 21 models
from app.db.database import engine
from app.db.base import Base

async def main():
    print("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    tables = sorted(Base.metadata.tables.keys())
    print(f"\nCreated {len(tables)} tables:")
    for t in tables:
        print(f"  - {t}")

if __name__ == "__main__":
    asyncio.run(main())
