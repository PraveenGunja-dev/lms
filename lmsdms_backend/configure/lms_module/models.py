from django.db import models
from django.utils import timezone
from user_profile.models import CustomUser,Department
from dms_module.models import *

class Plant(models.Model):
    plant_name = models.TextField()
    plant_location = models.TextField()
    plant_description = models.TextField(null=True, blank=True)
    plant_created_at = models.DateTimeField(auto_now_add=True)

# class Department(models.Model):
#     department_name = models.TextField()
#     department_description = models.TextField()
#     department_created_at = models.DateTimeField(auto_now_add=True)

class Area(models.Model):
    area_name = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE,null=True,blank=True)
    area_description = models.TextField()
    area_created_at = models.DateTimeField(auto_now_add=True)

class JobRole(models.Model):
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE,null=True,blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE,null=True,blank=True)
    area = models.ForeignKey(Area, on_delete=models.CASCADE,null=True,blank=True)
    job_role_name = models.TextField(null=True,blank=True)
    job_role_description = models.TextField(null=True,blank=True)

class JobAssign(models.Model):
    job_roles = models.ManyToManyField(JobRole,related_name='job_assigns')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='job_assigns')
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

class Assessment(models.Model):
    title = models.TextField(blank=True, null=True)
    time_limit = models.TextField(blank=True, null=True)
    sop_selection = models.TextField(blank=True, null=True)
    assign = models.TextField(blank=True, null=True)  
    pass_percentage = models.TextField(blank=True, null=True)
    number_of_attempts = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title

class AssessmentQuestion(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='questions',null=True,blank=True)
    sop = models.TextField(blank=True, null=True)  # Text field for SOP (Standard Operating Procedure)
    questions_data = models.JSONField()  # JSON field to store question, type, answers, etc.
    marks = models.TextField(blank=True, null=True)  # Text field for marks (e.g., "10 marks", "Pass/Fail", etc.)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    def __str__(self):
        return f"Assessment created by {self.created_by.full_name} on {self.created_at}"
    

class Methodology(models.Model):
    methodology_name = models.TextField()
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,blank=True, null=True)
    methodology_created_at = models.DateTimeField(auto_now_add=True)

class TrainingType(models.Model):
    training_type_name = models.TextField()
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,blank=True, null=True)
    training_type_created_at = models.DateTimeField(auto_now_add=True)


