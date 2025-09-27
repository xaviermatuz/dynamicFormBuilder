import os
from dotenv import load_dotenv
from rest_framework import serializers
# Serializers for user registration, form blueprints, and form submissions
from django.contrib.auth.models import User, update_last_login
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
# Models
from .models import FormDefinition, FormField, FormSubmission, LogEntry, AuditLog
from .services import RoleService, FormService, FormValidator
# Auth Serializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

load_dotenv() # This loads the variables from .env into os.environ

# ==========================
# CUSTOM SERVICE
# ==========================

class PasswordPolicy:
    """Service for enforcing password rules."""

    @staticmethod
    def get_validators():
        debug_mode = os.getenv("DEBUG", "True").lower() in ["true", "1"]
        return [] if debug_mode else [validate_password]

# ==========================
# AUDIT SERIALIZERS
# ==========================

class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # show username instead of ID

    class Meta:
        model = AuditLog
        fields = ["id", "user", "method", "path", "status_code", "message", "ip_address", "created_at"]

        def get_user(self, obj):
            return obj.user.username if obj.user else "Anonymous"

class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = "__all__"

# ==========================
# USER SERIALIZERS
# ==========================

class UserBasicSerializer(serializers.ModelSerializer):
    """Basic serializer for User (no role)."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "last_login"]

class UserWithRoleSerializer(UserBasicSerializer):
    """Extended serializer for User (includes role)."""

    role = serializers.SerializerMethodField()

    class Meta(UserBasicSerializer.Meta):
        fields = UserBasicSerializer.Meta.fields + ["role"]

    def get_role(self, obj):
        return RoleService.get_user_role(obj)
    
# ==========================
# REGISTRATION SERIALIZERS
# ==========================

class BaseRegisterSerializer(serializers.ModelSerializer):
    """Base serializer for registering a new user (shared logic)."""

    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Username already exists")]
    )
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Email already exists")]
    )
    password = serializers.CharField(write_only=True, required=True, validators=PasswordPolicy.get_validators())
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "first_name", "last_name")

    def validate(self, attrs):
        attrs["username"] = attrs["username"].lower()
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return attrs

    def create_user(self, validated_data):
        """Helper for creating the base User object."""
        validated_data.pop("password2")
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", "")
        )
        user.set_password(validated_data["password"])
        user.save()
        return user

class SelfRegisterSerializer(BaseRegisterSerializer):
    """Registration for self-service users (always Viewer)."""

    def create(self, validated_data):
        user = self.create_user(validated_data)
        RoleService.assign_role(user, "Viewer")
        return user

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["role"] = "Viewer"
        return rep

class AdminRegisterSerializer(BaseRegisterSerializer):
    """Registration for admin panel (allows role choice)."""

    role = serializers.ChoiceField(choices=["Admin", "Editor", "Viewer"], default="Viewer")

    class Meta(BaseRegisterSerializer.Meta):
        fields = BaseRegisterSerializer.Meta.fields + ("role",)

    def create(self, validated_data):
        role = validated_data.pop("role", "Viewer")
        user = self.create_user(validated_data)
        RoleService.assign_role(user, role)
        return user

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["role"] = RoleService.get_user_role(instance)
        return rep

# ==========================
# USER UPDATE SERIALIZERS
# ==========================

class UserUpdateSerializer(serializers.ModelSerializer):
    """Update user info, delegate role logic to RoleService."""
    role = serializers.ChoiceField(choices=["Admin", "Editor", "Viewer"], required=False)

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "role", "is_active")
        extra_kwargs = {"username": {"required": True}, "email": {"required": True}}

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)

        # Update normal fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Delegate role assignment to RoleService
        if role:
            RoleService.assign_role(instance, role)
        else:
            instance.save()

        return instance
    
class PasswordChangeSerializer(serializers.Serializer):
    """Update user password from admin panel."""
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return attrs

    def save(self, **kwargs):
        user = self.context["user"]
        password = self.validated_data["password"]
        user.set_password(password)
        user.save()
        return user

class SelfPasswordChangeSerializer(serializers.Serializer):
    """Update current user password from profile."""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    new_password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Passwords must match."})
        return attrs

    def save(self, **kwargs):
        user = self.context["user"]

        # Check old password
        if not user.check_password(self.validated_data["old_password"]):
            raise serializers.ValidationError({"old_password": "Old password is incorrect."})

        # Set new password
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer base on TokenObtainPairSerializer from JWT to include user roles."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom claims
        token["username"] = user.username
        token["roles"] = list(user.groups.values_list("name", flat=True))
        token["last_login"] = str(user.last_login) if user.last_login else None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        update_last_login(None, self.user)
        data["last_login"] = str(self.user.last_login) if self.user.last_login else None
        return data

# ==========================
# FORM SERIALIZERS
# ==========================

class FormFieldSerializer(serializers.ModelSerializer):
    """Basic serializer for fields."""
    class Meta:
        model = FormField
        fields = ["id", "name", "label", "field_type", "required", "options", "order"]

class FormDefinitionSerializer(serializers.ModelSerializer):
    """Serializer delegates versioning logic to FormService."""
    fields = FormFieldSerializer(many=True)
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = FormDefinition
        fields = ["id", "name", "description", "fields", "created_at", "created_by", "is_deleted", "version"]

    def create(self, validated_data):
        fields_data = validated_data.pop("fields", [])
        validated_data["created_by"] = self.context["request"].user
        form = FormDefinition.objects.create(**validated_data)

        for field_data in fields_data:
            FormField.objects.create(form=form, **field_data)
        return form

    def update(self, instance, validated_data):
        # Delegate to service
        return FormService.update_form(instance, validated_data)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if self.context.get("use_username", True):
            rep["created_by"] = instance.created_by.username
        return rep

class FormSubmissionSerializer(serializers.ModelSerializer):
    submitted_by = serializers.ReadOnlyField(source="submitted_by.username")
    form_name = serializers.ReadOnlyField(source="form.name")
    form_fields  = serializers.SerializerMethodField()

    class Meta:
        model = FormSubmission
        fields = ["id", "form", "form_name", "form_version", "submitted_by", "data", "submitted_at", "form_fields"]
        read_only_fields = ["submitted_by", "submitted_at", "form_version"]

    def get_form_fields(self, obj):
        return FormFieldSerializer(obj.form.fields.all().order_by("order"), many=True).data

    def validate(self, attrs):
        form = attrs["form"]
        submission_data = attrs.get("data", {})
        user = attrs.get("submitted_by") or self.context["request"].user
        version = attrs.get("form_version") or form.version

        if user and FormSubmission.objects.filter(
            form=form, submitted_by=user, form_version=version
        ).exists():
            raise serializers.ValidationError(
                {"non_field_errors": ["You have already submitted this form version."]}
            )
        # Delegate validation to service
        FormValidator.validate_submission(form, submission_data)
        return attrs

    def create(self, validated_data):
        validated_data["submitted_by"] = self.context["request"].user
        validated_data["form_version"] = validated_data["form"].version
        return super().create(validated_data)