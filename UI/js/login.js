document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("error");
    const API_BASE = "http://127.0.0.1:8090";  // Traefik

    errorBox.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({username, password})
}); //envoies les creds à AuthService via Traefik.

        if (!response.ok) {
            errorBox.textContent = "Nom d'utilisateur ou mot de passe incorrect.";
            return;
        }// si AuthService ne valide pas l'utilisateur (mot de pass ou username)

        //cas de succes (user valide)
        const data = await response.json();

        // Stocker les tokens
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("role", data.user.role.toLowerCase());

        // Redirection après connexion
        window.location.href = "dashboard.html";
        //L'UI stocke les tokens JWT + le rôle dans localStorage, puis bascule sur le dashboard.
    } catch (error) {
        errorBox.textContent = "Erreur de connexion au serveur.";
    }
});


//donc, La page de login appelle /api/auth/login/ via Traefik, récupère les tokens JWT, les stocke dans le localStorage et redirige vers le dashboard.