import os
from datetime import datetime
from unittest import mock

from django.test import TestCase
from django.utils import timezone

from dms_module.models import (
    Document, DocumentRevisionAction, DocumentRevisionRequestAction, DocumentReviewerAction, NewDocumentCommentsData,
)
from dms_module.views import compute_review_date
from lms_module.models import JobRole, QuizQuestion, TrainingQuestions, TrainingQuiz
from user_profile.function_call import DocumentNumberError, generate_document_number
from user_profile.testing import Fixtures


class DocumentNumberTests(TestCase):
    def setUp(self):
        self.f = Fixtures()

    def test_user_without_department_cannot_get_number(self):
        self.f.author.department = None
        self.f.author.save()
        with self.assertRaises(DocumentNumberError):
            generate_document_number(self.f.author, self.f.sop_type)

    def test_sequence_is_per_department_and_numeric(self):
        self.f.document("BPL/Quality Assurance/009")
        self.f.document("BPL/Production/050")
        self.f.document("BPL/Quality Assurance/010")
        self.assertEqual(generate_document_number(self.f.author, self.f.sop_type), "BPL/Quality Assurance/011")

    def test_child_numbers_are_shared_across_parent_versions(self):
        v1 = self.f.document("BPL/Quality Assurance/001", version="1.0")
        v2 = self.f.document("BPL/Quality Assurance/001", version="1.1", status_id=10)
        self.f.document("BPL/Quality Assurance/001/F001", doc_type=self.f.format_type, parent=v1)
        self.assertEqual(generate_document_number(self.f.author, self.f.format_type, v2), "BPL/Quality Assurance/001/F002")
        self.assertEqual(generate_document_number(self.f.author, self.f.annexure_type, v2), "BPL/Quality Assurance/001/A001")

    def test_create_document_without_department_returns_clear_error(self):
        self.f.author.department = None
        self.f.author.save()
        response = self.f.client(self.f.author).post("/api/dms_module/create_document", {
            "document_title": "SOP", "document_type": self.f.sop_type.id, "workflow": self.f.workflow.id,
            "select_template": self.f.template.id, "revision_month": "24", "document_current_status_id": 1,
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("department", response.data["message"])
        self.assertFalse(Document.objects.filter(document_title="SOP").exists())


class RevisionWorkflowTests(TestCase):
    def setUp(self):
        self.f = Fixtures()
        self.sop = self.f.document("BPL/Quality Assurance/001", version="1.0")
        self.sop.visible_to_users.set([self.f.reviewer1, self.f.reviewer2])
        self.role = JobRole.objects.create(job_role_name="Operator")
        self.sop.job_roles.add(self.role)
        self.f1 = self.f.document("BPL/Quality Assurance/001/F001", doc_type=self.f.format_type, parent=self.sop)
        self.f2 = self.f.document("BPL/Quality Assurance/001/F002", doc_type=self.f.format_type, parent=self.sop)
        NewDocumentCommentsData.objects.create(document=self.sop, front_file_url="file/sop.docx")
        question = TrainingQuestions.objects.create(document=self.sop, question_type="mcq", question_text="Q?", correct_answer="a", marks=1)
        quiz = TrainingQuiz.objects.create(document=self.sop, quiz_name="Quiz", pass_criteria=1, quiz_type="manual")
        QuizQuestion.objects.create(quiz=quiz, question=question, marks=1)
        self.request = DocumentRevisionRequestAction.objects.create(
            user=self.f.author, document=self.sop, revise_description="update", status="Pending", is_revise=True)

    def decide(self, user, action="approved"):
        return self.f.client(user).post("/api/dms_module/approve_revise", {
            "document_id": self.sop.id, "request_action_id": self.request.id,
            "status_id": 10 if action == "approved" else 11, "action_status": action, "remarks": "ok",
        }, format="json")

    def test_author_cannot_approve_revision(self):
        self.f.author.groups.add(self.f.groups["Doc Admin"])  # even with the right role
        response = self.decide(self.f.author)
        self.assertEqual(response.status_code, 403)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, "Pending")

    def test_non_doc_admin_cannot_approve(self):
        self.assertEqual(self.decide(self.f.reviewer1).status_code, 403)

    def test_doc_admin_approval_creates_complete_draft(self):
        response = self.decide(self.f.doc_admin)
        self.assertEqual(response.status_code, 200, response.data)
        draft = Document.objects.get(id=response.data["data"]["new_document_id"])
        self.assertEqual(draft.version, "1.1")
        self.assertEqual(draft.document_current_status_id, 10)
        self.assertEqual(draft.user, self.f.author)  # ownership kept -> department reports / reviewer filters work
        self.assertEqual(set(draft.visible_to_users.all()), {self.f.reviewer1, self.f.reviewer2})
        self.assertEqual(list(draft.job_roles.all()), [self.role])
        self.assertTrue(NewDocumentCommentsData.objects.filter(document=draft).exists())
        self.assertEqual(TrainingQuiz.objects.get(document=draft).questions.count(), 1)
        self.assertTrue(DocumentRevisionAction.objects.filter(document=draft).exists())  # timeline entry
        # children stay attached; parent job roles are not wiped
        self.assertEqual(set(Document.objects.filter(parent_document=self.sop)), {self.f1, self.f2})
        self.assertEqual(list(self.sop.job_roles.all()), [self.role])

    def test_request_can_only_be_decided_once(self):
        self.assertEqual(self.decide(self.f.doc_admin).status_code, 200)
        self.assertEqual(self.decide(self.f.doc_admin).status_code, 400)
        self.assertEqual(Document.objects.filter(document_number=self.sop.document_number).count(), 2)

    def test_children_listed_for_latest_version(self):
        draft_id = self.decide(self.f.doc_admin).data["data"]["new_document_id"]
        response = self.f.client(self.f.reviewer1).get(f"/api/dms_module/parent_document/{draft_id}")
        self.assertEqual({d["id"] for d in response.data["data"]}, {self.f1.id, self.f2.id})


class ReviewerApprovalCountTests(TestCase):
    def setUp(self):
        self.f = Fixtures()
        self.doc = self.f.document("BPL/Quality Assurance/002", status_id=3, version="0.1")
        self.doc.visible_to_users.set([self.f.reviewer1, self.f.reviewer2])

    @mock.patch("dms_module.views.send_document_approval_email")
    def review(self, user, _mail):
        return self.f.client(user).post("/api/dms_module/document_review_status", {
            "document_id": self.doc.id, "status": 4, "remark": "ok"}, format="json")

    def test_same_reviewer_twice_does_not_complete_review(self):
        self.review(self.f.reviewer1)
        self.review(self.f.reviewer1)
        self.doc.refresh_from_db()
        self.assertNotEqual(self.doc.document_current_status_id, 4)
        self.review(self.f.reviewer2)
        self.doc.refresh_from_db()
        self.assertEqual(self.doc.document_current_status_id, 4)

    def test_unassigned_user_cannot_review(self):
        response = self.review(self.f.doc_admin)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(DocumentReviewerAction.objects.filter(user=self.f.doc_admin).exists())


class CoverPageTests(TestCase):
    def setUp(self):
        self.f = Fixtures()

    def test_review_date_falls_back_to_effective_plus_period(self):
        doc = self.f.document("BPL/Quality Assurance/003", effective_date=timezone.make_aware(datetime(2026, 1, 15)))
        self.assertEqual(compute_review_date(doc).date().isoformat(), "2028-01-15")

    def test_review_date_unknown_before_effective(self):
        self.assertIsNone(compute_review_date(self.f.document("BPL/Quality Assurance/004", status_id=3)))


class PrintFeatureTests(TestCase):
    """Controlled printing: approval, copy limit, copy numbers stamped on every copy."""

    def setUp(self):
        import tempfile
        from django.test import override_settings
        from dms_module.models import PrintRequest, PrinterMachinesModel

        self._media = tempfile.TemporaryDirectory()
        self._override = override_settings(MEDIA_ROOT=self._media.name)
        self._override.enable()
        self.f = Fixtures()
        self.doc = self.f.document("BPL/Quality Assurance/010", status_id=7, generatefile="sop.docx")
        os.makedirs(os.path.join(self._media.name, "generated_docs"))
        open(os.path.join(self._media.name, "generated_docs", "sop.docx"), "wb").write(b"docx")
        printer = PrinterMachinesModel.objects.create(user=self.f.admin, printer_name="P1")
        self.print_request = PrintRequest.objects.create(
            user=self.f.employee, sop_document_id=self.doc, no_of_print=3, issue_type="Controlled Copy",
            reason_for_print="shop floor", printer=printer, print_request_status_id=13)
        self.convert = mock.patch("dms_module.views.convert_docx_file_to_pdf", side_effect=self._fake_convert)
        self.convert.start()

    def tearDown(self):
        self.convert.stop()
        self._override.disable()
        self._media.cleanup()

    @staticmethod
    def _fake_convert(docx_path, out_dir, pdf_name):
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas as pdf_canvas
        path = os.path.join(out_dir, pdf_name)
        c = pdf_canvas.Canvas(path, pagesize=A4)
        c.drawString(100, 700, "SOP body text")
        c.save()
        return path

    def approve(self, copies, user=None, status=9):
        with mock.patch("dms_module.views.send_print_request_approval_email"):
            return self.f.client(user or self.f.doc_admin).post("/api/dms_module/print_approvals", {
                "print_request_id": self.print_request.id, "no_of_request_by_admin": copies, "status": status}, format="json")

    def print_copy(self):
        return self.f.client(self.f.employee).put(f"/api/dms_module/print_convert_pdf/{self.doc.id}",
                                                  {"print_request_id": self.print_request.id}, format="json")

    def test_each_copy_is_stamped_and_limit_enforced(self):
        from PyPDF2 import PdfReader
        self.assertEqual(self.approve(2).status_code, 200)
        numbers = []
        for expected in (1, 2):
            response = self.print_copy()
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data["print_count"], expected)
            pdf_path = os.path.join(self._media.name, response.data["pdf_link"].split("/media/")[1])
            text = PdfReader(pdf_path).pages[0].extract_text()
            self.assertIn(response.data["approval_number"], text)
            self.assertIn("Controlled Copy", text)
            self.assertIn("EFFECTIVE", text)
            numbers.append(response.data["approval_number"])
        self.assertEqual(len(set(numbers)), 2)  # every copy has its own number
        third = self.print_copy()
        self.assertEqual(third.status_code, 403)
        self.assertIn("limit", third.data["message"].lower())

    def test_cannot_print_before_approval(self):
        self.assertEqual(self.print_copy().status_code, 400)

    def test_rejection_issues_no_copy_numbers(self):
        from dms_module.models import ApprovalNumber
        self.assertEqual(self.approve(0, status=11).status_code, 200)
        self.assertEqual(ApprovalNumber.objects.count(), 0)
        self.assertEqual(self.print_copy().status_code, 400)

    def test_requester_cannot_approve_own_request_and_only_once(self):
        self.f.employee.groups.add(self.f.groups["Doc Admin"])
        self.assertEqual(self.approve(1, user=self.f.employee).status_code, 403)
        self.assertEqual(self.approve(1).status_code, 200)
        self.assertEqual(self.approve(1).status_code, 400)
