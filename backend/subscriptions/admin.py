from django.contrib import admin
from .models import SubscriptionPlan, Feature


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'billing_cycle', 'duration_days', 'is_active', 'created_at']
    list_filter = ['is_active', 'billing_cycle', 'include_meal_plans', 'include_personal_trainer']
    search_fields = ['name', 'description']
    readonly_fields = ['stripe_product_id', 'stripe_price_id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'is_active', 'priority')
        }),
        ('Pricing', {
            'fields': ('price', 'currency', 'billing_cycle', 'duration_days')
        }),
        ('Features', {
            'fields': (
                'features', 'max_workouts_per_week', 'include_meal_plans',
                'include_personal_trainer', 'include_nutrition_consultation',
                'include_community_access'
            )
        }),
        ('Stripe Integration', {
            'fields': ('stripe_product_id', 'stripe_price_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
