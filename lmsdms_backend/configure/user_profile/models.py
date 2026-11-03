from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager,AbstractUser
# from django.contrib.auth.models import Group
from django.core.validators import EmailValidator
import os
from django.utils.timezone import now,timedelta
from django.conf import settings

class Department(models.Model):
    department_name = models.TextField()
    department_description = models.TextField(null=True, blank=True)
    department_created_at = models.DateTimeField(auto_now_add=True)

class CustomUserManager(BaseUserManager):
    
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('The given username must be set')
        # if not email:
        #     raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(username=username,email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(username, email, password, **extra_fields)
    

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(null=True, blank=True)    #email = models.EmailField(unique=True, validators=[EmailValidator(message="Invalid email address")])
    employee_number = models.CharField(max_length=100,null=True, blank=True)
    username = models.CharField(max_length=255, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=30, null=True, blank=True)
    last_name = models.CharField(max_length=30, null=True, blank=True)
    phone = models.CharField(max_length=10, null=True, blank=True)
    address = models.CharField(max_length=5000, null=True, blank=True)
    profile_image = models.ImageField(null=True, blank=True, upload_to='profile_images/')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    otp = models.CharField(max_length=128, null=True, blank=True)  # stores a hash, never the raw OTP
    otp_created_at = models.DateTimeField(null=True, blank=True)
    otp_failed_attempts = models.IntegerField(default=0)
    department = models.ForeignKey(
        Department,  # String reference to avoid direct import
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )

    old_password = models.CharField(max_length=128, null=True, blank=True)
    password_updated_at = models.DateTimeField(null=True, blank=True)  # Track when the password was last updated
    is_reset_password = models.BooleanField(default=False, null=True)
    login_count = models.IntegerField(default=0)
    is_lms_user = models.BooleanField(default=True, null=True, blank=True)
    is_dms_user = models.BooleanField(default=False,null=True, blank=True)
    designation = models.CharField(max_length=255, null=True, blank=True)
    
    is_user_created = models.BooleanField(default=True, null=True, blank=True)
    is_department_assigned = models.BooleanField(default=False, null=True, blank=True)
    is_induction_complete = models.BooleanField(default=False, null=True, blank=True)
    is_induction_certificate = models.BooleanField(default=False, null=True, blank=True)
    is_description = models.BooleanField(default=False, null=True, blank=True)
    is_jr_assign = models.BooleanField(default=False, null=True, blank=True)
    is_jr_approve = models.BooleanField(default=False, null=True, blank=True)
    is_tni_generate = models.BooleanField(default=False, null=True, blank=True)
    is_tni_consent = models.BooleanField(default=False, null=True, blank=True)
    is_qualification = models.BooleanField(default=False, null=True, blank=True)
    is_jr_transfer = models.BooleanField(default=False, null=True, blank=True)
    quiz_attemted = models.BooleanField(default=False, null=True, blank=True)
    is_sendback = models.BooleanField(default=False, null=True, blank=True)
    classroom_assesment_done = models.BooleanField(default=False, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    def get_full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip() or (self.username or '')

    def get_short_name(self):
        return self.first_name or self.username or ''

    def increment_login_count(self):
        self.login_count += 1
        self.save(update_fields=['login_count'])

    def reset_login_count(self):
        self.login_count = 0
        self.save(update_fields=['login_count'])

    @property
    def is_locked(self):
        return self.login_count >= settings.LOGIN_MAX_FAILED_ATTEMPTS

    def password_has_expired(self):
        """True when the password is older than PASSWORD_EXPIRY_DAYS."""
        if not self.password_updated_at:
            return False
        return now() > self.password_updated_at + timedelta(days=settings.PASSWORD_EXPIRY_DAYS)

    # --- One-time passwords (stored hashed, time-limited, attempt-limited) ---
    def set_otp(self, raw_otp):
        from django.contrib.auth.hashers import make_password
        self.otp = make_password(raw_otp)
        self.otp_created_at = now()
        self.otp_failed_attempts = 0
        self.save(update_fields=['otp', 'otp_created_at', 'otp_failed_attempts'])

    def verify_otp(self, raw_otp):
        """Returns (ok, error_message). Consumes the OTP on success."""
        from django.contrib.auth.hashers import check_password
        if not self.otp or not self.otp_created_at:
            return False, "No OTP has been requested. Please request a new OTP."
        if now() > self.otp_created_at + timedelta(minutes=settings.OTP_EXPIRY_MINUTES):
            self.clear_otp()
            return False, "OTP has expired. Please request a new OTP."
        if self.otp_failed_attempts >= settings.OTP_MAX_ATTEMPTS:
            self.clear_otp()
            return False, "Too many invalid attempts. Please request a new OTP."
        if not raw_otp or not check_password(str(raw_otp), self.otp):
            self.otp_failed_attempts += 1
            self.save(update_fields=['otp_failed_attempts'])
            return False, "Invalid OTP"
        self.clear_otp()
        return True, None

    def clear_otp(self):
        self.otp = None
        self.otp_created_at = None
        self.otp_failed_attempts = 0
        self.save(update_fields=['otp', 'otp_created_at', 'otp_failed_attempts'])


class EmailTemplate(models.Model):
    name = models.CharField(max_length=500, unique=True)
    subject = models.CharField(max_length=500)
    content = models.TextField()
    from_email = models.EmailField(default=settings.EMAIL_HOST_USER)
    signature = models.CharField(max_length=255, default='Bharat Parenterals Ltd.')

    def __str__(self):
        
        return self.name
    

class ReminderAfterNoACtionTaken(models.Model):
    reminder_minutes = models.JSONField(default=list)

    
class Reminder(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE,null=True,blank=True)
    reminder_minutes = models.JSONField(default=list)  # Stores a list of reminder minutes (e.g., [90, 60, 30, 15])



# class WordDocument(models.Model):
#     name = models.CharField(max_length=255,null=True,blank=True)
#     file = models.FileField(upload_to='word_documents/',null=True,blank=True)
#     google_doc_id = models.CharField(max_length=255,null=True,blank=True)
#     uploaded_at = models.DateTimeField(auto_now_add=True,null=True,blank=True)

#     def __str__(self):
#         return self.name

# class DocumentKeyValue(models.Model):
#     key_name = models.CharField(max_length=255)  # e.g., "company_name"
#     value = models.TextField()  # The user-entered value for that key
#     document = models.ForeignKey(WordDocument, on_delete=models.CASCADE, related_name='key_values')

#     def __str__(self):
#         return f"{self.key_name}: {self.value}"
