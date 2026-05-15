from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WebsiteSettingsView, BlogCategoryViewSet, BlogPostViewSet,
    ContactMessageViewSet, DynamicPageViewSet, SocialMediaLinksViewSet,
    NewsletterSubscriptionViewSet, PageSectionViewSet, SectionItemViewSet,
    ImageAssetViewSet
)

router = DefaultRouter()
router.register(r'blog/categories', BlogCategoryViewSet, basename='blog-category')
router.register(r'blog/posts', BlogPostViewSet, basename='blog-post')
router.register(r'blog', BlogPostViewSet, basename='blog')
router.register(r'contact', ContactMessageViewSet, basename='contact-message')
router.register(r'pages', DynamicPageViewSet, basename='dynamic-page')
router.register(r'social-links', SocialMediaLinksViewSet, basename='social-links')
router.register(r'newsletter', NewsletterSubscriptionViewSet, basename='newsletter')
router.register(r'sections', PageSectionViewSet, basename='page-section')
router.register(r'section-items', SectionItemViewSet, basename='section-item')
router.register(r'assets', ImageAssetViewSet, basename='image-asset')

urlpatterns = [
    path('settings/', WebsiteSettingsView.as_view(), name='website-settings'),
    path('', include(router.urls)),
]
