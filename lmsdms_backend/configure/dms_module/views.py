from django.shortcuts import render
from rest_framework import viewsets, filters
from rest_framework.response import Response
from .models import *
from rest_framework.pagination import PageNumberPagination
from .serializers import *
from rest_framework import permissions
from user_profile.function_call import *
from django.contrib.auth.models import Group
from django.core.mail import send_mail
from user_profile.email_utils import *
from lms_module.models import *
import requests
from django.db.models import Q
import logging
import time
import openpyxl
from django.core.files.base import ContentFile
from uuid import uuid4
from openpyxl.utils import get_column_letter
from io import BytesIO
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.conf import settings

logger = logging.getLogger(__name__)

class CustomPagination(PageNumberPagination):
    page_size = 10  # Number of items per page
    page_size_query_param = 'page_size'  # Allow users to set page size
    max_page_size = 100  # Maximum page size


class DashboardCountViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            document_count = Document.objects.count()
            workflow_count = WorkFlowModel.objects.count()
            document_type_count = DocumentType.objects.count()
            user_count = CustomUser.objects.count()
            department_count = Department.objects.count()

            return Response({
                "status": True,
                "message": "Dashboard counts fetched successfully",
                "data": {
                    "document_count": document_count,
                    "workflow_count": workflow_count,
                    "document_type_count": document_type_count,
                    "user_count" : user_count,
                    "department_count" : department_count
                }
            })
        except Exception as e:
            return rollback_response({
                "status": False,
                "message": "Something went wrong",
                "error": str(e)
            })

class WorkFlowViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkFlowSerializer
    queryset = WorkFlowModel.objects.all().order_by('-id')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['workflow_name', 'workflow_description']
    ordering_fields = ['workflow_name', 'created_at']

    def create(self, request):
        try:
            workflow_name = request.data.get('workflow_name')
            workflow_description = request.data.get('workflow_description', '')
            is_active = request.data.get('is_active', True)

            if not workflow_name:
                return rollback_response({'status': False, 'message': 'Workflow name is required'})

            workflow_obj = WorkFlowModel.objects.create(
                workflow_name=workflow_name,
                workflow_description=workflow_description,
                # is_active=is_active
            )
            serializer = WorkFlowSerializer(workflow_obj)
            return Response({'status': True, 'message': 'Workflow created successfully', 'data': serializer.data})
        except Exception as e:
            return rollback_response({'status': False, 'message': 'Something went wrong', 'error': str(e)})

    # List all workflows
    def list(self, request):
        queryset = WorkFlowModel.objects.all().order_by('-id')
        
        try:
            if queryset.exists():
                serializer = WorkFlowSerializer(queryset, many=True)
                return Response({
                    "status": True,
                    "message": "Workflows fetched successfully",
                    'total': queryset.count(),
                    'data': serializer.data
                })
            else:
                return Response({
                    "status": True,
                    "message": "No Workflow found",
                    "total": 0,
                    "data": []
                })
        except Exception as e:
            return rollback_response({"status": False, 'message': 'Something went wrong', 'error': str(e)})


class WorkFlowUpdateSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkFlowSerializer
    lookup_field = 'workflow_id'

    def update(self, request, *args, **kwargs):
        try:
            workflow_id = self.kwargs.get("workflow_id")
            workflow_name = request.data.get('workflow_name')
            workflow_description = request.data.get('workflow_description')
    
            workflow_object = WorkFlowModel.objects.get(id=workflow_id)
            if workflow_name:
                workflow_object.workflow_name = workflow_name
            if workflow_description:
                workflow_object.workflow_description = workflow_description
            workflow_object.save()
    
            return Response({'status': True, 'message': 'Workflow updated successfully'})
        except WorkFlowModel.DoesNotExist:
            return rollback_response({'status': False, 'message': 'Workflow not found'})
        except Exception as e:
            return rollback_response({'status': False, 'message': 'Something went wrong', 'error': str(e)})
        
    def destroy(self, request, *args, **kwargs):
        try:
            workflow_id = request.data.get('workflow_id')   
            if not WorkFlowModel.objects.filter(id=workflow_id):
                return rollback_response({"status":False, "message":"Workflow id not found"})
                     
            department_object = WorkFlowModel.objects.get(id=workflow_id)
            department_object.delete()
            return Response({"status":True, "message":"Workflow deleted succesfully"})
        except Exception as e:
                return rollback_response({"status": False,'message': 'Something went wrong','error': str(e)})



class DocumentTypeCreateViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentTypeSerializer
    queryset = DocumentType.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_name = request.data.get('document_name')
            if not document_name:
                return rollback_response({"status": False, "message": "Document name is required", "data": []})
            document_type = DocumentType.objects.create(user = user, document_name=document_name)
            serializer = DocumentTypeSerializer(document_type)
            return Response({"status": True, "message": "Document type created successfully", "data": serializer.data})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})
        
    def list(self, request, *args, **kwargs):
        try:
            queryset = DocumentType.objects.all()
            serializer = DocumentTypeSerializer(queryset, many=True)
            return Response({"status": True, "message": "Document type list fetched successfully", "data": serializer.data})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})
                
class PrintRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = PrintRequest.objects.all().order_by('-id')

    def create(self, request):
        try:
            user = self.request.user
            sop_document_id = request.data.get('sop_document_id')
            issue_type = request.data.get('issue_type')
            reason_for_print = (request.data.get('reason_for_print') or '').strip()
            printer_id = request.data.get('printer_id')
            try:
                no_of_print = int(request.data.get('no_of_print'))
            except (TypeError, ValueError):
                return fail('Number of prints is required')
            if no_of_print < 1:
                return fail('Number of prints must be at least 1')
            if not reason_for_print:
                return fail('Reason for print is required')

            sop_document = Document.objects.filter(id=sop_document_id).first()
            if not sop_document:
                return fail('Invalid document id', http_status=404)
            if sop_document.document_current_status_id not in PRINTABLE_DOCUMENT_STATUS_IDS:
                return fail('Only released or effective documents can be printed.')
            printer = PrinterMachinesModel.objects.filter(id=printer_id).first()
            if not printer:
                return fail('Invalid printer id')

            PrintRequest.objects.create(
                user=user,
                no_of_print=no_of_print,
                issue_type=issue_type,
                reason_for_print=reason_for_print,
                sop_document_id=sop_document,
                printer=printer,
                print_request_status_id=PRINT_STATUS_PENDING,
            )
            qa_users_in_department = CustomUser.objects.filter(groups__name='Doc Admin', department=user.department)
            send_print_request_email(user, no_of_print, reason_for_print, sop_document, issue_type, qa_users_in_department)
            return Response({'status': True, 'message': 'Print requested successfully'})
        except Exception as e:
            return server_error(e)

    def list(self, request, *args, **kwargs):
        try:
            status_id = request.query_params.get('status_id', None)
            if not status_id:
                return rollback_response({"status": False, "message": "status_id parameter is required", "data": []})
            user = self.request.user

            if user_in_groups(user, 'QA', 'Doc Admin'):
                queryset = PrintRequest.objects.filter(print_request_status__id=PRINT_STATUS_PENDING).order_by('-created_at')
            elif status_id == 'all':
                queryset = PrintRequest.objects.filter(user=user).order_by('-created_at')
            else:
                if not DynamicStatus.objects.filter(id=status_id).exists():
                    return rollback_response({"status": False, "message": "DynamicStatus with the given ID does not exist.", "data": []})
                queryset = PrintRequest.objects.filter(user=user, print_request_status_id=status_id).order_by('-created_at')

            if not queryset:
                return rollback_response({"status": False, "message": "No data available for the selected status.", "data": []})
            serializer = PrintRequestSerializer(queryset, many=True, context={'request': request})
            return Response({"status": True, "message": "Print requests fetched successfully.", "total": queryset.count(), "data": serializer.data})
        except Exception as e:
            return server_error(e)

import os
import subprocess
from io import BytesIO
from django.conf import settings
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from dms_module.models import PrintRequest
from dms_module.serializers import PrintRequestSerializer

class PrintRequestDocxConvertPDFViewSet(viewsets.ModelViewSet):
    """Issues ONE controlled print copy of an approved print request.

    The server decides everything that matters for a controlled copy: which
    request is printed, whether copies remain, which approval (copy) number the
    copy carries and which file is printed (the latest saved version of the
    document - the same one users read in the viewer). Each call produces a new
    uniquely-named PDF stamped with its own copy number and uses up one copy."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = PrintRequest.objects.all().order_by('-created_at')
    serializer_class = PrintRequestSerializer

    def update(self, request, *args, **kwargs):
        try:
            user = request.user
            sop_document_id = self.kwargs.get('sop_document_id')
            print_request_id = request.data.get('print_request_id')

            requests_qs = PrintRequest.objects.select_for_update().filter(sop_document_id_id=sop_document_id)
            if print_request_id:
                print_request = requests_qs.filter(id=print_request_id).first()
            else:
                # Older clients do not send the request id: use this user's latest approved request.
                print_request = requests_qs.filter(user=user, print_request_status_id=PRINT_STATUS_APPROVED).order_by('-created_at').first()
            if not print_request:
                return fail('Print request not found.', http_status=404)
            if print_request.user_id != user.id and not (is_admin_user(user) or user_in_groups(user, 'Doc Admin')):
                return fail('You can only print your own approved requests.', http_status=403)
            if print_request.print_request_status_id != PRINT_STATUS_APPROVED:
                return fail('This print request has not been approved.')

            approval = print_request.approvals.filter(status_id=PRINT_STATUS_APPROVED).order_by('-created_at').first()
            if not approval:
                return fail('This print request has not been approved.')
            allowed = int(approval.no_of_request_by_admin or 0)
            if print_request.print_count >= allowed:
                return fail(f'Print limit reached: all {allowed} approved copies have been printed. Please raise a new print request.',
                            http_status=403, print_count=print_request.print_count, allowed=allowed)

            numbers = list(approval.approval_numbers.order_by('id').values_list('number', flat=True))
            approval_number = numbers[print_request.print_count] if print_request.print_count < len(numbers) else ""

            document = print_request.sop_document_id
            source_docx = current_document_docx_path(document)
            if not source_docx:
                return fail('The document file was not found. Please contact the Doc Admin.', http_status=404)

            pdf_path = render_print_copy(
                source_docx,
                file_label=f"print_{print_request.id}_{print_request.print_count + 1}",
                watermark_text=print_watermark_text(document),
                approval_number=approval_number,
                issue_type=print_request.issue_type or "",
            )
            if not pdf_path:
                return fail('The document could not be converted to PDF. Please contact the administrator.', http_status=500)

            print_request.print_count += 1
            print_request.save(update_fields=['print_count'])
            logger.info("Print copy %s/%s (%s) of document %s issued to user %s",
                        print_request.print_count, allowed, approval_number, document.id, user.id)

            return Response({
                'status': True,
                'message': 'Document ready to print.',
                'pdf_link': request.build_absolute_uri(media_url_for(pdf_path)),
                'approval_number': approval_number,
                'print_count': print_request.print_count,
                'allowed': allowed,
                'remaining': allowed - print_request.print_count,
            })
        except Exception as e:
            return server_error(e, 'An error occurred while preparing the print copy.')


PRINT_STATUS_PENDING = 13
PRINT_STATUS_APPROVED = 9
PRINT_STATUS_REJECTED = 11
PRINTABLE_DOCUMENT_STATUS_IDS = (6, 7)  # released / effective


def current_document_docx_path(document):
    """The latest saved version of the document (what users see in the viewer),
    falling back to the file generated from its template."""
    latest = NewDocumentCommentsData.objects.filter(document=document).order_by('-created_at').first()
    if latest and latest.front_file_url:
        try:
            path = latest.front_file_url.path
        except Exception:
            path = None
        if path and os.path.exists(path):
            return path
    if document.generatefile:
        path = os.path.join(settings.MEDIA_ROOT, 'generated_docs', document.generatefile)
        if os.path.exists(path):
            return path
    return None


def print_watermark_text(document):
    status_name = (document.document_current_status.status if document.document_current_status else "").strip().lower()
    mapping = {
        "created": "DRAFT", "send back": "DRAFT", "under reviewer": "UNDER REVIEW", "under approver": "UNDER APPROVER",
        "release": "RELEASED", "effective": "EFFECTIVE", "revise": "EFFECTIVE",
        "supersede": "SUPERSEDED", "obsolete": "OBSOLETED",
    }
    return mapping.get(status_name, status_name.upper() or "CONTROLLED COPY")


def render_print_copy(source_docx, file_label, watermark_text, approval_number="", issue_type=""):
    """DOCX -> PDF -> watermarked PDF with a unique name. Returns the final path or None."""
    out_dir = os.path.join(settings.MEDIA_ROOT, 'print_copies')
    os.makedirs(out_dir, exist_ok=True)
    unique = uuid4().hex[:10]
    plain_pdf = convert_docx_file_to_pdf(source_docx, out_dir, f"{file_label}_{unique}_plain.pdf")
    if not plain_pdf:
        return None
    final_pdf = os.path.join(out_dir, f"{file_label}_{unique}.pdf")
    try:
        add_watermark(plain_pdf, final_pdf, watermark_text, approval_number, issue_type)
    finally:
        try:
            os.remove(plain_pdf)
        except OSError:
            pass
    return final_pdf


def media_url_for(path):
    return f"{settings.MEDIA_URL}{os.path.relpath(path, settings.MEDIA_ROOT).replace(os.sep, '/')}"


def add_watermark(input_pdf_path, output_pdf_path, watermark_text="CONFIDENTIAL", approval_number="", issue_type=""):
    """Stamps every page with a diagonal status watermark, the copy (approval)
    number bottom-right and the issue type bottom-left. The stamp is sized to
    each page (A4 and Letter), and input and output must be different files."""
    if os.path.abspath(input_pdf_path) == os.path.abspath(output_pdf_path):
        raise ValueError("add_watermark needs separate input and output files")
    with open(input_pdf_path, "rb") as source:
        existing_pdf = PdfReader(source)
        output = PdfWriter()
        for page in existing_pdf.pages:
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            packet = BytesIO()
            can = canvas.Canvas(packet, pagesize=(width, height))

            can.saveState()
            can.setFont("Helvetica-Bold", 50)
            can.setFillColorRGB(0.8, 0.1, 0.1, alpha=0.3)
            can.translate(width / 3, height / 2)
            can.rotate(45)
            can.drawString(0, 0, watermark_text or "")
            can.restoreState()

            box_height = 25
            if approval_number:
                can.saveState()
                can.setFont("Courier-Bold", 12)
                box_width = can.stringWidth(approval_number, "Courier-Bold", 12) + 12
                can.setFillColor(lightgrey)
                can.rect(width - box_width - 10, 10, box_width, box_height, fill=1, stroke=0)
                can.setFillColor(black)
                can.drawString(width - box_width - 4, 18, approval_number)
                can.restoreState()
            if issue_type:
                can.saveState()
                can.setFont("Courier-Bold", 12)
                box_width = can.stringWidth(issue_type, "Courier-Bold", 12) + 12
                can.setFillColor(lightgrey)
                can.rect(10, 10, box_width, box_height, fill=1, stroke=0)
                can.setFillColor(black)
                can.drawString(16, 18, issue_type)
                can.restoreState()

            can.save()
            packet.seek(0)
            page.merge_page(PdfReader(packet).pages[0])
            output.add_page(page)
        with open(output_pdf_path, "wb") as output_stream:
            output.write(output_stream)

from reportlab.lib.colors import black, lightgrey


class PrintRequestExcelGenerateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = PrintRequest.objects.all().order_by('-created_at')
    serializer_class = PrintRequestSerializer

    def list(self, request, *args, **kwargs):
        try:
            status_id = request.query_params.get('status_id', None)
            if not status_id:
                return rollback_response({"status": False, "message": "status_id parameter is required", "data": []})
            user = self.request.user

            if user.groups.filter(name='QA').exists() or user.groups.filter(name='Doc Admin').exists():
                queryset = PrintRequest.objects.all().order_by('-created_at')

            elif status_id == 'all':
                # If status_id is "all", fetch all data for the current user
                queryset = PrintRequest.objects.filter(user=user).order_by('-created_at')

            else:
                try:
                    dynamic_status = DynamicStatus.objects.get(id=status_id)
                except DynamicStatus.DoesNotExist:
                    return rollback_response({"status": False, "message": "DynamicStatus with the given ID does not exist.", "data": []})

                queryset = PrintRequest.objects.filter(user=user, print_request_status=dynamic_status).order_by('-created_at')

            if not queryset:
                return rollback_response({"status": False, "message": "No data available for the selected status.", "data": []})

            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Print Requests"

            headers = [
                'Data Number', 'User','SOP Document Number','SOP Document Title', 'No of Prints', 'Retrieval Numbers', 'Issue Type', 'Reason for Print',
                'Print Request Status', 'Created At', 'Printer', 'Master Copy Users', 'Other Users', 'Reminder Sent'
            ]

            for col_num, header in enumerate(headers, 1):
                col_letter = get_column_letter(col_num)
                ws[f'{col_letter}1'] = header

            for row_num, (index, print_request) in enumerate(enumerate(queryset, start=1), 2):
                ws[f'A{row_num}'] = index
                ws[f'B{row_num}'] = print_request.user.username  # User's username
                ws[f'C{row_num}'] = print_request.sop_document_id.document_number if print_request.sop_document_id else ""
                ws[f'D{row_num}'] = print_request.sop_document_id.document_title if print_request.sop_document_id else ""
                ws[f'E{row_num}'] = print_request.no_of_print
                ws[f'F{row_num}'] = ", ".join([str(num) for num in print_request.approvals.all().values_list('retrival_numbers__retrival_number', flat=True) if num])
                ws[f'G{row_num}'] = print_request.issue_type
                ws[f'H{row_num}'] = print_request.reason_for_print
                status = print_request.print_request_status.status if print_request.print_request_status else ""
                ws[f'I{row_num}'] = status.capitalize() if status else ""
                ws[f'J{row_num}'] = print_request.created_at.strftime('%d-%m-%Y')
                ws[f'K{row_num}'] = print_request.printer.printer_name if print_request.printer else ""
                ws[f'L{row_num}'] = ", ".join([user.username for user in print_request.master_copy_user.all()])
                ws[f'M{row_num}'] = ", ".join([user.username for user in print_request.other_user.all()])
                ws[f'N{row_num}'] = "Yes" if print_request.reminder_sent else "No"

            for col_num in range(1, len(headers) + 1):
                col_letter = get_column_letter(col_num)
                max_length = 0
                for row in ws.iter_rows(min_col=col_num, max_col=col_num):
                    for cell in row:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(cell.value)
                        except:
                            pass
                adjusted_width = (max_length + 2)
                ws.column_dimensions[col_letter].width = adjusted_width
            timestamp = time.strftime("%d_%m_%Y_%H_%M_%S")
            filename = f"print_request_report_{timestamp}.xlsx"

            file_path = os.path.join(settings.MEDIA_ROOT, 'print_request_excel_sheet', filename)

            folder_path = os.path.dirname(file_path)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)

            file_stream = BytesIO()
            wb.save(file_stream)
            file_stream.seek(0)

            with open(file_path, 'wb') as f:
                f.write(file_stream.read())
            base_url = request.build_absolute_uri('/')
            file_url = base_url + 'media/print_request_excel_sheet/' + filename

            return Response({"status": True,"message": "Excel report generated successfully.","data": file_url})

        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})

# class PrintApprovalViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAuthenticated]
#     queryset = PrintRequestApproval.objects.all().order_by('-id')

#     def create(self, request, *args, **kwargs):
#         try:
#             user = self.request.user
#             print_request_id = request.data.get('print_request_id')
#             no_of_request_by_admin = request.data.get('no_of_request_by_admin')
#             status = request.data.get('status')

#             # Validate that the print_request_id is provided
#             if not print_request_id:
#                 return rollback_response({'status': False, 'message': 'Print request ID is required'})
            
#             # Fetch the associated PrintRequest object
#             try:
#                 print_request = PrintRequest.objects.get(id=print_request_id)
#             except PrintRequest.DoesNotExist:
#                 return rollback_response({'status': False, 'message': 'Invalid Print Request ID'})
            
#             if not no_of_request_by_admin:
#                 return rollback_response({'status': False, 'message': 'No of request by admin is required when approving'})
            
#             # Ensure no_of_request_by_admin does not exceed no_of_print from PrintRequest
#             if int(no_of_request_by_admin) > print_request.no_of_print:
#                 return rollback_response({'status': False, 'message': f'No of request by admin cannot exceed {print_request.no_of_print}'})
            
#             # Fetch the DynamicStatus object for the provided status
#             try:
#                 dynamic_status = DynamicStatus.objects.get(id=status)
#             except DynamicStatus.DoesNotExist:
#                 return rollback_response({'status': False, 'message': 'Invalid status value provided'})
            
#             # Generate the unique approval number
#             base_format = "BPL-Dms-"

#             # Track the last approval for the current print_request
#             last_approval = PrintRequestApproval.objects.filter(print_request=print_request).order_by('-id').first()

#             # Initialize the copy number for the first approval
#             if last_approval:
#                 # Extract the last copy number and increment it
#                 last_copy_number = int(last_approval.approval_number.split('-')[-2])
#                 new_copy_number = last_copy_number + 1
#             else:
#                 # If no approval exists yet, start from 01
#                 new_copy_number = 1

#             # Ensure that the generated approval number is unique
#             approval_number = f"{base_format}{str(new_copy_number).zfill(2)}-{no_of_request_by_admin}"

#             # Check if the generated approval number already exists, and keep incrementing until it's unique
#             while PrintRequestApproval.objects.filter(approval_number=approval_number).exists():
#                 new_copy_number += 1
#                 approval_number = f"{base_format}{str(new_copy_number).zfill(2)}-{no_of_request_by_admin}"

#             # Create PrintRequestApproval object
#             print_request_approval = PrintRequestApproval.objects.create(
#                 user=user,
#                 print_request=print_request,
#                 no_of_request_by_admin=no_of_request_by_admin,
#                 status=dynamic_status,
#                 approval_number=approval_number
#             )
            
#             return Response({'status': True, 'message': f'Print request successfully'})
        
#         except Exception as e:
#             return rollback_response({'status': False, 'message': 'Something went wrong', 'error': str(e)})

class PrintApprovalViewSet(viewsets.ModelViewSet):
    """Doc Admin approves (status 9, with number of copies) or rejects (status 11)
    a pending print request. Approval numbers are created for approvals only."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = PrintRequestApproval.objects.all().order_by('-id')

    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            if not (is_admin_user(user) or user_in_groups(user, 'Doc Admin', 'QA')):
                return fail('Only Doc Admin users can approve or reject print requests.', http_status=403)
            print_request = PrintRequest.objects.select_for_update().filter(id=request.data.get('print_request_id')).first()
            if not print_request:
                return fail('Invalid Print Request ID', http_status=404)
            if print_request.user_id == user.id:
                return fail('You cannot approve or reject your own print request.', http_status=403)
            if print_request.print_request_status_id != PRINT_STATUS_PENDING:
                return fail('This print request has already been processed.')
            try:
                status_id = int(request.data.get('status'))
            except (TypeError, ValueError):
                return fail('Invalid status value provided')
            if status_id not in (PRINT_STATUS_APPROVED, PRINT_STATUS_REJECTED):
                return fail('Invalid status value provided')
            dynamic_status = DynamicStatus.objects.filter(id=status_id).first()
            if not dynamic_status:
                return fail('Print status is not configured in the system', http_status=500)

            copies = 0
            if status_id == PRINT_STATUS_APPROVED:
                try:
                    copies = int(request.data.get('no_of_request_by_admin'))
                except (TypeError, ValueError):
                    return fail('Number of copies is required when approving')
                if copies < 1:
                    return fail('Number of copies must be at least 1')
                if copies > print_request.no_of_print:
                    return fail(f'Number of copies cannot exceed the {print_request.no_of_print} requested')

            approval = PrintRequestApproval.objects.create(
                user=user,
                print_request=print_request,
                no_of_request_by_admin=copies,
                status=dynamic_status,
            )
            if copies:
                approval.approval_numbers.add(*generate_approval_numbers(copies))
            print_request.print_request_status = dynamic_status
            print_request.print_count = 0
            print_request.save(update_fields=['print_request_status', 'print_count'])

            send_print_request_approval_email(print_request.user, print_request, copies, dynamic_status)
            message = 'Print request successfully approved' if copies else 'Print request rejected'
            return Response({'status': True, 'message': message})
        except Exception as e:
            return server_error(e)


