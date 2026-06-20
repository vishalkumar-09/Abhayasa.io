import logging
import sys
from app.core.settings import settings

def setup_logging() -> None:
    """Configures application-wide logging formats and handlers."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(filename)s:%(lineno)d - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True  # Resets any default handlers previously configured
    )
    
    logger = logging.getLogger("app")
    logger.info("Application logging initialized. Log level: %s", settings.LOG_LEVEL)
