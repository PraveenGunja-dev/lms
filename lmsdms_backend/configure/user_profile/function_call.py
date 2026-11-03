import secrets
import string
import os
from django.utils import timezone
from django.conf import settings
import decimal
import re
from django.db.models import Max
from dms_module.models import *
from datetime import datetime, timedelta
from rest_framework.request import Request


def validate_dates(start_date, end_date):
    date_format = '%d-%m-%Y'

    if not start_date or not end_date:
       if not start_date and not end_date:
        return None, None, None  # No error, return None for dates
       if not start_date or not end_date:
        return None, None, "Both Start Date and End Date are required."

    try:
        if start_date == end_date:
            start_date_obj = datetime.strptime(start_date, date_format).date()
            end_date_obj = start_date_obj + timedelta(days=1)
        else:
            start_date_obj = datetime.strptime(start_date, date_format).date()
            end_date_obj = datetime.strptime(end_date, date_format).date()
    except ValueError as e:
        return None, None, str(e)

    if start_date_obj > end_date_obj:
        return None, None, "start_date cannot be greater than end_date."

    return start_date_obj, end_date_obj, None


def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password

def get_training_document_upload_path(filename):
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    file_extension = os.path.splitext(filename)[1]
    new_filename = f'{timestamp}{file_extension}'
    return os.path.join('training_documents', new_filename)


# def increment_version(version_str):
#     major, minor = map(int, version_str.split('.'))
#     minor += 1 
#     if minor >= 10:
#         minor = 0
#         major += 1
#     return f"{major}.{minor}"

def increment_version(version_str):
    major, minor = map(int, version_str.split('.'))
    minor += 1  # Just increment minor without rolling over
    return f"{major}.{minor}"


def get_new_version(version_str):
        major, minor = map(int, version_str.split('.'))
        major += 1
        minor = 0
        
        return f"{major}.{minor}"




# def generate_document_number(user, document_type, parent_document_instance=None):

#     if user.department:
#         department_name = user.department.department_name  # Access department_name correctly
#     else:
#         department_name = 'UnknownDepartment'
#     document_title = "BPL"
#     base_number = f"{document_title}/{department_name}/"
    
#     if parent_document_instance is None:
#         if document_type.id == 1:
#             suffix_prefix = ""
#         else:
#             suffix_prefix = "001"

#         last_document = Document.objects.filter(parent_document__isnull=True, document_type=document_type).order_by('-document_number').first()

#         if last_document:
#             last_suffix = last_document.document_number.split('/')[-1]
#             if last_suffix.isdigit():
#                 next_suffix = str(int(last_suffix) + 1).zfill(3)
#             else:
#                 prefix = last_suffix[0]
#                 num_part = int(last_suffix[1:])
#                 next_suffix = f"{prefix}{str(num_part + 1).zfill(3)}"
#         else:
#             next_suffix = f"{suffix_prefix}001"  # Default starting point if no documents exist

#         document_number = base_number + next_suffix

#     else:
#         parent_document_number = parent_document_instance.document_number
#         suffix_prefix = ""

#         if document_type.id == 2:  # DocumentType 2 => "A001"
#             suffix_prefix = "A"
#         elif document_type.id == 3:  # DocumentType 3 => "F001"
#             suffix_prefix = "F"
        
#         last_document = Document.objects.filter(
#             parent_document=parent_document_instance,
#             document_type=document_type
#         ).order_by('-document_number').first()

#         if last_document:
#             last_suffix = last_document.document_number.split('/')[-1]
#             if last_suffix.isdigit():
#                 next_suffix = f"{suffix_prefix}{str(int(last_suffix[1:]) + 1).zfill(3)}"
#             else:
#                 prefix = last_suffix[0]
#                 num_part = int(last_suffix[1:])
#                 next_suffix = f"{prefix}{str(num_part + 1).zfill(3)}"
#         else:
#             next_suffix = f"{suffix_prefix}001"  # Starting with A001 or F001

#         document_number = f"{parent_document_number}/{next_suffix}"

#     return document_number



class DocumentNumberError(Exception):
    """Raised when a document number cannot be generated (e.g. author has no department)."""


def _next_sequence(existing_numbers, prefix, letter=""):
    """Highest numeric suffix among numbers of the form '<prefix><letter><digits>' + 1.
    Compares numerically, so 010 sorts after 009 (string ordering does not)."""
    pattern = re.compile(rf"^{re.escape(prefix)}{re.escape(letter)}(\d+)$")
    highest = 0
    for number in existing_numbers:
        match = pattern.match(number or "")
        if match:
            highest = max(highest, int(match.group(1)))
    return f"{letter}{str(highest + 1).zfill(3)}"


def generate_document_number(user, document_type, parent_document_instance=None):
    """Document numbers:
      top-level document : BPL/<Department>/001        (sequence per department)
      child Annexure      : <parent number>/A001        (sequence per parent number)
      child Format        : <parent number>/F001
    Child sequences are shared by all versions of the parent (same parent number),
    so a revised SOP never re-issues A001/F001.
    Callers must run inside a transaction; the department row is locked to make
    concurrent creations safe."""
    with transaction.atomic():
        return _generate_document_number(user, document_type, parent_document_instance)


