// app.js

// === CONFIG API ===
// Adapte cette URL selon ton routing Django global.
// Si dans ton project urls.py tu as quelque chose comme:
//   path("api/", include("pieces.urls"))
// alors mets: "http://127.0.0.1:8000/api/pieces/"
// Si c'est directement include("pieces.urls") à la racine, ce sera "/pieces/"
const API_PIECES = "http://127.0.0.1:8001/api/pieces/";

// Map de pages -> contenu HTML
const PLACEHOLDERS = {
    'dashboard': `
        <div class="placeholder">
            <h3>Tableau de bord</h3>
            <p>Vue d'ensemble et raccourcis. (Placeholders — vous ajouterez les widgets plus tard.)</p>
            <div class="small-note">Utilisez le menu à gauche pour naviguer.</div>
        </div>
    `,

    // 🔹 UI AJOUT PIÈCE 🔹
    'add-piece': `
        <div class="add-piece-page">
            <div class="add-piece-header">
                <h3>Ajouter une pièce</h3>
                <p>Créer une nouvelle pièce dans le catalogue.</p>
            </div>

            <div id="add-piece-success" class="msg-success"></div>
            <div id="add-piece-error" class="msg-error"></div>

            <form id="add-piece-form" class="add-piece-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="ap-ref">Référence <span class="required">*</span></label>
                        <input type="text" id="ap-ref" name="reference" required placeholder="ex: MTR-455">
                    </div>

                    <div class="form-group">
                        <label for="ap-name">Nom <span class="required">*</span></label>
                        <input type="text" id="ap-name" name="nom" required placeholder="ex: Filtre à huile">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="ap-category">Catégorie <span class="required">*</span></label>
                        <input type="text" id="ap-category" name="categorie" required placeholder="ex: Électronique, Mécanique...">
                    </div>

                    <div class="form-group">
                        <label for="ap-buy">Prix d'achat <span class="required">*</span></label>
                        <input type="number" step="0.01" id="ap-buy" name="prix_achat" required placeholder="ex: 100.00">
                    </div>

                    <div class="form-group">
                        <label for="ap-sell">Prix de vente <span class="required">*</span></label>
                        <input type="number" step="0.01" id="ap-sell" name="prix_vente" required placeholder="ex: 150.00">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary">Enregistrer la pièce</button>
                    <button type="reset" class="btn-secondary">Réinitialiser</button>
                </div>

                <p class="small-note">
                    Les champs marqués par <span class="required">*</span> sont obligatoires.<br>
                    Le prix de vente doit être supérieur ou égal au prix d'achat.
                </p>
            </form>
        </div>
    `,

    // Tu pourras plus tard remplacer ces placeholders par de vraies UI
    'list-pieces': `
        <div class="placeholder">
            <h3>Liste des pièces</h3>
            <p>Tableau à venir — interface en développement.</p>
            <div class="small-note">Tâche: créer la page liste des pièces.</div>
        </div>
    `,
    'search-piece': `
        <div class="placeholder">
            <h3>Rechercher une pièce</h3>
            <p>Barre de recherche à venir — interface en développement.</p>
        </div>
    `,
    'edit-piece': `
        <div class="placeholder">
            <h3>Modifier / Supprimer pièce</h3>
            <p>Fonctionnalité réservée aux admins. Interface en développement.</p>
        </div>
    `,
    'stock': `
        <div class="placeholder">
            <h3>Stock disponible</h3>
            <p>Affichage des quantités — interface en développement.</p>
        </div>
    `,
    'move-in': `
        <div class="placeholder">
            <h3>Mouvement d'entrée</h3>
            <p>Formulaire IN — interface en développement.</p>
        </div>
    `,
    'move-out': `
        <div class="placeholder">
            <h3>Mouvement de sortie</h3>
            <p>Formulaire OUT — interface en développement.</p>
        </div>
    `,
    'history': `
        <div class="placeholder">
            <h3>Historique des mouvements</h3>
            <p>Tableau historique — interface en développement.</p>
        </div>
    `,
    'notifications': `
        <div class="placeholder">
            <h3>Notifications</h3>
            <p>Alerte stock minimum — interface en développement (admin only).</p>
        </div>
    `
};

