from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(DynamicStatus)
admin.site.register(DocumentSendBackAction)
admin.site.register(Document)
admin.site.register(DocumentApproverAction)
admin.site.register(DocumentType)
admin.site.register(PrintRequest)
admin.site.register(Archived)
admin.site.register(TemplateModel)
admin.site.register(WorkFlowModel)
