"""Seed a fresh LOCAL database with the reference data the application expects.

    python manage.py seed_local_data [--password <demo password>]

Creates (idempotently): roles with the IDs the frontend relies on, document
statuses, document types, a department, a plant, a workflow, an SOP template,
a printer and one demo user per role. Refuses to run unless DEBUG is on, so it
can never touch a production database.
"""
import os
import shutil

from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError

from dms_module.models import DocumentType, DynamicStatus, PrinterMachinesModel, TemplateModel, WorkFlowModel
from lms_module.models import Plant
from user_profile.models import CustomUser, Department

# Group IDs are hard-coded in the frontend (e.g. groupId === 7 is DTC).
GROUPS = [
    (1, "Admin"), (2, "Author"), (3, "Reviewer"), (4, "Approver"), (5, "Doc Admin"),
    (6, "HOD"), (7, "DTC"), (8, "HR"), (9, "Trainer"), (10, "Employee"),
]

# Status IDs are hard-coded in backend and frontend workflow code.
STATUSES = [
    (1, "Created"), (2, "Saved Draft"), (3, "Under Reviewer"), (4, "Under Approver"), (5, "Approved"),
    (6, "Release"), (7, "Effective"), (8, "Send Back"), (9, "Approved"), (10, "Revise"),
    (11, "Rejected"), (12, "Obsolete"), (13, "Pending"), (14, "Archived"), (15, "Supersede"),
]

DOCUMENT_TYPES = [(1, "SOP"), (2, "Annexure"), (3, "Format")]


class Command(BaseCommand):
    help = "Seed a fresh local database with roles, statuses, master data and demo users (DEBUG only)."

    def add_arguments(self, parser):
        parser.add_argument("--password", default="Local@12345", help="Password for all demo users")

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_local_data only runs with DJANGO_DEBUG=True (never on production).")
        password = options["password"]

        all_permissions = list(Permission.objects.all())
        groups = {}
        for group_id, name in GROUPS:
            group, _ = Group.objects.get_or_create(id=group_id, defaults={"name": name})
            # Local convenience: every role can see every screen. Configure real
            # role permissions in Roles & Permissions.
            group.permissions.set(all_permissions)
            groups[name] = group

        department, _ = Department.objects.get_or_create(
            department_name="Quality Assurance", defaults={"department_description": "Local demo department"})
        Plant.objects.get_or_create(plant_name="Main Plant", defaults={"plant_location": "Local"})

        admin = self._user("admin", "Admin", department, password, groups.values(), superuser=True)
        for _, name in GROUPS[1:]:
            self._user(name.lower().replace(" ", ""), name, department, password, [groups[name]])

        for status_id, name in STATUSES:
            DynamicStatus.objects.get_or_create(id=status_id, defaults={"status": name, "user": admin})
        for type_id, name in DOCUMENT_TYPES:
            DocumentType.objects.get_or_create(id=type_id, defaults={"document_name": name, "user": admin})
        WorkFlowModel.objects.get_or_create(workflow_name="Standard Workflow",
                                            defaults={"workflow_description": "Author > Reviewer > Approver > Doc Admin"})
        PrinterMachinesModel.objects.get_or_create(printer_name="Local Printer", defaults={"user": admin})
        self._template(admin)

        self.stdout.write(self.style.SUCCESS(
            "Local data ready. Log in as 'admin' (all roles) or a role user "
            f"({', '.join(n.lower().replace(' ', '') for _, n in GROUPS[1:])}) with password: {password}"))

    def _user(self, username, first_name, department, password, groups, superuser=False):
        user, created = CustomUser.objects.get_or_create(
            username=username,
            defaults={"email": f"{username}@local.test", "first_name": first_name, "last_name": "Demo",
                      "department": department, "is_department_assigned": True, "is_reset_password": True,
                      "is_dms_user": True, "is_staff": superuser, "is_superuser": superuser},
        )
        if created:
            user.set_password(password)
            user.save()
        user.groups.add(*groups)
        return user

    def _template(self, admin):
        if TemplateModel.objects.exists():
            return
        source = os.path.join(settings.BASE_DIR, "..", "..", "lmsdms_frontend", "public", "template.docx")
        target_dir = os.path.join(settings.MEDIA_ROOT, "templates")
        os.makedirs(target_dir, exist_ok=True)
        if os.path.exists(source):
            shutil.copy(source, os.path.join(target_dir, "SOP_template.docx"))
        TemplateModel.objects.create(template_name="SOP Template", user=admin, template_doc="templates/SOP_template.docx")
