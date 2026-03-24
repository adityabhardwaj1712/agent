import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine

async def test_connection():
    db_url = os.getenv("DATABASE_URL")
    print(f"Testing connection to: {db_url}")
    try:
        engine = create_async_engine(db_url)
        async with engine.connect() as conn:
            print("SUCCESS: Connected to database using asyncpg.")
    except Exception as e:
        print(f"FAILURE: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
