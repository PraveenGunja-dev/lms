from rest_framework import serializers
from .models import *


def _latest_revision_request(document):
    """The revision request a reviewer should act on: the newest pending one,
    otherwise the newest of any status."""
    requests = DocumentRevisionRequestAction.objects.filter(document=document).order_by('-created_at', '-id')
    return requests.filter(status="Pending", is_revise=True).first() or requests.first()


class WorkFlowSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkFlowModel
        fields = ['id', 'workflow_name', 'workflow_description', 'created_at', 'is_active']

class PrintRequestSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()  # Include user's first name directly
    document_title = serializers.CharField(source='sop_document_id.document_title', read_only=True)
    document_status = serializers.CharField(source='sop_document_id.document_current_status.status', read_only=True)
    version = serializers.CharField(source='sop_document_id.version', read_only=True)
    status_id = serializers.CharField(source='print_request_status.id', read_only=True)
    status = serializers.CharField(source='print_request_status.status', read_only=True)
    no_of_request_by_admin = serializers.SerializerMethodField()  # Include no_of_request_by_admin
    approved_date = serializers.SerializerMethodField()  # Rename created_at to approved_date
    printer_name = serializers.SerializerMethodField()
    approval_numbers = serializers.SerializerMethodField()  # Include many-to-many approval numbers
    request_user_groups = serializers.SerializerMethodField()
    no_of_retrival = serializers.SerializerMethodField()
    class Meta:
        model = PrintRequest
        fields = [
            'id', 'user', 'first_name', 'sop_document_id', 'document_title', 'document_status', 'version',
            'no_of_print', 'issue_type', 'reason_for_print',
            'created_at', 'status_id', 'status',
            'no_of_request_by_admin', 'approved_date', 'printer_name',
            'approval_numbers',  # Add approval_numbers to the response
            'request_user_groups', 'print_count', 'no_of_retrival'
        ]

    def get_no_of_retrival(self, obj):
        approvals = PrintRequestApproval.objects.filter(print_request=obj)
        total_retrievals = sum(approval.retrival_numbers.count() for approval in approvals)
        return total_retrievals
    def get_first_name(self, obj):
        return obj.user.first_name if obj.user else None

    # def get_status(self, obj):
    #     approval = obj.approvals.order_by('-created_at').first()
    #     return approval.status.status if approval and approval.status else None

    def get_no_of_request_by_admin(self, obj):
        approval = obj.approvals.order_by('-created_at').first()
        return approval.no_of_request_by_admin if approval else None

    def get_approved_date(self, obj):
        approval = obj.approvals.order_by('-created_at').first()
        return approval.created_at if approval else None

    def get_printer_name(self, obj):
        return obj.printer.printer_name if obj.printer else None

    def get_approval_numbers(self, obj):
        # Get the latest approval for the PrintRequest
        approval = obj.approvals.order_by('-created_at').first()
        if approval:
            # Extract and return the list of approval numbers
            return [approval_number.number for approval_number in approval.approval_numbers.all()]
        return []

    def get_request_user_groups(self, obj):
        user = self.context.get('request').user
        if user:
            # Get the groups of the user making the request
            groups = user.groups.all().values_list('name', flat=True)
            return list(groups)
        return []


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ['id', 'user', 'document_name', 'created_at']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

class DocumentdataSerializer(serializers.ModelSerializer):
    template_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'select_template', 'template_url']

    def get_template_url(self, obj):
        request = self.context.get('request')
        if obj.select_template and obj.select_template.template_doc:
            return request.build_absolute_uri(obj.select_template.template_doc.url)
        return None
    # def get_template_url(self, obj):
    #     if obj.select_template and obj.select_template.template_doc:
    #         # Build the full template URL
    #         original_url = obj.select_template.template_doc.url
    #         base_url = "http://host.docker.internal:8000"
    #         return f"{base_url}{original_url}"
    #     return None
    

