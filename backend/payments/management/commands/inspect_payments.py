from django.core.management.base import BaseCommand
from payments.models import Payment, Invoice
from accounts.models import UserSubscription
from django.utils import timezone

class Command(BaseCommand):
    help = 'Inspect recent payments, invoices and user subscriptions'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=10, help='Number of records to show')

    def handle(self, *args, **options):
        limit = options['limit']
        self.stdout.write(self.style.NOTICE(f'Inspecting last {limit} Payments'))
        for p in Payment.objects.order_by('-created_at')[:limit]:
            self.stdout.write(f'Payment id={p.id} user={p.user_id} plan={getattr(p.subscription_plan, "name", None)} amount={p.amount} status={p.status} stripe_id={p.stripe_payment_id} created={p.created_at}')

        self.stdout.write(self.style.NOTICE(f'\nInspecting last {limit} Invoices'))
        for inv in Invoice.objects.order_by('-created_at')[:limit]:
            self.stdout.write(f'Invoice id={inv.id} user={inv.user_id} payment={getattr(inv.payment, "id", None)} number={inv.invoice_number} amount={inv.amount} status={inv.status} created={inv.created_at}')

        self.stdout.write(self.style.NOTICE(f'\nInspecting active UserSubscriptions (limit {limit})'))
        for s in UserSubscription.objects.order_by('-start_date')[:limit]:
            self.stdout.write(f'UserSubscription id={s.id} user={s.user_id} plan={getattr(s.subscription_plan, "name", None)} status={s.status} start={s.start_date} end={s.end_date} stripe_customer={s.stripe_customer_id} stripe_subscription={s.stripe_subscription_id}')

        self.stdout.write(self.style.SUCCESS('Inspection complete.'))
