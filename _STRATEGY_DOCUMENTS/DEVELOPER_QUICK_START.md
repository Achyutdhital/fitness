# FitCoachPro — QUICK-START GUIDE FOR DEVELOPERS

## 📖 How to Use These Documents

### For Understanding the Vision
1. Start here: **`FITCOACHPRO_EXECUTIVE_SUMMARY.md`**
   - 5-minute read on what FitCoachPro is and why it works.
   - Metrics, financials, market positioning.

### For Business Details
2. Then read: **`FITCOACHPRO_BUSINESS_BLUEPRINT.md`**
   - Complete revenue architecture.
   - Automation strategy deep-dive.
   - Operations, team structure, success factors.
   - Financial projections, risks, mitigations.

### For Implementation Tasks
3. Finally, execute: **`FITCOACHPRO_IMPLEMENTATION_ROADMAP.md`**
   - Week-by-week breakdown of what to build.
   - Specific files to create/modify.
   - Effort estimates for each task.
   - Priority ranking (must-have vs. nice-to-have).

---

## 🚀 Quick-Start: First 30 Days

### Week 1: Cleanup (4–6 hours)
**Goal**: Clean tier ladder, remove "flex" confusion.

```bash
# 1. Update subscriptions/models.py
# Remove 'flex' from TIER_CHOICES list
# Keep only: 'free', 'pro', 'elite', 'custom'

# 2. Update seed_demo_data.py
# Remove flex tier from seed_subscription_plans()
# Only seed Free, Pro, Elite, Custom

# 3. Delete seed data for flex
python manage.py shell
from subscriptions.models import SubscriptionTier
SubscriptionTier.objects.filter(name='flex').delete()

# 4. Test
python manage.py check
npm run build
```

### Week 2: Trainer Onboarding (10–12 hours)
**Goal**: Enable trainers to sign up and get paid.

**Backend Tasks**:
```python
# 1. Add to accounts/models.py (CustomUser)
trainer_hourly_rate = models.IntegerField(default=40)
trainer_bio = models.TextField(blank=True)
trainer_certifications = models.JSONField(default=list)
bank_account_last_four = models.CharField(max_length=4, blank=True)
stripe_account_id = models.CharField(max_length=255, blank=True)

# 2. Create accounts/management/commands/create_trainer.py
# Allow admin to promote user to trainer role

# 3. Add accounts/views.py
@action(detail=False, methods=['post'])
def trainer_signup(self, request):
    # Validate trainer credentials
    # Create Stripe Connect account
    # Send confirmation email
    pass
```

**Frontend Tasks**:
```jsx
// 1. Create frontend/src/pages/TrainerSignup.jsx
// Form: email, certifications, hourly rate, bank details
// Submit to backend, receive Stripe Connect link

// 2. Create frontend/src/pages/TrainerDashboard.jsx
// Show: earnings, clients, sessions, payout history
```

### Week 3: AI & Coach Messages (12–16 hours)
**Goal**: Implement message quotas + trainer reply system.

**Backend Tasks**:
```python
# 1. Add to core/models.py
class TrainerMessage(models.Model):
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

class MessageQuotaReset(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    last_reset = models.DateTimeField(auto_now_add=True)
    messages_used_this_week = models.IntegerField(default=0)

# 2. Update core/views.py
class AICoachViewSet:
    def chat(self, request):
        tier = self._get_user_tier(request.user)
        limit = TIER_LIMITS.get(tier, 0)
        
        # Check daily limit
        if usage_record.count >= limit:
            return Response({
                'error': 'limit_reached',
                'message': f'Daily limit reached. Refills tomorrow.'
            }, status=403)
        
        # Continue with chat logic...

# 3. Add core/views.py
class TrainerMessageViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def send(self, request):
        # Check if user is trainer
        # Check message quota for recipient
        # Create TrainerMessage record
        # Send notification
        pass
```

