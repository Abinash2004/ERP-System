import { backendRequest } from "../api/index.js";
import { setSession } from "../services/session.js";
import { renderLoginLayout, setStatus } from "../components/ui.js";

export function renderLogin() {
    document.getElementById("app").innerHTML = renderLoginLayout();

    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const passcode = document.getElementById("passcode").value.trim();
        const errorEl = document.getElementById("login-error");

        setStatus(errorEl);

        if (!passcode) {
            setStatus(errorEl, "Passcode is required.", "error");
            return;
        }

        try {
            setStatus(errorEl, "Verifying passcode...", "info", true);
            const res = await backendRequest("verifyPassword", passcode);
            if (res.status !== 1) {
                setStatus(errorEl, res.message, "error");
                return;
            }

            const { role, branch } = res.data;
            if (!role) {
                setStatus(errorEl, "Invalid user data received.", "error");
                return;
            }

            await setSession(role, branch);
            navigateTo(role === "accounts" ? "/accounts" : "/showroom");
        } catch {
            setStatus(errorEl, "Server unreachable. Try again.", "error");
        }
    });
}
