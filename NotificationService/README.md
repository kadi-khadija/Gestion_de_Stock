#  NotificationService — Notifications de stock  
Microservice du projet **Gestion de Stock**

---

## 1. Rôle du service

NotificationService est responsable de :

- la création des notifications (stock bas, stock atteint 0, mouvements critiques)
- la récupération des notifications (par statut : READ / UNREAD)
- le marquage en "lues"
- l’intégration avec le front-end (alertes en temps réel)
- l’exposition d’un endpoint `/health/` pour Consul et Traefik

C’est le service qui permet à l’UI d’afficher les alertes  lorsque le stock devient critique.

---

## 2. Structure du projet

NotificationService/
│── notifications/
│ ├── models.py # Modèle Notification
│ ├── views.py # API REST notifications
│ ├── serializers.py
│ ├── urls.py # Définition des routes
│ └── admin.py
│
│── notificationservice/
│ ├── settings.py # CORS, DRF, DB, Middlewares
│ ├── urls.py
│ └── wsgi.py
│
│── manage.py
│── README.md

---

## 3. Prérequis

- Python 
- Django 
- Django REST Framework (DRF)
- Virtualenv recommandé
- Consul + Traefik 
- SQLite 

---

## 4. Installation

Exécution depuis le dossier `NotificationService` :

```bash

pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install pika

---

## 5. Lancer le service

python manage.py runserver 8003

Accès direct :

http://127.0.0.1:8003/api/notifications/

Accès via Traefik (frontend) :

http://127.0.0.1:8090/api/notifications/

---
## 6. Intégration avec Consul
Fichier attendu dans :

C:\consul\config\notification-service.json

{
  "service": {
    "name": "notification-service",
    "id": "notification-service-1",
    "address": "127.0.0.1",
    "port": 8003,
    "tags": [
      "traefik.enable=true",
      "traefik.http.routers.notification.rule=PathPrefix(`/api/notifications`)",
      "traefik.http.routers.notification.entrypoints=web"
    ],
    "checks": [
      {
        "id": "notification-health",
        "name": "Notification Service Health",
        "http": "http://127.0.0.1:8003/api/health/",
        "interval": "10s",
        "timeout": "3s"
      }
    ]
  
}

Consul surveille et informe Traefik si le service est UP/DOWN.

---

## 7. Routage avec Traefik
Toutes les API utilisées par ton UI passent par :

 http://127.0.0.1:8090

Exemples :

GET  /api/notifications/
POST /api/notifications/
POST /api/notifications/mark-read/

---

## 8. Endpoints de l’API NotificationService
🔸 1. GET /api/notifications/
Retourne toutes les notifications.

Query params optionnels :

*Paramètre      	*Exemple	        *Description
status	          UNREAD	            Filtrer uniquement les non-lues
status	           READ	               Filtrer les lues

Réponse :
[
  {
    "id": 1,
    "message": "Stock critique pour la pièce 12",
    "status": "UNREAD",
    "date": "2025-12-10"
  }
]

🔸 2. POST /api/notifications/
Créer une nouvelle notification.

Exemple 
{
  "message": "Stock épuisé pour la pièce 8"
}

Réponse :
{
  "id": 7,
  "message": "Stock épuisé pour la pièce 8",
  "status": "UNREAD",
  "date": "2025-12-10"
}

🔸 3. POST /api/notifications/mark-read/

Marque toutes les notifications comme lues.

---

## 9. Détails internes
* Modèle Notification (models.py)

Notification:
- message (Texte)
- status  (READ / UNREAD)
- date    (auto_now_add)

* Sérialiseur (serializers.py)
Valide :

.message obligatoire
.statut optionnel 

* Vues (views.py)
.NotificationListCreateView → GET + POST notifications
.MarkAllReadView → POST marquer tout comme lu

* Routes (urls.py)

path('api/notifications/', NotificationListCreateView.as_view()),
path('api/notifications/mark-read/', MarkAllReadView.as_view()),


