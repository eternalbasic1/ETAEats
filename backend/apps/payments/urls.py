from django.urls import path

from .views import CancelRazorpayPaymentView, ConfirmRazorpayPaymentView, CreateRazorpayOrderView, RazorpayWebhookView

app_name = 'payments'

urlpatterns = [
    path('razorpay/order/', CreateRazorpayOrderView.as_view(), name='rp-order'),
    path('razorpay/confirm/', ConfirmRazorpayPaymentView.as_view(), name='rp-confirm'),
    path('razorpay/cancel/', CancelRazorpayPaymentView.as_view(), name='rp-cancel'),
    path('razorpay/webhook/', RazorpayWebhookView.as_view(), name='rp-webhook'),
]
