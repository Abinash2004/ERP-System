function escapeAttribute(value = "") {
    return String(value).replace(/"/g, "&quot;");
}

export function renderWelcomeState(titleHtml = "") {
    return `
        <div class="ui-welcome-state">
            <p class="ui-welcome-state__eyebrow">Welcome</p>
            <h2 class="ui-welcome-state__title">${titleHtml}</h2>
            <p class="ui-welcome-state__copy">Select a task from the sidebar.</p>
        </div>
    `;
}

export function renderSidebarLayout({ pageId, sidebarTitle, listId, contentId, emptyContent }) {
    return `
        <div id="${pageId}" class="app-shell">
            <button id="${pageId}-toggle" class="app-sidebar-toggle" type="button" aria-label="Toggle sidebar" aria-controls="${pageId}-sidebar" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <button id="${pageId}-overlay" class="app-sidebar-overlay" type="button" aria-label="Close sidebar"></button>
            <aside id="${pageId}-sidebar" class="app-sidebar">
                <div class="app-sidebar__header">
                    <h1 class="app-sidebar__title">${sidebarTitle}</h1>
                </div>
                <ul id="${listId}" class="app-nav"></ul>
                <div class="app-sidebar__footer">
                    <button id="logout" class="ui-button ui-button--block" type="button">Logout</button>
                </div>
            </aside>
            <main id="${contentId}" class="app-content">
                ${emptyContent}
            </main>
        </div>
    `;
}

export function initResponsiveSidebar(pageId) {
    const shell = document.getElementById(pageId);
    if (!shell) return;

    const toggle = document.getElementById(`${pageId}-toggle`);
    const overlay = document.getElementById(`${pageId}-overlay`);
    const mobileQuery = window.matchMedia("(max-width: 900px)");

    const setOpen = (open) => {
        if (!mobileQuery.matches) {
            shell.classList.remove("sidebar-open");
            toggle?.setAttribute("aria-expanded", "false");
            return;
        }

        shell.classList.toggle("sidebar-open", open);
        toggle?.setAttribute("aria-expanded", open ? "true" : "false");
    };

    toggle?.addEventListener("click", () => {
        setOpen(!shell.classList.contains("sidebar-open"));
    });

    overlay?.addEventListener("click", () => {
        setOpen(false);
    });

    mobileQuery.addEventListener("change", (event) => {
        if (!event.matches) {
            setOpen(false);
        }
    });

    shell.querySelectorAll(".app-nav__item").forEach((item) => {
        item.addEventListener("click", () => {
            if (mobileQuery.matches) {
                setOpen(false);
            }
        });
    });
}

export function renderLoginLayout() {
    return `
        <div class="login-shell">
            <form id="login-form" class="ui-form ui-form--compact" novalidate>
                <div class="ui-card ui-card--auth ui-card--login">
                    <div class="ui-card-header ui-card-header--login">
                        <p class="ui-eyebrow">ENTERPRISE RESOURCE PLANNING SYSTEM</p>
                        <h1 class="ui-card-title ui-card-title--login">LOGIN</h1>
                        <p class="ui-card-copy ui-card-copy--login">Enter your passcode to continue.</p>
                    </div>
                    <div class="ui-form-grid ui-form-grid--single ui-form-grid--login">
                        ${field("Passcode", '<input id="passcode" class="ui-input" type="password" placeholder="Enter passcode" autocomplete="off" required />', { required: true, full: true })}
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

function isFieldVisible(field) {
    const target = field.classList.contains("ui-validation-proxy")
        ? field.closest(".sd-wrapper") || field
        : field;

    return !!target && target.getClientRects().length > 0 && getComputedStyle(target).visibility !== "hidden";
}

function isFieldValid(field) {
    if (!isFieldVisible(field) || field.disabled) {
        return true;
    }

    return field.value.trim() !== "";
}

function syncBusyState(element, loading) {
    const form = element?.closest("form");
    if (!form) return;

    const wasLoading = element.dataset.loading === "true";
    const currentCount = Number(form.dataset.busyCount || 0);

    if (loading && !wasLoading) {
        element.dataset.loading = "true";
        form.dataset.busyCount = String(currentCount + 1);
    } else if (!loading && wasLoading) {
        element.dataset.loading = "false";
        const nextCount = Math.max(currentCount - 1, 0);
        if (nextCount > 0) {
            form.dataset.busyCount = String(nextCount);
        } else {
            delete form.dataset.busyCount;
        }
    }

    form.__updateSubmitState?.();
}

export function setupFormValidation(form) {
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) return;

    const getRequiredFields = () => Array.from(form.querySelectorAll("[required], .required-field"));

    const updateSubmitState = () => {
        const isBusy = Number(form.dataset.busyCount || 0) > 0;
        const isValid = !isBusy && getRequiredFields().every(isFieldValid);
        submitButton.disabled = !isValid;
    };

    form.__updateSubmitState = updateSubmitState;
    form.addEventListener("input", updateSubmitState);
    form.addEventListener("change", updateSubmitState);
    updateSubmitState();

    return { updateSubmitState };
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

    syncBusyState(element, loading);
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
