"""
Django settings for configure project.

All secrets and environment-specific values are read from environment
variables. For local development they can be placed in a `.env` file next to
manage.py (see `.env.example`). Never commit a real `.env` file.
"""

from datetime import timedelta
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv(path):
    """Minimal .env loader (KEY=VALUE per line) so no extra dependency is needed.
    Real environment variables always take precedence over the file."""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


_load_dotenv(BASE_DIR / ".env")


def env(key, default=None, required=False):
    value = os.environ.get(key, default)
    if required and (value is None or value == ""):
        raise ImproperlyConfigured(f"Environment variable {key} is required")
    return value


def env_bool(key, default=False):
    return str(env(key, str(default))).strip().lower() in ("1", "true", "yes", "on")


def env_list(key, default=""):
    return [item.strip() for item in str(env(key, default)).split(",") if item.strip()]


DEBUG = env_bool("DJANGO_DEBUG", False)

SECRET_KEY = env("DJANGO_SECRET_KEY", required=True)

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

# CORS: explicit allow-list in production; allow-all only when DEBUG is on and
# no list is configured.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOW_ALL_ORIGINS = DEBUG and not CORS_ALLOWED_ORIGINS
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'user_profile.apps.UserProfileConfig',
    'lms_module.apps.LmsModuleConfig',
    'dms_module.apps.DmsModuleConfig',
]

MIDDLEWARE = [
    # CorsMiddleware must run before CommonMiddleware to add headers to all responses.
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'configure.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'configure.wsgi.application'


DATABASES = {
    "default": {
        "ENGINE": env("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": env("DB_NAME", env("POSTGRES_DB", "lmsdms_db")),
        "USER": env("DB_USER", env("POSTGRES_USER", "lmsdms_user")),
        "PASSWORD": env("DB_PASSWORD", env("POSTGRES_PASSWORD", "")),
        "HOST": env("DB_HOST", env("POSTGRES_HOST", "localhost")),
        "PORT": env("DB_PORT", env("POSTGRES_PORT", "5432")),
        # Each request runs in a transaction: a failure part-way through a
        # multi-step workflow action never leaves half-written data behind.
        "ATOMIC_REQUESTS": True,
    }
}
if DATABASES["default"]["ENGINE"].endswith("sqlite3"):
    DATABASES["default"]["NAME"] = BASE_DIR / env("DB_NAME", env("POSTGRES_DB", "db.sqlite3"))


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    # Secure by default: every endpoint requires a valid token unless it
    # explicitly opts out with AllowAny (login, OTP / forgot-password).
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "DEFAULT_THROTTLE_RATES": {
        "auth": env("AUTH_THROTTLE_RATE", "10/min"),
    },
}

# Email
EMAIL_BACKEND = env("EMAIL_BACKEND", 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = env("EMAIL_HOST", 'smtp.gmail.com')
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "no-reply@localhost")

# OnlyOffice document server integration
ONLYOFFICE_SECRET = env("ONLYOFFICE_SECRET", env("ONLYOFFICE_JWT_SECRET", ""))
ONLYOFFICE_SERVER_URL = env("ONLYOFFICE_SERVER_URL", "http://localhost")
# Base URL at which the OnlyOffice server can reach this backend (media files + callback).
BACKEND_PUBLIC_URL = env("BACKEND_PUBLIC_URL", env("BACKEND_INTERNAL_URL", "http://localhost:8000")).rstrip("/")
# Hosts the backend is allowed to download edited documents from (SSRF protection).
# Empty list means "same host as ONLYOFFICE_SERVER_URL only".
ONLYOFFICE_ALLOWED_DOWNLOAD_HOSTS = env_list(
    "ONLYOFFICE_ALLOWED_DOWNLOAD_HOSTS",
    "localhost,127.0.0.1,host.docker.internal"
)

# Account security
LOGIN_MAX_FAILED_ATTEMPTS = int(env("LOGIN_MAX_FAILED_ATTEMPTS", "3"))
PASSWORD_EXPIRY_DAYS = int(env("PASSWORD_EXPIRY_DAYS", "90"))
OTP_EXPIRY_MINUTES = int(env("OTP_EXPIRY_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(env("OTP_MAX_ATTEMPTS", "5"))

# Groups allowed to approve/reject document revision requests.
REVISION_APPROVER_GROUPS = env_list("REVISION_APPROVER_GROUPS", "Doc Admin,Admin")

# LMS assessment rules
QUIZ_MAX_ATTEMPTS = int(env("QUIZ_MAX_ATTEMPTS", "3"))

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(env("JWT_ACCESS_MINUTES", str(60 * 24)))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': env("JWT_SIGNING_KEY", SECRET_KEY),
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static"
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = "user_profile.CustomUser"

GOOGLE_API_CREDENTIALS_PATH = env("GOOGLE_API_CREDENTIALS_PATH", "")

# Production hardening (active automatically when DEBUG is off).
if not DEBUG:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "SAMEORIGIN"
    SESSION_COOKIE_SECURE = env_bool("SECURE_COOKIES", True)
    CSRF_COOKIE_SECURE = env_bool("SECURE_COOKIES", True)
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    # Enable only once the whole site is served over HTTPS (e.g. 31536000).
    SECURE_HSTS_SECONDS = int(env("SECURE_HSTS_SECONDS", "0"))

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "standard"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO")},
}
