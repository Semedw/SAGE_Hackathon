from django.urls import path
from . import views

urlpatterns = [
    path("applications/", views.ReviewerApplicationListView.as_view(), name="reviewer-application-list"),
    path("applications/<int:pk>/", views.ReviewerApplicationDetailView.as_view(), name="reviewer-application-detail"),
    path("applications/<int:pk>/action/", views.ReviewerActionView.as_view(), name="reviewer-application-action"),
]
