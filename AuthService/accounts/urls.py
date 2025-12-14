from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import LoginView, LogoutView, AdminOnlyView, MagasinierOnlyView , MeView, AuthHealthView

# les URLs finales :
urlpatterns = [
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    #for permissions DRF
    path('admin-only/', AdminOnlyView.as_view(), name='admin_only'),
    path('magasinier-only/', MagasinierOnlyView.as_view(), name='magasinier_only'),
    path('health/', AuthHealthView.as_view(), name='auth_health'),
    
]
