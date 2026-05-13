"""
Phase 8: Performance Monitoring Command
Provides real-time metrics on cache hit rates, database performance, and system health.
"""

import time
import json
from django.core.management.base import BaseCommand
from django.db import connections
from django.core.cache import cache
from django.apps import apps
from django.conf import settings
import redis


class Command(BaseCommand):
    help = 'Monitor system performance metrics: cache, database, Redis'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=5,
            help='Monitoring interval in seconds (default: 5)'
        )
        parser.add_argument(
            '--duration',
            type=int,
            default=0,
            help='Total monitoring duration in seconds (0 = continuous)'
        )
        parser.add_argument(
            '--json',
            action='store_true',
            help='Output metrics in JSON format'
        )
        parser.add_argument(
            '--export',
            type=str,
            help='Export metrics to specified file'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Phase 8: Performance Monitor ===\n'))
        
        interval = options['interval']
        duration = options['duration']
        json_mode = options['json']
        export_file = options['export']
        
        metrics_history = []
        start_time = time.time()
        iteration = 0
        
        try:
            while True:
                iteration += 1
                metrics = self.collect_metrics()
                metrics_history.append(metrics)
                
                if json_mode:
                    self.stdout.write(json.dumps(metrics, indent=2))
                else:
                    self.print_metrics(metrics, iteration)
                
                # Check if duration exceeded
                if duration > 0 and (time.time() - start_time) >= duration:
                    break
                
                # Wait for next interval
                time.sleep(interval)
        
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\n\nMonitoring stopped.\n'))
        
        # Print summary
        self.print_summary(metrics_history)
        
        # Export if requested
        if export_file:
            self.export_metrics(metrics_history, export_file)

    def collect_metrics(self):
        """Collect all performance metrics."""
        metrics = {
            'timestamp': time.time(),
            'cache': self.get_cache_metrics(),
            'database': self.get_database_metrics(),
            'redis': self.get_redis_metrics(),
            'models': self.get_model_counts(),
        }
        return metrics

    def get_cache_metrics(self):
        """Get cache performance metrics."""
        cache_info = {
            'backend': settings.CACHES['default']['BACKEND'],
            'connected': False,
            'hits': 0,
            'misses': 0,
            'operations': 0,
        }
        
        try:
            # Test cache operation
            test_key = 'health_check_' + str(time.time())
            cache.set(test_key, 'test_value', 60)
            cached_value = cache.get(test_key)
            cache.delete(test_key)
            
            cache_info['connected'] = cached_value == 'test_value'
            
            # Try to get stats if using Redis backend
            if 'redis' in settings.CACHES['default']['BACKEND'].lower():
                try:
                    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                    info = redis_client.info()
                    cache_info['memory_used'] = info.get('used_memory_human', 'N/A')
                    cache_info['connected_clients'] = info.get('connected_clients', 0)
                except Exception:
                    pass
        
        except Exception as e:
            cache_info['error'] = str(e)
        
        return cache_info

    def get_database_metrics(self):
        """Get database performance metrics."""
        db_metrics = {
            'engine': None,
            'connected': False,
            'connections': [],
            'query_count': 0,
        }
        
        try:
            db = connections['default']
            db_metrics['engine'] = db.settings_dict['ENGINE']
            
            # Test connection
            cursor = db.cursor()
            cursor.execute('SELECT 1')
            db_metrics['connected'] = True
            cursor.close()
            
            # Get query count (if DEBUG mode)
            if settings.DEBUG:
                from django.db import reset_queries
                db_metrics['query_count'] = len(connections.queries)
        
        except Exception as e:
            db_metrics['error'] = str(e)
        
        return db_metrics

    def get_redis_metrics(self):
        """Get Redis server metrics."""
        redis_metrics = {
            'connected': False,
            'version': None,
            'memory': {},
            'stats': {},
        }
        
        try:
            if not settings.REDIS_URL:
                return redis_metrics
            
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            info = redis_client.info()
            
            redis_metrics['connected'] = True
            redis_metrics['version'] = info.get('redis_version', 'N/A')
            redis_metrics['memory'] = {
                'used': info.get('used_memory_human', 'N/A'),
                'max': info.get('maxmemory_human', 'unlimited'),
            }
            redis_metrics['stats'] = {
                'total_commands': info.get('total_commands_processed', 0),
                'total_connections': info.get('total_connections_received', 0),
                'connected_clients': info.get('connected_clients', 0),
                'evicted_keys': info.get('evicted_keys', 0),
            }
        
        except Exception as e:
            redis_metrics['error'] = str(e)
        
        return redis_metrics

    def get_model_counts(self):
        """Get row counts for all models."""
        model_counts = {}
        
        try:
            for model in apps.get_models():
                try:
                    count = model.objects.count()
                    model_counts[f"{model._meta.app_label}.{model._meta.object_name}"] = count
                except Exception:
                    pass
        
        except Exception:
            pass
        
        return model_counts

    def print_metrics(self, metrics, iteration):
        """Pretty-print metrics to console."""
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(metrics['timestamp']))
        
        self.stdout.write(f"\n[{iteration}] {timestamp}")
        self.stdout.write('-' * 60)
        
        # Cache metrics
        cache_info = metrics['cache']
        status = self.style.SUCCESS('✓') if cache_info.get('connected') else self.style.ERROR('✗')
        self.stdout.write(f"Cache: {status} {cache_info['backend'].split('.')[-1]}")
        if 'memory_used' in cache_info:
            self.stdout.write(f"  Memory: {cache_info['memory_used']} | Clients: {cache_info.get('connected_clients', 0)}")
        
        # Database metrics
        db_info = metrics['database']
        status = self.style.SUCCESS('✓') if db_info.get('connected') else self.style.ERROR('✗')
        engine = db_info['engine'].split('.')[-1] if db_info['engine'] else 'Unknown'
        self.stdout.write(f"Database: {status} {engine}")
        if settings.DEBUG and db_info.get('query_count'):
            self.stdout.write(f"  Queries: {db_info['query_count']}")
        
        # Redis metrics
        redis_info = metrics['redis']
        status = self.style.SUCCESS('✓') if redis_info.get('connected') else self.style.ERROR('✗')
        self.stdout.write(f"Redis: {status} {redis_info.get('version', 'N/A')}")
        if redis_info.get('connected'):
            stats = redis_info.get('stats', {})
            self.stdout.write(f"  Memory: {redis_info['memory'].get('used', 'N/A')} | Clients: {stats.get('connected_clients', 0)}")
            if stats.get('evicted_keys', 0) > 0:
                self.stdout.write(f"  ⚠ Evicted keys: {stats['evicted_keys']}")
        
        # Model counts (sample)
        model_counts = metrics['models']
        if model_counts:
            self.stdout.write('Models:')
            for model_name, count in sorted(model_counts.items())[:5]:
                self.stdout.write(f"  {model_name}: {count}")
            if len(model_counts) > 5:
                self.stdout.write(f"  ... and {len(model_counts) - 5} more")

    def print_summary(self, metrics_history):
        """Print summary statistics after monitoring."""
        if not metrics_history:
            return
        
        self.stdout.write(self.style.SUCCESS('\n=== Summary ===\n'))
        
        total_iterations = len(metrics_history)
        duration = metrics_history[-1]['timestamp'] - metrics_history[0]['timestamp']
        
        self.stdout.write(f"Total iterations: {total_iterations}")
        self.stdout.write(f"Duration: {duration:.1f} seconds")
        self.stdout.write(f"Average interval: {duration / total_iterations:.1f} seconds")
        
        # Cache availability
        cache_available = sum(1 for m in metrics_history if m['cache'].get('connected'))
        self.stdout.write(f"Cache available: {cache_available}/{total_iterations} ({100*cache_available//total_iterations}%)")
        
        # Database availability
        db_available = sum(1 for m in metrics_history if m['database'].get('connected'))
        self.stdout.write(f"Database available: {db_available}/{total_iterations} ({100*db_available//total_iterations}%)")
        
        # Redis availability
        redis_available = sum(1 for m in metrics_history if m['redis'].get('connected'))
        if redis_available > 0:
            self.stdout.write(f"Redis available: {redis_available}/{total_iterations} ({100*redis_available//total_iterations}%)")

    def export_metrics(self, metrics_history, export_file):
        """Export metrics to JSON file."""
        try:
            with open(export_file, 'w') as f:
                json.dump(metrics_history, f, indent=2)
            self.stdout.write(self.style.SUCCESS(f'\nMetrics exported to {export_file}\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Export failed: {e}\n'))
