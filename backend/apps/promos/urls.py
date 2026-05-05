from django.urls import path

from .views import ValidatePromoView

app_name = 'promos'

urlpatterns = [
    path('validate/', ValidatePromoView.as_view(), name='validate'),
]
