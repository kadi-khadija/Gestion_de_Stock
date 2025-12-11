#  StockService — Gestion du stock et des mouvements  
Microservice du projet **Gestion de Stock**

---

## 1. Rôle du service

StockService est responsable de :

- la gestion des niveaux de stock des pièces  
- l’enregistrement des mouvements (entrée, sortie)  
- la consultation de l’historique des opérations  
- l’intégration avec PiecesService (pour vérifier l’existence des pièces)  
- l’exposition d’un endpoint `/health/` utilisé par Consul  

Ce service est essentiel pour l’UI (tableau de bord, mouvement de stock, alertes).

---

## 2. Structure du projet

StockService/
│── stock/
│ ├── models.py # Modèles Stock 
│ ├── views.py # API stock + mouvements
│ ├── serializers.py
│ ├── urls.py # Routes REST
│ └── admin.py
│
│── stockservice/
│ ├── settings.py # CORS, DRF, DB
│ ├── urls.py
│ └── wsgi.py
│
│── manage.py
│── README.md


---

##  3. Prérequis

- Python 
- Django 
- Django REST Framework
- Consul (service discovery)
- Traefik (reverse proxy)
- SQLite (par défaut)
- Virtualenv recommandé

---

##  4. Installation

Depuis le dossier `StockService` :

```bash
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install pika

---

## 5. Lancement du service

python manage.py runserver 8002
Accès direct :

http://127.0.0.1:8002/api/stock/
http://127.0.0.1:8002/api/stock/movements/

Accès via Traefik (UI, microservices) :

http://127.0.0.1:8090/api/stock/
http://127.0.0.1:8090/api/stock/movements/

---

## 6. Intégration avec Consul
Fichier de configuration placé dans :

C:\consul\config\stock-service.json
Exemple :

{
  "service": {
    "name": "stock-service",
    "id": "stock-service-1",
    "address": "127.0.0.1",
    "port": 8002,
    "tags": [
      "traefik.enable=true",
      "traefik.http.routers.stock.rule=PathPrefix(`/api/stock`)",
      "traefik.http.routers.stock.entrypoints=web"
    ],
    "checks": [
      {
        "id": "stock-health",
        "name": "Stock Service Health",
        "http": "http://127.0.0.1:8002/api/health/",
        "interval": "10s",
        "timeout": "3s"
      }
    ]
  
}

Consul surveille l’état du service et informe Traefik.

---

## 7. Routage via Traefik
Toutes les requêtes du front-end passent par :

http://127.0.0.1:8090

Ainsi, l’UI appelle :

GET  /api/stock/
GET  /api/stock/movements/
POST /api/stock/movement/

---

## 8. Endpoints de l’API StockService

🔸 1. GET /api/stock/
Retourne le stock actuel de toutes les pièces.

Réponse typique :

[
  {
    "piece": 1,
    "quantite": 32
  },
  {
    "piece": 2,
    "quantite": 10
  }
]

🔸 2. GET /api/stock/movements/
Retourne l’historique complet des mouvements.

Réponse :

[
  {
    "piece": 1,
    "type": "ENTREE",
    "quantite": 5,
    "date": "2025-12-10"
  }
]

🔸 3. POST /api/stock/movement/
Crée un nouveau mouvement ENTREE ou SORTIE.

{
  "piece": 1,
  "type": "SORTIE",
  "quantite": 2
}
Effets automatiques :

.met à jour la quantité en stock
.génère un enregistrement dans l’historique
.peut déclencher une alerte (NotificationService)

---

## 9. Détails techniques internes
* models.py
Deux modèles :

Stock(piece, quantite)
Movement(piece, type, quantite, date)

Types de mouvement :

.ENTREE
.SORTIE

* serializers.py
Valide les mouvements :

-quantité > 0
-pièce existante

* views.py
StockListView → GET /api/stock/
MovementListView → GET /api/stock/movements/
MovementCreateView → POST /api/stock/movement/

* urls.py

path('api/stock/', StockListView.as_view()),
path('api/stock/movements/', MovementListView.as_view()),
path('api/stock/movement/', MovementCreateView.as_view()),
