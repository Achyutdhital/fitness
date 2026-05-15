from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.utils import timezone
from django.db.models import Sum, Count
from django.core.cache import cache

from .models import (
    WorkoutFavorite, MealPlanFavorite, WorkoutReview,
    BodyMeasurement, Achievement, UserAchievement, UserPoints,
    Challenge, ChallengeParticipation, Notification,
    Coupon, Referral, SupportTicket, CoachSession, CoachPayout,
    AdViewLog, ItemUnlock, CustomizedWorkout
)
from .serializers import (
    WorkoutFavoriteSerializer, MealPlanFavoriteSerializer, WorkoutReviewSerializer,
    BodyMeasurementSerializer, AchievementSerializer, UserAchievementSerializer,
    UserPointsSerializer, ChallengeSerializer, NotificationSerializer,
    CouponSerializer, ReferralSerializer, SupportTicketSerializer, SupportTicketAdminSerializer, CoachSessionSerializer
)
from .ml_engine import get_ml_analysis
from fitness_project.utils.emails import (
    send_support_ticket_acknowledgement,
    send_support_ticket_internal_alert,
)


class FavoritesViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def workouts(self, request):
        favs = WorkoutFavorite.objects.filter(user=request.user).select_related('workout')
        return Response(WorkoutFavoriteSerializer(favs, many=True).data)

    @action(detail=False, methods=['post'])
    def toggle_workout(self, request):
        workout_id = request.data.get('workout_id')
        if not workout_id:
            return Response({'error': 'workout_id required'}, status=400)
        fav = WorkoutFavorite.objects.filter(user=request.user, workout_id=workout_id).first()
        if fav:
            fav.delete()
            return Response({'favorited': False})
        WorkoutFavorite.objects.create(user=request.user, workout_id=workout_id)
        return Response({'favorited': True})

    @action(detail=False, methods=['get'])
    def meal_plans(self, request):
        favs = MealPlanFavorite.objects.filter(user=request.user).select_related('meal_plan')
        return Response(MealPlanFavoriteSerializer(favs, many=True).data)

    @action(detail=False, methods=['post'])
    def toggle_meal_plan(self, request):
        meal_plan_id = request.data.get('meal_plan_id')
        if not meal_plan_id:
            return Response({'error': 'meal_plan_id required'}, status=400)
        fav = MealPlanFavorite.objects.filter(user=request.user, meal_plan_id=meal_plan_id).first()
        if fav:
            fav.delete()
            return Response({'favorited': False})
        MealPlanFavorite.objects.create(user=request.user, meal_plan_id=meal_plan_id)
        return Response({'favorited': True})


class ReviewViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def submit(self, request):
        workout_id = request.data.get('workout_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not workout_id or not rating:
            return Response({'error': 'workout_id and rating required'}, status=400)

        review, created = WorkoutReview.objects.update_or_create(
            user=request.user,
            workout_id=workout_id,
            defaults={'rating': rating, 'comment': comment}
        )

        # Update workout average rating
        from workouts.models import Workout
        workout = Workout.objects.get(id=workout_id)
        agg = WorkoutReview.objects.filter(workout=workout).aggregate(
            avg=__import__('django.db.models', fromlist=['Avg']).Avg('rating'),
            count=Count('id')
        )
        workout.rating = round(agg['avg'] or 0, 1)
        workout.total_reviews = agg['count']
        workout.save(update_fields=['rating', 'total_reviews'])

        return Response(WorkoutReviewSerializer(review).data, status=201 if created else 200)

    @action(detail=False, methods=['get'])
    def for_workout(self, request):
        workout_id = request.query_params.get('workout_id')
        if not workout_id:
            return Response({'error': 'workout_id required'}, status=400)
        reviews = WorkoutReview.objects.filter(workout_id=workout_id).select_related('user')
        return Response(WorkoutReviewSerializer(reviews, many=True).data)


class BodyMeasurementViewSet(viewsets.ModelViewSet):
    serializer_class = BodyMeasurementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BodyMeasurement.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        m = self.get_queryset().first()
        if not m:
            return Response({'message': 'No measurements yet'}, status=404)
        return Response(BodyMeasurementSerializer(m).data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        measurements = self.get_queryset()[:30]
        return Response(BodyMeasurementSerializer(measurements, many=True).data)


class GamificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        points, _ = UserPoints.objects.get_or_create(user=request.user)
        achievements = UserAchievement.objects.filter(user=request.user).select_related('achievement')
        all_achievements = Achievement.objects.filter(is_active=True)

        return Response({
            'points': UserPointsSerializer(points).data,
            'earned_achievements': UserAchievementSerializer(achievements, many=True).data,
            'total_achievements': all_achievements.count(),
            'earned_count': achievements.count(),
        })

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        top = UserPoints.objects.select_related('user').order_by('-total_points')[:20]
        data = []
        for i, p in enumerate(top, 1):
            data.append({
                'rank': i,
                'username': p.user.username,
                'first_name': p.user.first_name,
                'total_points': p.total_points,
                'level': p.level,
                'level_name': p.get_level_name(),
                'streak_days': p.streak_days,
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def all_achievements(self, request):
        all_ach = Achievement.objects.filter(is_active=True)
        earned_ids = set(
            UserAchievement.objects.filter(user=request.user).values_list('achievement_id', flat=True)
        )
        data = []
        for ach in all_ach:
            d = AchievementSerializer(ach).data
            d['earned'] = ach.id in earned_ids
            data.append(d)
        return Response(data)

    def list(self, request):
        """Standard list endpoint wrapping `all_achievements`.

        Returns 401 for unauthenticated users (consistent with other auth-protected endpoints).
        """
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=401)
        return self.all_achievements(request)


class ChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Challenge.objects.filter(is_active=True, end_date__gte=timezone.now())

    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        # Basic tier or higher required to join challenges
        from accounts.models import UserSubscription
        has_sub = UserSubscription.objects.filter(
            user=request.user, 
            status__in=['active', 'trial']
        ).exclude(tier__name__iexact='free').exists()
        
        if not has_sub and not request.user.is_staff:
            return Response({
                'error': 'Basic Protocol required to participate in Challenges. Upgrade to unlock.'
            }, status=403)

        challenge = self.get_object()
        _, created = ChallengeParticipation.objects.get_or_create(
            user=request.user, challenge=challenge
        )
        return Response({'joined': True, 'already_joined': not created})

    @action(detail=False, methods=['get'])
    def my_challenges(self, request):
        participations = ChallengeParticipation.objects.filter(
            user=request.user
        ).select_related('challenge')
        data = []
        for p in participations:
            d = ChallengeSerializer(p.challenge, context={'request': request}).data
            d['my_progress'] = p.progress
            d['completed'] = p.completed
            data.append(d)
        return Response(data)


class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def list_all(self, request):
        notifs = Notification.objects.filter(user=request.user)[:50]
        return Response(NotificationSerializer(notifs, many=True).data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        notif_id = request.data.get('notification_id')
        Notification.objects.filter(id=notif_id, user=request.user).update(is_read=True)
        return Response({'message': 'Marked as read'})

    def list(self, request):
        """Standard list endpoint to support GET /notifications/.

        Returns 401 for unauthenticated users.
        """
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=401)
        return self.list_all(request)


class CouponViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def validate(self, request):
        code = request.data.get('code', '').upper().strip()
        plan_id = request.data.get('plan_id')

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid coupon code'}, status=400)

        valid, message = coupon.is_valid()
        if not valid:
            return Response({'valid': False, 'error': message}, status=400)

        return Response({
            'valid': True,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
            'description': coupon.description,
        })


class AdUnlockViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def log_ad_view(self, request):
        """Log ad view, reward points, and update access for Free tier"""
        log = AdViewLog.objects.create(
            user=request.user,
            points_awarded=25 # reward points for watching an ad
        )
        
        # Update user points
        points, _ = UserPoints.objects.get_or_create(user=request.user)
        points.total_points += log.points_awarded
        points.save()
        
        # Update last_ad_view for weekly access check
        request.user.last_ad_view = timezone.now()
        request.user.save(update_fields=['last_ad_view'])
        
        return Response({
            'message': 'Points awarded and access refreshed',
            'points_earned': log.points_awarded,
            'total_points': points.total_points
        })

    @action(detail=False, methods=['post'])
    def unlock_item(self, request):
        """Unlock a specific workout or meal plan for 7 days using points"""
        workout_id = request.data.get('workout_id')
        meal_plan_id = request.data.get('meal_plan_id')
        
        cost = 100 # Cost in points to unlock for a week
        
        points, _ = UserPoints.objects.get_or_create(user=request.user)
        if points.total_points < cost:
            return Response({'error': 'Insufficient points'}, status=400)
        
        points.total_points -= cost
        points.save()
        
        expiry = timezone.now() + timezone.timedelta(days=7)
        unlock = ItemUnlock.objects.create(
            user=request.user,
            workout_id=workout_id,
            meal_plan_id=meal_plan_id,
            expires_at=expiry
        )
        
        return Response({
            'message': 'Item unlocked for 7 days',
            'expires_at': expiry,
            'remaining_points': points.total_points
        })

class CoachViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def get_coach_clients(self, request):
        if request.user.role != 'coach':
            return Response({'error': 'Unauthorized'}, status=403)
        clients = request.user.clients.all()
        from accounts.serializers import CustomUserSerializer
        return Response(CustomUserSerializer(clients, many=True).data)

    @action(detail=False, methods=['get'])
    def payout_summary(self, request):
        if request.user.role != 'coach':
            return Response({'error': 'Unauthorized'}, status=403)

        payouts = CoachPayout.objects.filter(coach=request.user).select_related('client', 'payment')
        paid_total = payouts.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        pending_total = payouts.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
        recent = payouts[:5]

        return Response({
            'coach': {
                'id': str(request.user.id),
                'username': request.user.username,
                'full_name': request.user.get_full_name() or request.user.username,
            },
            'summary': {
                'total_payouts': payouts.count(),
                'paid_total': float(paid_total),
                'pending_total': float(pending_total),
                'combined_total': float(paid_total + pending_total),
            },
            'recent_payouts': [
                {
                    'id': str(p.id),
                    'client_name': p.client.get_full_name() or p.client.username,
                    'amount': float(p.amount),
                    'commission_rate': float(p.commission_rate),
                    'status': p.status,
                    'created_at': p.created_at,
                }
                for p in recent
            ],
        })

    @action(detail=True, methods=['post'])
    def customize_workout(self, request, pk=None):
        """Clone a library workout and tweak it for a specific client"""
        if request.user.role != 'coach':
            return Response({'error': 'Only coaches can customize plans'}, status=403)
            
        client_id = pk
        original_workout_id = request.data.get('workout_id')
        custom_data = request.data.get('data') # Tweak exercises etc
        
        from workouts.models import Workout
        original = Workout.objects.get(id=original_workout_id)
        
        custom = CustomizedWorkout.objects.create(
            client_id=client_id,
            coach=request.user,
            original_workout=original,
            title=request.data.get('title', f"Personalized: {original.title}"),
            description=request.data.get('description', original.description),
            data=custom_data or original.workout_data
        )
        
        return Response({'message': 'Custom workout created for client', 'id': custom.id})

class ReminderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def check_reminders(self, request):
        """Check if user missed their 'usual' window and suggest workout"""
        from workouts.models import UserWorkoutProgress
        logs = UserWorkoutProgress.objects.filter(
            user=request.user, 
            completed=True,
            completed_date__isnull=False
        ).order_by('-completed_date')[:5]
        
        if not logs:
            return Response({'remind': False})
            
        # Calculate average start time
        import datetime
        times = [log.completed_date.time() for log in logs]
        # simplified avg calculation for demo
        avg_hour = sum(t.hour for t in times) / len(times)
        
        now = timezone.now()
        if now.hour > avg_hour + 2:
            # User is late!
            return Response({
                'remind': True,
                'message': "Don't break your streak! You usually work out around this time.",
                'avg_time': f"{int(avg_hour)}:00"
            })
            
        return Response({'remind': False})

class ReferralViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_referral(self, request):
        referral, _ = Referral.objects.get_or_create(
            referrer=request.user,
            defaults={
                'referral_code': _generate_code(),
                'status': 'pending',
            }
        )
        return Response(ReferralSerializer(referral).data)


class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.select_related('user').all()

    def get_serializer_class(self):
        if self.request and self.request.user.is_staff:
            return SupportTicketAdminSerializer
        return SupportTicketSerializer

    def get_permissions(self):
        if self.action in ['submit', 'create']:
            return [AllowAny()]
        if self.action == 'my_tickets':
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SupportTicket.objects.select_related('user').all()
        if self.request.user.is_authenticated:
            return SupportTicket.objects.select_related('user').filter(user=self.request.user)
        return SupportTicket.objects.none()

    def perform_create(self, serializer):
        ticket = serializer.save(user=self.request.user if self.request.user.is_authenticated else None)
        ticket.auto_triage()
        ticket.save(update_fields=['category', 'status', 'priority', 'admin_notes', 'triaged_at', 'updated_at'])
        send_support_ticket_acknowledgement(ticket)
        send_support_ticket_internal_alert(ticket)

    @action(detail=False, methods=['post'])
    def submit(self, request):
        serializer = SupportTicketSerializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({'message': 'Support ticket submitted. We will respond within 24 hours.'}, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        tickets = self.get_queryset()
        return Response(SupportTicketSerializer(tickets, many=True).data)

def _generate_code():
    import random, string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class AICoachViewSet(viewsets.ViewSet):
    """Tier-gated AI coaching powered by Google Gemini."""
    permission_classes = [IsAuthenticated]

    def _rate_limit_key(self, user_id):
        window = timezone.now().strftime('%Y%m%d%H%M')
        return f'ai_coach_rl:{user_id}:{window}'

    def _check_rate_limit(self, user):
        """Allow at most 3 AI requests per minute per user."""
        key = self._rate_limit_key(user.id)
        current_count = cache.get(key, 0)
        if current_count >= 3:
            return False, current_count
        cache.set(key, current_count + 1, timeout=70)
        return True, current_count + 1

    def _normalize_tier(self, tier):
        """Normalize subscription tier name for AI coach.

        Keep `custom` distinct so we can unlock extra custom-plan features.
        """
        return (tier or 'free').lower()


    def _get_user_tier(self, user):
        # Superadmin and staff always get Elite access for testing
        if user.is_superuser or user.is_staff:
            return 'elite'
        try:
            from accounts.models import UserSubscription
            sub = UserSubscription.objects.filter(
                user=user, status__in=['active', 'trial']
            ).select_related('subscription_plan__tier').order_by('-created_at').first()
            if sub and sub.subscription_plan and sub.subscription_plan.tier:
                return self._normalize_tier(sub.subscription_plan.tier.name)
        except Exception:
            pass
        return 'free'

    def _get_system_prompt(self, tier, user):
        tier = self._normalize_tier(tier)
        base = (
            "You are FitCoachAI, a specialized high-performance Health & Fitness expert. "
            "Your intelligence is strictly focused on: "
            "1. Physical Training (Gym, Home, Sports, Recovery, Anatomy, Bio-mechanics). "
            "2. Nutrition (Macros, Recipes, Supplements, Hydration, Metabolic health). "
            "3. Mental Well-being (Motivation, Sleep, Stress, Focus, Habit-building). "
            "\n"
            "STRICT RELEVANCE FILTER: You are PROHIBITED from answering anything outside these 3 domains. "
            "This includes Technology, News, Politics, Pop Culture, Academic subjects, or General Q&A. "
            "If a user asks an off-topic question, give a short refusal and ask about their fitness progress. "
            "Never compromise your specialty. Your time and intelligence belong ONLY to the user's health journey."
        )
        if tier == 'basic':
            profile = self._get_user_profile(user)
            history = self._get_user_history(user)
            return (
                f"{base} You are assisting a Basic member. "
                f"User profile: {profile}. Recent activity: {history}. "
                "Provide personalized fitness guidance, workout tips, and nutrition advice. "
                "Give concrete next-step suggestions based on what they trained most recently."
            )
        elif tier == 'pro':
            profile = self._get_user_profile(user)
            return (
                f"{base} You are a Pro-tier fitness coach. "
                f"User profile: {profile}. "
                "Provide personalised advice based on their goals and current program. "
                "You can suggest workout modifications, diet adjustments, and recovery tips. "
                "For 3x/week coaching or emergency adjustments, let them know Elite is available."
            )
        elif tier == 'elite':
            profile = self._get_user_profile(user)
            history = self._get_user_history(user)
            return (
                f"{base} You are a dedicated Elite personal coach. "
                f"Full user profile: {profile}. Recent activity: {history}. "
                "Provide in-depth, highly personalised coaching. You can discuss form, "
                "periodisation, nutrition timing, recovery protocols, sleep, and mental focus. "
                "Be direct, specific, and treat this user as your top priority client."
            )
        return base

    def _get_user_profile(self, user):
        try:
            from .models import BodyMeasurement, UserPoints
            from workouts.models import UserWorkoutProgress
            m = BodyMeasurement.objects.filter(user=user).order_by('-date').first()
            goals = getattr(user, 'fitness_goals', 'general fitness')
            weight = f"{m.weight}kg" if m and m.weight else "not recorded"
            progress_qs = UserWorkoutProgress.objects.filter(user=user, completed=True)
            completed = progress_qs.count()
            calories = progress_qs.aggregate(total=Sum('calories_burnt'))['total'] or 0
            minutes = progress_qs.aggregate(total=Sum('duration_minutes'))['total'] or 0
            points, _ = UserPoints.objects.get_or_create(user=user)
            
            # Fetch recent measurement trends
            measurements = BodyMeasurement.objects.filter(user=user).order_by('-date')[:3]
            m_list = [f"{m.weight}kg on {m.date}" for m in measurements if m.weight]
            
            return (
                f"Name: {user.first_name or user.username}, "
                f"Goals: {goals}, Weight History: {', '.join(m_list) or 'None'}, "
                f"Completed workouts: {completed}, Calories burned: {calories}, "
                f"Training minutes: {minutes}, Streak: {points.streak_days}, Level: {points.get_level_name()}"
            )
        except Exception:
            return f"User: {user.username}"

    def _get_user_history(self, user):
        try:
            from workouts.models import WorkoutProgress
            recent = WorkoutProgress.objects.filter(
                user=user
            ).order_by('-completed_at')[:5]
            if recent:
                return ", ".join([
                    f"{p.workout.title} ({p.completed_at.strftime('%b %d')})"
                    for p in recent if p.workout
                ])
        except Exception:
            pass
        return "No recent workout data"

    def _get_ai_snapshot(self, user):
        try:
            from .models import BodyMeasurement, UserPoints
            from workouts.models import UserWorkoutProgress

            progress_qs = UserWorkoutProgress.objects.filter(user=user, completed=True).order_by('-created_at')
            completed = progress_qs.count()
            calories = progress_qs.aggregate(total=Sum('calories_burnt'))['total'] or 0
            minutes = progress_qs.aggregate(total=Sum('duration_minutes'))['total'] or 0
            
            # CALCULATE VOLUME (Premium Metric)
            from workouts.models import WorkoutSet
            total_volume = WorkoutSet.objects.filter(progress__user=user, is_completed=True).aggregate(
                vol=Sum(F('weight') * F('reps'))
            )['vol'] or 0
            
            # Recent Volume Trend (Last 3 vs Previous 3)
            recent_sets = WorkoutSet.objects.filter(progress__user=user, is_completed=True).order_by('-completed_at')
            recent_vol = recent_sets[:15].aggregate(vol=Sum(F('weight') * F('reps')))['vol'] or 0
            prev_vol = recent_sets[15:30].aggregate(vol=Sum(F('weight') * F('reps')))['vol'] or 0
            vol_trend = recent_vol - prev_vol if prev_vol > 0 else 0

            recent = list(progress_qs.select_related('workout')[:3])
            points, _ = UserPoints.objects.get_or_create(user=user)
            measurements = list(BodyMeasurement.objects.filter(user=user).order_by('-date')[:2])
            body = measurements[0] if measurements else None
            previous_body = measurements[1] if len(measurements) > 1 else None
            
            # Normalize Goal
            raw_goal = getattr(user, 'fitness_goal', None) or getattr(getattr(user, 'profile', None), 'goals', None) or 'general fitness'
            goal = str(raw_goal).lower()
            
            weight_trend = None
            if body and previous_body and body.weight and previous_body.weight:
                weight_trend = round(float(body.weight) - float(previous_body.weight), 1)
            
            return {
                'completed': completed,
                'calories': calories,
                'minutes': minutes,
                'total_volume': total_volume,
                'vol_trend': vol_trend,
                'streak': points.streak_days,
                'level': points.get_level_name(),
                'goal': goal,
                'weight': body.weight if body and body.weight else None,
                'body_fat': body.body_fat_percentage if body and body.body_fat_percentage is not None else None,
                'weight_trend': weight_trend,
                'latest_measurement_date': body.date.strftime('%b %d') if body else None,
                'recent': recent,
            }
        except Exception:
            return {
                'completed': 0,
                'calories': 0,
                'minutes': 0,
                'streak': 0,
                'level': 'Initiate',
                'goal': 'general fitness',
                'weight': None,
                'body_fat': None,
                'weight_trend': None,
                'latest_measurement_date': None,
                'recent': [],
            }

    def _build_fallback_reply(self, user, tier, message):
        tier = self._normalize_tier(tier)
        snapshot = self._get_ai_snapshot(user)
        recent_title = None
        if snapshot['recent']:
            recent_title = getattr(snapshot['recent'][0].workout, 'title', None)

        message_lower = (message or '').lower()
        goal = str(snapshot.get('goal') or '').lower()

        if any(term in message_lower for term in ['measurement', 'measurements', 'body fat', 'weight', 'scale', 'progress']):
            weight_text = f"{snapshot['weight']}" if snapshot['weight'] is not None else 'not recorded yet'
            body_fat_text = f"{snapshot['body_fat']}%" if snapshot['body_fat'] is not None else 'not recorded yet'
            trend_text = ''
            if snapshot['weight_trend'] is not None:
                direction = 'up' if snapshot['weight_trend'] > 0 else 'down'
                trend_text = f" Your weight is {direction} by {abs(snapshot['weight_trend'])} since the previous check."
            next_step = 'keep your calories tight and add one strength session plus a walking block tomorrow' if 'lose' in goal else 'keep protein high and push a progressive strength session tomorrow' if 'gain' in goal else 'stay consistent with one quality workout and a recovery walk tomorrow'
            return (
                f"Your latest check-in shows weight {weight_text} and body fat {body_fat_text}.{trend_text} "
                f"Based on your goal, {next_step}."
            )

        if any(term in message_lower for term in ['stat', 'progress', 'overview', 'summary']):
            return (
                f"Here is your current training overview: {snapshot['completed']} completed workouts, "
                f"{snapshot['minutes']} training minutes, {snapshot['calories']} calories burnt, "
                f"and a {snapshot['streak']}-day streak. "
                f"Your latest weight snapshot is {snapshot['weight'] or 'not recorded'}. "
                f"Next step: keep the streak alive and add one quality session this week."
            )

        if any(term in message_lower for term in ['workout', 'train', 'training', 'next', 'today', 'plan']):
            # Plan a task looking at measurements and goal
            weight = snapshot.get('weight')
            goal = str(snapshot.get('goal') or '').lower()
            
            if recent_title:
                # If they already did a workout, suggest progression or variation
                progression = "+1 set or +5lbs" if 'gain' in goal else "shorter rest periods" if 'lose' in goal else "perfected form"
                return (
                    f"Great job on {recent_title}! For tomorrow, let's build on that baseline. "
                    f"Since your goal is {goal or 'fitness'}, I suggest a session with {progression}. "
                    f"Focus on compound movements: Push, Pull, Legs, and Core. "
                    f"Log your performance so I can calculate your next load increase."
                )
            
            # If no recent workout, give the baseline session but mention measurements
            measurement_note = ""
            if weight:
                measurement_note = f"Looking at your current weight of {weight}lbs, "
            
            return (
                f"{measurement_note}Let's start with a full-body baseline session: "
                f"Push (Push-ups/Bench), Pull (Rows/Pull-ups), Legs (Squats/Lunges), and Core (Plank). "
                f"Keep intensity at 7/10. Log this workout so I can tailor your next day suggestion specifically to your performance."
            )

        if any(term in message_lower for term in ['nutrition', 'diet', 'meal', 'food']):
            goal = str(snapshot.get('goal') or '').lower()
            protein_goal = "1.2g per lb of bodyweight" if 'gain' in goal else "1g per lb"
            return (
                f"For your {goal or 'fitness'} goal, aim for {protein_goal} of protein daily. "
                "Place most of your complex carbs (oats, rice, sweet potatoes) around your training window. "
                "Stay hydrated and log your meals in the nutrition tab for a full macro breakdown."
            )

        if any(term in message_lower for term in ['recover', 'sleep', 'rest', 'sore']):
            return (
                "Recovery is where the growth happens. Prioritize 7-9 hours of sleep. "
                "If you're feeling extra sore, swap tomorrow's session for a 30-minute zone 2 walk and some mobility work. "
                "Don't skip the protein even on rest days!"
            )

        if tier == 'elite':
            return (
                f"Elite Protocol Status: {snapshot['completed']} workouts completed, {snapshot['streak']}-day streak. "
                f"Your latest weight trend is {snapshot['weight_trend'] or 'stable'}. "
                "Next high-impact move: Hit a 45-minute strength session tomorrow focusing on eccentric control. "
                "I'm monitoring your data for the next program adjustment."
            )

        if tier == 'pro':
            return (
                f"Pro Status: {snapshot['completed']} sessions logged. Your current level is {snapshot['level']}. "
                "Consistency is key. Tomorrow, stick to the plan and aim for one small improvement over your last session."
            )

        return (
            f"You've logged {snapshot['completed']} workouts so far. Keep that {snapshot['streak']}-day streak alive! "
            "Your next step is to complete a full-body baseline session and log it so I can adapt your protocol."
        )

    @action(detail=False, methods=['get'])
    def history(self, request):
        from .models import AIChatMessage
        from django.utils import timezone
        from datetime import timedelta
        
        # Only fetch messages from the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Get last 20 messages within the 30-day window
        messages = AIChatMessage.objects.filter(
            user=request.user, 
            timestamp__gte=thirty_days_ago
        ).order_by('-timestamp')[:20]
        
        data = [{'role': m.role, 'text': m.text, 'timestamp': m.timestamp} for m in reversed(messages)]
        return Response(data)

    @action(detail=False, methods=['get'])
    def analyze_and_suggest(self, request):
        """Advanced data analysis and recommendation engine

        Analytics/ML is disabled for Free/Basic users.
        Only Elite/Pro/Custom receive ML analytics.
        """
        user = request.user

        tier = self._get_user_tier(user)
        tier_normalized = self._normalize_tier(tier)
        is_premium = tier_normalized in ['pro', 'elite', 'custom']
        
        # STRICT TIER GATE: Only Pro/Elite/Custom get the Neural Engine
        if not is_premium:
            return Response({
                'is_locked': True,
                'message': 'Advanced Neural Analysis is exclusive to Pro, Elite, and Custom Protocols.',
                'upgrade_target': 'Pro Protocol',
                'preview_signals': ['Metabolic Profiling', 'Neural Load Modeling', 'Progressive Overload Prediction']
            }, status=200) # Use 200 so the frontend can show a 'locked' UI instead of an error

        snapshot = self._get_ai_snapshot(user)
        model_insight = get_ml_analysis(snapshot)

        # 1. Measurement Analysis
        weight = snapshot.get('weight')
        trend = snapshot.get('weight_trend')
        goal = str(snapshot.get('goal') or '').lower()
        
        analysis = []
        
        if weight:
            if trend is not None:
                if trend > 0:
                    analysis.append(f"Metabolic Signal: Weight is trending UP (+{trend}kg).")
                elif trend < 0:
                    analysis.append(f"Metabolic Signal: Weight is trending DOWN ({trend}kg).")
                else:
                    analysis.append("Metabolic Signal: Weight is STABLE.")
            else:
                analysis.append(f"Initial Check-in: Weight is {weight}kg. Establishing baseline.")
        else:
            analysis.append("Awaiting Bio-metric Calibration: Please log your weight to start metabolic tracking.")
        
        # 2. Performance Analysis
        completed = snapshot.get('completed', 0)
        if completed > 0:
            analysis.append(f"Neural Load: Training consistency is high ({completed} sessions logged).")
        else:
            analysis.append("Ready for Initial Stimulus: No training history detected. The first 3 sessions are vital for calibration.")

        # 3. Model Scoring
        engine_name = "Elite Neural Engine"
        confidence = model_insight['model_confidence']
        
        # 4. Final Verdict / Suggested Solution
        suggested_solution = model_insight['suggested_solution']
        if not suggested_solution or (completed == 0 and not weight):
            suggested_solution = "Initiate Protocol: Complete your first workout and log your weight. The engine is ready to model your transformation path."

        return Response({
            'is_locked': False,
            'analysis': analysis,
            'suggested_solution': suggested_solution,
            'next_step': "Log tomorrow's workout for a 15% increase in model accuracy.",
            'model_name': engine_name,
            'model_score': model_insight['model_score'] or 65,
            'model_confidence': confidence,
            'training_samples': model_insight['training_samples'] or 1500,
            'recommended_focus': model_insight['recommended_focus'] or 'calibration',
            'supporting_signals': model_insight['supporting_signals'] or ["Awaiting initial data points"],
            'is_premium_engine': True
        })

    @action(detail=False, methods=['post'])
    def chat(self, request):
        from .models import AIUsage, AIChatMessage
        from django.utils import timezone
        from datetime import date
        
        tier = self._get_user_tier(request.user)
        is_admin = request.user.is_staff or request.user.is_superuser

        if not is_admin:
            allowed, _ = self._check_rate_limit(request.user)
            if not allowed:
                return Response({
                    'error': 'rate_limited',
                    'message': 'Please wait a moment before sending another AI message.',
                }, status=429)
        
        # Define Tier Limits (Daily and Monthly)
        TIER_LIMITS = {
            'free': {'daily': 5, 'monthly': 100},
            'pro': {'daily': 20, 'monthly': 400},
            'elite': {'daily': 50, 'monthly': 1000},
            'custom': {'daily': 100, 'monthly': 2000},
        }

        
        # Check Daily Usage (Admins get a pass)
        today = timezone.now().date()
        usage_record, _ = AIUsage.objects.get_or_create(user=request.user, date=today)
        
        tier_normalized = self._normalize_tier(tier)
        tier_config = TIER_LIMITS.get(tier_normalized, TIER_LIMITS['free'])
        daily_limit = tier_config['daily']
        monthly_limit = tier_config['monthly']
        
        # Initialize monthly tracking
        if not usage_record.month_date or usage_record.month_date.replace(day=1) != today.replace(day=1):
            usage_record.month_date = today.replace(day=1)
            usage_record.monthly_count = 0
        
        # Check daily limit
        if not is_admin and usage_record.count >= daily_limit:
            return Response({
                'error': 'daily_limit_reached',
                'message': f"⚡ You've reached your daily limit of {daily_limit} messages. Your coaching energy refills tomorrow!",
                'quota': {
                    'daily_limit': daily_limit,
                    'daily_used': usage_record.count,
                    'daily_remaining': 0,
                    'monthly_limit': monthly_limit,
                    'monthly_used': usage_record.monthly_count,
                    'monthly_remaining': max(0, monthly_limit - usage_record.monthly_count),
                }
            }, status=403)
        
        # Check monthly limit
        if not is_admin and usage_record.monthly_count >= monthly_limit:
            return Response({
                'error': 'monthly_limit_reached',
                'message': f"📅 You've reached your monthly limit of {monthly_limit} messages. Next cycle starts on the 1st!",
                'quota': {
                    'daily_limit': daily_limit,
                    'daily_used': usage_record.count,
                    'daily_remaining': max(0, daily_limit - usage_record.count),
                    'monthly_limit': monthly_limit,
                    'monthly_used': usage_record.monthly_count,
                    'monthly_remaining': 0,
                }
            }, status=403)

        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({'error': 'message is required'}, status=400)

        # SAVE USER MESSAGE
        AIChatMessage.objects.create(user=request.user, role='user', text=message)

        # LOAD RECENT HISTORY (Last 10 for AI context)
        recent_messages = AIChatMessage.objects.filter(user=request.user).order_by('-timestamp')[:11] # 11 because we just added 1
        history_context = []
        # We process in reverse to get chronological
        for m in reversed(recent_messages):
            if m.text != message: # Don't duplicate current message in context loop if already handled
                history_context.append({'role': m.role, 'text': m.text})

        from django.conf import settings as ds
        import logging
        logger = logging.getLogger(__name__)
        system_prompt = self._get_system_prompt(tier, request.user)

        # Gather keys
        gemini_keys = [k.strip() for k in str(getattr(ds, 'GEMINI_API_KEY', '')).split(',') if k.strip()]
        groq_keys = [k.strip() for k in str(getattr(ds, 'GROQ_API_KEY', '')).split(',') if k.strip()]
        openai_keys = [k.strip() for k in str(getattr(ds, 'OPENAI_API_KEY', '')).split(',') if k.strip()]
        claude_keys = [k.strip() for k in str(getattr(ds, 'CLAUDE_API_KEY', '')).split(',') if k.strip()]

        providers = []
        for k in gemini_keys: providers.append({'type': 'gemini', 'key': k})
        for k in groq_keys: providers.append({'type': 'groq', 'key': k})
        for k in openai_keys: providers.append({'type': 'openai', 'key': k})
        for k in claude_keys: providers.append({'type': 'claude', 'key': k})

        if not providers:
            fallback_reply = self._build_fallback_reply(request.user, tier, message)
            usage_record.count += 1
            usage_record.save()
            AIChatMessage.objects.create(user=request.user, role='model', text=fallback_reply)
            return Response({'reply': fallback_reply, 'tier': tier, 'provider': 'fallback', 'usage_today': usage_record.count})

        import random
        random.shuffle(providers)

        last_error = None
        for p in providers:
            try:
                resp_text = None
                prov_name = p['type']

                if p['type'] == 'gemini':
                    from google import genai
                    from google.genai import types
                    client = genai.Client(api_key=p['key'], http_options={'timeout': 10000})
                    contents = []
                    for msg in history_context:
                        role = 'user' if msg.get('role') == 'user' else 'model'
                        contents.append(types.Content(role=role, parts=[types.Part(text=msg.get('text', ''))]))
                    contents.append(types.Content(role='user', parts=[types.Part(text=message)]))
                    response = client.models.generate_content(
                        model='gemini-1.5-flash',
                        contents=contents,
                        config=types.GenerateContentConfig(system_instruction=system_prompt, max_output_tokens=800),
                    )
                    resp_text = response.text

                elif p['type'] == 'groq':
                    from openai import OpenAI
                    client = OpenAI(api_key=p['key'], base_url="https://api.groq.com/openai/v1", timeout=5.0)
                    messages = [{"role": "system", "content": system_prompt}]
                    for msg in history_context:
                        role = "user" if msg.get('role') == 'user' else "assistant"
                        messages.append({"role": role, "content": msg.get('text', '')})
                    messages.append({"role": "user", "content": message})
                    response = client.chat.completions.create(model="llama-3.3-70b-versatile", messages=messages, max_tokens=800)
                    resp_text = response.choices[0].message.content

                elif p['type'] == 'openai':
                    from openai import OpenAI
                    client = OpenAI(api_key=p['key'], timeout=5.0)
                    messages = [{"role": "system", "content": system_prompt}]
                    for msg in history_context:
                        role = "user" if msg.get('role') == 'user' else "assistant"
                        messages.append({"role": role, "content": msg.get('text', '')})
                    messages.append({"role": "user", "content": message})
                    response = client.chat.completions.create(model="gpt-4o-mini", messages=messages, max_tokens=800)
                    resp_text = response.choices[0].message.content

                elif p['type'] == 'claude':
                    from anthropic import Anthropic
                    client = Anthropic(api_key=p['key'], timeout=5.0)
                    messages = []
                    for msg in history_context:
                        role = "user" if msg.get('role') == 'user' else "assistant"
                        messages.append({"role": role, "content": msg.get('text', '')})
                    messages.append({"role": "user", "content": message})
                    response = client.messages.create(model="claude-3-haiku-20240307", max_tokens=800, system=system_prompt, messages=messages)
                    resp_text = response.content[0].text

                if resp_text:
                    # SUCCESS: SAVE AI RESPONSE
                    AIChatMessage.objects.create(user=request.user, role='model', text=resp_text)
                    usage_record.count += 1
                    usage_record.monthly_count += 1
                    usage_record.save()
                    return Response({
                        'reply': resp_text,
                        'tier': tier_normalized,
                        'provider': prov_name,
                        'quota': {
                            'daily_limit': daily_limit,
                            'daily_used': usage_record.count,
                            'daily_remaining': max(0, daily_limit - usage_record.count),
                            'monthly_limit': monthly_limit,
                            'monthly_used': usage_record.monthly_count,
                            'monthly_remaining': max(0, monthly_limit - usage_record.monthly_count),
                        }
                    })

            except Exception as e:
                last_error = e
                logger.warning(f"AI Provider Failover: {p['type']} failed - {str(e)[:50]}")
                continue

        fallback_reply = self._build_fallback_reply(request.user, tier_normalized, message)
        AIChatMessage.objects.create(user=request.user, role='model', text=fallback_reply)
        usage_record.count += 1
        usage_record.monthly_count += 1
        usage_record.save()
        return Response({
            'reply': fallback_reply,
            'tier': tier_normalized,
            'provider': 'fallback',
            'quota': {
                'daily_limit': daily_limit,
                'daily_used': usage_record.count,
                'daily_remaining': max(0, daily_limit - usage_record.count),
                'monthly_limit': monthly_limit,
                'monthly_used': usage_record.monthly_count,
                'monthly_remaining': max(0, monthly_limit - usage_record.monthly_count),
            },
            'error_detail': str(last_error) if getattr(ds, 'DEBUG', False) else None,
        })

    @action(detail=False, methods=['get'])
    def quota(self, request):
        """Get current AI message quota for the user"""
        from .models import AIUsage
        from django.utils import timezone
        from datetime import timedelta
        
        tier = self._get_user_tier(request.user)
        tier_normalized = self._normalize_tier(tier)
        
        TIER_LIMITS = {
            'free': {'daily': 5, 'monthly': 100},
            'pro': {'daily': 20, 'monthly': 400},
            'elite': {'daily': 50, 'monthly': 1000},
            'custom': {'daily': 100, 'monthly': 2000},
        }
        
        tier_config = TIER_LIMITS.get(tier_normalized, TIER_LIMITS['free'])
        today = timezone.now().date()
        usage_record, _ = AIUsage.objects.get_or_create(user=request.user, date=today)
        
        # Initialize monthly tracking if needed
        if not usage_record.month_date or usage_record.month_date.replace(day=1) != today.replace(day=1):
            usage_record.month_date = today.replace(day=1)
            usage_record.monthly_count = 0
            usage_record.save()
        
        return Response({
            'tier': tier_normalized,
            'quota': {
                'daily_limit': tier_config['daily'],
                'daily_used': usage_record.count,
                'daily_remaining': max(0, tier_config['daily'] - usage_record.count),
                'monthly_limit': tier_config['monthly'],
                'monthly_used': usage_record.monthly_count,
                'monthly_remaining': max(0, tier_config['monthly'] - usage_record.monthly_count),
                'reset_date': (today.replace(day=1) + timedelta(days=32)).replace(day=1),
            }
        })

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get AI chat history for the user"""
        from .models import AIChatMessage
        from django.core.paginator import Paginator
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        messages = AIChatMessage.objects.filter(user=request.user).order_by('-timestamp')
        paginator = Paginator(messages, page_size)
        
        try:
            page_obj = paginator.page(page)
        except Exception:
            return Response({'error': 'Invalid page'}, status=400)
        
        from .serializers import AIChatMessageSerializer
        serializer = AIChatMessageSerializer(page_obj.object_list, many=True)
        
        return Response({
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'results': serializer.data
        })


class CoachSessionViewSet(viewsets.ModelViewSet):
    serializer_class = CoachSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'coach':
            return CoachSession.objects.filter(coach=user).order_by('scheduled_at')
        return CoachSession.objects.filter(client=user).order_by('scheduled_at')

    @action(detail=False, methods=['get'])
    def my_sessions(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        session = self.get_object()
        user = request.user
        decision = (request.data.get('decision') or '').lower()

        if user not in [session.client, session.coach]:
            return Response({'error': 'You are not allowed to respond to this session'}, status=status.HTTP_403_FORBIDDEN)

        if decision not in ['accept', 'decline', 'counter']:
            return Response({'error': 'decision must be accept, decline, or counter'}, status=status.HTTP_400_BAD_REQUEST)

        if decision == 'counter':
            new_time = request.data.get('scheduled_at')
            if not new_time:
                return Response({'error': 'scheduled_at is required for counter proposals'}, status=status.HTTP_400_BAD_REQUEST)
            session.scheduled_at = new_time
            session.duration_minutes = int(request.data.get('duration_minutes', session.duration_minutes))
            session.status = 'pending_approval'
            session.requested_by = user
            session.meeting_link = ''
            session.save()
            return Response(CoachSessionSerializer(session).data)

        if decision == 'decline':
            session.status = 'canceled'
            session.save(update_fields=['status'])
            return Response(CoachSessionSerializer(session).data)

        session.status = 'scheduled'
        if not session.meeting_link:
            room_name = f"FitCoachPro_{session.client.username}_{session.coach.username}_{session.id.hex[:12]}"
            session.meeting_link = f'https://meet.jit.si/{room_name}'
        session.save(update_fields=['status', 'meeting_link'])
        return Response(CoachSessionSerializer(session).data)

    def create(self, request, *args, **kwargs):
        # Coach can directly schedule for assigned clients.
        if request.user.role == 'coach':
            client_id = request.data.get('client_id')
            scheduled_at = request.data.get('scheduled_at')
            if not client_id or not scheduled_at:
                return Response({'error': 'client_id and scheduled_at are required'}, status=status.HTTP_400_BAD_REQUEST)

            from accounts.models import CustomUser
            client = CustomUser.objects.filter(id=client_id, assigned_coach=request.user).first()
            if not client:
                return Response({'error': 'Client not assigned to this coach'}, status=status.HTTP_403_FORBIDDEN)

            session = CoachSession.objects.create(
                client=client,
                coach=request.user,
                scheduled_at=scheduled_at,
                duration_minutes=int(request.data.get('duration_minutes', 30)),
                status='pending_approval',
                requested_by=request.user,
                meeting_link=''
            )
            return Response(CoachSessionSerializer(session).data, status=status.HTTP_201_CREATED)

        # 1. Determine Tier
        # We can reuse the logic from AICoachViewSet
        def _get_tier(user):
            if user.is_superuser or user.is_staff: return 'elite'
            try:
                from accounts.models import UserSubscription
                sub = UserSubscription.objects.filter(
                    user=user, status__in=['active', 'trial']
                ).select_related('subscription_plan__tier').order_by('-created_at').first()
                if sub and sub.subscription_plan and sub.subscription_plan.tier:
                    return sub.subscription_plan.tier.name.lower()
            except: pass
            return 'free'

        tier = _get_tier(request.user)

        # 2. Check limits based on Tier
        if tier == 'free':
            return Response({'error': 'Coaching sessions require Elite or Custom tier.'}, status=status.HTTP_403_FORBIDDEN)

        limit = 2
        try:
            from subscriptions.models import SubscriptionTier
            tier_row = SubscriptionTier.objects.filter(name=tier).first()
            if tier_row and tier_row.video_sessions_per_month:
                limit = tier_row.video_sessions_per_month
        except Exception:
            pass

        # Check how many sessions this month
        from django.utils import timezone
        from datetime import datetime
        
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        session_count = CoachSession.objects.filter(
            client=request.user,
            scheduled_at__gte=start_of_month,
            status__in=['pending_approval', 'scheduled', 'completed', 'reschedule_requested']
        ).count()

        if session_count >= limit:
            return Response({'error': f'You have reached your monthly limit of {limit} session(s).'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Create Session
        scheduled_at = request.data.get('scheduled_at')
        if not scheduled_at:
            return Response({'error': 'scheduled_at is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Default to the first superuser as coach for demo purposes
        from accounts.models import CustomUser
        coach = CustomUser.objects.filter(is_staff=True).first()

        session = CoachSession.objects.create(
            client=request.user,
            coach=coach if coach else request.user, # Fallback
            scheduled_at=scheduled_at,
            duration_minutes=int(request.data.get('duration_minutes', 30)),
            status='pending_approval',
            requested_by=request.user,
            meeting_link=''
        )

        return Response(CoachSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        session = self.get_object()
        if session.status == 'canceled':
            return Response({'message': 'Already canceled'}, status=status.HTTP_400_BAD_REQUEST)
        
        session.status = 'canceled'
        session.save()
        return Response({'message': 'Session cancelled successfully'})
