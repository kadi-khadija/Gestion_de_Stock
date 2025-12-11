from django.contrib.auth.models import AbstractUser
from django.db import models

#un modèle utilisateur personnalisé qui hérite de AbstractUser
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('magasinier', 'Magasinier'),
    ] # un champ role (avec deux valeurs possibles) supplementaire (les champs gere deja par django "username, password , email")

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='magasinier')

    def __str__(self):
        return f"{self.username} ({self.role})"
