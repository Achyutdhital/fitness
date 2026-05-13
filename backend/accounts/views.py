import base64
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import filters as drf_filters
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum
from django.utils import timezone
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect

from .models import CustomUser, UserSubscription, UserProfile
from .serializers import (
    UserRegistrationSerializer, CustomUserSerializer,
    UserProfileSerializer, UserSubscriptionSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)


def _sync_measurement_from_user(user):
    try:
        from core.models import BodyMeasurement
        weight_kg = round((user.weight or 0) / 2.20462, 2) if user.weight else None
        BodyMeasurement.objects.update_or_create(
            user=user,
            date=timezone.now().date(),
            defaults={
                'weight': weight_kg,
                'body_fat_percentage': user.body_fat_percentage,
                'muscle_mass': user.muscle_mass_kg,
                'notes': 'Auto-synced from user profile',
            }
        )
    except Exception:
        pass


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


def _decode_state(state_str):
    if not state_str:
        return {}
    try:
        payload = base64.urlsafe_b64decode(state_str.encode('utf-8')).decode('utf-8')
        return json.loads(payload)
    except Exception:
        return {}


def _exchange_google_code(code, redirect_uri):
    body = urlencode({
        'code': code,
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    }).encode('utf-8')

    req = Request('https://oauth2.googleapis.com/token', data=body)
    with urlopen(req) as resp:
        token_data = json.loads(resp.read().decode('utf-8'))

    access_token = token_data.get('access_token')
    if not access_token:
        return None

    user_req = Request(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    with urlopen(user_req) as resp:
        return json.loads(resp.read().decode('utf-8'))


def _exchange_facebook_code(code, redirect_uri):
    token_url = 'https://graph.facebook.com/v19.0/oauth/access_token?' + urlencode({
        'client_id': settings.FACEBOOK_APP_ID,
        'client_secret': settings.FACEBOOK_APP_SECRET,
        'redirect_uri': redirect_uri,
        'code': code,
    })
    with urlopen(token_url) as resp:
        token_data = json.loads(resp.read().decode('utf-8'))

    access_token = token_data.get('access_token')
    if not access_token:
        return None

    profile_url = 'https://graph.facebook.com/me?' + urlencode({
        'fields': 'id,email,first_name,last_name,name',
        'access_token': access_token,
    })
    with urlopen(profile_url) as resp:
        return json.loads(resp.read().decode('utf-8'))


def _upsert_oauth_user(profile, provider, onboarding_data):
    email = profile.get('email')
    if not email:
        return None

    user = CustomUser.objects.filter(email=email).first()
    if not user:
        base_username = email.split('@')[0][:20] or f'{provider}_user'
        username = base_username
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f'{base_username}_{counter}'
            counter += 1

        user = CustomUser(
            username=username,
            email=email,
            first_name=profile.get('first_name', '') or onboarding_data.get('first_name', ''),
            last_name=profile.get('last_name', ''),
        )
        user.set_unusable_password()

    # Apply onboarding data if present
    mapping = {
        'gender': 'gender',
        'age': 'age',
        'height_ft': 'height_ft',
        'height_in': 'height_in',
        'weight': 'weight',
        'goal': 'fitness_goal',
        'activity_level': 'activity_level',
        'dietary_preference': 'dietary_preference',
    }
    for k, field in mapping.items():
        value = onboarding_data.get(k)
        if value not in [None, '']:
            setattr(user, field, value)

    # Normalize units when onboarding sent metric data.
    try:
        height_unit = (onboarding_data.get('height_unit') or 'ft_in').lower()
        weight_unit = (onboarding_data.get('weight_unit') or 'lb').lower()

        if height_unit == 'cm' and onboarding_data.get('height_cm'):
            total_inches = float(onboarding_data.get('height_cm')) / 2.54
            user.height_ft = int(total_inches // 12)
            user.height_in = int(round(total_inches % 12))
        elif height_unit in ['m', 'meter', 'meters'] and onboarding_data.get('height_m'):
            total_inches = float(onboarding_data.get('height_m')) * 100 / 2.54
            user.height_ft = int(total_inches // 12)
            user.height_in = int(round(total_inches % 12))

        if user.weight and weight_unit in ['kg', 'kilogram', 'kilograms']:
            user.weight = round(float(user.weight) * 2.20462, 2)
            user.preferred_units = 'metric'
    except Exception:
        pass

    user._calculate_body_metrics()
    user.save()
    UserProfile.objects.get_or_create(user=user)
    _sync_measurement_from_user(user)
    return user


class OAuthStartView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, provider):
        state = request.query_params.get('state', '')

        if provider == 'google':
            if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
                return HttpResponseBadRequest('Google OAuth is not configured.')
            params = {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'redirect_uri': settings.GOOGLE_REDIRECT_URI,
                'response_type': 'code',
                'scope': 'openid email profile',
                'state': state,
                'access_type': 'offline',
                'prompt': 'select_account',
            }
            return redirect('https://accounts.google.com/o/oauth2/v2/auth?' + urlencode(params))

        if provider == 'facebook':
            if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
                return HttpResponseBadRequest('Facebook OAuth is not configured.')
            params = {
                'client_id': settings.FACEBOOK_APP_ID,
                'redirect_uri': settings.FACEBOOK_REDIRECT_URI,
                'response_type': 'code',
                'scope': 'email,public_profile',
                'state': state,
            }
            return redirect('https://www.facebook.com/v19.0/dialog/oauth?' + urlencode(params))

        return HttpResponseBadRequest('Unsupported OAuth provider.')


class OAuthCallbackView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, provider):
        code = request.query_params.get('code')
        state = request.query_params.get('state', '')
        onboarding_data = _decode_state(state)

        if not code:
            return redirect(f"{settings.FRONTEND_URL}/signup?oauth_error=missing_code")

        try:
            if provider == 'google':
                profile = _exchange_google_code(code, settings.GOOGLE_REDIRECT_URI)
            elif provider == 'facebook':
                profile = _exchange_facebook_code(code, settings.FACEBOOK_REDIRECT_URI)
            else:
                return redirect(f"{settings.FRONTEND_URL}/signup?oauth_error=invalid_provider")

            user = _upsert_oauth_user(profile or {}, provider, onboarding_data)
            if not user:
                return redirect(f"{settings.FRONTEND_URL}/signup?oauth_error=no_email")

            refresh = RefreshToken.for_user(user)
            return redirect(
                f"{settings.FRONTEND_URL}/oauth-callback?access={str(refresh.access_token)}&refresh={str(refresh)}"
            )
        except Exception:
            return redirect(f"{settings.FRONTEND_URL}/signup?oauth_error=callback_failed")


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

    @action(detail=False, methods=['post'])
    def calculate_body_metrics(self, request):
        """Calculate body fat, BMR, and TDEE based on provided body data"""
        user = request.user
        
        # Update user fields with provided data
        data = request.data
        if 'gender' in data:
            user.gender = data.get('gender')
        if 'age' in data:
            user.age = int(data.get('age'))
        if 'height_ft' in data:
            user.height_ft = int(data.get('height_ft'))
        if 'height_in' in data:
            user.height_in = int(data.get('height_in'))
        if 'weight' in data:
            user.weight = float(data.get('weight'))
        if 'activity_level' in data:
            user.activity_level = data.get('activity_level')
        if 'fitness_goal' in data:
            user.fitness_goal = data.get('fitness_goal')
        if 'dietary_preference' in data:
            user.dietary_preference = data.get('dietary_preference')
        
        # Calculate metrics
        user._calculate_body_metrics()
        user.save()
        _sync_measurement_from_user(user)
        
        return Response({
            'bmi': user.bmi,
            'body_fat_percentage': user.body_fat_percentage,
            'muscle_mass_kg': user.muscle_mass_kg,
            'bmr': user.bmr,
            'tdee': user.tdee,
            'message': 'Body metrics calculated successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def body_metrics(self, request):
        """Get current body metrics"""
        user = request.user
        return Response({
            'gender': user.gender,
            'age': user.age,
            'height_ft': user.height_ft,
            'height_in': user.height_in,
            'weight': user.weight,
            'activity_level': user.activity_level,
            'fitness_goal': user.fitness_goal,
            'dietary_preference': user.dietary_preference,
            'bmi': user.bmi,
            'body_fat_percentage': user.body_fat_percentage,
            'muscle_mass_kg': user.muscle_mass_kg,
            'bmr': user.bmr,
            'tdee': user.tdee,
            'preferred_units': user.preferred_units,
        })

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

        active_days = sum(1 for day in weekly_activity if day['done'])
        weekly_completion_rate = round((active_days / 7) * 100) if weekly_activity else 0
        average_session_minutes = round(minutes / completed) if completed else 0

        # Get measurement history for weight chart
        from core.models import BodyMeasurement
        m_history = list(BodyMeasurement.objects.filter(user=user).order_by('-date')[:30])
        latest_measurement = m_history[0] if m_history else None
        previous_measurement = m_history[1] if len(m_history) > 1 else None
        weight_trend = None
        if latest_measurement and previous_measurement and latest_measurement.weight and previous_measurement.weight:
            weight_trend = round(float(latest_measurement.weight) - float(previous_measurement.weight), 1)

        measurement_data = [
            {'date': m.date.strftime('%b %d'), 'weight': m.weight}
            for m in reversed(m_history) if m.weight
        ]

        goal = (user.fitness_goal or 'maintain').lower()
        if goal == 'lose_weight':
            next_best_action = 'Keep calories controlled and add one extra zone-2 walk this week.'
        elif goal == 'gain_muscle':
            next_best_action = 'Push progressive overload on your next 2 sessions and keep protein high.'
        elif goal == 'improve_health':
            next_best_action = 'Prioritize consistency: one lift, one cardio, and one mobility day this week.'
        else:
            next_best_action = 'Maintain momentum: keep your streak alive with one quality session this week.'

        insight_cards = [
            {
                'label': 'Weekly Consistency',
                'value': f'{weekly_completion_rate}%',
                'detail': f'{active_days}/7 active days this week',
            },
            {
                'label': 'Average Session',
                'value': f'{average_session_minutes} min',
                'detail': 'Based on completed workouts',
            },
            {
                'label': 'Weight Trend',
                'value': 'Stable' if weight_trend is None else f"{weight_trend:+.1f}",
                'detail': 'Compared to your previous measurement',
            },
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
            'weekly_completion_rate': weekly_completion_rate,
            'average_session_minutes': average_session_minutes,
            'weight_trend': weight_trend,
            'next_best_action': next_best_action,
            'insight_cards': insight_cards,
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
        from core.models import SupportTicket
        from cms.models import NewsletterSubscription

        total_users = CustomUser.objects.count()
        active_subs = UserSubscription.objects.filter(status='active').count()
        total_revenue = Payment.objects.filter(status='completed').aggregate(
            t=Sum('amount')
        )['t'] or 0
        total_workouts_completed = UserWorkoutProgress.objects.filter(completed=True).count()
        new_users_this_month = CustomUser.objects.filter(
            created_at__gte=timezone.now().replace(day=1)
        ).count()
        support_tickets = SupportTicket.objects.all()
        open_support_tickets = support_tickets.filter(status='open').count()
        urgent_support_tickets = support_tickets.filter(priority='urgent').count()
        resolved_support_tickets = support_tickets.filter(status='resolved').count()
        newsletter_subscribers = NewsletterSubscription.objects.filter(is_active=True).count()

        return Response({
            'total_users': total_users,
            'active_subscriptions': active_subs,
            'total_revenue': float(total_revenue),
            'total_workouts_completed': total_workouts_completed,
            'new_users_this_month': new_users_this_month,
            'open_support_tickets': open_support_tickets,
            'urgent_support_tickets': urgent_support_tickets,
            'resolved_support_tickets': resolved_support_tickets,
            'newsletter_subscribers': newsletter_subscribers,
        })


class AdminUsersViewSet(viewsets.ModelViewSet):
    """Admin user management"""
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_queryset(self):
        return CustomUser.objects.all().order_by('-date_joined')

    @action(detail=False, methods=['post'])
    def create_coach(self, request):
        payload = request.data
        username = payload.get('username')
        email = payload.get('email')
        password = payload.get('password')
        if not all([username, email, password]):
            return Response({'error': 'username, email, and password are required'}, status=400)
        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=400)
        if CustomUser.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=400)

        coach = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=payload.get('first_name', ''),
            last_name=payload.get('last_name', ''),
            role='coach',
            fitness_level=payload.get('fitness_level', 'advanced'),
        )
        return Response(CustomUserSerializer(coach).data, status=201)

    @action(detail=False, methods=['post'])
    def assign_coach(self, request):
        client_id = request.data.get('client_id')
        coach_id = request.data.get('coach_id')
        if not client_id or not coach_id:
            return Response({'error': 'client_id and coach_id are required'}, status=400)

        try:
            client = CustomUser.objects.get(id=client_id)
            coach = CustomUser.objects.get(id=coach_id, role='coach')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Client or coach not found'}, status=404)

        client.assigned_coach = coach
        client.save(update_fields=['assigned_coach'])
        return Response({'message': f'{coach.username} assigned to {client.username}'})
