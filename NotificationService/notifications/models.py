from django.db import models


class Notification(models.Model):
    LEVEL_CHOICES = (
        ("LOW", "Stock bas"),
        ("ZERO", "Stock épuisé"),
    )

    SEVERITY_LOW = "LOW"  
    SEVERITY_OUT = "OUT" 


    STATUS_CHOICES = (
        ("UNREAD", "Non lu"),
        ("READ", "Lu"),
    )

    type = models.CharField(max_length=50, default="STOCK_ALERT")

    level = models.CharField(
        max_length=10,
        choices=LEVEL_CHOICES,
    )

    message = models.CharField(max_length=255, blank=True)

    stock_id = models.IntegerField(null=True, blank=True)
    piece_id = models.IntegerField(null=True, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    nom = models.CharField(max_length=255, blank=True)

    location = models.CharField(max_length=255, blank=True)

    quantity = models.IntegerField(null=True, blank=True)
    min_quantity = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="UNREAD",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.level}] {self.reference or self.nom} @ {self.location}"