def generate_approval_numbers(count):
    """Unique copy numbers in the existing format BPL-Dms-<series>-<copy>."""
    numbers = []
    for copy_index in range(1, count + 1):
        series = 1
        number = f"BPL-Dms-{series:02d}-{copy_index}"
        while ApprovalNumber.objects.filter(number=number).exists():
            series += 1
            number = f"BPL-Dms-{series:02d}-{copy_index}"
        numbers.append(ApprovalNumber.objects.create(number=number))
    return numbers

        

class PrintRequestUpdateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        try:
            print_request_id = self.kwargs.get('print_request_id')
            status = request.data.get('status')

            if not print_request_id:
                return rollback_response({'status': False, 'message': 'Print request ID is required'})

            try:
                print_request = PrintRequest.objects.get(id=print_request_id)
            except PrintRequest.DoesNotExist:
                return rollback_response({'status': False, 'message': 'Invalid Print Request ID'})

            try:
                print_request_approval = PrintRequestApproval.objects.get(print_request=print_request, status='approved')
            except PrintRequestApproval.DoesNotExist:
                return rollback_response({'status': False, 'message': 'No approved PrintRequestApproval found for this PrintRequest'})

            if print_request.print_request_status != 'print_is_pending':
                return rollback_response({'status': False, 'message': 'This PrintRequest is not in a pending state'})

            print_request.print_request_status = status
            print_request.save()

            return Response({'status': True, 'message': 'Data Printing started successfully'})
        
        except Exception as e:
            return rollback_response({'status': False, 'message': 'Something went wrong', 'error': str(e)})


class DocumentCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentdataSerializer
    queryset = Document.objects.all()
    
    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            parent_document = request.data.get('parent_document', None)
            equipment_id = request.data.get('equipment_id','')
            product_code = request.data.get('product_code','')
            document_title = request.data.get('document_title')
            document_type_id = request.data.get('document_type')
            document_description = request.data.get('document_description', '')
            revision_month = request.data.get('revision_month', '')
            document_operation = request.data.get('document_operation', '')
            select_template = request.data.get('select_template')
            workflow = request.data.get('workflow')
            document_current_status_id = request.data.get('document_current_status_id')
            training_required = request.data.get('training_required')
            if training_required != '':
                if isinstance(training_required, str):
                    training_required = training_required.lower() in ['true',1]
            else:
                training_required = False
            # visible_to_users = request.data.get('visible_to_users', [])
            # approver = request.data.get('approver')
            # doc_admin = request.data.get('doc_admin')


             # Ensure visible_to_users is parsed into a proper list
            # if isinstance(visible_to_users, str):
            #     import json
            #     try:
            #         visible_to_users = json.loads(visible_to_users)
            #     except json.JSONDecodeError:
            #         return Response({
            #             "status": False,
            #             "message": "Invalid format for visible_to_users. Provide a valid list of IDs.",
            #             "data": []
            #         })

            # Validation for required fields
            if not document_title:
                return rollback_response({"status": False, "message": "Document title is required", "data": []})
            if not document_type_id:
                return rollback_response({"status": False, "message": "Document type is required", "data": []})
            if not workflow:
                return rollback_response({"status": False, "message": "Workflow is required", "data": []})
            if not select_template:
                    return rollback_response({"status": False, "message": "Template selection is required", "data": []})
            if not revision_month:
                return rollback_response({"status": False, "message": "Revision month is required", "data": []})
            # if not approver:
            #     return rollback_response({"status": False, "message": "Please select Approver", "data": []})
            # if not doc_admin:
            #     return rollback_response({"status": False, "message": "Please select Doc Admin", "data": []})

            try:
                default_status = DynamicStatus.objects.get(id=document_current_status_id)  # Assuming status with ID 1 is the default
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Default status not found in the system", "data": []})

            # Fetch DocumentType instance
            try:
                document_type = DocumentType.objects.get(id=document_type_id)
            except DocumentType.DoesNotExist:
                return rollback_response({"status": False, "message": "Document type not found", "data": []})
            
            # try:
            #     approver_user = CustomUser.objects.get(id=approver)
            # except DocumentType.DoesNotExist:
            #     return rollback_response({"status": False, "message": "Approver user not found", "data": []})
            
            # try:
            #     docadmin_user = CustomUser.objects.get(id=doc_admin)
            # except DocumentType.DoesNotExist:
            #     return rollback_response({"status": False, "message": "Doc Admin user not found", "data": []})

            # Handle Parent Document if provided
            # parent_document_instance = []
            # if parent_document:
            #     try:
            #         parent_document_instance = Document.objects.get(id__in=parent_document)
            #         parent_document_instance.is_parent = True
            #         parent_document_instance.save()
            #     except Document.DoesNotExist:
            #         return rollback_response({"status": False, "message": "Parent document not found", "data": []})
            parent_document_instance = None
            if parent_document:
                parent_document_instance = Document.objects.filter(id=parent_document).first()
                if not parent_document_instance:
                    return fail("Parent document not found")
                parent_document_instance.is_parent = True
                parent_document_instance.save(update_fields=['is_parent'])

            try:
                document_number = generate_document_number(user, document_type, parent_document_instance)
            except DocumentNumberError as e:
                return fail(str(e))

            document = Document.objects.create(
                user=user,
                parent_document = parent_document_instance,
                document_title=document_title,
                document_number=document_number,
                document_type_id=document_type.id,
                document_description=document_description,
                product_code=product_code,
                equipment_id=equipment_id,
                # revision_date=revision_date,
                revision_month = revision_month,
                document_operation=document_operation,
                select_template_id=select_template,
                workflow_id=workflow,
                document_current_status=default_status,
                version="0.0",
                # approver=approver_user,
                # doc_admin=docadmin_user,
                training_required=training_required,

            )
            # if visible_to_users:
            #     document.visible_to_users.set(visible_to_users)

            document.save()
            DocumentVersion.objects.create(
                document=document,
                version_number=document.version,
                updated_by=user,
            )

            # reviewer_group = Group.objects.get(name='Reviewer')
            # reviewers = CustomUser.objects.filter(groups=reviewer_group)
            # department_users = CustomUser.objects.filter(department=user.department)
            # users_to_notify = reviewers.union(department_users).distinct()
            # send_document_create_email(user, document_title, users_to_notify)

            # If the operation is 'upload_file', handle the Word file upload
            # if document_operation == 'upload_file':
            #     word_file = request.FILES['word_file']
            #     UploadedDocument.objects.create(
            #         document=document,
            #         word_file=word_file
            #     )
            
            # Serialize the created document
            # serializer = DocumentdataSerializer(document)
            return Response({"status": True, "message": "Document created successfully", "data": {"id": document.id, "document_number": document.document_number}})

        except Exception as e:
            return server_error(e, "Could not create document")

class DocumentUpdateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer
    queryset = Document.objects.all()
    lookup_field = 'document_id'

    def update(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = self.kwargs.get('document_id')
            
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({'status': False, 'message': 'Document not found'})

            # Extract fields from the request data
            parent_document = request.data.get('parent_document',None)
            document_title = request.data.get('document_title')
            document_type_id = request.data.get('document_type')
            document_description = request.data.get('document_description')
            revision_month = request.data.get('revision_month', '')
            document_operation = request.data.get('document_operation')
            workflow_id = request.data.get('workflow')
            training_required = request.data.get('training_required')
            select_template = request.FILES.get('select_template')
            equipment_id = request.data.get('equipment_id','')
            product_code = request.data.get('product_code','')
            # visible_to_users = request.data.get('visible_to_users', [])
            # approver = request.data.get('approver')
            # doc_admin = request.data.get('doc_admin')
            
            # Validate and parse visible_to_users
            # if isinstance(visible_to_users, str):
            #     import json
            #     try:
            #         visible_to_users = json.loads(visible_to_users)
            #     except json.JSONDecodeError:
            #         return Response({
            #             "status": False,
            #             "message": "Invalid format for visible_to_users. Provide a valid list of user IDs.",
            #             "data": []
            #         })

            if not document_title:
                return rollback_response({"status": False, "message": "Document title is required", "data": []})
            if not document_type_id:
                return rollback_response({"status": False, "message": "Document type is required", "data": []})
            if not workflow_id:
                return rollback_response({"status": False, "message": "Workflow is required", "data": []})
            if not revision_month:
                return rollback_response({"status": False, "message": "Revision month is required", "data": []})
            # if not approver:
            #     return rollback_response({"status": False, "message": "Please select Approver", "data": []})
            # if not doc_admin:
            #     return rollback_response({"status": False, "message": "Please select Doc Admin", "data": []})

            try:
                document_type = DocumentType.objects.get(id=document_type_id)
            except DocumentType.DoesNotExist:
                return rollback_response({'status': False, 'message': 'Document type not found'})
            
            try:
                workflow = WorkFlowModel.objects.get(id=workflow_id)
            except WorkFlowModel.DoesNotExist:
                return rollback_response({'status': False, 'message': 'Workflow not found'}, status=400)

            # try:
            #     approver_user = CustomUser.objects.get(id=approver)
            # except DocumentType.DoesNotExist:
            #     return rollback_response({"status": False, "message": "Approver user not found", "data": []})
            
            # try:
            #     docadmin_user = CustomUser.objects.get(id=doc_admin)
            # except DocumentType.DoesNotExist:
            #     return rollback_response({"status": False, "message": "Doc Admin user not found", "data": []})
      
            parent_document_instance = None
            if parent_document:
                try:
                    parent_document_instance = Document.objects.get(id=parent_document)
                except Document.DoesNotExist:
                    return rollback_response({"status": False, "message": "Parent document not found", "data": []})

            if select_template:
                try:
                    # get_select_template = document.select_template.template_doc
                    document.select_template.template_doc = select_template
                    document.select_template.save()
                except Exception as e:
                    return rollback_response({"status": False, "message": str(e), "data": []})
            # Update the document fields
            if document_title != '':
                document.document_title = document_title
            if parent_document != '':
                document.parent_document = parent_document_instance
            if document_type != '':
                document.document_type = document_type
            if document_description != '':
                document.document_description = document_description
            if revision_month != '':
                document.revision_month = revision_month
            if document_operation != '':
                document.document_operation = document_operation
            if workflow != '':
                document.workflow = workflow
            if equipment_id != '':
                document.equipment_id = equipment_id
            if product_code != '':
                document.product_code = product_code        
            if training_required != '':
                if isinstance(training_required, str):
                    training_required = training_required.lower() in ['true',1]
                document.training_required = training_required
            # if approver_user != '':
            #     document.approver = approver_user
            # if docadmin_user != '':
            #     document.doc_admin = docadmin_user 

            # # Update visible_to_users if provided
            # if visible_to_users:
            #     document.visible_to_users.set(visible_to_users)    
            
            # Save the updated document
            document.save()
            UpdateDocumentByUser.objects.create(user=user, document=document)

            return Response({"status": True, "message": "Document updated successfully"})
        
        except Exception as e:
            return rollback_response({"status": False, "message": 'Something went wrong', 'error': str(e)})

# class DocumentViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAuthenticated]
#     serializer_class = DocumentviewSerializer
#     queryset = Document.objects.all().order_by('-id')
#     filter_backends = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields = ['document_title', 'document_number', 'document_description', 'document_type__name']
#     ordering_fields = ['document_title', 'created_at'] 

#     def list(self, request):
#         try:
#             queryset = self.filter_queryset(self.get_queryset())

#             if queryset.exists():
#                 serializer = DocumentviewSerializer(queryset, many=True)
#                 return Response({
#                     "status": True,
#                     "message": "Documents fetched successfully",
#                     'total': queryset.count(),
#                     'data': serializer.data
#                 })
#             else:
#                 return Response({
#                     "status": True,
#                     "message": "No Documents found",
#                     "total": 0,
#                     "data": []
#                 })
#         except Exception as e:
#             return rollback_response({"status": False, 'message': 'Something went wrong', 'error': str(e)})


# class DocumentViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAuthenticated]
#     serializer_class = DocumentviewSerializer
#     queryset = Document.objects.all().order_by('-id')
#     filter_backends = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields = ['document_title', 'document_number', 'document_description', 'document_type__name']
#     ordering_fields = ['document_title', 'created_at'] 

#     def list(self, request):
#         try:
#             user = self.request.user 
#             user_group_ids = user.groups.values_list('id', flat=True)
#             user_department = user.department if user.department else None
#             department_id = request.query_params.get('department_id', None)
#             document_current_status = request.query_params.get('document_current_status', None)
#             start_date = request.query_params.get('start_date', None)
#             end_date = request.query_params.get('end_date', None)

#             start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
#             if error:
#                 return rollback_response({"status": False, "message": error, "data": [],"user_group_ids": list(user_group_ids)})
            
#             if start_date_obj:
#                 start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
#             if end_date_obj:
#                 end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
                
#             if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
#                 if department_id:
#                     queryset = Document.objects.filter(user__department_id=department_id).order_by('-id')
#                 else:
#                     queryset = Document.objects.all().order_by('-id')

#             elif user.groups.filter(name='Reviewer').exists():
#                 queryset = Document.objects.filter(visible_to_users=user).order_by('-id')
#             elif user_department:
#                 queryset = Document.objects.filter(user__department=user_department).order_by('-id')
#             else:
#                 queryset = Document.objects.none()

#             if start_date_obj and end_date_obj:
#                 queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

#             if document_current_status:
#                 # Filter by document_current_status if provided
#                 queryset = queryset.filter(document_current_status=document_current_status)
            
#             queryset = self.filter_queryset(queryset)

#             if queryset.exists():
#                 serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
#                 return Response({"status": True,"message": "Documents fetched successfully",'user_group_ids': list(user_group_ids) ,'data': serializer.data,})
#             else:
#                 return Response({"status": True,"message": "No Documents found",'user_group_ids': list(user_group_ids),"data": []})
        
#         except Exception as e:
#             return rollback_response({"status": False,'message': 'Something went wrong','error': str(e)})



# class DocumentViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAuthenticated]
#     serializer_class = DocumentviewSerializer
#     queryset = Document.objects.all().order_by('-id')
#     filter_backends = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields = ['document_title', 'document_number', 'document_description', 'document_type__name']
#     ordering_fields = ['document_title', 'created_at'] 

#     def list(self, request):
#         try:
#             user = self.request.user 
#             user_group_ids = user.groups.values_list('id', flat=True)
#             user_department = user.department if user.department else None
#             department_id = request.query_params.get('department_id', None)
#             document_current_status = request.query_params.get('document_current_status', None)

#             if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
#                 if department_id:
#                     queryset = Document.objects.filter(user__department_id=department_id).order_by('-id')
#                 else:
#                     queryset = Document.objects.all().order_by('-id')

#             elif user.groups.filter(name='Reviewer').exists():
#                 queryset = Document.objects.filter(visible_to_users=user).order_by('-id')
#             elif user_department:
#                 queryset = Document.objects.filter(user__department=user_department).order_by('-id')
#             else:
#                 queryset = Document.objects.none()

#             document_current_status = request.query_params.get('document_current_status', None)

#             if document_current_status:
#                 # Filter by document_current_status if provided
#                 queryset = queryset.filter(document_current_status=document_current_status)
            
#             queryset = self.filter_queryset(queryset)

#             if queryset.exists():
#                 serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
#                 return Response({"status": True,"message": "Documents fetched successfully",'user_group_ids': list(user_group_ids) ,'data': serializer.data,})
#             else:
#                 return Response({"status": True,"message": "No Documents found",'user_group_ids': list(user_group_ids),"data": []})
        
#         except Exception as e:
#             return rollback_response({"status": False,'message': 'Something went wrong','error': str(e)})

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-created_at')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document_title', 'document_number', 'document_description', 'document_type__name']
    ordering_fields = ['document_title', 'created_at']

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            roles = self.kwargs.get('roles')
            user_group_ids = list(user.groups.values_list('id', flat=True))
            department_id = self.request.query_params.get('department_id', None)
            document_current_status = request.query_params.get('document_current_status', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
            if error:
                return rollback_response({"status": False, "message": error, "data": [],"user_group_ids": list(user_group_ids)})
            
            if start_date_obj:
                start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
            if end_date_obj:
                end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))

             # Check if the user is in the "Admin" group
            if roles == "1" or roles == "5":
                # Admins can view all documents
                queryset = Document.objects.all().exclude(document_current_status=15).order_by('-id')
            elif roles =="2":
                # Authors can only see documents created by users in the same department
                # Authors see their department's documents (including revision drafts,
                # status 10, waiting to be picked up) plus anything they authored.
                author_department_id = department_id or user.department_id
                queryset = Document.objects.filter(
                    Q(user__department_id=author_department_id) | Q(author=user) | Q(user=user)
                ).exclude(document_current_status=15).distinct().order_by('-id')
            else:
                # Other roles: View documents assigned to them
                queryset = Document.objects.filter(
                    Q(approver=user) |
                    Q(doc_admin=user) |
                    Q(visible_to_users=user)
                ).exclude(document_current_status=15).distinct()

            # Filter by document_current_status if provided
            if document_current_status:
                queryset = queryset.filter(document_current_status=document_current_status)

            if start_date_obj and end_date_obj:
                queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            queryset = self.filter_queryset(queryset)

            if queryset.exists():
                serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
                return Response({
                    "status": True,
                    "message": "Documents fetched successfully",
                    'user_group_ids': user_group_ids,
                    'data': serializer.data,
                })
            else:
                return Response({
                    "status": True,
                    "message": "No Documents found",
                    'user_group_ids': user_group_ids,
                    "data": []
                })

        except Exception as e:
            return rollback_response({
                "status": False,
                'message': 'Something went wrong',
                'error': str(e)
            })








class DocumentExcelGenerateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document_title', 'document_number', 'document_description', 'document_type__name']
    ordering_fields = ['document_title', 'created_at'] 
    

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user 
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            document_current_status = request.query_params.get('document_current_status', None)

            # Admin or Doc Admin: view all or by department
            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = Document.objects.filter(user__department_id=department_id).order_by('-id')
                else:
                    queryset = Document.objects.all().order_by('-id')

            # Reviewer: can only view documents visible to them
            elif user.groups.filter(name='Reviewer').exists():
                queryset = Document.objects.filter(visible_to_users=user).order_by('-id')

            # Department-based filtering for other users
            elif user_department:
                queryset = Document.objects.filter(user__department=user_department).order_by('-id')
            else:
                queryset = Document.objects.none()

            # Further filtering by document_current_status if provided
            if document_current_status:
                queryset = queryset.filter(document_current_status=document_current_status)

            # Apply any filters set in the queryset
            queryset = self.filter_queryset(queryset)

            # Generate the Excel file automatically
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Documents Report Excel Sheet"

            # Define the headers for the Excel file
            # headers = [
            #     'Document Title', 'Document Number', 'Document Type', 'Parent Document No.',
            #     'Revision Date', 'Status','Product Code','Equipment ID','Created At', 'Effective Date', 'Version',
            #     'Author Name', 'Approver Name','Doc Admin Name'
            # ]
            headers = [
                    'Department', 'Document Type', 'Document Title', 'Document No', 'Parent Document No', 'Version',
                    'Effective Date', 'Next Review Date', 'Equipment ID', 'Product Code', 'Current Status',
                    'Task', 'Task Start Date/Time', 'Last Action',
                    'Author Name', 'Reviewer Name', 'Approver Name', 'Name of Doc. Admin'
            ]
            
        
        


            # Add headers to the Excel sheet
            for col_num, header in enumerate(headers, 1):
                col_letter = get_column_letter(col_num)
                ws[f'{col_letter}1'] = header

            for row_num, document in enumerate(queryset, 2):
                # Status-based logic
                status_id = document.document_current_status.id if document.document_current_status else None
                if status_id == 3:
                    task = "Reviewer Task"
                    last_task = "Author"
                elif status_id == 4:
                    task = "Approver Task"
                    last_task = "Reviewer"
                elif status_id in [5, 9]:
                    task = "Doc Admin Task"
                    last_task = "Approver"
                elif status_id == 6:
                    task = "Doc Admin Task"
                    last_task = "Doc Admin"
                elif status_id == 7:
                    task = "Completed"
                    last_task = "Doc Admin"
                elif status_id in [1, 2]:
                    task = "Author Task"
                    last_task = "Author"
                else:
                    task = "-"
                    last_task = "-"
            

                task_start = document.last_action_time.strftime('%d-%m-%Y %H:%M:%S') if document.last_action_time else "-"

                # Write to Excel
                ws[f'A{row_num}'] = document.user.department.department_name if document.user and document.user.department else "-"
                ws[f'B{row_num}'] = document.document_type.document_name if document.document_type else "-"
                ws[f'C{row_num}'] = document.document_title
                ws[f'D{row_num}'] = document.document_number
                ws[f'E{row_num}'] = document.parent_document.document_number if document.parent_document else "-"
                ws[f'F{row_num}'] = document.version
                ws[f'G{row_num}'] = document.effective_date.strftime('%d-%m-%Y') if document.effective_date else "-"
                ws[f'H{row_num}'] = document.revision_date.strftime('%d-%m-%Y') if document.revision_date else "-"
                ws[f'I{row_num}'] = document.equipment_id if document.equipment_id else "-"
                ws[f'J{row_num}'] = document.product_code if document.product_code else "-"
                ws[f'K{row_num}'] = document.document_current_status.status if document.document_current_status else "-"
                ws[f'L{row_num}'] = task
                ws[f'M{row_num}'] = task_start
                ws[f'N{row_num}'] = last_task
                ws[f'O{row_num}'] = document.author.username if document.author else "-"
                ws[f'P{row_num}'] = document.reviewer.username if document.reviewer else "-"
                ws[f'Q{row_num}'] = document.approver.username if document.approver else "-"
                ws[f'R{row_num}'] = document.doc_admin.username if document.doc_admin else "-"

                user_groups = document.user.groups.all()
                group_names = ', '.join([group.name for group in user_groups]) if user_groups else '-'
                # ws[f'L{row_num}'] = group_names

            # Adjust column widths
            for col_num in range(1, len(headers) + 1):
                col_letter = get_column_letter(col_num)
                max_length = 0
                for row in ws.iter_rows(min_col=col_num, max_col=col_num):
                    for cell in row:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(cell.value)
                        except:
                            pass
                adjusted_width = (max_length + 2)
                ws.column_dimensions[col_letter].width = adjusted_width

            # Generate a timestamp for the file name
            timestamp = time.strftime("%d_%m_%Y_%H_%M_%S")
            filename = f"document_report_{timestamp}.xlsx"

            # File path and saving the file
            file_path = os.path.join(settings.MEDIA_ROOT, 'document_excel_sheet', filename)

            # Create the folder if it doesn't exist
            folder_path = os.path.dirname(file_path)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)

            # Save the Excel file to the path
            file_stream = BytesIO()
            wb.save(file_stream)
            file_stream.seek(0)

            with open(file_path, 'wb') as f:
                f.write(file_stream.read())

            # Build the base URL and the file URL for downloading
            base_url = request.build_absolute_uri('/')
            file_url = base_url + 'media/document_excel_sheet/' + filename

            return Response({"status": True,"message": "Excel report generated successfully.","data": file_url})        
        except Exception as e:
            return rollback_response({"status": False,'message': 'Something went wrong','error': str(e)})
        
from django.utils.text import Truncator
from django.utils.timezone import localtime
class DocumentPDFGenerateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document_title', 'document_number', 'document_description', 'document_type__name']
    ordering_fields = ['document_title', 'created_at']
    
    queryset = Document.objects.all()

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user 
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            document_current_status = request.query_params.get('document_current_status', None)

            # Admin or Doc Admin: view all or by department
            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = Document.objects.filter(user__department_id=department_id).order_by('-id')
                else:
                    queryset = Document.objects.all().order_by('-id')

            # Reviewer: can only view documents visible to them
            elif user.groups.filter(name='Reviewer').exists():
                queryset = Document.objects.filter(visible_to_users=user).order_by('-id')

            # Department-based filtering for other users
            elif user_department:
                queryset = Document.objects.filter(user__department=user_department).order_by('-id')
            else:
                queryset = Document.objects.none()

            # Further filtering by document_current_status if provided
            if document_current_status:
                queryset = queryset.filter(document_current_status=document_current_status)

            # Apply any filters set in the queryset
            queryset = self.filter_queryset(queryset)

            documents_data = queryset.select_related(
                'document_type', 
                'document_current_status', 
                'select_template', 
                'assigned_to',
            ).values(
                'document_title', 
                'document_number', 
                'parent_document__id',
                'document_type__document_name',  
                'document_current_status__status',
                'select_template__template_name',
                'assigned_to__first_name',
                'assigned_to__last_name',
                'version', 
                'created_at',
            )
            max_lengths = {
            'document_title': max(len(doc['document_title'] or "") for doc in documents_data),
            'document_number': max(len(doc['document_number'] or "") for doc in documents_data),
            'document_type': max(len(doc['document_type__document_name'] or "") for doc in documents_data),
            'assigned_to': max(len(f"{doc['assigned_to__first_name']} {doc['assigned_to__last_name']}" or "") for doc in documents_data),
            'version': max(len(doc['version'] or "") for doc in documents_data),
            'created_at': max(len(str(localtime(doc['created_at']))) for doc in documents_data),
            }

            # Context for rendering HTML template
            context = {
                'documents': documents_data,
                'max_lengths': max_lengths,
                'current_date': timezone.now().strftime('%d-%m-%Y')
            }

            # Load the HTML template
            html_template_path = settings.BASE_DIR / 'templates' / 'document_list_pdf_report.html'
            template = get_template(html_template_path)

            # Render HTML with context data
            html = template.render(context)

            # Create a BytesIO buffer to hold the PDF data in memory
            buffer = BytesIO()

            # Use xhtml2pdf to generate the PDF from the HTML
            pisa_status = pisa.CreatePDF(html, dest=buffer)

            # Check if there were any errors during PDF generation
            if pisa_status.err:
                return rollback_response({
                    'status': False,
                    'message': 'Error occurred while generating the PDF.',
                    'data': {}
                })

            # Get timestamp for PDF file name
            timestamp = int(time.time())
            file_name = f"document_list_{timestamp}.pdf"

            # Define the file path to save the PDF in 'document_certificare' folder
            file_path = os.path.join(settings.MEDIA_ROOT, 'document_certificare', file_name)

            # Create the folder if it doesn't exist
            folder_path = os.path.dirname(file_path)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)

            # Save the generated PDF to the file system
            with open(file_path, 'wb') as f:
                f.write(buffer.getvalue())

            # Build the file URL
            pdf_file_url = f"{settings.MEDIA_URL}document_certificare/{file_name}"
            full_pdf_file_url = f"{request.scheme}://{request.get_host()}{pdf_file_url}"

            # Return response with the PDF file URL
            return Response({
                'status': True,
                'message': 'PDF file generated and saved successfully.',
                'data': {'file_url': full_pdf_file_url}
            })

        except Exception as e:
            return rollback_response({
                'status': False,
                'message': str(e),
                'data': {}
            })
        

class GetObsoleteStatusDataToDocAdminUserOnly(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all()

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user

            if user.groups.filter(name='Doc Admin').exists():
                queryset = Document.objects.filter(document_current_status = 12).order_by('-id')
                serializer = DocumentviewSerializer(queryset, many=True,context={'request': request})
                data = serializer.data
                return Response({"status": True, "message": "Documents retrieved successfully", "data": data})
            else:
                return rollback_response({"status": False, "message": "You are not authorized to view this data"})
        except Exception as e:
            return rollback_response({"status": False, "message": 'Something went wrong', 'error': str(e)})
        
class DocumentDeleteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer
    queryset = Document.objects.all()

    def destroy(self, request, *args, **kwargs):
        try:
            document_id = request.data.get('document_id')

            if not Document.objects.filter(id=document_id).exists():
                return rollback_response({"status": False, "message": "Document ID not found"})

            # Retrieve and delete the document
            document_object = Document.objects.get(id=document_id)
            document_object.delete()

            return Response({"status": True, "message": "Document deleted successfully"})

        except Exception as e:
            return rollback_response({"status": False, 'message': 'Something went wrong', 'error': str(e)})
        
from docx import Document as D

# Assuming you have your Document model and DocumentdataSerializer defined elsewhere
# from your_app.models import Document
# from your_app.serializers import DocumentdataSerializer

class DocumentTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentdataSerializer
    queryset = Document.objects.all()
    lookup_field = 'document_id'

    def replace_text_in_paragraphs(self, paragraphs, replacements):
        """Replaces placeholders inside paragraphs, handling multi-run text formatting."""
        for para in paragraphs:
            full_text = "".join(run.text for run in para.runs)  # Combine all runs
            
            modified = False
            for key, value in replacements.items():
                placeholder = f"{{{{ {key} }}}}"  # Ensure format matches docx
                if placeholder in full_text:
                    full_text = full_text.replace(placeholder, value)  # Replace placeholders
                    modified = True

            if modified:
                para.clear()  # Clear old content
                para.add_run(full_text)  # Add modified text back

    def replace_text_in_tables(self, tables, replacements):
        """Replaces placeholders inside table cells, ensuring full cell replacement."""
        for table in tables:
            for row in table.rows:
                for cell in row.cells:
                    full_text = cell.text  # Get entire cell content

                    modified = False
                    for key, value in replacements.items():
                        placeholder = f"{{{{ {key} }}}}"
                        if placeholder in full_text:
                            full_text = full_text.replace(placeholder, value)
                            modified = True

                    if modified:
                        cell.text = full_text  # Replace text in cell

    def list(self, request, *args, **kwargs):
        document_id = self.kwargs.get('document_id')

        if document_id is None:
            return rollback_response({"status": False, "message": "document_id parameter is required"})

        try:
            document = Document.objects.get(id=document_id)
            serializer = self.get_serializer(document, context={'request': request})
            template_url = serializer.data.get('template_url')
            latest_comment = NewDocumentCommentsData.objects.filter(document=document).first()
            front_file_url = latest_comment.front_file_url.url if latest_comment and latest_comment.front_file_url else None
           
            if not template_url:
                return rollback_response({"status": False, "message": "Template URL not found in document data."})

            replacements = {
                "document_title": document.document_title,
                "document_number": document.document_number,
                "version": document.version,
                "department": document.user.department.department_name if document.user.department else 'UnknownDepartment',
            }

            template_path = os.path.join(settings.MEDIA_ROOT, 'templates', f'template_{document_id}.docx')
            output_dir = os.path.join(settings.MEDIA_ROOT, 'generated_docs')
            os.makedirs(os.path.dirname(template_path), exist_ok=True)
            os.makedirs(output_dir, exist_ok=True)

            response = requests.get(template_url)
            if response.status_code != 200:
                return rollback_response({"status": False, "message": "Failed to download template from URL"})

            with open(template_path, 'wb') as f:
                f.write(response.content)

            doc = D(template_path)

            self.replace_text_in_paragraphs(doc.paragraphs, replacements)
            self.replace_text_in_tables(doc.tables, replacements)

            timestamp = int(time.time())
            output_filename = f"training_document_{timestamp}.docx"
            output_path = os.path.join(output_dir, output_filename)
            doc.save(output_path)

            document.generatefile = output_filename
            document.save()

            file_url = f"{settings.MEDIA_URL}generated_docs/{output_filename}"
            full_file_url = f"{request.scheme}://{request.get_host()}{file_url}"
            

            return Response({
                "status": True,
                "message": "Template processed successfully",
                "data": front_file_url if front_file_url else template_url,
            })

        except Document.DoesNotExist:
            return rollback_response({"status": False, "message": "Document not found"})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e)})


class TemplateCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = TemplateModel.objects.all()
    
    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            template_name = request.data.get('template_name')
            template_doc = request.FILES.get('template_doc')  # Get the uploaded file
            
            if not template_name:
                return rollback_response({"status": False, "message": "Template name is required", "data": []})
            if not template_doc:
                return rollback_response({"status": False, "message": "Template document is required", "data": []})
            
            template = TemplateModel.objects.create(
                template_name=template_name,
                user=user, 
                template_doc=template_doc
            )
            
            return Response({"status": True, "message": "Template created successfully"})
        
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})
        
class TemplateViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TemplateSerializer
    queryset = TemplateModel.objects.all().order_by('-id')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['template_name', 'user__username']
    ordering_fields = ['template_name', 'created_at']

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            if queryset.exists():
                serializer = self.get_serializer(queryset, many=True)
                return Response({
                    "status": True,
                    "message": "Templates fetched successfully",
                    'total': queryset.count(),
                    'data': serializer.data
                })
            else:
                return Response({
                    "status": True,
                    "message": "No templates found",
                    "total": 0,
                    "data": []
                })
        except Exception as e:
            return rollback_response({
                "status": False,
                'message': 'Something went wrong',
                'error': str(e)
            })

class TemplateUpdateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = TemplateModel.objects.all()
    lookup_field = 'temp_id'

    def update(self, request, *args, **kwargs):
        try:
            template_id = self.kwargs.get('temp_id') 

            try:
                template = TemplateModel.objects.get(id=template_id)
            except TemplateModel.DoesNotExist:
                return rollback_response({'status': False, 'message': 'Template not found'})

            template_name = request.data.get('template_name')
            template_doc = request.FILES.get('template_doc') 

            if template_name is not None:
                template.template_name = template_name
            if template_doc is not None:
                template.template_doc = template_doc  

            template.save()

            return Response({"status": True, "message": "Template updated successfully"})
        
        except Exception as e:
            return rollback_response({"status": False, "message": 'Something went wrong', 'error': str(e)})
        

class TemplateDocumentViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'template_id'


    def list(self, request, *args, **kwargs):
        template_id = self.kwargs.get('template_id')

        if not template_id:
            return rollback_response({"status": False, "message": "template_id parameter is required"})

        try:
            template = TemplateModel.objects.get(id=template_id)
            serializer = TemplateDocumentSerializer(template, context={'request': request})
            return Response({
                "status": True,
                "message": "Template document fetched successfully",
                "data": serializer.data
            })
        except TemplateModel.DoesNotExist:
            return rollback_response({"status": False, "message": "Template not found"})


        
class DynamicStatusCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DynamicStatus.objects.all()
    serializer_class = DynamicStatusSerializer

    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            status_value = request.data.get('status')

          
            if not status_value:
                return rollback_response({"status": False, "message": "Status is required"})

            dynamic_status = DynamicStatus.objects.create(
                user=user,
                status=status_value
            )

            return Response({"status": True, "message": "Dynamic status created successfully"})

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})
        

class DynamicStatusListViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DynamicStatus.objects.all().order_by('-id')
    serializer_class = DynamicStatusSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['status', 'user__username']
    ordering_fields = ['status', 'created_at']

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())

            if queryset.exists():
                serializer = self.get_serializer(queryset, many=True)
                return Response({
                    "status": True,
                    "message": "Dynamic statuses fetched successfully",
                    'total': queryset.count(),
                    'data': serializer.data
                })
            else:
                return Response({
                    "status": True,
                    "message": "No dynamic statuses found",
                    "total": 0,
                    "data": []
                })
        except Exception as e:
            return rollback_response({
                "status": False, 
                'message': 'Something went wrong', 
                'error': str(e)
            })
        

class DynamicStatusUpdateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DynamicStatusSerializer
    queryset = DynamicStatus.objects.all()
    lookup_field = 'dynamic_status_id'  

    def update(self, request, *args, **kwargs):
        try:
            dynamic_status_id = self.kwargs.get('dynamic_status_id')
            dynamic_status = DynamicStatus.objects.get(id=dynamic_status_id)

            status_value = request.data.get('status')

          
            if status_value is not None:
                dynamic_status.status = status_value
            
            dynamic_status.save()
            return Response({"status": True, "message": "Dynamic status updated successfully"})

        except DynamicStatus.DoesNotExist:
            return rollback_response({"status": False, "message": "Dynamic status not found"})
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

# class DynamicStatusDeleteViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAuthenticated]
#     queryset = DynamicStatus.objects.all()
#     serializer_class = DynamicStatusSerializer
#     lookup_field = 'dynamic_status_id'  

#     def destroy(self, request, *args, **kwargs):
#         try:
#             dynamic_status_id = self.kwargs.get('dynamic_status_id')
#             dynamic_status = DynamicStatus.objects.get(id=dynamic_status_id)      
#             dynamic_status.delete()
#             return Response({"status": True, "message": "Dynamic status deleted successfully"})

#         except DynamicStatus.DoesNotExist:
#             return rollback_response({"status": False, "message": "Dynamic status not found"})
#         except Exception as e:
#             return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

class DocumentDetailsCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentDetails.objects.all()
    serializer_class = DocumentDetailsSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = request.data.get('document_id') 
            document_data = request.data.get('document_data') 

            # Check if the required fields are provided
            if not document_id:
                return rollback_response({"status": False, "message": "Document ID is required", "data": []})
            if not document_data:
                return rollback_response({"status": False, "message": "Document data is required", "data": []})

            # Fetch the document instance based on the provided document_id
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Document not found", "data": []})

            # Create a new DocumentDetails entry
            document_details = DocumentDetails.objects.create(
                user=user,
                document=document, 
                document_data=document_data
            )
            
            return Response({"status": True, "message": "Document created successfully", "data": {"id": document.id, "document_number": document.document_number}})

        except Exception as e:
            return server_error(e, "Could not create document")


class DocumentDetailsUpdateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentDetails.objects.all()
    lookup_field = 'docdetail_id'  
    serializer_class = DocumentDetailsSerializer

    def update(self, request, *args, **kwargs):
        try:
            documentdetail_id = self.kwargs.get('docdetail_id')

            try:
                document_details = DocumentDetails.objects.get(id=documentdetail_id)
            except DocumentDetails.DoesNotExist:
                return rollback_response({"status": False, "message": "Document not found"})

            # Get new data from the request
            document_data = request.data.get('document_data')
            document_id = request.data.get('document_id') 


            if document_data is not None:
                document_details.document_data = document_data
            
            # if document_id is not None:
            #     document_details.document_id = document_id
            version_number = document_details.document.version  # Get the current version
            new_version = increment_version(version_number)
            document_details.document.version = new_version
            document_details.save() 

            return Response({
                "status": True,
                "message": "Document Details updated successfully",
            })

        except Exception as e:
            return rollback_response({
                "status": False,
                "message": "Something went wrong",
                "error": str(e)
            })
        

class DocumentDetailsViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentDetailsSerializer
    queryset = DocumentDetails.objects.all().order_by('-id')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document__name', 'user__username'] 
    ordering_fields = ['created_at']

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset()) 
        
        try:
            if queryset.exists():
                serializer = DocumentDetailsSerializer(queryset, many=True)
                return Response({
                    "status": True,
                    "message": "Documents fetched successfully",
                    'total': queryset.count(),
                    'data': serializer.data
                })
            else:
                return Response({
                    "status": True,
                    "message": "No Documents found",
                    "total": 0,
                    "data": []
                })
        except Exception as e:
            return rollback_response({"status": False, 'message': 'Something went wrong', 'error': str(e)})


class DocumentApproveActionCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentAuthorApproveAction.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document = request.data.get('document_id')
            status_id = request.data.get('status')
            remark = request.data.get('remark')
            visible_to_users = request.data.get('visible_to_users', [])
            approver = request.data.get('approver')
            doc_admin = request.data.get('doc_admin')

            # Ensure required fields are provided
            if not document:
                return rollback_response({"status": False, "message": "Document are required"})
            if not status_id:
                return rollback_response({"status": False, "message": "Status is required"})
            if not remark:
                return rollback_response({"status": False, "message": "remark is required"})

             # Fetch related document and status objects
            try:
                document = Document.objects.get(id=document)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Document not found"})

            try:
                status = DynamicStatus.objects.get(id=status_id)
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid status ID"})
            
            status_underreivew = DynamicStatus.objects.get(id=3)
            # DocumentReviewerAction.objects.filter(document=document).delete()
            DocumentReviewerAction.objects.filter(document=document).update(status_approve=status_underreivew)
            SendBackofUser.objects.filter(document=document).update(is_send_back=False)
            ReviewByUser.objects.filter(document=document).update(is_reviewed=False)
            UserWiseSendBackView.objects.filter(document=document).update(is_done=False)

            # Update visible_to_users
            if isinstance(visible_to_users, str):
                import json
                try:
                    visible_to_users = json.loads(visible_to_users)
                except json.JSONDecodeError:
                    return rollback_response({
                        "status": False,
                        "message": "Invalid format for visible_to_users. Provide a valid list of IDs.",
                    })
            if visible_to_users:
                document.visible_to_users.set(visible_to_users)
                
             # Update approver
            if approver:
                try:
                    approver_user = CustomUser.objects.get(id=approver)
                    document.approver = approver_user
                except CustomUser.DoesNotExist:
                    return rollback_response({"status": False, "message": "Approver user not found"})

            # Update doc_admin
            if doc_admin:
                try:
                    doc_admin_user = CustomUser.objects.get(id=doc_admin)
                    document.doc_admin = doc_admin_user
                except CustomUser.DoesNotExist:
                    return rollback_response({"status": False, "message": "Doc Admin user not found"})

            # Save updated document
            document.save()
           
            document_approve_action = DocumentAuthorApproveAction.objects.create(
                user=user,
                document=document,
                status_approve=status,
                remarks_author = remark,
            )
            approve_action = DocApprove.objects.create(
                user=user,
                document=document,
                status_approve=status
            )
            document.author = user
            document.document_current_status = status
            document.form_status = None
            document.assigned_to = None
            version_number = document.version
            new_version = increment_version(version_number)
            document.version = new_version
            document.save()
            
            Archived.objects.create(
                document=document,
                version=version_number
            )
            UserWiseSendBackView.objects.filter(document=document).update(is_done=False)
            
            document_title = document.document_title
            reviewer_group = Group.objects.get(name='Reviewer')
            reviewers = CustomUser.objects.filter(groups=reviewer_group)
            department_users = CustomUser.objects.filter(department=user.department)
            # users_to_notify = reviewers.union(department_users).distinct()
            # Combine the querysets and eliminate duplicates
            users_to_notify = CustomUser.objects.filter(
                id__in=set(reviewers.values_list('id', flat=True)) | 
                set(department_users.values_list('id', flat=True))
            )
            send_document_update_email(user, document_title, users_to_notify)
            
            return Response({"status": True, "message": "Document approval action created successfully"})

        except DocumentDetails.DoesNotExist:
            return rollback_response({"status": False, "message": "Invalid document details ID"})
        except DynamicStatus.DoesNotExist:
            return rollback_response({"status": False, "message": "Invalid status ID"})
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})


class DocumentReviewerActionCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentReviewerAction.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = request.data.get('document_id')
            status_id = request.data.get('status')
            remark = request.data.get('remark')

            # Validate required fields
            if not document_id:
                return rollback_response({"status": False, "message": "Document is required"})
            if not status_id:
                return rollback_response({"status": False, "message": "Status is required"})
            if not remark:
                return rollback_response({"status": False, "message": "Remark is required"})

            # Fetch the document
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Document ID"})

            # Fetch the status
            try:
                status = DynamicStatus.objects.get(id=status_id)
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Status ID"})

            if not document.visible_to_users.filter(id=user.id).exists():
                return fail("You are not an assigned reviewer for this document.", http_status=403)
            review_done, created = ReviewByUser.objects.get_or_create(
                user=user,
                document=document,
                defaults={"is_reviewed": True}  # Set is_reviewed=True if new
            )
            if not created:
                review_done.is_reviewed = True
                review_done.save()
            document_reviewer_action = DocumentReviewerAction.objects.create(
                user=user,
                document=document,
                status_approve=status,
                remarks_reviewer=remark
            )
            approve_action = DocApprove.objects.create(
                user=user,
                document=document,
                status_approve=status
            )

            # Fetch the status for 'Send Back' and 'Approved'
            send_back_status = DynamicStatus.objects.get(id=8)
            approve_status = DynamicStatus.objects.get(id=4)

            # Get the total number of assigned reviewers
            total_reviewers = document.visible_to_users.count()

            # Check how many reviewers have approved and how many sent it back
            assigned_reviewer_ids = set(document.visible_to_users.values_list('id', flat=True))
            if user.id not in assigned_reviewer_ids:
                return fail("You are not an assigned reviewer for this document.", http_status=403)
            approved_reviews = DocumentReviewerAction.objects.filter(
                document=document,
                status_approve=approve_status,
                user_id__in=assigned_reviewer_ids,
            ).values('user_id').distinct().count()

            sent_back_reviews = DocumentReviewerAction.objects.filter(
                document=document,
                status_approve=send_back_status
            ).count()
            # If any reviewer sends it back, don't change the status
            if sent_back_reviews > 0:
                document.document_current_status = send_back_status  # 'Send Back'
            elif approved_reviews == total_reviewers:
                # Only change to 'Approved' if all reviewers have approved
                document.document_current_status = approve_status  # 'Approved'
            # Otherwise, don't change the status
            
            # Proceed with the rest of the document update
            document.assigned_to = None
            version_number = document.version  # Get the current version
            new_version = increment_version(version_number)
            document.version = new_version
            document.save()

            Archived.objects.create(
                document=document,
                version=version_number
            )

            # Send approval notification to approvers and department users
            document_title = document.document_title
            approver_user = Group.objects.get(name='Approver')
            approvers = CustomUser.objects.filter(groups=approver_user)
            department_users = CustomUser.objects.filter(department=document.user.department)

            # Use union without distinct() to avoid the error
            users_to_notify = approvers.union(department_users)

            send_document_approval_email(user, document_title, users_to_notify)

            return Response({
                "status": True,
                "message": "Document reviewer action created successfully",
            })

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

class GetSendBackActionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = SendBackofUser.objects.all()
    
    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = request.query_params.get('document_id')
            if not document_id:
                return rollback_response({"status": False, "message": "Document ID is required"})
            send_back_requests = SendBackofUser.objects.filter(user=user, document_id=document_id)
            serialized_data = SendBackofUserSerializer(send_back_requests, many=True)
            return Response({
                "status": True,
                "message": "Send back requests retrieved successfully",
                "send_back_requests": serialized_data.data
            })
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

class DocumentApproverActionCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentApproverAction.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = request.data.get('document_id')
            status_id = request.data.get('status')
            remark = request.data.get('remark')


            # Validate required fields
            if not document_id:
                return rollback_response({"status": False, "message": "Document is required"})
            if not status_id:
                return rollback_response({"status": False, "message": "Status is required"})
            if not remark:
                return rollback_response({"status": False, "message": "remark is required"})
            # Fetch the document
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Document ID"})

            # Fetch the status
            try:
                status = DynamicStatus.objects.get(id=status_id)
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Status ID"})

           
            # Create the reviewer action
            document_approver_action = DocumentApproverAction.objects.create(
                user=user,
                document=document,
                status_approve=status,
                remarks_approver = remark
            )
            approve_action = DocApprove.objects.create(
                user=user,
                document=document,
                status_approve=status
            )


            # Update document current status only if all reviewers have approved
            # if all_reviewers_approved:
            document.document_current_status = status
            document.assigned_to = None
            version_number = document.version  # Get the current version
            new_version = get_new_version(version_number)
            document.version = new_version
            document.save()
            
            Archived.objects.create(
                document=document,
                version=version_number
            )
            # if new_version.endswith(".0"):  
            #     previous_major_version = str(int(new_version.split(".")[0]) - 1) + ".0"

            #     old_doc = Document.objects.filter(
            #         document_number=document.document_number,
            #         version=previous_major_version
            #     ).first()

            #     if old_doc:
            #         old_doc.document_current_status = DynamicStatus.objects.get(id=15)
            #         old_doc.save()
            
            # Send approval notification to approvers and department users
            document_title = document.document_title
            approver_user = Group.objects.get(name='Doc Admin')
            approvers = CustomUser.objects.filter(groups=approver_user)
            department_users = CustomUser.objects.filter(department=document.user.department)

            # Use union without distinct() to avoid the error
            users_to_notify = approvers.union(department_users)

            send_document_approval_email(user, document_title, users_to_notify)

            return Response({
                "status": True,
                "message": "Document approver action created successfully",
            })

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})


class DocumentDocAdminActionCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentDocAdminAction.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = request.data.get('document_id')
            status_id = request.data.get('status')


            # Validate required fields
            if not document_id:
                return rollback_response({"status": False, "message": "Document is required"})
            if not status_id:
                return rollback_response({"status": False, "message": "Status is required"})


            # Fetch the document
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Document ID", "data": []})

            # Fetch the status
            try:
                status = DynamicStatus.objects.get(id=status_id)
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Status ID", "data": []})

           
            # Create the reviewer action
            document_docAdmin_action = DocumentDocAdminAction.objects.create(
                user=user,
                document=document,
                status_approve=status,
            )

            approve_action = DocApprove.objects.create(
                user=user,
                document=document,
                status_approve=status
            )

            document.document_current_status = status
            document.save()

            # Log actions based on status
            if status.id == 7:
                DocumentEffectiveAction.objects.create(
                    user=user,
                    document=document,
                    status_effective=status,
                    effective_date=document.effective_date,
                )
                user_department = document.user.department
                department_users = CustomUser.objects.filter(department=user_department)
                for department_user in department_users:
                    send_document_doc_admin_effective_email(department_user, document, status)

            elif status.id == 6:
                DocumentReleaseAction.objects.create(
                    user=user,
                    document=document,
                    status_release=status,
                )
                user_department = document.user.department
                department_users = CustomUser.objects.filter(department=user_department)
                for department_user in department_users:
                    send_document_doc_admin_release_email(department_user, document, status)
            return Response({"status": True,"message": "Document Doc Admin action created successfully", "data": []})

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

class DocumentIdwiseAuthorReviewerApproverDocAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Document.objects.all()
    
    def list(self, request,*args, **kwargs):
        try:
            document_id = self.kwargs.get('document_id')
            if not document_id:
                return rollback_response({"status": False, "message": "Document ID is required"})
            try:
                document_instance = Document.objects.get(id=document_id)
                author = document_instance.author
                reviewer = document_instance.visible_to_users
                doc_admin = document_instance.doc_admin
                approver = document_instance.approver
                data = {
                    "author": author.username,
                    "reviewer": reviewer.values_list('username', flat=True),
                    "doc_admin": doc_admin.username,
                    "approver": approver.username
                }
                return Response({"status": True, "message": "Document ID wise author, reviewer, doc admin, approver fetched successfully", "data": data})
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Document ID", "data": []})
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})
        

