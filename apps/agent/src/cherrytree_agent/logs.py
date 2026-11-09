"""Structured logs for Cloud Logging: one JSON object per line on stdout, with `severity`.

Fields passed in `extra` (such as `event`, which the log-based alerts filter on) become top-level
fields of the entry.
"""

import json
import logging
import sys

_STANDARD_ATTRIBUTES = set(vars(logging.makeLogRecord({}))) | {"message", "asctime"}


class CloudLoggingFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, object] = {
            "severity": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        entry |= {k: v for k, v in vars(record).items() if k not in _STANDARD_ATTRIBUTES}
        if record.exc_info:
            entry["stack_trace"] = self.formatException(record.exc_info)
        return json.dumps(entry, default=str)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(CloudLoggingFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)
