from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api.v1'

    def ready(self):
        # Import signals
        import api.v1.signals