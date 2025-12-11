# Gestion de Stock — Architecture Microservices (Django + Consul + Traefik)

Projet complet de gestion de stock organisé en **microservices**, comprenant :
- Authentification & rôles utilisateurs  
- Catalogue de pièces  
- Gestion du stock  
- Système de notifications  
- Service Discovery avec **Consul**  
- Reverse Proxy & Load Balancer avec **Traefik**  
- UI HTML/JS utilisant Traefik comme point d'entrée unique  

---

# 1. Architecture générale du projet

Gestion_de_Stock/
│
├── AuthService/ # Microservice d'authentification
├── PiecesService/ # Microservice catalogue de pièces
├── StockService/ # Microservice gestion du stock
├── NotificationService/ # Microservice notifications
│
├── UI/ # Interface utilisateur (HTML/JS/CSS)
│
├── service-registry.json # Registre des services (documentation interne)
|
│
└── README.md # README global

Chaque microservice est **autonome**, possède sa propre base de données, ses routes et son README dédié.

---

# 2. Microservices inclus

 Service                Port       Rôle 

**AuthService**         8000       Authentification, JWT, rôles, middleware 
 **PiecesService**      8001       Catalogue des pièces, CRUD 
 **StockService**       8002       Stock, mouvements IN/OUT, historique 
 **NotificationService** 8003      Notifications stock bas/épuisé 

Tous les services sont accessibles via **Traefik** sur un port unifié :  
 `http://127.0.0.1:8090/api/...`

---

# 3. Outils principaux

## Django REST Framework
Framework backend pour exposer toutes les APIs REST.

## Consul — Service Discovery
Permet à chaque microservice de s’enregistrer dynamiquement via :
C:\consul\config<service>.json

Traefik consulte Consul pour trouver les services disponibles.

Accès UI :  
 http://127.0.0.1:8500

## Traefik — Reverse Proxy / Load Balancer
Traefik gère :
- le routage vers les microservices
- la santé (health check) des services
- un point d’entrée unique pour l’UI

Dashboard :  
 http://127.0.0.1:8091/dashboard/

## UI HTML/JS
L’UI communique **uniquement** via Traefik :
const API_BASE = "http://127.0.0.1:8090";

---

# 4. Installation & lancement du projet (mode développement)

## 1 Démarrer Consul

Depuis `C:\consul` :

consul.exe agent -dev -data-dir=.\data -config-dir=.\config
Interface :
.. http://127.0.0.1:8500

## 2 Démarrer Traefik
Depuis C:\traefik :

traefik.exe --configFile=traefik.yml
Dashboard :
 http://127.0.0.1:8091/dashboard/

## 3 Lancer les microservices Django
Dans quatre fenêtres différentes :

cd AuthService
python manage.py runserver 8000

cd PiecesService
python manage.py runserver 8001

cd StockService
python manage.py runserver 8002

cd NotificationService
python manage.py runserver 8003

## 4 Lancer l'UI
Depuis navigateur :
 → http://127.0.0.1:5500

L'UI appellera automatiquement :
http://127.0.0.1:8090/api/...
via Traefik.

---

##  5. Mapping des API (Résumé)

# AuthService
POST /api/auth/login/
GET  /api/auth/me/
POST /api/auth/refresh/
GET  /api/auth/health/

# PiecesService
GET    /api/pieces/
POST   /api/pieces/
GET    /api/pieces/{id}/
PUT    /api/pieces/{id}/
DELETE /api/pieces/{id}/

# StockService
GET  /api/stock/
GET  /api/stock/movements/
POST /api/stock/movement/

# NotificationService
GET  /api/notifications/
POST /api/notifications/
POST /api/notifications/mark-read/

---

# 6. Architecture générale (schéma)
                   +--------------------+
                   |       UI (JS)      |
                   |  http://127.0.0.1:5500
                   +----------+---------+
                              |
                              v
                     +--------+---------+
                     |     Traefik      |
                     |   Port : 8090    |
                     +--------+---------+
                              |
        ----------------------------------------------------
        |                   |                |             |
        v                   v                v             v
 +-------------+    +--------------+  +--------------+ +---------------+
 | AuthService |    | PiecesService|  | StockService | |NotificationSvc|
 | :8000       |    | :8001        |  | :8002        | | :8003         |
 +-------------+    +--------------+  +--------------+ +---------------+

                     ^     ^     ^     ^
                     |     |     |     |
                     +-----+-----+-----+
                     |     Consul      |
                     | Service Registry |
                     +------------------+

