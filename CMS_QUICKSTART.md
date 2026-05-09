# ⚡ CMS Quick Setup Guide

**Get your CMS running in 5 minutes!**

---

## 🚀 Setup Steps

### Step 1: Run Migrations (Backend)
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

Expected output:
```
Migrations for 'cms':
  cms/migrations/0001_initial.py
    - Create model WebsiteSettings
    - Create model BlogCategory
    - Create model BlogPost
    ... (more models)

Running migrations:
  Applying cms.0001_initial... OK
```

### Step 2: Create Initial Website Settings (Backend)
```bash
python manage.py shell
```

Then in the Python shell:
```python
from cms.models import WebsiteSettings

settings = WebsiteSettings.objects.create(
    site_name="FitnessPro",
    site_tagline="Transform Your Body, Transform Your Life",
    email="contact@fitnessproof.com",
    phone="+1 (555) 123-4567",
    timezone="UTC",
    currency="USD"
)

print("✅ Website Settings created!")
exit()
```

### Step 3: Start Backend Server
```bash
python manage.py runserver
# Server running at http://localhost:8000
```

### Step 4: Start Frontend Server (new terminal)
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:3000
```

### Step 5: Access Admin Panel
```
http://localhost:8000/admin
Login with admin credentials
Navigate to: CMS section
```

---

## ✅ Verification

### Check Backend Setup
```bash
cd backend
python manage.py dbshell
```
Then SQL:
```sql
SELECT name FROM django_apps WHERE name='cms';
SELECT COUNT(*) FROM cms_websitesettings;
```
Exit: `.quit`

### Check Frontend Pages
- Blog page: `http://localhost:3000/blog`
- Contact page: `http://localhost:3000/contact`
- Blog link in navbar: ✓ Should show

---

## 🎯 First Content Tasks

### Task 1: Create Blog Category
1. Go to: `/admin/cms/blogcategory/`
2. Click "Add Blog Category"
3. Enter:
   - Name: "Fitness Tips"
   - Color: #007BFF (blue)
4. Save

### Task 2: Create First Blog Post
1. Go to: `/admin/cms/blogpost/`
2. Click "Add Blog Post"
3. Enter:
   - Title: "10 Tips for Better Workouts"
   - Category: "Fitness Tips" (from Step 1)
   - Content: Write your blog content
   - Author: "Your Name"
4. Set:
   - Status: Published
   - Publish Date: Today
   - Featured: ✓ Yes
5. Save

### Task 3: Add Social Media Links
1. Go to: `/admin/cms/socialmedialinks/`
2. Add each platform:
   - Platform: Facebook
   - URL: `https://facebook.com/yourpage`
   - Display Order: 0
   - Save
3. Repeat for Twitter, Instagram, etc.

### Task 4: Create About Page
1. Go to: `/admin/cms/dynamicpage/`
2. Click "Add Dynamic Page"
3. Enter:
   - Title: "About Us"
   - Content: Your about page content
   - Check: ✓ Show in footer
4. Save
5. Access at: `/about`

### Task 5: Test Contact Form
1. Go to: `http://localhost:3000/contact`
2. Fill and submit form
3. Go to: `/admin/cms/contactmessage/`
4. Should see your submission
5. Mark as "Read" if perfect

---

## 📊 Admin Dashboard Layout

```
CMS
├── Website Settings     → Manage site branding & contact
├── Blog Categories     → Create categories
├── Blog Posts          → Create blog content
├── Blog Tags           → (optional, via posts)
├── Contact Messages    → View form submissions
├── Dynamic Pages       → Create custom pages
├── Social Media Links  → Add social profiles
└── Newsletter Subscriptions → Manage subscribers
```

---

## 🔗 Quick API Tests

### Test: Get Website Settings
```bash
curl http://localhost:8000/api/cms/settings/
```

### Test: Get Blog Posts
```bash
curl http://localhost:8000/api/cms/blog/posts/
```

### Test: Search Blog
```bash
curl "http://localhost:8000/api/cms/blog/posts/search/?q=fitness"
```

### Test: Get Featured Posts
```bash
curl http://localhost:8000/api/cms/blog/posts/featured/
```

