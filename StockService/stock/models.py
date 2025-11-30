
from django.db import models

# adapte si ton modèle s'appelle autrement
from .models import Piece  # ou from pieces.models import Piece

class Stock(models.Model):
    piece = models.ForeignKey(
        Piece,
        on_delete=models.CASCADE,
        related_name="stocks"
    )
    quantity = models.PositiveIntegerField(default=0)
    min_quantity = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=100, blank=True)  # "magasin central", "dépôt 1", etc.
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("piece", "location")
        verbose_name = "Stock"
        verbose_name_plural = "Stocks"

    def __str__(self):
        loc = f" @ {self.location}" if self.location else ""
        return f"{self.piece} - {self.quantity}{loc}"

    # --- logique métier pratique ---

    def increase(self, amount: int):
        """Augmenter la quantité de stock."""
        if amount < 0:
            raise ValueError("amount must be positive")
        self.quantity += amount
        self.save()

    def decrease(self, amount: int):
        """Diminuer la quantité de stock sans passer en négatif."""
        if amount < 0:
            raise ValueError("amount must be positive")
        if amount > self.quantity:
            raise ValueError("not enough stock")
        self.quantity -= amount
        self.save()

    @property
    def is_below_minimum(self) -> bool:
        return self.quantity < self.min_quantity

