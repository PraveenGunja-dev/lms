from django.apps import AppConfig


class DmsModuleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dms_module'

    # def ready(self):
    #     import dms_module.signals