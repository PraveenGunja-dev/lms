     
from .models import *
from rest_framework import serializers
from django.contrib.auth.models import Group, Permission
from user_profile.function_call import *


class GetDepartmentSerializer(serializers.ModelSerializer):
    # department_created_at = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'department_name', 'department_description', 'department_created_at']

    # def get_department_created_at(self, obj):
    #     if obj.department_created_at:
    #         return obj.department_created_at.strftime('%d-%m-%Y')
    #     return None

class GetPlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plant
        fields = ['id', 'plant_name', 'plant_location', 'plant_description', 'plant_created_at']

class GetJobRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ['job_role_name', 'job_role_description']

class GetAreaSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.department_name')
    class Meta:
        model = Area
        fields = ['id', 'area_name', 'department','department_name', 'area_description', 'area_created_at']

class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__' 

class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = '__all__'

class MethodologySerializer(serializers.ModelSerializer):
    created_by_first_name = serializers.ReadOnlyField(source='created_by.first_name')
    created_by_last_name = serializers.ReadOnlyField(source='created_by.last_name') 

    class Meta:
        model = Methodology
        fields = ['id', 'methodology_name','created_by', 'created_by_first_name','created_by_last_name','methodology_created_at']

class TrainingTypeSerializer(serializers.ModelSerializer):
    created_by_first_name = serializers.ReadOnlyField(source='created_by.first_name')
    created_by_last_name = serializers.ReadOnlyField(source='created_by.last_name')
    class Meta:
        model = TrainingType
        fields = ['id', 'training_type_name', 'created_by', 'created_by_first_name','created_by_last_name','training_type_created_at']

class TrainingCreateSerializer(serializers.ModelSerializer):
    plant_name = serializers.CharField(source='plant.plant_name', read_only=True)
    training_type_name = serializers.CharField(source='training_type.training_type_name', read_only=True)
    methodology = MethodologySerializer(many=True)
    training_document = serializers.SerializerMethodField()
    created_by_name = serializers.ReadOnlyField(source='created_by.first_name')
    job_roles_name = serializers.SerializerMethodField()
    training_assesment_attempted = serializers.SerializerMethodField()

    class Meta:
        model = TrainingCreate
        fields = [
            'id', 'plant', 'plant_name', 'training_name', 'training_type', 'training_type_name',
            'training_number', 'training_version', 'refresher_time',
            'training_document', 'methodology', 'created_by', 'created_by_name','job_roles','job_roles_name',
            'training_created_at', 'training_updated_at','schedule_date','number_of_attempts','training_status','start_time','end_time', 'training_assesment_attempted','attempt_count'
        ]

        
    def get_attempt_count(self, obj):
        user = self.context['request'].user
        document = obj.document
        quiz = obj.quiz
        try:
            attempted = AttemptedQuiz.objects.get(user=user, document=document, quiz=quiz)
            return attempted.attempt_count
        except AttemptedQuiz.DoesNotExist:
            return 0    

    def get_training_assesment_attempted(self, obj):
        request = self.context.get('request')
        user = request.user
        document_ids = obj.training_document.values_list('id', flat=True)
        
        return AttemptedQuiz.objects.filter(user=user, document_id__in=document_ids, training_assesment_attempted=True).exists()
    def get_training_document(self, obj):

        if obj.training_document and hasattr(obj.training_document, 'url'):
            request = self.context.get('request')
            return request.build_absolute_uri(obj.training_document.url)
        return None

    def get_methodology_name(self, obj):

        if obj.methodology.exists():
            return [methodology.methodology_name for methodology in obj.methodology.all()]
        return []
    
    def get_job_roles_name(self, obj):
        if obj.job_roles.exists():
            return [job_role.job_role_name for job_role in obj.job_roles.all()]
        return []
    
class TrainingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingCreate
        fields = ['id','training_name','training_status']

class TrainingSectionSerializer(serializers.ModelSerializer):
    training_name = serializers.ReadOnlyField(source='training.training_name')
    class Meta:
        model = TrainingSection
        fields = ['id', 'training','document','training_name','section_name', 'section_description', 'section_order']

    


class TrainingMaterialSerializer(serializers.ModelSerializer):
    material_file_url = serializers.SerializerMethodField()
    section_data = TrainingSectionSerializer(source='section', read_only=True)

    class Meta:
        model = TrainingMaterial
        fields = ['id', 'material_title', 'material_type', 'material_file_url', 'minimum_reading_time', 'material_created_at', 'section_data']

    def get_material_file_url(self, obj):
        request = self.context.get('request')
        if obj.material_file.exists():
            return request.build_absolute_uri(obj.material_file.first().material_file.url)
        return None

