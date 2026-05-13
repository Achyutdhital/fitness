"""
Redis caching utilities for performance optimization.
Provides decorators and helpers for caching expensive operations.
"""

import json
import hashlib
from functools import wraps
from typing import Any, Callable, Optional

import redis
from django.conf import settings
from django.core.cache import cache
from django.utils.functional import cached_property


class CacheManager:
    """Centralized Redis cache management with automatic connection pooling."""

    _instance = None
    _redis_available = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def redis(self):
        """Get Redis client if available, cached result."""
        if CacheManager._redis_available is None:
            try:
                if hasattr(settings, 'REDIS_URL'):
                    client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2, socket_timeout=2)
                    # Test connection
                    client.ping()
                    CacheManager._redis_available = client
                else:
                    CacheManager._redis_available = False
            except Exception:
                CacheManager._redis_available = False
        
        return CacheManager._redis_available if CacheManager._redis_available else None

    def get(self, key: str) -> Optional[Any]:
        """Retrieve value from cache."""
        if self.redis:
            try:
                value = self.redis.get(key)
                if value:
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        return value
                return None
            except (redis.RedisError, redis.ConnectionError, Exception):
                # Fallback to Django cache if Redis fails
                return cache.get(key)
        else:
            return cache.get(key)

    def set(self, key: str, value: Any, timeout: int = 300) -> None:
        """Set value in cache with expiry."""
        if self.redis:
            try:
                try:
                    self.redis.setex(key, timeout, json.dumps(value))
                except (TypeError, redis.RedisError):
                    # Fallback to storing as string if not JSON serializable
                    self.redis.setex(key, timeout, str(value))
            except (redis.RedisError, redis.ConnectionError, Exception):
                # Fallback to Django cache if Redis fails
                cache.set(key, value, timeout)
        else:
            cache.set(key, value, timeout)

    def delete(self, key: str) -> None:
        """Remove key from cache."""
        if self.redis:
            self.redis.delete(key)
        else:
            cache.delete(key)

    def clear_pattern(self, pattern: str) -> None:
        """Delete all keys matching pattern (Redis only)."""
        if self.redis:
            try:
                keys = self.redis.keys(pattern)
                if keys:
                    self.redis.delete(*keys)
            except redis.RedisError:
                pass


cache_manager = CacheManager()


def cache_result(
    timeout: int = 300,
    key_prefix: str = "fitness",
    invalidate_signals: Optional[list] = None
):
    """
    Decorator to cache function results with TTL.

    Args:
        timeout: Cache expiry in seconds (default: 5 min)
        key_prefix: Prefix for cache key (default: "fitness")
        invalidate_signals: List of Django signals to auto-invalidate on (optional)

    Usage:
        @cache_result(timeout=600, key_prefix="dashboard")
        def get_user_stats(user_id):
            return expensive_db_query()
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function name + args + kwargs
            key_parts = [key_prefix, func.__name__]
            
            # Include all positional args (except 'self')
            for i, arg in enumerate(args):
                if i == 0 and hasattr(arg, 'user_id'):
                    # Skip self if it's an object with user_id
                    continue
                key_parts.append(f"arg{i}_{str(arg)[:20]}")
            
            # Include all kwargs
            for k, v in sorted(kwargs.items()):
                if k not in ['self', 'request']:
                    key_parts.append(f"{k}={str(v)[:20]}")
            
            cache_key = ":".join(key_parts)

            # Try to retrieve from cache
            result = cache_manager.get(cache_key)
            if result is not None:
                return result

            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_manager.set(cache_key, result, timeout)
            return result

        return wrapper

    return decorator


def cache_view_response(timeout: int = 300, cache_key_func: Optional[Callable] = None):
    """
    Decorator to cache Django REST Framework view responses.

    Args:
        timeout: Cache expiry in seconds
        cache_key_func: Custom function to generate cache key (receives request, returns str)

    Usage:
        @cache_view_response(timeout=600)
        def get_user_stats(request):
            return Response(stats_data)
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            request = args[1] if len(args) > 1 else kwargs.get('request')
            
            # Generate cache key
            if cache_key_func:
                cache_key = cache_key_func(request)
            else:
                # Default: cache by path + query params
                query_string = request.GET.urlencode() if hasattr(request, 'GET') else ""
                path_hash = hashlib.md5(f"{request.path}:{query_string}".encode()).hexdigest()
                cache_key = f"view:{path_hash}"

            # Check cache (skip for non-GET requests)
            if hasattr(request, 'method') and request.method == 'GET':
                cached = cache_manager.get(cache_key)
                if cached is not None:
                    return cached

            # Execute and cache
            response = func(*args, **kwargs)
            
            # Only cache successful GET responses
            if hasattr(request, 'method') and request.method == 'GET' and hasattr(response, 'status_code'):
                if response.status_code == 200:
                    cache_manager.set(cache_key, response.data if hasattr(response, 'data') else str(response), timeout)
            
            return response

        return wrapper

    return decorator


# Pre-defined cache key patterns for common features
CACHE_KEYS = {
    'dashboard': 'fitness:dashboard:user:{user_id}',
    'user_stats': 'fitness:stats:user:{user_id}',
    'gamification': 'fitness:gamification:user:{user_id}',
    'ai_suggestions': 'fitness:ai:suggestions:user:{user_id}',
    'coaching_sessions': 'fitness:coaching:sessions:user:{user_id}',
    'admin_stats': 'fitness:admin:stats',
    'leaderboard': 'fitness:leaderboard:page:{page}',
}


def get_cache_key(key_name: str, **params) -> str:
    """Get a pre-defined cache key with parameter substitution."""
    if key_name not in CACHE_KEYS:
        raise ValueError(f"Unknown cache key: {key_name}")
    return CACHE_KEYS[key_name].format(**params)


def invalidate_user_cache(user_id: int) -> None:
    """Invalidate all cache entries for a specific user."""
    patterns = [
        f"fitness:*:user:{user_id}",
        f"fitness:stats:user:{user_id}",
        f"fitness:gamification:user:{user_id}",
        f"fitness:ai:*:user:{user_id}",
    ]
    for pattern in patterns:
        cache_manager.clear_pattern(pattern)


def invalidate_admin_cache() -> None:
    """Invalidate all admin dashboard cache entries."""
    cache_manager.clear_pattern("fitness:admin:*")