**Frontend Tasks**:
```jsx
// 1. Create frontend/src/pages/MessageCenter.jsx
// Show inbox + compose modal
// Display message quota usage

// 2. Update AICoach.jsx
// Show message quota in UI
// Handle limit_reached error gracefully
```

### Week 4: Custom Pricing & Payouts (12–15 hours)
**Goal**: Make custom coaching pricing functional end-to-end.

**Backend Tasks** (Already 70% done!):
```python
# 1. Enhance payments/views.py
# Implement _calculate_custom_coach_amount()  ✅ DONE
# Implement _get_custom_coach_base_plan()    ✅ DONE

# 2. Add payments/models.py
class TrainerPayout(models.Model):
    trainer = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    session = models.ForeignKey(CoachSession, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(choices=[('pending', 'Pending'), ('processed', 'Processed')])
    stripe_payout_id = models.CharField(max_length=255, blank=True)

# 3. Add payments/views.py
@action(detail=False, methods=['post'])
def process_trainer_payouts(self, request):
    # Get all pending payouts
    # Group by trainer + month
    # Calculate totals
    # Create Stripe Connect payouts
    # Update status to 'processed'
    pass
```

**Frontend Tasks** (Already done!):
```jsx
// 1. SubscriptionsPage.jsx ✅ Has custom coach calculator
// 2. PaymentPage.jsx ✅ Accepts custom packages

// 3. Create frontend/src/pages/TrainerPayoutHistory.jsx
// Show all payouts + earnings breakdown
```

---

## 🎯 Key Files to Know

### Backend Core
| File | Purpose | Status |
|------|---------|--------|
| `accounts/models.py` | User model + fitness fields | ✅ Ready |
| `subscriptions/models.py` | Tier/Plan definitions | ✅ Clean (no flex) |
| `core/views.py` | AI coach, coaching sessions, payments | ⚠️ Partially done |
| `payments/views.py` | Stripe integration + custom pricing | ✅ Done |
| `workouts/models.py` | Workouts, meal plans, progress | ✅ Ready |

### Frontend Key Pages
| File | Purpose | Status |
|------|---------|--------|
| `pages/DashboardPage.jsx` | User dashboard | ✅ Rich + responsive |
| `pages/SubscriptionsPage.jsx` | Pricing + custom calculator | ✅ Done |
| `pages/PaymentPage.jsx` | Checkout | ✅ Handles custom packages |
| `pages/CoachDashboard.jsx` | Coach management | ⚠️ Needs payout view |
| `pages/TrainerOnboarding.jsx` | NEW: Trainer signup | ❌ Needs creation |

### Services
| File | Purpose | Status |
|------|---------|--------|
| `services/api.js` | API client | ✅ Updated for custom packages |
| `context/AuthContext.jsx` | Auth state + user data | ✅ Ready |

---

## 🔧 How to Run Locally

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data  # Seeds Free, Pro, Elite, Custom (no flex!)
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server on localhost:5173
```

### Test API Endpoints
```bash
# Get tiers (no flex!)
curl http://localhost:8000/api/subscriptions/tiers/

# Get plans (Pro, Elite, Custom only)
curl http://localhost:8000/api/subscriptions/plans/

# Test custom payment intent
curl -X POST http://localhost:8000/api/payments/payments/create_payment_intent/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_package": {
      "name": "Custom Coach",
      "sessions_per_week": 4,
      "session_duration_minutes": 30,
      "hourly_rate": 40
    }
  }'
```

---

## 📊 Database Schema Overview

### Key Models
```
CustomUser (Extended Django User)
├─ fitness_goal: 'lose_weight', 'gain_muscle', 'maintain'
├─ activity_level: 'sedentary' to 'very_active'
├─ subscription (OneToOne → UserSubscription)
└─ measurements (Reverse FK ← BodyMeasurement)

SubscriptionTier
├─ name: 'free', 'pro', 'elite', 'custom' (NO FLEX!)
├─ sessions_per_week: 0, 0, 3, 1-6 (configurable)
└─ plans (Reverse FK ← SubscriptionPlan)

