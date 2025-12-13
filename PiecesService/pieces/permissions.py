import requests
from rest_framework.permissions import BasePermission

AUTH_ME_URL = "http://127.0.0.1:8090/api/auth/me/"


def fetch_user_info(request):
    auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
    if not auth:
        return None
    try:
        r = requests.get(AUTH_ME_URL, headers={"Authorization": auth}, timeout=3)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


class IsAuthenticatedViaAuthService(BasePermission):
    def has_permission(self, request, view):
        user = fetch_user_info(request)
        if not user:
            return False
        request.auth_user = user
        return True


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "auth_user", None) or fetch_user_info(request)
        return bool(user) and user.get("role") == "admin"


class IsMagasinier(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "auth_user", None) or fetch_user_info(request)
        return bool(user) and user.get("role") in ["admin", "magasinier"]
