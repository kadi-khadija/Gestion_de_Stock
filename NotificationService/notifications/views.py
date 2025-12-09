from django.shortcuts import render
from django.db import connection
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.all()

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        level_param = self.request.query_params.get("level")
        if level_param:
            qs = qs.filter(level=level_param)

        return qs


class NotificationMarkReadView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "Liste d'IDs invalide ou vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = Notification.objects.filter(id__in=ids).update(status="READ")
        return Response({"updated": updated}, status=status.HTTP_200_OK)

class NotificationHealthView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]

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
                "service": "notification-service",
                "status": overall_status,
                "database": db_status,
            },
            status=http_status,
        )


