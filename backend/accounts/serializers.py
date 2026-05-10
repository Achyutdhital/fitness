from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, UserSubscription, UserProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    referral_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    fitness_level = serializers.ChoiceField(
        choices=['beginner', 'intermediate', 'advanced'],
        required=False
    )
    fitness_goal = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name',
            'fitness_level', 'fitness_goal',
            'referral_code',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords must match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        referral_code = validated_data.pop('referral_code', None)
        fitness_goal = validated_data.pop('fitness_goal', '').strip()
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        if fitness_goal:
            UserProfile.objects.update_or_create(
                user=user,
                defaults={'goals': fitness_goal},
            )

        # Handle referral
        if referral_code:
            try:
                from core.models import Referral
                ref = Referral.objects.get(referral_code=referral_code.upper(), status='pending')
                ref.referred = user
                ref.status = 'completed'
                ref.save()
            except Exception:
                pass

        return user


class CustomUserSerializer(serializers.ModelSerializer):
    # Expose both field name variants so frontend works regardless
    phone = serializers.CharField(source='phone_number', allow_blank=True, required=False)
    fitness_goal = serializers.CharField(source='fitness_level', allow_blank=True, required=False)
    date_of_birth = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'phone_number',
            'phone', 'phone_number',
            'profile_image', 'bio', 'age', 'gender',
            'fitness_goal', 'fitness_level',
            'weight', 'height', 'role', 'assigned_coach',
            'last_ad_view',
            'is_verified', 'is_staff', 'is_superuser',
            'date_of_birth', 'created_at',
        ]
        read_only_fields = ['id', 'is_staff', 'is_superuser', 'created_at']

    def get_date_of_birth(self, obj):
        # age stored as int; return None for now (can be extended)
        return None

    def update(self, instance, validated_data):
        # Handle nested source fields
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data.pop('phone_number')
        if 'fitness_level' in validated_data:
            instance.fitness_level = validated_data.pop('fitness_level')
        return super().update(instance, validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'goals', 'dietary_preferences', 'workout_preferences', 'injuries', 'created_at']
        read_only_fields = ['id', 'created_at']


class TierSerializer(serializers.ModelSerializer):
    class Meta:
        from subscriptions.models import SubscriptionTier
        model = SubscriptionTier
        fields = ['id', 'name', 'description', 'features', 'sessions_per_week']

class UserSubscriptionSerializer(serializers.ModelSerializer):
    subscription_plan = serializers.SerializerMethodField()
    tier_details = TierSerializer(source='tier', read_only=True)

    class Meta:
        model = UserSubscription
        fields = ['id', 'subscription_plan', 'tier', 'tier_details', 'status', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_subscription_plan(self, obj):
        if obj.subscription_plan:
            return {
                'id': str(obj.subscription_plan.id),
                'name': obj.subscription_plan.name,
                'price': str(obj.subscription_plan.price),
                'billing_cycle': obj.subscription_plan.billing_cycle,
            }
        return None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'new_password': 'Passwords must match.'})
        return attrs
