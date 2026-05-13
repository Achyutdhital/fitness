from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, UserSubscription, UserProfile


def _normalize_body_units(data):
    """Normalize body fields to internal storage (lbs + ft/in)."""
    weight = data.get('weight')
    weight_unit = (data.get('weight_unit') or 'lb').lower()
    height_unit = (data.get('height_unit') or 'ft_in').lower()

    # Normalize height
    if height_unit in ['cm'] and data.get('height_cm'):
        total_inches = float(data.get('height_cm')) / 2.54
        data['height_ft'] = int(total_inches // 12)
        data['height_in'] = int(round(total_inches % 12))
    elif height_unit in ['m', 'meter', 'meters'] and data.get('height_m'):
        total_inches = float(data.get('height_m')) * 100 / 2.54
        data['height_ft'] = int(total_inches // 12)
        data['height_in'] = int(round(total_inches % 12))

    # Normalize weight
    if weight is not None:
        weight = float(weight)
        if weight_unit in ['kg', 'kilogram', 'kilograms']:
            data['weight'] = round(weight * 2.20462, 2)
            data['preferred_units'] = 'metric'
        else:
            data['weight'] = round(weight, 2)
            data['preferred_units'] = 'imperial'

    return data


def _save_initial_measurement(user):
    """Persist onboarding metrics into BodyMeasurement history."""
    try:
        from core.models import BodyMeasurement
        weight_kg = round((user.weight or 0) / 2.20462, 2) if user.weight else None
        BodyMeasurement.objects.update_or_create(
            user=user,
            date=timezone.now().date(),
            defaults={
                'weight': weight_kg,
                'body_fat_percentage': user.body_fat_percentage,
                'muscle_mass': user.muscle_mass_kg,
                'notes': 'Auto-synced from onboarding/profile update',
            }
        )
    except Exception:
        pass


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    referral_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    fitness_level = serializers.ChoiceField(
        choices=['beginner', 'intermediate', 'advanced'],
        required=False
    )
    fitness_goal = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Onboarding fields
    gender = serializers.ChoiceField(choices=['male', 'female', 'other'], required=False)
    age = serializers.IntegerField(required=False, allow_null=True)
    height_ft = serializers.IntegerField(required=False, allow_null=True)
    height_in = serializers.IntegerField(required=False, allow_null=True)
    height_cm = serializers.FloatField(required=False, allow_null=True, write_only=True)
    height_m = serializers.FloatField(required=False, allow_null=True, write_only=True)
    height_unit = serializers.ChoiceField(choices=['ft_in', 'cm', 'm'], required=False, write_only=True)
    weight = serializers.FloatField(required=False, allow_null=True)
    weight_unit = serializers.ChoiceField(choices=['lb', 'kg'], required=False, write_only=True)
    activity_level = serializers.CharField(required=False, allow_blank=True)
    dietary_preference = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name',
            'fitness_level', 'fitness_goal',
            'gender', 'age', 'height_ft', 'height_in', 'weight',
            'height_cm', 'height_m', 'height_unit', 'weight_unit',
            'activity_level', 'dietary_preference',
            'referral_code',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords must match.'})
        return attrs

    def create(self, validated_data):
        validated_data = _normalize_body_units(validated_data)
        validated_data.pop('height_cm', None)
        validated_data.pop('height_m', None)
        validated_data.pop('height_unit', None)
        validated_data.pop('weight_unit', None)
        validated_data.pop('password2')
        referral_code = validated_data.pop('referral_code', None)
        fitness_goal = validated_data.pop('fitness_goal', '').strip()
        password = validated_data.pop('password')
        
        # Calculate body metrics if we have the data
        height_ft = validated_data.get('height_ft')
        height_in = validated_data.get('height_in')
        weight = validated_data.get('weight')
        age = validated_data.get('age')
        gender = validated_data.get('gender')
        activity_level = validated_data.get('activity_level')
        
        user = CustomUser(**validated_data)
        user.set_password(password)
        
        # Calculate metrics if enough data is provided
        if height_ft and weight and age and gender:
            user._calculate_body_metrics()
        
        user.save()

        if fitness_goal:
            UserProfile.objects.update_or_create(
                user=user,
                defaults={'goals': fitness_goal},
            )

        _save_initial_measurement(user)

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
    date_of_birth = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'phone_number',
            'profile_image', 'bio', 'age', 'gender',
            'fitness_level', 'fitness_goal',
            'weight', 'height_ft', 'height_in',
            'activity_level', 'dietary_preference',
            'bmi', 'body_fat_percentage', 'muscle_mass_kg', 'bmr', 'tdee', 'preferred_units',
            'role', 'assigned_coach',
            'last_ad_view',
            'is_verified', 'is_staff', 'is_superuser',
            'date_of_birth', 'created_at',
        ]
        read_only_fields = ['id', 'is_staff', 'is_superuser', 'created_at', 'body_fat_percentage', 'bmr', 'tdee', 'bmi', 'muscle_mass_kg']

    def get_date_of_birth(self, obj):
        # age stored as int; return None for now (can be extended)
        return None

    def update(self, instance, validated_data):
        # Handle nested source fields
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data.pop('phone_number')
        if 'fitness_level' in validated_data:
            instance.fitness_level = validated_data.pop('fitness_level')
        
        # Update instance with remaining data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Recalculate metrics if body data changed
        if any(k in validated_data for k in ['height_ft', 'height_in', 'weight', 'age', 'gender', 'activity_level']):
            instance._calculate_body_metrics()
        
        instance.save()
        _save_initial_measurement(instance)
        return instance


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
