"""Shared fixtures for the test-suite (not imported by application code)."""
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

from dms_module.models import Document, DocumentType, DynamicStatus, TemplateModel, WorkFlowModel
from user_profile.models import CustomUser, Department

STATUS_NAMES = {
    1: "Draft", 2: "Saved", 3: "Under Review", 4: "Reviewed", 5: "Approved", 6: "Release",
    7: "Effective", 8: "Send Back", 9: "Approved", 10: "Revise", 11: "Revision Rejected",
    12: "Obsolete", 13: "Under Approval", 15: "Superseded",
}


class Fixtures:
    def __init__(self):
        self.qa = Department.objects.create(department_name="Quality Assurance")
        self.prod = Department.objects.create(department_name="Production")
        self.groups = {name: Group.objects.create(name=name) for name in
                       ["Admin", "Author", "Reviewer", "Approver", "Doc Admin", "DTC", "HOD", "HR", "Employee"]}
        self.admin = self.user("admin", "Admin", department=self.qa)
        self.author = self.user("author", "Author", department=self.qa)
        self.reviewer1 = self.user("reviewer1", "Reviewer", department=self.qa)
        self.reviewer2 = self.user("reviewer2", "Reviewer", department=self.qa)
        self.doc_admin = self.user("docadmin", "Doc Admin", department=self.qa)
        self.dtc = self.user("dtc", "DTC", department=self.qa)
        self.hod = self.user("hod", "HOD", department=self.qa)
        self.employee = self.user("employee", "Employee", department=self.qa)
        for status_id, name in STATUS_NAMES.items():
            DynamicStatus.objects.create(id=status_id, user=self.admin, status=name)
        self.sop_type = DocumentType.objects.create(id=1, user=self.admin, document_name="SOP")
        self.annexure_type = DocumentType.objects.create(id=2, user=self.admin, document_name="Annexure")
        self.format_type = DocumentType.objects.create(id=3, user=self.admin, document_name="Format")
        self.workflow = WorkFlowModel.objects.create(workflow_name="Default")
        self.template = TemplateModel.objects.create(template_name="SOP", user=self.admin, template_doc="templates/x.docx")

    def user(self, username, group_name, department=None, password="Str0ng!Passw0rd"):
        user = CustomUser.objects.create(
            username=username, email=f"{username}@example.com", first_name=username.title(),
            department=department, is_reset_password=True,
        )
        user.set_password(password)
        user.save()
        user.groups.add(self.groups[group_name])
        return user

    def document(self, number, status_id=7, version="1.0", doc_type=None, parent=None, user=None, **extra):
        return Document.objects.create(
            user=user or self.author, author=user or self.author, document_title=extra.pop("title", number),
            document_number=number, document_type=doc_type or self.sop_type, parent_document=parent,
            workflow=self.workflow, select_template=self.template, document_current_status_id=status_id,
            version=version, revision_month="24", **extra,
        )

    @staticmethod
    def client(user=None):
        client = APIClient()
        if user is not None:
            client.force_authenticate(user)
        return client
