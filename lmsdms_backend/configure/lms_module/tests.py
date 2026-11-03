from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone

from lms_module.models import (
    AttemptedQuiz, ClassroomTraining, JobAssign, JobDescription, JobRole, QuizQuestion, Session, SessionComplete,
    TrainingQuestions, TrainingQuiz,
)
from user_profile.testing import Fixtures


def make_quiz(f, document, answers=("a", "b", "c"), pass_criteria=2, quiz_time=10):
    quiz = TrainingQuiz.objects.create(document=document, quiz_name="Quiz", pass_criteria=pass_criteria,
                                       quiz_time=quiz_time, quiz_type="manual", total_marks=len(answers))
    for i, answer in enumerate(answers):
        question = TrainingQuestions.objects.create(document=document, question_type="mcq",
                                                    question_text=f"Q{i}", correct_answer=answer, marks=1)
        QuizQuestion.objects.create(quiz=quiz, question=question, marks=1)
    return quiz


@override_settings(QUIZ_MAX_ATTEMPTS=3)
class AssessmentAttemptTests(TestCase):
    def setUp(self):
        self.f = Fixtures()
        self.doc = self.f.document("BPL/Quality Assurance/001", training_required=True)
        self.quiz = make_quiz(self.f, self.doc)
        self.client = self.f.client(self.f.employee)

    def start(self):
        return self.client.put("/api/lms_module/once_training_attempted",
                               {"document_id": self.doc.id, "quiz_id": self.quiz.id}, format="json")

    def submit(self, answers, **extra):
        questions = [{"question_id": qq.id, "user_answer": answers[i]}
                     for i, qq in enumerate(self.quiz.questions.order_by("id"))]
        payload = {"document_id": self.doc.id, "quiz_id": self.quiz.id, "questions": questions, **extra}
        return self.client.post("/api/lms_module/attempted_quiz", payload, format="json")

    def fail_once(self):
        self.assertEqual(self.start().status_code, 200)
        self.assertEqual(self.submit(["x", "x", "x"]).status_code, 200)

    def test_score_is_computed_on_server(self):
        self.start()
        response = self.submit(["a", "x", "x"], obtain_marks=3, total_marks=3, is_pass=True)
        self.assertEqual(response.data["data"]["obtained_marks"], 1)
        self.assertFalse(response.data["data"]["is_pass"])
        attempt = AttemptedQuiz.objects.get(user=self.f.employee, obtain_marks__isnull=False)
        self.assertFalse(attempt.is_pass)

    def test_fourth_attempt_is_blocked(self):
        for _ in range(3):
            self.fail_once()
        response = self.start()
        self.assertEqual(response.status_code, 403)
        self.assertTrue(response.data["max_attempts_reached"])
        self.assertEqual(AttemptedQuiz.objects.filter(user=self.f.employee).count(), 3)

    def test_abandoned_attempt_counts_and_blacklists(self):
        self.assertEqual(self.start().status_code, 200)
        AttemptedQuiz.objects.filter(user=self.f.employee).update(created_at=timezone.now() - timedelta(hours=2))
        response = self.start()
        self.assertEqual(response.status_code, 403)
        self.assertTrue(response.data["blacklisted"])

    def test_reload_inside_time_window_does_not_count_twice(self):
        self.start()
        response = self.start()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["attempt"], 1)

    def test_retraining_after_last_attempt_unlocks_new_cycle(self):
        for _ in range(3):
            self.fail_once()
        classroom = ClassroomTraining.objects.create(document=self.doc, is_assesment="with_assessment",
                                                     classroom_name="Retraining", description="-")
        session = Session.objects.create(session_name="S1", venue="Room", start_date=timezone.now() + timedelta(minutes=1),
                                         start_time="10:00", classroom=classroom)
        SessionComplete.objects.create(user=self.f.employee, session=session, is_completed=True)
        response = self.start()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["data"]["attempt"], 1)

    def test_admin_reactivation_clears_blacklist(self):
        self.start()
        AttemptedQuiz.objects.filter(user=self.f.employee).update(created_at=timezone.now() - timedelta(hours=2))
        response = self.f.client(self.f.dtc).put("/api/lms_module/on_off_user_for_training", {
            "user_id": self.f.employee.id, "document_id": self.doc.id, "is_active": True}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.start().status_code, 200)

    def test_attempt_history_visible_even_after_quiz_deactivated(self):
        self.fail_once()
        TrainingQuiz.objects.filter(id=self.quiz.id).update(status=False)
        response = self.f.client(self.f.dtc).post("/api/lms_module/user_id_wise_no_of_attempts",
                                                  {"user_id": self.f.employee.id}, format="json")
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["attempts"], "1")


