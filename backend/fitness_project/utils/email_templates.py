from dataclasses import dataclass


@dataclass(frozen=True)
class EmailTemplate:
    subject: str
    body: str


def _bullet_lines(lines):
    return '\n'.join(f'- {line}' for line in lines)


TEMPLATES = {
    'newsletter_welcome': EmailTemplate(
        subject='Welcome to the FitCoachPro Elite Newsletter!',
        body=(
            'Hello {name},\n\n'
            'Thank you for subscribing to our elite newsletter. You will now receive science-backed fitness protocols, nutrition blueprints, and professional performance strategies directly in your inbox.\n\n'
            'Stay Elite,\nThe FitCoachPro Team'
        ),
    ),
    'contact_receipt': EmailTemplate(
        subject="We've received your inquiry: {subject_text}",
        body=(
            'Hello {name},\n\n'
            "Thank you for reaching out to FitCoachPro. Our team has received your inquiry regarding '{subject_text}' and will get back to you within 24 hours.\n\n"
            'Best regards,\nThe FitCoachPro Support Team'
        ),
    ),
    'support_acknowledgement': EmailTemplate(
        subject='Support ticket received: {subject_text}',
        body=(
            'Hello {name},\n\n'
            "We received your support request about '{subject_text}'.\n"
            'Our team has tagged it as {category} with a {priority} priority.\n\n'
            'We will review it shortly and reply as soon as possible.\n\n'
            'FitCoachPro Support'
        ),
    ),
    'support_internal_alert': EmailTemplate(
        subject='[{priority}] {subject_text}',
        body=(
            'New support ticket submitted.\n\n'
            'Name: {name}\n'
            'Email: {email}\n'
            'Category: {category}\n'
            'Priority: {priority}\n'
            'Subject: {subject_text}\n\n'
            'Message:\n{message}\n\n'
            'Admin notes: {admin_notes}'
        ),
    ),
    'weekly_digest': EmailTemplate(
        subject='Your weekly FitCoachPro performance digest',
        body=(
            'Hello {name},\n\n'
            'Here is your weekly summary:\n\n'
            '{summary}\n\n'
            'Keep the momentum going,\nFitCoachPro'
        ),
    ),
    'churn_prevention': EmailTemplate(
        subject='We noticed activity slowing down',
        body=(
            'Hello {name},\n\n'
            'We wanted to share a quick check-in:\n\n'
            '{summary}\n\n'
            'Reply to this email if you want help getting back on track.\n\nFitCoachPro'
        ),
    ),
    'welcome_member': EmailTemplate(
        subject='Welcome to FitCoachPro',
        body=(
            'Hello {name},\n\n'
            'Welcome to FitCoachPro. Your account is ready, and your training roadmap is set.\n'
            'Start with your dashboard, complete your first workout, and build momentum this week.\n\n'
            'FitCoachPro'
        ),
    ),
    'referral_reward': EmailTemplate(
        subject='Your referral reward has been added',
        body=(
            'Hello {name},\n\n'
            'Your referral was successful and {reward_points} reward points have been added to your account.\n'
            'Keep sharing FitCoachPro to earn more benefits.\n\nFitCoachPro'
        ),
    ),
    'trainer_notification': EmailTemplate(
        subject='Trainer update: {subject_text}',
        body=(
            'Hello {name},\n\n'
            "You have a new coaching update related to '{subject_text}'.\n"
            'Please review the latest request in the admin panel.\n\nFitCoachPro'
        ),
    ),
}


def render_email_template(template_key, context=None):
    context = context or {}
    template = TEMPLATES[template_key]

    normalized_context = dict(context)
    if 'summary_lines' in normalized_context and 'summary' not in normalized_context:
        normalized_context['summary'] = _bullet_lines(normalized_context['summary_lines'])
    if 'summary' in normalized_context and isinstance(normalized_context['summary'], (list, tuple)):
        normalized_context['summary'] = _bullet_lines(normalized_context['summary'])
    if 'category' in normalized_context and normalized_context['category']:
        normalized_context['category'] = str(normalized_context['category']).replace('_', ' ')
    if 'priority' in normalized_context and normalized_context['priority']:
        normalized_context['priority'] = str(normalized_context['priority'])

    subject = template.subject.format(**normalized_context)
    body = template.body.format(**normalized_context)
    return subject, body