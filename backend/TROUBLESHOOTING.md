# Dynamic Page Builder - Troubleshooting Guide

## Issue: "Page Not Configured" Appears on Frontend

### Problem
Homepage shows "This page has no sections configured yet" message

### Root Causes & Solutions

**Cause 1: No sections created in admin**
```bash
# Verify:
1. Go to http://localhost:8000/admin > PageSection
2. Check if any sections exist for page='home'
3. If empty, create at least one section

# Or via API:
curl http://localhost:8000/api/cms/sections/by_page/?page=home
# Should return [] initially, then [{ section objects }] after creation
```

**Cause 2: Migrations not run**
```bash
# Check migration status:
python manage.py showmigrations cms

# Should show [X] before cms migration
# If not marked with [X]:
python manage.py makemigrations cms
python manage.py migrate
```

**Cause 3: is_visible set to False**
```bash
# Check in admin:
1. Go to PageSection list
2. Verify "Is visible" checkbox is checked
3. If not checked, public users won't see it
```

**Cause 4: Page parameter mismatch**
- DynamicLandingPage requests: `page='home'`
- Check admin: section page field should be 'home'
- Other pages use different page values: 'about', 'services'

### Solution Summary
1. Run migrations: `python manage.py migrate`
2. Go to admin and create PageSection with page='home', is_visible=True
3. Refresh homepage
4. Sections should now appear

---

## Issue: Frontend Shows Loading Spinner Forever

### Problem
Homepage stuck in loading state, never displays sections

### Root Causes & Solutions

**Cause 1: Django not running or API unreachable**
```bash
# Check:
1. Terminal 1 (Django) running? See "Starting development server"?
2. Try: curl http://localhost:8000/api/cms/sections/
3. Should get JSON response or error, not connection refused

# Fix:
cd backend
python manage.py runserver
# Wait for "Starting development server at http://127.0.0.1:8000/"
```

**Cause 2: CORS error (cross-origin)**
```javascript
// Browser console (F12):
// Look for: "Access to XMLHttpRequest blocked by CORS policy"

// If seen, Django CORS not configured
// Check backend/core/settings.py:

INSTALLED_APPS = [
    ...
    'corsheaders',  # Should be here
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Should be first
    ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite dev server port
    'http://127.0.0.1:5173',
]
```

**Cause 3: API returning error**
```bash
# Check response:
curl -i http://localhost:8000/api/cms/sections/by_page/?page=home

# If 500: Check Django terminal for error traceback
# If 404: Route not registered - check urls.py
# If empty []: No sections created - create in admin
```

**Cause 4: Frontend error**
```javascript
// Open browser console (F12)
// Check for JavaScript errors
// Common errors:
- TypeError: api.cmsApi is undefined
  → Check src/services/api.js imports
- SyntaxError: import issue
  → Restart: npm run dev
```

### Solution Summary
1. Verify Django running: `curl http://localhost:8000/`
2. Verify API accessible: `curl http://localhost:8000/api/cms/sections/`
3. Check browser console for errors (F12)
4. Check Django terminal for backend errors
5. Restart both servers if needed

---

## Issue: Sections Not Displaying in Correct Order

### Problem
Sections appear on homepage but not in the order you set in admin

### Root Causes & Solutions

**Cause 1: display_order values wrong**
```
AdminPanel: display_order = 10
AdminPanel: display_order = 1
AdminPanel: display_order = 5

Result: Appears as 1, 5, 10 (correct numerical order)
```

✅ Correct setup:
```
Section 1: display_order = 1
Section 2: display_order = 2
Section 3: display_order = 3
```

❌ Wrong setup:
```
Section 1: display_order = 100
Section 2: display_order = 5
Section 3: display_order = 50
Result: 5, 50, 100 (unexpected order)
```

**Cause 2: Backend isn't ordering correctly**
```bash
# Verify in API response:
curl http://localhost:8000/api/cms/sections/by_page/?page=home

# Check JSON response
# sections should be ordered by display_order in response
# If not, likely a database issue
```

**Cause 3: Frontend caching**
```javascript
// Hard refresh the page:
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

// Or clear cache:
// F12 > Network > Disable cache (while DevTools open)
```

### Solution Summary
1. Set display_order to 1, 2, 3, 4... (sequential)
2. Verify API returns ordered list: `curl .../by_page/?page=home`
3. Hard refresh frontend: Ctrl+Shift+R
4. Restart frontend server if needed

---

## Issue: Images Not Loading (Broken Image Icon)

### Problem
Sections show but images display as broken links

### Root Causes & Solutions

