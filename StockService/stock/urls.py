# stock/urls.py
from django.urls import path
from .views import (
    StockListCreateView,
    StockDetailView,
    StockMovementCreateView,
    StockMovementListView,
    StockHealthView,
)

urlpatterns = [
    path("stock/", StockListCreateView.as_view(), name="stock_list_create"),
    path("stock/<int:pk>/", StockDetailView.as_view(), name="stock_detail"),
    path("stock/movement/", StockMovementCreateView.as_view(), name="stock_movement"),
    path("stock/movements/", StockMovementListView.as_view(), name="stock_movements"),
    path("health/", StockHealthView.as_view(), name="stock_health"),
]
