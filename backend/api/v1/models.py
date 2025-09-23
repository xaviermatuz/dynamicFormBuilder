from django.db import models
from django.contrib.auth.models import User

class FormDefinition(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

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
        ('select', 'Select'),  # keeping the original select option
    ]

    form = models.ForeignKey(FormDefinition, related_name="fields", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255, blank=True)
    field_type = models.CharField(max_length=50, choices=FIELD_TYPES)
    required = models.BooleanField(default=False)
    options = models.JSONField(blank=True, null=True)  # For select dropdowns
    order = models.PositiveIntegerField(default=0)

class FormSubmission(models.Model):
    form = models.ForeignKey(FormDefinition, related_name="submissions", on_delete=models.CASCADE)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    data = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)
