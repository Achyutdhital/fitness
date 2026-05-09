from django.db import models
from django.utils.text import slugify
from django.core.validators import URLValidator, EmailValidator
import uuid


class WebsiteSettings(models.Model):
    """Global website settings and branding"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Info
    site_name = models.CharField(max_length=200, default="FitnessPro")
    site_tagline = models.CharField(max_length=300, blank=True, default="Transform Your Body, Transform Your Life")
    site_description = models.TextField(blank=True, default="Your complete fitness subscription platform")
    
    # Contact Info
    email = models.EmailField(default="contact@fitnessproof.com")
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=500, blank=True)
    
    # Media
    logo_url = models.URLField(blank=True, help_text="URL to logo image")
    favicon_url = models.URLField(blank=True, help_text="URL to favicon")
    hero_image_url = models.URLField(blank=True, help_text="URL to hero/banner image")
    
    # Social Media
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    
    # SEO
    meta_keywords = models.CharField(max_length=500, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    
    # Settings
    timezone = models.CharField(max_length=50, default="UTC")
    currency = models.CharField(max_length=10, default="USD")
    language = models.CharField(max_length=10, default="en")
    
    # Misc
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Website Settings"
        verbose_name_plural = "Website Settings"
    
    def __str__(self):
        return f"{self.site_name} Settings"
    
    def save(self, *args, **kwargs):
        # Ensure only one WebsiteSettings instance exists
        if WebsiteSettings.objects.filter(~models.Q(id=self.id)).exists():
            raise ValueError("Only one WebsiteSettings instance is allowed")
        super().save(*args, **kwargs)


class BlogCategory(models.Model):
    """Blog post categories"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#007BFF", help_text="Hex color code")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Blog Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    """Blog posts/articles"""
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Content
    content = models.TextField(help_text="Rich text content for the blog post")
    excerpt = models.CharField(max_length=500, blank=True, help_text="Short summary shown in lists")
    featured_image_url = models.URLField(blank=True, help_text="URL to featured image")
    
    # Author and dates
    author = models.CharField(max_length=100, default="Admin")
    published_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Meta
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    featured = models.BooleanField(default=False, help_text="Show on homepage")
    views_count = models.IntegerField(default=0)
    
    # SEO
    meta_keywords = models.CharField(max_length=500, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    
    # Tags
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    
    class Meta:
        ordering = ['-published_date', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', 'published_date']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.excerpt and self.content:
            self.excerpt = self.content[:200] + "..."
        super().save(*args, **kwargs)
    
    @property
    def is_published(self):
        from django.utils import timezone
        return self.status == 'published' and self.published_date <= timezone.now()


class ContactMessage(models.Model):
    """Contact form submissions"""
    STATUS_CHOICES = (
        ('new', 'New'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('spam', 'Spam'),
        ('archived', 'Archived'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=300)
    message = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    admin_notes = models.TextField(blank=True, help_text="Internal notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.name}"


class DynamicPage(models.Model):
    """Dynamic pages (About, Terms, Privacy, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    
    is_visible = models.BooleanField(default=True)
    show_in_footer = models.BooleanField(default=False)
    show_in_menu = models.BooleanField(default=False)
    
    meta_description = models.CharField(max_length=500, blank=True)
    meta_keywords = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['title']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class SocialMediaLinks(models.Model):
    """Extended social media and platform links"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    platform = models.CharField(
        max_length=50,
        choices=[
            ('facebook', 'Facebook'),
            ('twitter', 'Twitter/X'),
            ('instagram', 'Instagram'),
            ('linkedin', 'LinkedIn'),
            ('youtube', 'YouTube'),
            ('tiktok', 'TikTok'),
            ('telegram', 'Telegram'),
            ('discord', 'Discord'),
            ('github', 'GitHub'),
            ('website', 'Website'),
        ]
    )
    url = models.URLField()
    icon_class = models.CharField(max_length=50, blank=True, help_text="Font Awesome class")
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['display_order']
        unique_together = ['platform']
    
    def __str__(self):
        return f"{self.get_platform_display()} - {self.url}"


class NewsletterSubscription(models.Model):
    """Newsletter subscribers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-subscribed_at']
    
    def __str__(self):
        return self.email


class PageSection(models.Model):
    """Dynamic page sections (Hero, Features, Pricing, Testimonials, etc.)"""
    SECTION_TYPES = (
        ('hero', 'Hero Section'),
        ('features', 'Features Grid'),
        ('pricing', 'Pricing Table'),
        ('testimonials', 'Testimonials'),
        ('cta', 'Call to Action'),
        ('text', 'Text Block'),
        ('gallery', 'Image Gallery'),
        ('team', 'Team Members'),
        ('faq', 'FAQ Section'),
        ('banner', 'Banner'),
        ('custom', 'Custom HTML'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.CharField(max_length=50, choices=[
        ('home', 'Homepage'),
        ('about', 'About Page'),
        ('services', 'Services Page'),
        ('other', 'Other'),
    ], default='home')
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES)
    title = models.CharField(max_length=300, blank=True)
    subtitle = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    
    # Layout
    background_color = models.CharField(max_length=7, default='#FFFFFF', help_text="Hex color")
    text_color = models.CharField(max_length=7, default='#000000', help_text="Hex color")
    columns = models.IntegerField(default=3, help_text="Grid columns")
    
    # Display
    is_visible = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0, help_text="Lower = appears first")
    
    # CTA
    cta_text = models.CharField(max_length=100, blank=True, help_text="Button text")
    cta_url = models.URLField(blank=True)
    cta_style = models.CharField(max_length=20, choices=[
        ('primary', 'Primary Button'),
        ('secondary', 'Secondary Button'),
        ('outline', 'Outline Button'),
    ], default='primary')
    
    # Custom content
    custom_html = models.TextField(blank=True)
    custom_css = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['page', 'display_order']
        indexes = [
            models.Index(fields=['page', 'is_visible', 'display_order']),
        ]
    
    def __str__(self):
        return f"{self.get_page_display()} - {self.get_section_type_display()}"


class SectionItem(models.Model):
    """Items within sections (feature cards, pricing tiers, testimonials, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(PageSection, on_delete=models.CASCADE, related_name='items')
    
    # Content
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True, help_text="Emoji or icon code")
    image_url = models.URLField(blank=True)
    
    # Pricing specific
    price = models.CharField(max_length=50, blank=True, help_text="e.g., $9.99 or Free")
    price_period = models.CharField(max_length=50, blank=True, help_text="e.g., /month or /year")
    
    # Features list (JSON-like, comma-separated or newline-separated)
    features = models.TextField(blank=True, help_text="One feature per line")
    
    # Display
    display_order = models.IntegerField(default=0)
    is_highlighted = models.BooleanField(default=False, help_text="Highlight/feature this item")
    
    # CTA
    button_text = models.CharField(max_length=100, blank=True)
    button_url = models.URLField(blank=True)
    
    # Additional data (JSON flexible storage)
    metadata = models.TextField(blank=True, help_text="Additional JSON data")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['section', 'display_order']
        indexes = [
            models.Index(fields=['section', 'display_order']),
        ]
    
    def __str__(self):
        return f"{self.section.get_section_type_display()} - {self.title}"


class ImageAsset(models.Model):
    """Central image/asset management"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='cms_assets/', null=True, blank=True)
    image_url = models.URLField(blank=True)
    alt_text = models.CharField(max_length=300, blank=True)
    
    # Categorization
    category = models.CharField(max_length=50, blank=True, choices=[
        ('hero', 'Hero Images'),
        ('icon', 'Icons'),
        ('team', 'Team Photos'),
        ('testimonial', 'Testimonials'),
        ('gallery', 'Gallery'),
        ('logo', 'Logos'),
        ('banner', 'Banners'),
        ('other', 'Other'),
    ])
    
    # Metadata
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    file_size = models.IntegerField(null=True, blank=True, help_text="Size in bytes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', '-created_at']
    
    def __str__(self):
        return self.name
