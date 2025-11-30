// app.js
// Map of actions -> HTML placeholder content 
const PLACEHOLDERS = {
    'dashboard': `
        <div class="placeholder">
            <h3>Tableau de bord</h3>
            <p>Vue d'ensemble et raccourcis. (Placeholders — vous ajouterez les widgets plus tard.)</p>
            <div class="small-note">Utilisez le menu à gauche pour naviguer.</div>
        </div>
    `,
    'add-piece': `
        <div class="placeholder">
            <h3>Ajouter une pièce</h3>
            <p>Formulaire à venir — interface en développement.</p>
            <div class="small-note">Tâche: créer le formulaire d'ajout de pièce (Jira).</div>
        </div>
    `,
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

    const content = PLACEHOLDERS[action] || `<div class="placeholder"><h3>Page</h3><p>Contenu en développement.</p></div>`;
    place.innerHTML = content;

    // update header title
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
}

// attach listeners to menu items (delegation)
document.addEventListener('DOMContentLoaded', function () {
    const menu = document.querySelector('.menu-list');
    if (!menu) return;

    // click handler: find nearest .menu-item
    menu.addEventListener('click', function (e) {
        const li = e.target.closest('.menu-item');
        if (!li || !menu.contains(li)) return;

        // if it's logout, let auth.js handle it (or app will delegate)
        const action = li.dataset.action;
        if (!action) return;

        // load content into main
        loadContent(action);
    });

    // load default dashboard view
    loadContent('dashboard');
});
