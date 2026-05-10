from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import SubscriptionPlan, Feature, SubscriptionTier
from .serializers import SubscriptionPlanSerializer, SubscriptionPlanDetailSerializer, FeatureSerializer, SubscriptionTierSerializer


class SubscriptionTierViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionTier.objects.all().order_by('priority')
    serializer_class = SubscriptionTierSerializer
    permission_classes = [permissions.AllowAny]


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """Subscription plans list and details"""
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by('price')

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'active_plans', 'features', 'compare']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SubscriptionPlan.objects.all().order_by('price')
        return SubscriptionPlan.objects.filter(is_active=True).order_by('price')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SubscriptionPlanDetailSerializer
        return SubscriptionPlanSerializer

    @action(detail=False, methods=['get'])
    def active_plans(self, request):
        """Get only active subscription plans"""
        plans = self.queryset
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def features(self, request, pk=None):
        """Get features for a specific plan"""
        plan = self.get_object()
        return Response({
            'plan': plan.name,
            'features': plan.features if isinstance(plan.features, list) else []
        })

    @action(detail=False, methods=['get'])
    def compare(self, request):
        """Compare all plans"""
        plans = self.queryset
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)


class FeatureViewSet(viewsets.ReadOnlyModelViewSet):
    """Features available in plans"""
    queryset = Feature.objects.filter(is_active=True)
    serializer_class = FeatureSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get features grouped by category"""
        categories = {}
        features = self.queryset.values_list('category', flat=True).distinct()
        
        for category in features:
            category_features = self.queryset.filter(category=category)
            categories[category] = FeatureSerializer(
                category_features, many=True
            ).data
        
        return Response(categories)
