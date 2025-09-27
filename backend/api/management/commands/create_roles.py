from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission, ContentType
from django.apps import apps

class Command(BaseCommand):
    help = "Create default roles and assign permissions for a specific API version"

    def add_arguments(self, parser):
        parser.add_argument(
            "--api-version",
            type=str,
            choices=["v1", "v2"],
            default="v1",
            help="Specify which API version to assign roles for",
        )

    def handle(self, *args, **kwargs):
        version = kwargs["api_version"]
        self.stdout.write(f"Creating roles for API version: {version}")

        # Helper to assign permissions
        def assign_permissions(group, perms_map):
            perms = []
            for model, codenames in perms_map.items():
                ct = ContentType.objects.get_for_model(model)
                perms.extend(Permission.objects.filter(content_type=ct, codename__in=codenames))
            group.permissions.set(perms)

        # Dynamically load models (⚠️ check your app_label)
        FormDefinition = apps.get_model("v1", "FormDefinition")
        FormSubmission = apps.get_model("v1", "FormSubmission")

        # --- Admin group ---
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        admin_group.permissions.set(Permission.objects.all())

        # --- Editor group ---
        editor_group, _ = Group.objects.get_or_create(name="Editor")
        editor_perms = {
            FormDefinition: ["add_formdefinition", "change_formdefinition", "delete_formdefinition", "view_formdefinition"],
            FormSubmission: ["add_formsubmission", "change_formsubmission", "delete_formsubmission", "view_formsubmission"],
        }
        assign_permissions(editor_group, editor_perms)

        # --- Viewer group ---
        viewer_group, _ = Group.objects.get_or_create(name="Viewer")
        viewer_perms = {
            FormDefinition: ["view_formdefinition"],
            FormSubmission: ["view_formsubmission"],
        }
        assign_permissions(viewer_group, viewer_perms)

        self.stdout.write(self.style.SUCCESS(f"Roles and permissions created successfully for version {version}"))
