from django.contrib import admin
from .models import Payment, Invoice, Refund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'subscription_plan', 'amount', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['user__username', 'user__email', 'stripe_payment_id']
    readonly_fields = ['stripe_payment_id', 'stripe_invoice_id', 'created_at', 'updated_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'user', 'amount', 'status', 'issue_date', 'due_date']
    list_filter = ['status', 'issue_date']
    search_fields = ['invoice_number', 'user__username', 'user__email']
    readonly_fields = ['stripe_invoice_id', 'created_at', 'updated_at']


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ['payment', 'amount', 'reason', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['payment__id', 'stripe_refund_id']
    readonly_fields = ['stripe_refund_id', 'created_at', 'updated_at']
