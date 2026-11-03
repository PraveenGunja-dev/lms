import time
from django.core.management.base import BaseCommand
from dms_module.models import Document, DynamicStatus

class Command(BaseCommand):
    help = 'Check if revision_date is lesser than or equal to effective_date for all documents and update document_current_status to 10 if the condition is met.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Document revision check and update service started...\n")
        
        while True:
            documents = Document.objects.filter(revision_date__isnull=False, effective_date__isnull=False)

            for document in documents:
                if document.revision_date <= document.effective_date:
                    status_10, created = DynamicStatus.objects.get_or_create(id=10)

                    if document.document_current_status != status_10:
                        document.document_current_status = status_10
                        document.save(update_fields=['document_current_status'])
                        self.stdout.write(
                            f"Document '{document.document_title}' updated: document_current_status set to 10.\n"
                        )
                else:
                    self.stdout.write(
                        f"Document '{document.document_title}' does not meet the condition: revision_date > effective_date.\n"
                    )
            
            self.stdout.write("Waiting for the next check...\n")
            time.sleep(60)