class TrainingCreate(models.Model):
    TRAINING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='assigned_trainings',null=True,blank=True)
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    training_type = models.ForeignKey(TrainingType, on_delete=models.CASCADE)
    training_number = models.CharField(max_length=255,null=True,blank=True)
    training_name = models.TextField(null=True,blank=True)
    training_version = models.CharField(max_length=255,null=True,blank=True)
    training_status = models.CharField(max_length=255,choices=TRAINING_STATUS_CHOICES,default='pending',null=True,blank=True)
    schedule_date = models.DateTimeField(null=True,blank=True)
    number_of_attempts = models.CharField(max_length=255,default='3',null=True,blank=True)
    refresher_time = models.DateTimeField(null=True,blank=True)
    training_document = models.FileField(upload_to='training_documents/')
    methodology = models.ManyToManyField(Methodology)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,blank=True, null=True)
    job_roles = models.ManyToManyField(JobRole)
    training_created_at = models.DateTimeField(auto_now_add=True)
    training_updated_at = models.DateTimeField(auto_now=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

class TrainingSection(models.Model):
    training = models.ForeignKey(TrainingCreate, related_name='sections', on_delete=models.CASCADE,null=True, blank=True)
    document = models.ForeignKey(Document, related_name='document_train', on_delete=models.CASCADE,null=True, blank=True)
    section_name = models.CharField(max_length=255)
    section_description = models.TextField(null=True, blank=True)
    section_order = models.CharField(max_length=255, default='1')
    reason_for_update = models.TextField(null=True, blank=True)
    training_section_active_status = models.BooleanField(default=True, null=True,blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='training_sections_created', null=True, blank=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='training_sections_updated',null=True, blank=True)
    section_created_at = models.DateTimeField(auto_now_add=True, null=True,blank=True)
    section_updated_at = models.DateTimeField(auto_now=True,null=True,blank=True)

    
class TrainingMaterialAttachments(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE,null=True,blank=True)
    material_file = models.FileField(upload_to='training_material_attachments',null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True,null=True,blank=True)
    updated_at = models.DateTimeField(auto_now=True,null=True,blank=True)

class TrainingMaterial(models.Model):
    MATERIAL_CHOICES = (
        ('pdf', 'PDF'),
        ('image', 'Image'),
        ('audio', 'Audio'),
        ('video', 'Video'),
        ('html', 'HTML'),
        ('scorm', 'SCORM'),
        ('import', 'Import'),
    )
    section = models.ForeignKey(TrainingSection, related_name='materials', on_delete=models.CASCADE,null=True,blank=True)
    material_title = models.CharField(max_length=255,null=True,blank=True)
    material_type = models.CharField(max_length=50, choices=MATERIAL_CHOICES,null=True,blank=True)
    material_file = models.ManyToManyField(TrainingMaterialAttachments)
    minimum_reading_time = models.CharField(max_length=500, null=True, blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='training_materials_created', null=True, blank=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='training_materials_updated', null=True, blank=True)
    material_created_at = models.DateTimeField(auto_now_add=True)
    material_updated_at = models.DateTimeField(auto_now=True)
    reading_start_time = models.DateTimeField(null=True, blank=True)
    reading_end_time = models.DateTimeField(null=True, blank=True)



class MaterialReadingTime(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    material = models.ForeignKey(TrainingMaterial, on_delete=models.CASCADE)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    time_spent = models.DurationField(null=True, blank=True)

class TrainingQuestions(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('mcq', 'MCQ'),
        ('fill_in_the_blank', 'Fill in the blank'),
        ('true_false', 'True/False'),
    )
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    training = models.ForeignKey(TrainingCreate, related_name='questions', on_delete=models.CASCADE, null=True, blank=True)
    question_type = models.CharField(max_length=50, choices=QUESTION_TYPE_CHOICES)
    selected_file_type = models.CharField(max_length=50, null=True, blank=True)
    selected_file = models.FileField(upload_to='question_files/', null=True, blank=True)
    question_text = models.TextField()
    options = models.JSONField(null=True, blank=True)  # Store options for MCQ questions (as a list of strings)
    correct_answer = models.TextField()  # Store the correct answer (can be the option value or index)
    marks = models.PositiveIntegerField(default=1)  # Marks for the question
    status = models.BooleanField(default=True)  # Active/Inactive status
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='training_questions_created', null=True, blank=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='training_questions_updated', null=True, blank=True)
    question_created_at = models.DateTimeField(auto_now_add=True)
    question_updated_at = models.DateTimeField(auto_now=True)

    

class TrainingQuiz(models.Model):
    QUIZ_TYPE_CHOICES = (
        ('auto', 'Automatic'),
        ('manual', 'Manual'),
    )
    training = models.ForeignKey(TrainingCreate, related_name='quizzes', on_delete=models.CASCADE,null=True, blank=True)
    document = models.ForeignKey(Document,on_delete=models.CASCADE,null=True, blank=True)
    quiz_name = models.CharField(max_length=255)
    pass_criteria = models.DecimalField(max_digits=5, decimal_places=2)  # For example, pass if >= 50%
    quiz_time = models.PositiveIntegerField(null=True, blank=True)  # Time in minutes
    total_marks = models.PositiveIntegerField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(null=True, blank=True)
    marks_breakdown = models.JSONField(null=True, blank=True)  # Store marks breakdown for each question type (if needed)
    quiz_type = models.CharField(max_length=10, choices=QUIZ_TYPE_CHOICES,null=True, blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='training_quizzes_created', null=True, blank=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='training_quizzes_updated', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.BooleanField(default=True,null=True,blank=True)

    def get_total_marks(self):
        return sum([q.marks for q in self.questions.all()])


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(TrainingQuiz, related_name="questions", on_delete=models.CASCADE)
    question = models.ForeignKey(TrainingQuestions, on_delete=models.CASCADE)
    marks = models.PositiveIntegerField()

    def __str__(self):
        return f"Quiz {self.quiz.id} - Question {self.question.id} ({self.marks} marks)"

# Code for induction create
class Induction(models.Model):
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE,blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True)
    induction_name = models.CharField(max_length=255)
    trainings = models.ManyToManyField(TrainingCreate, related_name='inductions')
    document = models.FileField(upload_to='induction_documents/', null=True, blank=True)  # Upload PPT
    pdf_document = models.FileField(upload_to='induction_documents/pdf/', null=True, blank=True)  # Converted PDF
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.induction_name    
    

class InductionDesignation(models.Model):
    induction_designation_name = models.CharField(max_length=255)
    designation_code = models.CharField(max_length=50)
    induction = models.ForeignKey(Induction, on_delete=models.CASCADE, related_name='induction_designations')
    created_date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,blank=True, null=True)

    def __str__(self):
        return self.induction_designation_name    

