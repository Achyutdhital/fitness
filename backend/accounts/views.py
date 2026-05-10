from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import viewsets, status, generics, filters as drf_filters
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum, Count
from django.utils import timezone

from .models import CustomUser, UserSubscription, UserProfile
from .serializers import (
    UserRegistrationSerializer, CustomUserSerializer,
    UserProfileSerializer, UserSubscriptionSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        UserProfile.objects.get_or_create(user=user)
        return Response({
            'user': CustomUserSerializer(user).data,
            'message': 'Account created successfully! Welcome to FitCoachPro.',
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class UserViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(CustomUserSerializer(request.user).data)

    @action(detail=False, methods=['post', 'patch'])
    def update_profile(self, request):
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def subscription(self, request):
        try:
            sub = request.user.subscription
            return Response(UserSubscriptionSerializer(sub).data)
        except UserSubscription.DoesNotExist:
            return Response({'message': 'No active subscription'}, status=404)

    @action(detail=False, methods=['get'])
    def profile(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    @action(detail=False, methods=['post', 'patch'])
    def update_profile_details(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'detail': 'Current password is incorrect.'}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully.'})

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Full stats for the dashboard"""
        from workouts.models import UserWorkoutProgress
        from core.models import UserPoints, UserAchievement, Notification

        user = request.user
        progress_qs = UserWorkoutProgress.objects.filter(user=user, completed=True)

        completed = progress_qs.count()
        calories = progress_qs.aggregate(t=Sum('calories_burnt'))['t'] or 0
        minutes = progress_qs.aggregate(t=Sum('duration_minutes'))['t'] or 0

        points, _ = UserPoints.objects.get_or_create(user=user)
        achievements_count = UserAchievement.objects.filter(user=user).count()
        unread_notifs = Notification.objects.filter(user=user, is_read=False).count()

        recent = progress_qs.order_by('-created_at')[:5]
        from workouts.serializers import UserWorkoutProgressSerializer
        recent_data = UserWorkoutProgressSerializer(recent, many=True).data

        # Calculate weekly activity history (Last 7 days)
        from datetime import timedelta
        end_date = timezone.now()
        start_date = end_date - timedelta(days=6)
        
        # Group calories by day
        history_qs = UserWorkoutProgress.objects.filter(
            user=user, 
            completed=True,
            created_at__date__gte=start_date.date(),
            created_at__date__lte=end_date.date()
        ).values('created_at__date').annotate(calories=Sum('calories_burnt'))
        
        history_map = {h['created_at__date']: h['calories'] for h in history_qs}
        
        weekly_activity = []
        for i in range(7):
            d = start_date + timedelta(days=i)
            weekly_activity.append({
                'day': d.strftime('%a'), # Mon, Tue...
                'calories': history_map.get(d.date(), 0),
                'done': d.date() in history_map
            })

        # Get measurement history for weight chart
        from core.models import BodyMeasurement
        m_history = BodyMeasurement.objects.filter(user=user).order_by('date')[:30]
        measurement_data = [
            {'date': m.date.strftime('%b %d'), 'weight': m.weight} 
            for m in m_history if m.weight
        ]

        return Response({
            'completed_workouts': completed,
            'total_calories_burnt': calories,
            'total_duration_minutes': minutes,
            'streak': points.streak_days,
            'longest_streak': points.longest_streak,
            'total_points': points.total_points,
            'level': points.level,
            'level_name': points.get_level_name(),
            'achievements_count': achievements_count,
            'unread_notifications': unread_notifs,
            'recent_workouts': recent_data,
            'weekly_activity': weekly_activity,
            'measurement_history': measurement_data,
        })


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = CustomUser.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}/"

            send_mail(
                subject='Reset Your FitCoachPro Password',
                message=f'Click the link to reset your password: {reset_url}\n\nThis link expires in 1 hour.',
                from_email=settings.EMAIL_HOST_USER or 'noreply@fitcoachpro.com',
                recipient_list=[email],
                fail_silently=True,
            )
        except CustomUser.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({'message': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(request.data.get('uid', '')))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, CustomUser.DoesNotExist):
            return Response({'error': 'Invalid reset link.'}, status=400)

        token = serializer.validated_data['token']
        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Reset link has expired or is invalid.'}, status=400)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password reset successfully. You can now log in.'})


class AdminStatsView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from workouts.models import UserWorkoutProgress
        from payments.models import Payment

        total_users = CustomUser.objects.count()
        active_subs = UserSubscription.objects.filter(status='active').count()
        total_revenue = Payment.objects.filter(status='completed').aggregate(
            t=Sum('amount')
        )['t'] or 0
        total_workouts_completed = UserWorkoutProgress.objects.filter(completed=True).count()
        new_users_this_month = CustomUser.objects.filter(
            created_at__gte=timezone.now().replace(day=1)
        ).count()

        return Response({
            'total_users': total_users,
            'active_subscriptions': active_subs,
            'total_revenue': float(total_revenue),
            'total_workouts_completed': total_workouts_completed,
            'new_users_this_month': new_users_this_month,
        })


class AdminUsersViewSet(viewsets.ModelViewSet):
    """Admin user management"""
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_queryset(self):
        return CustomUser.objects.all().order_by('-date_joined')
