from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/applications/", include("apps.applications.urls")),
    path("api/reviewer/", include("apps.reviewer.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
]

# Always serve media files (Render has ephemeral storage, but needed for demo)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
