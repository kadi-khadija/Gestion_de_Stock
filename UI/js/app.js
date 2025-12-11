
const API_BASE = "http://127.0.0.1:8090";   // Traefik
// tous les appels rest assent par Traefik sur le port 8090.
const API_PIECES = `${API_BASE}/api/pieces/`;
const API_STOCK = `${API_BASE}/api/stock/`;
const API_STOCK_MOVEMENT = `${API_BASE}/api/stock/movement/`;
const API_STOCK_HISTORY = `${API_BASE}/api/stock/movements/`;
const API_NOTIFICATIONS = `${API_BASE}/api/notifications/`;
const API_NOTIFICATIONS_MARK_READ = `${API_BASE}/api/notifications/mark-read/`;

let currentEditedPieceId = null;
let editPiecesCache = [];
let templatesLoaded = false;


async function ensureTemplatesLoaded() {
    if (templatesLoaded) return;

    try {
        // dashboard.html est dans /template/, app.html aussi
        const resp = await fetch('app.html');
        if (!resp.ok) {
            console.error('Erreur chargement app.html', resp.status);
            return;
        }

        const html = await resp.text();

        const container = document.createElement('div');
        container.id = 'templates-container';
        container.style.display = 'none';
        container.innerHTML = html;

        document.body.appendChild(container);
        templatesLoaded = true;
    } catch (err) {
        console.error('Erreur fetch app.html', err);
    }
}

async function renderTemplate(action) {
    await ensureTemplatesLoaded();

    const templateMap = {
        'dashboard': 'view-dashboard',
        'add-piece': 'view-add-piece',
        'list-pieces': 'view-list-pieces',
        'search-piece': 'view-search-piece',
        'edit-piece': 'view-edit-piece',
        'stock': 'view-stock',
        'move-in': 'view-move-in',
        'move-out': 'view-move-out',
        'history': 'view-history',
        'notifications': 'view-notifications',
    };

    const tplId = templateMap[action] || 'view-dashboard';
    const tpl = document.getElementById(tplId);

    if (!tpl) {
        return `
            <div class="placeholder">
                <h3>Page</h3>
                <p>Contenu en développement.</p>
            </div>
        `;
    }

    return tpl.innerHTML.trim();
}