class Trainer(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    trainer_name = models.CharField(max_length=255)
    employee_code = models.CharField(max_length=255, blank=True, null=True)
    designation = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    is_active = models.BooleanField(default=False, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
class ClassroomTraining(models.Model):
    TRAINING_TYPE_CHOICES = [
        ('with_assessment', 'With Assessment'),
        ('without_assessment', 'Without Assessment'),
    ]
    ONLINE_OFFLINE_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('completed', 'Completed'),
        ('in_progress', 'In Progress'),
    ]
    user = models.ManyToManyField(CustomUser)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    # classroom_training_type = models.CharField(max_length=20, choices=TRAINING_TYPE_CHOICES)
    # title = models.CharField(max_length=255)
    # description = models.TextField()
    # department_or_employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classroom_trainings',blank=True, null=True)
    # document = models.FileField(upload_to='classroom_trainings/', null=True, blank=True)
    # sop = models.CharField(max_length=255)  # Assuming SOP refers to a string value
    start_date = models.DateField(auto_now_add=True, null=True, blank=True)
    online_offline_status = models.CharField(max_length=255,choices=ONLINE_OFFLINE_CHOICES, null=True, blank=True)
    # start_time = models.TimeField()
    # end_time = models.TimeField()
    # created_at = models.DateTimeField(auto_now_add=True)
    # created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_classroom_trainings')
    # status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    # acknowledged_by_employee = models.BooleanField(default=False)  # To track if employee acknowledged the training
    is_assesment = models.CharField(max_length=20, choices=TRAINING_TYPE_CHOICES)
    classroom_name = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    trainer = models.ForeignKey(Trainer, on_delete=models.CASCADE, null=True, blank=True)
    is_all_completed = models.BooleanField(default=False, null=True, blank=True)
    is_assessment_completed = models.BooleanField(default=False, null=True, blank=True)
    assesment_user_completed = models.BooleanField(default=False, null=True, blank=True)


class IsPreviewForClassroom(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True,blank=True)
    classroom = models.ForeignKey(ClassroomTraining, on_delete=models.CASCADE, null=True, blank=True)
    is_preview = models.BooleanField(default=False, null=True, blank=True)

class ClassroomTrainingFile(models.Model):
    classroom_training = models.ForeignKey(ClassroomTraining, related_name='files', on_delete=models.CASCADE)
    upload_doc = models.FileField(upload_to='classroom_trainings/', null=True, blank=True)

class Session(models.Model):
    session_name = models.CharField(max_length=255)
    venue = models.CharField(max_length=255)
    start_date = models.DateTimeField()
    # end_date = models.DateTimeField()
    start_time = models.TimeField()
    # end_time = models.TimeField()
    user_ids = models.ManyToManyField(CustomUser)
    classroom = models.ForeignKey(ClassroomTraining, related_name="sessions", on_delete=models.CASCADE)
    attend = models.BooleanField(default=False)

class SessionComplete(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True,blank=True)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)

class Attendance(models.Model):
    PRESENT = 'present'
    ABSENT = 'absent'
    STATUS_CHOICES = [
        (PRESENT, 'Present'),
        (ABSENT, 'Absent'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ABSENT)

class TrainingMatrix(models.Model):
    EVALUATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    training = models.ForeignKey(TrainingCreate, on_delete=models.CASCADE)
    training_duration = models.DateTimeField(null=True, blank=True)
    evaluation_status = models.CharField(max_length=255, choices=EVALUATION_STATUS_CHOICES, null=True, blank=True)
    assigned_user = models.ManyToManyField(CustomUser)
    assigned_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True,related_name='assigned_by_training_matrices')
    assigned_role = models.ForeignKey(JobRole, on_delete=models.CASCADE, null=True, blank=True,related_name='assigned_user_training_matrices')
    due_reason = models.TextField(null=True, blank=True)
    
    

