# from django.db.models.signals import pre_save
# from django.dispatch import receiver
# from .models import Document, DynamicStatus

# @receiver(pre_save, sender=Document)
# def set_document_status(sender, instance, **kwargs):
#     """
#     Automatically set the document_current_status to status ID 10
#     if effective_date is equal to or greater than revision_date.
#     """
#     print(f"Effective Date: {instance.effective_date}")
#     print(f"Revision Date: {instance.revision_date}")

#     if instance.effective_date and (
#         not instance.revision_date or instance.effective_date >= instance.revision_date
#     ):
#         try:
#             # Fetch DynamicStatus with ID 10
#             status_10 = DynamicStatus.objects.get(id=10)
#             instance.document_current_status = status_10
#         except DynamicStatus.DoesNotExist:
#             raise ValueError("DynamicStatus with ID 10 does not exist")