#update reviewer
class DocumentIdwiseUpdateReviewerViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        try:
            document_id = self.kwargs.get('document_id')
            reviewer_ids = request.data.get('reviewer_ids')

            if not document_id:
                return rollback_response({"status": False, "message": "Document ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not reviewer_ids:
                return rollback_response({"status": False, "message": "Reviewer IDs are required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

            # Validate reviewers
            reviewers = User.objects.filter(id__in=reviewer_ids)
            if reviewers.count() != len(reviewer_ids):
                return rollback_response({"status": False, "message": "Some reviewer IDs are invalid"}, status=status.HTTP_400_BAD_REQUEST)

            # Update reviewers
            document.visible_to_users.set(reviewers)
            document.save()

            return Response({"status": True, "message": "Reviewers updated successfully"})

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)}, status=500)        
            

class DocumentSendBackActionCreateViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            document_id = request.data.get('document_id')
            assigned_to_id = request.data.get('assigned_to')
            status_id = request.data.get('status_sendback')
            group_id = request.data.get('assign_user_group')
            remark = request.data.get('remark')


            # Validate required fields
            if not document_id or not assigned_to_id or not status_id:
                return rollback_response({
                    "status": False,
                    "message": "Document ID, Assigned User ID, and Status ID are required"
                })
                
            if not remark:
                return rollback_response({"status": False, "message": "remark is required"})


            # Fetch the document
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Document ID"})

            # Fetch the assigned user
            try:
                assigned_to = CustomUser.objects.get(id=assigned_to_id)
            except CustomUser.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Assigned User ID"})

            # Fetch the status
            try:
                status = DynamicStatus.objects.get(id=status_id)
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Status ID"})
            
            if status.id == 8:
                send_back, created = SendBackofUser.objects.get_or_create(
                user=user, 
                document=document,
                defaults={"is_send_back": True} 
                )
                if not created: 
                    send_back.is_send_back = True
                    send_back.save()

            # Log the send-back action
            send_back_action = DocumentSendBackAction.objects.create(
                user=user,
                document=document,
                status_sendback=status,
                group = group_id,
                remarks_sendback = remark
            )
            send_for_user, created = UserWiseSendBackView.objects.get_or_create(
                user=user,
                document=document,
                defaults={"is_done": True}
            )
            if not created:
                send_for_user.is_done = True
                send_for_user.save()

            # Update the document's assigned user and reason
            document.assigned_to = assigned_to
            document.assigned_to_group = group_id
            document.document_current_status = status
            document.save()
            document_title = document.document_title
            send_document_sendback_email(assigned_to, document_title)
            
            return Response({
                "status": True,
                "message": "Document sent back successfully",
            })

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

from django.utils.timezone import make_aware

class DocumentStatusHandleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentReleaseAction.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = request.data.get('document_id')
            status_id = request.data.get('status_id')
            effective_date = request.data.get('effective_date')
            revision_date = request.data.get('revision_date')


            if not document_id:
                return rollback_response({"status": False, "message": "Document details are required"})
            # if not status_id:
            #     return rollback_response({"status": False, "message": "Status is required"})
            
            
            try:
                status_id = int(status_id)
            except (TypeError, ValueError):
                return rollback_response({"status": False, "message": f"Invalid status ID: {status_id}"})

            status_release = DynamicStatus.objects.get(id=status_id)

            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Document ID"})
            
             # Convert effective_date and revision_date to timezone-aware datetime objects
            if effective_date:
                try:
                    naive_effective_date = datetime.strptime(effective_date, "%d-%m-%Y")
                    effective_date = make_aware(naive_effective_date)  # Convert to timezone-aware datetime
                except ValueError:
                    return rollback_response({"status": False, "message": "Invalid effective date format. Expected format: dd-mm-yyyy"})
            if revision_date:
                try:
                    naive_revision_date = datetime.strptime(revision_date, "%d-%m-%Y")
                    revision_date = make_aware(naive_revision_date)  # Convert to timezone-aware datetime
                except ValueError:
                    return rollback_response({"status": False, "message": "Invalid revision date format. Expected format: dd-mm-yyyy"})
            
            # Determine which model to use based on status_id
            if status_id == 6:
                document_release_action = DocumentReleaseAction.objects.create(
                    user=user,
                    document_id=document_id,
                    status_release=status_release,
                )
                document.document_current_status = status_release
                document.save()
                # send email to the all user who's department is same as the who created the document
                user_department = document.user.department
                department_users = CustomUser.objects.filter(department=user_department)
                for department_user in department_users:
                    send_document_release_email(department_user, document, status_release)
                return Response({"status": True, "message": "Document release action created successfully"})
            elif status_id == 7:
                document_effective_action = DocumentEffectiveAction.objects.create(
                    user=user,
                    document_id=document_id,
                    status_effective=status_release,
                    effective_date = effective_date,
                )
                # Update the document's current status
                document.effective_date = effective_date
                document.revision_date = revision_date
                document.document_current_status = status_release
                version_number = document.version  # Get the current version
                new_version = increment_version(version_number)
                document.version = new_version 
                document.save()
                
                Archived.objects.create(
                document=document,
                version=version_number
                )
                
                user_department = document.user.department
                department_users = CustomUser.objects.filter(department=user_department)
                for department_user in department_users:
                    send_document_effective_email(department_user, document, status_release)
                return Response({"status": True, "message": "Document effective action created successfully"})
            else:
                return rollback_response({"status": False, "message": "Invalid status ID"})            

        except Document.DoesNotExist:
            return rollback_response({"status": False, "message": "Invalid document ID"})
        except DynamicStatus.DoesNotExist:
            return rollback_response({"status": False, "message": "Invalid status ID"})
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})


# class DocumentEffectiveActionCreateViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAuthenticated]
#     queryset = DocumentEffectiveAction.objects.all()

#     def create(self, request, *args, **kwargs):
#         try:
#             user = self.request.user
#             document_id = request.data.get('documentdetails_effective')
#             status_id = request.data.get('status_effective')

#             if not document_id:
#                 return rollback_response({"status": False, "message": "Document details are required"})
#             if not status_id:
#                 return rollback_response({"status": False, "message": "Status is required"})

#             documentdetails_effective = DocumentDetails.objects.get(id=document_id)
#             status_effective = DynamicStatus.objects.get(id=status_id)

#             document_effective_action = DocumentEffectiveAction.objects.create(
#                 user=user,
#                 documentdetails_effective=documentdetails_effective,
#                 status_effective=status_effective
#             )

#             return Response({"status": True, "message": "Document effective action created successfully"})

#         except DocumentDetails.DoesNotExist:
#             return rollback_response({"status": False, "message": "Invalid document details ID"})
#         except DynamicStatus.DoesNotExist:
#             return rollback_response({"status": False, "message": "Invalid status ID"})
#         except Exception as e:
#             return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})
        
#     def list(self, request, *args, **kwargs):
#         try:
#             user = self.request.user

#             queryset = DocumentEffectiveAction.objects.filter(user=user)

#             if queryset.exists():
#                 serializer = DocumentEffectiveActionSerializer(queryset, many=True)
#                 data = serializer.data
#                 return Response({"status": True, "message": "Document effective actions fetched successfully", "data": data})
#             else:
#                 return rollback_response({"status": False, "message": "No document effective actions found", "data": []})
#         except Exception as e:
#             return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})


         
class DocumentReviseActionViewSet(viewsets.ModelViewSet):
    """Approve or reject a revision request.

    Rules (GMP segregation of duties):
      * only Doc Admin / Admin users (settings.REVISION_APPROVER_GROUPS) may decide;
      * the requester and the document's author can never decide their own request;
      * a request can be decided once.
    Approval creates the next draft version of the document (status 10), owned by
    the original author, carrying over reviewers, approver, doc admin, job roles,
    the current document file, its questions and its active quizzes."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentRevisionAction.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            document_id = request.data.get('document_id')
            request_action_id = request.data.get('request_action_id')
            action_status = (request.data.get('action_status') or '').strip().lower()
            remarks = request.data.get('remarks')

            if not document_id:
                return fail("Document ID is required")
            if not request_action_id:
                return fail("Revision request ID is required")
            if action_status not in ('approved', 'rejected'):
                return fail("Action status is required and must be 'approved' or 'rejected'")
            status_id = STATUS_REVISION_APPROVED if action_status == 'approved' else STATUS_REVISION_REJECTED

            if not _can_decide_revision(user):
                return fail("Only Doc Admin users can approve or reject revision requests.", http_status=403)

            document = Document.objects.select_for_update().filter(id=document_id).first()
            if not document:
                return fail("Invalid document ID", http_status=404)
            revision_request = DocumentRevisionRequestAction.objects.select_for_update().filter(
                id=request_action_id, document=document
            ).first()
            if not revision_request:
                return fail("Invalid revision request ID", http_status=404)
            if revision_request.status != REVISION_PENDING or not revision_request.is_revise:
                return fail(f"This revision request has already been {revision_request.status.lower()}.")
            if revision_request.user_id == user.id:
                return fail("You cannot approve or reject your own revision request.", http_status=403)
            if user.id in {document.author_id, document.user_id}:
                return fail("The author of a document cannot approve or reject its revision.", http_status=403)

            status_revision = DynamicStatus.objects.filter(id=status_id).first()
            if not status_revision:
                return fail("Revision status is not configured in the system.", http_status=500)

            new_document = None
            if action_status == 'approved':
                if _open_revision_draft(document):
                    return fail("A revision of this document is already in progress.")
                new_document = _create_revision_draft(document, status_revision, user)
                document.is_revised = True
                document.save(update_fields=['is_revised'])
                message = "Revision request approved. A new draft version has been created for the author."
            else:
                message = "Revision request rejected."

            revision_request.status = action_status
            revision_request.is_revise = False
            revision_request.save(update_fields=['status', 'is_revise'])

            DocumentRevisionRemarks.objects.create(document=document, remarks=remarks)
            DocumentRevisionAction.objects.create(
                user=user, document=document, status_revision=status_revision, remarks_revision=remarks
            )
            if new_document:
                DocumentRevisionAction.objects.create(
                    user=user, document=new_document, status_revision=status_revision, remarks_revision=remarks
                )

            return Response({
                "status": True,
                "message": message,
                "data": {"new_document_id": new_document.id if new_document else None},
            })
        except Exception as e:
            return server_error(e)


REVISION_PENDING = "Pending"
STATUS_EFFECTIVE = 7
STATUS_REVISION_APPROVED = 10
STATUS_REVISION_REJECTED = 11
STATUS_OBSOLETE_IDS = (12, 15)


def _can_decide_revision(user):
    return is_admin_user(user) or user_in_groups(user, *settings.REVISION_APPROVER_GROUPS)


def _open_revision_draft(document):
    """A newer, not-yet-obsolete version of this document already exists."""
    current = version_key(document.version)
    siblings = Document.objects.filter(document_number=document.document_number).exclude(
        id=document.id
    ).exclude(document_current_status_id__in=STATUS_OBSOLETE_IDS)
    return any(version_key(doc.version) > current for doc in siblings)


def _create_revision_draft(document, status_revision, approved_by):
    new_document = Document.objects.create(
        user=document.user,  # original creator keeps ownership (department, listings, reports)
        author=document.author,
        parent_document=document.parent_document,
        is_parent=document.is_parent,
        document_title=document.document_title,
        document_number=document.document_number,
        document_type=document.document_type,
        document_description=document.document_description,
        document_operation=document.document_operation,
        workflow=document.workflow,
        revision_month=document.revision_month,
        select_template=document.select_template,
        form_status=document.form_status,
        document_current_status=status_revision,
        version=increment_version(document.version),
        training_required=document.training_required,
        product_code=document.product_code,
        equipment_id=document.equipment_id,
        generatefile=document.generatefile,
        approver=document.approver,
        doc_admin=document.doc_admin,
        is_effective=document.is_effective,
    )
    new_document.visible_to_users.set(document.visible_to_users.all())
    new_document.job_roles.set(document.job_roles.all())
    DocumentVersion.objects.create(document=new_document, version_number=new_document.version, updated_by=approved_by)

    latest_file = NewDocumentCommentsData.objects.filter(document=document).order_by('-created_at').first()
    if latest_file and latest_file.front_file_url:
        NewDocumentCommentsData.objects.create(
            user=latest_file.user,
            document=new_document,
            front_file_url=latest_file.front_file_url.name,
            version_no=new_document.version,
            department=latest_file.department,
        )

    # Copy this document's own question bank (not the parent's) and its active quizzes.
    question_map = {}
    for question in TrainingQuestions.objects.filter(document=document):
        old_id = question.id
        question.pk = None
        question.id = None
        question.document = new_document
        question.created_by = approved_by
        question.save()
        question_map[old_id] = question
    for quiz in TrainingQuiz.objects.filter(document=document, status=True):
        quiz_questions = list(quiz.questions.all())
        quiz.pk = None
        quiz.id = None
        quiz.document = new_document
        quiz.save()
        for quiz_question in quiz_questions:
            copied = question_map.get(quiz_question.question_id)
            if copied:
                QuizQuestion.objects.create(quiz=quiz, question=copied, marks=quiz_question.marks)
    return new_document


class MasterCopyUserDropdownViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('-id')
    serializer_class = SimpleUserSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = SimpleUserSerializer(queryset, many=True)
            data = serializer.data
            return Response({"status": True, "message": "User list fetched successfully", "data": data})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})
        

class OtherUserDropdownViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('-id')
    serializer_class = SimpleUserSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = SimpleUserSerializer(queryset, many=True)
            data = serializer.data
            return Response({"status": True, "message": "User list fetched successfully", "data": data})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})


class DynamicInventoryCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DynamicInventory.objects.all()
    serializer_class = DynamicInventorySerializer

    def create(self, request, *args, **kwargs):
        try:
            inventory_name = request.data.get('inventory_name')
            if not inventory_name:
                return rollback_response({"status": False, "message": "Inventory name is required"})

            dynamic_inventory = DynamicInventory.objects.create(inventory_name=inventory_name)
            serializer = DynamicInventorySerializer(dynamic_inventory)
            return Response({"status": True, "message": "Dynamic inventory created successfully", "data": serializer.data})

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

class DynamicInventoryListViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DynamicInventory.objects.all().order_by('-id')
    serializer_class = DynamicInventorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['inventory_name']
    ordering_fields = ['inventory_name', 'created_at']

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                "status": True,
                "message": "Dynamic inventories fetched successfully",
                'total': queryset.count(),
                'data': serializer.data
            })

        except Exception as e:
            return rollback_response({"status": False, 'message': 'Something went wrong', 'error': str(e)})

class DynamicInventoryUpdateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DynamicInventorySerializer
    queryset = DynamicInventory.objects.all()
    lookup_field = 'inventory_id'

    def update(self, request, *args, **kwargs):
        try:
            # Retrieve the inventory_id from the URL
            inventory_id = self.kwargs.get('inventory_id')
            
            # Retrieve inventory_name from the request data
            inventory_name = request.data.get('inventory_name')
            if not inventory_name:
                raise ValidationError("The field 'inventory_name' is required and cannot be null.")

            # Retrieve the inventory instance and update
            dynamic_inventory = DynamicInventory.objects.get(id=inventory_id)
            dynamic_inventory.inventory_name = inventory_name
            dynamic_inventory.save()

            # Serialize and return the updated data
            serializer = DynamicInventorySerializer(dynamic_inventory)
            return Response({
                "status": True, 
                "message": "Dynamic inventory updated successfully", 
                "data": serializer.data
            })

        except DynamicInventory.DoesNotExist:
            return rollback_response({
                "status": False, 
                "message": "Dynamic inventory not found"
            })

        except ValidationError as ve:
            return rollback_response({
                "status": False, 
                "message": str(ve)
            })

        except Exception as e:
            return rollback_response({
                "status": False, 
                "message": "Something went wrong", 
                "error": str(e)
            })

class DynamicInventoryDeleteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DynamicInventory.objects.all()
    serializer_class = DynamicInventorySerializer
    lookup_field = 'inventory_id'

    def destroy(self, request, *args, **kwargs):
        try:
            inventory_id = self.kwargs.get('inventory_id')
            dynamic_inventory = DynamicInventory.objects.get(id=inventory_id)
            dynamic_inventory.delete()
            return Response({"status": True, "message": "Dynamic inventory deleted successfully"})

        except DynamicInventory.DoesNotExist:
            return rollback_response({"status": False, "message": "Dynamic inventory not found"})
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})
        


class DocumentCommentCreateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentComments.objects.all().order_by('-created_at')

    def create(self, request):
        try:
            document_id = request.data.get('document')
            comment_description = request.data.get('comment_description', {})
            
            # Ensure required fields are provided
            if not document_id:
                return rollback_response({'status': False, 'message': 'Document ID is required'})
            if not comment_description:
                return rollback_response({'status': False, 'message': 'Comment description is required'})

            # Create the comment
            comment_obj = DocumentComments.objects.create(
                user=self.request.user,
                document_id=document_id,
                Comment_description=comment_description
            )
            return Response({'status': True, 'message': 'Comment added successfully'})
        except Exception as e:
            return rollback_response({'status': False, 'message': 'Something went wrong', 'error': str(e)})
        
class DocumentCommentsViewSet(viewsets.ModelViewSet):
    queryset = DocumentComments.objects.all().order_by('-created_at')
    serializer_class = DocumentCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'document_id'


    def list(self, request, *args, **kwargs):
        try:
            document_id = self.kwargs.get('document_id')
            queryset = self.filter_queryset(self.get_queryset())

            if document_id:
                queryset = queryset.filter(document_id=document_id)

            serializer = DocumentCommentSerializer(queryset, many=True)
            data = serializer.data
            return Response({"message": "Comment list fetched successfully", "data": data})
        except Exception as e:
            return Response({"message": str(e), "data": []})
        
class DocumentCommentDeleteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'comment_id'

    def destroy(self, request, *args, **kwargs):
        try:
            comment_id = self.kwargs.get('comment_id')
            document_comment = DocumentComments.objects.get(id=comment_id)
            document_comment.delete()
            return Response({"message": "Comment deleted successfully"})

        except DocumentComments.DoesNotExist:
            return Response({"message": "Comment not found"})
        except Exception as e:
            return Response({"message": "Something went wrong", "error": str(e)})
        

class DocumentDetailViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'document_id'
    
    def list(self, request, *args, **kwargs):
        document_id = self.kwargs.get('document_id')

        if not document_id:
            return rollback_response({"status": False, "message": "document_id parameter is required"})

        try:
            document = Document.objects.get(id=document_id)
            serializer = DocumentDetailSerializer(document)
            return Response({
                "status": True,
                "message": "Document details fetched successfully",
                "data": serializer.data
            })
        except Document.DoesNotExist:
            return rollback_response({"status": False, "message": "Document not found"})
        
class DocumentDraftStatusViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Document.objects.all()

    def update(self, request, *args, **kwargs):
        try:
            user = request.user
            document_id = request.data.get('document_id')
            status_id = request.data.get('status_id')

            # Ensure required fields are provided
            if not document_id:
                return rollback_response({"status": False, "message": "Document ID is required"})
            if not status_id:
                return rollback_response({"status": False, "message": "Status ID is required"})

            # Fetch related document and status objects
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Document ID"})

            try:
                status = DynamicStatus.objects.get(id=status_id)
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Invalid Status ID"})

            # Update the fields in the Document table
            document.document_current_status = status
            document.form_status = "save_draft"
            document.save()

            return Response({"status": True, "message": "Document Drafted successfully"})

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

class DocumentTypeUpdateViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentTypeSerializer
    queryset = DocumentType.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'document_type_id'       

    def update(self, request, *args, **kwargs):
        try:
            # Get document_type_id and new document_name from the request
            document_type_id = self.kwargs.get('document_type_id')
            document_name = request.data.get('document_name')

            # Validate document_type_id and document_name
            if not document_type_id:
                return rollback_response({"status": False, "message": "Document type ID is required", "data": []})
            if not document_name:
                return rollback_response({"status": False, "message": "Document name is required", "data": []})

            # Fetch the DocumentType instance
            document_type = DocumentType.objects.filter(id=document_type_id).first()
            if not document_type:
                return rollback_response({"status": False, "message": "Document type not found", "data": []})

            # Update the document_name
            document_type.document_name = document_name
            document_type.save()

            # Serialize the updated instance
            serializer = DocumentTypeSerializer(document_type)
            return Response({"status": True, "message": "Document type updated successfully"})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})


# class DepartmentUsersViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAuthenticated]
#     serializer_class = CustomUserdataSerializer

#     def list(self, request, *args, **kwargs):
#         try:
#             # Get the document ID from the request
#             document_id = request.data.get('document_id', None)
#             if not document_id:
#                 return Response({
#                     "status": False,
#                     "message": "Document ID is required.",
#                     "data": []
#                 })

#             # Fetch the document and ensure it exists
#             try:
#                 document = Document.objects.get(id=document_id)
#             except Document.DoesNotExist:
#                 return Response({
#                     "status": False,
#                     "message": "Document not found.",
#                     "data": []
#                 })

#             # Fetch users associated with the document from the DocApprove model
#             approved_users = CustomUser.objects.filter(
#                 docapprove__document=document
#             ).distinct()

#             # Serialize the filtered users
#             serializer = self.serializer_class(approved_users, many=True, context={'request': request})
#             return Response({
#                 "status": True,
#                 "message": "Users fetched successfully.",
#                 "data": serializer.data,
#             })
#         except Exception as e:
#             return Response({
#                 "status": False,
#                 "message": str(e),
#                 "data": [],
#             })


class DepartmentUsersViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'document_id'

    def list(self, request, *args, **kwargs):
        try:
            # Get the document ID from the request
            document_id = self.kwargs.get('document_id')
            if not document_id:
                return rollback_response({
                    "status": False,
                    "message": "Document ID is required.",
                    "data": []
                })

            # Fetch the users linked to the document ID in the DocApprove model
            document = Document.objects.filter(id=document_id).first()
            if not document:
                return rollback_response({
                    "status": False,
                    "message": "No users found for the given document ID.",
                    "data": []
                })

            # Prepare data for response
            response_data = []
            if document.author:
                response_data.append({
                    "id": document.author.id,
                    "first_name": f"{document.author.first_name} (Author)",
                    "group_id": [group.id for group in document.author.groups.all()]
                })

            # Return the response
            return Response({
                "status": True,
                "message": "Users fetched successfully.",
                "data": response_data,
            })
        except Exception as e:
            return rollback_response({
                "status": False,
                "message": str(e),
                "data": [],
            })

class PrinterMachines(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            user = self.request.user
            printer_name = request.data.get('printer_name')
            printer_description = request.data.get('printer_location')

            if not printer_description:
                return rollback_response({'status':False,'message':'Print Location is required'})
            
            if not printer_name:
                return rollback_response({'status':False,'message':'Print Name is required'})
            
            printer_obj = PrinterMachinesModel.objects.create(
                user = user,
                printer_name = printer_name,
                printer_description = printer_description
            )
            return Response({'status': True, 'message': 'Printer Added successfully'})
        except Exception as e:
            return rollback_response({'status': False, 'message': 'Something went wrong', 'error': str(e)})
    
    def list(self, request):
        queryset = PrinterMachinesModel.objects.all().order_by('-id')
        
        try:
            if queryset.exists():
                serializer = PrinterSerializer(queryset, many=True)
                return Response({
                    "status": True,
                    "message": "Printer Machine fetched successfully",
                    'total': queryset.count(),
                    'data': serializer.data
                })
            else:
                return Response({
                    "status": True,
                    "message": "No Printers found",
                    "total": 0,
                    "data": []
                })
        except Exception as e:
            return rollback_response({"status": False, 'message': 'Something went wrong', 'error': str(e)})


class PrinterMachinesUpdate(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'printer_id'

    def update(self, request, *args, **kwargs):
        try:
            printer_id = self.kwargs.get("printer_id")
            printer_name = request.data.get('printer_name')
            printer_description = request.data.get('printer_location')
    
            printer_obj = PrinterMachinesModel.objects.get(id=printer_id)
            if printer_name:
                printer_obj.printer_name = printer_name
            if printer_description:
                printer_obj.printer_description = printer_description
            printer_obj.save()
    
            return Response({'status': True, 'message': 'Print machine updated successfully'})
        except PrinterMachinesModel.DoesNotExist:
            return rollback_response({'status': False, 'message': 'Print not found'})
        except Exception as e:
            return rollback_response({'status': False, 'message': 'Something went wrong', 'error': str(e)})
        
    def destroy(self, request, *args, **kwargs):
        try:
            printer_id = request.data.get('printer_id')   

            if not PrinterMachinesModel.objects.get(id=printer_id):
                return rollback_response({"status":False, "message":"Print machine id not found"})
                     
            printer_object = PrinterMachinesModel.objects.get(id=printer_id)
            printer_object.delete()
            return Response({"status":True, "message":"Printer deleted succesfully"})
        except Exception as e:
                return rollback_response({"status": False,'message': 'Something went wrong','error': str(e)})


class DocumentReviseRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DocumentRevisionRequestAction.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            document_id = request.data.get('document_id')
            revise_description = (request.data.get('revise_description') or '').strip()

            if not document_id:
                return fail("Document ID is required")
            if not revise_description:
                return fail("Revise description is required")

            document = Document.objects.filter(id=document_id).first()
            if not document:
                return fail("Invalid document ID", http_status=404)
            if document.document_current_status_id != STATUS_EFFECTIVE:
                return fail("Only effective documents can be revised.")
            if _open_revision_draft(document):
                return fail("A revision of this document is already in progress.")

            pending = DocumentRevisionRequestAction.objects.filter(
                document=document, status=REVISION_PENDING, is_revise=True
            ).order_by('-created_at').first()
            if pending and pending.user_id != user.id:
                return fail("A revision request for this document is already pending approval.")

            if pending:
                pending.revise_description = revise_description
                pending.save(update_fields=['revise_description'])
            else:
                DocumentRevisionRequestAction.objects.create(
                    user=user,
                    document=document,
                    revise_description=revise_description,
                    status=REVISION_PENDING,
                    is_revise=True,
                )

            return Response({"status": True, "message": "Revise request created successfully", "data": {}})
        except Exception as e:
            return server_error(e)


class DocumentReviseRequestGetViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(document_current_status_id=STATUS_EFFECTIVE)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        user_groups = request.user.groups.values_list('id', flat=True)
        group_id = user_groups[0] if user_groups else None

        pending_ids = set(
            DocumentRevisionRequestAction.objects.filter(
                document__in=queryset, status=REVISION_PENDING, is_revise=True
            ).values_list('document_id', flat=True)
        )
        data = serializer.data
        for doc in data:
            # is_revise = a revision request is waiting for approval
            doc['is_revise'] = doc['document_id'] in pending_ids
            doc['can_approve_revision'] = doc['is_revise'] and _can_decide_revision(request.user)

        return Response({
            "status": True,
            "message": "Effective documents retrieved successfully",
            "user_group_id": group_id,
            "pending_revise_count": len(pending_ids),
            "data": data,
        })

class ApprovedPrintRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApprovedPrintRequestSerializer

    def list(self, request, *args, **kwargs):
        """List only approved print requests (status ID = 9)."""
        try:
            queryset = PrintRequestApproval.objects.filter(status__id=9)

            if queryset.exists():
                serializer = self.get_serializer(queryset, many=True)
                return Response({
                    "status": True,
                    "message": "Approved print requests fetched successfully",
                    'total': queryset.count(),
                    'data': serializer.data
                })
            else:
                return Response({
                    "status": True,
                    "message": "No approved print requests found",
                    "total": 0,
                    "data": []
                })
        except Exception as e:
            return rollback_response({"status": False, 'message': 'Something went wrong', 'error': str(e)})
        

class ApprovalNumberViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApprovalNumberSerializer
    queryset = ApprovalNumber.objects.all()

    def list(self, request, *args, **kwargs):
        print_request_approval_id = self.kwargs.get('print_request_approval_id')

        if not print_request_approval_id:
            return Response({"message": "PrintRequestApproval ID is required."})

        try:
            # Get the ApprovalNumbers related to the given PrintRequestApproval
            approval_numbers = ApprovalNumber.objects.filter(
                printrequestapproval__id=print_request_approval_id
            )

            # Get the retrival_numbers associated with the given PrintRequestApproval
            retrival_numbers = RetrivalNumber.objects.filter(
                printrequestapproval__id=print_request_approval_id
            ).values_list('retrival_number', flat=True)

            # Filter out the ApprovalNumbers whose number is already in RetrivalNumbers
            filtered_approval_numbers = approval_numbers.exclude(
                number__in=retrival_numbers
            )

            # Serialize the filtered ApprovalNumbers
            serializer = self.get_serializer(filtered_approval_numbers, many=True)

            return Response({
                'print_request_approval_id': print_request_approval_id,
                'approval_numbers': serializer.data
            })

        except PrintRequestApproval.DoesNotExist:
            return Response({"message": "PrintRequestApproval with the given ID does not exist."})


class PrintRequestApprovalViewSet(viewsets.ModelViewSet):
    """Records retrieval (return) of printed copies. Only copy numbers that were
    issued under this approval can be retrieved."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = PrintRequestApproval.objects.all()
    serializer_class = RetrivalNumberSerializer

    def create(self, request, *args, **kwargs):
        if not (is_admin_user(request.user) or user_in_groups(request.user, 'Doc Admin', 'QA')):
            return fail('Only Doc Admin users can record retrievals.', http_status=403)
        print_request_approval_id = request.data.get('print_request_approval_id')
        retrival_numbers_data = request.data.get('retrival_numbers', [])
        if not print_request_approval_id:
            return fail("print_request_approval_id is required")
        if not isinstance(retrival_numbers_data, list) or not retrival_numbers_data:
            return fail("retrival_numbers should be a non-empty list")

        approval = PrintRequestApproval.objects.filter(id=print_request_approval_id).first()
        if not approval:
            return fail("PrintRequestApproval not found", http_status=404)
        issued = set(approval.approval_numbers.values_list('number', flat=True))
        unknown = [number for number in retrival_numbers_data if number not in issued]
        if unknown:
            return fail(f"These copy numbers were not issued under this approval: {', '.join(map(str, unknown))}")

        for number in retrival_numbers_data:
            retrival_number, _ = RetrivalNumber.objects.get_or_create(retrival_number=number)
            approval.retrival_numbers.add(retrival_number)
        return Response({"status": True, "message": "Retrival numbers added successfully"})