async function loadContent(action) {
    const place = document.getElementById('content-area');
    const title = document.getElementById('page-title');
    if (!place || !title) return;

    const content = await renderTemplate(action);
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
    if (action === 'add-piece') {initAddPieceUI();}
    if (action === 'list-pieces') {
        loadPiecesList();
        const btn = document.getElementById("refresh-pieces");
        btn.addEventListener("click", () => loadPiecesList());
    }
    if (action === 'search-piece') {initSearchPieceUI();}
    if (action === 'edit-piece') {initEditPieceUI();}
    if (action === 'stock') {initStockUI();} 
    if (action === 'move-in') { initMoveInUI();}
    if (action === 'move-out') { initMoveOutUI(); }
    if (action === 'history') { initHistoryUI();}
    if (action === 'notifications') {initNotificationsUI();}
    if (action === 'dashboard') {initDashboardUI();}
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
        // On récupère EN MÊME TEMPS :
        //  - la liste des pièces (pour avoir id -> nom)
        //  - le stock
        const [respPieces, respStock] = await Promise.all([
            fetch(API_PIECES, {
                method: "GET",
                headers: {
                    "Authorization": token ? "Bearer " + token : undefined
                }
            }),
            fetch(API_STOCK, {
                method: "GET",
                headers: {
                    "Authorization": token ? "Bearer " + token : undefined
                }
            })
        ]);

        const piecesData = await respPieces.json().catch(() => null);
        const stockData = await respStock.json().catch(() => null);

        // Gestion d’erreur côté stock (prioritaire)
        if (!respStock.ok) {
            const detail = stockData && stockData.detail ? ` (${stockData.detail})` : "";
            errorBox.textContent =
                "Erreur lors du chargement du stock. Code: " +
                respStock.status + detail;
            tbody.innerHTML = "";
            return;
        }

        // Liste des mouvements de stock (avec ou sans pagination DRF)
        let items = stockData;
        if (stockData && stockData.results) {
            items = stockData.results;
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

        // Construire un dictionnaire id -> nom de pièce
        const nameById = {};
        if (respPieces.ok) {
            let pieces = piecesData;
            if (piecesData && piecesData.results) {
                pieces = piecesData.results;
            }
            if (Array.isArray(pieces)) {
                pieces.forEach(p => {
                    // p.id vient de l’API des pièces (Django REST)
                    nameById[p.id] = p.nom;
                });
            }
        }

        tbody.innerHTML = "";

        items.forEach(stockItem => {
            const pieceId = stockItem.piece_id;
            const location = stockItem.location || "";
            const quantity = stockItem.quantity ?? 0;
            const minQuantity = stockItem.min_quantity ?? 0;
            const belowMin = stockItem.is_below_minimum;
            const lastUpdated = stockItem.last_updated;

            const statut = belowMin ? "Sous le minimum" : "OK";

            let lastUpdatedStr = "";
            if (lastUpdated) {
                try {
                    lastUpdatedStr = new Date(lastUpdated).toLocaleString();
                } catch {
                    lastUpdatedStr = lastUpdated;
                }
            }

            // Utiliser le nom si connu, sinon afficher l’ID pour debug
            const pieceName = nameById[pieceId] || `ID ${pieceId}`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${pieceName}</td>
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
            "Erreur réseau : impossible de contacter le service de stock.";
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
        const minQtyStr = document.getElementById("movein-minqty").value;

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

        if (minQtyStr !== "") {
            payload.min_quantity = Number(minQtyStr);
        }
        
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

function initMoveOutUI() {
    const select = document.getElementById("moveout-piece-select");
    const reloadBtn = document.getElementById("moveout-reload");
    const form = document.getElementById("moveout-form");
    const successBox = document.getElementById("moveout-success");
    const errorBox = document.getElementById("moveout-error");

    if (!select || !form) return;

    successBox.textContent = "";
    errorBox.textContent = "";

    // On réutilise la même fonction que pour l'IN pour charger les pièces
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
        const qtyStr = document.getElementById("moveout-qty").value;
        const location = document.getElementById("moveout-location").value.trim();
        const description = document.getElementById("moveout-description").value.trim();

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
            movement_type: "OUT",
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
            console.log("Réponse mouvement OUT:", data);

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

            successBox.textContent = "Mouvement de sortie enregistré avec succès.";
            form.reset();
            select.value = pieceIdStr; // on garde la même pièce sélectionnée

        } catch (err) {
            console.error(err);
            errorBox.textContent =
                "Erreur réseau : impossible de contacter le service de stock.";
        }
    });
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
        // On récupère EN MÊME TEMPS :
        //  - la liste des pièces (id -> nom)
        //  - l'historique des mouvements
        const [respPieces, respHistory] = await Promise.all([
            fetch(API_PIECES, {
                method: "GET",
                headers: {
                    "Authorization": token ? "Bearer " + token : undefined
                }
            }),
            fetch(API_STOCK_HISTORY, {
                method: "GET",
                headers: {
                    "Authorization": token ? "Bearer " + token : undefined
                }
            })
        ]);

        const piecesData = await respPieces.json().catch(() => null);
        const histData = await respHistory.json().catch(() => null);
        console.log("Historique stock:", histData);

        // Gestion d’erreur côté historique (prioritaire)
        if (!respHistory.ok) {
            const detail = histData && histData.detail ? ` (${histData.detail})` : "";
            errorBox.textContent =
                "Erreur lors du chargement de l'historique. Code: " +
                respHistory.status + detail;
            tbody.innerHTML = "";
            return;
        }

        // Pagination DRF éventuelle
        let movements = histData;
        if (histData && histData.results) {
            movements = histData.results;
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

        // Dictionnaire id -> nom de pièce
        const nameById = {};
        if (respPieces.ok) {
            let pieces = piecesData;
            if (piecesData && piecesData.results) {
                pieces = piecesData.results;
            }
            if (Array.isArray(pieces)) {
                pieces.forEach(p => {
                    nameById[p.id] = p.nom;   // p.id = clé primaire de la pièce
                });
            }
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

            // Utiliser le nom si on le connaît, sinon afficher l’ID
            const pieceName = nameById[pieceId] || `ID ${pieceId}`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${mtype}</td>
                <td>${pieceName}</td>
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

function initHistoryUI() {
    const tbody = document.getElementById("history-tbody");
    const errorBox = document.getElementById("history-error");
    const refreshBtn = document.getElementById("history-refresh");

    if (!tbody) return;

    loadStockHistory(tbody, errorBox);

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadStockHistory(tbody, errorBox);
        });
    }
}

function formatIsoDate(iso) {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function initNotificationsUI() {
    const tbody = document.getElementById("notif-tbody");
    const errorBox = document.getElementById("notif-error");
    const refreshBtn = document.getElementById("notif-refresh");
    const markReadBtn = document.getElementById("notif-markread");

    if (!tbody) return;

    // première charge
    loadNotifications(tbody, errorBox);

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadNotifications(tbody, errorBox);
        });
    }

    if (markReadBtn) {
        markReadBtn.addEventListener("click", async () => {
            await markSelectedNotificationsAsRead(tbody, errorBox);
            await loadNotifications(tbody, errorBox);
        });
    }
}