SubscriptionPlan
├─ tier (FK)
├─ price: $0, $29.99, $99.99, dynamic
├─ billing_cycle: 'monthly', 'quarterly', 'yearly'
└─ users (Reverse FK ← UserSubscription)

CoachSession
├─ client (FK → CustomUser)
├─ coach (FK → CustomUser)
├─ status: 'pending', 'scheduled', 'completed', 'canceled'
├─ scheduled_at: datetime
└─ meeting_link: Jitsi URL

BodyMeasurement
├─ user (FK)
├─ weight, body_fat_percentage, muscle_mass_kg
├─ date: when measured
└─ Used for trend analysis + AI insights

UserWorkoutProgress
├─ user (FK)
├─ workout (FK)
├─ completed: boolean
├─ duration_minutes, calories_burnt
└─ Used for dashboard stats + AI coaching

AIChatMessage
├─ user (FK)
├─ role: 'user' or 'model'
├─ text: message content
├─ timestamp
└─ Tracks conversation history
```

---

## 🚨 Important Gotchas

### 1. AI Message Quotas Not Yet Enforced
- **Current State**: AI responds to all messages.
- **To-Do**: Add `daily_ai_messages_limit` to SubscriptionTier + check in AICoachViewSet.

### 2. Trainer Payouts Not Automated
- **Current State**: CoachSession created but no payout calculated.
- **To-Do**: Create TrainerPayout model + monthly payout batch job.

### 3. Flex Tier Still in Some Seed Data
- **Current State**: `seed_demo_data.py` may still reference flex.
- **To-Do**: Remove all flex references from seed logic.

### 4. Custom Coach Price Not Stored
- **Current State**: Calculated dynamically at checkout.
- **To-Do**: Store final price in Payment record for accounting.

### 5. Trainer Message Notifications Not Implemented
- **Current State**: No email/push when trainer replies.
- **To-Do**: Add Sendgrid email + Celery task for notifications.

---

## ✅ Pre-Launch Checklist

- [ ] All tier choices updated (no flex).
- [ ] AI message quotas enforced by tier.
- [ ] Trainer onboarding system live.
- [ ] Trainer payouts calculated + processed monthly.
- [ ] Custom pricing working end-to-end.
- [ ] Dashboard shows trend analysis + predictive insights.
- [ ] Referral system operational.
- [ ] Achievement badges working.
- [ ] Support ticket triage implemented.
- [ ] Email automation live (welcome, digest, churn prevention).
- [ ] Security audit completed.
- [ ] Performance optimized (cached queries, CDN, bundle size).
- [ ] Monitoring configured (Sentry, error alerts).
- [ ] Backup system tested.
- [ ] Beta testing with 50+ users completed.

---

## 📞 Support Resources

### For API Issues
- Django REST Framework docs: https://www.django-rest-framework.org/
- Our API is at: http://localhost:8000/api/ (dev)

### For Frontend Issues
- React docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion/

### For AI Issues
- Gemini API: https://ai.google.dev/
- Groq API: https://console.groq.com/
- Fallback logic in: `backend/core/views.py` → `_build_fallback_reply()`

### For Payment Issues
- Stripe docs: https://stripe.com/docs
- Custom pricing logic in: `backend/payments/views.py` → `_calculate_custom_coach_amount()`

---

## 🎓 Recommended Reading Order

1. **`FITCOACHPRO_EXECUTIVE_SUMMARY.md`** (5 min) — Understand the why.
2. **`FITCOACHPRO_BUSINESS_BLUEPRINT.md`** (20 min) — Understand the what.
3. **`FITCOACHPRO_IMPLEMENTATION_ROADMAP.md`** (30 min) — Understand the how.
4. **`backend/README.md`** — Backend architecture.
5. **`frontend/README.md`** — Frontend architecture.
6. **`SETUP.md`** — How to run locally.

---

**Last Updated**: May 12, 2026  
**Audience**: Development Team  
**Status**: READY FOR SPRINT 1