class QuizSession(models.Model):
    STATUS_CHOICES = (
        ('try_again', 'Try Again'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
    )
    training = models.ForeignKey(TrainingCreate, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    quiz = models.ForeignKey(TrainingQuiz, on_delete=models.CASCADE)
    current_question_index = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='try_again')  # Updated status field
    attempts = models.PositiveIntegerField(default=0)
    document_version = models.CharField(max_length=10, null=True, blank=True)

class HRacknowledgement(models.Model):
    remarks = models.TextField(null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

class AttemptLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    quiz_session = models.ForeignKey(TrainingQuiz, on_delete=models.CASCADE)
    question_id = models.ForeignKey(TrainingQuestions, on_delete=models.CASCADE)


class ClassroomQuestion(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('mcq', 'MCQ'),
        ('fill_in_the_blank', 'Fill in the blank'),
        ('true_false', 'True/False'),
    )
    classroom = models.ForeignKey(ClassroomTraining, on_delete=models.CASCADE, null=True, blank=True)
    question_type = models.CharField(max_length=50, choices=QUESTION_TYPE_CHOICES)
    selected_file_type = models.CharField(max_length=50, null=True, blank=True)
    selected_file = models.FileField(upload_to='question_files/', null=True, blank=True)
    question_text = models.TextField()
    options = models.JSONField(null=True, blank=True)  # Store options for MCQ questions (as a list of strings)
    correct_answer = models.TextField()  # Store the correct answer (can be the option value or index)
    marks = models.PositiveIntegerField(default=1)  # Marks for the question
    status = models.BooleanField(default=True)  # Active/Inactive status
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classroomm_questions_created', null=True, blank=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classroomm_questions_updated', null=True, blank=True)
    question_created_at = models.DateTimeField(auto_now_add=True)
    question_updated_at = models.DateTimeField(auto_now=True)

class ClassroomQuiz(models.Model):
    QUIZ_TYPE_CHOICES = (
        ('manual', 'Manual'),
    )
    classroom = models.ForeignKey(ClassroomTraining, on_delete=models.CASCADE, null=True, blank=True)
    question = models.ForeignKey(ClassroomQuestion, on_delete=models.CASCADE, null=True, blank=True)
    quiz_name = models.CharField(max_length=255)
    pass_criteria = models.DecimalField(max_digits=5, decimal_places=2)  # For example, pass if >= 50%
    quiz_time = models.PositiveIntegerField(null=True, blank=True)  # Time in minutes
    total_marks = models.PositiveIntegerField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(null=True, blank=True)
    quiz_type = models.CharField(max_length=10, choices=QUIZ_TYPE_CHOICES,null=True, blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='classroom_quizzes_created', null=True, blank=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE,related_name='classroom_quizzes_updated', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.BooleanField(default=True,null=True,blank=True)

    def get_total_marks(self):
        return sum([q.marks for q in self.questions.all()])
    
class ClassroomquizQuestion(models.Model):
    quiz = models.ForeignKey(ClassroomQuiz, related_name="questions", on_delete=models.CASCADE)
    question = models.ForeignKey(ClassroomQuestion, on_delete=models.CASCADE)
    marks = models.PositiveIntegerField()

class ClassroomQuizSession(models.Model):
    STATUS_CHOICES = (
        ('try_again', 'Try Again'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    quiz = models.ForeignKey(ClassroomQuiz, on_delete=models.CASCADE)
    current_question_index = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='try_again')  # Updated status field
    attempts = models.PositiveIntegerField(default=0)

class JobDescription(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('send_back', 'Send_back'),
    )
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE,null=True, blank=True) 
    job_role = models.ForeignKey(JobRole, on_delete=models.CASCADE,null=True, blank=True) 
    employee_job_description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True,null=True, blank=True)

class HODRemark(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('send_back', 'Send_back'),
    )
    employee_job_description = models.ForeignKey(JobDescription, on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE,null=True, blank=True) 
    remarks = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)

