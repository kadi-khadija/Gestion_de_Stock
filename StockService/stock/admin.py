

# Register your models here.

from django.contrib import admin
from .models import Stock

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ("piece", "location", "quantity", "min_quantity", "last_updated")