def _generate_document_number(user, document_type, parent_document_instance):
    if parent_document_instance is None:
        if not user.department_id:
            raise DocumentNumberError(
                "Your account has no department assigned. Ask the administrator to assign a department before creating documents."
            )
        Department.objects.select_for_update().filter(id=user.department_id).first()
        department_name = user.department.department_name.strip()
        prefix = f"BPL/{department_name}/"
        existing = Document.objects.filter(
            parent_document__isnull=True, document_number__startswith=prefix
        ).values_list("document_number", flat=True)
        return prefix + _next_sequence(existing, prefix)

    parent_number = parent_document_instance.document_number
    letter = ""
    type_name = (document_type.document_name or "").strip().lower() if document_type else ""
    if document_type.id == 2 or type_name.startswith("annex"):
        letter = "A"
    elif document_type.id == 3 or type_name.startswith("format"):
        letter = "F"
    prefix = f"{parent_number}/"
    Document.objects.select_for_update().filter(document_number=parent_number).first()
    existing = Document.objects.filter(document_number__startswith=prefix).values_list("document_number", flat=True)
    return prefix + _next_sequence(existing, prefix, letter)



def get_file_data(request: Request, obj, field_name: str):
    # Get the field (ManyToManyField in this case) from the model instance
    field = getattr(obj, field_name, None)

    if field:
        # If it's a ManyToMany field (i.e., the field is a Manager), iterate over all related objects
        if isinstance(field, models.Manager):
            return [
                {
                    "id": str(item.id),
                    "url": request.build_absolute_uri(item.material_file.url),  # Assuming 'material_file' is the field in TrainingMaterialAttachments
                    "created_at": item.created_at.isoformat(),
                    "updated_at": item.updated_at.isoformat(),
                }
                for item in field.all()
            ]
    return None


# import fitz  # PyMuPDF

# import os
# import subprocess
# import platform

# def print_pdf_with_one_copy(pdf_path, printer_name=None):
#     """
#     Sends a PDF file to a printer and forces printing only 1 copy.
#     Works on both Linux (CUPS) and Windows (Win32 API).
#     """
#     try:
#         if not os.path.exists(pdf_path):
#             raise FileNotFoundError(f"PDF file not found: {pdf_path}")
#         os_type = platform.system()
#         print(f"Operating System: {os_type}")
#         print(f"PDF Path: {pdf_path}")
#         if os_type == "Linux":
#             print("Checking CUPS Printer List:")
#             # ✅ Use CUPS (Common Unix Printing System) for Linux
#             command = ["lp", "-n", "1", pdf_path]  # "-n 1" ensures 1 copy
#             if printer_name:
#                 command.insert(2, "-d")  # "-d printer_name" for specific printer
#                 command.insert(3, printer_name)
#             subprocess.run(command, check=True)

#         elif os_type == "Windows":
#             import win32print
#             import win32api

#             # ✅ Use Win32 API for Windows
#             if not printer_name:
#                 printer_name = win32print.GetDefaultPrinter()

#             print(f"Using Printer: {printer_name}")
#             win32api.ShellExecute(0, "print", pdf_path, f'/D:"{printer_name}"', ".", 0)

#         return True
#     except Exception as e:
#         print("Printing failed:", str(e))
#         return False


# ---------------------------------------------------------------------------
# Shared API helpers
# ---------------------------------------------------------------------------
import logging
from urllib.parse import urlparse

from django.db import transaction
from rest_framework.response import Response

logger = logging.getLogger(__name__)

ADMIN_GROUPS = ("Admin",)


def fail(message, http_status=400, **extra):
    """Error response that also rolls back any writes made earlier in the
    request (DATABASES ATOMIC_REQUESTS is enabled). Returns a real HTTP error
    code so clients can no longer mistake a failure for success."""
    try:
        if transaction.get_connection().in_atomic_block:
            transaction.set_rollback(True)
    except Exception:  # pragma: no cover - defensive, never mask the real error
        pass
    payload = {"status": False, "message": message, "data": []}
    payload.update(extra)
    return Response(payload, status=http_status)


def rollback_response(*args, **kwargs):
    """Drop-in replacement for Response(...) on failure paths: same payload and
    HTTP status as before, but any writes made earlier in the request are
    rolled back instead of being committed half-done."""
    try:
        if transaction.get_connection().in_atomic_block:
            transaction.set_rollback(True)
    except Exception:  # pragma: no cover
        pass
    return Response(*args, **kwargs)


def server_error(exc, message="Something went wrong"):
    """Log the full exception server-side; never leak internals to the client."""
    logger.exception("%s: %s", message, exc)
    return fail(message, http_status=500)


def user_in_groups(user, *group_names):
    """Case/whitespace-insensitive group membership check."""
    if not user or not user.is_authenticated:
        return False
    wanted = {name.strip().lower() for name in group_names}
    return any(name.strip().lower() in wanted for name in user.groups.values_list("name", flat=True))


def is_admin_user(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user_in_groups(user, *ADMIN_GROUPS)))


def can_manage_users(user, action="change"):
    """User-management rights: superuser, Admin group, or the Django model
    permission granted through the Roles & Permissions screen."""
    return is_admin_user(user) or user.has_perm(f"user_profile.{action}_customuser")


def is_allowed_download_url(url):
    """SSRF guard for URLs the server downloads (OnlyOffice edited files)."""
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return False
    allowed = list(getattr(settings, "ONLYOFFICE_ALLOWED_DOWNLOAD_HOSTS", []) or [])
    if not allowed:
        onlyoffice_host = urlparse(settings.ONLYOFFICE_SERVER_URL).hostname
        allowed = [h for h in (onlyoffice_host, urlparse(settings.BACKEND_PUBLIC_URL).hostname) if h]
    return parsed.hostname in allowed


def version_key(version_str):
    """Sort key for 'major.minor' versions ('1.10' > '1.9')."""
    try:
        return tuple(int(part) for part in str(version_str).split("."))
    except (TypeError, ValueError):
        return (0,)