class AttemptedQuiz(models.Model):
    quiz_session = models.ForeignKey(QuizSession, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    quiz = models.ForeignKey(TrainingQuiz, on_delete=models.CASCADE, null=True, blank=True)
    obtain_marks = models.CharField(max_length=500, null=True, blank=True)
    total_marks = models.CharField(max_length=500, null=True, blank=True)
    total_taken_time = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    is_pass = models.BooleanField(default=False, blank=True, null=True)
    training_assesment_attempted = models.BooleanField(default=False, blank=True, null=True)
    attempt_count = models.PositiveIntegerField(default=0)
class AttemptedQuizQuestion(models.Model):
    attempted_quiz = models.ForeignKey(AttemptedQuiz, on_delete=models.CASCADE, null=True, blank=True)
    question_id = models.CharField(max_length=500, null=True, blank=True)
    question_text = models.CharField(max_length=500, null=True, blank=True)
    user_answer = models.CharField(max_length=500, null=True, blank=True)
    correct_answer = models.CharField(max_length=500, null=True, blank=True)

class AttemptedIncorrectAnswer(models.Model):
    attempted_quiz = models.ForeignKey(AttemptedQuiz, on_delete=models.CASCADE, null=True, blank=True)
    question_id = models.CharField(max_length=500, null=True, blank=True)
    question_text = models.CharField(max_length=500, null=True, blank=True)
    user_answer = models.CharField(max_length=500, null=True, blank=True)
    correct_answer = models.CharField(max_length=500, null=True, blank=True)

class AttemptedCorrectAnswer(models.Model):
    attempted_quiz = models.ForeignKey(AttemptedQuiz, on_delete=models.CASCADE, null=True, blank=True)
    question_id = models.CharField(max_length=500, null=True, blank=True)
    question_text = models.CharField(max_length=500, null=True, blank=True)
    user_answer = models.CharField(max_length=500, null=True, blank=True)
    correct_answer = models.CharField(max_length=500, null=True, blank=True)


class UserCompleteViewDocument(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)



class ClassroomAttemptedQuiz(models.Model):
    # quiz_session = models.ForeignKey(QuizSession, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    # document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    classroom = models.ForeignKey(ClassroomTraining, on_delete=models.CASCADE, null=True, blank=True)
    quiz = models.ForeignKey(ClassroomQuiz, on_delete=models.CASCADE, null=True, blank=True)
    training_quiz = models.ForeignKey(TrainingQuiz, on_delete=models.CASCADE, null=True, blank=True)
    obtain_marks = models.CharField(max_length=500, null=True, blank=True)
    total_marks = models.CharField(max_length=500, null=True, blank=True)
    total_taken_time = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    is_pass = models.BooleanField(default=False, blank=True, null=True)
    classroom_attempted = models.BooleanField(default=False, blank=True, null=True)

class ClassroomAttemptedQuizQuestion(models.Model):
    attempted_quiz = models.ForeignKey(ClassroomAttemptedQuiz, on_delete=models.CASCADE, null=True, blank=True)
    question_id = models.CharField(max_length=500, null=True, blank=True)
    question_text = models.CharField(max_length=500, null=True, blank=True)
    user_answer = models.CharField(max_length=500, null=True, blank=True)
    correct_answer = models.CharField(max_length=500, null=True, blank=True)

class ClassroomAttemptedIncorrectAnswer(models.Model):
    attempted_quiz = models.ForeignKey(ClassroomAttemptedQuiz, on_delete=models.CASCADE, null=True, blank=True)
    question_id = models.CharField(max_length=500, null=True, blank=True)
    question_text = models.CharField(max_length=500, null=True, blank=True)
    user_answer = models.CharField(max_length=500, null=True, blank=True)
    correct_answer = models.CharField(max_length=500, null=True, blank=True)

class ClassroomAttemptedCorrectAnswer(models.Model):
    attempted_quiz = models.ForeignKey(ClassroomAttemptedQuiz, on_delete=models.CASCADE, null=True, blank=True)
    question_id = models.CharField(max_length=500, null=True, blank=True)
    question_text = models.CharField(max_length=500, null=True, blank=True)
    user_answer = models.CharField(max_length=500, null=True, blank=True)
    correct_answer = models.CharField(max_length=500, null=True, blank=True)

class ClassroomTrainingUser(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    classroom_training = models.ForeignKey(ClassroomTraining, on_delete=models.CASCADE)
    assessment_completed = models.BooleanField(default=False) 