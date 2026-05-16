from django.urls import path, include
from . import views

urlpatterns = [
    path("", views.ApplicantApplicationListCreateView.as_view(), name="application-list-create"),
    path("<int:pk>/", views.ApplicantApplicationDetailView.as_view(), name="application-detail"),
    path("<int:pk>/documents/", include("apps.documents.urls")),
    path("<int:pk>/evaluate/", include("apps.evaluations.urls")),
]
