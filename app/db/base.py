from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import models so they are registered with Base in alembic/env.py OR where explicitly needed.
