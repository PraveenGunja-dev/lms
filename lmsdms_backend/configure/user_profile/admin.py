from django.contrib import admin
from user_profile.models import *

admin.site.register(CustomUser)
admin.site.register(EmailTemplate)
admin.site.register(Department)
admin.site.register(Reminder)
admin.site.register(ReminderAfterNoACtionTaken)


