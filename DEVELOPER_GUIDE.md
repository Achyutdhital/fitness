# FitnessPro Developer Guide

This guide shows how to run the project locally in a virtual environment without touching your system Python or machine-wide services.

## What You Need

- Python 3.12+
- Node.js 18+
- Git
- The project virtual environment at `backend/venv`

## Local Development Layout

- Backend: `backend/`
- Frontend: `frontend/`
- Django settings: `backend/fitness_project/settings.py`
- Celery app: `backend/fitness_project/celery.py`

## Run Locally

### 1. Backend API

Open a terminal in `backend` and activate the venv:

```powershell
cd C:\Users\achyu\OneDrive\Desktop\fitness\backend
.\venv\Scripts\Activate.ps1
```

Then run Django:

```powershell
python manage.py runserver
```

API URL:

- `http://127.0.0.1:8000`

### 2. Frontend

Open a second terminal in `frontend`:

```powershell
cd C:\Users\achyu\OneDrive\Desktop\fitness\frontend
npm install
npm run dev
```

Frontend URL:

- `http://127.0.0.1:5173`

### 3. Celery Worker

Celery is configured to run inside the workspace using a filesystem broker for local development, so it does not require Redis.

Open a third terminal in `backend`:

```powershell
cd C:\Users\achyu\OneDrive\Desktop\fitness\backend
$env:PYTHONPATH = "$PWD"
.\venv\Scripts\python.exe -m celery -A fitness_project worker -l info -P solo
```

### 4. Celery Beat

Open a fourth terminal in `backend`:

```powershell
cd C:\Users\achyu\OneDrive\Desktop\fitness\backend
$env:PYTHONPATH = "$PWD"
.\venv\Scripts\python.exe -m celery -A fitness_project beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## Local Dev Notes

- Keep all commands inside the project venv.
- Do not use `-B` on Windows; run worker and beat as separate processes.
- Local Celery broker data is stored in `backend/.celery/`.
- Database defaults to SQLite in development.
- Sentry is optional; if `SENTRY_DSN` is not set, it is disabled.

## Environment Variables

Create your `.env` files in `backend/` and `frontend/`.

Backend values you should typically set:

- `SECRET_KEY`
- `DEBUG=True`
- `ALLOWED_HOSTS=localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000`
- `CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`

Frontend values you should typically set:

- `VITE_API_BASE_URL=http://127.0.0.1:8000`

## Useful Commands

Run tests:

```powershell
cd C:\Users\achyu\OneDrive\Desktop\fitness\backend
.\venv\Scripts\python.exe manage.py test
```

Check Django configuration:

```powershell
cd C:\Users\achyu\OneDrive\Desktop\fitness\backend
.\venv\Scripts\python.exe manage.py check
```

Run migrations:

```powershell
cd C:\Users\achyu\OneDrive\Desktop\fitness\backend
.\venv\Scripts\python.exe manage.py migrate
```

## Development Workflow

1. Start backend server.
2. Start frontend dev server.
3. Start Celery worker.
4. Start Celery beat.
5. Check logs for task execution, API calls, and frontend requests.

## Common Issues

- If Celery says it cannot load `fitness_project`, make sure `PYTHONPATH` includes `backend`.
- If the worker fails on Windows, use `-P solo`.
- If the frontend cannot reach the API, check `VITE_API_BASE_URL` and CORS settings.
- If migrations fail, verify the venv is activated and dependencies are installed.
