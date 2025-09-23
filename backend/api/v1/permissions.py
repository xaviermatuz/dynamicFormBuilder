from rest_framework.permissions import BasePermission, SAFE_METHODS

class RoleBasedFormPermission(BasePermission):
    """
    - Admin: full CRUD on all forms.
    - Editor: CRUD only their own forms, read-only on Admin's.
    - Viewer: read-only everywhere.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.groups.filter(name="Admin").exists():
            return True

        if request.user.groups.filter(name="Editor").exists():
            return True

        if request.user.groups.filter(name="Viewer").exists():
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin → full access
        if user.groups.filter(name="Admin").exists():
            return True

        # Editor → CRUD own, read-only others
        if user.groups.filter(name="Editor").exists():
            if request.method in SAFE_METHODS:
                return True
            return obj.created_by == user

        # Viewer → read-only only
        if user.groups.filter(name="Viewer").exists():
            return request.method in SAFE_METHODS

        return False


class RoleBasedSubmissionPermission(BasePermission):
    """
    - Admin: full CRUD on all submissions.
    - Editor: CRUD only their own submissions, read-only on others.
    - Viewer: read-only everywhere.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.groups.filter(name="Admin").exists():
            return True

        if request.user.groups.filter(name="Editor").exists():
            # Editors can always read, can also create submissions
            return request.method in SAFE_METHODS or request.method == "POST"

        if request.user.groups.filter(name="Viewer").exists():
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin → full access
        if user.groups.filter(name="Admin").exists():
            return True

        # Editor → CRUD own submissions, read-only on others
        if user.groups.filter(name="Editor").exists():
            if request.method in SAFE_METHODS:
                return True
            return obj.submitted_by == user  # 👈 adapted

        # Viewer → read-only only
        if user.groups.filter(name="Viewer").exists():
            return request.method in SAFE_METHODS

        return False
