export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const WEBAPP_TOKEN = import.meta.env.VITE_WEBAPP_TOKEN;
export const ACCOUNT_SHEET_URL = import.meta.env.VITE_ACCOUNT_SHEET_URL;
export const ASKA_SHEET_URL = import.meta.env.VITE_ASKA_SHEET_URL;
export const MOHANA_SHEET_URL = import.meta.env.VITE_MOHANA_SHEET_URL;
export const SURADA_SHEET_URL = import.meta.env.VITE_SURADA_SHEET_URL;
export const SURADA_B_SHEET_URL = import.meta.env.VITE_SURADA_B_SHEET_URL;

const SHEET_URLS_BY_BRANCH = {
    ASKA: ASKA_SHEET_URL,
    MOHANA: MOHANA_SHEET_URL,
    SURADA: SURADA_SHEET_URL,
    "SURADA-B": SURADA_B_SHEET_URL
};

export function getSheetUrlForSession(session = {}) {
    if (session.role === "accounts") {
        return ACCOUNT_SHEET_URL;
    }

    return SHEET_URLS_BY_BRANCH[session.branch] || "";
}
