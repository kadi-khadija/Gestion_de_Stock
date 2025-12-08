from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "level",
            "message",
            "stock_id",
            "piece_id",
            "reference",
            "nom",
            "location",
            "quantity",
            "min_quantity",
            "created_at",
            "status",
        ]
        read_only_fields = ["id", "created_at"]
