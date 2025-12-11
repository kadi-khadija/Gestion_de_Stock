from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import LoginSerializer
from .permissions import IsAdmin, IsMagasinier

# Pas d’authentification ni permissions, le middleware skip cette route (chemin public). 
class LoginView(APIView):
    authentication_classes = []  # login without token
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            return Response(
                serializer.validated_data,
                status=status.HTTP_200_OK
            )

        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

class AdminOnlyView(APIView):
     #que pour l'admin
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({"message": f"Bienvenue admin {request.user.username} !"})


class MagasinierOnlyView(APIView):
    #pour l'admin et le magasiniers
    permission_classes = [IsAuthenticated, IsMagasinier]

    def get(self, request):
        return Response({"message": f"Bienvenue magasinier {request.user.username} !"})
    
class MeView(APIView):
    permission_classes = [IsAuthenticated] #Nécessite d’être authentifié.

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        })  

class AuthHealthView(APIView): 

    # Health sans auth pour que Traefik / monitoring puissent y accéder
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;") # try to select 1 from the db, 
            db_status = "UP" # si ça marche  database: "UP", status HTTP 200 
        except Exception:
            db_status = "DOWN" #sinon database: "DOWN", status HTTP 503

        overall_status = "UP" if db_status == "UP" else "DOWN"
        http_status = status.HTTP_200_OK if overall_status == "UP" else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                "service": "auth-service",
                "status": overall_status,
                "database": db_status,
            },
            status=http_status,
        )
  