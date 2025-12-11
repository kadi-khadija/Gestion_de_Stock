from rest_framework.permissions import BasePermission

# Ces classes sont utilisées dans les vues AdminOnlyView et MagasinierOnlyView pour démontrer les permissions.

class IsAdmin(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsMagasinier(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["magasinier", "admin"]
