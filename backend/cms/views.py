from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from .models import (
    WebsiteSettings, BlogPost, BlogCategory, ContactMessage,
    DynamicPage, SocialMediaLinks, NewsletterSubscription,
    PageSection, SectionItem, ImageAsset
)
from .serializers import (
    WebsiteSettingsSerializer, BlogPostListSerializer, BlogPostDetailSerializer,
    BlogCategorySerializer, ContactMessageSerializer, ContactMessageAdminSerializer,
    DynamicPageSerializer, SocialMediaLinksSerializer, NewsletterSubscriptionSerializer,
    PageSectionSerializer, SectionItemSerializer, ImageAssetSerializer
)


class WebsiteSettingsView(APIView):
    """Get/Update website settings"""
    
    def get(self, request):
        """Get website settings"""
        settings, created = WebsiteSettings.objects.get_or_create(id=WebsiteSettings.objects.values_list('id', flat=True).first() or None)
        if created or settings is None:
            settings = WebsiteSettings.objects.first()
        if not settings:
            settings = WebsiteSettings.objects.create()
        
        serializer = WebsiteSettingsSerializer(settings)
        return Response(serializer.data)
    
    def put(self, request):
        """Update website settings (admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Only admins can update settings'}, status=status.HTTP_403_FORBIDDEN)
        
        settings = WebsiteSettings.objects.first()
        if not settings:
            settings = WebsiteSettings.objects.create()
        
        serializer = WebsiteSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BlogCategoryViewSet(viewsets.ModelViewSet):
    """Blog category management"""
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class BlogPostViewSet(viewsets.ModelViewSet):
    """Blog post management"""
    serializer_class = BlogPostDetailSerializer
    lookup_field = 'slug'
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return BlogPost.objects.all()
        return BlogPost.objects.filter(status='published', published_date__lte=timezone.now())
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPostListSerializer
        return BlogPostDetailSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def featured(self, request):
        """Get featured blog posts"""
        posts = self.get_queryset().filter(featured=True)[:5]
        serializer = BlogPostListSerializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def latest(self, request):
        """Get latest blog posts"""
        limit = request.query_params.get('limit', 10)
        posts = self.get_queryset()[:int(limit)]
        serializer = BlogPostListSerializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def search(self, request):
        """Search blog posts"""
        query = request.query_params.get('q', '')
        category = request.query_params.get('category', '')
        
        posts = self.get_queryset()
        
        if query:
            posts = posts.filter(
                Q(title__icontains=query) |
                Q(content__icontains=query) |
                Q(excerpt__icontains=query) |
                Q(tags__icontains=query)
            )
        
        if category:
            posts = posts.filter(category__slug=category)
        
        serializer = BlogPostListSerializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny()])
    def increment_views(self, request, slug=None):
        """Increment view count"""
        post = self.get_object()
        post.views_count += 1
        post.save()
        return Response({'views_count': post.views_count})
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def by_category(self, request):
        """Get posts by category"""
        category_slug = request.query_params.get('slug', '')
        posts = self.get_queryset().filter(category__slug=category_slug)
        serializer = BlogPostListSerializer(posts, many=True)
        return Response(serializer.data)


class ContactMessageViewSet(viewsets.ModelViewSet):
    """Contact message management"""
    queryset = ContactMessage.objects.all()
    
    def get_serializer_class(self):
        if self.request.user.is_staff:
            return ContactMessageAdminSerializer
        return ContactMessageSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return ContactMessage.objects.all()
        return ContactMessage.objects.none()


class DynamicPageViewSet(viewsets.ModelViewSet):
    """Dynamic page management"""
    queryset = DynamicPage.objects.filter(is_visible=True)
    serializer_class = DynamicPageSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.is_staff:
            return DynamicPage.objects.all()
        return DynamicPage.objects.filter(is_visible=True)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def footer_pages(self, request):
        """Get pages displayed in footer"""
        pages = DynamicPage.objects.filter(is_visible=True, show_in_footer=True)
        serializer = DynamicPageSerializer(pages, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def menu_pages(self, request):
        """Get pages displayed in menu"""
        pages = DynamicPage.objects.filter(is_visible=True, show_in_menu=True)
        serializer = DynamicPageSerializer(pages, many=True)
        return Response(serializer.data)


class SocialMediaLinksViewSet(viewsets.ModelViewSet):
    """Social media links management"""
    queryset = SocialMediaLinks.objects.all()
    serializer_class = SocialMediaLinksSerializer
    
    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class NewsletterSubscriptionViewSet(viewsets.ModelViewSet):
    """Newsletter subscription management"""
    queryset = NewsletterSubscription.objects.filter(is_active=True)
    serializer_class = NewsletterSubscriptionSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    def create(self, request, *args, **kwargs):
        """Subscribe to newsletter"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            try:
                subscriber, created = NewsletterSubscription.objects.get_or_create(
                    email=email,
                    defaults={'name': serializer.validated_data.get('name', '')}
                )
                if not subscriber.is_active:
                    subscriber.is_active = True
                    subscriber.unsubscribed_at = None
                    subscriber.save()
                
                message = 'Subscribed successfully' if created else 'Already subscribed'
                return Response(
                    {'message': message},
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageSectionViewSet(viewsets.ModelViewSet):
    """Page sections management - dynamic page builder"""
    serializer_class = PageSectionSerializer
    
    def get_queryset(self):
        page = self.request.query_params.get('page', 'home')
        if self.request.user.is_staff:
            return PageSection.objects.filter(page=page).order_by('display_order')
        return PageSection.objects.filter(page=page, is_visible=True).order_by('display_order')
    
    def get_permissions(self):
        if self.action in ['list']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def by_page(self, request):
        """Get sections for a specific page"""
        page = request.query_params.get('page', 'home')
        sections = self.get_queryset().filter(page=page)
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)


class SectionItemViewSet(viewsets.ModelViewSet):
    """Section items management"""
    serializer_class = SectionItemSerializer
    
    def get_queryset(self):
        section_id = self.request.query_params.get('section', None)
        if section_id:
            return SectionItem.objects.filter(section_id=section_id).order_by('display_order')
        return SectionItem.objects.all().order_by('display_order')
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class ImageAssetViewSet(viewsets.ModelViewSet):
    """Image/asset management"""
    queryset = ImageAsset.objects.all().order_by('-created_at')
    serializer_class = ImageAssetSerializer
    
    def get_permissions(self):
        if self.action in ['list']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny()])
    def by_category(self, request):
        """Get images by category"""
        category = request.query_params.get('category', '')
        images = ImageAsset.objects.filter(category=category)
        serializer = self.get_serializer(images, many=True)
        return Response(serializer.data)
