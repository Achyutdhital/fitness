# PHASE 2 AUDIT: AI Message Quotas & Trainer Messages

**Date**: May 13, 2026  
**Status**: Audit Complete  

---

## 1. CURRENT STATE ANALYSIS

### Existing Infrastructure ✅
- **AIUsage Model**: Tracks daily message count per user
  - Fields: user, date (auto_now_add), count (PositiveIntegerField)
  - Scope: Daily, not monthly
  - Issue: No tier-aware quota limits tracked
  
- **AIChatMessage Model**: Stores full conversation history
  - Fields: user, role (user/model), text, timestamp (auto_now_add)
  - Status: Working well for message persistence
  
- **CoachSession Model**: Tracks 1-on-1 video sessions
  - Fields: coach, client, requested_by, scheduled_at, duration_minutes, status, meeting_link, notes
  - Status: Ready for session counting
  
- **Chat Endpoint** (`/core/AICoachViewSet/chat/`):
  - Current implementation: ✅ Checks daily limits
  - TIER_LIMITS defined: `{'basic': 5, 'pro': 20, 'elite': 50}`
  - ⚠️ **BUG**: Uses 'basic' tier but we removed it in Phase 1
  - Increment logic: `usage_record.count += 1` after each message
  - Reset: Happens automatically daily via `get_or_create(user, date=today)`
  
### Missing Infrastructure ❌
1. **Trainer Message Tracking**: No model for trainer messages
2. **Monthly Reset**: No mechanism for monthly limits (only daily)
3. **Custom Tier Handling**: No quota for custom tier users
4. **Quota Display**: No endpoint to show remaining quota
5. **Rate Limiting**: No burst/rapid-fire protection
6. **Admin Override**: Limited override capability for testing

---

## 2. REQUIREMENTS FOR PHASE 2

### AI Message Quotas by Tier
| Tier | Daily Limit | Monthly Limit | Type |
|------|------------|---------------|------|
| Free | 5 | 100 | AI Only |
| Pro | 20 | 400 | AI Only |
| Elite | 50 | 1000 | AI Only |
| Custom | 100 | 2000 | AI + Trainer |

### Trainer Message Quotas (Custom Tier Only)
| Metric | Limit | Reset Period |
|--------|-------|--------------|
| Trainer Messages/Week | 20 | Every Sunday |
| Trainer Messages/Month | ~80 | Monthly |
| Response Time | <24 hours | N/A |

### Database Changes Needed
1. **TrainerMessage Model** - New
2. **AIUsage Enhancement** - Add monthly tracking
3. **QuotaReset Model** - Track monthly resets

---

## 3. IMPLEMENTATION TASKS

### Task 1: Update Models
**Files**: `backend/core/models.py`
**Changes**:
- Add `TrainerMessage` model
- Enhance `AIUsage` with monthly tracking
- Add `monthly_reset_date` field

**Estimated Time**: 30 mins

### Task 2: Create/Update Migrations
**Files**: `backend/core/migrations/`
**Actions**:
- Create new migration for TrainerMessage model
- Create migration for AIUsage enhancements
- Test migration execution

**Estimated Time**: 15 mins

### Task 3: Fix Backend Tier Limits
**Files**: `backend/core/views.py`
**Changes**:
- Update TIER_LIMITS in AICoachViewSet.chat()
  - Remove 'basic': 5
  - Add 'free': 5
  - Add 'custom': 100
- Add monthly quota checking
- Add trainer message endpoints

**Estimated Time**: 60 mins

### Task 4: Add Quota Display Endpoints
**Files**: `backend/core/views.py`
**Endpoints**:
- `GET /api/core/ai-coach/quota/` - Returns current usage + limits
- `GET /api/core/ai-coach/history/` - Returns message history
- `GET /api/core/trainer-messages/quota/` - Returns trainer quota

**Estimated Time**: 45 mins

### Task 5: Add Rate Limiting
**Files**: `backend/core/views.py`, `backend/fitness_project/settings.py`
**Changes**:
- Add burst rate limiting (max 3 messages/min)
- Add daily throttling via existing AIUsage
- Return clear error messages

**Estimated Time**: 30 mins

### Task 6: Update Frontend Dashboard
**Files**: `frontend/src/pages/Dashboard.jsx`
**Changes**:
- Display AI message quota remaining
- Show Trainer message quota (if applicable)
- Add visual progress bars

