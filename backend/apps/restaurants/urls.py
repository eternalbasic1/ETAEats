from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import MenuCategoryViewSet, MenuItemViewSet, RestaurantViewSet, ScanBusQRView

app_name = 'restaurants'

router = DefaultRouter()
# Specific prefixes must be registered before the empty-prefix RestaurantViewSet,
# otherwise the catch-all detail pattern ^(?P<pk>[^/.]+)/$ absorbs them first.
router.register('menu-categories', MenuCategoryViewSet, basename='menu-category')
router.register('menu-items', MenuItemViewSet, basename='menu-item')
router.register('', RestaurantViewSet, basename='restaurant')

urlpatterns = [
    path('scan/<str:qr_token>/', ScanBusQRView.as_view(), name='scan'),
]
urlpatterns += router.urls
