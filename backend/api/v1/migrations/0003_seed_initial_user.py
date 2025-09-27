import os
from django.db import migrations
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Permission
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env into os.environ

def seed_groups_and_admin(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Group = apps.get_model("auth", "Group")

    # Ensure base groups exist
    admin_group, _ = Group.objects.get_or_create(name="Admin")
    editor_group, _ = Group.objects.get_or_create(name="Editor")
    viewer_group, _ = Group.objects.get_or_create(name="Viewer")

    # Assign ALL permissions to the Admin group
    all_perms = Permission.objects.all()
    admin_group.permissions.set(all_perms)

    if not User.objects.filter(username="admin").exists():
        user = User.objects.create(
            username="admin",
            email="admin@example.com",
            first_name="System",
            last_name="Admin",
            password=make_password(os.environ.get("DJANGO_ADMIN_PASSWORD", "admin123")),
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )
        
        user.groups.add(admin_group)

def unseed_admin(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Group = apps.get_model("auth", "Group")


    # Clean up admin user and groups (safe rollback)
    User.objects.filter(username="admin").delete()
    Group.objects.filter(name__in=["Admin", "Editor", "Viewer"]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("v1", "0002_auditlog"),  # keep your dependency chain
    ]

    operations = [
        migrations.RunPython(seed_groups_and_admin, unseed_admin),
    ]