class TrainingListTests(TestCase):
    def setUp(self):
        self.f = Fixtures()
        self.role = JobRole.objects.create(job_role_name="Operator")
        JobAssign.objects.create(user=self.f.employee).job_roles.add(self.role)

    def documents(self):
        response = self.f.client(self.f.employee).get("/api/lms_module/create_training")
        return {d["id"]: d for d in response.data["document_data"]["documents"]}

    def test_child_format_mapped_with_parent_is_listed(self):
        sop = self.f.document("BPL/Quality Assurance/001", status_id=7)
        fmt = self.f.document("BPL/Quality Assurance/001/F001", status_id=6, doc_type=self.f.format_type,
                              parent=sop, training_required=True)
        response = self.f.client(self.f.dtc).post("/api/lms_module/training_assign_jobrole",
                                                  {"job_role_id": self.role.id, "document_ids": [sop.id]}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(set(self.documents()), {sop.id, fmt.id})

    def test_latest_version_compares_numerically_and_hides_drafts(self):
        v9 = self.f.document("BPL/Quality Assurance/002", version="1.9", status_id=12)
        v10 = self.f.document("BPL/Quality Assurance/002", version="1.10", status_id=7)
        draft = self.f.document("BPL/Quality Assurance/002", version="1.11", status_id=10)
        for doc in (v9, v10, draft):
            doc.job_roles.add(self.role)
        self.assertEqual(set(self.documents()), {v10.id})

    def test_quiz_list_is_newest_first(self):
        doc = self.f.document("BPL/Quality Assurance/003")
        make_quiz(self.f, doc)
        newest = make_quiz(self.f, doc, answers=("a",), pass_criteria=1)
        for _ in range(5):
            response = self.f.client(self.f.employee).get(f"/api/lms_module/list_training_quiz/{doc.id}")
            self.assertEqual(response.data["data"][0]["id"], newest.id)


class JobDescriptionTests(TestCase):
    def setUp(self):
        self.f = Fixtures()
        self.dtc = self.f.client(self.f.dtc)

    def save(self, text):
        return self.dtc.put("/api/lms_module/save_jobdescription",
                            {"user_id": self.f.employee.id, "employee_job_description": text}, format="json")

    def test_save_then_submit_reuses_draft(self):
        self.assertEqual(self.save("draft text").status_code, 200)
        response = self.dtc.post("/api/lms_module/jobdescriptioncreate",
                                 {"user_id": self.f.employee.id, "employee_job_description": "final"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        jd = JobDescription.objects.get(user=self.f.employee)
        self.assertEqual((jd.status, jd.employee_job_description), ("pending", "final"))

    def test_non_dtc_gets_real_error(self):
        response = self.f.client(self.f.author).put("/api/lms_module/save_jobdescription",
                                                    {"user_id": self.f.employee.id, "employee_job_description": "x"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_approved_description_is_not_overwritten(self):
        jd = JobDescription.objects.create(user=self.f.employee, employee_job_description="approved", status="approved")
        self.assertEqual(self.save("new draft").status_code, 200)
        jd.refresh_from_db()
        self.assertEqual((jd.status, jd.employee_job_description), ("approved", "approved"))

    def test_edit_after_send_back_is_saved(self):
        jd = JobDescription.objects.create(user=self.f.employee, employee_job_description="old", status="send_back")
        response = self.dtc.put(f"/api/lms_module/jobdescriptionupdate/{jd.id}", {"employee_job_description": "fixed"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        jd.refresh_from_db()
        self.assertEqual(jd.employee_job_description, "fixed")
