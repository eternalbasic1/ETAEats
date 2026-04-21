from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CartItemView,
    CartView,
    CheckoutView,
    PassengerOrderViewSet,
    RestaurantOrderViewSet,
)

app_name = 'orders'

router = DefaultRouter()
router.register('my', PassengerOrderViewSet, basename='my-order')
router.register('restaurant', RestaurantOrderViewSet, basename='restaurant-order')

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/<int:item_id>/', CartItemView.as_view(), name='cart-item'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
]
urlpatterns += router.urls
