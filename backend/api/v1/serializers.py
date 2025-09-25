import os
from dotenv import load_dotenv
# Serializers for the API
from rest_framework import serializers
# Serializers for user registration, form blueprints, and form submissions
from django.contrib.auth.models import User, Group, update_last_login
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
# Serializers for form blueprints, andform submissions
from .models import FormDefinition, FormField, FormSubmission, LogEntry
# Auth Serializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

load_dotenv() # This loads the variables from .env into os.environ

class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = "__all__"

# User Serializer loads user info and their role on admin panel
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "is_active", "last_login"]  # Safe fields only

    def get_role(self, obj):
        # If user belongs to multiple groups, take the first one
        groups = obj.groups.values_list("name", flat=True)
        return groups[0] if groups else None
    
# User Registration Serializer
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[] if os.getenv("DEBUG", "True").lower() in ["true", "1"] else [validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(
        choices=["Admin", "Editor", "Viewer"],
        default="Viewer"
    )

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "first_name", "last_name", "role")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role", "Viewer")

        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", "")
        )

        user.set_password(validated_data["password"])
        user.save()
        
        group = Group.objects.get(name=role)
        user.groups.add(group)

        # Assign group and staff/superuser flags
        if role == "Admin":
            # group = Group.objects.get(name="Admin")
            # user.groups.add(group)
            user.is_staff = True
            user.is_superuser = True
        elif role == "Editor":
            # group = Group.objects.get(name="Editor")
            # user.groups.add(group)
            user.is_staff = True
            user.is_superuser = False
        else:  # Viewer
            # group = Group.objects.get(name="Viewer")
            # user.groups.add(group)
            user.is_staff = False
            user.is_superuser = False

        user.save()
        return user
    
    def to_representation(self, instance):
        """Customize output so 'role' is derived from the user's groups."""
        rep = super().to_representation(instance)
        groups = instance.groups.values_list("name", flat=True)
        rep["role"] = groups[0] if groups else "Viewer"
        return rep

# User Serializer update user info without password on admin panel
class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=["Admin", "Editor", "Viewer"],
        required=False
    )

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "role", "is_active")
        # username excluded (safer) but you can add it if needed
        extra_kwargs = {
            "username": {"required": True},  # ensure it's validated
            "email": {"required": True},
        }

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)

        # Update normal fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update role → group + flags
        if role:
            instance.groups.clear()
            group = Group.objects.get(name=role)
            instance.groups.add(group)

            if role == "Admin":
                instance.is_staff = True
                instance.is_superuser = True
            elif role == "Editor":
                instance.is_staff = True
                instance.is_superuser = False
            else:  # Viewer
                instance.is_staff = False
                instance.is_superuser = False

        instance.save()
        return instance

# User Serializer update only password on admin panel
class PasswordChangeSerializer(serializers.Serializer):
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

# Custom JWT Serializer to include user roles
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
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

# Serializers for Form Blueprints and Form Submissions    
class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = ["id", "name", "label", "field_type", "required", "options", "order"]

class FormDefinitionSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True)
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = FormDefinition
        fields = [
            "id",
            "name",
            "description",
            "fields",
            "created_at",
            "created_by",
            "is_deleted",
            "version",
        ]

    def create(self, validated_data):
        fields_data = validated_data.pop("fields", [])
        validated_data["created_by"] = self.context["request"].user
        form = FormDefinition.objects.create(**validated_data)

        for field_data in fields_data:
            FormField.objects.create(form=form, **field_data)

        return form

    def update(self, instance, validated_data):
        """
        - If only metadata changes -> update in place.
        - If fields are included -> create a new FormDefinition (version bump).
        """
        fields_data = validated_data.pop("fields", None)

        # Case A: metadata-only update
        if fields_data is None:
            instance.name = validated_data.get("name", instance.name)
            instance.description = validated_data.get("description", instance.description)
            instance.is_deleted = validated_data.get("is_deleted", instance.is_deleted)
            instance.save()
            return instance

        # Case B: structural change -> create new version
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

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        use_username = self.context.get("use_username", True)
        if use_username:
            rep["created_by"] = instance.created_by.username
        return rep

class FormSubmissionSerializer(serializers.ModelSerializer):
    submitted_by = serializers.ReadOnlyField(source="submitted_by.username")
    form_name = serializers.ReadOnlyField(source="form.name")
    fields = serializers.SerializerMethodField(method_name="get_fields_data")

    class Meta:
        model = FormSubmission
        fields = ["id", "form", "form_name", "form_version", "submitted_by", "data", "submitted_at", "fields"]
        read_only_fields = ["submitted_by", "submitted_at", "form_version"]

    def get_fields_data(self, obj):
        # grab fields of the related form
        return FormFieldSerializer(
            obj.form.fields.all().order_by("order"), many=True
        ).data

    def validate(self, attrs):
        form = attrs["form"]
        submission_data = attrs.get("data", {})

        for field in form.fields.all():
            value = submission_data.get(field.name)
            if field.required and value is None:
                raise serializers.ValidationError({field.name: f"{field.name} is required"})
            if value is not None:
                if field.field_type == "number" and not isinstance(value, (int, float)):
                    raise serializers.ValidationError({field.name: f"{field.name} must be a number"})
                if field.field_type == "select" and field.options and value not in field.options:
                    raise serializers.ValidationError(
                        {field.name: f"Invalid value for {field.name}. Must be one of {field.options}"}
                    )
        return attrs

    def create(self, validated_data):
        request_user = self.context["request"].user
        validated_data["submitted_by"] = request_user
        validated_data["form_version"] = validated_data["form"].version
        return super().create(validated_data)
