import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-your-secret-key-change-in-production')

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'drf_spectacular',
    'django_filters',
    # Phase 9: Async Tasks & Scheduling
    'django_celery_beat',
    'django_celery_results',
    # Project apps
    'accounts',
    'subscriptions',
    'workouts',
    'payments',
    'cms',
    'core',
]

AUTH_USER_MODEL = 'accounts.CustomUser'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'fitness_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
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

WSGI_APPLICATION = 'fitness_project.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173,http://localhost:8000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173,http://localhost:8000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Stripe Configuration
STRIPE_PUBLIC_KEY = config('STRIPE_PUBLIC_KEY', default='')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# Email Configuration
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# Security hardening defaults
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = config('SECURE_REFERRER_POLICY', default='same-origin')
X_FRAME_OPTIONS = config('X_FRAME_OPTIONS', default='DENY')
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False, cast=bool)
SECURE_HSTS_PRELOAD = config('SECURE_HSTS_PRELOAD', default=False, cast=bool)

# Password Reset
PASSWORD_RESET_TIMEOUT = 3600  # 1 hour

# Frontend URL (for password reset links)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
BACKEND_URL = config('BACKEND_URL', default='http://localhost:8000')

# OAuth Configuration
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_REDIRECT_URI = config(
    'GOOGLE_REDIRECT_URI',
    default=f'{BACKEND_URL}/api/auth/oauth/google/callback/'
)

FACEBOOK_APP_ID = config('FACEBOOK_APP_ID', default='')
FACEBOOK_APP_SECRET = config('FACEBOOK_APP_SECRET', default='')
FACEBOOK_REDIRECT_URI = config(
    'FACEBOOK_REDIRECT_URI',
    default=f'{BACKEND_URL}/api/auth/oauth/facebook/callback/'
)

# AI Coach — Multi-Provider API Keys
# You can provide multiple keys separated by commas (e.g., key1,key2)
GEMINI_API_KEY = config('GEMINI_API_KEY', default='')
GROQ_API_KEY = config('GROQ_API_KEY', default='')
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
CLAUDE_API_KEY = config('CLAUDE_API_KEY', default='')

# Redis & Caching Configuration (Phase 8: Performance Optimization)
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

# Django cache backend - use Redis for production, dummy for development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache' if DEBUG else 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'IGNORE_EXCEPTIONS': True,  # Graceful fallback if Redis is down
        } if not DEBUG else {},
    }
}

# Cache timeouts (in seconds)
CACHE_TIMEOUT_SHORT = 60  # 1 minute
CACHE_TIMEOUT_MEDIUM = 300  # 5 minutes
CACHE_TIMEOUT_LONG = 1800  # 30 minutes

# Sentry Error Tracking Configuration (Phase 8: Production Observability)
SENTRY_DSN = config('SENTRY_DSN', default='')
SENTRY_ENVIRONMENT = config('SENTRY_ENVIRONMENT', default='development')
SENTRY_SAMPLE_RATE = config('SENTRY_SAMPLE_RATE', default=0.1, cast=float)
SENTRY_TRACES_SAMPLE_RATE = config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float)

# ============================================================================
# PHASE 9: Celery Async Task Queue Configuration
# ============================================================================
_celery_broker_default = 'filesystem://' if DEBUG else 'redis://localhost:6379/0'
_celery_result_default = 'django-db' if DEBUG else 'redis://localhost:6379/1'

CELERY_BROKER_URL = config('CELERY_BROKER_URL', default=_celery_broker_default)
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default=_celery_result_default)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_ENABLE_UTC = True

# Local dev uses a filesystem broker so Celery stays inside this workspace.
CELERY_BROKER_TRANSPORT_OPTIONS = {
    'data_folder_in': str(BASE_DIR / '.celery' / 'in'),
    'data_folder_out': str(BASE_DIR / '.celery' / 'out'),
    'data_folder_processed': str(BASE_DIR / '.celery' / 'processed'),
}

for _celery_folder in CELERY_BROKER_TRANSPORT_OPTIONS.values():
    os.makedirs(_celery_folder, exist_ok=True)

# Celery Beat Scheduler (from database)
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Task routing
CELERY_DEFAULT_QUEUE = 'default'
CELERY_QUEUES = {
    'default': {'exchange': 'default'},
    'email': {'exchange': 'email'},
    'analytics': {'exchange': 'analytics'},
    'notifications': {'exchange': 'notifications'},
}

CELERY_TASK_ROUTES = {
    'core.tasks.send_*': {'queue': 'notifications'},
    'core.tasks.aggregate_*': {'queue': 'analytics'},
    'core.tasks.calculate_*': {'queue': 'analytics'},
    'payments.tasks.*': {'queue': 'default'},
}

# Task limits
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes soft limit
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_TASK_TRACK_STARTED = True

