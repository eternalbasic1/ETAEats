from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsPassenger

from . import services
from .serializers import ValidatePromoSerializer


class ValidatePromoView(APIView):
    """
    POST /promos/validate/
    Validates a promo code without redeeming it.
    Response is always 200 with valid, discount_amount, final_total, message.
    """
    permission_classes = [IsAuthenticated, IsPassenger]

    def post(self, request):
        serializer = ValidatePromoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = services.validate_promo_preview(
            code=serializer.validated_data['code'],
            cart_total=serializer.validated_data['cart_total'],
            user=request.user,
            restaurant_id=serializer.validated_data.get('restaurant_id'),
        )
        return Response(result)
