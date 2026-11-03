from django.urls import path
from dms_module.views import *


urlpatterns = [

   path('DashboardCount', DashboardCountViewSet.as_view({'get':'list'}),name='DashboardCount'),

   path('create_get_workflow', WorkFlowViewSet.as_view({'post': 'create','get':'list'}),name='create_get_workflow'),
   path('update_delete_workflow/<int:workflow_id>',WorkFlowUpdateSet.as_view({'put': 'update','delete':'destroy'}),name='update_delete_workflow'),
   
   path('create_get_document_type', DocumentTypeCreateViewSet.as_view({'post': 'create'}),name='create_get_document_type'),
   path('get_document_type', DocumentTypeCreateViewSet.as_view({'get':'list'}),name='get_document_type'),
   path('update_document_type/<document_type_id>', DocumentTypeUpdateViewSet.as_view({'put': 'update'}),name='update_document_type'),


   path('create_get_workflow', WorkFlowViewSet.as_view({'post': 'create','get':'list'}),name='create_get_workflow'),
   path('update_delete_workflow/<int:workflow_id>',WorkFlowUpdateSet.as_view({'put': 'update','delete':'destroy'}),name='update_delete_workflow'),

   path('print_request', PrintRequestViewSet.as_view({'post': 'create'}), name='print_request'),
   path('print_convert_pdf/<int:sop_document_id>', PrintRequestDocxConvertPDFViewSet.as_view({'put': 'update'}), name='print_convert_pdf'),
   path('get_print_request', PrintRequestViewSet.as_view({'get':'list'}), name='get_print_request'),
   path('print_approvals', PrintApprovalViewSet.as_view({'post': 'create'}), name='print_approvals'),
   path('update_print_request/<int:print_request_id>', PrintRequestUpdateViewSet.as_view({'put': 'update'}), name='update_print_request'),
   path('print_request_excel_report', PrintRequestExcelGenerateViewSet.as_view({'get':'list'}), name='print_request_excel_report'),
   
   path('create_document', DocumentCreateViewSet.as_view({'post': 'create'}),name='create_document'),
   path('update_document/<document_id>', DocumentUpdateViewSet.as_view({'put': 'update'}),name='update_document'),
   path('view_document/<roles>', DocumentViewSet.as_view({'get':'list'}),name='view_document'),
   
   path('document_excel_report', DocumentExcelGenerateViewSet.as_view({'get':'list'}),name='document_excel_report'),
   path('document_pdf_report', DocumentPDFGenerateViewSet.as_view({'get':'list'}),name='document_pdf_report'),
   
   path('delete_Document', DocumentDeleteViewSet.as_view({'delete':'destroy'}),name='delete_Document'),
   path('document_details_id/<document_id>', DocumentDetailViewSet.as_view({'get':'list'}),name='document_details_id'),
   path('get_obsolete_satatus_data_to_doc_admin_user_only', GetObsoleteStatusDataToDocAdminUserOnly.as_view({'get':'list'}),name='get_obsolete_satatus_data_to_doc_admin_user_only'),

   path('GetTemplate/<document_id>', DocumentTemplateViewSet.as_view({'get':'list'}),name='GetTemplate'),
   path('GetTemplateOnId/<template_id>', TemplateDocumentViewSet.as_view({'get': 'list'}),name='GetTemplateOnId'),


   path('CreateTemplate', TemplateCreateViewSet.as_view({'post': 'create'}),name='CreateTemplate'),
   path('ViewTemplate', TemplateViewSet.as_view({'get':'list'}),name='ViewTemplate'),
   path('UpdateTemplate/<temp_id>', TemplateUpdateViewSet.as_view({'put': 'update'}),name='UpdateTemplate'),

   path('create_status', DynamicStatusCreateViewSet.as_view({'post': 'create'}),name='create_status'),
   path('view_status', DynamicStatusListViewSet.as_view({'get':'list'}),name='view_status'),
   path('update_status/<dynamic_status_id>', DynamicStatusUpdateViewSet.as_view({'put': 'update'}),name='update_status'),
   # path('delete_status/<dynamic_status_id>', DynamicStatusDeleteViewSet.as_view({'delete':'destroy'}),name='delete_status'),

   path('create_document_details', DocumentDetailsCreateViewSet.as_view({'post': 'create'}),name='create_document_details'),
   path('update_document_details/<docdetail_id>', DocumentDetailsUpdateViewSet.as_view({'put': 'update'}),name='update_document_details'),
   path('view_document_details', DocumentDetailsViewSet.as_view({'get':'list'}),name='view_document_details'),

   path('document_send_back_status', DocumentSendBackActionCreateViewSet.as_view({'post': 'create'}),name='document_send_back_status'),
   path('document_release_effective_status', DocumentStatusHandleViewSet.as_view({'post': 'create'}),name='document_release_effective_status'),
   # path('document_effective_status', DocumentEffectiveActionCreateViewSet.as_view({'post': 'create'}),name='document_effective_status'),

   path('document_approve_status', DocumentApproveActionCreateViewSet.as_view({'post': 'create'}),name='document_approve_status'),
   path('draft_document', DocumentDraftStatusViewSet.as_view({'put': 'update'}),name='draft_document'),
   path('document_review_status', DocumentReviewerActionCreateViewSet.as_view({'post': 'create'}),name='document_review_status'),
   path('document_approver_status', DocumentApproverActionCreateViewSet.as_view({'post': 'create'}),name='document_approver_status'),
   path('document_docadmin_status', DocumentDocAdminActionCreateViewSet.as_view({'post': 'create'}),name='document_docadmin_status'),
   path('get_sendbackdata', GetSendBackActionViewSet.as_view({'get': 'list'}),name='get_sendbackdata'),

   path('document_id_wise_author_reviewer_approver_doc_admin/<int:document_id>', DocumentIdwiseAuthorReviewerApproverDocAdminViewSet.as_view({'get': 'list'}),name='document_id_wise_author_reviewer_approver_doc_admin'),

   #new update reviewer api
   path('update_document_reviewers/<int:document_id>',DocumentIdwiseUpdateReviewerViewSet.as_view({'put': 'update'}),name='update_document_reviewers'),
   

   path('UserDropdownMasterCopy', MasterCopyUserDropdownViewSet.as_view({'get':'list'}),name='UserDropdownMasterCopy'),
   path('UserDropdownOtherUser', OtherUserDropdownViewSet.as_view({'get':'list'}),name='UserDropdownOtherUser'),

   path('CreateInventory', DynamicInventoryCreateViewSet.as_view({'post': 'create'}), name='CreateInventory'),
   path('ViewInventory', DynamicInventoryListViewSet.as_view({'get': 'list'}), name='ViewInventory'),
   path('UpdateInventory/<inventory_id>', DynamicInventoryUpdateViewSet.as_view({'put': 'update'}), name='UpdateInventory'),
   path('DeleteInventory/<inventory_id>', DynamicInventoryDeleteViewSet.as_view({'delete': 'destroy'}), name='DeleteInventory'),
   
   path('create_comment', DocumentCommentCreateViewSet.as_view({'post': 'create'}), name='create_comment'),
   path('view_comment/<document_id>', DocumentCommentsViewSet.as_view({'get': 'list'}), name='view_comment'),
   path('delete_comment/<comment_id>', DocumentCommentDeleteViewSet.as_view({'delete': 'delete_comment'}), name='DeleteInventory'),

   path('approved_status_users/<document_id>', DepartmentUsersViewSet.as_view({'get':'list'}),name='approved_status_users'),

   path('create_printer', PrinterMachines.as_view({'post': 'create'}),name='create_Printer'),
   path('get_printer', PrinterMachines.as_view({'get':'list'}),name='get_printer'),
   path('update_Printer/<int:printer_id>',PrinterMachinesUpdate.as_view({'put': 'update'}),name='update_Printer'),
   path('delete_Printer/<int:printer_id>',PrinterMachinesUpdate.as_view({'delete':'destroy'}),name='delete_Printer'),

   path('revise_request', DocumentReviseRequestViewSet.as_view({'post': 'create'}),name='revise_request'),
   path('approve_revise', DocumentReviseActionViewSet.as_view({'post': 'create'}),name='approve_revise'),

   path('revise_request_get', DocumentReviseRequestGetViewSet.as_view({'get':'list'}),name='revise_request_get'),

   path('get_approved_print_list', ApprovedPrintRequestViewSet.as_view({'get':'list'}),name='get_approved_print_list'),
   path('print_approval/<int:print_request_approval_id>',ApprovalNumberViewSet.as_view({'get': 'list'}),name='print_approval'),

   path('retrival_numbers',PrintRequestApprovalViewSet.as_view({'post': 'create'}),name='retrival_numbers'),

   path('print_retrival/<int:print_request_approval_id>',RetrivalNumbersViewSet.as_view({'get': 'list'}),name='print_retrival'),

   path('document_wise_id/<int:document_id>',DocumentwiseIdViewSet.as_view({'get': 'list'}),name='document_wise_id'),
   path('all_document', AllDocumentViewSet.as_view({'get':'list'}),name='all_document'),

   path('parent_document/<document_id>', ParentDocumentViewSet.as_view({'get':'list'}),name='parent_document'),

   path('doc_timeline/<document_id>', DocumentTimelineViewSet.as_view({'get':'list'}),name='doc_timeline'),
   path('docadmin_obsolete_status', DocAdminUpdateViewSet.as_view({'post': 'create'}),name='docadmin_obsolete_status'),

   path('get_document_certificate_data_list/<int:document_id>', GetDocumentCertificateDataListViewSet.as_view({'get':'list'}),name='get_document_certificate_data_list'),
   path('document_certificate_pdf_generate/<int:document_id>', DocumentCertificatePdfExportView.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   
   # DASHBOARD APIS 
   path('document_ninty_days_data', DocumentNintyDaysDataViewSet.as_view({'get':'list'}),name='document_ninty_days_data'),
   path('date_wise_document_data', DateWiseDocumentDatacountViewSet.as_view({'get':'list'}),name='date_wise_document_data'),

   path('document_data_of_status_id_one', DocumentDataOfStatusIdOne.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_two', DocumentDataOfStatusIdTwo.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_three', DocumentDataOfStatusIdThree.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_four', DocumentDataOfStatusIdFour.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_five', DocumentDataOfStatusIdFive.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_six', DocumentDataOfStatusIdSix.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_seven', DocumentDataOfStatusIdSeven.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_eight', DocumentDataOfStatusIdEight.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_nine', DocumentDataOfStatusIdNine.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_ten', DocumentDataOfStatusIdTen.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_eleven', DocumentDataOfStatusIdEleven.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_twelve', DocumentDataOfStatusIdTwelve.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),
   path('document_data_of_status_id_thirteen', DocumentDataOfStatusIdThirteen.as_view({'get':'list'}),name='get_document_type_for_doc_admin'),

   path('print_reject_document_data', PrintRejectDataStatusIdEleven.as_view({'get':'list'}),name='print_reject_document_data'),

   path('archived_list/<int:document_id>', ArchivedDocumentViewSet.as_view({'get':'list'}),name='archived_list'),
   path('select_user_for_document/<int:document_id>', UpdateDocumentUserViewSet.as_view({'put': 'update'}),name='select_user_for_document'),


   path('get_editor_config', get_editor_config, name='get_editor_config'),
   path('get_editor_config_for_obsolete_doc', get_editor_config_for_obsolete_doc, name='get_editor_config_for_obsolete_doc'),
   path('onlyoffice_callback', onlyoffice_callback, name='onlyoffice_callback'),
   
   path('download_and_save_docx', download_and_save_docx, name='download_and_save_docx'),
   path('add_path_url_data_for_comments',AddNewDocumentCommentsdataViewSet.as_view({'post':'create','get':'list'}),name='add_path_url_data_for_comments'),

   path('employee_list/<int:employee_id>', EmployeeJobRoleView.as_view({'get':'list'}),name='employee_list'),

   path('employee_record_log', EmployeeRecordLogView.as_view({'get':'list'}),name='employee_record_log'),

   path('employee_training_need_identy/<int:employee_id>', EmployeeTrainingNeedIdentyView.as_view({'get':'list'}),name='employee_training_need_identy'),
   
   path('documentobsoletenotification', DocumentObsoleteNotificationViewSet.as_view({'get':'list'}),name='documentobsoletenotification'),

   path('document_effective', DocumentEffectiveViewSet.as_view({'post':'create'}),name='document_effective'),

   path('document_version_list', DocumentVersionListViewSet.as_view({'get':'list'}),name='document_version_list'),

   path('convert_docx_pdf/<int:document_id>', DocxConvertPDFViewSet.as_view({'put': 'update'}), name='convert_docx_pdf'),

   path('id_wise_document_list/<int:document_id>', IDWiSeDocumentListViewSet.as_view({'get':'list'}),name='id_wise_document_list'),

   path('archived_print_convert_pdf/<int:sop_document_id>', ArchivedDocxConvertPDFViewSet.as_view({'put': 'update'}), name='archived_print_convert_pdf'),
]
