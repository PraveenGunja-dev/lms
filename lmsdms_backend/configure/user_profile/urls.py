from django.urls import path
from user_profile.views import *


urlpatterns = [
    path('group_id_wise_permission_list', GroupIdWisePermissionListAPIView.as_view(), name='group_id_wise_permission_list'),
    path('permission_list', PermissionListAPIView.as_view(), name='permission_list'),
    path('group_create_with_permissions', CreateGroupWithPermissionViewSet.as_view({'post':'create','get':'list'}), name='group_create_with_permissions'),
    path('group_update_with_permissions/<int:group_id>', UpdateGroupWithPermissionViewSet.as_view({'put':'update','get':'list'}), name='group_update_with_permissions'),
    path('group_delete/<int:group_id>', UpdateGroupWithPermissionViewSet.as_view({'delete':'destroy'}), name='group_delete'),

    path('login', LoginAPIView.as_view({'post':'create'}), name='login'),
    path('reset_password', ResetPasswordAPIView.as_view({'put':'update'}), name='reset_password'),
    path('otp_resetpassword', ConfirmOTPAndSetPassword.as_view({'put':'update'}), name='otp_resetpassword'),
    path('admin_can_reset_passowrd/<int:user_id>', AdminResetLoginCountAPIView.as_view({'put':'update'}), name='admin_reset_login_count'),
    path('request_forgot_password_otp', RequestOTPViewSet.as_view({'post':'create'}), name='request_forgot_password_otp'),
    path('forgot_password_otp', VerifyOTPAndResetPasswordViewSet.as_view({'post':'create'}), name='forgot_password_otp'),

    path('user_create', CreateUserViewSet.as_view({'post':'create'}), name='user_create'),
    path('user_list', ListUserViewSet.as_view({'get':'list'}), name='user_list'),
    path('user_update/<int:user_id>', UpdateUserViewSet.as_view({'put':'update'}), name='user_update'),

    path('user_group_list', ListUserGroupsViewSet.as_view({'get':'list'}), name='user_group_list'),
    path('Esignature', EsignatureViewSet.as_view({'post':'create'}), name='Esignature'),
    path('requestuser_group_list', ListRequestUserGroupsViewSet.as_view({'get':'list'}), name='requestuser_group_list'),

    path('group_list', UserGroupDropdownViewSet.as_view({'post':'create'}), name='group_list'),
    path('user_switch_role', SwitchRoleViewSet.as_view({'post':'create'}), name='user_switch_role'),

    path('create_reminder', CreateReminderViewSet.as_view({'post':'create','get':'list'}), name='create_reminder'),

    path('all_reviewer', ReviewerUserViewSet.as_view({'get':'list'}), name='all_reviewer'),

    # path('document_create',DocumentUploadView.as_view(), name='document-upload'),
    
    path('reviewer_users', ReviewerAllUserListViewSet.as_view({'get':'list'}), name='reviewer_users'),
    path('approver_users', ApproverAllUserListViewSet.as_view({'get':'list'}), name='approver_users'),
    path('docadmin_users', DocAdminAllUserListViewSet.as_view({'get':'list'}), name='docadmin_users'),

    path('assigndepartment/<int:user_id>', AssignDepartmentViewSet.as_view({'put':'update'}), name='assigndepartment'),





]
