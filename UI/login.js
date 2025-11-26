document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("error");

    try {
        const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password})
        });

        if (!response.ok) {
            errorBox.textContent = "Nom d'utilisateur ou mot de passe incorrect.";
            return;
        }

        const data = await response.json();

        // Stocker les tokens
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        // Redirection après connexion
        window.location.href = "dashboard.html";

    } catch (error) {
        errorBox.textContent = "Erreur de connexion au serveur.";
    }
});
