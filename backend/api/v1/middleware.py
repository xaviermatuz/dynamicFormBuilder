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
        """
        Extract the client IP address from request headers.
        Strips any port information and handles both IPv4 and IPv6.
        """
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            # X-Forwarded-For can be a comma-separated list; take the first one
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "")

        # Handle IPv4 with port (e.g. "190.143.254.74:55718")
        if ip.count(":") == 1 and "." in ip:
            ip = ip.split(":")[0]

        # Handle IPv6 with port (e.g. "[2001:db8::1]:55718")
        if ip.startswith("[") and "]" in ip:
            ip = ip.split("]")[0].lstrip("[")

        return ip