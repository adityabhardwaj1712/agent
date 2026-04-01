import sys
import os
import io
from pathlib import Path
from loguru import logger

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

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
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
    
    # File handler for all logs
    logger.add(
        log_dir / "app.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        level="DEBUG",
        rotation="50 MB",
        retention="7 days",
        compression="zip",
        enqueue=True,
    )
    
    # Separate file for errors
    logger.add(
        log_dir / "errors.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        level="ERROR",
        rotation="10 MB",
        retention="30 days",
        compression="zip",
        backtrace=True,
        diagnose=True,
        enqueue=True,
    )
    
    logger.info(f"Logging configured with level: {log_level}")
    return logger

def get_logger(name: str = None):
    if name:
        return logger.bind(name=name)
    return logger
