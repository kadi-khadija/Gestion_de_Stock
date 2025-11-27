from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import LoginSerializer
from .permissions import IsAdmin, IsMagasinier

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