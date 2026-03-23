import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import app.models
from app.db.database import engine
from app.db.base import Base

async def main():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Success")
    except Exception as e:
        with open("err.txt", "w") as f:
            f.write(str(e))
        print("Wrote error to err.txt")

if __name__ == "__main__":
    asyncio.run(main())
