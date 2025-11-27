from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import LoginView, AdminOnlyView, MagasinierOnlyView

urlpatterns = [
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', LoginView.as_view(), name='login'),

    #for permissions DRF
    path('admin-only/', AdminOnlyView.as_view(), name='admin_only'),
    path('magasinier-only/', MagasinierOnlyView.as_view(), name='magasinier_only'),
]
