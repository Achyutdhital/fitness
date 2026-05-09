from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, InvoiceViewSet, stripe_webhook

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
] + router.urls
