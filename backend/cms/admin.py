from django.contrib import admin
from django.utils.html import format_html
from .models import (
    WebsiteSettings, BlogPost, BlogCategory, ContactMessage,
    DynamicPage, SocialMediaLinks, NewsletterSubscription,
    PageSection, SectionItem, ImageAsset
)


@admin.register(WebsiteSettings)
class WebsiteSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Basic Information', {
            'fields': ('site_name', 'site_tagline', 'site_description')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'address')
        }),
        ('Media & Branding', {
            'fields': ('logo_url', 'favicon_url', 'hero_image_url')
        }),
        ('Social Media', {
            'fields': (
                'facebook_url', 'twitter_url', 'instagram_url',
                'linkedin_url', 'youtube_url'
            )
        }),
        ('SEO', {
            'fields': ('meta_keywords', 'meta_description')
        }),
        ('Settings', {
            'fields': ('timezone', 'currency', 'language')
        }),
        ('Maintenance', {
            'fields': ('maintenance_mode', 'maintenance_message'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('updated_at',)
    
    def has_delete_permission(self, request):
        return False
    
    def has_add_permission(self, request):
        return not WebsiteSettings.objects.exists()


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'color_preview', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    def color_preview(self, obj):
        return format_html(
            '<div style="width:30px; height:30px; background-color:{}; border-radius:3px;"></div>',
            obj.color
        )
    color_preview.short_description = 'Color'


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'category', 'author', 'featured', 'published_date', 'views_count')
    list_filter = ('status', 'featured', 'category', 'created_at', 'published_date')
    search_fields = ('title', 'content', 'tags', 'excerpt')
    readonly_fields = ('slug', 'views_count', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}
    
    fieldsets = (
        ('Post Information', {
            'fields': ('title', 'slug', 'category', 'status')
        }),
        ('Content', {
            'fields': ('content', 'excerpt', 'featured_image_url')
        }),
        ('Publishing', {
            'fields': ('published_date', 'featured', 'author')
        }),
        ('SEO & Tags', {
            'fields': ('meta_keywords', 'meta_description', 'tags')
        }),
        ('Stats', {
            'fields': ('views_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['publish_posts', 'unpublish_posts', 'mark_featured', 'unmark_featured']
    
    def publish_posts(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='published', published_date=timezone.now())
        self.message_user(request, "Posts published successfully")
    publish_posts.short_description = "Publish selected posts"
    
    def unpublish_posts(self, request, queryset):
        queryset.update(status='draft')
        self.message_user(request, "Posts unpublished")
    unpublish_posts.short_description = "Unpublish selected posts"
    
    def mark_featured(self, request, queryset):
        queryset.update(featured=True)
        self.message_user(request, "Posts marked as featured")
    mark_featured.short_description = "Mark as featured"
    
    def unmark_featured(self, request, queryset):
        queryset.update(featured=False)
        self.message_user(request, "Posts unmarked as featured")
    unmark_featured.short_description = "Unmark as featured"


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'name', 'email', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'name', 'email', 'message')
    readonly_fields = ('created_at', 'updated_at', 'email', 'name', 'subject', 'message')
    
    fieldsets = (
        ('Message', {
            'fields': ('subject', 'message')
        }),
        ('Sender Information', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Management', {
            'fields': ('status', 'admin_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_replied', 'mark_as_spam']
    
    def mark_as_read(self, request, queryset):
        queryset.update(status='read')
        self.message_user(request, "Messages marked as read")
    mark_as_read.short_description = "Mark as read"
    
    def mark_as_replied(self, request, queryset):
        queryset.update(status='replied')
        self.message_user(request, "Messages marked as replied")
    mark_as_replied.short_description = "Mark as replied"
    
    def mark_as_spam(self, request, queryset):
        queryset.update(status='spam')
        self.message_user(request, "Messages marked as spam")
    mark_as_spam.short_description = "Mark as spam"


@admin.register(DynamicPage)
class DynamicPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_visible', 'show_in_menu', 'show_in_footer')
    list_filter = ('is_visible', 'show_in_menu', 'show_in_footer', 'created_at')
    search_fields = ('title', 'content')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}
    
    fieldsets = (
        ('Page Information', {
            'fields': ('title', 'slug', 'content')
        }),
        ('Visibility & Navigation', {
            'fields': ('is_visible', 'show_in_menu', 'show_in_footer')
        }),
        ('SEO', {
            'fields': ('meta_description', 'meta_keywords')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SocialMediaLinks)
class SocialMediaLinksAdmin(admin.ModelAdmin):
    list_display = ('platform', 'url_preview', 'display_order')
    list_filter = ('platform', 'created_at')
    ordering = ('display_order',)
    
    def url_preview(self, obj):
        return format_html(
            '<a href="{}" target="_blank">{}</a>',
            obj.url,
            obj.url[:50] + '...' if len(obj.url) > 50 else obj.url
        )
    url_preview.short_description = 'URL'


@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'is_active', 'subscribed_at')
    list_filter = ('is_active', 'subscribed_at')
    search_fields = ('email', 'name')
    readonly_fields = ('subscribed_at', 'unsubscribed_at')
    
    actions = ['activate_subscriptions', 'deactivate_subscriptions']
    
    def activate_subscriptions(self, request, queryset):
        queryset.update(is_active=True, unsubscribed_at=None)
        self.message_user(request, "Subscriptions activated")
    activate_subscriptions.short_description = "Activate subscriptions"
    
    def deactivate_subscriptions(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_active=False, unsubscribed_at=timezone.now())
        self.message_user(request, "Subscriptions deactivated")
    deactivate_subscriptions.short_description = "Deactivate subscriptions"


class SectionItemInline(admin.TabularInline):
    """Inline admin for section items"""
    model = SectionItem
    extra = 1
    fields = ['title', 'icon', 'display_order', 'is_highlighted', 'price', 'button_text']
    ordering = ['display_order']


@admin.register(PageSection)
class PageSectionAdmin(admin.ModelAdmin):
    list_display = ('section_type', 'page', 'title', 'is_visible', 'display_order')
    list_filter = ('page', 'section_type', 'is_visible', 'created_at')
    search_fields = ('title', 'subtitle', 'description')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ['page', 'display_order']
    inlines = [SectionItemInline]
    
    fieldsets = (
        ('Section Information', {
            'fields': ('page', 'section_type', 'title', 'subtitle', 'description')
        }),
        ('Media', {
            'fields': ('image_url',)
        }),
        ('Layout', {
            'fields': ('background_color', 'text_color', 'columns')
        }),
        ('Display', {
            'fields': ('is_visible', 'display_order')
        }),
        ('Call to Action', {
            'fields': ('cta_text', 'cta_url', 'cta_style'),
            'classes': ('collapse',)
        }),
        ('Custom Code', {
            'fields': ('custom_html', 'custom_css'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['toggle_visibility', 'move_up', 'move_down']
    
    def toggle_visibility(self, request, queryset):
        for section in queryset:
            section.is_visible = not section.is_visible
            section.save()
        self.message_user(request, f"Visibility toggled for {queryset.count()} sections")
    toggle_visibility.short_description = "Toggle visibility"
    
    def move_up(self, request, queryset):
        for section in queryset.order_by('display_order'):
            if section.display_order > 0:
                section.display_order -= 1
                section.save()
        self.message_user(request, "Sections moved up")
    move_up.short_description = "Move up"
    
    def move_down(self, request, queryset):
        for section in queryset.order_by('-display_order'):
            section.display_order += 1
            section.save()
        self.message_user(request, "Sections moved down")
    move_down.short_description = "Move down"


@admin.register(SectionItem)
class SectionItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'display_order', 'is_highlighted', 'price')
    list_filter = ('section__section_type', 'is_highlighted', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ['section', 'display_order']
    
    fieldsets = (
        ('Item Information', {
            'fields': ('section', 'title', 'description', 'icon')
        }),
        ('Media & Pricing', {
            'fields': ('image_url', 'price', 'price_period')
        }),
        ('Features & CTA', {
            'fields': ('features', 'button_text', 'button_url')
        }),
        ('Display', {
            'fields': ('display_order', 'is_highlighted')
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ImageAsset)
class ImageAssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'image_preview', 'file_size', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('name', 'description', 'alt_text')
    readonly_fields = ('created_at', 'updated_at', 'image_preview', 'width', 'height', 'file_size')
    
    fieldsets = (
        ('Asset Information', {
            'fields': ('name', 'description', 'category')
        }),
        ('Image', {
            'fields': ('image', 'image_url', 'image_preview', 'alt_text')
        }),
        ('Metadata', {
            'fields': ('width', 'height', 'file_size'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        image_url = obj.image.url if obj.image else obj.image_url
        if image_url:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px; border-radius: 5px;" />',
                image_url
            )
        return "No image"
    image_preview.short_description = "Preview"
