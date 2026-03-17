function escapeAttribute(value = "") {
    return String(value).replace(/"/g, "&quot;");
}

export function renderSidebarLayout({ pageId, sidebarTitle, listId, contentId, emptyText }) {
    return `
        <div id="${pageId}" class="app-shell">
            <aside class="app-sidebar">
                <div class="app-sidebar__header">
                    <h1 class="app-sidebar__title">${sidebarTitle}</h1>
                </div>
                <ul id="${listId}" class="app-nav"></ul>
                <div class="app-sidebar__footer">
                    <button id="logout" class="ui-button ui-button--ghost" type="button">Logout</button>
                </div>
            </aside>
            <main id="${contentId}" class="app-content">
                <div class="ui-empty-state">${emptyText}</div>
            </main>
        </div>
    `;
}

export function renderLoginLayout() {
    return `
        <div class="login-shell">
            <form id="login-form" class="ui-form ui-form--compact" novalidate>
                <div class="ui-card ui-card--auth">
                    <div class="ui-card-header">
                        <p class="ui-eyebrow">Retail Management</p>
                        <h1 class="ui-card-title">Login</h1>
                        <p class="ui-card-copy">Enter the passcode to continue.</p>
                    </div>
                    <div class="ui-form-grid ui-form-grid--single">
                        ${field("Passcode", '<input id="passcode" class="ui-input" type="password" placeholder="Enter passcode" autocomplete="off" />', { required: true, full: true })}
                        ${formActions("login-submit", "login-error", "Login")}
                    </div>
                </div>
            </form>
        </div>
    `;
}

export function createFormLayout({ id, title, body, description = "", className = "" }) {
    const formClass = ["ui-form", className].filter(Boolean).join(" ");

    return `
        <form id="${id}" class="${formClass}" novalidate>
            <div class="ui-card">
                <div class="ui-card-header">
                    <h2 class="ui-card-title">${title}</h2>
                    ${description ? `<p class="ui-card-copy">${description}</p>` : ""}
                </div>
                <div class="ui-form-grid">
                    ${body}
                </div>
            </div>
        </form>
    `;
}

export function field(label, control, { required = false, full = false, className = "", hint = "" } = {}) {
    return `
        <div class="ui-field${full ? " ui-field--full" : ""}${className ? ` ${className}` : ""}">
            <label class="ui-label">
                <span>${label}</span>
                ${required ? '<span class="ui-required">*</span>' : ""}
            </label>
            ${control}
            ${hint ? `<div class="ui-hint">${hint}</div>` : ""}
        </div>
    `;
}

export function formSection(title) {
    return `<div class="ui-section-heading ui-field--full">${title}</div>`;
}

export function formActions(submitId, statusId, submitLabel = "Submit", disabled = false) {
    return `
        <div class="ui-actions ui-field--full">
            <button id="${submitId}" class="ui-button" type="submit"${disabled ? " disabled" : ""}>${submitLabel}</button>
            <span id="${statusId}" class="ui-status" role="status" aria-live="polite"></span>
        </div>
    `;
}

export function panelHeader(title, actions = "") {
    return `
        <div class="ui-panel-header">
            <h2 class="ui-panel-title">${title}</h2>
            ${actions}
        </div>
    `;
}

export function setStatus(element, text = "", type = "", loading = false) {
    if (!element) return;

    element.className = "ui-status";
    element.replaceChildren();

    if (!text) return;

    if (type) {
        element.classList.add(`is-${type}`);
    }

    if (loading) {
        element.classList.add("is-loading");
        const loader = document.createElement("span");
        loader.className = "ui-loader ui-loader--inline";
        loader.setAttribute("aria-hidden", "true");
        element.appendChild(loader);
    }

    const label = document.createElement("span");
    label.textContent = text;
    element.appendChild(label);
}

export function createOption(value, label = value, selected = false) {
    return `<option value="${escapeAttribute(value)}"${selected ? " selected" : ""}>${label}</option>`;
}
