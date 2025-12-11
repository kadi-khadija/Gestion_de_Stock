/* CONFIG */
const API_ME = "http://127.0.0.1:8090/api/auth/me/";  // URL complète, via Traefik
const LOGIN_PAGE = "login.html";


/** Decode JWT */
function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

/** Token valid? */
function tokenIsValid(token) {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return false;
    return decoded.exp > Math.floor(Date.now() / 1000);
}

/** Logout */
function logoutAndRedirect() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = LOGIN_PAGE;
}

/* ROLE HANDLING*/

function showElementsByRole(role) {
    // hide all
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
    document.querySelectorAll(".magasinier-only").forEach(el => el.style.display = "none");

    if (!role) return;

    const r = role.trim().toLowerCase();

    if (r === "admin") {
        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "");
        document.querySelectorAll(".magasinier-only").forEach(el => el.style.display = "");
    } else if (r === "magasinier") {
        document.querySelectorAll(".magasinier-only").forEach(el => el.style.display = "");
    }
}

/* MAIN PROTECTION */

async function applyBasicProtection() {
    const token = localStorage.getItem("access");

    if (!token || !tokenIsValid(token)) {
        console.log("Token absent ou expiré");
        logoutAndRedirect();
        return;
    }

    try {
        const resp = await fetch(API_ME, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!resp.ok) {
            console.log("Erreur API ME");
            logoutAndRedirect();
            return;
        }

        const user = await resp.json();

        const role = (user.role ?? "").toLowerCase().trim();

        document.getElementById("user-info").textContent =
            `${user.username} — ${role}`;

        showElementsByRole(role);

    } catch (e) {
        console.log("Erreur réseau:", e);
        logoutAndRedirect();
    }
}

/* EXPOSE */
window.applyBasicProtection = applyBasicProtection;
window.logoutAndRedirect = logoutAndRedirect;
