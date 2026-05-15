# 🔍 FitnessPro Audit System

Comprehensive audit suite for validating all backend and frontend features, API endpoints, database integrity, and system integrations.

## Overview

The audit system consists of three main components:

1. **Backend Audit** (`audit_backend.py`): Tests Django models, API endpoints, Celery tasks, feature flags, and analytics
2. **Frontend Audit** (`audit_frontend.js`): Tests React components, API connectivity, configuration, and UI features
3. **Audit Runner** (`run_audit.py`): Orchestrates both audits and generates HTML/JSON reports

## Quick Start

### Prerequisites
- Backend: Python venv with Django, DRF, and all dependencies installed
- Frontend: Node.js with npm packages installed
- Backend server running on `http://127.0.0.1:8000`
- Frontend dev server running on `http://127.0.0.1:5173` (optional for frontend audit)

### Run Full System Audit

```bash
# From the audit directory
python run_audit.py
```

This will:
1. Run backend audit (Django models, API endpoints, Celery tasks, etc.)
2. Run frontend audit (React components, API connectivity, configuration)
3. Generate JSON and HTML reports in `audit/reports/`

### Run Individual Audits

**Backend Only:**
```bash
cd backend
./venv/Scripts/python.exe ../audit/backend/audit_backend.py
```

**Frontend Only:**
```bash
cd frontend
node ../audit/frontend/audit_frontend.js
```

## Backend Audit Features

### Infrastructure Tests
- ✅ Database connectivity and migrations
- ✅ All Django models exist and are queryable
- ✅ Database indexes created (Phase 9)
- ✅ Admin interface accessible

### API Endpoint Tests
- ✅ Authentication (register, login)
- ✅ Subscriptions (plans, user subscriptions, features)
- ✅ Workouts (workouts, categories, exercises, progress)
- ✅ Payments (payment endpoints)
- ✅ CMS (pages, blog posts)
- ✅ Core (notifications, achievements, body measurements)
- ✅ API documentation endpoints

### Async & Background Jobs
- ✅ Celery app initialization
- ✅ All 7 registered tasks discovered
- ✅ Beat schedule configuration
- ✅ Task routing across queues

### Advanced Features
- ✅ Feature flag system and manager
- ✅ Analytics models (ChurnPrediction, EngagementScore, LifetimeValue)
- ✅ Query optimization utilities
- ✅ Admin interface registrations

### Security & Configuration
- ✅ CORS configuration
- ✅ SSL/TLS settings
- ✅ Static files configuration
- ✅ Secret key management

## Frontend Audit Features

### Project Structure
- ✅ React directories (components, pages, services, context)
- ✅ Component files count and organization
- ✅ Service layer and API integration

### Configuration
- ✅ Environment variables (.env)
- ✅ Vite configuration
- ✅ Tailwind CSS configuration
- ✅ Package.json dependencies

### React Features
- ✅ Context providers and state management
- ✅ React Router page components
- ✅ App component setup
- ✅ CSS styling

### Backend Integration
- ✅ API connectivity to backend
- ✅ All public endpoints accessible
- ✅ Authentication endpoints available
- ✅ CMS and content endpoints

## Audit Reports

### Report Output

After running an audit, reports are generated in `audit/reports/`:

- **JSON Report**: Machine-readable format for CI/CD integration
  - Timestamp
  - Backend audit results
  - Frontend audit results
  - Overall status

- **HTML Report**: Human-readable format
  - Clean dashboard layout
  - Status badges (passed/failed)
  - Full test output
  - Timestamp

Example JSON structure:
```json
{
  "timestamp": "2024-01-15T10:30:45.123456",
  "backend": {
    "status": "PASSED",
    "output": "...full audit output..."
  },
  "frontend": {
    "status": "PASSED",
    "output": "...full audit output..."
  },
  "overall_status": "PASSED"
}
```

## Feature Coverage

