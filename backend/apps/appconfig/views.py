from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import AppVersionConfig
from .semver import is_version_outdated, parse_version

VALID_APPS = {'passenger', 'restaurant', 'admin'}


class VersionCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        app = request.query_params.get('app')
        version = request.query_params.get('version')

        # Validate app param
        if not app or app not in VALID_APPS:
            return Response(
                {
                    'error': {
                        'code': 'validation_error',
                        'message': f"'app' must be one of: {', '.join(sorted(VALID_APPS))}.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate version param presence
        if not version:
            return Response(
                {
                    'error': {
                        'code': 'validation_error',
                        'message': "'version' query parameter is required.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate version format
        try:
            parse_version(version)
        except ValueError:
            return Response(
                {
                    'error': {
                        'code': 'validation_error',
                        'message': f"'version' must be a valid semver string (MAJOR.MINOR.PATCH). Got: {version!r}",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch config; treat missing or inactive as no-force
        try:
            config = AppVersionConfig.objects.get(app_name=app)
        except AppVersionConfig.DoesNotExist:
            return Response(
                {
                    'force_update': False,
                    'update_message': '',
                    'android_store_url': '',
                    'ios_store_url': '',
                },
                status=status.HTTP_200_OK,
            )

        if not config.is_active:
            return Response(
                {
                    'force_update': False,
                    'update_message': '',
                    'android_store_url': '',
                    'ios_store_url': '',
                },
                status=status.HTTP_200_OK,
            )

        # Compare versions
        if is_version_outdated(version, config.min_required_version):
            return Response(
                {
                    'force_update': True,
                    'update_message': config.update_message,
                    'android_store_url': config.android_store_url,
                    'ios_store_url': config.ios_store_url,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'force_update': False,
                'update_message': '',
                'android_store_url': '',
                'ios_store_url': '',
            },
            status=status.HTTP_200_OK,
        )
