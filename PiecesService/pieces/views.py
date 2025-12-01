from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Piece
from .serializers import PieceSerializer
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated 


# Custom pagination
class PiecePagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 100


class PieceListCreateView(APIView):
    permission_classes = [IsAuthenticated]
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
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PieceDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        try:
            piece = Piece.objects.get(pk=pk)
        except Piece.DoesNotExist:
            return Response({"detail": "Pièce introuvable"}, status=404)

        serializer = PieceSerializer(piece)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            piece = Piece.objects.get(pk=pk)
        except Piece.DoesNotExist:
            return Response({"detail": "Pièce introuvable"}, status=404)

        serializer = PieceSerializer(piece, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            piece = Piece.objects.get(pk=pk)
        except Piece.DoesNotExist:
            return Response({"detail": "Pièce introuvable"}, status=404)

        piece.delete()
        return Response({"detail": "Pièce supprimée"}, status=204)