class RetrivalNumbersViewSet(viewsets.ModelViewSet):

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RetrivalNumberSerializer
    queryset = RetrivalNumber.objects.all()

    def list(self, request, *args, **kwargs):
        print_request_approval_id = self.kwargs.get('print_request_approval_id')

        if not print_request_approval_id:
            return Response({"message": "PrintRequestApproval ID is required."}, status=400)

        try:
            print_request_approval = PrintRequestApproval.objects.get(id=print_request_approval_id)

            retrival_numbers = print_request_approval.retrival_numbers.all()

            serializer = self.get_serializer(retrival_numbers, many=True)

            return Response({
                "print_request_approval_id": print_request_approval_id,
                "retrival_numbers": serializer.data
            })

        except PrintRequestApproval.DoesNotExist:
            return Response(
                {"message": "PrintRequestApproval with the given ID does not exist."}
            )
        
        
class DocumentwiseIdViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            document_id = self.kwargs.get('document_id', None)

            if document_id:
                queryset = Document.objects.filter(id=document_id)
            else:
                return rollback_response({
                    "status": False,
                    "message": "Document ID is required",
                }, status=400)

            queryset = self.filter_queryset(queryset)

            if queryset.exists():
                serializer = self.serializer_class(queryset, many=True, context={'request': request})
                return Response({
                    "status": True,
                    "message": "Documents fetched successfully",
                    'total': queryset.count(),
                    "data": serializer.data,
                })
            else:
                return Response({
                    "status": True,
                    "message": "No Documents found",
                    "total": 0,
                    "data": [],
                })
        except Exception as e:
            return rollback_response({
                "status": False,
                'message': 'Something went wrong',
                'error': str(e)
            })

class AllDocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Document.objects.all()
    serializer_class = AllDocumentSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.queryset.filter(document_type_id=1).exclude(document_current_status=15).exclude(document_current_status=12).exclude(document_current_status=7).exclude(document_current_status=6)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "status": True,
            "message": "Documents fetched successfully",
            "total": queryset.count(),
            "data": serializer.data
        })

    
