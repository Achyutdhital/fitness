from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models as db_models
from .models import (
    Workout, WorkoutCategory, MealPlan, UserWorkoutProgress,
    WorkoutProgram, WorkoutPhase, ScheduledWorkout, UserProgram
)
from .serializers import (
    WorkoutSerializer, WorkoutDetailSerializer, WorkoutCategorySerializer,
    MealPlanSerializer, MealPlanDetailSerializer, UserWorkoutProgressSerializer,
    WorkoutProgramSerializer, WorkoutPhaseSerializer, WorkoutSetSerializer
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
    def start_workout(self, request, pk=None):
        """Initialize or resume a live workout session"""
        workout = self.get_object()
        user = request.user
        from django.utils import timezone
        
        progress, created = UserWorkoutProgress.objects.get_or_create(
            user=user,
            workout=workout,
            defaults={'status': 'in_progress', 'started_at': timezone.now()}
        )
        
        if not created and progress.status == 'not_started':
            progress.status = 'in_progress'
            progress.started_at = timezone.now()
            progress.save()
            
        return Response(UserWorkoutProgressSerializer(progress).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def log_set(self, request, pk=None):
        """Log a specific set for an exercise in the current workout"""
        from .models import WorkoutSet, Exercise
        workout = self.get_object()
        user = request.user
        
        progress = UserWorkoutProgress.objects.filter(user=user, workout=workout).first()
        if not progress:
            return Response({'error': 'Workout session not started'}, status=400)
            
        exercise_id = request.data.get('exercise_id')
        set_number = request.data.get('set_number')
        weight = request.data.get('weight')
        reps = request.data.get('reps')
        
        if not all([exercise_id, set_number]):
            return Response({'error': 'exercise_id and set_number required'}, status=400)
            
        exercise = Exercise.objects.get(id=exercise_id, workout=workout)
        
        workout_set, _ = WorkoutSet.objects.update_or_create(
            progress=progress,
            exercise=exercise,
            set_number=set_number,
            defaults={
                'weight': weight,
                'reps': reps,
                'is_completed': True
            }
        )
        
        return Response({'message': 'Set logged successfully', 'set_id': workout_set.id})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_complete(self, request, pk=None):
        """Mark workout as completed and calculate stats"""
        from django.utils import timezone
        workout = self.get_object()
        user = request.user
        
        progress = UserWorkoutProgress.objects.filter(user=user, workout=workout).first()
        
        now = timezone.now()
        duration = 0
        if progress and progress.started_at:
            delta = now - progress.started_at
            duration = int(delta.total_seconds() / 60)
            
        if not progress:
            progress = UserWorkoutProgress.objects.create(user=user, workout=workout)

        progress.completed = True
        progress.status = 'completed'
        progress.completed_date = now
        progress.duration_minutes = duration or request.data.get('duration_minutes', workout.duration_minutes)
        progress.calories_burnt = request.data.get('calories_burnt', workout.calories_burnt)
        progress.notes = request.data.get('notes', '')
        progress.save()
        
        # Award points for completion
        from core.models import UserPoints
        points, _ = UserPoints.objects.get_or_create(user=user)
        points.total_points += 50 # Base points for workout
        points.save()
        
        serializer = UserWorkoutProgressSerializer(progress)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def today(self, request):
        """Get the automated workout for today based on user's program/phase"""
        from django.utils import timezone
        user = request.user
        
        try:
            up = UserProgram.objects.get(user=user, is_active=True)
            if not up.program:
                raise UserProgram.DoesNotExist
                
            # Calculate days since start
            delta = timezone.now().date() - up.start_date
            days_elapsed = delta.days + 1 # Day 1 is the start date
            
            # Find the current phase
            current_day_offset = 0
            current_phase = None
            for phase in up.program.phases.all().order_by('order'):
                phase_days = phase.duration_weeks * 7
                if days_elapsed <= (current_day_offset + phase_days):
                    current_phase = phase
                    break
                current_day_offset += phase_days
            
            if not current_phase:
                return Response({'message': 'Program completed! Check out new programs.', 'completed': True})
                
            # Day within the phase
            day_in_phase = days_elapsed - current_day_offset
            
            # Find scheduled workout
            scheduled = ScheduledWorkout.objects.filter(phase=current_phase, day_number=day_in_phase).first()
            
            if scheduled:
                serializer = self.get_serializer(scheduled.workout)
                return Response({
                    'workout': serializer.data,
                    'program_name': up.program.name,
                    'phase_name': current_phase.name,
                    'day_number': days_elapsed,
                    'day_in_phase': day_in_phase
                })
            else:
                return Response({'message': 'Rest Day', 'is_rest': True, 'day_number': days_elapsed})
                
        except UserProgram.DoesNotExist:
            # Fallback to a featured workout if no program
            workout = Workout.objects.filter(is_featured=True, is_active=True).first()
            if not workout:
                workout = Workout.objects.filter(is_active=True).first()
            
            if workout:
                serializer = self.get_serializer(workout)
                return Response({
                    'workout': serializer.data,
                    'message': 'Recommended Workout (Assign a program for daily automation)',
                    'is_fallback': True
                })
            return Response({'message': 'No workouts available.'}, status=404)

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


class WorkoutProgramViewSet(viewsets.ModelViewSet):
    """Training programs management"""
    queryset = WorkoutProgram.objects.filter(is_active=True).prefetch_related('phases')
    serializer_class = WorkoutProgramSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class WorkoutPhaseViewSet(viewsets.ModelViewSet):
    """Program phases management"""
    queryset = WorkoutPhase.objects.all().prefetch_related('scheduled_workouts__workout')
    serializer_class = WorkoutPhaseSerializer
    permission_classes = [AllowAny]

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
