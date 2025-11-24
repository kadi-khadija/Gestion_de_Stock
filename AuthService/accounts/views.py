from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import LoginSerializer

class LoginView(APIView):
    authentication_classes = []  # permet login sans token
    permission_classes = []      # pas besoin d'être authentifié

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)

