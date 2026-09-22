import { getSession } from "../services/session.js";
import { ROLES, ROUTES } from "../constants.js";
import { renderLogin } from "../pages/login.js";
import { renderShowroom } from "../pages/showroom.js";
import { renderAccounts } from "../pages/accounts.js";
import { renderAdmin } from "../pages/admin.js";

const routes = {
    [ROUTES.LOGIN]: renderLogin,
    [ROUTES.SHOWROOM]: renderShowroom,
    [ROUTES.ACCOUNTS]: renderAccounts,
    [ROUTES.ADMIN]: renderAdmin
};

async function navigate() {
    const session = await getSession();

    const targetPath = !session
        ? ROUTES.LOGIN
        : (session.role === ROLES.ACCOUNTS ? ROUTES.ACCOUNTS : session.role === ROLES.ADMIN ? ROUTES.ADMIN : ROUTES.SHOWROOM);
    
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
