from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import CustomUser
from core.models import BodyMeasurement, EmailAutomationLog
from workouts.models import UserWorkoutProgress
from fitness_project.utils.emails import (
    send_churn_prevention_email,
    send_trainer_notification_email,
    send_weekly_digest,
    send_welcome_member_email,
)


class Command(BaseCommand):
    help = 'Dispatch scheduled email automations (weekly digests, churn nudges, onboarding welcome, and trainer updates).'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Preview actions without sending emails')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        sent = {
            'welcome': 0,
            'weekly_digest': 0,
            'churn_prevention': 0,
            'trainer_summary': 0,
        }

        sent['welcome'] = self.send_welcome_sequence(dry_run=dry_run)
        sent['weekly_digest'] = self.send_weekly_digests(dry_run=dry_run)
        sent['churn_prevention'] = self.send_churn_nudges(dry_run=dry_run)
        sent['trainer_summary'] = self.send_trainer_updates(dry_run=dry_run)

        mode = 'DRY RUN' if dry_run else 'LIVE'
        self.stdout.write(self.style.SUCCESS(
            f"Email automation complete ({mode}). Welcome={sent['welcome']}, Weekly={sent['weekly_digest']}, Churn={sent['churn_prevention']}, Trainer={sent['trainer_summary']}"
        ))

    def _log_exists(self, automation_key, email, reference_date):
        return EmailAutomationLog.objects.filter(
            automation_key=automation_key,
            recipient_email=email,
            reference_date=reference_date,
        ).exists()

    def _create_log(self, automation_key, email, name, reference_date, payload=None):
        EmailAutomationLog.objects.create(
            automation_key=automation_key,
            recipient_email=email,
            recipient_name=name or '',
            reference_date=reference_date,
            payload=payload or {},
        )

    def _active_members(self):
        return CustomUser.objects.filter(
            subscription__status__in=['active', 'trial']
        ).exclude(role__in=['coach', 'admin', 'content_writer'])

    def send_welcome_sequence(self, dry_run=False):
        today = timezone.now().date()
        recent_users = CustomUser.objects.filter(created_at__date__gte=today - timedelta(days=2))
        count = 0
        for user in recent_users:
            if self._log_exists('welcome', user.email, today):
                continue
            if not dry_run:
                send_welcome_member_email(user.email, user.get_full_name() or user.first_name or user.username)
                self._create_log('welcome', user.email, user.get_full_name() or user.username, today, {'user_id': str(user.id)})
            count += 1
        return count

    def send_weekly_digests(self, dry_run=False):
        today = timezone.now().date()
        week_start = today - timedelta(days=7)
        count = 0
        for user in self._active_members().select_related('subscription', 'profile'):
            if self._log_exists('weekly_digest', user.email, today):
                continue

            workouts_completed = UserWorkoutProgress.objects.filter(
                user=user,
                completed=True,
                completed_date__date__gte=week_start,
            ).count()
            recent_measurement = BodyMeasurement.objects.filter(user=user).order_by('-date').first()
            progress_lines = [
                f'{workouts_completed} workout(s) completed in the last 7 days',
            ]
            if recent_measurement and recent_measurement.weight is not None:
                progress_lines.append(f'Latest body measurement: {recent_measurement.weight:.1f} kg on {recent_measurement.date}')

            if not workouts_completed:
                continue

            if not dry_run:
                send_weekly_digest(user.email, user.get_full_name() or user.username, progress_lines)
                self._create_log('weekly_digest', user.email, user.get_full_name() or user.username, today, {
                    'workouts_completed': workouts_completed,
                })
            count += 1
        return count

    def send_churn_nudges(self, dry_run=False):
        today = timezone.now().date()
        cutoff = today - timedelta(days=14)
        count = 0
        for user in self._active_members().select_related('subscription'):
            if self._log_exists('churn_prevention', user.email, today):
                continue

            recent_activity = UserWorkoutProgress.objects.filter(
                user=user,
                completed=True,
                completed_date__date__gte=cutoff,
            ).exists()
            if recent_activity:
                continue

            lines = [
                'We have not seen a completed workout recently.',
                'Start with a short session today to rebuild momentum.',
            ]
            if not dry_run:
                send_churn_prevention_email(user.email, user.get_full_name() or user.username, lines)
                self._create_log('churn_prevention', user.email, user.get_full_name() or user.username, today, {
                    'cutoff': cutoff.isoformat(),
                })
            count += 1
        return count

    def send_trainer_updates(self, dry_run=False):
        today = timezone.now().date()
        count = 0
        coaches = CustomUser.objects.filter(role='coach').prefetch_related('clients')
        for coach in coaches:
            if self._log_exists('trainer_summary', coach.email, today):
                continue

            client_count = coach.clients.count()
            active_clients = coach.clients.filter(subscription__status__in=['active', 'trial']).count()
            if not client_count:
                continue

            summary = [
                f'{active_clients} active client(s) assigned',
                'Review your dashboard for open support and session requests.',
            ]

            if not dry_run:
                send_trainer_notification_email(
                    coach.email,
                    coach.get_full_name() or coach.username,
                    f'{active_clients} active client(s) need attention',
                )
                self._create_log('trainer_summary', coach.email, coach.get_full_name() or coach.username, today, {
                    'client_count': client_count,
                    'active_clients': active_clients,
                })
            count += 1
        return count