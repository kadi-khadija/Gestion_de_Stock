import jwt
from django.conf import settings
from django.http import JsonResponse
from django.urls import resolve

class JWTMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        # Autoriser login sans token
        if request.path.startswith("/api/auth/login/"):
            return self.get_response(request)

        # Récupérer token dans le header
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"detail": "Token manquant"}, status=401)

        token = auth_header.split(" ")[1]

        try:
            jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except Exception as e:
            return JsonResponse({"detail": "Token invalide"}, status=401)

        return self.get_response(request)
