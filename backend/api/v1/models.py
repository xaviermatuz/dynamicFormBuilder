from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class AuditLog(models.Model):
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    method = models.CharField(max_length=10)       # GET, POST, etc.
    path = models.CharField(max_length=255)        # /api/v1/forms/
    status_code = models.IntegerField()
    message = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
class LogEntry(models.Model):
    level = models.CharField(max_length=50)
    message = models.TextField()
    logger_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.level}] {self.logger_name}: {self.message[:50]}"


class FormDefinition(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "version"],
                name="unique_form_name_version"
            )
        ]

    def __str__(self):
        return f"{self.name} v{self.version} ({'deleted' if self.is_deleted else 'active'})"


class FormField(models.Model):
    FIELD_TYPES = [
        ('button', 'Button'),
        ('checkbox', 'Checkbox'),
        ('color', 'Color'),
        ('date', 'Date'),
        ('datetime-local', 'Datetime Local'),
        ('email', 'Email'),
        ('file', 'File'),
        ('hidden', 'Hidden'),
        ('image', 'Image'),
        ('month', 'Month'),
        ('number', 'Number'),
        ('password', 'Password'),
        ('radio', 'Radio'),
        ('range', 'Range'),
        ('reset', 'Reset'),
        ('search', 'Search'),
        ('submit', 'Submit'),
        ('tel', 'Telephone'),
        ('text', 'Text'),
        ('textarea', 'Textarea'),
        ('time', 'Time'),
        ('url', 'URL'),
        ('week', 'Week'),
        ('select', 'Select'),
    ]

    form = models.ForeignKey(FormDefinition, related_name="fields", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255, blank=True)
    field_type = models.CharField(max_length=50, choices=FIELD_TYPES)
    required = models.BooleanField(default=False)
    options = models.JSONField(blank=True, null=True)  # For select dropdowns
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)  # optional audit
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(
                fields=["form", "name"],
                name="unique_form_field_name"
            )
        ]

    def clean(self):
        """Ensure select fields have options."""
        if self.field_type == "select" and not self.options:
            raise ValidationError("Select fields must have options.")

    def __str__(self):
        return f"{self.label or self.name} ({self.field_type})"


class FormSubmission(models.Model):
    form = models.ForeignKey(FormDefinition, related_name="submissions", on_delete=models.CASCADE)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    data = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    form_version = models.IntegerField()

    class Meta:
        ordering = ["-submitted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["form", "submitted_by", "form_version"],
                name="unique_submission_per_user_per_version"
            )
        ]

    def save(self, *args, **kwargs):
        # Auto-fill form_version if not set
        if self.form and not self.form_version:
            self.form_version = self.form.version
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Submission for {self.form.name} v{self.form_version} by {self.submitted_by or 'Anonymous'}"
