#  AuthService — Gestion de l'authentification (JWT) & rôles utilisateurs  
Microservice du projet **Gestion de Stock**

---

## 1. Rôle du service

AuthService est responsable de :

- l’authentification des utilisateurs (JWT)
- la gestion des rôles (ADMIN, MAGASINIER)
- la sécurisation des endpoints des autres services via un middleware JWT
- l'exposition d’un endpoint `/health/` pour Consul (Service Discovery)

Ce service est **le point d’entrée obligatoire** pour toute action nécessitant une identité utilisateur.

---

## 2. Structure du projet

AuthService/
│── accounts/
│ ├── models.py
│ ├── views.py
│ ├── urls.py
│ ├── serializers.py
│ └── middleware.py # Vérification automatique du token JWT
│
│── authservice/
│ ├── settings.py # CORS, JWT, middleware, config globale
│ ├── urls.py
│ └── wsgi.py
│
│── manage.py
│── README.md

---

## 3. Prérequis

- Python 
- Django 
- Django REST Framework
- SimpleJWT
- Consul (Service Registry)
- Traefik (Reverse Proxy pour le routage global)
- Virtualenv (recommandé)

---

## 4. Installation

Depuis le dossier `AuthService` :

```bash
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers

---

## 5. Lancer le service

python manage.py runserver 8000

Le service écoute sur :
http://127.0.0.1:8000/

Mais en production de développement microservices, toutes les requêtes passent via Traefik :
http://127.0.0.1:8090/api/auth/...

---

## 6. Middleware JWT

Chaque requête (sauf login/refresh/OPTIONS/admin) est :

1. interceptée par JWTMiddleware
2. validée par SimpleJWT
3. enrichie avec l’utilisateur authentifié

---

## 7. Intégration avec Consul

AuthService est déclaré dans :
C:\consul\config\auth-service.json

{
  "service": {
    "name": "auth-service",
    "id": "auth-service-1",
    "address": "127.0.0.1",
    "port": 8000,
    "tags": [
      "traefik.enable=true",
      "traefik.http.routers.auth.rule=PathPrefix(`/api/auth`)",
      "traefik.http.routers.auth.entrypoints=web"
    ],
    "checks": [
      {
        "id": "auth-health",
        "name": "Auth Service Health",
        "http": "http://127.0.0.1:8000/api/auth/health/",
        "interval": "10s",
        "timeout": "3s"
      }
    ]
}

Consul monitor l’état du service et informe Traefik.

---

## 8. Routage via Traefik

Traefik expose toutes les routes via un point unique :
http://127.0.0.1:8090

Ainsi :

http://127.0.0.1:8090/api/auth/login/
http://127.0.0.1:8090/api/auth/me/
http://127.0.0.1:8090/api/auth/refresh/

---

## 9. Endpoints de l’API AuthService

🔸 POST /api/auth/login/
Authentifie un utilisateur.
Body :
{
  "username": "wissam",
  "password": "oubouchou"
}

Réponse :
{
  "access": "...",
  "refresh": "...",
  "user": {
    "id": 1,
    "username": "wissam",
    "role": "ADMIN"
}

🔸 GET /api/auth/me/
Retourne les informations de l’utilisateur connecté.
Header :
Authorization: Bearer <token>

🔸 POST /api/auth/refresh/
Renouvelle un access token.

🔸 GET /api/auth/health/
Health check utilisé par Consul.
Réponse :

{
  "service": "auth-service",
  "status": "UP",
  "database": "UP"
}

---

## 10. Exemples de tests avec curl
Login:
curl -X POST http://127.0.0.1:8090/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"wissam\",\"password\":\"oubouchou\"}"

Me:
curl http://127.0.0.1:8090/api/auth/me/ ^
  -H "Authorization: Bearer <token>"

---

## 11. Architecture interne

. models.py → modèle User étendu avec rôle
. serializers.py → sérialisation JWT + user
. views.py → login, refresh, me, registres de rôles
. middleware.py → gestion du token, permissions
. urls.py → routes du service
. settings.py → JWT, CORS, registres apps