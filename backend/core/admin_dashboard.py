from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count, Sum
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.utils import timezone
from django.views import View

from accounts.models import CustomUser, UserSubscription
from cms.models import BlogPost, DynamicPage, NewsletterSubscription
from core.models import SupportTicket
from payments.models import Payment
from workouts.models import UserWorkoutProgress

from .models import CoachSession  # core.models


@dataclass
class DashboardCard:
    title: str
    value: Any
    subtitle: str = ""


def _safe_int(x: Any) -> int:
    try:
        return int(x)
    except Exception:
        return 0


@staff_member_required
def trainer_dashboard_context(request: HttpRequest) -> Dict[str, Any]:
    trainer = request.user

    # Sessions the trainer leads
    upcoming_sessions = CoachSession.objects.filter(
        coach=trainer,
        scheduled_at__gte=timezone.now(),
    ).count()

    pending_sessions = CoachSession.objects.filter(
        coach=trainer,
        status__in=["pending_approval", "reschedule_requested"],
    ).count()

    assigned_clients = trainer.clients.count() if hasattr(trainer, "clients") else 0

    # Payouts (if model relations exist)
    payouts_pending = 0
    payouts_paid = 0
    try:
        payouts = trainer.payouts_received.all()
        payouts_pending = payouts.filter(status="pending").count()
        payouts_paid = payouts.filter(status="paid").count()
    except Exception:
        pass

    # Recent client activity (workouts completed)
    client_ids = []
    try:
        client_ids = list(trainer.clients.values_list("id", flat=True))
    except Exception:
        pass

    recent_clients_workouts = 0
    if client_ids:
        recent_clients_workouts = UserWorkoutProgress.objects.filter(
            user_id__in=client_ids,
            completed=True,
            completed_date__gte=timezone.now().date().replace(day=1),
        ).count()

    # Coupons/Ads etc are admin-only in general; we keep trainer focused.

    return {
        "role": "trainer",
        "cards": [
            DashboardCard("Assigned Clients", assigned_clients, "Clients currently under your coaching").__dict__,
            DashboardCard("Upcoming Sessions", upcoming_sessions, "Scheduled for the future").__dict__,
            DashboardCard("Pending Approvals", pending_sessions, "Needs your action").__dict__,
            DashboardCard("Client Workouts (MTD)", recent_clients_workouts, "Workouts completed since month start").__dict__,
            DashboardCard("Payouts (Pending)", payouts_pending, "Coach payouts waiting").__dict__,
            DashboardCard("Payouts (Paid)", payouts_paid, "Coach payouts completed").__dict__,
        ],
        "quick_links": [
            {"label": "Coach Sessions", "url": "/admin/core/coachsessions/"},
            {"label": "Coach Payouts", "url": "/admin/core/coachpayout/"},
            {"label": "Clients", "url": "/admin/accounts/customuser/?role=coach"},
            {"label": "Support Tickets", "url": "/admin/core/supportticket/"},
        ],
    }


@staff_member_required
def admin_dashboard_context(request: HttpRequest) -> Dict[str, Any]:
    now = timezone.now()

    total_users = CustomUser.objects.count()
    active_subscriptions = UserSubscription.objects.filter(status="active").count()
    total_revenue = Payment.objects.filter(status="completed").aggregate(t=Sum("amount"))["t"] or 0

    workouts_completed = UserWorkoutProgress.objects.filter(completed=True).count()

    # New users this month (approx)
    new_users_this_month = CustomUser.objects.filter(created_at__gte=now.replace(day=1)).count()

    open_tickets = SupportTicket.objects.filter(status="open").count()
    urgent_tickets = SupportTicket.objects.filter(status="open", priority__in=["urgent", "high"]).count()

    unread_notifications = 0
    try:
        from core.models import Notification

        unread_notifications = Notification.objects.filter(is_read=False).count()
    except Exception:
        pass

    active_pages = DynamicPage.objects.filter(is_visible=True).count()
    blog_published = BlogPost.objects.filter(status="published").count()
    active_newsletter = NewsletterSubscription.objects.filter(is_active=True).count()

    # Expiring support tickets / coupons could be added later.

    cards = [
        DashboardCard("Total Users", _safe_int(total_users), "Registered members").__dict__,
        DashboardCard("Active Subscriptions", _safe_int(active_subscriptions), "Currently active subscriptions").__dict__,
        DashboardCard("Revenue (Completed)", float(total_revenue), "Payments with completed status").__dict__,
        DashboardCard("Workouts Completed", _safe_int(workouts_completed), "All time completed workouts").__dict__,
        DashboardCard("New Users (MTD)", _safe_int(new_users_this_month), "Created since month start").__dict__,
        DashboardCard("Open Tickets", _safe_int(open_tickets), "Needs support attention").__dict__,
        DashboardCard("Urgent Tickets", _safe_int(urgent_tickets), "Priority escalations").__dict__,
        DashboardCard("Active Pages", _safe_int(active_pages), "Dynamic pages visible").__dict__,
        DashboardCard("Published Blog Posts", _safe_int(blog_published), "Content ready for users").__dict__,
        DashboardCard("Newsletter Active", _safe_int(active_newsletter), "Subscribers currently enabled").__dict__,
    ]

    quick_links = [
        {"label": "Users", "url": "/admin/accounts/customuser/"},
        {"label": "Subscriptions", "url": "/admin/accounts/usersubscription/"},
        {"label": "Payments", "url": "/admin/payments/payment/"},
        {"label": "Support Tickets", "url": "/admin/core/supportticket/"},
        {"label": "Coach Sessions", "url": "/admin/core/coachsessions/"},
        {"label": "Dynamic Pages", "url": "/admin/cms/dynamicpage/"},
        {"label": "Blog Posts", "url": "/admin/cms/blogpost/"},
        {"label": "Newsletter", "url": "/admin/cms/newslettersubscription/"},
    ]

    return {
        "role": "admin",
        "cards": cards,
        "quick_links": quick_links,
        "unread_notifications": unread_notifications,
    }


class FitnessAdminDashboardView(View):
    template_name = "admin/dashboard/fitness_admin_dashboard.html"

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        # Trainer-side dashboard if role == coach
        role = getattr(request.user, "role", None)
        if role == "coach":
            context = trainer_dashboard_context(request)
        else:
            context = admin_dashboard_context(request)

        return render(request, self.template_name, context)

