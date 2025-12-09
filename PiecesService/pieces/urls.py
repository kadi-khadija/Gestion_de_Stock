from django.urls import path
from .views import PieceListCreateView, PieceDetailView, PiecesHealthView

urlpatterns = [
    path('pieces/', PieceListCreateView.as_view(), name='pieces_list_create'),
    path('pieces/<int:pk>/', PieceDetailView.as_view(), name='piece_detail'),
    path('health/', PiecesHealthView.as_view(), name='pieces_health'),
]