async function loadNotifications(tbody, errorBox) {
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;">Chargement...</td>
        </tr>
    `;
    errorBox.textContent = "";

    const token = localStorage.getItem("access");

    try {
        // 1) Notifications + 2) Liste des pièces EN MÊME TEMPS
        const [respNotif, respPieces] = await Promise.all([
            fetch(`${API_NOTIFICATIONS}?status=UNREAD`, {
                method: "GET",
                headers: {
                    "Authorization": token ? "Bearer " + token : undefined,
                    "Content-Type": "application/json"
                }
            }),
            fetch(API_PIECES, {
                method: "GET",
                headers: {
                    "Authorization": token ? "Bearer " + token : undefined
                }
            })
        ]);

        const notifData = await respNotif.json().catch(() => null);
        const piecesData = await respPieces.json().catch(() => null);

        // --- Vérif notifications ---
        if (!respNotif.ok) {
            const detail = notifData && notifData.detail ? ` (${notifData.detail})` : "";
            errorBox.textContent =
                "Erreur lors du chargement des notifications. Code: "
                + respNotif.status + detail;
            tbody.innerHTML = "";
            return;
        }

        let items = notifData;
        if (notifData && notifData.results) {
            items = notifData.results;
        }

        if (!Array.isArray(items) || items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        Aucune notification à afficher.
                    </td>
                </tr>
            `;
            return;
        }

        // --- Construire le dictionnaire id → "REF — Nom" ---
        const labelById = {};
        if (respPieces.ok) {
            let pieces = piecesData;
            if (piecesData && piecesData.results) {
                pieces = piecesData.results;
            }
            if (Array.isArray(pieces)) {
                pieces.forEach(p => {
                    // tu peux changer le format comme tu veux
                    labelById[p.id] = `${p.reference} — ${p.nom}`;
                });
            }
        }

        tbody.innerHTML = "";

        items.forEach((notif) => {
            let pieceLabel = "-";

            if (notif.piece_id !== null && notif.piece_id !== undefined) {
                // on essaie d'abord la "vraie" référence
                if (labelById[notif.piece_id]) {
                    pieceLabel = labelById[notif.piece_id];
                } else {
                    // fallback au cas où la pièce n'est pas trouvée
                    pieceLabel = `ID ${notif.piece_id}`;
                }
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <input type="checkbox"
                           class="notif-checkbox"
                           value="${notif.id}">
                </td>
                <td>${formatIsoDate(notif.created_at)}</td>
                <td>${notif.level}</td>
                <td>${pieceLabel}</td>
                <td>${notif.location || "-"}</td>
                <td>${notif.quantity ?? "-"} / ${notif.min_quantity ?? "-"}</td>
                <td>${notif.message || ""}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        errorBox.textContent =
            "Erreur réseau : impossible de contacter le service de notifications.";
        tbody.innerHTML = "";
    }
}

async function markSelectedNotificationsAsRead(tbody, errorBox) {
    const checkboxes = tbody.querySelectorAll(".notif-checkbox:checked");
    if (!checkboxes.length) {
        errorBox.textContent = "Sélectionnez au moins une notification.";
        return;
    }

    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));
    const token = localStorage.getItem("access");

    if (!token) {
        errorBox.textContent = "Token manquant : veuillez vous reconnecter.";
        return;
    }

    try {
        const resp = await fetch(API_NOTIFICATIONS_MARK_READ, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ ids })
        });

        const data = await resp.json().catch(() => null);

        if (!resp.ok) {
            let msg = "Erreur lors de la mise à jour des notifications.";
            if (data && data.detail) {
                msg += " " + data.detail;
            }
            errorBox.textContent = `${msg} (code ${resp.status})`;
            return;
        }

        errorBox.textContent = ""; // OK

    } catch (err) {
        console.error(err);
        errorBox.textContent =
            "Erreur réseau : impossible de contacter le service de notifications.";
    }
}

function initDashboardUI() {
    const errorBox = document.getElementById("dash-error");
    const refreshBtn = document.getElementById("dash-refresh");
    const mvtTbody = document.getElementById("dash-movements-tbody");

    if (!errorBox || !mvtTbody) return;

    loadDashboardData(errorBox, mvtTbody);

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadDashboardData(errorBox, mvtTbody);
        });
    }
}