**Cause 1: Invalid image_url**
```
Wrong: image_url = "hero.jpg"
Right: image_url = "https://example.com/hero.jpg"
       or = "/media/hero.jpg" (if using Django media)
```

✓ Valid URLs:
- https://example.com/image.jpg
- http://example.com/image.jpg
- /media/uploaded/image.jpg
- data:image/png;base64,... (data URI)

✗ Invalid URLs:
- hero.jpg (relative, no domain)
- ./images/hero.jpg (relative)
- C:\Users\...\image.jpg (local file path)

**Cause 2: URL not accessible**
```bash
# Test if URL is valid:
curl https://example.com/image.jpg
# Should return 200 OK, not 404

# If returns 404, image doesn't exist
# Upload to different host or fix URL
```

**Cause 3: Using local upload but media not configured**
```python
# In settings.py:
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# In urls.py (production):
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Then use: /media/uploads/image.jpg
```

**Cause 4: HTTPS/HTTP mismatch**
```
Frontend: https://yoursite.com
Image URL: http://cdn.example.com/image.jpg (http)

Browser blocks: Mixed content (HTTPS page loading HTTP image)
```

✓ Solution: Use protocol-relative URLs
```
image_url = "//cdn.example.com/image.jpg"
```

### Solution Summary
1. Get full URL: `https://domain.com/path/image.jpg`
2. Test URL in browser - should load image
3. Paste URL in admin image_url field
4. Save section
5. Refresh frontend (Ctrl+Shift+R)

---

## Issue: Section Items Not Appearing

### Problem
Section created in admin but items (cards, pricing tiers) not showing

### Root Causes & Solutions

**Cause 1: No items created**
```
1. Go to admin > PageSection
2. Click a section (e.g., "Features")
3. Scroll to "Section Items" inline editor
4. Should show existing items
5. If empty, click "Add another Section Item" to create
```

**Cause 2: Items not saved**
```
1. Add item details in inline editor
2. Click "Save" (bottom of page)
3. If not saved, item won't appear
4. Verify item appears in list after save
```

**Cause 3: display_order = 0**
```python
# Possible issue: Items with display_order = 0
# Frontend sorts by display_order ascending

# All items at display_order=0 might not render properly
# Fix: Set different values:
Item 1: display_order = 1
Item 2: display_order = 2
```

**Cause 4: Section component doesn't render that type**
```javascript
// Check SectionRenderer.jsx:
// Has handler for section.section_type?

// If section_type = 'custom_html' but SectionRenderer
// doesn't have handler, returns null (nothing renders)
```

### Solution Summary
1. Go to admin and verify items exist in section
2. Check display_order values (use 1, 2, 3...)
3. Verify section_type is supported (check SectionRenderer.jsx)
4. Hard refresh: Ctrl+Shift+R

---

## Issue: Changes in Admin Don't Show on Frontend

### Problem
Updated section in admin but homepage still shows old content

### Root Causes & Solutions

**Cause 1: Frontend caching**
```javascript
// Hard refresh (bypass cache):
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

// Or clear application cache:
F12 > Application > Cache Storage > Delete all
```

**Cause 2: Frontend not refetching**
```javascript
// DynamicLandingPage fetches on mount only
// Currently doesn't auto-refetch after admin updates

// Workaround: Refresh page manually
// Enhancement: Add auto-refresh or polling
```

**Cause 3: Django not reloaded**
```bash
# If using:
python manage.py runserver

# Django auto-reloads on file changes
# But if changed via admin, no restart needed
# Admin changes go directly to database

# Verify saved:
curl http://localhost:8000/api/cms/sections/by_page/?page=home
# Should show updated data
```

**Cause 4: Wrong admin - edited different page**
```
You edited: page='about'
But viewing: page='home'

Frontend requests: page=home
Admin changes: page=about

No overlap = change doesn't appear
```

### Solution Summary
1. Hard refresh: Ctrl+Shift+R
2. Verify admin change saved properly
3. Check API response: `curl .../by_page/?page=home`
4. Verify correct page edited (page='home' for homepage)

---

## Issue: Admin Page Errors When Saving

### Problem
Clicking Save in admin shows error

### Common Error Messages

**"This field is required"**
```
Usually: title field
Solution: Add title for section or item
```

**"Enter a valid URL"**
```
Usually: image_url or cta_url field
Wrong: "hero.jpg"
Right: "https://example.com/hero.jpg"
```

**"Invalid UUID"**
```
Usually: Corrupt data
Solution: Delete problematic section/item and recreate
```

