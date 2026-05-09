import stripe
import json
from decimal import Decimal
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
from .models import Payment, Invoice, Refund
from .serializers import PaymentSerializer, InvoiceSerializer, RefundSerializer
from accounts.models import UserSubscription
from subscriptions.models import SubscriptionPlan

stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentViewSet(viewsets.ViewSet):
    """Handle payments and subscriptions"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def create_payment_intent(self, request):
        """Create a Stripe payment intent for subscription"""
        user = request.user
        plan_id = request.data.get('plan_id')
        
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Subscription plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Create or get Stripe customer
            if not hasattr(user, 'subscription') or not user.subscription.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=f"{user.first_name} {user.last_name}",
                    metadata={'user_id': str(user.id)}
                )
                customer_id = customer.id
            else:
                customer_id = user.subscription.stripe_customer_id
            
            # Create payment intent
            amount = int(float(plan.price) * 100)  # Convert to cents
            
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=plan.currency.lower(),
                customer=customer_id,
                metadata={
                    'user_id': str(user.id),
                    'plan_id': str(plan.id),
                    'plan_name': plan.name
                }
            )
            
            return Response({
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': plan.price,
                'currency': plan.currency,
                'plan': plan.name
            })
        
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def confirm_payment(self, request):
        """Confirm payment and create subscription"""
        user = request.user
        payment_intent_id = request.data.get('payment_intent_id')
        plan_id = request.data.get('plan_id')
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            plan = SubscriptionPlan.objects.get(id=plan_id)
            
            if intent.status == 'succeeded':
                # Create or update user subscription
                user_subscription, created = UserSubscription.objects.get_or_create(
                    user=user,
                    defaults={
                        'subscription_plan': plan,
                        'stripe_customer_id': intent.customer,
                        'stripe_subscription_id': payment_intent_id,
                        'status': 'active',
                        'start_date': timezone.now(),
                        'end_date': timezone.now() + timedelta(days=plan.duration_days)
                    }
                )
                
                if not created:
                    user_subscription.subscription_plan = plan
                    user_subscription.status = 'active'
                    user_subscription.start_date = timezone.now()
                    user_subscription.end_date = timezone.now() + timedelta(days=plan.duration_days)
                    user_subscription.save()
                
                # Create payment record
                payment = Payment.objects.create(
                    user=user,
                    subscription_plan=plan,
                    stripe_payment_id=payment_intent_id,
                    amount=plan.price,
                    currency=plan.currency,
                    status='completed',
                    payment_method='stripe_card',
                    description=f"Subscription to {plan.name}"
                )
                
                # Create invoice
                invoice_number = f"INV-{user.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                invoice = Invoice.objects.create(
                    user=user,
                    payment=payment,
                    stripe_invoice_id=payment_intent_id,
                    invoice_number=invoice_number,
                    status='paid',
                    amount=plan.price,
                    currency=plan.currency,
                    issue_date=timezone.now().date(),
                    due_date=(timezone.now() + timedelta(days=30)).date(),
                    paid_date=timezone.now().date()
                )
                
                return Response({
                    'message': 'Payment successful',
                    'subscription': user_subscription.id,
                    'plan': plan.name,
                    'invoice_number': invoice.invoice_number
                })
            else:
                return Response(
                    {'error': 'Payment not confirmed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get user's payment history"""
        payments = Payment.objects.filter(user=request.user).order_by('-created_at')
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def cancel_subscription(self, request):
        """Cancel user's subscription"""
        user = request.user
        try:
            subscription = user.subscription
            subscription.status = 'canceled'
            subscription.end_date = timezone.now()
            subscription.save()
            
            return Response({
                'message': 'Subscription canceled successfully'
            })
        except UserSubscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def create_refund(self, request):
        """Request a refund for a payment"""
        user = request.user
        payment_id = request.data.get('payment_id')
        reason = request.data.get('reason', 'Customer requested')
        
        try:
            payment = Payment.objects.get(id=payment_id, user=user)
            
            if payment.status != 'completed':
                return Response(
                    {'error': 'Can only refund completed payments'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create Stripe refund
            refund = stripe.Refund.create(
                payment_intent=payment.stripe_payment_id,
                reason='requested_by_customer'
            )
            
            # Create refund record
            refund_obj = Refund.objects.create(
                payment=payment,
                stripe_refund_id=refund.id,
                amount=payment.amount,
                reason=reason,
                status='succeeded' if refund.status == 'succeeded' else 'pending'
            )
            
            payment.status = 'refunded'
            payment.save()
            
            return Response({
                'message': 'Refund processed successfully',
                'refund_id': refund.id,
                'amount': float(payment.amount)
            })
        
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class InvoiceViewSet(viewsets.ViewSet):
    """Invoice management"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_invoices(self, request):
        """Get user's invoices"""
        invoices = Invoice.objects.filter(user=request.user).order_by('-issue_date')
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path=r'download/(?P<invoice_id>.+)')
    def download_invoice(self, request, invoice_id=None):
        """Download invoice (PDF)"""
        try:
            invoice = Invoice.objects.get(id=invoice_id, user=request.user)
            # In production, generate PDF here
            return Response({
                'message': 'Invoice PDF download',
                'invoice_number': invoice.invoice_number
            })
        except Invoice.DoesNotExist:
            return Response(
                {'error': 'Invoice not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@csrf_exempt
@api_view(['POST'])
def stripe_webhook(request):
    """Handle Stripe webhooks"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError:
        return JsonResponse({'error': 'Invalid signature'}, status=400)
    
    # Handle specific events
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        # Update payment status
        try:
            payment = Payment.objects.get(stripe_payment_id=payment_intent.id)
            payment.status = 'completed'
            payment.save()
        except Payment.DoesNotExist:
            pass
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        # Update payment status
        try:
            payment = Payment.objects.get(stripe_payment_id=payment_intent.id)
            payment.status = 'failed'
            payment.save()
        except Payment.DoesNotExist:
            pass
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        # Cancel user subscription
        try:
            user_subscription = UserSubscription.objects.get(
                stripe_subscription_id=subscription.id
            )
            user_subscription.status = 'canceled'
            user_subscription.end_date = timezone.now()
            user_subscription.save()
        except UserSubscription.DoesNotExist:
            pass
    
    return JsonResponse({'received': True})