class TemplateDocumentSerializer(serializers.ModelSerializer):
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = TemplateModel
        fields = ['template_name', 'document_url']

    # def get_document_url(self, obj):
    #     request = self.context.get('request')
    #     if obj.template_doc:
    #         return request.build_absolute_uri(obj.template_doc.url)
    #         # return f"http://host.docker.internal:8000{obj.select_template.template_doc.url}"
    #     return None
    
    def get_document_url(self, obj):
        request = self.context.get('request')  # Get request context for building absolute URL
        if not request or not obj.generatefile:  # Ensure we have a stored filename
            return None  

    # Construct file path from stored filename
        file_url = f"{settings.MEDIA_URL}generated_docs/{obj.generated_filename}"
        full_file_url = f"{request.scheme}://{request.get_host()}{file_url}"

    # Replace "127.0.0.1" with "host.docker.internal" for Docker compatibility
        # return full_file_url.replace("127.0.0.1", "host.docker.internal")
        return full_file_url.replace("13.132.63.196:8080","host.docker.internal:8000")
        # return full_file_url.replace("43.204.122.158:8080", "host.docker.internal:8000")
    


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateModel
        fields = '__all__'

# class CustomUserdataSerializer(serializers.ModelSerializer):
#     first_name = serializers.SerializerMethodField()
#     group_id = serializers.SerializerMethodField()

#     class Meta:
#         model = CustomUser
#         fields = ['id', 'first_name', 'group_id']

#     def get_first_name(self, obj):
#         # Get the first name of the user
#         first_name = obj.first_name if obj.first_name else ''
#         # Get the group name of the user
#         group_name = ', '.join(obj.groups.values_list('name', flat=True)) if obj.groups.exists() else ''
#         # Combine the first name and group name
#         return f"{first_name}({group_name})" if group_name else first_name

#     def get_group_id(self, obj):
#         # Get the group IDs as a list
#         return list(obj.groups.values_list('id', flat=True))
 
class CustomUserGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.SerializerMethodField()
    group_id = serializers.IntegerField()

    def get_first_name(self, obj):
        # Format first_name as "first_name(group_name)"
        first_name = obj['first_name']
        group_name = obj['group_name']
        return f"{first_name}({group_name})"

