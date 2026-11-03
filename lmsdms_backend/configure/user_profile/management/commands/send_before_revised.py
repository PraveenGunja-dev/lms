import time
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.core.management.base import BaseCommand
from user_profile.models import CustomUser
from dms_module.models import *
import logging
from datetime import datetime, date
from user_profile.email_utils import *


logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send revision reminders to users based on document revision dates'

    def handle(self, *args, **options):
        """Handle the command logic, running continuously"""
        self.stdout.write(self.style.SUCCESS("Starting the revision reminder process..."))
        try:
            self.send_revision_reminder()
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS("Reminder service stopped manually."))

    def send_revision_reminder(self):
        """ Continuously checks for documents and sends reminders to users"""
        while True:
            # Get current system time and convert it to Asia/Kolkata timezone (since that's your local timezone)
            current_time = timezone.localtime(timezone.now())  # Convert to Asia/Kolkata timezone
            print(f"current_time================: {current_time}")

            # Fetch all reminder objects (in case there are multiple reminder objects stored in the DB)
            reminder_objects = Reminder.objects.all()

            if not reminder_objects:
                logger.warning("No reminder object found in the database.")
                time.sleep(60)  # Sleep for a minute before checking again
                continue

            # Fetch documents that need reminders based on revision_date
            reminder_documents = Document.objects.filter(
                revision_date__gt=current_time,  # Only documents that are still in the future
                is_revised=False  # Only send reminder if the document is not yet revised
            )

            for reminder_obj in reminder_objects:
                reminder_minutes = reminder_obj.reminder_minutes  # Get the list of reminder minutes

                for document in reminder_documents:
                    try:
                        # Ensure revision_date is a timezone-aware datetime
                        revision_date = document.revision_date
                        print(f"revision_date===== 111 =======: {revision_date}")

                        # Check if revision_date is naive (without timezone info), if so, make it aware
                        if timezone.is_naive(revision_date):
                            # Make revision_date timezone aware using the current timezone
                            revision_date = timezone.make_aware(revision_date, timezone.get_current_timezone())
                            print(f"revision_date===== 222 =======: {revision_date}")
                        
                        # Convert revision_date to Asia/Kolkata timezone (if it isn't already in that timezone)
                        kolkata_tz = timezone.get_fixed_timezone(5 * 60 + 30)  # Asia/Kolkata is UTC+5:30
                        revision_date = revision_date.astimezone(kolkata_tz)
                        print(f"revision_date (Asia/Kolkata timezone): {revision_date}")

                        # Loop through each reminder minute and send emails if the current time is within the window
                        for reminder in reminder_minutes:
                            reminder_time = revision_date - timedelta(minutes=reminder)
                            print(f"reminder_time===== 333 =======: {reminder_time}")

                            # Check if the current time is within the reminder window (1 minute before reminder_time)
                            if current_time >= reminder_time and current_time < reminder_time + timedelta(minutes=1):
                                # Find the user who created the document
                                user = document.user  # The user who created the document
                                department = user.department  # Get the department of the document creator

                                # Find all users from the same department
                                users_in_department = CustomUser.objects.filter(department=department)
                                send_before_revised_reminder_email(users_in_department, document, reminder)

                    except Exception as e:
                        logger.error(f"Failed to send reminder email about document {document.document_title}: {str(e)}")

            # Sleep for a minute before checking again
            time.sleep(60)

