# Dynamic Page Builder Implementation Guide

## Overview

The fitness platform now includes a complete **dynamic page builder system** that allows you to manage every section, image, and content element through the Django admin panel. No hardcoding required!

## Quick Start

### 1. Run Database Migrations

First, create the new database tables:

```bash
python manage.py makemigrations cms
python manage.py migrate
```

### 2. Access the Admin Panel

1. Go to `http://localhost:8000/admin`
2. Log in with your superuser credentials
3. You'll see three new sections:
   - **Page Sections** - Manage page layouts and sections
   - **Section Items** - Manage cards, pricing tiers, testimonials within sections
   - **Image Assets** - Manage and upload images centrally

### 3. Create Your First Section

1. Click **Page Sections** > **Add Page Section**
2. Fill in the form:
   - **Page**: Select "home" (or "about", "services", "other")
   - **Section Type**: Choose from 11 types (hero, features, pricing, etc.)
   - **Title**: "Why Choose FitnessPro?"
   - **Description**: "Custom subtitle or description"
   - **Display Order**: 1 (controls position)
   - **Is Visible**: ✓ (makes it show on frontend)
3. Click **Save**

### 4. Add Items to Your Section

1. In the Section Items inline editor (below the main form):
   - Click **Add another Section Item**
   - Add feature cards, pricing tiers, etc.
2. Each item can have:
   - Title, Description
   - Icon (emoji) or Image URL
   - Price and button text (for pricing sections)
   - Features list (one per line)

### 5. View on Frontend

The homepage automatically displays all sections in order:
- Navigate to `http://localhost:8000/`
- Sections appear from top to bottom based on **Display Order**

## Architecture

### Component Structure

```
DynamicLandingPage
    └── SectionRenderer
        ├── HeroSection
        ├── FeaturesSection
        ├── PricingSection
        ├── TestimonialsSection
        ├── CTASection
        └── ... (11 total section types)
```

### Data Flow

```
Admin Panel → Django API → Frontend Components → User Sees
  ↓
Create/Edit Section
  ↓
POST /api/cms/sections/
  ↓
DynamicLandingPage fetches GET /api/cms/sections/?page=home
  ↓
SectionRenderer renders each section dynamically
  ↓
Browser displays fully customized homepage
```

## API Endpoints

### Page Sections

```
GET    /api/cms/sections/                    - List all sections
GET    /api/cms/sections/by_page/?page=home  - Get sections for specific page
POST   /api/cms/sections/                    - Create section (admin only)
PUT    /api/cms/sections/{id}/               - Update section (admin only)
DELETE /api/cms/sections/{id}/               - Delete section (admin only)
```

### Section Items

```
GET    /api/cms/section-items/                    - List all items
GET    /api/cms/section-items/?section={id}       - Get items for specific section
POST   /api/cms/section-items/                    - Create item (admin only)
PUT    /api/cms/section-items/{id}/               - Update item (admin only)
DELETE /api/cms/section-items/{id}/               - Delete item (admin only)
```

### Image Assets

```
GET    /api/cms/assets/                      - List all images
GET    /api/cms/assets/by_category/?category=hero  - Get images by category
POST   /api/cms/assets/                      - Upload image (admin only)
PUT    /api/cms/assets/{id}/                 - Update image (admin only)
DELETE /api/cms/assets/{id}/                 - Delete image (admin only)
```

## Section Types Guide

### 1. Hero Section
**Best for:** Homepage header, landing pages  
**Required Fields:** title, description  
**Optional Fields:** image_url, cta_text, cta_url, background_color, text_color  
**Example:**
- Title: "Transform Your Body, Transform Your Life"
- Description: "Join thousands of fitness enthusiasts..."
- Image URL: "/media/hero-bg.jpg"
- CTA Text: "Start Free Trial"
- CTA URL: "/register"

### 2. Features Section
**Best for:** Service highlights, main features  
**Required Fields:** title  
**Items Can Have:** title, description, icon (emoji), image_url  
**Columns:** 2, 3, or 4 (configurable)  
**Example:**
- Section Title: "Why Choose FitnessPro?"
- Item 1: 🏋️ "Expert Workouts"
- Item 2: 🥗 "Meal Plans"
- Item 3: 📊 "Progress Tracking"

### 3. Pricing Section
**Best for:** Subscription plans/pricing tiers  
**Items Can Have:**
- title, description
- price, price_period (e.g., "/month")
- button_text, button_url
- features (multiline: "Feature 1\nFeature 2")
- is_highlighted (for "Popular" badge)
**Example:**
- Item 1: Basic - $9.99/month
- Item 2: Pro - $19.99/month (highlighted as "Most Popular")
- Item 3: Elite - $29.99/month

### 4. Testimonials Section
**Best for:** Customer reviews, success stories  
**Items Can Have:** title (name), description (quote), image_url (photo), metadata.role  
**Example:**
- "John Doe" - "This app changed my life! 5 stars!" - role: "CEO, TechCorp"

### 5. CTA (Call to Action) Section
**Best for:** Promotional banners, sign-up prompts  
**Required Fields:** title, cta_text, cta_url  
**Optional Fields:** description, background_color  
**Example:**
- Title: "Ready to Transform?"
- Description: "Get started today and see results in 30 days"
- CTA: "Start Free Trial" → "/register"

### 6. Text Section
**Best for:** About us, mission statements, detailed content  
**Required Fields:** title, description  
**Supports:** Long-form text content

### 7. Gallery Section
**Best for:** Photo galleries, portfolio showcase  
**Items:** Each item = image_url  
**Note:** Display as image grid, no text required

