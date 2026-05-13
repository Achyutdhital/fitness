"""
Celery tasks for payments and payouts.
"""

from celery import shared_task
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name='payments.tasks.process_monthly_coach_payouts', bind=True, max_retries=3)
def process_monthly_coach_payouts(self):
    """Process monthly coach payouts."""
    from payments.models import CoachPayout
    from accounts.models import CustomUser
    from django.db.models import Q, Sum
    
    try:
        # Get all coaches
        coaches = CustomUser.objects.filter(role='coach')
        
        total_amount = 0
        count = 0
        
        for coach in coaches:
            try:
                # Calculate owed amount from successful subscriptions
                owed = CoachPayout.objects.filter(
                    coach=coach,
                    status='pending'
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                if owed > 0:
                    # Create payout record
                    payout = CoachPayout.objects.create(
                        coach=coach,
                        amount=owed,
                        status='processed',
                        processed_at=timezone.now(),
                    )
                    
                    total_amount += owed
                    count += 1
                    logger.info(f"Processed payout for coach {coach.id}: ${owed}")
            except Exception as e:
                logger.error(f"Failed to process payout for coach {coach.id}: {e}")
        
        logger.info(f"Processed {count} coach payouts, total: ${total_amount}")
        return {'payouts_processed': count, 'total_amount': total_amount}
    
    except Exception as exc:
        logger.error(f"Monthly payout processing failed: {exc}")
        raise self.retry(exc=exc, countdown=3600)  # Retry in 1 hour
