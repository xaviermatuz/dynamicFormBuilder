from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.core.management import call_command

@receiver(post_migrate)
def create_roles_after_migrate(sender, **kwargs):
    """
    Auto-run the create_roles command after every migrate.
    """
    # Only run for your API app migrations (avoid running for every contrib app)
    if sender.name == "api.v1":
        call_command("create_roles", "--api-version", "v1")