### Backend Features Audited
| Category | Features |
|----------|----------|
| **Authentication** | Register, Login, JWT tokens |
| **Subscriptions** | Plans, User subscriptions, Features, Limits |
| **Workouts** | Workouts, Categories, Exercises, Progress tracking |
| **Payments** | Stripe integration, Payment history |
| **Content** | Blog posts, Dynamic pages, CMS pages |
| **Notifications** | User notifications, Email automation logs |
| **Achievements** | Achievement system, User achievements |
| **Analytics** | Churn prediction, Engagement scores, LTV |
| **Coaching** | Coach sessions, Coaching reminders |
| **Celery** | 7 async tasks, Beat scheduler, Task routing |
| **Feature Flags** | Flag system, Manager, Rollout strategies |
| **Admin** | Django admin interface, Model registrations |

### Frontend Features Audited
| Category | Features |
|----------|----------|
| **Structure** | Pages, components, services, context |
| **Routing** | React Router setup, page components |
| **State** | Context providers, state management |
| **Styling** | Tailwind CSS, responsive design |
| **Integration** | API connectivity, endpoint accessibility |
| **Configuration** | Vite, environment variables, dependencies |

## Troubleshooting

### Backend Audit Issues

**`ModuleNotFoundError: No module named 'django'`**
- Solution: Ensure venv is activated and requirements installed
- Command: `pip install -r backend/requirements.txt`

**`ConnectionRefusedError: Backend API not accessible`**
- Solution: Start Django development server
- Command: `python manage.py runserver`

**`AttributeError: 'FeatureFlag' model not found`**
- Solution: Run migrations
- Command: `python manage.py migrate`

### Frontend Audit Issues

**`Error: ENOENT: no such file or directory`**
- Solution: Ensure frontend directory structure is intact
- Check: `frontend/src/{components,pages,services,context}` exist

**`AxiosError: Backend API not connected`**
- Solution: Ensure Django server is running on port 8000
- Command: `python manage.py runserver 127.0.0.1:8000`

**`ModuleNotFoundError: axios`**
- Solution: Install frontend dependencies
- Command: `npm install` (in frontend directory)

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: System Audit

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      
      - name: Run full audit
        run: python audit/run_audit.py
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: audit-report
          path: audit/reports/
```

## Development Notes

### Adding New Audit Tests

**Backend:**
1. Add test function to `audit_backend.py`
2. Call `log_pass()` on success or `log_fail()`/`log_warn()` on issues
3. Function will be called in `run_full_audit()`

**Frontend:**
1. Add test function to `audit_frontend.js`
2. Call `logPass()` on success or `logFail()`/`logWarn()` on issues
3. Function will be called in `runFullAudit()`

### Expected Audit Results

**Healthy System:**
- Backend: 30+ tests passed, 0 failed
- Frontend: 20+ tests passed, 0 failed
- Overall: ✅ AUDIT PASSED (90%+ pass rate)

**Common Warnings:**
- ⚠️ CORS configuration in development (OK - will be strict in production)
- ⚠️ SSL redirect disabled in development (OK - enabled in production)
- ⚠️ Few static files in development (OK - more in production build)

## Performance Baseline

Typical audit run times:
- Backend audit: 30-60 seconds
- Frontend audit: 10-30 seconds
- Full audit: 1-2 minutes
- Report generation: <5 seconds

## Files Structure

```
audit/
├── backend/
│   └── audit_backend.py          # Backend feature audit
├── frontend/
│   └── audit_frontend.js         # Frontend feature audit
├── reports/                      # Generated reports
│   ├── audit_report_20240115_102000.json
│   └── audit_report_20240115_102000.html
├── run_audit.py                  # Main audit orchestrator
└── README.md                     # This file
```

## Success Criteria

The system is considered healthy when:

✅ Backend audit: 90%+ tests passing
✅ Frontend audit: 90%+ tests passing  
✅ No critical failures (errors affecting core features)
✅ All API endpoints responsive (200 or expected error status)
✅ All Celery tasks registered
✅ Database integrity intact

## Support

For issues or questions about the audit system:
1. Check the troubleshooting section above
2. Review the test output in generated reports
3. Ensure all services are running (Django, optional: Celery, Redis)
4. Verify environment configuration (.env files)

---

**Last Updated**: 2024
**Audit System Version**: 1.0
