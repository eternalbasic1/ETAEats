from django.urls import re_path

from .consumers import RestaurantConsumer, UserConsumer


websocket_urlpatterns = [
    re_path(r'^ws/user/$', UserConsumer.as_asgi()),
    re_path(r'^ws/restaurant/(?P<restaurant_id>\d+)/$', RestaurantConsumer.as_asgi()),
]
