from django.db import models

# Create your models here.

class Piece(models.Model):
    reference = models.CharField(max_length=50, unique=True) #ex: "MTR-455"
    nom = models.CharField(max_length=100)  #ex: "Filtre à huile"
    categorie = models.CharField(max_length=50)  #ex: Électronique
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2)
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2)
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference} - {self.nom}"


