from rest_framework import serializers
from phonenumber_field.serializerfields import PhoneNumberField

from .models import Membership, User

APP_TYPE_CHOICES = ['passenger', 'restaurant', 'admin']


class OTPRequestSerializer(serializers.Serializer):
    phone_number = PhoneNumberField()


class OTPVerifySerializer(serializers.Serializer):
    phone_number = PhoneNumberField()
    code = serializers.CharField(min_length=4, max_length=8)
    app_type = serializers.ChoiceField(choices=APP_TYPE_CHOICES)


class SignupSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(required=True, min_length=2)

    class Meta:
        model = User
        fields = ('phone_number', 'email', 'full_name')


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class MembershipSerializer(serializers.ModelSerializer):
    org_type = serializers.SerializerMethodField()
    org_id = serializers.SerializerMethodField()
    org_name = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = ('id', 'org_type', 'org_id', 'org_name', 'org_role', 'is_active')

    def get_org_type(self, obj: Membership) -> str:
        return 'restaurant' if obj.restaurant_id else 'operator'

    def get_org_id(self, obj: Membership):
        return obj.restaurant_id or obj.operator_id

    def get_org_name(self, obj: Membership) -> str:
        if obj.restaurant_id:
            return obj.restaurant.name
        return obj.operator.company_name


class UserSerializer(serializers.ModelSerializer):
    memberships = MembershipSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'phone_number',
            'email',
            'full_name',
            'gender',
            'role',
            'is_active',
            'memberships',
            'created_at',
        )
        read_only_fields = ('id', 'role', 'is_active', 'memberships', 'created_at')


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('full_name', 'email', 'gender', 'fcm_token')


class LoginResponseSerializer(serializers.Serializer):
    user = UserSerializer()
    tokens = TokenPairSerializer()
