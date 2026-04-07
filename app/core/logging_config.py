import sys
import os
import io
import asyncio
from pathlib import Path
from loguru import logger

class DatabaseSink:
    """
    Loguru sink that writes logs to the PostgreSQL database.
    """
    def __init__(self):
        # Deferred imports to avoid circular dependencies
        from ..db.database import AsyncSessionLocal
        from ..models.system_log import SystemLog
        self.AsyncSessionLocal = AsyncSessionLocal
        self.SystemLog = SystemLog

    def __call__(self, message):
        record = message.record
        
        # Prepare log entry
        log_entry = {
            "level": record["level"].name,
            "name": record["name"],
            "function": record["function"],
            "line": record["line"],
            "message": record["message"],
            "exception": record["exception"].traceback if record["exception"] else None,
            "extra": record["extra"],
            "timestamp": record["time"].datetime.replace(tzinfo=None)
        }

        # Run async insertion
        try:
            asyncio.run(self._insert_log(log_entry))
        except Exception as e:
            # Fallback to stderr if DB logging fails to avoid losing logs
            sys.stderr.write(f"CRITICAL: Failed to write log to database: {e}\n")
            sys.stderr.write(f"Original message: {record['message']}\n")

    async def _insert_log(self, log_entry):
        async with self.AsyncSessionLocal() as session:
            try:
                new_log = self.SystemLog(**log_entry)
                session.add(new_log)
                await session.commit()
            except Exception:
                await session.rollback()
                raise

def setup_logging(log_level: str = "INFO"):
    """
    Configure application logging.
    """
    # Remove default logger
    logger.remove()
    
    # Check if we have a valid stdout
    has_stdout = sys.stdout is not None and hasattr(sys.stdout, 'write')
    has_stderr = sys.stderr is not None and hasattr(sys.stderr, 'write')
    
    if not has_stdout:
        sys.stdout = io.StringIO()
    if not has_stderr:
        sys.stderr = io.StringIO()

    # Determine if we're in production
    deployment_mode = os.getenv("DEPLOYMENT_MODE", "local")
    is_production = deployment_mode in ["cloud", "byoc", "onprem"]
    
    # Console handler
    if has_stdout:
        if not is_production:
            logger.add(
                sys.stdout,
                format=(
                    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                    "<level>{level: <8}</level> | "
                    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                    "<level>{message}</level>"
                ),
                level=log_level,
                colorize=True,
            )
        else:
            # Structured JSON logging for production
            logger.add(
                sys.stdout,
                format="{message}",
                level=log_level,
                serialize=True,
            )
    
    # Database sink (Replacement for file logging)
    try:
        logger.add(
            DatabaseSink(),
            level="INFO",
            enqueue=True, # Runs in a separate thread, safe for asyncio.run()
        )
        logger.info("Database logging sink enabled [Enterprise Migration OK]")
    except Exception as e:
        logger.error(f"Failed to initialize DatabaseSink: {e}")
    
    logger.info(f"Logging configured with level: {log_level}")
    return logger

def get_logger(name: str = None):
    if name:
        return logger.bind(name=name)
    return logger
