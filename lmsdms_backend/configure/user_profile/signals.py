# import threading
# import time
# from datetime import timedelta
# from django.utils import timezone
# from django.core.mail import send_mail
# from django.conf import settings
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from user_profile.models import *
# from dms_module.models import *
# import logging
# import pytz
# from django.utils.dateformat import format

# from user_profile.email_utils import *


# # Set up logging
# logger = logging.getLogger(__name__)

# # Global variable to track if the reminder thread is running
# reminder_thread_running = False
# updating_document = False  # Flag to prevent recursion

# def send_revision_reminder():
#     global reminder_thread_running
#     reminder_thread_running = True
#     while True:
#         current_time = timezone.now()

#         # Fetch all reminder objects (in case there are multiple reminder objects stored in the DB)
#         reminder_objects = Reminder.objects.all()
        
#         if not reminder_objects:
#             logger.warning("No reminder object found in the database.")
#             time.sleep(60)  # Sleep for a minute before checking again
#             continue

#         # Fetch documents that need reminders based on revision_date and is_revised
#         reminder_documents = Document.objects.filter(
#             revision_date__gt=current_time,
#             is_revised=False  # Only send reminder if the document is not yet revised
#         )

#         for reminder_obj in reminder_objects:
#             reminder_minutes = reminder_obj.reminder_minutes  # Get the list of reminder minutes

#             for document in reminder_documents:
#                 try:
#                     # Loop through each reminder minute
#                     for reminder in reminder_minutes:
#                         reminder_time = document.revision_date - timedelta(minutes=reminder)

#                         # Check if the current time is within the reminder window
#                         if current_time >= reminder_time and current_time < reminder_time + timedelta(minutes=1):
#                             # Find the user who created the document
#                             user = document.user  # The user who created the document
#                             department = user.department  # Get the department of the document creator

#                             # Find the 'doc_admin' users from the same department
#                             doc_admin_users = CustomUser.objects.filter(
#                                 department=department,
#                                 groups__name='doc_admin'  # Assuming the 'doc_admin' group exists
#                             )

#                             # Send reminder emails to doc_admin users
#                             for doc_admin in doc_admin_users:
#                                 subject = f"Reminder: Document '{document.document_title}' Revision Due Soon"
#                                 message = f"Dear {doc_admin.username},\n\nThis is a reminder that the document '{document.document_title}' created by {user.username} is due for revision in {reminder} minutes. Please make sure to update it accordingly.\n\nBest regards,\nYour Team"
#                                 from_email = settings.EMAIL_HOST_USER
#                                 recipient_list = [doc_admin.email]

#                                 # Send the email to the 'doc_admin' user
#                                 send_mail(subject, message, from_email, recipient_list, fail_silently=False)
#                                 logger.info(f"Sent revision reminder email to {doc_admin.email} about document '{document.document_title}' created by {user.username} for {reminder} minutes")

#                 except Exception as e:
#                     logger.error(f"Failed to send reminder email to doc_admin about document {document.document_title}: {str(e)}")

#         # Sleep for a minute before checking again
#         time.sleep(60)  # Check every minute

# def start_reminder_thread():
#     global reminder_thread_running
#     if not reminder_thread_running:
#         threading.Thread(target=send_revision_reminder, daemon=True).start()

# @receiver(post_save, sender=Document)
# def start_reminder_on_document_creation(sender, instance, created, update_fields=None, **kwargs):
#     global updating_document
#     if updating_document:
#         return  # Prevent recursion

#     # Prevent recursion when saving the instance
#     updating_document = True

#     # Fetch all reminder objects from the Reminder table
#     reminder_objects = Reminder.objects.all()

#     if created:
#         # If the document is newly created, start the reminder thread
#         logger.info(f"Creating Document instance '{instance.document_title}', starting reminder thread.")
#         start_reminder_thread()

#     else:
#         # If revision date, reminder_minutes, or is_revised are updated, trigger reminder logic
#         if 'revision_date' in update_fields or 'is_revised' in update_fields or 'reminder' in update_fields:
#             logger.info(f"Document '{instance.document_title}' updated. Restarting reminder email logic.")
            
#             # Check if the document's revision date is within the reminder window
#             current_time = timezone.now()
#             for reminder_obj in reminder_objects:
#                 reminder_minutes = reminder_obj.reminder_minutes  # List of reminder minutes

#                 for reminder in reminder_minutes:
#                     reminder_time = instance.revision_date - timedelta(minutes=reminder)
                    
#                     # Check if the current time is within the reminder window
#                     if current_time >= reminder_time and current_time < reminder_time + timedelta(minutes=1):
#                         logger.info(f"Reminder logic triggered for document '{instance.document_title}'")
#                         start_reminder_thread()
#                         break

#     # Reset the flag to prevent recursion
#     updating_document = False





# @receiver(post_save, sender=DocumentSendBackAction)
# def send_reminder_if_needed(sender, instance, created, **kwargs):
#     """
#     Signal handler to send reminders based on the created_at time and
#     the reminder_minutes settings from ReminderAfterNoACtionTaken model.
#     """
#     if created:
#         document = instance.document
#         user = document.assigned_to

#         # Fetch the reminder settings for the assigned user
#         reminder_settings = ReminderAfterNoACtionTaken.objects.filter(user=user).first()

#         if reminder_settings:
#             now = timezone.now()
#             created_at = instance.created_at  # The time when the document was sent back

#             # Loop through the reminder intervals in the `reminder_minutes` field
#             for minutes in reminder_settings.reminder_minutes:
#                 reminder_time = created_at + timedelta(minutes=minutes)

#                 # Check if the current time is past the reminder time
#                 if now >= reminder_time and not instance.reminder_sent:
#                     # Send the reminder email
#                     send_document_sendback_email(user, document.document_title)

#                     # Mark the action as having had its reminder sent
#                     instance.reminder_sent = True
#                     instance.save()

#                     # Log or print if needed
#                     print(f"Reminder sent to {user.email} for document '{document.document_title}'")