### 8. Team Section
**Best for:** Team member profiles  
**Items Can Have:** title (name), description (bio), image_url (photo), metadata.role

### 9. FAQ Section
**Best for:** Frequently asked questions  
**Items Can Have:** title (question), description (answer)  
**Renders as:** Collapsible accordion

### 10. Banner Section
**Best for:** Simple promotional banners  
**Required Fields:** title, cta_text, cta_url  
**Features:** Horizontal layout with image and CTA button

### 11. Custom HTML Section
**Best for:** Advanced layouts, flexibility  
**Required Fields:** custom_html, custom_css (optional)  
**Warning:** Requires developer knowledge, use with caution

## Admin Features

### Bulk Actions

In the Page Sections list view:
- **Toggle Visibility** - Show/hide sections without deleting
- **Move Up** - Reorder (increase priority)
- **Move Down** - Reorder (decrease priority)

### Inline Editing

- Edit Section Items directly within the Section form
- Quick add/remove cards, pricing tiers, testimonials
- No need to navigate away from the section

### Display Order

Controls the sequence on the frontend:
- Lower numbers = higher on page
- Reorder via admin actions or edit individual sections

### Visibility Toggle

- **is_visible = True** → Section shows on frontend
- **is_visible = False** → Section hidden (schedule, testing)
- No data deletion, just toggle

## Common Tasks

### Change Homepage Title

1. Go to Admin > Page Sections
2. Find the Hero section (first item, section_type="hero")
3. Edit: change "title" field
4. Click Save
5. Refresh homepage - new title appears instantly

### Add a New Feature

1. Go to Admin > Page Sections
2. Find the Features section
3. Scroll to "Section Items" inline editor
4. Click "Add another Section Item"
5. Fill in: title, description, icon/image_url
6. Click Save
7. Feature appears on homepage

### Change Pricing

1. Go to Admin > Page Sections
2. Find the Pricing section
3. Click on a pricing tier in Section Items
4. Edit: price, features, button_url
5. Click Save
6. Pricing updates on frontend

### Hide a Section Temporarily

1. Go to Admin > Page Sections
2. Find the section
3. Uncheck "Is visible"
4. Click Save
5. Section disappears from frontend (data preserved)

### Reorder Sections

1. Go to Admin > Page Sections
2. Select sections to reorder
3. Choose "Move up" or "Move down" action
4. Sections reorder on frontend

### Upload Images

1. Go to Admin > Image Assets
2. Click Add Image Asset
3. Upload file, add name and category
4. Copy the image_url from the list
5. Use URL in Section Item image_url field

## Frontend Components

### DynamicLandingPage.jsx

Fetches sections from `/api/cms/sections/?page=home` and renders them.

```javascript
// Features:
- Automatic data fetching
- Loading state while fetching
- Error handling with retry
- Empty state if no sections
```

### SectionRenderer.jsx

Intelligently renders each section type:

```javascript
// Has handlers for all 11 section types
// Supports:
- Custom colors (background_color, text_color)
- Layout customization (columns)
- Responsive design (mobile, tablet, desktop)
- Dynamic CTA buttons
- Image handling
```

## Troubleshooting

### Sections Not Showing

**Problem:** Migrated the database but homepage shows nothing  
**Solution:**
1. Check Admin > Page Sections - any sections created?
2. If not, create a hero section with "page=home"
3. Ensure "is_visible" is checked
4. Set "display_order" to 1

### Images Not Loading

**Problem:** Section items show broken image icons  
**Solution:**
1. Check image_url field - is it valid?
2. Images must be absolute URLs or uploaded via Image Assets
3. Upload to Image Assets and copy the URL

### API Returns Empty

**Problem:** `/api/cms/sections/?page=home` returns `[]`  
**Solution:**
1. Create sections in admin with page="home"
2. Verify is_visible=True
3. Check API directly: `curl http://localhost:8000/api/cms/sections/?page=home`

### Django Admin Not Showing Models

**Problem:** PageSection, SectionItem, ImageAsset not in admin  
**Solution:**
1. Check migrations ran: `python manage.py showmigrations cms`
2. All should be marked [X]
3. Restart Django server: `python manage.py runserver`

## Advanced Features

### Custom Colors Per Section

```
Page Section fields:
- background_color: Hex value (e.g., "#ffffff")
- text_color: Hex value (e.g., "#333333")

These override default styles per section
```

### Custom Layout

```
For Features section:
- columns: 2, 3, or 4
- Controls grid layout

For Pricing:
- columns field controls how many per row
```

### Custom HTML/CSS

For developers needing custom layouts:
1. Create section with section_type="custom_html"
2. Add raw HTML in custom_html field
3. Add CSS in custom_css field
4. Renders as-is without being sanitized

**Warning:** This bypasses normal security. Only use with trusted content.

### Metadata Field

SectionItem has a flexible metadata field (JSON):

```json
{
  "role": "Fitness Coach",
  "certified": true,
  "years_experience": 10
}
```

Frontend can access: `item.metadata?.role`

## Next Steps

1. **Run migrations:** `python manage.py makemigrations && python manage.py migrate`
2. **Create homepage sections** in Django admin
3. **View homepage** at `http://localhost:8000/`
4. **Add more pages** by using page="about" or page="services"
5. **Customize everything** without touching code

## Support

For issues or questions:
- Check the data in Django admin
- Verify migrations completed
- Check browser console for JavaScript errors
- Test API endpoints directly with curl or Postman

---

**Remember:** Everything is now data-driven. No more hardcoding!
