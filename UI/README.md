UI – **Interface utilisateur** du projet Gestion de Stock

# 1. Rôle du module UI

Ce dossier contient toute l’interface utilisateur du système Gestion_de_Stock.
Il s’agit d’un front-end léger, entièrement en HTML, CSS et JavaScript, sans framework.
L’UI communique avec les microservices backend via Traefik sur le port 8090.

# 2. Structure du dossier
UI/
│
├── static/
│   ├── style.css          # Styles généraux (login)
│   ├── dashboard.css      # Styles du tableau de bord & des vues
│
├── js/
│   ├── auth.js            # Gestion de l’authentification (login, token, session)
│   ├── login.js           # Logique de la page de connexion
│   ├── app.js             # Logique principale : navigation + fetch API + injection HTML
│
├── template/
│   ├── login.html         # Page de connexion
│   ├── dashboard.html     # Layout global : sidebar + zone de contenu
│   ├── app.html           # Les templates HTML de toutes les vues
│
└── README.md              # Documentation du module UI

# 3. Fonctionnement général
  # 3.1. Pages statiques

login.html
dashboard.html

Elles sont servies directement par un simple serveur statique :

python -m http.server 5500

   # 3.2. Système de templates

Toutes les vues du dashboard sont regroupées dans :

template/app.html

Chaque vue est définie dans un bloc :

<template id="view-pieces">
    <!-- HTML de la liste des pièces -->
</template>


L’avantage :

.tous les écrans sont centralisés
.maintenance plus simple
.pas besoin de réécrire le HTML dans app.js
.app.js ne contient que du JavaScript, pas de HTML

   # 3.3. Injection dynamique via app.js

Dans app.js, une fonction centrale insère le template dynamique :

function loadView(viewId) {
    const template = document.getElementById(viewId);
    document.getElementById('content').innerHTML = template.innerHTML;
}

Ensuite, app.js exécute des routines associées :

.charger les pièces
.afficher l’historique du stock
.afficher les notifications
.gérer les formulaires (ajout / modification)
.gérer la navigation du menu

# 4. Authentification

La gestion du token JWT est assurée par :

js/auth.js
js/login.js

   # Fonctionnement :

.L’utilisateur se connecte → POST /api/auth/login/
.Le backend (via Traefik) renvoie access et refresh
.Le token est stocké dans localStorage

Toutes les requêtes API utilisent :

Authorization: "Bearer <token>"

Si le token expire → redirection automatique vers login.

# 5. Communication avec les microservices

Tous les appels API passent par Traefik :

http://127.0.0.1:8090/api/...


Exemples :

. /api/pieces/
. /api/stock/
. /api/stock/movements/
. /api/notifications/
. /api/auth/login/
. /api/auth/me/

L’UI ne contacte jamais directement :

8000 (Auth)
8001 (Pieces)
8002 (Stock)
8003 (Notifications)

Traefik intercepte le routage et applique les règles.

# 6. Mode de lancement

Dans un terminal :

cd UI
python -m http.server 5500

Ensuite ouvrir :

http://127.0.0.1:5500/template/login.html

# 7. Tests manuels

Depuis le dashboard :

✔ Voir la liste des pièces
✔ Ajouter / modifier une pièce
✔ Rechercher une pièce
✔ Historique des mouvements
✔ Notifications
✔ Déconnexion
✔ Vérifier que toutes les requêtes passent par 127.0.0.1:8090

Dans DevTools → onglet Network :

Toutes les requêtes doivent ressembler à :

GET http://127.0.0.1:8090/api/pieces/

# 8. Schéma “UI → Traefik → Services → DB” 


                 🌐 Navigateur (Chrome, Edge…)
                 URL : http://127.0.0.1:5500/template/login.html
                 URL : http://127.0.0.1:5500/template/dashboard.html
                               │
                               │  (HTML / CSS / JS statiques)
                               ▼
                  ┌───────────────────────────────┐
                  │   Serveur statique (Python)   │
                  │   python -m http.server 5500  │
                  └───────────────┬───────────────┘
                                  │
                                  │  Requêtes API AJAX (fetch)
                                  │  ex : /api/pieces/, /api/stock/...
                                  ▼
                      http://127.0.0.1:8090
                  ┌───────────────────────────────┐
                  │        Traefik (Reverse Proxy)│
                  │        Port : 8090 (web)      │
                  │        Port : 8091 (dashboard)│
                  └───────────────┬───────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼

   AuthService                 PiecesService         StockService
  (Django REST)               (Django REST)         (Django REST)
    :8000                        :8001                :8002
  ┌──────────┐                 ┌──────────┐         ┌──────────┐
  │ /api/... │                 │ /api/... │         │ /api/... │
  └────┬─────┘                 └────┬─────┘         └────┬─────┘
       │                            │                      │
       ▼                            ▼                      ▼
   Base Auth DB               Base Pièces DB          Base Stock DB

            ▲
            │
            │
       NotificationService  (Django REST)
                :8003
            ┌──────────┐
            │ /api/... │
            └────┬─────┘
                 ▼
           Base Notifications DB


                   Service Discovery
                  ┌───────────────────┐
                  │      Consul       │
                  │   Port : 8500     │
                  └───────────────────┘

Les services (Auth, Pieces, Stock, Notifications) sont enregistrés
dans Consul, et Traefik récupère cette info pour router les requêtes.