from rest_framework import serializers
from .models import SubscriptionPlan, Feature


class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name', 'description', 'category', 'icon']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'price', 'currency', 'billing_cycle',
            'duration_days', 'features', 'max_workouts_per_week', 'include_meal_plans',
            'include_personal_trainer', 'include_nutrition_consultation',
            'include_community_access', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_features(self, obj):
        return obj.features if isinstance(obj.features, list) else []


class SubscriptionPlanDetailSerializer(SubscriptionPlanSerializer):
    class Meta(SubscriptionPlanSerializer.Meta):
        fields = SubscriptionPlanSerializer.Meta.fields + ['stripe_product_id', 'stripe_price_id', 'updated_at']
