import logging
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LOG_FILE = BASE_DIR / "app.log"

def setup_logging():
    # Create a custom logger
    logger = logging.getLogger("fake_review_detection")
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers if re-initialized
    if logger.handlers:
        return logger

    # Create formatters
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # File Handler
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # Add handlers to the logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    # Configure root logger to output uvicorn/fastapi logs to our app.log as well
    logging.getLogger("uvicorn.error").addHandler(file_handler)
    logging.getLogger("uvicorn.access").addHandler(file_handler)

    logger.info("Logging subsystem initialized. Log file path: %s", LOG_FILE)
    return logger

# Get logger instance
logger = setup_logging()
