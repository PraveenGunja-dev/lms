# your_app/management/commands/send_reminders.py
from django.core.management.base import BaseCommand
from user_profile.signals import *
from user_profile.models import *
from dms_module.models import *
from django.utils import timezone
from datetime import timedelta
import logging
import time
from user_profile.email_utils import *


logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send reminders for documents and print requests based on action time, running continuously.'

    def handle(self, *args, **kwargs):
        logger.info("Reminder service started...")

        # Start the reminder loop
        while True:
            current_time = timezone.localtime(timezone.now())  # Get current time
            
            # Fetch all DocumentSendBackAction objects that have not had reminders sent
            actions = DocumentSendBackAction.objects.filter(reminder_sent=False)

            # Loop through actions and send reminders if the time has passed
            for action in actions:
                created_at = action.created_at
                user = action.document.assigned_to  # The user to receive the reminder

                # Get the reminder time intervals (in minutes) for the assigned user
                reminder_settings = ReminderAfterNoACtionTaken.objects.first()  # Assuming there's one global setting

                if reminder_settings:
                    reminder_minutes = reminder_settings.reminder_minutes  # List of reminder intervals in minutes
                    sent_reminders = action.reminder_sent_times or []  # List of intervals for which reminders have been sent

                    # Loop through each reminder minute interval stored in reminder_minutes
                    for minutes in reminder_minutes:
                        reminder_time = created_at + timedelta(minutes=minutes)

                        # If the current time is greater than or equal to the reminder time and the reminder hasn't been sent
                        if current_time >= reminder_time and minutes not in sent_reminders:
                            # Send the reminder email
                            self.send_reminder(action)

                            # Track the reminder time for this interval
                            sent_reminders.append(minutes)

                            logger.info(f"Reminder sent to {user.email} for document '{action.document.document_title}' at {minutes} minute(s).")

                            # Save the list of sent reminder intervals to the action
                            action.reminder_sent_times = sent_reminders
                            action.save()

                    # After sending reminders for all intervals, mark as completed
                    if len(sent_reminders) == len(reminder_minutes):
                        action.reminder_sent = True
                        action.save()

            # Fetch all PrintRequest objects that need reminders
            # print_requests = PrintRequest.objects.filter(reminder_sent_times__length__lt=ReminderAfterNoACtionTaken.objects.first().reminder_minutes.__len__())
            print_requests = PrintRequest.objects.filter(reminder_sent=False)
            for request in print_requests:
                created_at = request.created_at
                user = request.user  # The user who created the print request

                # Get the reminder time intervals (in minutes) for the assigned user
                reminder_settings = ReminderAfterNoACtionTaken.objects.first()  # Assuming there's one global setting

                if reminder_settings:
                    reminder_minutes = reminder_settings.reminder_minutes  # List of reminder intervals in minutes
                    sent_reminders = request.reminder_sent_times or []  # List of intervals for which reminders have been sent

                    # Loop through each reminder minute interval stored in reminder_minutes
                    for minutes in reminder_minutes:
                        reminder_time = created_at + timedelta(minutes=minutes)

                        # If the current time is greater than or equal to the reminder time and the reminder hasn't been sent
                        if current_time >= reminder_time and minutes not in sent_reminders:
                            # Send the reminder email to reviewers
                            self.send_print_request_reminder(request)

                            # Track the reminder time for this interval
                            sent_reminders.append(minutes)

                            logger.info(f"Reminder sent to reviewers for print request '{request.sop_document_id.document_title}' at {minutes} minute(s).")

                            # Save the list of sent reminder intervals to the request
                            request.reminder_sent_times = sent_reminders
                            request.save()

                    # After sending reminders for all intervals, mark as completed
                    if len(sent_reminders) == len(reminder_minutes):
                        request.reminder_sent = True
                        request.save()

            document_approval_request = DocumentAuthorApproveAction.objects.filter(reminder_sent = False)
            for request in document_approval_request:
                created_at = request.created_at
                user = request.user
                
                reminder_settings = ReminderAfterNoACtionTaken.objects.first()  # Assuming there's one global setting

                if reminder_settings:
                    reminder_minutes = reminder_settings.reminder_minutes  # List of reminder intervals in minutes
                    sent_reminders = request.reminder_sent_times or []  # List of intervals for which reminders have been sent

                    for minutes in reminder_minutes:
                        reminder_time = created_at + timedelta(minutes=minutes)

                        # If the current time is greater than or equal to the reminder time and the reminder hasn't been sent
                        if current_time >= reminder_time and minutes not in sent_reminders:
                            # Send the reminder email
                            self.send_document_approval_reminder(request)

                            # Track the reminder time for this interval
                            sent_reminders.append(minutes)

                            logger.info(f"Reminder sent to {user.email} for document approval request '{request.document.document_title}' at {minutes} minute(s).")

                            # Save the list of sent reminder intervals to the request
                            request.reminder_sent_times = sent_reminders
                            request.save()

                    # After sending reminders for all intervals, mark as completed
                    if len(sent_reminders) == len(reminder_minutes):
                        request.reminder_sent = True
                        request.save()

            document_review_request = DocumentReviewerAction.objects.filter(reminder_sent = False)
            for request in document_review_request:
                created_at = request.created_at
                user = request.user
                
                reminder_settings = ReminderAfterNoACtionTaken.objects.first()  # Assuming there's one global setting

                if reminder_settings:
                    reminder_minutes = reminder_settings.reminder_minutes  # List of reminder intervals in minutes
                    sent_reminders = request.reminder_sent_times or []  # List of intervals for which reminders have been sent

                    for minutes in reminder_minutes:
                        reminder_time = created_at + timedelta(minutes=minutes)

                        # If the current time is greater than or equal to the reminder time and the reminder hasn't been sent
                        if current_time >= reminder_time and minutes not in sent_reminders:
                            # Send the reminder email
                            self.send_document_reviewer_reminder(request)

                            # Track the reminder time for this interval
                            sent_reminders.append(minutes)

                            logger.info(f"Reminder sent to {user.email} for document review request '{request.document.document_title}' at {minutes} minute(s).")

                            # Save the list of sent reminder intervals to the request
                            request.reminder_sent_times = sent_reminders
                            request.save()

                    # After sending reminders for all intervals, mark as completed
                    if len(sent_reminders) == len(reminder_minutes):
                        request.reminder_sent = True
                        request.save()
            

            
            # Sleep for 60 seconds before checking again
            # time.sleep(60)

    def send_reminder(self, action):
        """ Helper method to send a reminder email for the document send-back action. """
        user = action.document.assigned_to
        document_title = action.document.document_title
        # Send the email directly (no context needed)
        send_document_sendback_reminder_email(user, document_title)

        logger.info(f"Reminder email sent to {user.email} for document '{document_title}'")

    def send_print_request_reminder(self, request):
        
        sop_document = request.sop_document_id  # Document related to the request
        no_of_print = request.no_of_print  # Get the number of prints from the PrintRequest model
        reason_for_print = request.reason_for_print  # Assuming this field exists in PrintRequest model
        issue_type = request.issue_type 
        # Get the QA group users to send the reminder email to
        user_department = request.user.department
        qa_group = Group.objects.get(name='Reviewer')
        qa_users_in_department = CustomUser.objects.filter(groups=qa_group, department=user_department)

        # Send the reminder email to each reviewer (no context used)
        send_print_request_reminder_email(qa_users_in_department, sop_document, no_of_print, reason_for_print, issue_type)

        logger.info(f"Reminder email sent to reviewers for print request '{sop_document.document_title}'")


    def send_document_approval_reminder(self, request):
        
        document_title = request.document.document_title
        reviewer_group = Group.objects.get(name='Reviewer')
        department_users = CustomUser.objects.filter(groups=reviewer_group, department=request.user.department)

        # Send the reminder email to each reviewer (no context used)
        send_document_approval_reminder_email(department_users, document_title)

        logger.info(f"Reminder email sent to reviewers for document approval request '{document_title}'") 


    def send_document_reviewer_reminder(self, request):
        
        document_title = request.document.document_title
        reviewer_group = Group.objects.get(name='Approver')
        department_users = CustomUser.objects.filter(groups=reviewer_group, department=request.user.department)

        # Send the reminder email to each reviewer (no context used)
        send_document_reviewer_reminder_email(department_users, document_title)

        logger.info(f"Reminder email sent to reviewers for document review request '{document_title}'")  