# FitCoachPro — IMPLEMENTATION ROADMAP
## What Needs to Change in the Current Project

---

## 🎯 CURRENT STATE vs. TARGET STATE

### Current State (Today)
- ✅ Django backend with JWT auth, subscriptions, payments.
- ✅ React frontend with dashboard, workouts, AI coach.
- ✅ Tier structure (Free, Pro, Elite, Custom).
- ✅ Trainer sessions + coach scheduling (partial).
- ⚠️ AI coach has fallback logic but not measurement-aware.
- ⚠️ Custom pricing is static, not dynamic.
- ⚠️ "Flex" tier still in seed data (confusing).
- ⚠️ Dashboard is rich but lacks predictive insights.
- ⚠️ No referral system or gamification hooks.

### Target State (90 Days)
- ✅ Tier structure clean (Free, Pro, Elite, Custom only).
- ✅ AI coach is **measurement-aware + goal-specific**.
- ✅ Custom pricing is **fully dynamic** (base + sessions).
- ✅ Trainer onboarding + payout system.
- ✅ Advanced dashboard with **trend analysis + AI insights**.
- ✅ Referral system (users earn points/cash).
- ✅ Leaderboard + challenges (gamification).
- ✅ Set-by-set workout logging (live session engine).
- ✅ Automated support ticket triage.

---

## 📋 DETAILED IMPLEMENTATION CHECKLIST

### PHASE 1: CLEANUP & FOUNDATION (Week 1–2)

#### 1.1 Remove "Flex" from Tier Ladder
**Status**: DONE (partially)
- [x] Updated `subscriptions/models.py` to remove flex choice from TIER_CHOICES.
- [x] Updated `SubscriptionsPage.jsx` to hide flex from public ladder.
- [ ] Update seed data (`seed_demo_data.py`) to only seed Free, Pro, Elite, Custom.
- [ ] Migrate existing flex users → Pro tier (script).
- [ ] Update all tier references in AI coach (`_normalize_tier` function).

**Files to Update**:
- `backend/subscriptions/models.py` — remove flex choice.
- `backend/cms/management/commands/seed_demo_data.py` — remove flex from tiers list.
- `backend/core/views.py` — simplify `_normalize_tier()` (no flex mapping).
- `frontend/src/components/AICoach.jsx` — update tier config constants.
- Migration script: `backend/accounts/management/commands/migrate_flex_users.py`.

**Effort**: 2–3 hours.

---

#### 1.2 Cleanup Unused Files & Documentation
- [x] Removed old HTML blueprint files (elite_custom_repriced.html, fitpro_full_blueprint.html).
- [ ] Archive old documentation (CMS_COMPLETE.md, FRONTEND_UPGRADE.md, etc.).
- [ ] Keep only: README.md, SETUP.md, FITCOACHPRO_BUSINESS_BLUEPRINT.md, THIS roadmap.
- [ ] Update project README to reflect current architecture.

**Effort**: 1–2 hours.

---

### PHASE 2: AI COACH IMPROVEMENTS (Week 2–3)

#### 2.1 Enhance AI Fallback Logic (DONE)
- [x] Added measurement trend detection (`weight_trend`).
- [x] Added goal-aware suggestions (lose fat, gain muscle, maintain).
- [x] Added body fat % to snapshot.
- [x] Improved fallback replies for measurement, workout, nutrition queries.

**What Was Changed**:
- `_get_ai_snapshot()` now fetches latest 2 measurements (for trend).
- `_build_fallback_reply()` detects message intent + user goal → goal-specific next steps.

**Testing Required**:
- Test fallback with different user goals.
- Verify measurement trend calculations.
- Check edge cases (no measurements, no workouts).

**Effort**: DONE (already implemented).

---

#### 2.2 AI Coach Message Quota by Tier
- [ ] Add `daily_ai_messages_limit` and `weekly_messages_limit` fields to SubscriptionTier model.
- [ ] Update AICoachViewSet to check limits before accepting messages.
- [ ] Return clear error when limit reached: `"You've used 20/20 daily messages. Refills tomorrow at 12 AM."`
- [ ] Implement message refill logic (daily/weekly reset).

**Database Changes**:
```python
# In SubscriptionTier model
daily_ai_messages_limit = models.IntegerField(default=5)  # Free
weekly_trainer_messages_limit = models.IntegerField(default=0)  # For Pro/Elite
```

