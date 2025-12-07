
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from .models import Stock, StockMovement
from .serializers import (
    StockSerializer,
    StockMovementSerializer,
    StockMovementCreateSerializer,
)


# --- Pagination ---

class StockPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class StockMovementPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


# --- Stock list + create ---

class StockListCreateView(APIView):
    """
    GET /api/stock/    -> liste du stock (recherche + pagination)
    POST /api/stock/   -> créer une ligne de stock
    """

    def get(self, request):
        piece_id = request.GET.get("piece_id")
        location = request.GET.get("location", "")

        queryset = Stock.objects.all()

        if piece_id:
            queryset = queryset.filter(piece_id=piece_id)
        if location:
            queryset = queryset.filter(location__icontains=location)

        paginator = StockPagination()
        paginated_qs = paginator.paginate_queryset(queryset, request)
        serializer = StockSerializer(paginated_qs, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        """
        Body JSON:
        {
          "piece_id": 1,
          "location": "Magasin central",
          "quantity": 10,
          "min_quantity": 2
        }
        """
        serializer = StockSerializer(data=request.data)
        if serializer.is_valid():
            stock = serializer.save()
            return Response(
                StockSerializer(stock).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Stock detail / update / delete ---

class StockDetailView(APIView):
    """
    GET /api/stock/<pk>/
    PUT /api/stock/<pk>/
    DELETE /api/stock/<pk>/
    """

    def get_object(self, pk):
        return get_object_or_404(Stock, pk=pk)

    def get(self, request, pk):
        stock = self.get_object(pk)
        serializer = StockSerializer(stock)
        return Response(serializer.data)

    def put(self, request, pk):
        stock = self.get_object(pk)
        serializer = StockSerializer(stock, data=request.data)
        if serializer.is_valid():
            stock = serializer.save()
            return Response(StockSerializer(stock).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        stock = self.get_object(pk)
        stock.delete()
        return Response({"detail": "Stock supprimé"}, status=status.HTTP_204_NO_CONTENT)


# --- Mouvement IN / OUT ---

class StockMovementCreateView(APIView):
    """
    POST /api/stock/movement/

    Body JSON:
    {
      "piece_id": 1,
      "location": "Magasin central",
      "movement_type": "IN" | "OUT",
      "quantity": 5,
      "comment": "Réception fournisseur"
    }
    """

    def post(self, request):
        serializer = StockMovementCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        piece_id = data["piece_id"]
        location = data.get("location", "") or ""
        movement_type = data["movement_type"]
        qty = data["quantity"]
        comment = data.get("comment", "")
        min_quantity = data.get("min_quantity", None)

        with transaction.atomic():
            if movement_type == "IN":
                stock, created = Stock.objects.select_for_update().get_or_create(
                    piece_id=piece_id,
                    location=location,
                    defaults={"quantity": 0, "min_quantity": min_quantity or 0},
                )
                previous_qty = stock.quantity
                # si on a fourni un seuil, on met à jour la ligne existante
                if min_quantity is not None:
                    stock.min_quantity = min_quantity
                    
                stock.increase(qty)

            else:  # OUT
                stock = get_object_or_404(
                    Stock.objects.select_for_update(),
                    piece_id=piece_id,
                    location=location,
                )
                previous_qty = stock.quantity

                if qty > stock.quantity:
                    return Response(
                        {"detail": "Stock insuffisant pour effectuer la sortie."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                stock.decrease(qty)

            movement = StockMovement.objects.create(
                stock=stock,
                movement_type=movement_type,
                quantity=qty,
                previous_quantity=previous_qty,
                new_quantity=stock.quantity,
                comment=comment,
            )


        return Response(
            {
                "stock": StockSerializer(stock).data,
                "movement": StockMovementSerializer(movement).data,
            },
            status=status.HTTP_201_CREATED,
        )


# --- Historique des mouvements ---

class StockMovementListView(APIView):
    """
    GET /api/stock/movements/?piece_id=...&location=...&type=IN|OUT
    """

    def get(self, request):
        qs = StockMovement.objects.select_related("stock").all()

        piece_id = request.GET.get("piece_id")
        location = request.GET.get("location")
        movement_type = request.GET.get("type")

        if piece_id:
            qs = qs.filter(stock__piece_id=piece_id)
        if location:
            qs = qs.filter(stock__location__icontains=location)
        if movement_type in ("IN", "OUT"):
            qs = qs.filter(movement_type=movement_type)

        paginator = StockMovementPagination()
        paginated_qs = paginator.paginate_queryset(qs, request)
        serializer = StockMovementSerializer(paginated_qs, many=True)
        return paginator.get_paginated_response(serializer.data)
