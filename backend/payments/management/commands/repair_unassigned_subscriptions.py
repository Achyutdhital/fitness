import csv
from django.core.management.base import BaseCommand, CommandError
from accounts.models import UserSubscription
from subscriptions.models import SubscriptionPlan
from django.utils import timezone

CSV_PATH = 'backend/payments/unassigned_subscriptions.csv'

class Command(BaseCommand):
    help = 'Export or repair UserSubscription rows missing subscription_plan'

    def add_arguments(self, parser):
        parser.add_argument('--export-csv', action='store_true', help='Export unassigned subscriptions to CSV')
        parser.add_argument('--assign-plan', type=str, help='Assign given plan id to all unassigned subscriptions')

    def handle(self, *args, **options):
        export_csv = options['export_csv']
        assign_plan = options.get('assign_plan')

        queryset = UserSubscription.objects.filter(subscription_plan__isnull=True).order_by('-start_date')
        if not queryset.exists():
            self.stdout.write(self.style.SUCCESS('No unassigned UserSubscription rows found.'))
            return

        if export_csv:
            with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['id', 'user_id', 'status', 'start_date', 'end_date', 'stripe_customer_id', 'stripe_subscription_id'])
                for s in queryset:
                    writer.writerow([str(s.id), str(s.user_id), s.status, s.start_date.isoformat() if s.start_date else '', s.end_date.isoformat() if s.end_date else '', s.stripe_customer_id or '', s.stripe_subscription_id or ''])
            self.stdout.write(self.style.SUCCESS(f'Exported {queryset.count()} rows to {CSV_PATH}'))

        if assign_plan:
            try:
                plan = SubscriptionPlan.objects.get(id=assign_plan)
            except SubscriptionPlan.DoesNotExist:
                raise CommandError(f'Plan id {assign_plan} not found')

            updated = 0
            for s in queryset:
                s.subscription_plan = plan
                s.save(update_fields=['subscription_plan'])
                updated += 1
            self.stdout.write(self.style.SUCCESS(f'Assigned plan {plan.name} to {updated} subscriptions'))
