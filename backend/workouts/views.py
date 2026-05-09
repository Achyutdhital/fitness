from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models as db_models
from .models import Workout, WorkoutCategory, MealPlan, UserWorkoutProgress
from .serializers import (
    WorkoutSerializer, WorkoutDetailSerializer, WorkoutCategorySerializer,
    MealPlanSerializer, MealPlanDetailSerializer, UserWorkoutProgressSerializer
)


class WorkoutCategoryViewSet(viewsets.ModelViewSet):
    """Workout categories"""
    queryset = WorkoutCategory.objects.filter(is_active=True)
    serializer_class = WorkoutCategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class WorkoutViewSet(viewsets.ModelViewSet):
    """Workouts listing and details"""
    queryset = Workout.objects.filter(is_active=True).select_related('category')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['difficulty_level', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'rating', 'duration_minutes']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Workout.objects.all().select_related('category')
        return Workout.objects.filter(is_active=True).select_related('category')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return WorkoutDetailSerializer
        return WorkoutSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_workouts(self, request):
        """Get workouts for current user's subscription"""
        user = request.user
        try:
            subscription = user.subscription
            if subscription and subscription.subscription_plan:
                plans = [subscription.subscription_plan]
                workouts = Workout.objects.filter(
                    required_subscription_plans__in=plans,
                    is_active=True
                ).distinct()
            else:
                workouts = Workout.objects.filter(
                    required_subscription_plans__isnull=True,
                    is_active=True
                )
        except:
            workouts = Workout.objects.filter(
                required_subscription_plans__isnull=True,
                is_active=True
            )
        
        serializer = self.get_serializer(workouts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_complete(self, request, pk=None):
        """Mark workout as completed"""
        workout = self.get_object()
        user = request.user
        
        progress, created = UserWorkoutProgress.objects.update_or_create(
            user=user,
            workout=workout,
            defaults={
                'completed': True,
                'completed_date': None,
                'calories_burnt': request.data.get('calories_burnt'),
                'duration_minutes': request.data.get('duration_minutes'),
                'notes': request.data.get('notes', '')
            }
        )
        
        serializer = UserWorkoutProgressSerializer(progress)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def featured(self, request):
        """Get featured workouts"""
        workouts = self.queryset.filter(is_featured=True)
        serializer = self.get_serializer(workouts, many=True)
        return Response(serializer.data)


class MealPlanViewSet(viewsets.ModelViewSet):
    """Meal plans listing and details"""
    queryset = MealPlan.objects.filter(is_active=True).prefetch_related('meals')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['difficulty_level', 'dietary_type']
    search_fields = ['title', 'description']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'my_plans']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return MealPlan.objects.all().prefetch_related('meals')
        return MealPlan.objects.filter(is_active=True).prefetch_related('meals')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MealPlanDetailSerializer
        return MealPlanSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_plans(self, request):
        """Get meal plans for current user's subscription"""
        user = request.user
        try:
            subscription = user.subscription
            if subscription and subscription.subscription_plan:
                if subscription.subscription_plan.include_meal_plans:
                    plans = MealPlan.objects.filter(is_active=True)
                else:
                    plans = MealPlan.objects.filter(is_active=False)
            else:
                plans = MealPlan.objects.filter(is_active=False)
        except:
            plans = MealPlan.objects.filter(is_active=False)
        
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)


class UserWorkoutProgressViewSet(viewsets.ViewSet):
    """User workout progress tracking"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        """Get user's workout progress"""
        progress = UserWorkoutProgress.objects.filter(user=request.user)
        serializer = UserWorkoutProgressSerializer(progress, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user's workout statistics"""
        user = request.user
        completed_workouts = UserWorkoutProgress.objects.filter(
            user=user, completed=True
        ).count()
        
        total_calories = UserWorkoutProgress.objects.filter(
            user=user, completed=True
        ).aggregate(total=db_models.Sum('calories_burnt'))['total'] or 0
        
        total_duration = UserWorkoutProgress.objects.filter(
            user=user, completed=True
        ).aggregate(total=db_models.Sum('duration_minutes'))['total'] or 0
        
        return Response({
            'completed_workouts': completed_workouts,
            'total_calories_burnt': total_calories,
            'total_duration_minutes': total_duration,
        })
