"""
WSGI config for fitness_project project.
"""

import os

from django.core.wsgi import get_wsgi_application

# Phase 8: Initialize Sentry for error tracking
from fitness_project.utils.sentry_integration import init_sentry

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_project.settings')

# Initialize Sentry before Django
init_sentry()

application = get_wsgi_application()
