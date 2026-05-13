"""
Phase 9: Database Optimization
Query optimization with select_related, prefetch_related, and strategic indexing.
"""

from django.db import models
from django.db.models import Prefetch, Count, Q
from django.views.decorators.cache import cache_page
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.management.base import BaseCommand
from io import StringIO
import time


class DatabaseOptimizationMixin:
    """Mixin to apply query optimization patterns to viewsets."""

    def get_queryset(self):
        """Override to add prefetch_related and select_related."""
        qs = super().get_queryset()
        return self.optimize_queryset(qs)

    def optimize_queryset(self, qs):
        """Apply standard optimizations. Override in subclass for specific patterns."""
        return qs


# Optimization patterns for each app

class OptimizedUserQueryset:
    """Optimized queries for users with related data."""
    
    @staticmethod
    def with_subscription():
        """Get users with subscription data without N+1 queries."""
        from accounts.models import CustomUser, UserSubscription
        from subscriptions.models import SubscriptionPlan
        
        return CustomUser.objects.select_related(
            'assigned_coach'
        ).prefetch_related(
            Prefetch(
                'user_subscription_set',
                UserSubscription.objects.select_related('subscription_plan')
            )
        )
    
    @staticmethod
    def with_stats():
        """Get users with gamification stats, points, achievements."""
        from accounts.models import CustomUser, UserPoints
        from core.models import UserAchievement
        
        return CustomUser.objects.select_related(
            'assigned_coach'
        ).prefetch_related(
            Prefetch(
                'userpoints_set',
                UserPoints.objects.all()
            ),
            Prefetch(
                'userachievement_set',
                UserAchievement.objects.select_related('achievement')
            )
        )
    
    @staticmethod
    def with_dashboard():
        """Get users with all dashboard data."""
        from accounts.models import CustomUser
        from core.models import BodyMeasurement, UserPoints
        from workouts.models import UserWorkoutProgress
        
        return CustomUser.objects.select_related(
            'assigned_coach'
        ).prefetch_related(
            Prefetch(
                'bodymeasurement_set',
                BodyMeasurement.objects.order_by('-date')[:30]
            ),
            Prefetch(
                'userpoints_set',
                UserPoints.objects.all()
            ),
            Prefetch(
                'userworkoutprogress_set',
                UserWorkoutProgress.objects.select_related('workout').order_by('-completed_date')[:10]
            )
        )


class OptimizedCoachingQueries:
    """Optimized queries for coaching sessions and assignments."""
    
    @staticmethod
    def sessions_with_participants():
        """Get coaching sessions with coach and client data."""
        from core.models import CoachSession
        
        return CoachSession.objects.select_related(
            'coach',
            'client',
            'coach_payout'
        ).prefetch_related(
            'client__user_subscription_set'
        )
    
    @staticmethod
    def sessions_with_feedback():
        """Get sessions with feedback and ratings."""
        from core.models import CoachSession, CoachFeedback
        
        return CoachSession.objects.select_related(
            'coach', 'client'
        ).prefetch_related(
            Prefetch(
                'coachfeedback_set',
                CoachFeedback.objects.select_related('client')
            )
        )


class OptimizedWorkoutQueries:
    """Optimized queries for workouts and progress tracking."""
    
    @staticmethod
    def workouts_with_progress(user=None):
        """Get workouts with user progress data."""
        from workouts.models import Workout, UserWorkoutProgress
        
        qs = Workout.objects.select_related(
            'category',
            'created_by'
        ).prefetch_related(
            'workout_program_phases'
        )
        
        if user:
            qs = qs.prefetch_related(
                Prefetch(
                    'userworkoutprogress_set',
                    UserWorkoutProgress.objects.filter(user=user)
                )
            )
        
        return qs
    
    @staticmethod
    def user_progress_with_details(user):
        """Get user's workout progress with all details."""
        from workouts.models import UserWorkoutProgress
        
        return UserWorkoutProgress.objects.filter(
            user=user
        ).select_related(
            'workout__category',
            'workout__created_by'
        ).order_by('-completed_date')


class OptimizedAIQueries:
    """Optimized queries for AI coach and chat history."""
    
    @staticmethod
    def chat_history_with_context(user):
        """Get AI chat history with usage context."""
        from core.models import AIChatMessage, AIUsage
        
        return AIChatMessage.objects.filter(
            user=user
        ).select_related(
            'user'
        ).order_by('-created_at')
    
    @staticmethod
    def ai_usage_summary(user):
        """Get user's AI usage stats efficiently."""
        from core.models import AIUsage
        from django.db.models import Sum
        
        return AIUsage.objects.filter(
            user=user
        ).values('provider').annotate(
            total_messages=Count('id'),
            total_tokens=Sum('tokens_used')
        )


class OptimizedAdminQueries:
    """Optimized queries for admin dashboards."""
    
    @staticmethod
    def admin_stats():
        """Get admin dashboard stats with minimal queries."""
        from accounts.models import CustomUser
        from subscriptions.models import SubscriptionTier
        from core.models import SupportTicket
        from django.db.models import Count, Q
        
        stats = {
            'total_users': CustomUser.objects.count(),
            'active_subscriptions': CustomUser.objects.filter(
                user_subscription__status='active'
            ).distinct().count(),
            'users_by_tier': dict(
                CustomUser.objects.filter(
                    user_subscription__status='active'
                ).values('user_subscription__subscription_plan__subscription_tier__name').annotate(
                    count=Count('id')
                ).values_list('user_subscription__subscription_plan__subscription_tier__name', 'count')
            ),
            'open_support_tickets': SupportTicket.objects.filter(
                status='open'
            ).count(),
            'urgent_tickets': SupportTicket.objects.filter(
                status='open',
                priority__in=['urgent', 'high']
            ).count(),
        }
        return stats
    
    @staticmethod
    def user_list_optimized():
        """Get user list for admin panel with minimal overhead."""
        from accounts.models import CustomUser
        
        return CustomUser.objects.select_related(
            'assigned_coach'
        ).prefetch_related(
            Prefetch(
                'user_subscription_set',
                CustomUser.user_subscription_set.through.objects.select_related('subscription_plan')
            )
        ).values(
            'id', 'username', 'email', 'created_at',
            'assigned_coach__username',
            'user_subscription__subscription_plan__subscription_tier__name'
        ).order_by('-created_at')
