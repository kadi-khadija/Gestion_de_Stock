

# Register your models here.

from django.contrib import admin
from .models import Stock, StockMovement

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ("piece", "location", "quantity", "min_quantity", "last_updated")
    list_filter = ("location",)
    search_fields = ("piece__reference", "piece__nom", "piece__categorie")

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        "stock",
        "movement_type",
        "quantity",
        "previous_quantity",
        "new_quantity",
        "comment",
        "created_at",
    )
    list_filter = ("movement_type", "stock__location")
    search_fields = ("stock__piece__reference", "stock__piece__nom")