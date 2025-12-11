from django.urls import path
from .views import PieceListCreateView, PieceDetailView, PiecesHealthView

urlpatterns = [
    path('pieces/', PieceListCreateView.as_view(), name='pieces_list_create'), #GET/POST
    path('pieces/<int:pk>/', PieceDetailView.as_view(), name='piece_detail'), #GET/POST/DELETE
    path('health/', PiecesHealthView.as_view(), name='pieces_health'), #GET
]
# grace au traefic côté front tu appelles http://127.0.0.1:8090/api/pieces/
