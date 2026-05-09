from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserSubscription, UserProfile


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': (
                'phone_number', 'profile_image', 'bio', 'age',
                'gender', 'fitness_level', 'weight', 'height', 'is_verified'
            )
        }),
    )
    list_display = ['username', 'email', 'fitness_level', 'is_verified', 'created_at']
    list_filter = UserAdmin.list_filter + ('fitness_level', 'gender', 'is_verified')


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'subscription_plan', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['stripe_subscription_id', 'stripe_customer_id', 'created_at', 'updated_at']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']
    search_fields = ['user__username', 'goals']
    readonly_fields = ['created_at', 'updated_at']


admin.site.register(CustomUser, CustomUserAdmin)