### Test: Submit Contact Form
```bash
curl -X POST http://localhost:8000/api/cms/contact/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Test",
    "message": "Hello!"
  }'
```

---

## 🎨 Frontend Navigation

After setup, you should see:

### Navbar
```
FitnessPro | Plans | Blog | Contact | [Dashboard/Login]
```

### Footer
```
Product: Plans & Pricing, Blog, About Us
Support: Contact Us, Help Center, FAQ
Social: [Facebook, Twitter, Instagram, LinkedIn]
```

---

## ❌ Troubleshooting

### Issue: "cms app not found"
**Solution**: Ensure `'cms'` is in `INSTALLED_APPS` in settings.py

### Issue: Migration errors
**Solution**: 
```bash
python manage.py migrate --fake-initial
python manage.py migrate
```

### Issue: Blog page shows no posts
**Possible Causes**:
- Posts not created yet → Create one in admin
- Posts set to Draft → Publish them
- Posts don't have publish date → Set it

### Issue: Contact form not working
**Check**:
- API endpoint at `/api/cms/contact/` working
- Form validation passing
- Check browser console for errors

### Issue: Admin panel not accessible
**Solution**:
- Make sure admin user exists
- Run: `python manage.py createsuperuser` if needed
- Navigate to `/admin` (note the trailing slash)

---

## 📱 Testing Checklist

- [ ] Admin panel accessible at `/admin`
- [ ] Blog page loads at `/blog`
- [ ] Contact page loads at `/contact`
- [ ] Blog search works
- [ ] Contact form submits
- [ ] Navbar shows Blog & Contact links
- [ ] Footer shows proper links
- [ ] Blog detail page works
- [ ] Admin can create blog posts
- [ ] Admin can view contact messages

---

## 🚢 Deployment Checklist

Before going to production:

1. [ ] Run migrations on production database
2. [ ] Create WebsiteSettings in production admin
3. [ ] Create at least one blog post
4. [ ] Test contact form
5. [ ] Verify API endpoints working
6. [ ] Check frontend pages loading
7. [ ] Test admin panel access
8. [ ] Update social media links
9. [ ] Create About/Terms pages (if needed)
10. [ ] Monitor for errors

---

## 💾 Database Backup

Before major changes, backup your database:

```bash
# SQLite backup
cp db.sqlite3 db.sqlite3.backup

# PostgreSQL backup
pg_dump dbname > backup.sql

# Restore
sqlite3 db.sqlite3 < backup.sql
```

---

## 📈 Next Steps After Initial Setup

1. **Create Content**
   - Blog posts: 5-10 initial posts
   - Categories: Organize your content
   - Pages: About, Terms, Privacy

2. **Customize**
   - Update website settings
   - Add social media links
   - Upload logo/images

3. **Optimize**
   - Add SEO metadata
   - Create featured posts
   - Organize with tags

4. **Engage**
   - Share blog posts
   - Respond to contacts
   - Monitor newsletter

5. **Scale**
   - Plan content calendar
   - Add more categories
   - Build content library

---

## 🎊 You're All Set!

After these steps, your CMS is:
- ✅ Installed
- ✅ Configured
- ✅ Ready for content
- ✅ Accessible to non-technical admins

Start creating content! 🚀

---

## 📞 Common Admin URLs

```
Admin Home              /admin/
Website Settings        /admin/cms/websitesettings/
Blog Posts              /admin/cms/blogpost/
Blog Categories         /admin/cms/blogcategory/
Contact Messages        /admin/cms/contactmessage/
Dynamic Pages           /admin/cms/dynamicpage/
Social Media Links      /admin/cms/socialmedialinks/
Newsletter              /admin/cms/newslettersubscription/
```

---

## 🎯 Frontend URLs

```
Landing Page            /
Login                   /login
Register                /register
Blog Listing            /blog
Blog Detail             /blog/{slug}
Contact Form            /contact
Subscriptions           /subscriptions
Dashboard               /dashboard (protected)
Workouts                /workouts (protected)
Meals                   /meal-plans (protected)
Profile                 /profile (protected)
```

---

**Happy Content Creating! 🎉**

For detailed documentation, see: `CMS_GUIDE.md`