class TrainingNestedSectionSerializer(serializers.ModelSerializer):
    training_name = serializers.CharField(source='training.training_name', read_only=True)
    material = TrainingMaterialSerializer(many=True, source='materials')  # Use 'materials' to reference related materials
    class Meta:
        model = TrainingSection
        fields = ['id', 'training', 'training_name', 'section_name', 'section_description', 'section_order', 'material']

class TrainingQuestinSerializer(serializers.ModelSerializer):
    # Create custom fields to return URLs for audio and video files
    selected_file = serializers.SerializerMethodField()

    class Meta:
        model = TrainingQuestions
        fields = [
            'id', 'training', 'document', 'question_type', 'question_text', 'options', 
            'correct_answer', 'marks', 'status', 
            'question_created_at', 'question_updated_at', 
            'created_by', 'updated_by','selected_file_type','selected_file'
        ]

    def get_selected_file(self, obj):
        request = self.context.get('request')
        if obj.selected_file and hasattr(obj.selected_file, 'url'):
            return request.build_absolute_uri(obj.selected_file.url)
        return None
    

class QuizQuestionSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text')
    options = serializers.SerializerMethodField()
    correct_answer = serializers.CharField(source='question.correct_answer')
    selected_file = serializers.SerializerMethodField()
    selected_file_type = serializers.CharField(source='question.selected_file_type')
    question_type = serializers.CharField(source='question.question_type')
    status = serializers.BooleanField(source='question.status')  # Adding status field
    class Meta:
        model = QuizQuestion
        fields = ['id','question', 'marks','question_text','options','correct_answer','selected_file_type','selected_file','question_type','status']
    def get_options(self, obj):
        return obj.question.options
    
    def get_selected_file(self, obj):
        request = self.context.get('request')
        if obj.question.selected_file and hasattr(obj.question.selected_file, 'url'):
            return request.build_absolute_uri(obj.question.selected_file.url)
        return None
    

class TrainingQuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True)

    class Meta:
        model = TrainingQuiz
        fields = ['id', 'marks_breakdown', 'quiz_name', 'pass_criteria', 'quiz_time', 'total_marks', 'total_questions', 'quiz_type', 'questions', 'created_by','updated_by','created_at','updated_at','status', 'document']

class TrainingSerializerForInductionNested(serializers.ModelSerializer):
    plant_name = serializers.CharField(source='plant.plant_name', read_only=True)
    training_type_name = serializers.CharField(source='training_type.training_type_name', read_only=True)
    training_document = serializers.SerializerMethodField()
    created_by_name = serializers.ReadOnlyField(source='created_by.first_name')
    job_roles_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainingCreate
        fields = [
            'id', 'plant', 'plant_name', 'training_name', 'training_type', 'training_type_name',
            'training_number', 'training_version', 'refresher_time',
            'training_document', 'created_by', 'created_by_name','job_roles','job_roles_name',
            'training_created_at', 'training_updated_at','schedule_date','number_of_attempts','training_status','start_time','end_time'
        ]

    def get_training_document(self, obj):

        if obj.training_document and hasattr(obj.training_document, 'url'):
            request = self.context.get('request')
            return request.build_absolute_uri(obj.training_document.url)
        return None

    # def get_methodology_name(self, obj):

    #     if obj.methodology.exists():
    #         return [methodology.methodology_name for methodology in obj.methodology.all()]
    #     return []
    
    def get_job_roles_name(self, obj):
        if obj.job_roles.exists():
            return [job_role.job_role_name for job_role in obj.job_roles.all()]
        return []


class InductionSerializer(serializers.ModelSerializer):
    trainings = TrainingSerializerForInductionNested(many=True)
    
    class Meta:
        model = Induction
        fields = ['id', 'induction_name', 'trainings', 'plant', 'department', 'document', 'pdf_document', 'created_at', 'updated_at']

    def get_pdf_document(self, obj):
        if obj.pdf_document:
            return obj.pdf_document.url
        return None

class InductionDesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InductionDesignation
        fields = ['id', 'induction_designation_name', 'designation_code', 'induction', 'created_date', 'created_by']
        read_only_fields = ['created_date', 'created_by']        

class ClassroomTrainingFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassroomTrainingFile
        fields = ['upload_doc']

class ClassroomTrainingSerializer(serializers.ModelSerializer):
    files = ClassroomTrainingFileSerializer(many=True, read_only=True)
    classroom_id = serializers.IntegerField(source='id')
    classroom_attempted = serializers.SerializerMethodField()
    classroom_assessment_done = serializers.SerializerMethodField()
    quiz_count = serializers.SerializerMethodField()
    is_preview = serializers.SerializerMethodField()
    class Meta:
        model = ClassroomTraining
        fields = ['quiz_count', 'classroom_id', 'document', 'classroom_name', 'is_assesment', 'description', 'status', 'files', 'created_at', 'trainer', 'user', 'is_all_completed', 'is_assessment_completed', 'online_offline_status', 'classroom_attempted','classroom_assessment_done', 'is_preview']
    # department_of_employee_first_name  = serializers.ReadOnlyField(source='department_or_employee.first_name')
    # department_of_employee_last_name = serializers.ReadOnlyField(source='department_or_employee.last_name')
    # class Meta:
    #     model = ClassroomTraining
    #     fields = [    
    #         'id', 'classroom_training_type', 'title', 'description', 'department_or_employee','department_of_employee_first_name','department_of_employee_last_name',
    #         'document', 'sop', 'start_date', 'start_time', 'end_time',
    #         'created_at', 'created_by', 'status','acknowledged_by_employee'
    #     ]
    def get_is_preview(self,obj):
        request = self.context.get('request')
        if request and hasattr(request, "user"):
            return IsPreviewForClassroom.objects.filter(user=request.user,classroom=obj,is_preview=True).exists()
        return False   

    def get_quiz_count(self,obj):
        if obj and obj.document:
            return TrainingQuiz.objects.filter(document=obj.document).count()
        else:
            return ClassroomQuiz.objects.filter(classroom=obj).count()
    def get_classroom_assessment_done(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, "user"):
            return ClassroomTrainingUser.objects.filter(user=request.user, classroom_training=obj, assessment_completed=True).exists()
        return False
    def get_classroom_attempted(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, "user"):
            for_me = ClassroomAttemptedQuiz.objects.filter(user=request.user, classroom=obj).order_by('-created_at').first()
            print(f"AttemptedQuiz: {for_me}")
            if for_me:
                return for_me.classroom_attempted
            return False
class SessionSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    class Meta:
        model = Session
        fields = ['id', 'session_name', 'venue', 'start_date', 'start_time', 'classroom_id', 'is_completed', 'user_ids', 'attend']

    def get_is_completed(self, obj):
        session_complete = SessionComplete.objects.filter(session=obj, is_completed=True).first()
        return session_complete is not None

class SessionCompleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionComplete
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'
# class TrainingListSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = TrainingCreate
#         fields = ['id','plant', 'training_type', 'training_version', 'training_number', 'refresher_time']

class TrainingListSerializer(serializers.ModelSerializer):
    training_name_with_number = serializers.SerializerMethodField()

    class Meta:
        model = TrainingCreate
        fields = ['id', 'training_name_with_number']

    def get_training_name_with_number(self, obj):
        return f"{obj.training_name} ({obj.training_number})"

