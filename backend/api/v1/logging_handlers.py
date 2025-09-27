import logging

class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        from .models import LogEntry, AuditLog
        try:
            if hasattr(record, "audit"):
                audit = record.audit
                AuditLog.objects.create(
                    user_id=getattr(audit.get("user"), "id", None),   # FK safe lookup
                    method=audit.get("method"),
                    path=audit.get("path"),
                    status_code=audit.get("status_code"),
                    message=self.format(record),  # also fill the `message` field
                    ip_address=audit.get("ip"),
                )
            else:
                LogEntry.objects.create(
                    level=record.levelname,
                    message=self.format(record),
                    logger_name=record.name,
                )
        except Exception as e:
            # Optional: print/log to console to debug
            print(f"[DatabaseLogHandler ERROR] {e}")
            pass