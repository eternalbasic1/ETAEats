from django.urls import path

from .views import VersionCheckView

app_name = 'appconfig'

urlpatterns = [
    path('version-check/', VersionCheckView.as_view(), name='version-check'),
]
