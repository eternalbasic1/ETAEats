from rest_framework.routers import DefaultRouter

from .views import AssignmentViewSet, BusOperatorViewSet, BusViewSet, RouteViewSet

app_name = 'fleet'

router = DefaultRouter()
router.register('operators', BusOperatorViewSet, basename='operator')
router.register('routes', RouteViewSet, basename='route')
router.register('buses', BusViewSet, basename='bus')
router.register('assignments', AssignmentViewSet, basename='assignment')

urlpatterns = router.urls
