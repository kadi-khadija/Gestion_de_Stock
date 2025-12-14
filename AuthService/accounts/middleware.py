from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication

class JWTMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        
        # une liste de chemins publics 
        public_paths = [
            "/api/auth/login/",
            "/api/auth/refresh/",
            "/api/auth/logout/",
            "/api/auth/health/",
        ]
        
        # laisse passer les chemains publics sans token
        if any(request.path.startswith(p) for p in public_paths):
            return self.get_response(request)

        if request.path.startswith("/admin/"):
            return self.get_response(request)
        
        # djang0 lit le header de authorization
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"detail": "Token manquant"}, status=401) 

        token = auth_header.split(" ")[1]

        try:
            validated_token = self.jwt_auth.get_validated_token(token)
            request.user = self.jwt_auth.get_user(validated_token)
        except Exception:
            return JsonResponse({"detail": "Token invalide"}, status=401)

        return self.get_response(request) # si token est valide, il récupère l’utilisateur 