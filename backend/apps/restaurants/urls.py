from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import MenuCategoryViewSet, MenuItemViewSet, RestaurantViewSet, ScanBusQRView

app_name = 'restaurants'

router = DefaultRouter()
router.register('', RestaurantViewSet, basename='restaurant')
router.register('menu-categories', MenuCategoryViewSet, basename='menu-category')
router.register('menu-items', MenuItemViewSet, basename='menu-item')

urlpatterns = [
    path('scan/<uuid:qr_token>/', ScanBusQRView.as_view(), name='scan'),
]
urlpatterns += router.urls
