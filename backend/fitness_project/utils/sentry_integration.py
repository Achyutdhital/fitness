"""
Sentry error tracking integration for Phase 8: Production Observability.
Provides centralized error tracking, performance monitoring, and alerting.
"""

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from django.conf import settings


def init_sentry():
    """
    Initialize Sentry error tracking.
    
    Environment variables:
        SENTRY_DSN: Sentry project DSN (if not set, Sentry is disabled)
        SENTRY_ENVIRONMENT: Environment name (development, staging, production)
        SENTRY_SAMPLE_RATE: Transaction sampling rate 0.0-1.0 (default: 0.1)
        SENTRY_TRACES_SAMPLE_RATE: Traces sampling rate 0.0-1.0 (default: 0.1)
    """
    sentry_dsn = settings.SENTRY_DSN if hasattr(settings, 'SENTRY_DSN') else None
    
    if not sentry_dsn:
        print("Sentry DSN not configured. Error tracking disabled.")
        return
    
    environment = getattr(settings, 'SENTRY_ENVIRONMENT', 'development')
    sample_rate = float(getattr(settings, 'SENTRY_SAMPLE_RATE', 0.1))
    traces_sample_rate = float(getattr(settings, 'SENTRY_TRACES_SAMPLE_RATE', 0.1))
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        environment=environment,
        traces_sample_rate=traces_sample_rate,
        sample_rate=sample_rate,
        send_default_pii=False,  # Don't send PII by default
        ignore_errors=[
            # Common non-critical exceptions to ignore
            'django.http.response.Http404',
            'rest_framework.exceptions.NotFound',
            'rest_framework.exceptions.ValidationError',
        ],
    )
    
    print(f"Sentry initialized for environment: {environment}")


def capture_exception(exception, context=None):
    """
    Manually capture an exception with optional context data.
    
    Args:
        exception: The exception to capture
        context: Dict of additional context info
    """
    with sentry_sdk.push_scope() as scope:
        if context:
            for key, value in context.items():
                scope.set_context(key, value)
        sentry_sdk.capture_exception(exception)


def capture_message(message, level='info', context=None):
    """
    Capture a message without an exception.
    
    Args:
        message: Message text
        level: 'debug', 'info', 'warning', or 'error'
        context: Dict of additional context info
    """
    with sentry_sdk.push_scope() as scope:
        if context:
            for key, value in context.items():
                scope.set_context(key, value)
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user):
    """Set user context for error tracking."""
    sentry_sdk.set_user({
        'id': str(user.id),
        'email': user.email,
        'username': user.username,
    })


def clear_user_context():
    """Clear user context."""
    sentry_sdk.set_user(None)


class SentryContextMiddleware:
    """
    Django middleware to automatically set Sentry context from requests.
    Add to MIDDLEWARE in settings.py
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Set user context if authenticated
        if request.user and request.user.is_authenticated:
            set_user_context(request.user)
        
        # Add request context
        with sentry_sdk.push_scope() as scope:
            scope.set_context('http_request', {
                'method': request.method,
                'path': request.path,
                'query_string': request.GET.urlencode(),
                'headers': dict(request.META),
            })
            
            response = self.get_response(request)
            
            # Tag response
            scope.set_tag('http_status', response.status_code)
            
            return response
    
    def process_exception(self, request, exception):
        """Capture exceptions with request context."""
        capture_exception(exception, context={'request': {
            'method': request.method,
            'path': request.path,
        }})
        return None


# Decorators for manual error tracking in views/functions

def sentry_transaction(name: str):
    """
    Decorator to track a function as a Sentry transaction for performance monitoring.
    
    Usage:
        @sentry_transaction("expensive_operation")
        def calculate_stats():
            ...
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with sentry_sdk.start_transaction(op="function", name=name):
                return func(*args, **kwargs)
        return wrapper
    return decorator


def sentry_capture_errors(func):
    """
    Decorator to automatically capture exceptions in a function.
    
    Usage:
        @sentry_capture_errors
        def risky_operation():
            ...
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            capture_exception(e, context={'function': func.__name__})
            raise
    return wrapper
