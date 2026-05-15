from django.contrib import admin
from .models import SubscriptionTier, SubscriptionPlan, Feature

class SubscriptionPlanInline(admin.TabularInline):
    model = SubscriptionPlan
    extra = 1

@admin.register(SubscriptionTier)
class SubscriptionTierAdmin(admin.ModelAdmin):
    list_display = ['name', 'priority', 'sessions_per_week', 'custom_hourly_rate', 'created_at']
    list_editable = ['priority']
    inlines = [SubscriptionPlanInline]

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'tier', 'price', 'billing_cycle', 'is_active']
    list_filter = ['tier', 'billing_cycle', 'is_active']
    search_fields = ['name', 'tier__name']



@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
