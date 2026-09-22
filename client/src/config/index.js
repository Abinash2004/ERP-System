export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const WEBAPP_TOKEN = import.meta.env.VITE_WEBAPP_TOKEN;
export const ACCOUNT_SHEET_URL = import.meta.env.VITE_ACCOUNT_SHEET_URL;
export const ADMIN_SHEET_URL = import.meta.env.VITE_ADMIN_SHEET_URL;
export const ASKA_SHEET_URL = import.meta.env.VITE_ASKA_SHEET_URL;
export const MOHANA_SHEET_URL = import.meta.env.VITE_MOHANA_SHEET_URL;
export const SURADA_SHEET_URL = import.meta.env.VITE_SURADA_SHEET_URL;
export const PURUSOTTAMPUR_SHEET_URL = import.meta.env.VITE_PURUSOTTAMPUR_SHEET_URL;

export const ACCOUNT_DRIVE_URL = import.meta.env.VITE_ACCOUNT_DRIVE_URL;
export const ASKA_DRIVE_URL = import.meta.env.VITE_ASKA_DRIVE_URL;
export const MOHANA_DRIVE_URL = import.meta.env.VITE_MOHANA_DRIVE_URL;
export const SURADA_DRIVE_URL = import.meta.env.VITE_SURADA_DRIVE_URL;
export const PURUSOTTAMPUR_DRIVE_URL = import.meta.env.VITE_PURUSOTTAMPUR_DRIVE_URL;

const SHEET_URLS_BY_BRANCH = {
    ASKA: ASKA_SHEET_URL,
    MOHANA: MOHANA_SHEET_URL,
    SURADA: SURADA_SHEET_URL,
    PURUSOTTAMPUR: PURUSOTTAMPUR_SHEET_URL
};

const DRIVE_URLS_BY_BRANCH = {
    ASKA: ASKA_DRIVE_URL,
    MOHANA: MOHANA_DRIVE_URL,
    SURADA: SURADA_DRIVE_URL,
    PURUSOTTAMPUR: PURUSOTTAMPUR_DRIVE_URL
};

import { ROLES } from "../constants.js";

export function getSheetUrlForSession(session = {}) {
    if (session.role === ROLES.ACCOUNTS || session.role === ROLES.ADMIN) {
        return ACCOUNT_SHEET_URL;
    }

    return SHEET_URLS_BY_BRANCH[session.branch] || "";
}

export function getDriveUrlForSession(session = {}) {
    if (session.role === ROLES.ACCOUNTS) {
        return ACCOUNT_DRIVE_URL;
    }

    return DRIVE_URLS_BY_BRANCH[session.branch] || "";
}
