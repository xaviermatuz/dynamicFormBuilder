import os
from dotenv import load_dotenv
# Serializers for the API
from rest_framework import serializers
# Serializers for user registration, form blueprints, and form submissions
from django.contrib.auth.models import User, Group
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
# Serializers for form blueprints, andform submissions
from .models import FormDefinition, FormField, FormSubmission
# Auth Serializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

load_dotenv() # This loads the variables from .env into os.environ

# User Registration Serializer
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[] if os.getenv('DEBUG', '0') == '1' else [validate_password]
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
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", "")
        )
        user.set_password(validated_data["password"])
        
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

# Custom JWT Serializer to include user roles
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # roles = list(self.user.groups.values_list("name", flat=True))
        data["user_id"] = self.user.id
        data["username"] = self.user.username
        data["roles"] = self.user.groups.values_list("name", flat=True)
        data["last_login"] = self.user.last_login
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
        fields = ["id", "name", "description", "fields", "created_at", "created_by"]

    def create(self, validated_data):
        fields_data = validated_data.pop("fields", [])
        validated_data["created_by"] = self.context["request"].user  # <- ensure created_by comes from request
        form = FormDefinition.objects.create(**validated_data)

        for field_data in fields_data:
            FormField.objects.create(form=form, **field_data)

        return form


    def update(self, instance, validated_data):
        fields_data = validated_data.pop("fields", [])
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.save()

        # Replace old fields with new
        instance.fields.all().delete()
        for field_data in fields_data:
            FormField.objects.create(form=instance, **field_data)

        return instance

    def to_representation(self, instance):
        """
        Customize the output of the serializer:
        - Send username instead of ID if `use_username` is True in context.
        """
        representation = super().to_representation(instance)
        use_username = self.context.get("use_username", True)
        
        if use_username:
            representation["created_by"] = instance.created_by.username
        # Otherwise, keep it as the ID
        return representation

class FormSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormSubmission
        fields = ["id", "form", "submitted_by", "data", "submitted_at"]
        read_only_fields = ["submitted_by", "submitted_at"]
        submitted_by = serializers.ReadOnlyField(source="submitted_by.username")

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
        validated_data["submitted_by"] = self.context["request"].user
        return super().create(validated_data)