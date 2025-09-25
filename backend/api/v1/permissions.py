from rest_framework.permissions import BasePermission, SAFE_METHODS


from rest_framework.permissions import BasePermission, SAFE_METHODS

class RoleBasedFormPermission(BasePermission):
    """
    Permissions for managing form definitions (schemas).

    - Admin: full CRUD on all forms.
    - Editor: full CRUD except DELETE (solo puede eliminar sus propios formularios).
    - Viewer: read-only everywhere.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.groups.filter(name="Admin").exists():
            return True

        if request.user.groups.filter(name="Editor").exists():
            # Editors: all except DELETE (object-level)
            return True

        if request.user.groups.filter(name="Viewer").exists():
            # Viewers can only read
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.groups.filter(name="Admin").exists():
            return True

        if user.groups.filter(name="Editor").exists():
            if request.method == "DELETE":
                # Solo puede eliminar sus propios formularios
                return obj.created_by_id == user.id
            # Puede hacer cualquier otra acción sobre cualquier formulario
            return True

        if user.groups.filter(name="Viewer").exists():
            return request.method in SAFE_METHODS

        return False



class RoleBasedSubmissionPermission(BasePermission):
    """
    Permissions for managing form submissions.

    - Admin: full CRUD on all submissions.
    - Editor: CRUD only their own submissions, read-only on others.
    - Viewer: read-only on existing submissions, but can create new ones (POST).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.groups.filter(name="Admin").exists():
            return True

        if request.user.groups.filter(name="Editor").exists():
            return request.method in SAFE_METHODS or request.method == "POST"

        if request.user.groups.filter(name="Viewer").exists():
            return request.method in SAFE_METHODS or request.method == "POST"

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.groups.filter(name="Admin").exists():
            return True

        if user.groups.filter(name="Editor").exists():
            if request.method in SAFE_METHODS:
                return True
            return obj.submitted_by == user

        if user.groups.filter(name="Viewer").exists():
            return request.method in SAFE_METHODS

        return False


class RoleBasedUserPermission(BasePermission):
    """
    Permissions for managing system users.

    - Admin: full CRUD on all users.
    - Editor: no access.
    - Viewer: no access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Only Admins can access user endpoints at all
        return request.user.groups.filter(name="Admin").exists()

    def has_object_permission(self, request, view, obj):
        # Only Admins can manipulate user objects
        return request.user.groups.filter(name="Admin").exists()
