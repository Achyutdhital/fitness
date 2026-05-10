from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Sum, Count

from .models import (
    WorkoutFavorite, MealPlanFavorite, WorkoutReview,
    BodyMeasurement, Achievement, UserAchievement, UserPoints,
    Challenge, ChallengeParticipation, Notification,
    Coupon, Referral, SupportTicket,
)
from .serializers import (
    WorkoutFavoriteSerializer, MealPlanFavoriteSerializer, WorkoutReviewSerializer,
    BodyMeasurementSerializer, AchievementSerializer, UserAchievementSerializer,
    UserPointsSerializer, ChallengeSerializer, NotificationSerializer,
    CouponSerializer, ReferralSerializer, SupportTicketSerializer,
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


class ChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Challenge.objects.filter(is_active=True, end_date__gte=timezone.now())

    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
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

    def get_coach_clients(self, request):
        if request.user.role != 'coach':
            return Response({'error': 'Unauthorized'}, status=403)
        clients = request.user.clients.all()
        from accounts.serializers import CustomUserSerializer
        return Response(CustomUserSerializer(clients, many=True).data)

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


class SupportTicketViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def submit(self, request):
        serializer = SupportTicketSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user if request.user.is_authenticated else None
            serializer.save(user=user)
            return Response({'message': 'Support ticket submitted. We will respond within 24 hours.'}, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        tickets = SupportTicket.objects.filter(user=request.user)
        return Response(SupportTicketSerializer(tickets, many=True).data)

def _generate_code():
    import random, string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class AICoachViewSet(viewsets.ViewSet):
    """Tier-gated AI coaching powered by Google Gemini."""
    permission_classes = [IsAuthenticated]

    def _get_user_tier(self, user):
        # Superadmin and staff always get Elite access for testing
        if user.is_superuser or user.is_staff:
            return 'elite'
        try:
            from subscriptions.models import UserSubscription
            sub = UserSubscription.objects.filter(
                user=user, status__in=['active', 'trial']
            ).select_related('plan__tier').order_by('-created_at').first()
            if sub and sub.plan and sub.plan.tier:
                return sub.plan.tier.name.lower()
        except Exception:
            pass
        return 'free'

    def _get_system_prompt(self, tier, user):
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
            return (
                f"{base} You are assisting a Basic subscriber. "
                "Provide general fitness guidance, workout tips, and nutrition basics. "
                "Do NOT provide personalised plans — recommend they upgrade to Pro for that. "
                "You do not have access to this user's specific workout history or body data."
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
            from .models import BodyMeasurement
            m = BodyMeasurement.objects.filter(user=user).order_by('-date').first()
            goals = getattr(user, 'fitness_goals', 'general fitness')
            weight = f"{m.weight}kg" if m and m.weight else "not recorded"
            return (
                f"Name: {user.first_name or user.username}, "
                f"Goals: {goals}, Weight: {weight}"
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

    @action(detail=False, methods=['post'])
    def chat(self, request):
        from .models import AIUsage, AIChatMessage
        from django.utils import timezone
        
        tier = self._get_user_tier(request.user)
        is_admin = request.user.is_staff or request.user.is_superuser
        
        if tier == 'free' and not is_admin:
            return Response({'error': 'upgrade_required', 'message': 'AI Coach is available from Basic plan onwards.'}, status=403)

        # 1. Define Tier Limits
        TIER_LIMITS = {'basic': 5, 'pro': 20, 'elite': 50}
        
        # 2. Check Daily Usage (Admins get a pass)
        today = timezone.now().date()
        usage_record, _ = AIUsage.objects.get_or_create(user=request.user, date=today)
        
        limit = TIER_LIMITS.get(tier, 0)
        if not is_admin and usage_record.count >= limit:
            return Response({
                'error': 'limit_reached',
                'reply': f"⚡ You've reached your daily limit of {limit} messages. Your coaching energy refills tomorrow!",
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
            return Response({'reply': "AI Coach is not configured. Please add keys to .env."})

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
                    usage_record.save()
                    return Response({
                        'reply': resp_text,
                        'tier': tier,
                        'provider': prov_name,
                        'usage_today': usage_record.count
                    })

            except Exception as e:
                last_error = e
                logger.warning(f"AI Provider Failover: {p['type']} failed - {str(e)[:50]}")
                continue

        user_msg = "⚡ AI Coach is temporarily busy. Please try again in 30 seconds."
        return Response({'reply': user_msg, 'error_detail': str(last_error) if getattr(ds, 'DEBUG', False) else None})
