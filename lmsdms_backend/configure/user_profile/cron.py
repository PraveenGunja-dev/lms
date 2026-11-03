from django_cron import CronJobBase, Schedule
from django.core.mail import send_mail
from django.utils import timezone
from dms_module.models import *
from datetime import timedelta
from user_profile.models import *

class DocumentReminderCronJob(CronJobBase):
    schedule = Schedule(run_every_mins=1)  # Run every minute
    code = 'document_reminder'  # Unique ID for this cron job

    def do(self):
        # Get all documents with an assigned user and no action taken (i.e. last_action_time is None)
        documents = Document.objects.filter(
            assigned_to__isnull=False,
            last_action_time__isnull=True
        )

        for document in documents:
            # Check if a reminder is set for the assigned user
            reminder = ReminderAfterNoACtionTaken.objects.all().first()
            if reminder:
                # Get the reminder interval in minutes (stored in Reminder.reminder_minutes as a list of minutes)
                reminder_minutes = reminder.reminder_minutes
                for minutes in reminder_minutes:
                    # Check if the time elapsed from last action is greater than the reminder interval
                    if timezone.now() - document.created_at >= timedelta(minutes=minutes):
                        # Send the reminder email
                        self.send_reminder_email(document.assigned_to, document.document_title)

    def send_reminder_email(self, assigned_to, document_title):
        subject = f"Reminder: Take Action on Document {document_title}"
        message = f"Dear {assigned_to.first_name},\n\nYou have not taken any action on the document titled '{document_title}'. Please take action as soon as possible."
        send_mail(subject, message, 'no-reply@example.com', [assigned_to.email])
