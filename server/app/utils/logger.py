import logging
import os

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
_root_logger = logging.getLogger("grow-with-google-team")
_root_logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

if not _root_logger.handlers:
    _formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s - %(name)s - %(message)s"
    )

    _console_handler = logging.StreamHandler()
    _console_handler.setFormatter(_formatter)
    _root_logger.addHandler(_console_handler)

    os.makedirs("logs", exist_ok=True)
    _file_handler = logging.FileHandler("logs/server.log")
    _file_handler.setFormatter(_formatter)
    _root_logger.addHandler(_file_handler)


def get_logger(name: str) -> logging.Logger:
    return _root_logger.getChild(name)


logger = get_logger("Family API")
