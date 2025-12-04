
const API_PIECES = "http://127.0.0.1:8001/api/pieces/";
const API_STOCK = "http://127.0.0.1:8002/api/stock/";
const API_STOCK_MOVEMENT = "http://127.0.0.1:8002/api/stock/movement/";
const API_STOCK_HISTORY = "http://127.0.0.1:8002/api/stock/movements/";

let currentEditedPieceId = null;
let editPiecesCache = [];

// Map de pages -> contenu HTML
const PLACEHOLDERS = {
    'dashboard': `
        <div class="placeholder">
            <h3>Tableau de bord</h3>
            <p>Vue d'ensemble et raccourcis. (Placeholders — vous ajouterez les widgets plus tard.)</p>
            <div class="small-note">Utilisez le menu à gauche pour naviguer.</div>
        </div>
    `,

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

    'list-pieces': `
        <div class="list-pieces-page">
           <h3>Liste des pièces</h3>
           <p>Catalogue complet des pièces enregistrées.</p>

          <div id="pieces-error" class="msg-error"></div>

          <div class="list-actions">
            <button id="refresh-pieces" class="btn-secondary">Actualiser</button>
          </div>

         <table class="pieces-table">
            <thead>
                <tr>
                    <th>Référence</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix achat</th>
                    <th>Prix vente</th>
                </tr>
            </thead>
            <tbody id="pieces-table-body">
                <tr><td colspan="5" style="text-align:center;">Chargement...</td></tr>
            </tbody>
         </table>
        </div>
    `,

    'search-piece': `
        <div class="search-piece-page">
             <h3>Rechercher une pièce</h3>
             <p>Rechercher par référence, nom ou catégorie.</p>

            <form id="search-piece-form" class="search-form">
              <input
                  type="text"
                  id="search-piece-input"
                  class="search-input"
                  placeholder="Ex: FHM, filtre, entretien..."
                />
               <button type="submit" class="btn-primary">Rechercher</button>
               <button type="button" id="search-piece-reset" class="btn-secondary">Réinitialiser</button>
            </form>

            <div id="search-piece-error" class="msg-error"></div>

            <table class="pieces-table">
               <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix achat</th>
                    <th>Prix vente</th>
                  </tr>
               </thead>
               <tbody id="search-piece-tbody">
                <tr>
                    <td colspan="5" style="text-align:center;">
                        Saisissez un terme et lancez une recherche.
                    </td>
                </tr>
               </tbody>
           </table>
       </div>
    `,

'edit-piece': `
    <div class="edit-piece-page">
        <div class="add-piece-header">
            <h3>Modifier / Supprimer une pièce</h3>
            <p>Choisissez une pièce, modifiez ses informations ou supprimez-la.</p>
        </div>

        <div id="edit-piece-success" class="msg-success"></div>
        <div id="edit-piece-error" class="msg-error"></div>

        <div class="form-group">
            <label for="edit-piece-select">Sélectionner une pièce</label>
            <div style="display:flex; gap:8px;">
                <select id="edit-piece-select" class="select-piece">
                    <option value="">-- Choisir une pièce --</option>
                </select>
                <button id="edit-piece-reload" class="btn-secondary">Recharger</button>
            </div>
        </div>

        <form id="edit-piece-form" class="add-piece-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="ep-ref">Référence <span class="required">*</span></label>
                    <input type="text" id="ep-ref" required>
                </div>

                <div class="form-group">
                    <label for="ep-name">Nom <span class="required">*</span></label>
                    <input type="text" id="ep-name" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="ep-category">Catégorie <span class="required">*</span></label>
                    <input type="text" id="ep-category" required>
                </div>

                <div class="form-group">
                    <label for="ep-buy">Prix d'achat <span class="required">*</span></label>
                    <input type="number" step="0.01" id="ep-buy" required>
                </div>

                <div class="form-group">
                    <label for="ep-sell">Prix de vente <span class="required">*</span></label>
                    <input type="number" step="0.01" id="ep-sell" required>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-primary">Enregistrer les modifications</button>
                <button type="button" id="edit-piece-delete" class="btn-danger">Supprimer la pièce</button>
            </div>

            <p class="small-note">
                Le prix de vente doit être supérieur ou égal au prix d'achat.<br>
                La suppression est définitive.
            </p>
        </form>
    </div>
`,

'stock': `
    <div class="stock-page">
        <h3>Stock disponible</h3>
        <p>Quantités en stock par pièce et par emplacement.</p>

        <div id="stock-error" class="msg-error"></div>

        <div class="list-actions">
            <button id="stock-refresh" class="btn-secondary">Actualiser</button>
        </div>

        <table class="pieces-table">
            <thead>
                <tr>
                    <th>ID pièce</th>
                    <th>Emplacement</th>
                    <th>Quantité</th>
                    <th>Seuil min.</th>
                    <th>Statut</th>
                    <th>Dernière mise à jour</th>
                </tr>
            </thead>
            <tbody id="stock-tbody">
                <tr>
                    <td colspan="6" style="text-align:center;">Chargement...</td>
                </tr>
            </tbody>
        </table>
    </div>
`,

'move-in': `
    <div class="move-page">
        <div class="add-piece-header">
            <h3>Mouvement d'entrée</h3>
            <p>Enregistrer une entrée de stock pour une pièce.</p>
        </div>

        <div id="movein-success" class="msg-success"></div>
        <div id="movein-error" class="msg-error"></div>

        <div class="form-group">
            <label for="movein-piece-select">Pièce</label>
            <div style="display:flex; gap:8px;">
                <select id="movein-piece-select" class="select-piece">
                    <option value="">-- Choisir une pièce --</option>
                </select>
                <button id="movein-reload" class="btn-secondary">Recharger</button>
            </div>
        </div>

        <form id="movein-form" class="add-piece-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="movein-qty">Quantité <span class="required">*</span></label>
                    <input type="number" id="movein-qty" min="1" required placeholder="Ex: 10">
                </div>

                <div class="form-group">
                    <label for="movein-location">Emplacement</label>
                    <input type="text" id="movein-location" placeholder="Ex: A-01, B-12...">
                </div>
            </div>

            <div class="form-group">
                <label for="movein-description">Description</label>
                <textarea id="movein-description" rows="2" placeholder="Ex: Réception fournisseur, correction de stock..."></textarea>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-primary">Enregistrer le mouvement</button>
            </div>

            <p class="small-note">
                Le mouvement sera enregistré comme une <strong>entrée (IN)</strong> de stock.
            </p>
        </form>
    </div>
`,

    'move-out': `
        <div class="placeholder">
            <h3>Mouvement de sortie</h3>
            <p>Formulaire OUT — interface en développement.</p>
        </div>
    `,

'history': `
    <div class="history-page">
        <h3>Historique des mouvements</h3>
        <p>Liste des mouvements d'entrée et de sortie de stock.</p>

        <div id="history-error" class="msg-error"></div>

        <div class="list-actions">
            <button id="history-refresh" class="btn-secondary">Actualiser</button>
        </div>

        <table class="pieces-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>ID pièce</th>
                    <th>Quantité</th>
                    <th>Emplacement</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody id="history-tbody">
                <tr>
                    <td colspan="6" style="text-align:center;">
                        Chargement...
                    </td>
                </tr>
            </tbody>
        </table>
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
    if (action === 'list-pieces') {
        loadPiecesList();

        const btn = document.getElementById("refresh-pieces");
        btn.addEventListener("click", () => loadPiecesList());
    }
    if (action === 'search-piece') {
        initSearchPieceUI();
    }
    if (action === 'edit-piece') {
        initEditPieceUI();
    }
    if (action === 'stock') {
        initStockUI();
    } 
    if (action === 'move-in') { initMoveInUI();}
    
    if (action === 'history') { initHistoryUI();}
}

async function loadPiecesList() {
    const tbody = document.getElementById("pieces-table-body");
    const errorBox = document.getElementById("pieces-error");

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chargement...</td></tr>`;
    errorBox.textContent = "";

    const token = localStorage.getItem("access");

    try {
        const resp = await fetch(API_PIECES, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        
        console.log("Status GET /api/pieces/:", resp.status);

        const data = await resp.json();
        console.log("Réponse brute:", data);

        if (!resp.ok) {
            
            const detail =
                data && data.detail ? ` (${data.detail})` : "";
            errorBox.textContent =
                "Erreur lors du chargement des pièces. Code : "
                + resp.status + detail;
            tbody.innerHTML = "";
            return;
        }

        let pieces = data;

        // pagination DRF 
        if (data.results) {
            pieces = data.results;
        }

        if (!Array.isArray(pieces) || pieces.length === 0) {
            tbody.innerHTML =
                `<tr><td colspan="5" style="text-align:center;">Aucune pièce trouvée.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        pieces.forEach(piece => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${piece.reference}</td>
                <td>${piece.nom}</td>
                <td>${piece.categorie}</td>
                <td>${piece.prix_achat}</td>
                <td>${piece.prix_vente}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        errorBox.textContent =
            "Erreur réseau : impossible de contacter le serveur.";
        tbody.innerHTML = "";
    }
}



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
                    
                }

                errorBox.textContent = `${msg} (code ${resp.status})`;
                return;
            }

            const created = await resp.json();
            console.log("Pièce créée:", created);

            successBox.textContent = "Pièce ajoutée avec succès.";
            form.reset();

            if (typeof window.reloadPiecesTable === "function") {
                window.reloadPiecesTable();
            }
        } catch (err) {
            console.error(err);
            errorBox.textContent = "Erreur réseau : impossible de contacter le serveur.";
        }
    });
}

function initSearchPieceUI() {
    const form = document.getElementById("search-piece-form");
    const input = document.getElementById("search-piece-input");
    const tbody = document.getElementById("search-piece-tbody");
    const errorBox = document.getElementById("search-piece-error");
    const resetBtn = document.getElementById("search-piece-reset");

    if (!form) return;

    errorBox.textContent = "";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.textContent = "";

        const query = input.value.trim();
        if (!query) {
            errorBox.textContent = "Veuillez saisir un terme de recherche.";
            return;
        }

        await searchPieces(query, tbody, errorBox);
    });

    resetBtn.addEventListener("click", () => {
        input.value = "";
        errorBox.textContent = "";
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Saisissez un terme et lancez une recherche.
                </td>
            </tr>
        `;
    });
}

async function searchPieces(query, tbody, errorBox) {
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;">Recherche en cours...</td>
        </tr>
    `;

    const token = localStorage.getItem("access");

    try {
        const resp = await fetch(`${API_PIECES}?search=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await resp.json();
        console.log("Résultats recherche:", data);

        if (!resp.ok) {
            const detail = data && data.detail ? ` (${data.detail})` : "";
            errorBox.textContent = `Erreur lors de la recherche. Code: ${resp.status}${detail}`;
            tbody.innerHTML = "";
            return;
        }

        
        let pieces = data;
        if (data.results) {
            pieces = data.results;
        }

        if (!Array.isArray(pieces) || pieces.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        Aucune pièce ne correspond à "${query}".
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = "";

        pieces.forEach(piece => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${piece.reference}</td>
                <td>${piece.nom}</td>
                <td>${piece.categorie}</td>
                <td>${piece.prix_achat}</td>
                <td>${piece.prix_vente}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        errorBox.textContent = "Erreur réseau : impossible de contacter le serveur.";
        tbody.innerHTML = "";
    }
}

function initEditPieceUI() {
    const select = document.getElementById("edit-piece-select");
    const reloadBtn = document.getElementById("edit-piece-reload");
    const form = document.getElementById("edit-piece-form");
    const deleteBtn = document.getElementById("edit-piece-delete");
    const successBox = document.getElementById("edit-piece-success");
    const errorBox = document.getElementById("edit-piece-error");

    if (!select || !form) return;

    successBox.textContent = "";
    errorBox.textContent = "";
    currentEditedPieceId = null;
    editPiecesCache = [];

    // Charger la liste des pièces dans le select
    loadPiecesForEdit();

    reloadBtn.addEventListener("click", () => {
        successBox.textContent = "";
        errorBox.textContent = "";
        loadPiecesForEdit();
    });

    select.addEventListener("change", () => {
        successBox.textContent = "";
        errorBox.textContent = "";
        const id = parseInt(select.value);
        if (!id) {
            currentEditedPieceId = null;
            form.reset();
            return;
        }
        const piece = editPiecesCache.find(p => p.id === id);
        if (piece) {
            currentEditedPieceId = piece.id;
            fillEditForm(piece);
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        successBox.textContent = "";
        errorBox.textContent = "";

        if (!currentEditedPieceId) {
            errorBox.textContent = "Veuillez d'abord sélectionner une pièce.";
            return;
        }

        const reference = document.getElementById("ep-ref").value.trim();
        const nom = document.getElementById("ep-name").value.trim();
        const categorie = document.getElementById("ep-category").value.trim();
        const prixAchatStr = document.getElementById("ep-buy").value;
        const prixVenteStr = document.getElementById("ep-sell").value;

        if (!reference || !nom || !categorie || prixAchatStr === "" || prixVenteStr === "") {
            errorBox.textContent = "Tous les champs sont obligatoires.";
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
            errorBox.textContent = "Token manquant, veuillez vous reconnecter.";
            return;
        }

        try {
            const resp = await fetch(`${API_PIECES}${currentEditedPieceId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            const data = await resp.json().catch(() => null);

            if (!resp.ok) {
                let msg = "Erreur lors de la mise à jour de la pièce.";
                if (data) {
                    const parts = [];
                    if (data.detail) parts.push(data.detail);
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
                    if (parts.length > 0) msg = parts.join(" — ");
                }
                errorBox.textContent = `${msg} (code ${resp.status})`;
                return;
            }

            successBox.textContent = "Pièce mise à jour avec succès.";

            // remettre à jour le cache & le select
            const updated = data;
            const idx = editPiecesCache.findIndex(p => p.id === updated.id);
            if (idx !== -1) editPiecesCache[idx] = updated;

            // mettre à jour le label dans le select
            const opt = document.querySelector(
                `#edit-piece-select option[value="${updated.id}"]`
            );
            if (opt) {
                opt.textContent = `${updated.reference} — ${updated.nom}`;
            }

        } catch (err) {
            console.error(err);
            errorBox.textContent = "Erreur réseau : impossible de contacter le serveur.";
        }
    });

    deleteBtn.addEventListener("click", async () => {
        successBox.textContent = "";
        errorBox.textContent = "";

        if (!currentEditedPieceId) {
            errorBox.textContent = "Veuillez d'abord sélectionner une pièce.";
            return;
        }

        const confirmDelete = window.confirm(
            "Êtes-vous sûr de vouloir supprimer cette pièce ? Cette action est définitive."
        );
        if (!confirmDelete) return;

        const token = localStorage.getItem("access");
        if (!token) {
            errorBox.textContent = "Token manquant, veuillez vous reconnecter.";
            return;
        }

        try {
            const resp = await fetch(`${API_PIECES}${currentEditedPieceId}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (!resp.ok && resp.status !== 204) {
                errorBox.textContent =
                    "Erreur lors de la suppression de la pièce. Code: " + resp.status;
                return;
            }

            successBox.textContent = "Pièce supprimée avec succès.";

            // enlever du select + cache + reset form
            const sel = document.getElementById("edit-piece-select");
            const option = sel.querySelector(
                `option[value="${currentEditedPieceId}"]`
            );
            if (option) option.remove();

            editPiecesCache = editPiecesCache.filter(
                p => p.id !== currentEditedPieceId
            );
            currentEditedPieceId = null;
            sel.value = "";
            document.getElementById("edit-piece-form").reset();

        } catch (err) {
            console.error(err);
            errorBox.textContent =
                "Erreur réseau : impossible de contacter le serveur.";
        }
    });
}

async function loadPiecesForEdit() {
    const select = document.getElementById("edit-piece-select");
    const errorBox = document.getElementById("edit-piece-error");
    if (!select) return;

    select.innerHTML = `<option value="">Chargement...</option>`;
    editPiecesCache = [];

    const token = localStorage.getItem("access");

    try {
        const resp = await fetch(API_PIECES, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await resp.json();
        if (!resp.ok) {
            const detail = data && data.detail ? ` (${data.detail})` : "";
            errorBox.textContent =
                "Erreur lors du chargement des pièces. Code: " +
                resp.status +
                detail;
            select.innerHTML = `<option value="">-- Erreur de chargement --</option>`;
            return;
        }

        let pieces = data;
        if (data.results) {
            pieces = data.results;
        }

        if (!Array.isArray(pieces) || pieces.length === 0) {
            select.innerHTML = `<option value="">-- Aucune pièce --</option>`;
            return;
        }

        editPiecesCache = pieces;
        select.innerHTML = `<option value="">-- Choisir une pièce --</option>`;

        pieces.forEach(piece => {
            const opt = document.createElement("option");
            opt.value = piece.id;
            opt.textContent = `${piece.reference} — ${piece.nom}`;
            select.appendChild(opt);
        });

    } catch (err) {
        console.error(err);
        errorBox.textContent =
            "Erreur réseau : impossible de contacter le serveur.";
        select.innerHTML = `<option value="">-- Erreur réseau --</option>`;
    }
}

function fillEditForm(piece) {
    document.getElementById("ep-ref").value = piece.reference || "";
    document.getElementById("ep-name").value = piece.nom || "";
    document.getElementById("ep-category").value = piece.categorie || "";
    document.getElementById("ep-buy").value = piece.prix_achat || "";
    document.getElementById("ep-sell").value = piece.prix_vente || "";
}

function initStockUI() {
    const refreshBtn = document.getElementById("stock-refresh");
    const tbody = document.getElementById("stock-tbody");
    const errorBox = document.getElementById("stock-error");

    if (!tbody) return;

    // première charge
    loadStock(tbody, errorBox);

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadStock(tbody, errorBox);
        });
    }
}

async function loadStock(tbody, errorBox) {
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;">Chargement...</td>
        </tr>
    `;
    errorBox.textContent = "";

    const token = localStorage.getItem("access");

    try {
        const resp = await fetch(API_STOCK, {
            method: "GET",
            headers: {
                // l'API stock n'impose pas IsAuthenticated dans les settings,
                // mais on envoie le token quand même pour être cohérent
                "Authorization": token ? "Bearer " + token : undefined
            }
        });

        const data = await resp.json().catch(() => null);
        console.log("Réponse stock:", data);

        if (!resp.ok) {
            const detail = data && data.detail ? ` (${data.detail})` : "";
            errorBox.textContent =
                "Erreur lors du chargement du stock. Code: " +
                resp.status + detail;
            tbody.innerHTML = "";
            return;
        }

        // DRF pagination: {count, next, previous, results}
        let items = data;
        if (data && data.results) {
            items = data.results;
        }

        if (!Array.isArray(items) || items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        Aucun stock trouvé.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = "";

        items.forEach(stockItem => {
            const pieceId = stockItem.piece_id;
            const location = stockItem.location || "";
            const quantity = stockItem.quantity ?? 0;
            const minQuantity = stockItem.min_quantity ?? 0;
            const belowMin = stockItem.is_below_minimum;
            const lastUpdated = stockItem.last_updated;

            const statut = belowMin
                ? "Sous le minimum"
                : "OK";

            // petit formatage simple de la date
            let lastUpdatedStr = "";
            if (lastUpdated) {
                try {
                    lastUpdatedStr = new Date(lastUpdated).toLocaleString();
                } catch {
                    lastUpdatedStr = lastUpdated;
                }
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${pieceId}</td>
                <td>${location || "-"}</td>
                <td>${quantity}</td>
                <td>${minQuantity}</td>
                <td>${statut}</td>
                <td>${lastUpdatedStr}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        errorBox.textContent =
            "Erreur réseau : impossible de contacter le serveur de stock.";
        tbody.innerHTML = "";
    }
}

function initMoveInUI() {
    const select = document.getElementById("movein-piece-select");
    const reloadBtn = document.getElementById("movein-reload");
    const form = document.getElementById("movein-form");
    const successBox = document.getElementById("movein-success");
    const errorBox = document.getElementById("movein-error");

    if (!select || !form) return;

    successBox.textContent = "";
    errorBox.textContent = "";

    // charger la liste des pièces dans le select
    loadPiecesForMoveIn(select, errorBox);

    reloadBtn.addEventListener("click", () => {
        successBox.textContent = "";
        errorBox.textContent = "";
        loadPiecesForMoveIn(select, errorBox);
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        successBox.textContent = "";
        errorBox.textContent = "";

        const pieceIdStr = select.value;
        const qtyStr = document.getElementById("movein-qty").value;
        const location = document.getElementById("movein-location").value.trim();
        const description = document.getElementById("movein-description").value.trim();

        if (!pieceIdStr) {
            errorBox.textContent = "Veuillez choisir une pièce.";
            return;
        }

        if (!qtyStr || Number(qtyStr) <= 0) {
            errorBox.textContent = "La quantité doit être un nombre positif.";
            return;
        }

        const piece_id = parseInt(pieceIdStr, 10);
        const quantity = Number(qtyStr);

        const payload = {
            piece_id,
            quantity,
            movement_type: "IN",
            location: location || null,
            description: description || null
        };

        const token = localStorage.getItem("access");
        if (!token) {
            errorBox.textContent = "Token manquant : veuillez vous reconnecter.";
            return;
        }

        try {
            const resp = await fetch(API_STOCK_MOVEMENT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            const data = await resp.json().catch(() => null);
            console.log("Réponse mouvement IN:", data);

            if (!resp.ok) {
                let msg = "Erreur lors de l'enregistrement du mouvement.";

                if (data) {
                    const parts = [];
                    if (data.detail) parts.push(data.detail);
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
                    if (parts.length > 0) msg = parts.join(" — ");
                }

                errorBox.textContent = `${msg} (code ${resp.status})`;
                return;
            }

            successBox.textContent = "Mouvement d'entrée enregistré avec succès.";
            form.reset();
            select.value = pieceIdStr; // on laisse la même pièce sélectionnée

        } catch (err) {
            console.error(err);
            errorBox.textContent =
                "Erreur réseau : impossible de contacter le service de stock.";
        }
    });
}

async function loadPiecesForMoveIn(select, errorBox) {
    select.innerHTML = `<option value="">Chargement...</option>`;

    const token = localStorage.getItem("access");

    try {
        const resp = await fetch(API_PIECES, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await resp.json();
        if (!resp.ok) {
            const detail = data && data.detail ? ` (${data.detail})` : "";
            if (errorBox) {
                errorBox.textContent =
                    "Erreur lors du chargement des pièces. Code: " +
                    resp.status + detail;
            }
            select.innerHTML = `<option value="">-- Erreur de chargement --</option>`;
            return;
        }

        let pieces = data;
        if (data.results) {
            pieces = data.results;
        }

        if (!Array.isArray(pieces) || pieces.length === 0) {
            select.innerHTML = `<option value="">-- Aucune pièce --</option>`;
            return;
        }

        select.innerHTML = `<option value="">-- Choisir une pièce --</option>`;
        pieces.forEach(piece => {
            const opt = document.createElement("option");
            opt.value = piece.id;
            opt.textContent = `${piece.reference} — ${piece.nom}`;
            select.appendChild(opt);
        });

    } catch (err) {
        console.error(err);
        if (errorBox) {
            errorBox.textContent =
                "Erreur réseau : impossible de charger les pièces.";
        }
        select.innerHTML = `<option value="">-- Erreur réseau --</option>`;
    }
}


async function loadStockHistory(tbody, errorBox) {
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;">Chargement...</td>
        </tr>
    `;
    errorBox.textContent = "";

    const token = localStorage.getItem("access");

    try {
        const resp = await fetch(API_STOCK_HISTORY, {
            method: "GET",
            headers: {
                "Authorization": token ? "Bearer " + token : undefined
            }
        });

        const data = await resp.json().catch(() => null);
        console.log("Historique stock:", data);

        if (!resp.ok) {
            const detail = data && data.detail ? ` (${data.detail})` : "";
            errorBox.textContent =
                "Erreur lors du chargement de l'historique. Code: " +
                resp.status + detail;
            tbody.innerHTML = "";
            return;
        }

        // DRF pagination : {count, next, previous, results: [...]}
        let movements = data;
        if (data && data.results) {
            movements = data.results;
        }

        if (!Array.isArray(movements) || movements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        Aucun mouvement enregistré.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = "";

        movements.forEach(mvt => {
            const mtype = (mvt.movement_type || "").toUpperCase();
            const pieceId = mvt.piece_id;
            const qty = mvt.quantity ?? 0;
            const location = mvt.location || "";
            const description = mvt.description || "";

            const rawDate =
                mvt.timestamp ||
                mvt.created_at ||
                mvt.movement_date ||
                mvt.date ||
                null;

            let dateStr = "";
            if (rawDate) {
                try {
                    dateStr = new Date(rawDate).toLocaleString();
                } catch {
                    dateStr = rawDate;
                }
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${mtype}</td>
                <td>${pieceId}</td>
                <td>${qty}</td>
                <td>${location || "-"}</td>
                <td>${description}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        errorBox.textContent =
            "Erreur réseau : impossible de contacter le service de stock.";
        tbody.innerHTML = "";
    }
}


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

    
    loadContent('dashboard');
});