from lms_module.serializers import UserCompleteViewDocumentSerializer
from lms_module.models import *
class DocumentviewSerializer(serializers.ModelSerializer):
    document_type_name = serializers.SerializerMethodField()
    # formatted_created_at = serializers.SerializerMethodField()
    current_status_name = serializers.SerializerMethodField()
    approval_status = serializers.SerializerMethodField()
    approval_numbers = serializers.SerializerMethodField()  # Add this
    no_of_request_by_admin = serializers.SerializerMethodField() 
    selected_template_url = serializers.SerializerMethodField()
    request_user_groups = serializers.SerializerMethodField()
    user_department_id = serializers.SerializerMethodField()
    user_department = serializers.SerializerMethodField()
    front_file_url = serializers.SerializerMethodField()
    user_view = serializers.SerializerMethodField()
    training_quiz_ids = serializers.SerializerMethodField()
    is_done = serializers.SerializerMethodField()
    training_assesment_attempted = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()
    quiz_count = serializers.SerializerMethodField()
    class Meta:
        model = Document
        fields = ['id','quiz_count', 'parent_document','is_parent','document_title','revision_month','assigned_to','select_template', 'document_number', 'created_at','document_type','document_type_name','form_status','document_current_status', 'is_done','current_status_name','version','training_required','approval_status','visible_to_users', 'approval_numbers', 'no_of_request_by_admin','selected_template_url','request_user_groups','user_department_id','user_department','workflow','document_description', 'effective_date', 'revision_date','product_code','equipment_id', 'front_file_url', 'user_view', 'training_quiz_ids','training_assesment_attempted', 'is_reviewed','is_effective']

    def get_quiz_count(self,obj):
        return TrainingQuiz.objects.filter(document=obj).count()
    def get_is_reviewed(self,obj):
        request = self.context.get('request')
        if not request:
            return False
        user = request.user
        comments = ReviewByUser.objects.filter(document=obj, user=user).first()
        return comments.is_reviewed if comments else False
    def get_training_assesment_attempted(self,obj):
        # True while the user has an unsubmitted (abandoned) attempt or was blocked by an admin.
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return AttemptedQuiz.objects.filter(document=obj, user=request.user, training_assesment_attempted=True).exists()
    def get_is_done(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        user = request.user
        try:
            user_send_back = UserWiseSendBackView.objects.get(user=user, document=obj)
            return user_send_back.is_done  # Return the is_done value
        except UserWiseSendBackView.DoesNotExist:
            return None
    def get_training_quiz_ids(self, obj):
        return list(TrainingQuiz.objects.filter(document=obj).values_list('id', flat=True))
    def get_user_view(self, obj):
        user_views = UserCompleteViewDocument.objects.filter(document=obj)
        
        serializer = UserCompleteViewDocumentSerializer(user_views, many=True)
        return serializer.data
    def get_front_file_url(self, obj):
        latest_comment = NewDocumentCommentsData.objects.filter(document=obj).order_by('-created_at').first()
        return latest_comment.front_file_url.url if latest_comment and latest_comment.front_file_url else None

    def get_document_type_name(self, obj):
        return obj.document_type.document_name if obj.document_type else None

    # def get_formatted_created_at(self, obj):
    #     return obj.created_at.strftime('%d-%m-%Y')
    
    def get_current_status_name(self, obj):
        return obj.document_current_status.status if obj.document_current_status else None
    
    def get_approval_status(self, obj):
        # Fetch the latest status from PrintRequestApproval for this document
        latest_approval = (
            PrintRequestApproval.objects
            .filter(print_request__sop_document_id=obj)
            .order_by('-created_at')
            .first()
        )
        return latest_approval.status.status if latest_approval and latest_approval.status else None
    
    def get_selected_template_url(self, obj):
        if obj.select_template and obj.select_template.template_doc:
            return obj.select_template.template_doc.url 
        return None
    # def get_selected_template_url(self, obj):
    #     if obj.select_template and obj.select_template.template_doc:
    #         return f"http://host.docker.internal:8000{obj.select_template.template_doc.url}"
    #     return None

    def get_approval_numbers(self, obj):
        # Fetch all approval numbers related to this document
        approval_numbers = ApprovalNumber.objects.filter(
            printrequestapproval__print_request__sop_document_id=obj
        ).values_list('number', flat=True)
        return list(approval_numbers) if approval_numbers else None

    # def get_no_of_request_by_admin(self, obj):
    #     total_requests = (
    #         PrintRequestApproval.objects
    #         .filter(print_request__sop_document_id=obj)
    #         .aggregate(total=models.Sum('no_of_request_by_admin'))
    #     )
    #     return total_requests['total'] if total_requests['total'] is not None else None

    def get_no_of_request_by_admin(self, obj):
        """
        Fetch all `no_of_request_by_admin` values related to the given document.
        """
        request_approvals = PrintRequestApproval.objects.filter(
            print_request__sop_document_id=obj
        ).values_list('no_of_request_by_admin', flat=True)
        return list(request_approvals) if request_approvals else []
    
    def get_request_user_groups(self, obj):
        user = self.context.get('request').user
        if user:
            # Get the groups of the user making the request
            groups = user.groups.all().values_list('name', flat=True)
            return list(groups)
        return []

    def get_user_department_id(self, obj):
        # Get the user who created the document and return the ID of their department
        if obj.user and obj.user.department:
            return obj.user.department.id
        return None
    
    def get_user_department(self, obj):
        # Get the user who created the document and return the name of their department
        if obj.user and obj.user.department:
            return obj.user.department.department_name  # Return the name of the department
        return None
    
class DocumentCommentSerializer(serializers.ModelSerializer):
    user_first_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentComments
        fields = ['id', 'user','user_first_name', 'document', 'Comment_description', 'created_at']

    def get_user_first_name(self, obj):
        return obj.user.first_name if obj.user else None

class DynamicStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DynamicStatus
        fields = ['id', 'user', 'status', 'created_at', 'updated_at']

class DocumentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentDetails
        fields = ['id', 'user', 'document_data', 'created_at']

class DocumentEffectiveActionSerializer(serializers.ModelSerializer):
    document = serializers.SerializerMethodField()
    class Meta:
        model = DocumentDetails
        fields = ['id', 'user','document','document_data', 'created_at']

    def get_document(self, obj):
        return DocumentSerializer(obj.document).data

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name']

class DynamicInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DynamicInventory
        fields = ['id', 'inventory_name', 'created_at', 'updated_at']

class DocumentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id','document_title','document_number','document_type','document_description','revision_time','revision_date','document_operation','select_template','workflow']

class PrinterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrinterMachinesModel
        fields = ['id', 'printer_name', 'printer_description', 'created_at']

# class DocumentRevisionRequestActionSerializer(serializers.ModelSerializer):
#     user_first_name = serializers.CharField(source='user.first_name', read_only=True)

#     class Meta:
#         model = DocumentRevisionRequestAction
#         fields = ['id', 'user_first_name', 'document', 'revise_description', 'created_at']

class DocumentSerializer(serializers.ModelSerializer):
    document_id = serializers.IntegerField(source='id', read_only=True)
    document_title = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    revise_description = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    document_current_status_name = serializers.CharField(source='document_current_status.status', read_only=True)
    document_type = serializers.CharField(source='document_type.document_name', read_only=True)  # Adjust 'name' to the appropriate field on DocumentType
    revise_request_id = serializers.SerializerMethodField()  # Field for revision request ID
    revise_requested_by = serializers.SerializerMethodField()
    revision_created_at = serializers.SerializerMethodField()  # Field for revision created_at
    front_file_url = serializers.SerializerMethodField()
    class Meta:
        model = Document
        fields = [
            'document_id',
            'document_number',
            'select_template',
            'document_title',
            'document_current_status',
            'document_current_status_name',
            'version',
            'user',
            'revise_description',
            'revision_date',
            'effective_date',
            'status',
            'document_type', 
            'revise_request_id',
            'revise_requested_by',
            'revision_created_at',
            'job_roles',
            'front_file_url'
        ]

    def get_front_file_url(self, obj):
        latest_comment = NewDocumentCommentsData.objects.filter(document=obj).order_by('-created_at').first()
        return latest_comment.front_file_url.url if latest_comment and latest_comment.front_file_url else None
    def get_user(self, obj):
        action = _latest_revision_request(obj)
        return action.user.username if action else None

    def get_revise_description(self, obj):
        action = _latest_revision_request(obj)
        return action.revise_description if action else None

    def get_status(self, obj):
        action = _latest_revision_request(obj)
        return action.status if action else None
    
    def get_revise_request_id(self, obj):
        action = _latest_revision_request(obj)
        return action.id if action else None

    def get_revise_requested_by(self, obj):
        action = _latest_revision_request(obj)
        return action.user_id if action else None

    def get_revision_created_at(self, obj):
        action = _latest_revision_request(obj)
        return action.created_at if action else None
    
class DocumentMappingSerializer(serializers.ModelSerializer):
    # document_id = serializers.IntegerField(source='id', read_only=True)
    document_title = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    revise_description = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    document_current_status_name = serializers.CharField(source='document_current_status.status', read_only=True)
    document_type = serializers.CharField(source='document_type.document_name', read_only=True)  # Adjust 'name' to the appropriate field on DocumentType
    revise_request_id = serializers.SerializerMethodField()  # Field for revision request ID
    revise_requested_by = serializers.SerializerMethodField()
    revision_created_at = serializers.SerializerMethodField()  # Field for revision created_at
    front_file_url = serializers.SerializerMethodField()
    class Meta:
        model = Document
        fields = [
            'id',
            'select_template',
            'document_title',
            'document_current_status',
            'document_current_status_name',
            'version',
            'user',
            'revise_description',
            'revision_date',
            'effective_date',
            'status',
            'document_type', 
            'revise_request_id',
            'revise_requested_by',
            'revision_created_at',
            'job_roles',
            'front_file_url'
        ]

    def get_front_file_url(self, obj):
        latest_comment = NewDocumentCommentsData.objects.filter(document=obj).order_by('-created_at').first()
        return latest_comment.front_file_url.url if latest_comment and latest_comment.front_file_url else None
    def get_user(self, obj):
        action = _latest_revision_request(obj)
        return action.user.username if action else None

    def get_revise_description(self, obj):
        action = _latest_revision_request(obj)
        return action.revise_description if action else None

    def get_status(self, obj):
        action = _latest_revision_request(obj)
        return action.status if action else None
    
    def get_revise_request_id(self, obj):
        action = _latest_revision_request(obj)
        return action.id if action else None

    def get_revision_created_at(self, obj):
        action = _latest_revision_request(obj)
        return action.created_at if action else None    

class ApprovedPrintRequestSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='print_request.sop_document_id.document_title')
    no_of_print = serializers.IntegerField(source='print_request.no_of_print')
    no_of_request_by_admin = serializers.IntegerField()
    status = serializers.CharField(source='status.status', allow_null=True)
    created_at = serializers.DateTimeField()
    no_of_retrival = serializers.SerializerMethodField()

    class Meta:
        model = PrintRequestApproval
        fields = ['id','print_request', 'document_title', 'no_of_print', 'no_of_request_by_admin', 'status', 'created_at', 'no_of_retrival']
    # def get_no_of_retrival(self, obj):
    #     approvals = PrintRequestApproval.objects.filter(print_request=obj)
    #     total_retrievals = sum(approval.retrival_numbers.count() for approval in approvals)
    #     return total_retrievals
    def get_no_of_retrival(self, obj):
        if obj.print_request:  # Ensure print_request exists
            approvals = PrintRequestApproval.objects.filter(print_request=obj.print_request)  
            total_retrievals = sum(approval.retrival_numbers.count() for approval in approvals)
            return total_retrievals
        return 0  # Return 0 if print_request is missing

class ApprovalNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalNumber
        fields = ['number']

class RetrivalNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetrivalNumber
        fields = ['id', 'retrival_number', 'created_at']


class AllDocumentSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='document_current_status.status')
    class Meta:
        model = Document
        fields = ['id', 'select_template', 'document_title','document_current_status', 'status', 'effective_date', 'revision_date', 'revision_month']
    
class DocumentAuthorApproveActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentAuthorApproveAction
        fields = ['user', 'name', 'status_approve','remarks_author','created_at']

class DocumentReviewerActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentReviewerAction
        fields = ['user', 'name','status_approve','remarks_reviewer','created_at']

class DocumentApproverActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentApproverAction
        fields = ['user', 'name','status_approve','remarks_approver','created_at']

class DocumentDocAdminActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentDocAdminAction
        fields = ['user', 'name','status_approve','created_at']

class DocumentSendBackActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentSendBackAction
        fields = ['user', 'name','status_sendback','remarks_sendback','created_at']

class DocumentReleaseActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentReleaseAction
        fields = ['user', 'name','status_release','created_at']

class DocumentEffectivenewActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentEffectiveAction
        fields = ['user', 'name','status_effective']

class DocumentRevisionActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    document_name = serializers.CharField(source='document.document_title', read_only=True)
    remarks = serializers.SerializerMethodField()
    status_name = serializers.CharField(source='status_revision.status', read_only=True)
    class Meta:
        model = DocumentRevisionAction
        fields = ['user','document','document_name', 'name','status_revision', 'status_name','remarks', 'remarks_revision','created_at']
    
    def get_remarks(self, obj):
        remark = DocumentRevisionRemarks.objects.filter(document=obj.document).order_by('-id').first()
        return remark.remarks if remark else None

class DocumentRevisionRequestActionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username')
    class Meta:
        model = DocumentRevisionRequestAction
        fields = ['user', 'name','status','created_at']
        
class ArchivedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archived
        fields = ['document', 'version', 'created_at']


class AddNewDocumentCommentsSerializer(serializers.ModelSerializer):
    user_first_name = serializers.CharField(source='user.first_name')
    user_last_name = serializers.CharField(source='user.last_name')
    document_name = serializers.CharField(source='document.document_title')
    department_name = serializers.CharField(source='department.department_name')
    class Meta:
        model = NewDocumentCommentsData
        fields = ['user','user_first_name', 'user_last_name','document_id','document_name','comment_data', 'version_no', 'front_file_url', 'department_id','department_name']

class DocumentEffectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentEffective
        fields = ['document', 'status']

class SendBackofUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    class Meta:
        model = SendBackofUser
        fields = ['document_id', 'user_id', 'username', 'is_send_back']