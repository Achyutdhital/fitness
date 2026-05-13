from django.conf import settings
from django.core.mail import send_mail

from .email_templates import render_email_template


def _send_plain_email(subject, message, recipient_list, from_email=None):
    send_mail(
        subject,
        message,
        from_email or settings.EMAIL_HOST_USER or 'noreply@fitcoachpro.com',
        recipient_list,
        fail_silently=True,
    )


def send_templated_email(template_key, recipient_email, context=None, from_email=None):
    subject, message = render_email_template(template_key, context or {})
    _send_plain_email(subject, message, [recipient_email], from_email)

def send_newsletter_confirmation(email, name=""):
    send_templated_email(
        'newsletter_welcome',
        email,
        {'name': name or 'Fitness Enthusiast'},
        settings.EMAIL_HOST_USER or 'newsletter@fitcoachpro.com'
    )


def send_welcome_member_email(email, name=""):
    send_templated_email(
        'welcome_member',
        email,
        {'name': name or 'Fitness Enthusiast'},
        settings.EMAIL_HOST_USER or 'welcome@fitcoachpro.com'
    )

def send_contact_inquiry_receipt(email, name, subject_text):
    send_templated_email(
        'contact_receipt',
        email,
        {'name': name, 'subject_text': subject_text},
        settings.EMAIL_HOST_USER or 'support@fitcoachpro.com'
    )


def send_support_ticket_acknowledgement(ticket):
    send_templated_email(
        'support_acknowledgement',
        ticket.email,
        {
            'name': ticket.name,
            'subject_text': ticket.subject,
            'category': ticket.category,
            'priority': ticket.priority,
        },
        settings.EMAIL_HOST_USER or 'support@fitcoachpro.com'
    )


def send_support_ticket_internal_alert(ticket):
    support_email = getattr(settings, 'SUPPORT_EMAIL', '') or settings.EMAIL_HOST_USER or 'support@fitcoachpro.com'
    send_templated_email(
        'support_internal_alert',
        support_email,
        {
            'name': ticket.name,
            'email': ticket.email,
            'category': ticket.category,
            'priority': ticket.priority,
            'subject_text': ticket.subject,
            'message': ticket.message,
            'admin_notes': ticket.admin_notes or 'None',
        },
        support_email
    )


def send_weekly_digest(email, name, summary_lines):
    send_templated_email(
        'weekly_digest',
        email,
        {'name': name or 'Fitness Enthusiast', 'summary_lines': summary_lines},
        settings.EMAIL_HOST_USER or 'digest@fitcoachpro.com'
    )


def send_churn_prevention_email(email, name, message_lines):
    send_templated_email(
        'churn_prevention',
        email,
        {'name': name or 'Fitness Enthusiast', 'summary_lines': message_lines},
        settings.EMAIL_HOST_USER or 'success@fitcoachpro.com'
    )


def send_referral_reward_email(email, name, reward_points):
    send_templated_email(
        'referral_reward',
        email,
        {'name': name or 'Fitness Enthusiast', 'reward_points': reward_points},
        settings.EMAIL_HOST_USER or 'referrals@fitcoachpro.com'
    )


def send_trainer_notification_email(email, name, subject_text):
    send_templated_email(
        'trainer_notification',
        email,
        {'name': name or 'Trainer', 'subject_text': subject_text},
        settings.EMAIL_HOST_USER or 'coach@fitcoachpro.com'
    )