**Seed Data**:
- Free: 5 daily messages, 0 trainer messages.
- Pro: 20 daily messages, 0 trainer messages.
- Elite: 50 daily messages, 10 trainer messages/week.
- Custom: 100 daily messages, 20 trainer messages/week.

**Effort**: 4–6 hours.

---

#### 2.3 Trainer Message System
- [ ] Add `TrainerMessage` model (trainer-to-user direct messaging).
- [ ] Add quota tracking (10 messages/week for Elite, configurable for Custom).
- [ ] Build backend endpoints: `POST /core/trainer-messages/send/`, `GET /core/trainer-messages/list/`.
- [ ] Add frontend message UI (inbox + compose modal).
- [ ] Notification when trainer replies (email + in-app).

**Files**:
- `backend/core/models.py` — add TrainerMessage model.
- `backend/core/views.py` — add TrainerMessageViewSet.
- `backend/core/serializers.py` — add TrainerMessageSerializer.
- `frontend/src/pages/MessageCenter.jsx` — new page for messages.

**Effort**: 8–10 hours.

---

### PHASE 3: DYNAMIC CUSTOM PRICING (Week 3–4)

#### 3.1 Enhance Payment Intent System (DONE)
- [x] Updated `create_payment_intent()` to accept custom_package payload.
- [x] Implemented `_calculate_custom_coach_amount()` method.
- [x] Updated frontend API client to send custom package data.

**What Was Changed**:
- Backend now calculates Elite base + (sessions/week × duration × hourly_rate × 4 weeks).
- Frontend SubscriptionsPage has calculator UI.

**Testing Required**:
- Test custom package calculations (verify math).
- Test coupon application on custom packages.
- Verify Stripe payment intent metadata includes package details.

**Effort**: DONE (already implemented).

---

#### 3.2 Trainer Payout System
- [ ] Add `TrainerPayout` model to track earnings.
- [ ] Add `payout_split` field to CoachSession (track how much goes to trainer).
- [ ] Build payout calculation logic:
  - Elite base: Trainer gets 60% of session cost (e.g., $15 per 30-min session).
  - Custom: Trainer gets 70–80% of add-on session revenue.
- [ ] Add monthly payout dashboard (admin view).
- [ ] Integrate Stripe Connect for trainer payouts.

**Files**:
- `backend/payments/models.py` — add TrainerPayout model.
- `backend/payments/views.py` — add payout calculation + Stripe Connect integration.
- `backend/core/views.py` — update CoachSessionViewSet to log payouts.
- `frontend/src/pages/TrainerPayoutDashboard.jsx` — new page.

**Effort**: 12–15 hours.

---

#### 3.3 Trainer Onboarding
- [ ] Add trainer role + admin interface to create trainer accounts.
- [ ] Build trainer signup flow (bank details, tax info, rate preference).
- [ ] Generate trainer API key for custom integrations.
- [ ] Dashboard: earnings, pending payouts, client list, session history.

**Files**:
- `backend/accounts/views.py` — add trainer signup endpoint.
- `frontend/src/pages/TrainerOnboarding.jsx` — new page.
- `frontend/src/pages/TrainerDashboard.jsx` — earnings + clients.

**Effort**: 10–12 hours.

---

### PHASE 4: ADVANCED DASHBOARD (Week 4–5)

#### 4.1 Predictive Insights
- [ ] Add "Next Best Move" card to dashboard.
  - If weight stalled 2+ weeks on bulk: "Increase carbs by 100 cal/day."
  - If weight dropping too fast on cut: "Slow down—risk losing muscle."
  - If no workouts this week: "You're 3 sessions behind. Start one today!"
- [ ] Implement plateau detection (no strength gain 3+ weeks).
- [ ] Add injury risk flagging (sudden performance drop).

**Logic**:
```python
def _generate_next_best_move(user):
    measurements = BodyMeasurement.objects.filter(user=user).order_by('-date')[:4]
    workouts = UserWorkoutProgress.objects.filter(user=user, completed=True).order_by('-completed_at')[:10]
    goal = user.fitness_goal
    
    # Detect patterns...
    if bulking and weight_stalled:
        return "Increase daily carbs by 100–150 kcal"
    elif cutting and weight_dropping_fast:
        return "Slow down—risk muscle loss. Add 200 kcal from protein."
    elif no_workouts_this_week:
        return "Start a session today to stay on track."
    elif plateau_detected:
        return "No strength gain in 3 weeks. Try deload week or add volume."
    else:
        return "Keep the current plan. You're on track."
```

