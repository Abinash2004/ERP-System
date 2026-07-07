import { getSession } from "../services/session.js";
import { renderLogin } from "../pages/login.js";
import { renderShowroom } from "../pages/showroom.js";
import { renderAccounts } from "../pages/accounts.js";
import { renderAdmin } from "../pages/admin.js";

const routes = {
    "/login": renderLogin,
    "/showroom": renderShowroom,
    "/accounts": renderAccounts,
    "/admin": renderAdmin
};

async function navigate() {
    const session = await getSession();

    const targetPath = !session
        ? "/login"
        : (session.role === "accounts" ? "/accounts" : session.role === "admin" ? "/admin" : "/showroom");
    
    if (window.location.pathname !== targetPath) {
        history.replaceState(null, "", targetPath);
    }

    const render = routes[targetPath];
    if (render) render(session);
}

export function router() {
    window.addEventListener("popstate", async () => {
        await navigate();
    });

    window.navigateTo = () => navigate();
    navigate();
}
