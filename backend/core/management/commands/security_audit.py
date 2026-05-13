from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Run a lightweight security audit for high-risk platform settings and endpoint assumptions.'

    def handle(self, *args, **options):
        warnings = []
        score = 100

        secret_key_default = 'django-insecure-your-secret-key-change-in-production'

        def check(condition, deduction, message, severity='warning'):
            nonlocal score
            if not condition:
                score -= deduction
                warnings.append((severity, message))

        check(not settings.DEBUG, 20, 'DEBUG is enabled; production should disable it.')
        check(settings.SECRET_KEY != secret_key_default, 20, 'SECRET_KEY is using the default fallback value.')
        check(settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend', 10, 'Email backend is console-based; production should use SMTP or a provider.')
        check(getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False) is True, 10, 'SECURE_CONTENT_TYPE_NOSNIFF is disabled.')
        check(getattr(settings, 'X_FRAME_OPTIONS', '') in ['DENY', 'SAMEORIGIN'], 10, 'X_FRAME_OPTIONS is not hardened.')
        check(getattr(settings, 'SECURE_REFERRER_POLICY', '') in ['same-origin', 'no-referrer'], 10, 'SECURE_REFERRER_POLICY is not hardened.')
        check(bool(getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])), 10, 'CSRF_TRUSTED_ORIGINS is empty.')
        check(getattr(settings, 'SESSION_COOKIE_HTTPONLY', False) is True, 5, 'SESSION_COOKIE_HTTPONLY is disabled.')
        check(getattr(settings, 'SESSION_COOKIE_SECURE', False) in [True, False], 0, '')
        check(getattr(settings, 'SECURE_SSL_REDIRECT', False) in [True, False], 0, '')
        check(timedelta(hours=1) >= settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'], 0, '')

        self.stdout.write(self.style.SUCCESS(f'Security audit complete. Score: {max(score, 0)}/100'))
        if warnings:
            self.stdout.write('Findings:')
            for severity, message in warnings:
                self.stdout.write(f'- {severity.upper()}: {message}')