**Files**:
- `backend/core/views.py` — add `_generate_next_best_move()` method.
- `backend/accounts/views.py` — update `dashboard_stats` endpoint to include next move.
- `frontend/src/pages/DashboardPage.jsx` — add new insights card.

**Effort**: 8–10 hours.

---

#### 4.2 Real-Time Workout Tracking (Optional Phase 2)
- [ ] Add `LiveWorkout` model (tracks session in real-time).
- [ ] Build set-by-set logging UI:
  - User taps "Start Workout".
  - For each set: weight + reps + rest timer.
  - Auto-calculates total volume, intensity.
- [ ] Add form check flow (user uploads video → trainer reviews).

**Files**:
- `backend/workouts/models.py` — add LiveWorkout, LiveSet models.
- `backend/workouts/views.py` — add endpoints for logging sets in real-time.
- `frontend/src/pages/LiveWorkoutPage.jsx` — new page.

**Effort**: 15–20 hours (defer to Phase 2).

---

#### 4.3 Enhanced Leaderboard
- [ ] Add weekly leaderboard (reset every Monday).
- [ ] Track multiple metrics: total points, workouts this week, longest streak, most calories burned.
- [ ] Add user badges (e.g., "🔥 Streak Master", "💪 Volume King").
- [ ] Show top 10 global + top 10 in user's region (if location data available).

**Files**:
- `backend/core/views.py` — update `leaderboard` action to include weekly ranking.
- `frontend/src/components/Leaderboard.jsx` — add multiple sort options + badges.

**Effort**: 4–6 hours.

---

### PHASE 5: GAMIFICATION & ENGAGEMENT (Week 5–6)

#### 5.1 Referral System
- [ ] Add `Referral` model (already exists, but needs enhancement).
- [ ] Build referral link generator + tracking.
- [ ] Reward system:
  - Free users: earn 100 points per successful referral.
  - Paid users: earn 5–10% cash back on referred user's first month.
- [ ] Referral dashboard (show earnings + clicks).

**Files**:
- `backend/core/models.py` — enhance Referral model.
- `backend/core/views.py` — add referral earning calculation.
- `frontend/src/pages/ReferralDashboard.jsx` — new page.
- `frontend/src/components/ReferralLink.jsx` — copy-to-clipboard link.

**Effort**: 6–8 hours.

---

#### 5.2 Achievement Badges & Challenges
- [ ] Enhance `Achievement` model to include badge icon + unlock criteria.
- [ ] Build achievement tracking logic:
  - "First 5 Workouts": Unlock when user completes 5 workouts.
  - "30-Day Streak": Unlock on 30 consecutive days.
  - "Calorie Burner": Unlock after burning 50,000 total calories.
- [ ] Build monthly challenges (community-wide):
  - "1,000 Burpees Challenge": Leaderboard of who completes most burpees this month.
  - "Nutrition Perfection": 30 days tracking macros within 10% of target.
- [ ] Badges display on user profile + leaderboard.

**Files**:
- `backend/core/models.py` — enhance Achievement model.
- `backend/core/views.py` — add achievement unlock logic.
- `frontend/src/components/AchievementBadge.jsx` — new component.
- `frontend/src/pages/ChallengesPage.jsx` — enhance (already partially done).

**Effort**: 10–12 hours.

---

#### 5.3 Points Economy Enhancement
- [ ] Expand point earning mechanics:
  - Workouts: 10–50 points (based on difficulty + duration).
  - Meals logged: 5 points each (up to 20/day).
  - Referral: 100 points per successful referral.
  - Streaks: 5 points per day (bonus after 7-day streak).
- [ ] Allow point redemption:
  - 50 points = 1 free Pro workout access.
  - 100 points = 10% discount on next subscription renewal.
  - 500 points = free coaching session (Elite tier).

**Files**:
- `backend/core/models.py` — add RedemptionLog model.
- `backend/core/views.py` — add point earning + redemption endpoints.
- `frontend/src/pages/PointsRedemptionPage.jsx` — new page.

**Effort**: 8–10 hours.

---

### PHASE 6: OPERATIONAL SYSTEMS (Week 6–7)

#### 6.1 Support Ticket Triage (AI-assisted)
- [ ] Build support dashboard (admin view).
- [ ] Implement AI suggestion for each ticket:
  - If about pricing: Show FAQ + link to pricing page.
  - If about technical issue: Show troubleshooting guide.
  - If about refund: Auto-suggest 7-day money-back guarantee.
