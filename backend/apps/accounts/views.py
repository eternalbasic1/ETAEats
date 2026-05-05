from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView  # noqa: F401 (re-exported via urls)

from . import services
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    SignupSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)


class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    serializer_class = OTPRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = str(serializer.validated_data['phone_number'])
        services.request_otp(phone)
        return Response({'status': 'sent'}, status=status.HTTP_200_OK)


class SignupView(APIView):
    permission_classes = [AllowAny]
    serializer_class = SignupSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Create user (role defaults to PASSENGER in model creation, but we explicitly set it if needed)
        user = serializer.save()
        # Automatically trigger OTP
        services.request_otp(str(user.phone_number))
        return Response({'status': 'created_and_otp_sent'}, status=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    serializer_class = OTPVerifySerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = str(serializer.validated_data['phone_number'])
        code = serializer.validated_data['code']
        app_type = serializer.validated_data['app_type']
        user = services.verify_otp(phone, code, app_type=app_type)
        tokens = services.issue_tokens(user)
        return Response(
            {'user': UserSerializer(user).data, 'tokens': tokens},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    """
    Logout = blacklist the refresh token. Client discards tokens locally.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError

        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'refresh token required'}, status=400)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except TokenError:
            return Response({'detail': 'invalid token'}, status=400)
        return Response(status=204)
