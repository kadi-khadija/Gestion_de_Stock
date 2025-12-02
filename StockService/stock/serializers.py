from rest_framework import serializers
from pieces.models import Piece
from .models import Stock, StockMovement


class StockSerializer(serializers.ModelSerializer):
    # écriture : piece_id
    piece_id = serializers.PrimaryKeyRelatedField(
        source="piece",
        queryset=Piece.objects.all(),
        write_only=True
    )
    # lecture : string de Piece ("REF - nom")
    piece = serializers.StringRelatedField(read_only=True)
    is_below_minimum = serializers.BooleanField(read_only=True)

    class Meta:
        model = Stock
        fields = [
            "id",
            "piece",
            "piece_id",
            "location",
            "quantity",
            "min_quantity",
            "is_below_minimum",
            "last_updated",
        ]

    def validate(self, data):
        quantity = data.get("quantity", getattr(self.instance, "quantity", 0))
        min_quantity = data.get(
            "min_quantity", getattr(self.instance, "min_quantity", 0)
        )

        if quantity < 0:
            raise serializers.ValidationError(
                {"quantity": "La quantité ne peut pas être négative."}
            )
        if min_quantity < 0:
            raise serializers.ValidationError(
                {"min_quantity": "Le seuil minimum ne peut pas être négatif."}
            )
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    piece = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "movement_type",
            "quantity",
            "previous_quantity",
            "new_quantity",
            "piece",
            "location",
            "comment",
            "created_at",
        ]

    def get_piece(self, obj):
        return str(obj.stock.piece)

    def get_location(self, obj):
        return obj.stock.location


class StockMovementCreateSerializer(serializers.Serializer):
    # utilisé pour POST /api/stock/movement/
    piece_id = serializers.PrimaryKeyRelatedField(
        source="piece",
        queryset=Piece.objects.all()
    )
    location = serializers.CharField(required=False, allow_blank=True)
    movement_type = serializers.ChoiceField(choices=["IN", "OUT"])
    quantity = serializers.IntegerField(min_value=1)
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être > 0.")
        return value
