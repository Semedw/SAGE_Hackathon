from django.urls import path
from . import views

urlpatterns = [
    path("", views.EvaluateApplicationView.as_view(), name="application-evaluate"),
    path("result/", views.EvaluationDetailView.as_view(), name="application-evaluation"),
]
