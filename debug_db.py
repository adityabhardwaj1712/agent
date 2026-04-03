import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.db.session import engine
    from sqlalchemy import text
except ImportError as e:
    print(f"ImportError: {e}")
    sys.exit(1)

async def check_db():
    async with engine.connect() as conn:
        # Check current database
        db_res = await conn.execute(text("SELECT current_database();"))
        db_name = db_res.scalar()
        print(f"DATABASE: {db_name}")
        
        # Check search path
        path_res = await conn.execute(text("SHOW search_path;"))
        print(f"SEARCH_PATH: {path_res.scalar()}")
        
        # Check columns in audit_logs
        col_res = await conn.execute(text("SELECT column_name, table_schema FROM information_schema.columns WHERE table_name = 'audit_logs' ORDER BY table_schema;"))
        rows = col_res.fetchall()
        print("TABLES FOUND:")
        for r in rows:
            print(f"  {r[1]}.audit_logs -> {r[0]}")

if __name__ == '__main__':
    asyncio.run(check_db())
