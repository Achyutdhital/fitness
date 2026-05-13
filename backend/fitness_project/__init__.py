"""
Fitness Project Django App.
Initializes Celery async task queue for Phase 9+ scalability.
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_project.settings')

# Celery bootstrap (Phase 9: Async Workers)
# Must be imported before Django setup to make workers aware of tasks
from .celery import app as celery_app

__all__ = ('celery_app',)
