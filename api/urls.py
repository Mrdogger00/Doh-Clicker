from django.urls import path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from . import views

urlpatterns = [
    path('upgrade/', views.UpgradeAPIView.as_view()),
    path('click/', views.ClickAPIView.as_view()),
    path('settings/', views.SettingsAPIView.as_view()),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema")),
]