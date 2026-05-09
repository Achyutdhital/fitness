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