**Estimated Time**: 45 mins

### Task 7: Update AICoach Widget
**Files**: `frontend/src/components/AICoach.jsx`
**Changes**:
- Show remaining quota in widget footer
- Add quota warning when near limit
- Display quota refill time

**Estimated Time**: 30 mins

### Task 8: Create Test Suite
**Files**: `backend/core/tests.py`
**Tests**:
- Test daily quota reset
- Test tier-specific limits
- Test trainer messages
- Test rate limiting
- Test edge cases (midnight, month boundaries)

**Estimated Time**: 60 mins

### Task 9: Build & Validate
**Commands**:
- `npm run build` - Frontend build
- `python manage.py check` - Django check
- `python manage.py test` - Run test suite
- Manual testing in dev environment

**Estimated Time**: 30 mins

---

## 4. DETAILED SPECIFICATIONS

### TrainerMessage Model
```python
class TrainerMessage(models.Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4)
    user = ForeignKey('accounts.CustomUser', on_delete=CASCADE)
    coach = ForeignKey('accounts.CustomUser', on_delete=CASCADE, related_name='trainer_messages_sent')
    text = TextField()
    role = CharField(choices=[('coach', 'Coach'), ('user', 'User')])
    timestamp = DateTimeField(auto_now_add=True)
    week_of = DateField()  # For weekly quota tracking
    month_of = DateField()  # For monthly quota tracking
    
    class Meta:
        ordering = ['timestamp']
        unique_together = []  # Allow multiple messages
```

### Enhanced AIUsage Model
```python
class AIUsage(models.Model):
    user = ForeignKey('accounts.CustomUser', on_delete=CASCADE)
    date = DateField(auto_now_add=True)
    daily_count = PositiveIntegerField(default=0)
    monthly_count = PositiveIntegerField(default=0)
    monthly_reset_date = DateField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'date')
```

### Quota Response Format
```json
{
  "ai_quota": {
    "daily_limit": 20,
    "daily_used": 8,
    "daily_remaining": 12,
    "monthly_limit": 400,
    "monthly_used": 120,
    "monthly_remaining": 280,
    "reset_time": "2026-05-14T00:00:00Z",
    "monthly_reset_date": "2026-06-01"
  },
  "trainer_quota": null,  // Only for custom tier
  "tier": "pro"
}
```

---

## 5. RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Data loss on migration | Backup database before migration |
| Breaking existing users | Add default values to new fields |
| Rate limiting too strict | Use gradual rollout with monitoring |
| Monthly reset timing | Use cron job with error logging |
| Trainer quota abuse | Implement per-trainer rate limiting |

---

## 6. TESTING STRATEGY

### Unit Tests
- Test AIUsage daily reset
- Test tier limit application
- Test monthly quota calculation
- Test TrainerMessage creation

### Integration Tests
- Test full chat flow with quota check
- Test quota endpoint returns correct data
- Test multiple messages in succession
- Test tier upgrade mid-month

### Edge Case Tests
- User hits limit exactly
- User tries at 23:59:59
- Daylight saving time transition
- User in different timezone
- Concurrent requests from same user

---

## 7. DEPENDENCIES

- ✅ Phase 1 (Foundation Cleanup) - COMPLETE
- ✅ Tier system cleaned (free/pro/elite/custom)
- ✅ Database migrations working
- ✅ AI chat endpoint functional
- ✅ Authentication system in place
- ✅ User subscription system in place

---

## 8. SUCCESS CRITERIA

- ✅ All tiers have correct quota limits
- ✅ Daily quotas reset at midnight
- ✅ Monthly quotas reset on 1st of month
- ✅ Trainer can see and use trainer messages
- ✅ Rate limiting prevents abuse
- ✅ Dashboard shows remaining quota
- ✅ Widget shows quota warnings
- ✅ All tests pass (>90% code coverage)
- ✅ Build succeeds with no warnings
- ✅ No database migration errors

---

## 9. NEXT PHASE READINESS

After Phase 2 Complete:
- **Phase 3**: Trainer Onboarding & Payouts
- **Phase 4**: Advanced Dashboard Insights
- **Phase 5**: ML Integration with Synthetic Data

---

**Audit Status**: ✅ COMPLETE - Ready for implementation
