"""
Phase 9: Feature Flags and Gradual Rollout System
Control feature availability by percentage, user segment, or explicit list.
"""

from django.db import models
from enum import Enum
from typing import Dict, Set, Optional
import hashlib


class FeatureFlagType(str, Enum):
    """Types of feature flag rollout strategies."""
    PERCENTAGE = "percentage"      # Rollout by percentage (0-100)
    SEGMENT = "segment"            # Rollout to specific user segment
    EXPLICIT = "explicit"          # Explicit user list
    BETA_USERS = "beta_users"     # Only beta testers
    ADMIN = "admin"                # Only admin users


class FeatureFlag(models.Model):
    """
    Feature flag model for gradual feature rollout.
    
    Example:
        flag = FeatureFlag.objects.create(
            key='new_dashboard_v2',
            name='New Dashboard Version 2',
            description='Redesigned analytics dashboard',
            type=FeatureFlagType.PERCENTAGE,
            percentage_rollout=25,  # 25% of users
            is_active=True,
        )
    """
    
    key = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(
        max_length=20,
        choices=[(ft.value, ft.name) for ft in FeatureFlagType],
        default=FeatureFlagType.PERCENTAGE.value,
    )
    
    # Rollout configuration
    percentage_rollout = models.IntegerField(default=0, help_text="0-100 percentage")
    segment_name = models.CharField(max_length=100, blank=True, help_text="User segment (e.g., 'premium', 'beta')")
    explicit_user_ids = models.TextField(blank=True, help_text="Comma-separated user IDs")
    
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['key', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.key} ({self.get_type_display()})"
    
    def is_enabled_for_user(self, user) -> bool:
        """Check if feature is enabled for a specific user."""
        if not self.is_active:
            return False
        
        if self.type == FeatureFlagType.ADMIN.value:
            return user.is_staff
        
        if self.type == FeatureFlagType.BETA_USERS.value:
            return user.is_beta_tester if hasattr(user, 'is_beta_tester') else False
        
        if self.type == FeatureFlagType.EXPLICIT.value:
        
            # Handle both int and UUID string IDs
            explicit_ids = {uid.strip() for uid in self.explicit_user_ids.split(',') if uid.strip()}
            user_id_str = str(user.id)
            return user_id_str in explicit_ids
        if self.type == FeatureFlagType.SEGMENT.value:
            return self._check_user_segment(user)
        
        if self.type == FeatureFlagType.PERCENTAGE.value:
            return self._check_percentage_rollout(user)
        
        return False
    
    def _check_percentage_rollout(self, user) -> bool:
        """Check if user is in the percentage rollout (consistent per user)."""
        if self.percentage_rollout >= 100:
            return True
        if self.percentage_rollout <= 0:
            return False
        
        # Use hash to ensure consistent rollout per user
        hash_input = f"{self.key}:{user.id}".encode()
        hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)
        user_percentage = (hash_value % 100) + 1  # 1-100
        
        return user_percentage <= self.percentage_rollout
    
    def _check_user_segment(self, user) -> bool:
        """Check if user belongs to target segment."""
        if not self.segment_name:
            return False
        
        # Check user attributes
        if self.segment_name == 'premium':
            return user.user_subscription_set.filter(status='active').exists()
        
        if self.segment_name == 'coaches':
            return user.role == 'coach'
        
        if self.segment_name == 'active':
            from django.utils import timezone
            from datetime import timedelta
            return user.last_login and user.last_login >= (timezone.now() - timedelta(days=7))
        
        return False


class FeatureFlagManager:
    """Manager for feature flag operations with caching."""
    
    _cache: Dict[str, FeatureFlag] = {}
    
    @classmethod
    def get_flag(cls, key: str) -> Optional[FeatureFlag]:
        """Get feature flag with caching."""
        if key not in cls._cache:
            try:
                cls._cache[key] = FeatureFlag.objects.get(key=key)
            except FeatureFlag.DoesNotExist:
                return None
        return cls._cache[key]
    
    @classmethod
    def is_enabled(cls, key: str, user=None) -> bool:
        """Check if feature is enabled globally or for a user."""
        flag = cls.get_flag(key)
        if not flag:
            return False
        
        if user is None:
            return flag.is_active
        
        return flag.is_enabled_for_user(user)
    
    @classmethod
    def clear_cache(cls):
        """Clear feature flag cache (call after updates)."""
        cls._cache.clear()
    
    @classmethod
    def get_all_active_flags(cls) -> Dict[str, FeatureFlag]:
        """Get all active feature flags."""
        return {
            flag.key: flag
            for flag in FeatureFlag.objects.filter(is_active=True)
        }


# Convenience decorators and helpers

def feature_enabled(flag_key: str):
    """Decorator to conditionally execute view based on feature flag."""
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if FeatureFlagManager.is_enabled(flag_key, request.user):
                return view_func(request, *args, **kwargs)
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'detail': 'Feature not available'},
                status=status.HTTP_403_FORBIDDEN
            )
        return wrapper
    return decorator


def feature_check(flag_key: str) -> bool:
    """Check if feature is enabled (for use in views/templates)."""
    from django.contrib.auth.models import AnonymousUser
    # Simplified check - use in context where user is available
    return FeatureFlagManager.is_enabled(flag_key)
