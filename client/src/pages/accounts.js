import { clearSession } from "../services/session.js";
import { AddStockForm } from "../components/accounts/AddStockForm.js";
import { AddInvoiceForm } from "../components/accounts/AddInvoiceForm.js";
import { StockMovementForm } from "../components/accounts/StockMovementForm.js";
import { AdvanceReceiveForm } from "../components/accounts/AdvanceReceiveForm.js";
import { AddSaleForm } from "../components/accounts/AddSaleForm.js";
import { AddSaleAccountForm } from "../components/accounts/AddSaleAccountForm.js";
import { AdvanceReturnForm } from "../components/accounts/AdvanceReturnForm.js";
import { RTOForm } from "../components/accounts/RTOForm.js";
import { OptionalFieldForm } from "../components/accounts/OptionalFieldForm.js";
import { VerifyTransactionForm } from "../components/accounts/VerifyTransactionForm.js";
import { StockReport } from "../components/accounts/StockReport.js";
import { SalesReport } from "../components/accounts/SalesReport.js";
import { initResponsiveSidebar, renderSidebarLayout, renderWelcomeState } from "../components/ui.js";
import { getSheetUrlForSession, getDriveUrlForSession } from "../config/index.js";

const GROUPS = [
    {
        label: "Forms",
        items: [
            { label: "Add Stock Form", component: AddStockForm },
            { label: "Add Invoice Form", component: AddInvoiceForm },
            { label: "Stock Movement Form", component: StockMovementForm },
            { label: "Advance Receive Form", component: AdvanceReceiveForm },
            { label: "Advance Return Form", component: AdvanceReturnForm },
            { label: "Add Sale Form", component: AddSaleForm },
            { label: "Add Sale Account Form", component: AddSaleAccountForm },
            { label: "RTO Form", component: RTOForm },
            { label: "Optional Field Form", component: OptionalFieldForm },
            { label: "Verify Transaction Form", component: VerifyTransactionForm }
        ]
    },
    {
        label: "Reports",
        items: [
            { label: "Stock Report", component: StockReport },
            { label: "Sales Report", component: SalesReport }
        ]
    }
];

const CSS_STYLES = `
#accounts-page {
    --sidebar-width: 290px;
}

#accounts-page .app-nav__group {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
}

#accounts-page .app-nav__group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--border);
    user-select: none;
    transition: all 0.2s ease;
}

#accounts-page .app-nav__group-header:hover {
    background: var(--hover);
}

#accounts-page .app-nav__group-header::after {
    content: "▼";
    font-size: 10px;
    transition: transform 0.2s ease;
    color: var(--text-soft);
}

#accounts-page .app-nav__group[data-expanded="false"] .app-nav__group-header::after {
    transform: rotate(-90deg);
}

#accounts-page .app-nav__group-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    list-style: none;
    padding-left: 12px;
    margin: 4px 0 0 0;
    max-height: 0;
    overflow-y: auto;
    transition: max-height 0.25s ease-out;
}

#accounts-page .app-nav__group[data-expanded="true"] .app-nav__group-items {
    max-height: 250px;
    padding-bottom: 6px;
}

/* Custom Scrollbar for group items */
#accounts-page .app-nav__group-items::-webkit-scrollbar {
    width: 6px;
}
#accounts-page .app-nav__group-items::-webkit-scrollbar-track {
    background: transparent;
}
#accounts-page .app-nav__group-items::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
}
#accounts-page .app-nav__group-items::-webkit-scrollbar-thumb:hover {
    background: var(--text-soft);
}
`;

export function renderAccounts(session) {
    const sheetUrl = getSheetUrlForSession(session);
    const driveUrl = getDriveUrlForSession(session);

    // Inject page-specific styles
    let styleTag = document.getElementById("accounts-custom-styles");
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "accounts-custom-styles";
        styleTag.innerHTML = CSS_STYLES;
        document.head.appendChild(styleTag);
    }

    document.getElementById("app").innerHTML = renderSidebarLayout({
        pageId: "accounts-page",
        sidebarTitle: "Account Tasks",
        listId: "accounts-form-list",
        contentId: "accounts-content",
        emptyContent: renderWelcomeState(`<span class="ui-welcome-state__accent">ACCOUNT</span> Team`),
        showViewSheetButton: Boolean(sheetUrl),
        showViewDriveButton: Boolean(driveUrl)
    });

    const formList = document.getElementById("accounts-form-list");
    const contentArea = document.getElementById("accounts-content");
    let activeItem = null;

    GROUPS.forEach((group) => {
        const groupContainer = document.createElement("div");
        groupContainer.className = "app-nav__group";
        groupContainer.dataset.expanded = "false";

        const header = document.createElement("div");
        header.className = "app-nav__group-header";
        header.textContent = group.label;

        const itemsContainer = document.createElement("ul");
        itemsContainer.className = "app-nav__group-items";

        group.items.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item.label;
            li.className = "app-nav__item";

            li.addEventListener("click", (e) => {
                e.stopPropagation();
                if (activeItem === li) return;

                if (activeItem) {
                    activeItem.removeAttribute("data-active");
                }
                li.dataset.active = "true";
                activeItem = li;

                contentArea.innerHTML = "";
                item.component.mount(contentArea, session);
            });

            itemsContainer.appendChild(li);
        });

        header.addEventListener("click", () => {
            const isExpanded = groupContainer.dataset.expanded === "true";
            groupContainer.dataset.expanded = isExpanded ? "false" : "true";
        });

        groupContainer.appendChild(header);
        groupContainer.appendChild(itemsContainer);
        formList.appendChild(groupContainer);
    });

    initResponsiveSidebar("accounts-page");

    document.getElementById("view-drive")?.addEventListener("click", () => {
        window.open(driveUrl, "_blank", "noopener,noreferrer");
    });

    document.getElementById("view-sheet")?.addEventListener("click", () => {
        window.open(sheetUrl, "_blank", "noopener,noreferrer");
    });

    document.getElementById("logout").addEventListener("click", () => {
        clearSession();
        window.navigateTo("/login");
    });
}
