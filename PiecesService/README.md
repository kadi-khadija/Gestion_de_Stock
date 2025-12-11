# PiecesService — Gestion des pièces de rechange  
Microservice du projet **Gestion de Stock**

---

## 1. Rôle du service

PiecesService est responsable de :

- la gestion du catalogue de pièces de rechange
- les opérations CRUD (Create, Read, Update, Delete)
- la recherche par référence / nom / catégorie
- l'intégration avec StockService (consultation du stock)
- l'exposition d'un endpoint `/health/` pour Consul

Ce service fournit toutes les données nécessaires pour l’affichage, la recherche et la gestion des pièces dans l’UI.

---

## 2. Structure du projet

PiecesService/
│── pieces/
│ ├── models.py # Modèle Piece
│ ├── views.py # API CRUD + recherche
│ ├── serializers.py
│ ├── urls.py # Routes REST
│ └── admin.py
│
│── piecesservice/
│ ├── settings.py # DRF, CORS, DB config
│ ├── urls.py # Inclusion routes API
│ └── wsgi.py
│
│── manage.py
│── README.md 

---

## 3. Prérequis

- Python 
- Django 
- Django REST Framework
- Consul (service discovery)
- Traefik (reverse proxy)
- Base SQLite (par défaut)
- Virtualenv recommandé

---

## 4. Installation du service

Depuis le dossier `PiecesService` :

```bash

pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers

---

## 5. Lancer le service

python manage.py runserver 8001
Le microservice est accessible directement via :
http://127.0.0.1:8001/api/pieces/

Mais dans une architecture microservices, toutes les requêtes passent par Traefik :
http://127.0.0.1:8090/api/pieces/

---

## 6. Intégration avec Consul
Le service est enregistré dans :

C:\consul\config\pieces-service.json

{
  "service": {
    "name": "pieces-service",
    "id": "pieces-service-1",
    "address": "127.0.0.1",
    "port": 8001,
    "tags": [
      "traefik.enable=true",
      "traefik.http.routers.pieces.rule=PathPrefix(`/api/pieces`)",
      "traefik.http.routers.pieces.entrypoints=web"
    ],
    "checks": [
      {
        "id": "pieces-health",
        "name": "Pieces Service Health",
        "http": "http://127.0.0.1:8001/api/health/",
        "interval": "10s",
        "timeout": "3s"
      }
    ]
}

Consul surveille la santé du service et informe Traefik pour le routage dynamique.

---

## 7. Routage via Traefik
Traefik expose toutes les APIs via un seul point d'entrée :
http://127.0.0.1:8090

Ainsi, le front-end utilise :

http://127.0.0.1:8090/api/pieces/
http://127.0.0.1:8090/api/pieces/{id}/

---

## 8. Endpoints de l’API PiecesService

🔸 1. GET /api/pieces/
Liste toutes les pièces (avec pagination DRF).

Paramètres optionnels :

*Paramètre	   *Type	           *Description
search	      query	           Recherche par nom, référence, catégorie
page	       int	           Numéro de page
page_size	   int	           Taille de la page

Exemple :

GET /api/pieces/?search=filtre&page=1

🔸 2. POST /api/pieces/
Créer une nouvelle pièce.

{
  "reference": "P123",
  "nom": "Filtre à huile",
  "categorie": "Mécanique",
  "prix_achat": 500.0,
  "prix_vente": 750.0
}

🔸 3. GET /api/pieces/{id}/

Récupère une pièce précise.

🔸 4. PUT /api/pieces/{id}/

Met à jour une pièce.

🔸 5. DELETE /api/pieces/{id}/
Supprime une pièce.

## 9. Architecture interne
models.py

Modèle principal :
Piece (reference, nom, categorie, prix_achat, prix_vente)

 serializers.py
Validation + sérialisation JSON.

 views.py
.ListCreateAPIView
.RetrieveUpdateDestroyAPIView
.Filtrage + recherche intégrée

 urls.py
Définition des routes REST :

path('api/pieces/', PieceListCreateView.as_view()),
path('api/pieces/<int:pk>/', PieceDetailView.as_view()),
