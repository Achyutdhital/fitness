from rest_framework import serializers
from .models import (
    WebsiteSettings, BlogPost, BlogCategory, ContactMessage,
    DynamicPage, SocialMediaLinks, NewsletterSubscription,
    PageSection, SectionItem, ImageAsset
)


class WebsiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer for website settings - read-only for public"""
    class Meta:
        model = WebsiteSettings
        fields = [
            'site_name', 'site_tagline', 'site_description', 'email',
            'phone', 'address', 'logo_url', 'favicon_url', 'hero_image_url',
            'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url',
            'youtube_url', 'meta_keywords', 'meta_description', 'currency',
            'language', 'timezone'
        ]


class BlogCategorySerializer(serializers.ModelSerializer):
    """Serializer for blog categories"""
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'color', 'created_at']


class BlogPostListSerializer(serializers.ModelSerializer):
    """Serializer for blog post list view"""
    category = BlogCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(),
        write_only=True,
        required=False,
        source='category'
    )
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image_url',
            'author', 'published_date', 'created_at', 'status', 'featured',
            'views_count', 'category', 'category_id', 'tags'
        ]


class BlogPostDetailSerializer(serializers.ModelSerializer):
    """Serializer for blog post detail view"""
    category = BlogCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(),
        write_only=True,
        required=False,
        source='category'
    )
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'featured_image_url',
            'author', 'published_date', 'created_at', 'updated_at', 'status',
            'featured', 'views_count', 'category', 'category_id', 'tags',
            'meta_keywords', 'meta_description'
        ]


class ContactMessageSerializer(serializers.ModelSerializer):
    """Serializer for contact form submissions"""
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone', 'subject', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class ContactMessageAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin contact message management"""
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'phone', 'subject', 'message',
            'status', 'admin_notes', 'created_at', 'updated_at'
        ]


class DynamicPageSerializer(serializers.ModelSerializer):
    """Serializer for dynamic pages"""
    class Meta:
        model = DynamicPage
        fields = [
            'id', 'title', 'slug', 'content', 'is_visible', 'show_in_footer',
            'show_in_menu', 'meta_description', 'meta_keywords', 'created_at', 'updated_at'
        ]


class SocialMediaLinksSerializer(serializers.ModelSerializer):
    """Serializer for social media links"""
    class Meta:
        model = SocialMediaLinks
        fields = ['id', 'platform', 'url', 'icon_class', 'display_order']


class NewsletterSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for newsletter subscriptions"""
    class Meta:
        model = NewsletterSubscription
        fields = ['email', 'name']
        read_only_fields = []


class SectionItemSerializer(serializers.ModelSerializer):
    """Serializer for section items"""
    features_list = serializers.SerializerMethodField()
    
    class Meta:
        model = SectionItem
        fields = [
            'id', 'title', 'description', 'icon', 'image_url',
            'price', 'price_period', 'features', 'features_list',
            'button_text', 'button_url', 'display_order', 'is_highlighted',
            'metadata', 'created_at', 'updated_at'
        ]
    
    def get_features_list(self, obj):
        """Convert features text to list"""
        if obj.features:
            return [f.strip() for f in obj.features.split('\n') if f.strip()]
        return []


class PageSectionSerializer(serializers.ModelSerializer):
    """Serializer for page sections with items"""
    items = SectionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = PageSection
        fields = [
            'id', 'page', 'section_type', 'title', 'subtitle', 'description',
            'image_url', 'background_color', 'text_color', 'columns',
            'is_visible', 'display_order', 'cta_text', 'cta_url', 'cta_style',
            'custom_html', 'custom_css', 'items', 'created_at', 'updated_at'
        ]


class ImageAssetSerializer(serializers.ModelSerializer):
    """Serializer for image assets"""
    resolved_image_url = serializers.SerializerMethodField()

    class Meta:
        model = ImageAsset
        fields = [
            'id', 'name', 'description', 'image', 'image_url', 'resolved_image_url', 'alt_text',
            'category', 'width', 'height', 'file_size', 'created_at', 'updated_at'
        ]

    def get_resolved_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return obj.image_url
