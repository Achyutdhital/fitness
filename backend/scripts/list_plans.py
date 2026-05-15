import os
import json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_project.settings')
import django
django.setup()
from subscriptions.models import SubscriptionPlan
plans = []
for p in SubscriptionPlan.objects.all():
    plans.append({'id': str(p.id), 'name': p.name, 'tier': getattr(p.tier, 'name', None), 'price': str(p.price), 'billing_cycle': p.billing_cycle})
print(json.dumps(plans, indent=2))
