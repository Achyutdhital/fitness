from rest_framework import serializers
from .models import SubscriptionPlan, Feature, SubscriptionTier

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name', 'description', 'category', 'icon']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'currency', 'billing_cycle', 'duration_days', 'priority']

class SubscriptionPlanDetailSerializer(SubscriptionPlanSerializer):
    class Meta(SubscriptionPlanSerializer.Meta):
        fields = SubscriptionPlanSerializer.Meta.fields + ['stripe_price_id', 'updated_at']

class SubscriptionTierSerializer(serializers.ModelSerializer):
    plans = SubscriptionPlanSerializer(many=True, read_only=True)
    
    class Meta:
        model = SubscriptionTier
        fields = ['id', 'name', 'description', 'features', 'sessions_per_week', 'priority', 'plans']
