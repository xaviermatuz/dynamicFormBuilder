import logging

class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        from .models import LogEntry  # Import here to avoid circular imports
        try:
            LogEntry.objects.create(
                level=record.levelname,
                message=self.format(record),
                logger_name=record.name,
            )
        except Exception:
            # Avoid breaking app if logging fails
            pass