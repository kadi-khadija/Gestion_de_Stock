from rest_framework import serializers
from .models import Piece

class PieceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Piece
        fields = "__all__"

    def validate_reference(self, value):
        if " " in value:
            raise serializers.ValidationError("La référence ne doit pas contenir d'espaces.")
        return value

    def validate(self, data):
        if data["prix_vente"] < data["prix_achat"]:
            raise serializers.ValidationError(
                "Le prix de vente doit être supérieur ou égal au prix d'achat."
            )
        return data
