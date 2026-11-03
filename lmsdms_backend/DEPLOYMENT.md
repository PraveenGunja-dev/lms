# LMS & DMS backend – setup and deployment

Django 4.2 + Django REST Framework + SimpleJWT, PostgreSQL. Code lives in `configure/`.

## 1. Configuration (environment variables)

All secrets and environment-specific values come from environment variables.
For local development put them in `configure/.env` (git-ignored). Start from
`configure/.env.example`, which documents every variable.

**Before going to production:**

- Set `DJANGO_DEBUG=False`, a new long random `DJANGO_SECRET_KEY`, the real
  `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` (the frontend URL).
- **Rotate every secret that used to be committed in `settings.py`**: the Django
  secret key, the Gmail app password, the database password and the OnlyOffice JWT
  secret. Changing the OnlyOffice secret also requires updating the document
  server's `JWT_SECRET`.
- `configure/token.json` holds a Google OAuth access + refresh token that was
  committed to the repository. Nothing in the code uses it any more: revoke it in
  the Google Cloud console and delete the file.
- `BACKEND_PUBLIC_URL` must be the URL at which the OnlyOffice server reaches this
  backend. The editor config and callback URLs are built from it; they were
  previously hard-coded to `http://192.168.1.166`.
- `ONLYOFFICE_ALLOWED_DOWNLOAD_HOSTS` lists the hosts from which edited documents
  may be downloaded. This prevents SSRF: the server will not fetch arbitrary URLs.

## Run locally (SQLite, no PostgreSQL needed)

```bash
cd lmsdms_backend/configure
python -m venv venv && venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
# in .env: DJANGO_DEBUG=True, DB_ENGINE=django.db.backends.sqlite3, DB_NAME=db.sqlite3,
#          EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
python manage.py makemigrations user_profile dms_module lms_module
python manage.py migrate
python manage.py seed_local_data            # roles, statuses, master data, demo users
python manage.py runserver 127.0.0.1:8000

cd ../../lmsdms_frontend
npm ci
npm start                                   # http://localhost:3000/login
```

Demo logins (password `Local@12345`): `admin` (all roles) or one user per role:
`author`, `reviewer`, `approver`, `docadmin`, `hod`, `dtc`, `hr`, `trainer`, `employee`.
Locally every role has every permission; set real permissions in Roles & Permissions.
Emails (credentials, OTPs) are printed in the backend console.
Document editing needs an OnlyOffice document server, and PDF printing/cover pages
need LibreOffice (or MS Word on Windows).

## 2. Install

```bash
cd configure
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

`requirements.txt` is now plain UTF-8. It was UTF-16, which `pip` could not read.

## 3. Database migrations (required for this release)

The `migrations/` folders are git-ignored, so each server keeps its own. This
release changes the `CustomUser` model:

| Change | Why |
|---|---|
| `otp` widened to 128 chars | OTPs are now stored hashed |
| new `otp_created_at` | OTPs expire (`OTP_EXPIRY_MINUTES`) |
| new `otp_failed_attempts` | OTPs are invalidated after `OTP_MAX_ATTEMPTS` wrong tries |

Run on the server after deploying the code:

```bash
python manage.py makemigrations user_profile
python manage.py migrate
```

No data migration is needed. OTPs issued before the upgrade stop working, so users
simply request a new one.

## 4. Tests

```bash
# SQLite is fine for the test-suite; no PostgreSQL needed
DB_ENGINE=django.db.backends.sqlite3 python manage.py test user_profile dms_module lms_module
```

The suite covers document numbering, the revision workflow and its approval
rules, reviewer counting, the cover-page review date, login lockout, OTP
expiry/attempt limits, user-management permissions, assessment attempt limits and
blacklisting, server-side scoring, the LMS training list and the job-description
workflow.

## 5. Behaviour changes to communicate to users

- **Every user needs a department** before they can create documents. The
  department is selected when creating a user (Add User) or set through *Assign
  Department*. Existing users without a department get a clear error message
  instead of an `UnknownDepartment` document number.
- **Document numbers** are sequential per department (`BPL/<Department>/NNN`).
  Child Annexure/Format numbers (`/A001`, `/F001`) continue across all versions
  of the parent.
- **Revision requests** can be approved or rejected only by users in
  `REVISION_APPROVER_GROUPS` (default: *Doc Admin*, *Admin*), never by the person
  who requested the revision or by the document's author. The approved draft
  keeps the original author, reviewers, approver, doc admin, job roles, the
  current document file, the question bank and active quizzes.
- **Assessments**: an attempt is counted when the exam is *opened*. An attempt
  that is opened and not submitted counts and blocks further attempts
  ("blacklisted") until a DTC, HR, HOD, Doc Admin, Trainer or Admin user
  re-activates the user. After
  `QUIZ_MAX_ATTEMPTS` (default 3) attempts, a new attempt cycle opens only after
  the user completes a classroom session linked to that document, or after an
  administrator re-activates them. Marks are computed by the server.
- **Login**: an account locks after `LOGIN_MAX_FAILED_ATTEMPTS` (default 3) wrong
  passwords; an administrator unlocks it with *reset password*. Passwords expire
  after `PASSWORD_EXPIRY_DAYS` (default 90); the user then uses *Forgot Password*.
- **Training mapping**: when a SOP is mapped to a job role, its child
  Annexures/Formats that are marked *training required* are mapped too. Employees
  only see released/effective documents, at their latest version.
- **User management** (create users, change roles, reset passwords) needs the
  Admin role or the *customuser* add/change permission. Only administrators can
  grant the Admin role.

## 6. Operational notes

- `DATABASES.ATOMIC_REQUESTS` is on, and failure responses roll back the
  request's writes. A workflow step that fails part-way no longer leaves
  half-written data (for example, a revised SOP without its children, or a quiz
  without its questions).
- Public authentication endpoints are rate-limited (`AUTH_THROTTLE_RATE`). The
  default throttle cache is per-process; configure a shared cache (e.g. Redis)
  when running several gunicorn workers.
- Cover-page PDFs on Linux need LibreOffice (`soffice`) on the PATH. If
  conversion fails, the API still returns the cover page and sets `merged: false`
  with an explanatory message.
- The `check_document_dates` and `send_*` management commands are long-running
  loops. Run them under a process manager (systemd, supervisor, or pm2) if they
  are used. `user_profile/cron.py` depends on `django_cron`, which is not
  installed, and is not scheduled anywhere.
