from django.core.mail import send_mail
from django.conf import settings

def send_newsletter_confirmation(email, name=""):
    subject = "Welcome to the FitCoachPro Elite Newsletter!"
    message = f"Hello {name if name else 'Fitness Enthusiast'},\n\nThank you for subscribing to our elite newsletter. You will now receive science-backed fitness protocols, nutrition blueprints, and professional performance strategies directly in your inbox.\n\nStay Elite,\nThe FitCoachPro Team"
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER or 'newsletter@fitcoachpro.com',
        [email],
        fail_silently=True,
    )

def send_contact_inquiry_receipt(email, name, subject_text):
    subject = f"We've received your inquiry: {subject_text}"
    message = f"Hello {name},\n\nThank you for reaching out to FitCoachPro. Our team has received your inquiry regarding '{subject_text}' and will get back to you within 24 hours.\n\nBest regards,\nThe FitCoachPro Support Team"
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER or 'support@fitcoachpro.com',
        [email],
        fail_silently=True,
    )
