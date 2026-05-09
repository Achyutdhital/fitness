from rest_framework import serializers
from .models import Payment, Invoice, Refund


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'subscription_plan', 'amount', 'currency', 'status',
            'payment_method', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'stripe_payment_id', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 'user', 'invoice_number', 'status', 'amount', 'currency',
            'issue_date', 'due_date', 'paid_date', 'created_at'
        ]
        read_only_fields = ['id', 'stripe_invoice_id', 'invoice_number', 'created_at']


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ['id', 'payment', 'amount', 'reason', 'status', 'created_at']
        read_only_fields = ['id', 'stripe_refund_id', 'created_at']