**500 Error**
```bash
# Check Django terminal:
# Should show full traceback
# Copy traceback and debug
# Common: Foreign key not found
  - Section deleted but items still reference it
  - Solution: Delete orphaned items first
```

### Solution Summary
1. Read error message fully
2. Check terminal for detailed trace
3. Fill in missing required fields
4. Use full URLs with domain
5. Delete and recreate if data corrupt

---

## Issue: API Returns 403 Forbidden

### Problem
Trying to create/edit section via API, get 403 error

### Root Cause
Admin writes require authentication and IsAdminUser permission

### Solution
```bash
# Get authentication token:
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "YOUR_PASSWORD"}'

# Returns: {"access": "token_value", "refresh": "..."}

# Use token in header:
curl -X POST http://localhost:8000/api/cms/sections/ \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "page": "home",
    "section_type": "hero",
    "title": "Test",
    "display_order": 1,
    "is_visible": true
  }'

# Or use Django admin instead (easier)
```

---

## Issue: Migrations Failing

### Problem
`python manage.py migrate` shows errors

### Error: "No such table"
```bash
# Database tables don't exist
# Solution: Run migrations
python manage.py migrate
```

### Error: "Column does not exist"
```bash
# Schema mismatch
# Solution:
python manage.py migrate cms zero  # Rollback
python manage.py migrate           # Reapply all
```

### Error: "Pre-existing accounts.CustomUser errors"
```
These are pre-existing and can be ignored
Not caused by dynamic page builder
To proceed despite errors:

python manage.py migrate --run-syncdb
```

### Solution Summary
1. Check status: `python manage.py showmigrations`
2. Run: `python manage.py migrate`
3. If fails, check Django terminal for specific error
4. Clean database and retry if needed

---

## Issue: Frontend Won't Start

### Problem
`npm run dev` fails or shows errors

### Error: "npm: command not found"
```bash
# Node.js not installed
# Install from https://nodejs.org/
# Restart terminal and retry
```

### Error: "Cannot find module"
```bash
# Dependencies not installed
# Solution:
cd frontend
npm install
npm run dev
```

### Error: "EADDRINUSE :::5173"
```bash
# Port 5173 already in use
# Solution: Kill process or use different port
npm run dev -- --port 5174
```

### Error: API calls returning 404 or CORS
```bash
# Make sure Django is running on different terminal
# Check api.js base URL:
const api = axios.create({
  baseURL: 'http://localhost:8000/api',  // ← Verify this
})
```

### Solution Summary
1. Verify Node.js installed: `node --version`
2. Install dependencies: `npm install`
3. Check ports: Different for Django (8000) and React (5173)
4. Both servers must run simultaneously

---

## Quick Checklist

Before declaring "broken", verify:

- [ ] Migrations run: `python manage.py showmigrations cms` (all have [X])
- [ ] Django running: Terminal shows "Starting development server"
- [ ] React running: Terminal shows "Local: http://localhost:5173"
- [ ] Sections created in admin: `http://localhost:8000/admin/cms/pagesection/`
- [ ] Sections visible: `curl http://localhost:8000/api/cms/sections/by_page/?page=home`
- [ ] Frontend fetches: Browser console shows network request to API
- [ ] Section items created: Admin shows items in inline editor
- [ ] Page refreshed: Ctrl+Shift+R (hard refresh)

If all checked but still broken:

1. Check browser console (F12) for errors
2. Check Django terminal for traceback
3. Check Django logs: tail ~/.djangolocal/logs (if exists)
4. Restart both servers
5. Clear all caches and cookies

---

## Getting Help

When reporting issues provide:

1. **What were you doing?**
   - "Tried to create a pricing section"

2. **What did you expect?**
   - "Section saves and appears on homepage"

3. **What happened instead?**
   - "Got 500 error in browser"

4. **Screenshots/Error Messages**
   - Browser console errors (F12)
   - Django terminal traceback
   - HTTP response (from curl or DevTools)

5. **Environment:**
   - OS: Windows/Mac/Linux
   - Python: `python --version`
   - Node: `node --version`
   - Django running: Y/N
   - React running: Y/N
   - Migrations run: Y/N

---

## Support Resources

- IMPLEMENTATION_STATUS.md - Current status
- DYNAMIC_PAGE_BUILDER.md - Comprehensive guide
- QUICK_START.md - Step-by-step setup
- Django admin documentation: https://docs.djangoproject.com/en/stable/ref/contrib/admin/
- DRF documentation: https://www.django-rest-framework.org/
- React debugging: Press F12 in browser
- Django logging: Add print() statements and check runserver output
