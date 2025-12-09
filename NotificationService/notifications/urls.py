from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationHealthView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path(
        "notifications/mark-read/",
        NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
    path("health/", NotificationHealthView.as_view(), name="notification_health"),
]