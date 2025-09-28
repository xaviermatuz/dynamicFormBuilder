import re
from django.contrib.auth.models import User, Group
from django.db import models
from django.db.models import OuterRef, Subquery, Q
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .models import FormDefinition, FormField, FormSubmission, AuditLog, LogEntry

# ==========================
# USER SERVICES
# ==========================

class RoleService:
    """Central service for assigning roles and updating group/staff flags to users."""

    @staticmethod
    def assign_role(user: User, role: str):
        user.groups.clear()
        group = Group.objects.get(name=role)
        user.groups.add(group)

        if role == "Admin":
            user.is_staff, user.is_superuser = True, True
        elif role == "Editor":
            user.is_staff, user.is_superuser = True, False
        else:  # Viewer
            user.is_staff, user.is_superuser = False, False

        user.save()

    @staticmethod
    def get_user_role(user: User) -> str:
        groups = user.groups.values_list("name", flat=True)
        return groups[0] if groups else "Viewer"

class UserService:
    """Business logic for user management in views."""

    @staticmethod
    def change_password(user, data):
        from .serializers import SelfPasswordChangeSerializer
        serializer = SelfPasswordChangeSerializer(data=data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Invalidate old refresh token if provided
        refresh_token = data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                return {"detail": "Password changed but refresh token invalid."}

        return {"detail": "Password changed successfully. Please log in again."}

# ==========================
# FORM SERVICES
# ==========================

class FormService:
    """Service layer for managing form definition updates & versioning."""

    @staticmethod
    def update_form(instance: FormDefinition, validated_data: dict):
        fields_data = validated_data.pop("fields", None)

        # Case A: metadata-only update
        if fields_data is None:
            instance.name = validated_data.get("name", instance.name)
            instance.description = validated_data.get("description", instance.description)
            instance.is_deleted = validated_data.get("is_deleted", instance.is_deleted)
            instance.save()
            return instance

        # Case B: structural change → create a new version
        new_form = FormDefinition.objects.create(
            name=validated_data.get("name", instance.name),
            description=validated_data.get("description", instance.description),
            created_by=instance.created_by,
            is_deleted=validated_data.get("is_deleted", instance.is_deleted),
            version=instance.version + 1,
        )

        for field_data in fields_data:
            FormField.objects.create(form=new_form, **field_data)

        return new_form

class FormDefinitionService:
    """Business logic for filtering FormDefinition querysets."""

    @staticmethod
    def filter_by_state(queryset, user, params):
        if user.groups.filter(name="Admin").exists():
            state = params.get("state")
            if state == "deleted":
                return queryset.filter(is_deleted=True)
            elif state == "active":
                return queryset.filter(is_deleted=False)
            return queryset
        return queryset.filter(is_deleted=False)

    @staticmethod
    def filter_latest_only(queryset, latest_only):
        if latest_only in ("true", "1"):
            latest_ids = FormDefinition.objects.filter(
                name=OuterRef("name")
            ).order_by("-version").values("id")[:1]
            return queryset.filter(id=Subquery(latest_ids))
        return queryset

class FormSubmissionService:
    """Business logic for handling form submissions."""

    @staticmethod
    def check_latest_version(form: FormDefinition):
        latest_version = (
            FormDefinition.objects.filter(name=form.name)
            .aggregate(max_version=models.Max("version"))
            .get("max_version", form.version)
        )
        if form.version < latest_version:
            raise serializers.ValidationError(
                {"detail": f"Form '{form.name}' is outdated. Please use version {latest_version}."}
            )

class FormValidator:
    """Service for validating form submissions against form definitions."""

    @staticmethod
    def validate_submission(form: FormDefinition, submission_data: dict):
        errors = {}

        for field in form.fields.all():
            value = submission_data.get(field.name)

            # Required field check
            if field.required and value is None:
                errors[field.name] = f"{field.name} is required"
                continue

            # Type check: number
            if value is not None and field.field_type == "number" and not isinstance(value, (int, float)):
                errors[field.name] = f"{field.name} must be a number"

            # Choice check: select
            if value is not None and field.field_type == "select" and field.options and value not in field.options:
                errors[field.name] = f"Invalid value for {field.name}. Must be one of {field.options}"

        if errors:
            raise serializers.ValidationError(errors)

# ==========================
# LOGGING SERVICES
# ==========================

class AuditLogService:
    """Service for retrieving and filtering audit logs."""

    @staticmethod
    def get_queryset(params):
        queryset = AuditLog.objects.all().order_by("-created_at")

        user = params.get("user")
        method = params.get("method")
        status_code = params.get("status_code")

        if user:
            if user.isdigit():
                queryset = queryset.filter(user=user)
            else:
                queryset = queryset.filter(
                    Q(user__username__icontains=user)
                    | Q(user__email__icontains=user)
                    | Q(user__first_name__icontains=user)
                    | Q(user__last_name__icontains=user)
                )

        if method:
            queryset = queryset.filter(method__iexact=method)
        if status_code:
            queryset = queryset.filter(status_code=status_code)

        # Global search (field:value or free text)
        search = params.get("search")
        if search:
            # advanced query syntax like user:john status:500
            field_queries = re.findall(r"(\w+):([^\s]+)", search)
            for field, value in field_queries:
                if field == "user":
                    if value.isdigit():
                        queryset = queryset.filter(user=value)
                    else:
                        queryset = queryset.filter(
                            Q(user__username__icontains=value)
                            | Q(user__email__icontains=value)
                            | Q(user__first_name__icontains=value)
                            | Q(user__last_name__icontains=value)
                        )
                elif field == "method":
                    queryset = queryset.filter(method__iexact=value)
                elif field in ["status", "status_code"]:
                    queryset = queryset.filter(status_code=value)
                elif field == "ip":
                    queryset = queryset.filter(ip_address__icontains=value)
                elif field == "path":
                    queryset = queryset.filter(path__icontains=value)
                elif field == "message":
                    queryset = queryset.filter(message__icontains=value)

                # remove processed part
                search = search.replace(f"{field}:{value}", "").strip()

            # fallback free text
            if search:
                queryset = queryset.filter(
                      Q(user__username__icontains=search)
                    | Q(user__email__icontains=search)
                    | Q(user__first_name__icontains=search)
                    | Q(user__last_name__icontains=search)
                    | Q(path__icontains=search)
                    | Q(message__icontains=search)
                    | Q(ip_address__icontains=search)
                )
                
        return queryset

class LogEntryService:
    """Service for retrieving log entries."""

    @staticmethod
    def get_queryset():
        return LogEntry.objects.all().order_by("-created_at")

# ==========================
# DASHBOARD SERVICES
# ==========================

class DashboardService:
    """Service for aggregating dashboard metrics."""

    @staticmethod
    def get_metrics():
        total_users = User.objects.count()
        total_forms = FormDefinition.objects.filter(is_deleted=False).count()
        total_submissions = FormSubmission.objects.count()

        return {
            "users": {"count": total_users, "history": [5, 10, 20, 25, 30, total_users]},
            "forms": {"count": total_forms, "history": [2, 4, 7, 8, 10, total_forms]},
            "submissions": {
                "count": total_submissions,
                "history": [10, 20, 35, 40, 50, total_submissions],
            },
        }
