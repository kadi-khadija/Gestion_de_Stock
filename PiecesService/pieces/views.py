from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Piece
from .serializers import PieceSerializer
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny 
from django.db import connection


# Custom pagination (Pour rendre l’UI plus fluide)
class PiecePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class PieceListCreateView(APIView):
    permission_classes = [IsAuthenticated] #obligation d'avoir un token JWT valide pour accéder à cette vue.
    def get(self, request):
        search = request.GET.get("search", "")
        queryset = Piece.objects.all()

        if search:
            queryset = queryset.filter(
                Q(reference__icontains=search) |
                Q(nom__icontains=search) |
                Q(categorie__icontains=search)
            )

        paginator = PiecePagination()
        paginated_qs = paginator.paginate_queryset(queryset, request)
        serializer = PieceSerializer(paginated_qs, many=True)

        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = PieceSerializer(data=request.data)
        if serializer.is_valid(): #Si les données sont valides
            serializer.save() # création de piece en base.
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PieceDetailView(APIView):
    permission_classes = [IsAuthenticated] #obligation d'avoir un token JWT valide pour accéder à cette vue.
    def get(self, request, pk): #récupérer une pièce précise
        try:
            piece = Piece.objects.get(pk=pk)
        except Piece.DoesNotExist:
            return Response({"detail": "Pièce introuvable"}, status=404)

        serializer = PieceSerializer(piece)
        return Response(serializer.data)

    def put(self, request, pk): #mise à jour
        try:
            piece = Piece.objects.get(pk=pk)
        except Piece.DoesNotExist:
            return Response({"detail": "Pièce introuvable"}, status=404)

        serializer = PieceSerializer(piece, data=request.data) #applique les nouvelles données
        if serializer.is_valid():
            serializer.save() # si tout va bien sauvegarde la piece
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def delete(self, request, pk): # suppression d'une piece
        try:
            piece = Piece.objects.get(pk=pk)
        except Piece.DoesNotExist:
            return Response({"detail": "Pièce introuvable"}, status=404)

        piece.delete() 
        return Response({"detail": "Pièce supprimée"}, status=204)


class PiecesHealthView(APIView):
 #Ce endpoint est utilisé par Consul / Traefik pour savoir si PiecesService est en bonne santé.
    authentication_classes = []
    permission_classes = [AllowAny] #Accessible sans token (la logique pour un health check)

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
            db_status = "UP"
        except Exception:
            db_status = "DOWN"

        overall_status = "UP" if db_status == "UP" else "DOWN"
        http_status = status.HTTP_200_OK if overall_status == "UP" else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                "service": "pieces-service",
                "status": overall_status,
                "database": db_status,
            },
            status=http_status,
        )