- [ ] Escalate only 20–30% of tickets to human support.
- [ ] SLA tracking (respond within 24h).

**Files**:
- `backend/core/views.py` — add `TicketTriageViewSet`.
- `backend/core/models.py` — add fields to SupportTicket for AI suggestion + status.
- `frontend/src/pages/AdminSupportDashboard.jsx` — new page.

**Effort**: 8–10 hours.

---

#### 6.2 Email Automation
- [ ] Build email templates:
  - Welcome email (signup).
  - Weekly digest (progress summary + next week's workouts).
  - Churn warning (no activity 7 days).
  - Referral reward notification.
  - Trainer message notification.
- [ ] Implement email scheduling (Celery + Redis).
- [ ] Track email opens + clicks (Sendgrid integration).

**Files**:
- `backend/fitness_project/utils/emails.py` — add email templates.
- `backend/fitness_project/tasks.py` — add Celery tasks for email scheduling.
- `.env` — add Sendgrid API key.

**Effort**: 10–12 hours.

---

#### 6.3 Admin Dashboard Enhancements
- [ ] Build comprehensive admin view:
  - Total users, revenue, churn rate, LTV.
  - Active users by tier + geography.
  - Top trainers (by sessions + ratings).
  - Support ticket queue.
  - Payment history + disputes.
- [ ] Add analytics integrations (Google Analytics 4, Mixpanel).

**Files**:
- `frontend/src/pages/AdminDashboard.jsx` — enhance significantly.
- `backend/accounts/views.py` — add admin stats endpoints.

**Effort**: 12–15 hours.

---

### PHASE 7: QUALITY & OPTIMIZATION (Week 7–8)

#### 7.1 Testing & Bug Fixes
- [ ] Write unit tests for:
  - Custom pricing calculation.
  - AI message quota enforcement.
  - Trainer payout calculation.
  - Achievement unlock logic.
- [ ] End-to-end tests (signup → payment → coaching session).
- [ ] Load test (1,000 concurrent users).
- [ ] Fix any bugs found during testing.

**Effort**: 15–20 hours.

---

#### 7.2 Security Audit
- [ ] OWASP top 10 review.
- [ ] Verify JWT token security (expiration, refresh logic).
- [ ] Ensure payment data is PCI-compliant (no sensitive data in logs).
- [ ] Test SQL injection, XSS, CSRF protections.
- [ ] Review API rate limiting.

**Effort**: 10–15 hours.

---

#### 7.3 Performance Optimization
- [ ] Optimize database queries (add indexes on frequently-queried fields).
- [ ] Implement caching (Redis for leaderboard, frequently-accessed data).
- [ ] Compress images + implement CDN caching.
- [ ] Reduce bundle size (tree-shake unused React components).
- [ ] Optimize AI response time (batch requests, caching).

**Effort**: 10–12 hours.

---

### PHASE 8: LAUNCH PREP (Week 8–9)

#### 8.1 Marketing Collateral
- [ ] Update landing page with new tier pricing + custom calculator.
- [ ] Create testimonial videos (early users).
- [ ] Write blog posts on AI coaching, custom training, referral program.
- [ ] Set up email drip campaign (onboarding sequence).

**Effort**: 10–15 hours (consider outsourcing copywriting).

---

#### 8.2 Beta Launch
- [ ] Recruit 50–100 beta testers (friends, local gym, online fitness communities).
- [ ] Provide beta testers free Pro/Elite access for 3 months.
- [ ] Collect feedback via survey + Slack/Discord.
- [ ] Fix critical issues found during beta.

**Effort**: 5–10 hours (ongoing).

---

#### 8.3 Production Deployment
- [ ] Set up monitoring (Sentry, DataDog, New Relic).
- [ ] Configure auto-scaling (AWS, Heroku, or similar).
- [ ] Set up backup system (daily DB backups).
- [ ] Configure DNS, SSL certs.
- [ ] Final smoke tests.

**Effort**: 5–10 hours.

---

## 🗓️ TIMELINE SUMMARY

| Phase | Weeks | Effort (Hours) | Status |
|-------|-------|----------------|--------|
| Phase 1: Cleanup | 1–2 | 4–6 | Ready |
| Phase 2: AI Improvements | 2–3 | 12–16 | Partially Done |
| Phase 3: Custom Pricing | 3–4 | 20–30 | Partially Done |
| Phase 4: Dashboard | 4–5 | 20–26 | Partial (defer real-time) |
| Phase 5: Gamification | 5–6 | 24–30 | Ready |
| Phase 6: Operations | 6–7 | 26–32 | Ready |
| Phase 7: Quality | 7–8 | 25–35 | Ready |
| Phase 8: Launch | 8–9 | 20–35 | Ready |
| **TOTAL** | **9 weeks** | **~200–240 hours** | **ON TRACK** |

---

## 📊 EFFORT BREAKDOWN

| Category | Hours | % |
|----------|-------|---|
| Backend (API, models, logic) | 90–110 | 45% |
| Frontend (UI, components, pages) | 70–85 | 35% |
| Infrastructure (deployment, monitoring) | 15–20 | 8% |
| Testing & Security | 15–25 | 10% |
| **TOTAL** | **190–240** | **100%** |

---

## 🎯 PRIORITY RANKING

### MUST-HAVE (Launch Blocker)
1. ✅ Remove "flex" tier (clean ladder).
2. ✅ Fix AI fallback (measurement-aware).
3. ✅ Dynamic custom pricing.
4. ✅ Trainer onboarding + payout system.
5. ✅ Dashboard with trend insights.

### SHOULD-HAVE (First 30 Days Post-Launch)
6. AI message quotas by tier.
7. Trainer message system.
8. Referral system.
9. Achievement badges.
10. Email automation.

### NICE-TO-HAVE (Phase 2)
11. Real-time workout logging (set-by-set).
12. Form check video uploads.
13. Advanced analytics dashboard.
14. Mobile app.

---

## ✅ NEXT IMMEDIATE ACTIONS

### This Week (Week 1)
- [ ] Clean up `seed_demo_data.py` (remove flex, update descriptions).
- [ ] Update README.md (link to FITCOACHPRO_BUSINESS_BLUEPRINT.md).
- [ ] Test AI fallback with different scenarios.
- [ ] Create migration script for existing flex users.

### Next Week (Week 2)
- [ ] Build trainer onboarding (signup, profile, bank details).
- [ ] Enhance CoachSession model with payout tracking.
- [ ] Add AI message quota fields to SubscriptionTier.
- [ ] Begin Trainer Message system design.

### Week 3
- [ ] Implement AI message quota enforcement.
- [ ] Build Trainer Message system (backend + frontend).
- [ ] Add predictive insights to dashboard.
- [ ] Beta test custom pricing calculator.

---

## 🚨 RISKS & BLOCKERS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Trainer recruitment lag | Medium | Revenue loss | Start recruiting 4 weeks before launch |
| AI API rate limits | Low | Service disruption | Implement aggressive caching + batch requests |
| Refund requests post-launch | Medium | Cash flow impact | Clear refund policy in terms, 7-day guarantee |
| Poor email deliverability | Medium | Engagement loss | Use Sendgrid (high reputation), monitor bounce rate |
| Payment processing errors | Low | Revenue loss | Test payment flow thoroughly, multiple payment methods |

---

## 📞 QUESTIONS & DECISIONS NEEDED

1. **Trainer Payout Method**: Stripe Connect or direct bank transfer?
   - **Recommendation**: Stripe Connect (automated, compliant, scalable).

2. **Message Quota Reset**: Daily at midnight, weekly on Monday, or monthly?
   - **Recommendation**: Daily for AI coach, weekly on Monday for trainer messages.

3. **Referral Rewards**: Points-only or cash back?
   - **Recommendation**: Points for free users, 5% cash back for paid users (stickiness).

4. **Beta Testing Duration**: 1 month or 3 months?
   - **Recommendation**: 1 month (fast iteration), then public launch.

5. **Support Ticket SLA**: 24h, 48h, or 72h?
   - **Recommendation**: 24h for Elite/Custom, 72h for Pro, none for Free.

---

## 📚 DOCUMENTATION REFERENCES

- **Business Blueprint**: `FITCOACHPRO_BUSINESS_BLUEPRINT.md`
- **Setup Guide**: `SETUP.md`
- **Current Architecture**: `README.md`
- **This Roadmap**: `FITCOACHPRO_IMPLEMENTATION_ROADMAP.md`

---

**Last Updated**: May 12, 2026  
**Status**: FINAL (Ready for Week 1 Execution)
