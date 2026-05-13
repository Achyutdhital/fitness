from concurrent.futures import ThreadPoolExecutor, as_completed
from statistics import mean
from time import perf_counter

from django.db import connection
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


User = get_user_model()


class Command(BaseCommand):
    help = 'Run a repeatable API benchmark across the main Phase 7 endpoints.'

    def add_arguments(self, parser):
        parser.add_argument('--requests', type=int, default=20, help='Total requests per endpoint')
        parser.add_argument('--concurrency', type=int, default=4, help='Parallel workers')

    def handle(self, *args, **options):
        requests_per_endpoint = max(1, options['requests'])
        concurrency = max(1, options['concurrency'])

        member = self._get_or_create_user(
            username='phase7_member',
            email='phase7_member@example.com',
            defaults={'first_name': 'Phase', 'last_name': 'Member'}
        )
        admin = self._get_or_create_user(
            username='phase7_admin',
            email='phase7_admin@example.com',
            defaults={'first_name': 'Phase', 'last_name': 'Admin', 'is_staff': True, 'is_superuser': True}
        )
        coach = self._get_or_create_user(
            username='phase7_coach',
            email='phase7_coach@example.com',
            defaults={'first_name': 'Phase', 'last_name': 'Coach', 'role': 'coach'}
        )

        benchmarks = [
            ('/api/auth/user/dashboard_stats/', member),
            ('/api/core/ai/quota/', member),
            ('/api/core/support/my_tickets/', member),
            ('/api/auth/admin/stats/', admin),
        ]

        self.stdout.write(f'Running load benchmark with {requests_per_endpoint} requests per endpoint and {concurrency} workers...')
        total_requests = 0
        aggregate_times = []

        for path, user in benchmarks:
            timings = self._benchmark_endpoint(path, user, requests_per_endpoint, concurrency)
            aggregate_times.extend(timings)
            total_requests += len(timings)
            self.stdout.write(
                f'{path} -> avg {mean(timings):.3f}s, min {min(timings):.3f}s, max {max(timings):.3f}s, n={len(timings)}'
            )

        self.stdout.write(self.style.SUCCESS(
            f'Load benchmark complete. Total requests={total_requests}, overall avg={mean(aggregate_times):.3f}s'
        ))

    def _get_or_create_user(self, username, email, defaults=None):
        defaults = defaults or {}
        user, created = User.objects.get_or_create(username=username, defaults={'email': email, **defaults})
        if created:
            user.email = email
            for key, value in defaults.items():
                setattr(user, key, value)
            user.set_password('testpass123')
            user.save()
        return user

    def _benchmark_endpoint(self, path, user, total_requests, concurrency):
        timings = []
        if concurrency <= 1 or connection.vendor == 'sqlite':
            for _ in range(total_requests):
                client = APIClient()
                client.force_authenticate(user=user)
                start = perf_counter()
                response = client.get(path)
                elapsed = perf_counter() - start
                timings.append(elapsed)
                if response.status_code >= 500:
                    self.stdout.write(self.style.WARNING(f'{path} returned {response.status_code}'))
        else:
            def do_request():
                client = APIClient()
                client.force_authenticate(user=user)
                start = perf_counter()
                response = client.get(path)
                elapsed = perf_counter() - start
                return elapsed, response.status_code

            with ThreadPoolExecutor(max_workers=concurrency) as executor:
                futures = [executor.submit(do_request) for _ in range(total_requests)]
                for future in as_completed(futures):
                    elapsed, status_code = future.result()
                    timings.append(elapsed)
                    if status_code >= 500:
                        self.stdout.write(self.style.WARNING(f'{path} returned {status_code}'))
        return timings