class ParentDocumentViewSet(viewsets.ModelViewSet):
    """Child documents (Annexures / Formats) of a document. The latest version
    of a parent also shows children created under its earlier versions, since
    all versions share the same document number."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AllDocumentSerializer
    queryset = Document.objects.all()

    def list(self, request, *args, **kwargs):
        document = Document.objects.filter(id=self.kwargs.get('document_id')).first()
        if not document:
            return rollback_response({"status": False, "message": "Document not found", "data": []})

        all_versions = list(Document.objects.filter(document_number=document.document_number))
        latest_key = max(version_key(doc.version) for doc in all_versions)
        if version_key(document.version) >= latest_key:
            document_ids = [doc.id for doc in all_versions]
        else:
            document_ids = [document.id]

        queryset = Document.objects.filter(parent_document_id__in=document_ids).exclude(
            document_current_status__in=[12, 15]
        ).order_by('id')
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "status": True,
            "message": "Documents fetched successfully" if queryset.exists() else "No documents found",
            "total": queryset.count(),
            "data": serializer.data,
        })

class DocumentTimelineViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'document_id'

    def list(self, request, *args, **kwargs):
        document_id = self.kwargs.get('document_id')

        if not document_id:
            return Response(
                {"error": "document_id is required in query parameters"})

        data = {}

        data['author_approvals'] = DocumentAuthorApproveActionSerializer(
            DocumentAuthorApproveAction.objects.filter(document_id=document_id), many=True
        ).data

        data['reviewer_actions'] = DocumentReviewerActionSerializer(
            DocumentReviewerAction.objects.filter(document_id=document_id), many=True
        ).data

        data['approver_actions'] = DocumentApproverActionSerializer(
            DocumentApproverAction.objects.filter(document_id=document_id), many=True
        ).data

        data['doc_admin_actions'] = DocumentDocAdminActionSerializer(
            DocumentDocAdminAction.objects.filter(document_id=document_id), many=True
        ).data

        data['send_back_actions'] = DocumentSendBackActionSerializer(
            DocumentSendBackAction.objects.filter(document_id=document_id), many=True
        ).data

        data['release_actions'] = DocumentReleaseActionSerializer(
            DocumentReleaseAction.objects.filter(document_id=document_id), many=True
        ).data

        data['effective_actions'] = DocumentEffectivenewActionSerializer(
            DocumentEffectiveAction.objects.filter(document_id=document_id), many=True
        ).data

        data['revision_actions'] = DocumentRevisionActionSerializer(
            DocumentRevisionAction.objects.filter(document_id=document_id), many=True
        ).data

        data['revision_requests'] = DocumentRevisionRequestActionSerializer(
            DocumentRevisionRequestAction.objects.filter(document_id=document_id), many=True
        ).data

        return Response(data)


class DocAdminUpdateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Document.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            document = request.data.get('document_id')
            status_id = request.data.get('status')

            if not document:
                return rollback_response({"status": False, "message": "Document are required"})
            if not status_id:
                return rollback_response({"status": False, "message": "Status is required"})
            
            document = Document.objects.get(id=document)
            status = DynamicStatus.objects.get(id=status_id)
            
            document_action = DocumentObsoleteAction.objects.create(
                user=user,
                document=document,
                status=status
            )

            document.document_current_status = status
            document.save() 
            return Response({"status": True, "message": "Status change to Obsolete successfully"})

        except DynamicStatus.DoesNotExist:
            return rollback_response({"status": False, "message": "Invalid status ID"})
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})




class DocumentCertificatePdfExportView(viewsets.ViewSet):
    """Generates the controlled-copy PDF: cover page (document metadata, review
    date and signature/approval trail) merged with the document itself."""
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'document_id'

    def list(self, request, *args, **kwargs):
        document_id = kwargs.get('document_id')
        try:
            document = Document.objects.filter(id=document_id).first()
            if not document:
                return rollback_response({"status": False, "message": "Document not found", "data": ""}, status=404)

            latest_file = NewDocumentCommentsData.objects.filter(document=document).order_by("-created_at").first()
            docx_path = latest_file.front_file_url.path if latest_file and latest_file.front_file_url else None

            context = {
                'document': document,
                'review_date': compute_review_date(document),
                'all_actions': self.get_document_actions(document),
                'logo': self.logo_path(),
            }
            html = get_template('document_cover_page.html').render(context)

            out_dir = os.path.join(settings.MEDIA_ROOT, 'document_cover')
            os.makedirs(out_dir, exist_ok=True)
            base = f"document_certificate_cover_{document.id}_{uuid4().hex[:8]}"
            cover_pdf = os.path.join(out_dir, f"{base}.pdf")
            with open(cover_pdf, 'wb') as output_file:
                pisa_status = pisa.CreatePDF(html, dest=output_file)
            if pisa_status.err:
                return rollback_response({"status": False, "message": "Error occurred while generating the cover page", "data": ""}, status=500)

            final_pdf = cover_pdf
            merged = False
            merge_message = None
            if not docx_path or not os.path.exists(docx_path):
                merge_message = "No saved document file was found; only the cover page was generated."
            else:
                body_pdf = convert_docx_file_to_pdf(docx_path, out_dir, f"{base}_body.pdf")
                if body_pdf:
                    final_pdf = os.path.join(out_dir, f"{base}_final.pdf")
                    merger = PdfMerger()
                    merger.append(cover_pdf)
                    merger.append(body_pdf)
                    merger.write(final_pdf)
                    merger.close()
                    merged = True
                else:
                    merge_message = "The document could not be converted to PDF; only the cover page was generated."

            pdf_file_url = f"{settings.MEDIA_URL}document_cover/{os.path.basename(final_pdf)}"
            return Response({
                "status": True,
                "message": "PDF generated successfully" if merged else merge_message,
                "merged": merged,
                "data": request.build_absolute_uri(pdf_file_url),
            })
        except Exception as e:
            logger.exception("Cover page generation failed for document %s", document_id)
            return rollback_response({"status": False, "message": "Could not generate the PDF", "data": ""}, status=500)

    @staticmethod
    def logo_path():
        candidates = [
            os.path.join(settings.BASE_DIR, 'static', 'certificate_logo_image', 'logo.png'),
            os.path.join(settings.BASE_DIR, 'templates', 'logo.jpeg'),
        ]
        return next((path for path in candidates if os.path.exists(path)), candidates[0])

    def get_document_actions(self, document):
        actions = []
        author_action = DocumentAuthorApproveAction.objects.filter(document=document).order_by('-created_at').first()
        if author_action:
            author_action.role = "Author"
            actions.append(author_action)

        # Every assigned reviewer's latest review (no artificial limit on reviewer count).
        latest_by_reviewer = OrderedDict()
        for action in DocumentReviewerAction.objects.filter(document=document).order_by('created_at'):
            latest_by_reviewer[action.user_id] = action
        for action in latest_by_reviewer.values():
            action.role = "Reviewer"
            actions.append(action)

        approver_action = DocumentApproverAction.objects.filter(document=document).order_by('-created_at').first()
        if approver_action:
            approver_action.role = "Approver"
            actions.append(approver_action)

        doc_admin_action = DocumentDocAdminAction.objects.filter(document=document).order_by('-created_at').first()
        if doc_admin_action:
            doc_admin_action.role = "Doc Admin"
            actions.append(doc_admin_action)
        return actions


def compute_review_date(document):
    """Next review date: the stored revision date, otherwise effective date +
    revision period (months). None until the document becomes effective."""
    if document.revision_date:
        return document.revision_date
    if document.effective_date and str(document.revision_month or '').strip().isdigit():
        return document.effective_date + relativedelta(months=int(str(document.revision_month).strip()))
    return None


def convert_docx_file_to_pdf(docx_path, out_dir, pdf_name):
    """Convert a .docx to PDF. Returns the PDF path, or None on failure.
    Linux/macOS: LibreOffice writes '<docx basename>.pdf' into --outdir, so we
    convert into a private temp dir and move the result to the wanted name."""
    import shutil
    import subprocess
    import tempfile

    target = os.path.join(out_dir, pdf_name)
    try:
        if platform.system() == "Windows":
            convert(docx_path, target)
        else:
            with tempfile.TemporaryDirectory() as tmp_dir:
                subprocess.run(
                    ["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp_dir, docx_path],
                    check=True, timeout=180, capture_output=True,
                )
                produced = os.path.join(tmp_dir, os.path.splitext(os.path.basename(docx_path))[0] + ".pdf")
                if not os.path.exists(produced):
                    logger.error("LibreOffice did not produce %s", produced)
                    return None
                shutil.move(produced, target)
    except Exception:
        logger.exception("DOCX to PDF conversion failed for %s", docx_path)
        return None
    return target if os.path.exists(target) and os.path.getsize(target) > 0 else None
            


class GetDocumentCertificateDataListViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'document_id'
    
    def list(self, request, *args, **kwargs):
        document_id = kwargs.get('document_id')
        try:
            # Fetch the document
            document = Document.objects.get(id=document_id)
            
            # Fetch all actions for the document
            all_actions = self.get_document_actions(document)
            
            # Prepare data to return in the response
            document_data = {
                'document_id': document.id,
                'document_title': document.document_title,
                'document_number': document.document_number,
                'version': document.version,
                'department': document.user.department.department_name,
                'effective_date': document.effective_date.strftime('%d-%m-%Y') if document.effective_date else None,
                'revision_date': document.revision_date.strftime('%d-%m-%Y') if document.revision_date else None,
            }
            # Collect actions data
            actions_data = []
            for action in all_actions:
                action_data = {
                    'role': action.user.groups.first().name if action.user.groups.exists() else "No Role",
                    'department': action.user.department.department_name if action.user.department else "No Department",
                    'designation': action.user.designation if action.user.designation else "No Designation",
                    'user_name': f"{action.user.first_name} {action.user.last_name}",
                    'created_at': action.created_at.strftime('%d-%m-%Y')
                }
                actions_data.append(action_data)

            # Combine document data and actions
            response_data = {
                'document': document_data,
                'actions': actions_data
            }
            return Response({"status": True,"message": "Data fetched successfully","data": response_data})

        except Document.DoesNotExist:
            return rollback_response({"status": False,"message": "Document not found","data": ""})
        except Exception as e:
            return rollback_response({"status": False,"message": str(e),"data": ""})

    def get_document_actions(self, document):
        actions = []
        action_models = [
            DocumentAuthorApproveAction,
            DocumentReviewerAction,
            DocumentApproverAction,
            DocumentDocAdminAction,
            DocumentSendBackAction,
            DocumentReleaseAction,
            DocumentEffectiveAction,
            DocumentRevisionAction,
        ]
        
        for model in action_models:
            actions.extend(model.objects.filter(document=document).order_by('created_at'))
        
        return actions

    def get_roles(self, user):
        roles = []
        if user.groups.exists():
            for group in user.groups.all():
                roles.append(group.name)
        else:
            roles.append("No Role")
        return roles


from PyPDF2 import PdfMerger
from docx2pdf import convert
from collections import OrderedDict
import platform




class DocumentNintyDaysDataViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            current_time = timezone.localtime(timezone.now())
            is_doc_admin = user.groups.filter(name="Doc Admin").exists()

            ninety_days_from_now = current_time + timedelta(days=90)
            documents = Document.objects.filter(revision_date__gte=current_time, revision_date__lte=ninety_days_from_now)

            if is_doc_admin:
                department = request.query_params.get('department_id', None)
                if department:
                    documents = documents.filter(user__department=department)
            else:
                user_department = user.department
                documents = documents.filter(user__department=user_department)

            document_count = documents.count()

            serializer = DocumentviewSerializer(documents, many=True, context={'request': request})
            data = serializer.data

            return Response({"status": True,"message": "Documents fetched successfully","data_count": document_count,"data": data})
        except Exception as e:
            return rollback_response({"status": False,'message': 'Something went wrong','error': str(e)})
        
        
class ArchivedDocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Archived.objects.all()
    serializer_class = ArchivedSerializer

    def list(self, request, *args, **kwargs):
        document_id = self.kwargs.get('document_id')
        
        if not document_id:
            return Response({"error": "document_id is required"})
            
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return rollback_response({'status': False, 'message': 'Document not found'})

        # Fetch the latest Archived entry for the given document
        archived_entry = Archived.objects.filter(document=document).latest('created_at')

        # Prepare the response data using the Archived serializer
        archived_data = ArchivedSerializer(archived_entry).data

        # Add additional fields from the Document model
        response_data = {
            "title": document.document_title,
            "type": document.document_type.document_name,  # Assuming document_type has a `name` field
            "document_number": document.document_number,
            "created_date": document.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "status": document.document_current_status.status,  # Assuming status has `status_name` field
            "version": archived_data['version'],
        }

        return rollback_response({'status': False,'message': 'Document not found.','data': {}})

class UpdateDocumentUserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Archived.objects.all()
    
    def update(self, request, *args, **kwargs):
        try:
            document_id = self.kwargs.get('document_id')
            visible_to_users = request.data.get('visible_to_users', [])
            approver = request.data.get('approver')
            doc_admin = request.data.get('doc_admin')

            # Ensure document_id is provided
            if not document_id:
                return rollback_response({"status": False, "message": "Document ID is required"})

            # Fetch the document
            try:
                document = Document.objects.get(id=document_id)
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Document not found"})

            # Update visible_to_users
            if isinstance(visible_to_users, str):
                import json
                try:
                    visible_to_users = json.loads(visible_to_users)
                except json.JSONDecodeError:
                    return rollback_response({
                        "status": False,
                        "message": "Invalid format for visible_to_users. Provide a valid list of IDs.",
                    })
            if visible_to_users:
                document.visible_to_users.set(visible_to_users)

            # Update approver
            if approver:
                try:
                    approver_user = CustomUser.objects.get(id=approver)
                    document.approver = approver_user
                except CustomUser.DoesNotExist:
                    return rollback_response({"status": False, "message": "Approver user not found"})

            # Update doc_admin
            if doc_admin:
                try:
                    doc_admin_user = CustomUser.objects.get(id=doc_admin)
                    document.doc_admin = doc_admin_user
                except CustomUser.DoesNotExist:
                    return rollback_response({"status": False, "message": "Doc Admin user not found"})

            # Save updated document
            document.save()

            return Response({"status": True, "message": "Document updated successfully"})

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            current_time = timezone.localtime(timezone.now())
            is_doc_admin = user.groups.filter(name="Doc Admin").exists()

            ninety_days_from_now = current_time + timedelta(days=90)
            documents = Document.objects.filter(revision_date__gte=current_time, revision_date__lte=ninety_days_from_now)

            if is_doc_admin:
                department = request.query_params.get('department_id', None)
                if department:
                    documents = documents.filter(user__department=department)
            else:
                user_department = user.department
                documents = documents.filter(user__department=user_department)

            document_count = documents.count()

            serializer = DocumentviewSerializer(documents, many=True, context={'request': request})
            data = serializer.data

            return Response({"status": True,"message": "Documents fetched successfully","data_count": document_count,"data": data})
        except Exception as e:
            return rollback_response({"status": False,'message': 'Something went wrong','error': str(e)})
        
        

class DateWiseDocumentDatacountViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            is_doc_admin = user.groups.filter(name="Doc Admin").exists()
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)

            if error:
                return rollback_response({"status": False,"message": error,"data_count": 0,"data": []})

            if not start_date_obj or not end_date_obj:
                documents = Document.objects.all()
            else:
                documents = Document.objects.filter(created_at__gte=start_date_obj, created_at__lte=end_date_obj)

            if is_doc_admin:
                department = request.query_params.get('department_id', None)
                if department:
                    documents = documents.filter(user__department=department)
            else:
                user_department = user.department
                documents = documents.filter(user__department=user_department)

            document_count = documents.count()

            serializer = DocumentviewSerializer(documents, many=True, context={'request': request})
            data = serializer.data
            return Response({"status": True,"message": "Documents fetched successfully","data_count": document_count,"data": data})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})



class DocumentDataOfStatusIdOne(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            # Fixed status_id = 1 (You can change it to another ID if needed)
            fixed_status_id = 1

            # Fetch the status object for status_id = 1 (Fixed Status)
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            # Filter documents based on the fixed status_id
            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            # Handle department-specific filtering for non-admin users
            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})


class DocumentDataOfStatusIdTwo(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 2
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        
class DocumentDataOfStatusIdThree(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)
    
            fixed_status_id = 3
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})
    
            # Apply filters BEFORE union
            queryset1 = Document.objects.filter(document_current_status=status_obj)
            queryset2 = Document.objects.filter(visible_to_users=user, document_current_status=8)
    
            # Apply department filter before union
            if department_id:
                queryset1 = queryset1.filter(user__department_id=department_id)
                queryset2 = queryset2.filter(user__department_id=department_id)
    
            # Apply date range filter before union
            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                queryset1 = queryset1.filter(created_at__range=[start_date_obj, end_date_obj])
                queryset2 = queryset2.filter(created_at__range=[start_date_obj, end_date_obj])
    
            # Apply additional user-based filtering before union
            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                pass  # No extra filtering needed
            elif user.groups.filter(name='Reviewer').exists():
                queryset1 = queryset1.filter(visible_to_users=user)
                queryset2 = queryset2.filter(visible_to_users=user)
            elif user_department:
                queryset1 = queryset1.filter(user__department=user_department)
                queryset2 = queryset2.filter(user__department=user_department)
    
            # Perform union after all filtering
            queryset = queryset1.union(queryset2).order_by('-id')
    
            document_count = queryset.count()
    
            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True, "message": "Documents fetched successfully", "user_group_ids": list(user_group_ids), "data_count": document_count, "data": serializer.data})
            else:
                return Response({"status": True, "message": "No Documents found", "user_group_ids": list(user_group_ids), "data": []})
    
        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})

        
class DocumentDataOfStatusIdFour(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 4
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        

class DocumentDataOfStatusIdFive(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 5
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        

class DocumentDataOfStatusIdSix(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 6
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        

class DocumentDataOfStatusIdSeven(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 7
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})


class DocumentDataOfStatusIdEight(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 8
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        
class DocumentDataOfStatusIdNine(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 9
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        

class DocumentDataOfStatusIdTen(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 10
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        


class DocumentDataOfStatusIdEleven(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 11
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = DocumentRevisionAction.objects.filter(status_revision=status_obj).order_by('-id')
            print_reject = PrintRequestApproval.objects.filter(status=status_obj).order_by('-id')
            document_count = queryset.count()
            print_reject_count = print_reject.count()
            serializer = DocumentRevisionActionSerializer(queryset, many=True, context={'request': request})
            print_reject_serializer = ApprovedPrintRequestSerializer(print_reject, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","data_count": document_count,"data": serializer.data, 'print_reject_count': print_reject_count,"print_reject_serializer": print_reject_serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        

#printreject data
class PrintRejectDataStatusIdEleven(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApprovedPrintRequestSerializer
    queryset = PrintRequestApproval.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            fixed_status_id = 11
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({
                    "status": False,
                    "message": "Status not found",
                    "data": []
                })

            print_reject = PrintRequestApproval.objects.filter(status=status_obj).order_by('-id')
            print_reject_count = print_reject.count()
            print_reject_serializer = ApprovedPrintRequestSerializer(print_reject, many=True, context={'request': request})

            if print_reject.exists():
                return Response({
                    "status": True,
                    "message": "Print reject data fetched successfully",
                    "data_count": print_reject_count,
                    "data": print_reject_serializer.data
                })
            else:
                return Response({
                    "status": True,
                    "message": "No print reject data found",
                    "data": []
                })

        except Exception as e:
            return rollback_response({
                "status": False,
                "message": "Something went wrong",
                "error": str(e)
            })        

class DocumentDataOfStatusIdTwelve(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 12
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
        

class DocumentDataOfStatusIdThirteen(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all().order_by('-id')

    def list(self, request, *args, **kwargs):
        try:
            user = self.request.user
            user_group_ids = user.groups.values_list('id', flat=True)
            user_department = user.department if user.department else None
            department_id = request.query_params.get('department_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)

            fixed_status_id = 13
            status_obj = DynamicStatus.objects.filter(id=fixed_status_id).first()
            if not status_obj:
                return rollback_response({"status": False, "message": "Status not found", "data": []})

            queryset = Document.objects.filter(document_current_status=status_obj).order_by('-id')

            if user.groups.filter(name='Admin').exists() or user.groups.filter(name='Doc Admin').exists():
                if department_id:
                    queryset = queryset.filter(user__department_id=department_id)
            elif user.groups.filter(name='Reviewer').exists():
                queryset = queryset.filter(visible_to_users=user)
            elif user_department:
                queryset = queryset.filter(user__department=user_department)

            if start_date and end_date:
                start_date_obj, end_date_obj, error = validate_dates(start_date, end_date)
                if error:
                    return rollback_response({"status": False, "message": error, "data": []})
    
                if start_date_obj:
                    start_date_obj = timezone.make_aware(datetime.combine(start_date_obj, datetime.min.time()))
                if end_date_obj:
                    end_date_obj = timezone.make_aware(datetime.combine(end_date_obj, datetime.max.time()))
    
                if start_date_obj and end_date_obj:
                    queryset = queryset.filter(created_at__range=[start_date_obj, end_date_obj])

            document_count = queryset.count()

            serializer = DocumentviewSerializer(queryset, many=True, context={'request': request})
            if queryset.exists():
                return Response({"status": True,"message": "Documents fetched successfully","user_group_ids": list(user_group_ids),"data_count": document_count,"data": serializer.data})
            else:
                return Response({"status": True,"message": "No Documents found","user_group_ids": list(user_group_ids),"data": []})

        except Exception as e:
            return rollback_response({"status": False,"message": "Something went wrong","error": str(e)})
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import jwt
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import hashlib
from rest_framework.decorators import api_view, permission_classes
from django.http import FileResponse
from django.shortcuts import redirect

# def get_editor_config(request):
#     document_url = "http://host.docker.internal:8000/media/templates/SOP_template.docx"  # Ensure this URL is valid and accessible 
#     unique_key = hashlib.sha256(document_url.encode()).hexdigest()

#     document_data = {
#         "fileType": "docx",
#         "key": unique_key,
#         "title": "Sample Document",
#         "url": document_url,  # Direct link to the document
#     }

#     editor_config = {
        
#         "document": document_data,
#         "editorConfig": {
#             # "callbackUrl": "http://127.0.0.1:8000/dms_module/onlyoffice_callback",
#             "callbackUrl": "http://host.docker.internal:8000/dms_module/onlyoffice_callback",
#             "mode": "edit",
#             "user": {"id": "1", "name": "Rohit Sharma"},
#         },
#     }

#     # Secret must match ONLYOFFICE configuration
#     secret = settings.ONLYOFFICE_SECRET  # (value removed from source)
#     token = jwt.encode(editor_config, secret, algorithm="HS256")

#     return JsonResponse({"token": token, **editor_config})
@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def get_editor_config_for_obsolete_doc(request):
    """Read-only OnlyOffice config for an archived/obsolete document file."""
    front_file_url = request.GET.get('front_file_url')
    if not front_file_url:
        return Jsonrollback_response({"status": False, "message": "front_file_url parameter is required"}, status=400)
    if not is_allowed_download_url(front_file_url) and not front_file_url.startswith(settings.BACKEND_PUBLIC_URL):
        return Jsonrollback_response({"status": False, "message": "Document URL is not allowed"}, status=400)
    try:
        document_data = {
            "fileType": "docx",
            "key": hashlib.sha256(front_file_url.encode()).hexdigest(),
            "title": "Document",
            "url": front_file_url,
            "permissions": {"print": False, "download": False, "edit": False},
        }
        return JsonResponse(_signed_editor_config(request, document_data, mode="view"))
    except Exception:
        logger.exception("Obsolete editor config failed")
        return Jsonrollback_response({"status": False, "message": "Could not load the document"}, status=500)
    
@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def get_editor_config(request):
    """OnlyOffice config for the requested document. Opens the latest saved
    version of *this* document; falls back to the file generated from its
    template when it has never been saved."""
    document_id = request.GET.get('document_id')
    is_view = str(request.GET.get('is_view')).lower() in ["true", "1"]
    if not document_id:
        return Jsonrollback_response({"status": False, "message": "document_id parameter is required"}, status=400)
    if request.GET.get('print_mode') == "true":
        return Jsonrollback_response({"status": False, "message": "Printing is restricted.", "document_content": ""}, status=403)

    try:
        doc = Document.objects.filter(id=document_id).first()
        if not doc:
            return Jsonrollback_response({"status": False, "message": "Document not found"}, status=404)

        base_url = settings.BACKEND_PUBLIC_URL
        latest_file = NewDocumentCommentsData.objects.filter(document=doc).order_by("-created_at").first()
        if latest_file and latest_file.front_file_url:
            file_url = f"{base_url}{latest_file.front_file_url.url}"
        else:
            generated_name = doc.generatefile
            if not generated_name:
                # Legacy fallback: file generated for the newest document using the same template.
                template_doc = Document.objects.filter(
                    select_template_id=doc.select_template_id, generatefile__isnull=False
                ).exclude(generatefile="").order_by('-created_at').first()
                generated_name = template_doc.generatefile if template_doc else None
            if not generated_name:
                return Jsonrollback_response({"status": False, "message": "Document file not available. Please open the template first."}, status=404)
            file_url = f"{base_url}{settings.MEDIA_URL}generated_docs/{generated_name}"

        document_data = {
            "fileType": "docx",
            # Key changes whenever the underlying file changes, so OnlyOffice never serves a stale cached copy.
            "key": hashlib.sha256(f"{doc.id}:{file_url}".encode()).hexdigest(),
            "title": doc.document_title or "Untitled Document",
            "url": file_url,
            "permissions": {"print": False, "download": not is_view},
        }
        return JsonResponse(_signed_editor_config(request, document_data, mode="edit"))
    except Exception:
        logger.exception("Editor config failed for document %s", document_id)
        return Jsonrollback_response({"status": False, "message": "Could not load the document"}, status=500)


def _signed_editor_config(request, document_data, mode):
    user = request.user
    editor_config = {
        "document": document_data,
        "editorConfig": {
            "callbackUrl": f"{settings.BACKEND_PUBLIC_URL}/dms_module/onlyoffice_callback",
            "mode": mode,
            "user": {"id": str(user.id), "name": user.get_full_name() or user.username},
        },
    }
    token = jwt.encode(editor_config, settings.ONLYOFFICE_SECRET, algorithm="HS256")
    return {"token": token, **editor_config}
@csrf_exempt
def onlyoffice_callback(request):
    """OnlyOffice document-server callback. Documents are saved through the
    frontend (add_path_url_data_for_comments), so this only acknowledges the
    callback after verifying it was signed with the shared secret."""
    if request.method != "POST":
        return JsonResponse({"error": 1}, status=400)
    try:
        body = json.loads(request.body or b"{}")
        token = body.get("token")
        auth_header = request.headers.get("Authorization", "")
        if not token and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
        if settings.ONLYOFFICE_SECRET:
            if not token:
                return JsonResponse({"error": 1}, status=403)
            jwt.decode(token, settings.ONLYOFFICE_SECRET, algorithms=["HS256"])
        return JsonResponse({"error": 0})
    except jwt.PyJWTError:
        logger.warning("Rejected OnlyOffice callback with an invalid token")
        return JsonResponse({"error": 1}, status=403)
    except Exception:
        logger.exception("OnlyOffice callback failed")
        return JsonResponse({"error": 1}, status=500)



class EmployeeJobRoleView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'employee_id'

    def list(self, request, *args, **kwargs):
        employee_id = kwargs.get('employee_id')
        try:
            user = request.user
            current_date = datetime.now().strftime('%d/%m/%Y')
            employee = CustomUser.objects.get(id=employee_id)
            department = Department.objects.filter(id=employee.department_id).first()
            job_assign = JobAssign.objects.filter(user=employee).first()
            job_roles = ', '.join(job_assign.job_roles.values_list('job_role_name', flat=True)) if job_assign else 'N/A'
            context = {
                'employee_number': employee.employee_number,
                'employee_name': f"{employee.first_name} {employee.last_name}",
                'designation': employee.designation,
                'department': department.department_name if employee.department else 'N/A',
                'joining_date': employee.created_at.strftime('%d/%m/%Y'),
                'company_name': 'Promount Technologies LLP',
                'department_name': department.department_name if employee.department else 'N/A',
                'job_role': job_roles,
                'user': user,
                'current_date': current_date
            }
            template = get_template('employee_job_role.html')
            html = template.render(context)
            timestamp = int(time.time())  # Timestamp in seconds
            filename = f"employee_job_role{timestamp}.pdf"
            file_path = os.path.join(settings.MEDIA_ROOT, 'employee_report', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as output_file:
                pisa_status = pisa.CreatePDF(html, dest=output_file)
            if pisa_status.err:
                return rollback_response({"status": False, "message": "Error occurred while generating PDF", "data": ""})
            
            pdf_file_url = f"{settings.MEDIA_URL}employee_report/{filename}"
            full_pdf_file_url = f"{request.scheme}://{request.get_host()}{pdf_file_url}"
            return Response({"status": True, "message": "PDF generated successfully", "data": full_pdf_file_url})

        except Document.DoesNotExist:
            return rollback_response({"status": False, "message": "Document not found", "data": ""})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": ""})


class EmployeeRecordLogView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        try:
            users = CustomUser.objects.all()

            all_users_data = []
            for user in users:
                if user.department:
                    department_name = user.department.department_name
                else:
                    department_name = "No Department"
                datestatus = AttemptedQuiz.objects.filter(user=user)
                name = Document.objects.filter(user=user)
                classroom = ClassroomAttemptedQuiz.objects.filter(user=user)
                document_number = Document.objects.filter(user=user)
                version = document_number.last().version if document_number.exists() else "No Version"
                # trainer = Trainer.objects.filter(user=user).first()


                for attempt in datestatus:
                    all_users_data.append({
                        'employee_name': user.username,
                        'designation': user.designation,
                        'department_name': department_name,
                        'training_date': attempt.created_at.strftime("%Y-%m-%d"),
                        'training_name': attempt.document.document_title if attempt.document else "No Title",
                        'document_number': attempt.document.document_number if attempt.document else "No Document",
                        'current_version': attempt.document.version if attempt.document else "No Version",
                        'status': "Passed" if attempt.is_pass else "Failed",
                        'trainer_name': "-",  # No trainer for AttemptedQuiz
                    })


                for classroom in classroom:
                    all_users_data.append({
                        'employee_name': user.username,
                        'designation': user.designation,
                        'department_name': department_name,
                        'training_date': classroom.created_at.strftime("%Y-%m-%d"),
                        'training_name': classroom.classroom.classroom_name if classroom.classroom else "No Classroom",
                        'document_number': classroom.classroom.document.document_number if classroom.classroom and classroom.classroom.document else "No Document",
                        'current_version': classroom.classroom.document.version if classroom.classroom and classroom.classroom.document else "No Version",
                        'status': "Passed" if classroom.is_pass else "Failed",
                        'trainer_name': classroom.classroom.trainer.trainer_name if classroom.classroom and classroom.classroom.trainer else "-",
                    })


                # training_date = datestatus.started_at if datestatus else "Not started"
                # status = ["Passed" if session.is_pass else "Failed" for session in datestatus]
                # training_name = [training.document_title for training in name]
                # classroom_name = [attempt.classroom.classroom_name for attempt in classroom if attempt.classroom]
                # classroom_result = ["Passed" if attempt.is_pass else "Failed" for attempt in classroom]
                # document_number = document_number.last().document_number if document_number.exists() else "No Document"
                # trainer_names = list(set([attempt.classroom.trainer.trainer_name for attempt in classroom if attempt.classroom and attempt.classroom.trainer]))

                # title_classroom = " / ".join(training_name + classroom_name) if training_name or classroom_name else "No Training"
                # final_result = " / ".join(status + classroom_result) if status or classroom_result else "No Status"
                # trainer_name = ", ".join(trainer_names) if trainer_names else "-"

                # training_dates = ", ".join([session.created_at.strftime("%Y-%m-%d") for session in datestatus]) if datestatus else "Not started"

                # user_data  = {
                #     'employee_name': user.username,
                #     'designation': user.designation,
                #     'department_name': department_name,
                #     'training_date': training_dates,
                #     'training_name': title_classroom,
                #     'status': final_result,
                #     'document_number': document_number,
                #     'current_version': version,
                #     'trainer_name': trainer_name,
                # }
                # print(user_data)
                # all_users_data.append(user_data)
            context = {'users_data': all_users_data}

            template = get_template('employee_record_log.html')
            html = template.render(context)
            print(html)
            timestamp = int(time.time())
            filename = f"employee_record_log{timestamp}.pdf"
            file_path = os.path.join(settings.MEDIA_ROOT, 'employee_record_log', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as output_file:
                pisa_status = pisa.CreatePDF(html, dest=output_file)
            if pisa_status.err:
                return rollback_response({"status": False, "message": "Error occurred while generating PDF", "data": ""})
            
            pdf_file_url = f"{settings.MEDIA_URL}employee_record_log/{filename}"
            full_pdf_file_url = f"{request.scheme}://{request.get_host()}{pdf_file_url}"
            return Response({"status": True, "message": "PDF generated successfully", "data": full_pdf_file_url})

        except Document.DoesNotExist:
            return rollback_response({"status": False, "message": "Document not found", "data": ""})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": ""})


class EmployeeTrainingNeedIdentyView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'employee_id'

    def list(self, request, *args, **kwargs):
        employee_id = kwargs.get('employee_id')
        try:
            employee = CustomUser.objects.get(id=employee_id)
            user_job_roles = JobRole.objects.filter(job_assigns__user=employee)
            period_from = JobAssign.objects.filter(user=employee).order_by('created_at').values_list('created_at', flat=True).first()
            update_date = JobAssign.objects.filter(user=employee).order_by('-created_at').values_list('created_at', flat=True).first()

            trainings = Document.objects.filter(job_roles__in=user_job_roles).distinct()
            failed_quiz_sessions = AttemptedQuiz.objects.filter(user=employee, is_pass=False)
            users = CustomUser.objects.filter(id__in=failed_quiz_sessions.values_list('user_id', flat=True))

            all_users_data = []
            for user in users:
                department_name = user.department.department_name if user.department else "No Department"
                user_failed_sessions = failed_quiz_sessions.filter(user=user)
                user_training_data = [{
                    'training_name': training.document_title,
                    'training_number': training.document_number,
                } for training in trainings]

                status = "Pass" if user_failed_sessions.first().is_pass else "Failed"

                user_data = {
                    'employee_number': user.employee_number,
                    'employee_name': f"{user.first_name} {user.last_name}",
                    'designation': user.designation,
                    'department_name': department_name,
                    'status': status,
                    'trainings': user_training_data,
                }
                all_users_data.append(user_data)

            context = {
                'printed_by': f"{request.user.first_name} {request.user.last_name}",
                'employee_number': employee.employee_number,
                'employee_name': f"{employee.first_name} {employee.last_name}",
                'period_from': localtime(period_from).strftime('%d/%m/%Y') if period_from else 'N/A',
                'update_date': localtime(update_date).strftime('%d/%m/%Y') if update_date else 'N/A',
                'users_data': all_users_data,
                'current_date': datetime.now().strftime('%d/%m/%Y'),
            }

            template = get_template('training_need_identy.html')
            html = template.render(context)

            timestamp = int(time.time())
            filename = f"employee_training_need_identy{timestamp}.pdf"
            file_path = os.path.join(settings.MEDIA_ROOT, 'employee_training_need_identy', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as output_file:
                pisa_status = pisa.CreatePDF(html, dest=output_file)

            if pisa_status.err:
                return rollback_response({"status": False, "message": "Error occurred while generating PDF", "data": ""})

            pdf_file_url = f"{settings.MEDIA_URL}employee_training_need_identy/{filename}"
            full_pdf_file_url = f"{request.scheme}://{request.get_host()}{pdf_file_url}"
            return Response({"status": True, "message": "PDF generated successfully", "data": full_pdf_file_url})

        except CustomUser.DoesNotExist:
            return rollback_response({"status": False, "message": "User not found", "data": ""})
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": ""})
        

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def download_and_save_docx(request):
    url = request.data.get('url') or request.POST.get('url')
    if not url:
        return Jsonrollback_response({"status": False, "message": "URL parameter is required"}, status=400)
    if not is_allowed_download_url(url):
        return Jsonrollback_response({"status": False, "message": "Downloading from this URL is not allowed"}, status=400)
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        document = DocumentLink()
        document.docxfile.save(f"{uuid4()}.docx", ContentFile(response.content))
        document.save()
        return JsonResponse({"status": True, "file_url": request.build_absolute_uri(document.docxfile.url)})
    except requests.RequestException:
        logger.exception("Downloading edited document failed")
        return Jsonrollback_response({"status": False, "message": "Error downloading the file"}, status=502)
    
class DocumentObsoleteNotificationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def list(self, request, *args, **kwargs):
        try:
            obsolete_documents = Document.objects.filter(document_current_status__id=3)

            if not obsolete_documents.exists():
                return rollback_response({"status": False,"message": "No obsolete documents found."})

            users_notified = []

            for document in obsolete_documents:
                job_roles = document.job_roles.all()
                if not job_roles.exists():
                    return rollback_response({"status": False,"message": "Job roles not found."})
                
                job_role_ids = job_roles.values_list('id', flat=True)
                users = JobAssign.objects.filter(job_roles__in=job_roles).values_list('user_id', flat=True).distinct()
                
                if not users.exists():
                    continue 

                users = CustomUser.objects.filter(id__in=users)
                for user in users:
                    print(f"User: {user.username}, Email: {user.email}")
                user_emails = set(user.email for user in users if user.email)
                
                if user_emails:
                    subject = f"Document {document.document_title} is Obsolete"
                    message = (
                        f"The document '{document.document_title}' with document number "
                        f"'{document.document_number}' has been marked as obsolete. "
                        "Please review the document and take necessary actions."
                    )
                    from_email = settings.DEFAULT_FROM_EMAIL

                    send_mail(
                        subject, message, from_email, list(user_emails), fail_silently=False
                    )

                    users_notified.append({
                        "document_id": document.id,
                        "document_title": document.document_title,
                        "emails_notified": list(user_emails)
                    })

            if not users_notified:
                return rollback_response({"status": False,"message": "No users to notify for the obsolete documents.",})

            return Response({
                "status": True,
                "message": "Emails sent successfully to users assigned to obsolete documents.",
                "data": users_notified
            })

        except Exception as e:
            return rollback_response({"status": False, "message": "Something went wrong", "error": str(e)})
        



class AddNewDocumentCommentsdataViewSet(viewsets.ModelViewSet):
    """Saves the edited document file (downloaded from OnlyOffice) as the new
    current file of a document, together with the reviewer comments."""
    queryset = NewDocumentCommentsData.objects.all().order_by('-id')
    serializer_class = AddNewDocumentCommentsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            document_id = request.data.get('document_id')
            comment_data = request.data.get('comment_data')
            version_no = request.data.get('version_no')
            front_file_url = request.data.get('front_file_url')
            department_id = request.data.get('department_id')

            if not front_file_url:
                return fail("front_file_url parameter is required")
            if not is_allowed_download_url(front_file_url):
                return fail("Downloading from this URL is not allowed")

            document_data = Document.objects.filter(id=document_id).first()
            if not document_data:
                return fail("Document not found", http_status=404)

            # Department is informational; fall back to the author's department instead of
            # failing the save (users without a department previously lost their edits).
            department = None
            if department_id not in (None, "", "null", "undefined", "N/A"):
                department = Department.objects.filter(id=department_id).first()
            if department is None:
                department = user.department or (document_data.user.department if document_data.user else None)

            response = requests.get(front_file_url, timeout=60)
            if response.status_code != 200:
                return fail("Failed to download the file from the provided URL", http_status=502)

            created = NewDocumentCommentsData(
                user=user,
                document=document_data,
                comment_data=comment_data,
                version_no=version_no,
                department=department,
            )
            created.front_file_url.save(f"{uuid4()}.docx", ContentFile(response.content), save=False)
            created.save()

            serializer = AddNewDocumentCommentsSerializer(created)
            return Response({
                "status": True,
                "message": "Document comments created successfully",
                "data": serializer.data,
                "file_url": request.build_absolute_uri(created.front_file_url.url),
            })
        except Exception as e:
            return server_error(e, "Could not save the document")

from dateutil.relativedelta import relativedelta
from datetime import datetime
class DocumentEffectiveViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentEffectiveSerializer

    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            document_id = request.data.get('document')
            status = request.data.get('status')
            revision_month = request.data.get('revision_month')  # <-- new input

            if not document_id or not status:
                return rollback_response({"status": False, "message": "document_id and effective_date are required", "data": []})
        
            try:
                document_data = Document.objects.filter(id=document_id).first()
            except Document.DoesNotExist:
                return rollback_response({"status": False, "message": "Document not found", "data": []})
            try:
                status_data = DynamicStatus.objects.get(id=status)
            except DynamicStatus.DoesNotExist:
                return rollback_response({"status": False, "message": "Status not found", "data": []})
            
            document_data.document_current_status = status_data
            document_data.effective_date = datetime.now()

            # Set revision_date based on revision_month
            if revision_month:
                try:
                    revision_month = int(revision_month)
                    document_data.revision_date = document_data.effective_date + relativedelta(months=revision_month)
                except ValueError:
                    return rollback_response({"status": False, "message": "Invalid revision_month value", "data": []})

            document_data.save()
            if document_data.version and document_data.version.endswith(".0"): 
                previous_major_version = str(int(document_data.version.split(".")[0]) - 1) + ".0"

                old_doc = Document.objects.filter(
                    document_number=document_data.document_number,
                    version=previous_major_version
                ).update(document_current_status=DynamicStatus.objects.get(id=15))
                
            return Response({"status": True,"message": "Document effective date with supersede created successfully"})
        
        except Exception as e:
            return rollback_response({"status": False, "message": str(e), "data": []})


class DocumentVersionListViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]


    def list(self, request, *args, **kwargs):
        
        queryset = Document.objects.filter(document_current_status__in = [15,12])
        
        if not queryset.exists():
            return Response({"status": True, "message": "No comments found for this document", "data": []})

        serializer = self.serializer_class(queryset, many=True, context={'request': request})

        return Response({
            "status": True,
            "message": "Document comments fetched successfully",
            "data": serializer.data
        })


class DocxConvertPDFViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    
    def update(self, request, *args, **kwargs):
        try:
            document_id = self.kwargs.get('document_id')
            document_instance = Document.objects.get(id=document_id)
            latest_comment = NewDocumentCommentsData.objects.filter(document=document_instance).order_by('-created_at').first()
            url = latest_comment.front_file_url
            
            if not url.endswith('.docx'):
                return rollback_response({'status': False, 'message': 'Invalid document type. Only .docx files are supported.'})

            base_directory = os.path.join(settings.MEDIA_ROOT, 'generated_docs')
            docx_file_path = os.path.join(base_directory, url)

            if not os.path.exists(docx_file_path):
                return rollback_response({'status': False, 'message': f"Document file not found at {docx_file_path}."})

            try:
                pdf_output_path = docx_file_path.replace('.docx', '.pdf')
                convert(docx_file_path)

                pdf_relative_path = os.path.relpath(pdf_output_path, settings.MEDIA_ROOT)
                pdf_url = f"{settings.MEDIA_URL}{pdf_relative_path}"

            except Exception as e:
                return rollback_response({'status': False, 'message': 'Error during conversion.', 'error': str(e)})

            return Response({
                'status': True,
                'message': 'Document successfully converted to PDF.',
                'pdf_link': request.build_absolute_uri(pdf_url)
            })

        except PrintRequest.DoesNotExist:
            return rollback_response({'status': False, 'message': 'Print request not found.'})
        except Exception as e:
            return rollback_response({'status': False, 'message': 'An error occurred while processing the document.', 'error': str(e)})


class IDWiSeDocumentListViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentviewSerializer
    queryset = Document.objects.all()

    def list(self, request, *args, **kwargs):
        try:
            document_id = self.kwargs.get('document_id')
            queryset = self.queryset.filter(id=document_id)
            serializer = self.serializer_class(queryset, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return rollback_response({'status': False,'message': 'Error fetching documents', 'error': str(e)})
    

class ArchivedDocxConvertPDFViewSet(viewsets.ModelViewSet):
    """Watermarked PDF of an archived/obsolete document version for reference."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = PrintRequest.objects.all().order_by('-created_at')
    serializer_class = PrintRequestSerializer

    def update(self, request, *args, **kwargs):
        try:
            document = Document.objects.filter(id=self.kwargs.get('sop_document_id')).first()
            if not document:
                return fail('Document not found.', http_status=404)
            source_docx = current_document_docx_path(document)
            if not source_docx:
                return fail('The document file was not found.', http_status=404)
            watermark = (request.data.get('document_status') or print_watermark_text(document))[:40]
            pdf_path = render_print_copy(source_docx, file_label=f"archived_{document.id}", watermark_text=watermark)
            if not pdf_path:
                return fail('The document could not be converted to PDF.', http_status=500)
            return Response({'status': True, 'message': 'Document successfully converted with watermark.',
                             'pdf_link': request.build_absolute_uri(media_url_for(pdf_path))})
        except Exception as e:
            return server_error(e, 'An error occurred while processing the document.')

from reportlab.lib.colors import black, lightgrey