async function loadDashboardData(errorBox, mvtTbody) {
    errorBox.textContent = "";
    mvtTbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;">Chargement...</td>
        </tr>
    `;

    const token = localStorage.getItem("access");

    try {
        // On charge tout en parallèle : pièces, stock, notifications, mouvements
        const [respPieces, respStock, respNotif, respMov] = await Promise.all([
            fetch(API_PIECES, {
                headers: { "Authorization": token ? "Bearer " + token : undefined }
            }),
            fetch(API_STOCK, {
                headers: { "Authorization": token ? "Bearer " + token : undefined }
            }),
            fetch(`${API_NOTIFICATIONS}?status=UNREAD`, {
                headers: { "Authorization": token ? "Bearer " + token : undefined }
            }),
            fetch(API_STOCK_HISTORY, {
                headers: { "Authorization": token ? "Bearer " + token : undefined }
            })
        ]);

        const piecesData = await respPieces.json().catch(() => null);
        const stockData  = await respStock.json().catch(() => null);
        const notifData  = await respNotif.json().catch(() => null);
        const movData    = await respMov.json().catch(() => null);

        // ---- Comptes simples (avec ou sans pagination DRF) ----
        const totalPieces = piecesData && typeof piecesData.count === "number"
            ? piecesData.count
            : (Array.isArray(piecesData) ? piecesData.length : 0);

        const stockItems = stockData && typeof stockData.count === "number"
            ? stockData.count
            : (Array.isArray(stockData) ? stockData.length : 0);

        let stockList = stockData;
        if (stockData && Array.isArray(stockData.results)) {
            stockList = stockData.results;
        }
        if (!Array.isArray(stockList)) stockList = [];

        const lowCount = stockList.filter(s => s.is_below_minimum).length;
        const zeroCount = stockList.filter(s => (s.quantity ?? 0) === 0).length;

        const unreadNotif = notifData && typeof notifData.count === "number"
            ? notifData.count
            : (Array.isArray(notifData) ? notifData.length : 0);

        // ---- Maj des cartes ----
        document.getElementById("dash-total-pieces").textContent = totalPieces;
        document.getElementById("dash-total-stock").textContent = stockItems;
        document.getElementById("dash-low-stock").textContent = lowCount;
        document.getElementById("dash-zero-stock").textContent = zeroCount;
        document.getElementById("dash-unread-notif").textContent = unreadNotif;

        // ---- Dictionnaire id -> "Ref — Nom" pour afficher les mouvements ----
        let piecesList = piecesData;
        if (piecesData && Array.isArray(piecesData.results)) {
            piecesList = piecesData.results;
        }
        if (!Array.isArray(piecesList)) piecesList = [];

        const labelById = {};
        piecesList.forEach(p => {
            labelById[p.id] = `${p.reference} — ${p.nom}`;
        });

        // ---- Derniers mouvements ----
        let movements = movData;
        if (movData && Array.isArray(movData.results)) {
            movements = movData.results;
        }
        if (!Array.isArray(movements)) movements = [];

        // On ne garde que les 5 plus récents (si l'API ne trie pas déjà)
        movements = movements.slice(0, 5);

        if (movements.length === 0) {
            mvtTbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        Aucun mouvement enregistré.
                    </td>
                </tr>
            `;
        } else {
            mvtTbody.innerHTML = "";
            movements.forEach(mvt => {
                const pieceId = mvt.piece_id;
                const pieceLabel = labelById[pieceId] || (pieceId ? `ID ${pieceId}` : "-");

                const rawDate =
                    mvt.timestamp ||
                    mvt.created_at ||
                    mvt.movement_date ||
                    mvt.date ||
                    null;

                const dateStr = rawDate ? formatIsoDate(rawDate) : "";

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${(mvt.movement_type || "").toUpperCase()}</td>
                    <td>${pieceLabel}</td>
                    <td>${mvt.quantity ?? "-"}</td>
                    <td>${mvt.location || "-"}</td>
                `;
                mvtTbody.appendChild(tr);
            });
        }

    } catch (err) {
        console.error(err);
        errorBox.textContent =
            "Erreur réseau : impossible de charger les données du tableau de bord.";
        mvtTbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">Erreur de chargement.</td>
            </tr>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const menu = document.querySelector('.menu-list');
    if (!menu) return;

    menu.addEventListener('click', async function (e) {
        const li = e.target.closest('.menu-item');
        if (!li || !menu.contains(li)) return;

        const action = li.dataset.action;
        if (!action) return;

        await loadContent(action);
    });

    
    loadContent('dashboard');
});
