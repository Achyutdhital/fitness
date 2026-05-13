# FitnessPro Deployment, CI/CD, and SaaS Guide

This is the production guide for a scalable SaaS-style deployment. It includes the preferred architecture, a CI/CD path, and a cPanel fallback.

## Recommended Production Architecture

The best production setup is:

- Frontend: static React build on Vercel, Netlify, or an S3-compatible static host
- Backend: Django API on a VPS, container platform, or app platform with background worker support
- Database: PostgreSQL
- Cache/Broker: Redis
- Async Jobs: Celery worker + Celery beat
- Static/media storage: S3, Cloudflare R2, or another object store
- Reverse proxy: Nginx or the platform’s built-in routing

## Why This Matters

For SaaS scaling, you want the backend, broker, worker, and database separated so they can scale independently.

- Django handles API and admin traffic.
- Celery handles background jobs like emails, reminders, analytics, and payouts.
- Redis handles task routing and temporary state.
- PostgreSQL handles durable application data.

## CI/CD Plan

Use GitHub Actions or a similar CI/CD tool.

### Pipeline Stages

1. Lint and format checks.
2. Backend tests.
3. Frontend build.
4. Django system checks.
5. Build Docker images.
6. Push images to a registry.
7. Deploy backend, worker, beat, and frontend.

### Suggested GitHub Actions Flow

- On pull request:
  - run backend tests
  - run frontend build
  - run Django checks
- On main branch push:
  - build images
  - push to registry
  - deploy to production

### What To Test In CI

- `python manage.py test`
- `python manage.py check --deploy`
- `npm run build`

## Docker Strategy

Use separate containers:

- `web` for Django API
- `worker` for Celery worker
- `beat` for Celery beat
- `db` for PostgreSQL
- `redis` for broker/cache
- `frontend` for static build or host it separately

### Benefits

- Easy horizontal scaling
- Repeatable deployments
- Cleaner environment parity between local and production
- Easier rollback

## Production Environment Variables

Backend:

- `DEBUG=False`
- `SECRET_KEY=...`
- `ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com`
- `CORS_ALLOWED_ORIGINS=https://yourfrontend.com`
- `CSRF_TRUSTED_ORIGINS=https://yourfrontend.com`
- `DATABASE_URL=postgres://...`
- `REDIS_URL=redis://...`
- `CELERY_BROKER_URL=redis://...`
- `CELERY_RESULT_BACKEND=redis://...` or `django-db`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SENTRY_DSN`

Frontend:

- `VITE_API_BASE_URL=https://api.yourdomain.com`

## Production Deployment Steps

### 1. Prepare the database

- Create a PostgreSQL database.
- Run migrations.
- Create a superuser.

### 2. Build the frontend

- Set the production API URL.
- Run `npm run build`.
- Serve the `dist` folder from your frontend host.

### 3. Deploy the backend

- Install Python dependencies.
- Apply migrations.
- Collect static files.
- Start Django via Gunicorn or your platform’s WSGI service.

### 4. Deploy Celery worker

- Start a long-running worker process.
- Keep it separate from the web process.

### 5. Deploy Celery beat

- Start a separate beat process.
- Use the database scheduler if you want editable periodic tasks.

### 6. Configure SSL

- Use HTTPS on all public endpoints.
- Redirect HTTP to HTTPS.

### 7. Configure storage

- Move media/static assets to object storage.
- Use a CDN if traffic grows.

## cPanel Deployment Guide

Important: cPanel shared hosting is usually not the best fit for a full Django + Celery SaaS stack. It can work only if your cPanel plan includes Python app support, SSH access, cron jobs, and ideally Redis or an external broker. For anything serious, a VPS is the better choice.

### Best-case cPanel requirements

- Python app support in cPanel
- SSH access
- Cron job scheduler
- PostgreSQL or MySQL access
- Ability to serve static files
- Ability to run background scripts or persistent processes

### cPanel Step-by-Step

#### 1. Upload the code

- Clone your repo into your cPanel home directory, or upload the files.
- Keep the backend and frontend separated.

#### 2. Create a Python app

- In cPanel, open the Python App section.
- Create a new app.
- Set the app root to your backend folder.
- Set the application startup file according to cPanel’s Python app system.

#### 3. Create a virtual environment

- Use the cPanel Python environment or SSH into the server.
- Install dependencies from `backend/requirements.txt`.

#### 4. Configure environment variables

- Set `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, database credentials, and CORS settings.
- Add Stripe keys and any email credentials.

#### 5. Configure the database

- Create a production database.
- Update Django `DATABASES` settings via environment variables or your config method.
- Run migrations from SSH:

```bash
python manage.py migrate
```

#### 6. Collect static files

```bash
python manage.py collectstatic --noinput
```

#### 7. Point the domain

- Point your domain or subdomain to the cPanel app.
- Set up SSL with Let’s Encrypt or the cPanel SSL tool.

#### 8. Serve the frontend

Recommended options:

- Host the frontend separately on Vercel/Netlify
- Or upload the React build output to a static directory if your cPanel plan supports it

### Celery on cPanel

This is the hardest part.

If cPanel allows cron jobs but not persistent worker processes, you have two choices:

1. Use a VPS instead of cPanel for the worker and beat processes.
2. Replace always-on Celery jobs with scheduled cron-driven management commands.

#### If you must stay on cPanel

- Use cron jobs to call Django management commands.
- Avoid relying on a persistent Celery worker if the host kills long-running processes.

Example cron patterns:

- every 5 minutes: process pending notifications
- hourly: send emails
- daily: calculate analytics

### Practical cPanel Recommendation

If this project must behave like a real SaaS, use cPanel only for the web layer if you already own it, and run the worker + Redis + PostgreSQL on a VPS or managed service.

## SaaS Scaling Plan

### Phase 1

- Single backend instance
- Single worker
- Single beat
- Managed PostgreSQL
- Managed Redis

### Phase 2

- Multiple backend instances behind a load balancer
- Multiple Celery workers
- Object storage for uploads
- CDN for frontend assets

### Phase 3

- Separate read replicas
- Queue-based task prioritization
- Dedicated analytics jobs
- Autoscaling workers

## Security Checklist

- Set `DEBUG=False`
- Use strong `SECRET_KEY`
- Enforce HTTPS
- Lock down `ALLOWED_HOSTS`
- Restrict CORS and CSRF origins
- Keep secrets out of Git
- Use secure cookies in production
- Enable monitoring and error tracking

## Operations Checklist

- Monitor API errors
- Monitor Celery queues
- Monitor worker uptime
- Back up the database daily
- Back up media files
- Review logs regularly
