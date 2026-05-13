# PHASE 1: Foundation Cleanup - Audit Findings
## Date: May 13, 2026

### Executive Summary
Found 5 critical references to "flex" tier that need to be removed/updated. All are real (not false positives like "flexible").

---

## Backend References (3 files)

### 1. **backend/subscriptions/migrations/0003_alter_subscriptiontier_name.py** (Critical)
**Location**: Line 16  
**What**: Migration file that defines tier choices  
**Action**: MANUAL EDIT - Update choices tuple to remove flex

**Current**:
```python
field=models.CharField(choices=[('free', 'Free'), ('flex', 'Flex'), ('pro', 'Pro'), ('elite', 'Elite'), ('custom', 'Custom')], ...
```

---

### 2. **backend/core/views.py** (Critical)
**Location**: Line 432  
**What**: Tier check in AICoachViewSet  
**Current Code**:
```python
if tier in ['flex', 'starter']:
```

**Action**: REMOVE 'flex' from list

---

### 3. **backend/core/views.py** (Critical)
**Location**: Line 990  
**What**: Tier check for free/basic/flex  
**Current Code**:
```python
if tier in ['free', 'basic', 'flex']:
```

**Action**: REMOVE 'flex' from list

---

## Frontend References (2 files)

### 4. **frontend/src/pages/SubscriptionsPage.jsx** (Critical)
**Location**: Line 51-52  
**What**: Filter to hide flex/custom tiers from display  
**Current**:
```jsx
const visibleTiers = tiers.filter(tier => !['flex', 'custom'].includes(tier.name.toLowerCase()))
const currentTierIndex = visibleTiers.findIndex(t => t.name.toLowerCase() === (currentTierName === 'flex' ? 'free' : currentTierName))
```

**Action**: UPDATE - Remove 'flex' from filter

---

### 5. **frontend/src/components/AICoach.jsx** (Critical)
**Location**: Multiple lines (45, 74, 98, 216)

**Line 45**:
```jsx
flex: GENERAL_TIER,
```
**Action**: DELETE this line

**Line 74**:
```jsx
const normalizedTier = tier === 'basic' ? 'flex' : tier
```
**Action**: REMOVE - no longer needed

**Line 98**:
```jsx
text: normalizedTier === 'flex'
```
**Action**: UPDATE - change to pro or basic

**Line 216**:
```jsx
Get general fitness tips with <strong className="text-white">Flex</strong>, personalised coaching with <strong className="text-white">Pro</strong>, and full coaching with <strong className="text-white">Elite</strong>.
```
**Action**: UPDATE - remove Flex reference

---

## Summary of Changes

| File | Changes | Priority |
|------|---------|----------|
| subscriptions/models.py | Remove flex from TIER_CHOICES | HIGH |
| migrations/0003 | Update choices | HIGH |
| core/views.py | Remove 2 flex checks | HIGH |
| SubscriptionsPage.jsx | Update filter logic | HIGH |
| AICoach.jsx | Remove flex references (4 changes) | HIGH |

**Total Changes**: 8 critical edits

---

## Next Steps

✅ Audit complete  
⏳ Ready to execute cleanups (Steps 1.2-1.9)