class TrainingMatrixAssignUserSerializer(serializers.ModelSerializer):
    assigned_user_details = serializers.SerializerMethodField()
    assigned_by_details = serializers.SerializerMethodField()
    assigned_role_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainingMatrix
        fields = [
            'id', 'training', 'training_duration', 'evaluation_status', 'assigned_user',
            'assigned_user_details', 'assigned_by', 'assigned_by_details', 'assigned_role', 'assigned_role_name', 'due_reason'
        ]
    
    def get_assigned_user_details(self, obj):
        # Get details of all users in assigned_user (ManyToManyField)
        users = obj.assigned_user.all()
        return [
            {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
            for user in users
        ]

    def get_assigned_by_details(self, obj):
        # Check if assigned_by exists (ForeignKey to a single CustomUser)
        if obj.assigned_by:
            user = obj.assigned_by
            return {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        return None

    def get_assigned_role_name(self, obj):
        # Return the role name if assigned_role exists
        if obj.assigned_role:
            return obj.assigned_role.job_role_name
        return None

class GetJobRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ['id', 'job_role_name', 'job_role_description', 'plant', 'department', 'area']

class TrainingSerializer(serializers.ModelSerializer):
    methodology = serializers.StringRelatedField(many=True)

    class Meta:
        model = TrainingCreate
        fields = [
            "training_number","training_version","training_name","methodology","refresher_time",
        ]


class QuizSessionSerializer(serializers.ModelSerializer):
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    training = serializers.CharField(source='training.id', read_only=True)
    class Meta:
        model = QuizSession
        fields = ['id','training', 'user', 'user_first_name', 'user_last_name', 'quiz', 'current_question_index', 'started_at', 'completed_at', 'score', 'status', 'attempts', 'document_version']

class TrainingQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingQuestions
        fields = ['id', 'question_text', 'options', 'marks', 'question_type', 'correct_answer']
        
class TrainingdataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingCreate
        fields = ['id', 'training_name','training_number']

class HRacnowledgementSerializer(serializers.ModelSerializer):
    groups_list = serializers.SerializerMethodField()
    class Meta:
        model = HRacknowledgement
        fields = ['remarks','groups_list']

    def get_groups_list(self, obj):
        return [group.name for group in obj.groups.all()]


    
class TrainerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trainer
        fields = '__all__'

class ClassroomQuestionSerializer(serializers.ModelSerializer):
    # Create custom fields to return URLs for audio and video files
    selected_file = serializers.SerializerMethodField()

    class Meta:
        model = ClassroomQuestion
        fields = [
            'id', 'classroom', 'question_type', 'question_text', 'options', 
            'correct_answer', 'marks', 'status', 
            'question_created_at', 'question_updated_at', 
            'created_by', 'updated_by','selected_file_type','selected_file'
        ]

    def get_selected_file(self, obj):
        request = self.context.get('request')
        if obj.selected_file and hasattr(obj.selected_file, 'url'):
            return request.build_absolute_uri(obj.selected_file.url)
        return None
    
class ClassroomQuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True)

    class Meta:
        model = ClassroomQuiz
        fields = ['id', 'quiz_name', 'pass_criteria', 'quiz_time', 'total_marks', 'total_questions', 'quiz_type', 'questions', 'created_by','updated_by','created_at','updated_at','status']

class ClassroomQuizSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSession
        fields = ['id', 'user', 'quiz', 'current_question_index', 'started_at', 'completed_at', 'score', 'status']

class JobAssignSerializer(serializers.ModelSerializer):
    job_roles = serializers.SerializerMethodField()
    class Meta:
        model = JobAssign
        fields = ['id', 'user', 'job_roles']

    def get_job_roles(self, obj):
        return [{"id": job_role.id, "name": job_role.job_role_name} for job_role in obj.job_roles.all()]

class JobDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = ['user', 'id', 'job_role', 'employee_job_description', 'status']

class AttemptedQuizSerializer(serializers.ModelSerializer):
    attempts = serializers.CharField(source = 'quiz_session.attempts', read_only = True)
    status = serializers.CharField(source = 'quiz_session.status', read_only = True)
    document_name = serializers.CharField(source = 'document.document_title', read_only = True)
    document_version = serializers.CharField(source = 'document.version', read_only = True)
    class Meta:
        model = AttemptedQuiz
        fields = ['id', 'user', 'quiz', 'document','document_name', 'document_version', 'status', 'attempts', 'obtain_marks', 'total_marks', 'total_taken_time', 'created_at', 'is_pass']

class ClassroomAttemptedQuizSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source = 'classroom.classroom_name', read_only = True)
    class Meta:
        model = ClassroomAttemptedQuiz
        fields = ['id', 'user', 'quiz', 'training_quiz', 'classroom','classroom_name', 'obtain_marks', 'total_marks', 'total_taken_time', 'created_at', 'is_pass']


class AttemptedQuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptedQuizQuestion
        fields = ['id', 'attempted_quiz', 'question_id', 'question_text', 'user_answer', 'correct_answer']

class AttemptedIncorrectAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptedIncorrectAnswer
        fields = ['id', 'attempted_quiz', 'question_id', 'question_text', 'user_answer', 'correct_answer']

class AttemptedCorrectAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptedCorrectAnswer
        fields = ['id', 'attempted_quiz', 'question_id', 'question_text', 'user_answer', 'correct_answer']

class UserCompleteViewDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserCompleteViewDocument
        fields = ['id', 'user', 'document']