function loadContent(action) {
    const place = document.getElementById('content-area');
    const title = document.getElementById('page-title');
    if (!place || !title) return;

    const content = PLACEHOLDERS[action] || `
        <div class="placeholder">
            <h3>Page</h3>
            <p>Contenu en développement.</p>
        </div>
    `;
    place.innerHTML = content;

    const human = {
        'dashboard': 'Tableau de bord',
        'add-piece': 'Ajouter une pièce',
        'list-pieces': 'Liste des pièces',
        'search-piece': 'Rechercher une pièce',
        'edit-piece': 'Modifier / Supprimer pièce',
        'stock': 'Stock disponible',
        'move-in': "Mouvement d'entrée",
        'move-out': "Mouvement de sortie",
        'history': "Historique des mouvements",
        'notifications': "Notifications"
    };
    title.textContent = human[action] || 'Tableau de bord';

    // Initialisation spécifique par page
    if (action === 'add-piece') {
        initAddPieceUI();
    }
}

/**
 * UI Ajout : branche le formulaire "Ajouter une pièce"
 * - récupère les champs
 * - POST /pieces/
 * - affiche succès / erreurs
 * - appelle reloadPiecesTable() si elle existe
 */
function initAddPieceUI() {
    const form = document.getElementById('add-piece-form');
    const successBox = document.getElementById('add-piece-success');
    const errorBox = document.getElementById('add-piece-error');

    if (!form) return;

    successBox.textContent = "";
    errorBox.textContent = "";

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        successBox.textContent = "";
        errorBox.textContent = "";

        const reference = document.getElementById('ap-ref').value.trim();
        const nom = document.getElementById('ap-name').value.trim();
        const categorie = document.getElementById('ap-category').value.trim();
        const prixAchatStr = document.getElementById('ap-buy').value;
        const prixVenteStr = document.getElementById('ap-sell').value;

        if (!reference || !nom || !categorie || prixAchatStr === "" || prixVenteStr === "") {
            errorBox.textContent = "Tous les champs marqués * sont obligatoires.";
            return;
        }

        const prix_achat = parseFloat(prixAchatStr);
        const prix_vente = parseFloat(prixVenteStr);

        if (isNaN(prix_achat) || isNaN(prix_vente)) {
            errorBox.textContent = "Les prix doivent être des nombres valides.";
            return;
        }

        const payload = {
            reference,
            nom,
            categorie,
            prix_achat,
            prix_vente
        };

        const token = localStorage.getItem("access");
        if (!token) {
            errorBox.textContent = "Token manquant : veuillez vous reconnecter.";
            return;
        }

        try {
            const resp = await fetch(API_PIECES, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                let msg = "Erreur lors de la création de la pièce.";

                try {
                    const data = await resp.json();

                    // Cas DRF classique : { "field": ["msg"], "non_field_errors": ["msg"] }
                    if (typeof data === "object" && data !== null) {
                        const parts = [];

                        if (data.detail && typeof data.detail === "string") {
                            parts.push(data.detail);
                        }

                        if (data.non_field_errors) {
                            parts.push(
                                Array.isArray(data.non_field_errors)
                                    ? data.non_field_errors.join(" | ")
                                    : String(data.non_field_errors)
                            );
                        }

                        Object.keys(data).forEach((field) => {
                            if (field === "detail" || field === "non_field_errors") return;
                            const errors = data[field];
                            if (Array.isArray(errors)) {
                                parts.push(`${field}: ${errors.join(" | ")}`);
                            }
                        });

                        if (parts.length > 0) {
                            msg = parts.join(" — ");
                        }
                    }
                } catch (e) {
                    // si body pas JSON, garder msg par défaut
                }

                errorBox.textContent = `${msg} (code ${resp.status})`;
                return;
            }

            const created = await resp.json();
            console.log("Pièce créée:", created);

            successBox.textContent = "Pièce ajoutée avec succès.";
            form.reset();

            // Si tu implémentes plus tard une table de pièces,
            // tu pourras définir window.reloadPiecesTable() ailleurs
            if (typeof window.reloadPiecesTable === "function") {
                window.reloadPiecesTable();
            }
        } catch (err) {
            console.error(err);
            errorBox.textContent = "Erreur réseau : impossible de contacter le serveur.";
        }
    });
}

// Attacher les listeners de menu
document.addEventListener('DOMContentLoaded', function () {
    const menu = document.querySelector('.menu-list');
    if (!menu) return;

    menu.addEventListener('click', function (e) {
        const li = e.target.closest('.menu-item');
        if (!li || !menu.contains(li)) return;

        const action = li.dataset.action;
        if (!action) return;

        loadContent(action);
    });

    // Vue par défaut
    loadContent('dashboard');
});
