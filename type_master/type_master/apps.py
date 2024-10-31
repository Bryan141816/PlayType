# apps.py
from django.apps import AppConfig

class TypeMasterConfig(AppConfig):
    name = 'type_master'

    def ready(self):
        # Import signals here to ensure they are registered once the app is ready
        from . import signals
