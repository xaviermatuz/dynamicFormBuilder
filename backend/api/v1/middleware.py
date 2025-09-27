import logging
from django.utils.deprecation import MiddlewareMixin

audit_logger = logging.getLogger("audit")

class AuditMiddleware(MiddlewareMixin):
    """
    Audit middleware that only logs critical actions:
    - POST (create)
    - PUT / PATCH (update)
    - DELETE (delete)
    Skips safe requests like GET, HEAD, OPTIONS.
    """

    CRITICAL_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    # Define which endpoints to audit (prefix match)
    AUDITED_PATHS = [
        "/api/v1/forms/",
        "/api/v1/users/",
        "/api/v1/submissions/",
        "/api/v1/auth/",
    ]

    def process_response(self, request, response):
        if (
            request.method in self.CRITICAL_METHODS
            and any(request.path.startswith(path) for path in self.AUDITED_PATHS)
        ):
            audit_logger.info(
                f"{request.method} {request.path} -> {response.status_code}",
                extra={
                    "audit": {
                        "user": request.user if request.user.is_authenticated else None,
                        "method": request.method,
                        "path": request.path,
                        "status_code": response.status_code,
                        "ip": self.get_client_ip(request),
                    }
                }
            )

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR")