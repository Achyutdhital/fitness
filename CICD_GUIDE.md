# CI/CD and Deployment Configuration Guide

## GitHub Actions CI/CD Pipeline

The `.github/workflows/ci-cd.yml` file defines the automated testing and deployment pipeline:

### Pipeline Stages

1. **Backend Tests** (runs on every push/PR):
   - Python dependency installation
   - Django deployment checks (`check --deploy`)
   - Full test suite execution
   - Security audit command
   - Code coverage reporting

2. **Frontend Tests** (runs on every push/PR):
   - Node dependency installation
   - ESLint code quality checks
   - Production build verification
   - Bundle size monitoring

3. **Integration Tests** (runs after both backend and frontend pass):
   - Phase 7 end-to-end coaching flow validation
   - Phase 7 operations audit tests
   - Phase 8 performance tests (when ready)

4. **Staging Deployment** (runs only on main branch after tests pass):
   - Automated deployment to staging environment
   - Database migrations
   - Static file collection
   - Service restart
   - Smoke tests

### GitHub Secrets Required

Configure these secrets in your GitHub repository settings (Settings > Secrets and variables > Actions):

```
STAGING_DEPLOY_KEY      # SSH private key for staging server
STAGING_HOST            # Staging server hostname/IP
STAGING_USER            # SSH username for staging
PRODUCTION_DEPLOY_KEY   # SSH private key for production (future)
PRODUCTION_HOST         # Production server hostname/IP (future)
SENTRY_DSN              # Sentry error tracking DSN
```

### Local Testing Before Push

To validate your changes match the CI/CD pipeline:

```bash
# Backend tests
cd backend
python manage.py check --deploy
python manage.py test core.tests -v 2

# Frontend build
cd frontend
npm run build
npm run lint
```

### Deployment Environments

- **Development**: Local machine (.venv)
- **Staging**: Full replica of production for QA
- **Production**: Live environment (future phase)

### Monitoring CI/CD Status

- All workflows visible in GitHub repo > Actions tab
- Failed workflows block merge to main
- Successful workflows auto-deploy to staging
