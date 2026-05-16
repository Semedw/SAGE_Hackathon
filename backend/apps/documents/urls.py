from django.urls import path
from . import views

urlpatterns = [
    path("", views.DocumentListCreateView.as_view(), name="document-list-create"),
    path("<int:doc_pk>/", views.DocumentDeleteView.as_view(), name="document-delete"),
]
