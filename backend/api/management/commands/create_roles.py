# from django.core.management.base import BaseCommand
# from django.contrib.auth.models import Group, Permission, ContentType
# from django.apps import apps

# class Command(BaseCommand):
#     help = "Create default roles and assign permissions for forms and submissions"

#     def handle(self, *args, **kwargs):

#         def assign_permissions(group, model, perm_codenames):
#             """
#             Assigns a list of permission codenames to a group for a given model.
#             """
#             ct = ContentType.objects.get_for_model(model)
#             perms = Permission.objects.filter(content_type=ct, codename__in=perm_codenames)
#             for perm in perms:
#                 group.permissions.add(perm)

#         # -----------------
#         # Admin group
#         # -----------------
#         admin_group, _ = Group.objects.get_or_create(name="Admin")
#         admin_group.permissions.set(Permission.objects.all())

#         # -----------------
#         # Editor group
#         # -----------------
#         editor_group, _ = Group.objects.get_or_create(name="Editor")
#         FormDefinition = apps.get_model("api", "FormDefinition")  # adjust app name
#         FormSubmission = apps.get_model("api", "FormSubmission")  # adjust app name

#         editor_perms = {
#             FormDefinition: ["add_formdefinition", "change_formdefinition", "delete_formdefinition", "view_formdefinition"],
#             FormSubmission: ["add_formsubmission", "change_formsubmission", "delete_formsubmission", "view_formsubmission"],
#         }

#         for model, codenames in editor_perms.items():
#             assign_permissions(editor_group, model, codenames)

#         # -----------------
#         # Viewer group
#         # -----------------
#         viewer_group, _ = Group.objects.get_or_create(name="Viewer")
#         viewer_perms = {
#             FormDefinition: ["view_formdefinition"],
#             FormSubmission: ["view_formsubmission"],
#         }

#         for model, codenames in viewer_perms.items():
#             assign_permissions(viewer_group, model, codenames)

#         self.stdout.write(self.style.SUCCESS("Roles and permissions created successfully."))

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
        def assign_permissions(group, model, perm_codenames):
            ct = ContentType.objects.get_for_model(model)
            perms = Permission.objects.filter(content_type=ct, codename__in=perm_codenames)
            for perm in perms:
                group.permissions.add(perm)

        # Models dynamically loaded based on version api for single app and version control on folder for different apps use api.{version}
        FormDefinition = apps.get_model(f"api", "FormDefinition")
        FormSubmission = apps.get_model(f"api", "FormSubmission")

        # --- Admin group ---
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        admin_group.permissions.set(Permission.objects.all())

        # --- Editor group ---
        editor_group, _ = Group.objects.get_or_create(name="Editor")
        editor_perms = {
            FormDefinition: ["add_formdefinition", "change_formdefinition", "delete_formdefinition", "view_formdefinition"],
            FormSubmission: ["add_formsubmission", "change_formsubmission", "delete_formsubmission", "view_formsubmission"],
        }
        for model, codenames in editor_perms.items():
            assign_permissions(editor_group, model, codenames)

        # --- Viewer group ---
        viewer_group, _ = Group.objects.get_or_create(name="Viewer")
        viewer_perms = {
            FormDefinition: ["view_formdefinition"],
            FormSubmission: ["view_formsubmission"],
        }
        for model, codenames in viewer_perms.items():
            assign_permissions(viewer_group, model, codenames)

        self.stdout.write(self.style.SUCCESS(f"Roles and permissions created successfully for version {version}"))
