import { clearSession } from "../services/session.js";
import { AddStockForm } from "../components/accounts/AddStockForm.js";
import { AddInvoiceForm } from "../components/accounts/AddInvoiceForm.js";
import { StockMovementForm } from "../components/accounts/StockMovementForm.js";
import { AdvanceReceiveForm } from "../components/accounts/AdvanceReceiveForm.js";
import { AdvanceReturnForm } from "../components/accounts/AdvanceReturnForm.js";
import { AddSaleForm } from "../components/accounts/AddSaleForm.js";
import { AddSaleAccountForm } from "../components/accounts/AddSaleAccountForm.js";
import { AddRegistrationForm } from "../components/accounts/AddRegistrationForm.js";
import { OptionalFieldForm } from "../components/accounts/OptionalFieldForm.js";
import { VerifyTransactionForm } from "../components/accounts/VerifyTransactionForm.js";
import { initResponsiveSidebar, renderSidebarLayout, renderWelcomeState } from "../components/ui.js";
import { getSheetUrlForSession, getDriveUrlForSession } from "../config/index.js";

const FORMS = [
    { label: "Add Stock Form", component: AddStockForm },
    { label: "Add Invoice Form", component: AddInvoiceForm },
    { label: "Stock Movement Form", component: StockMovementForm },
    { label: "Advance Receive Form", component: AdvanceReceiveForm },
    { label: "Advance Return Form", component: AdvanceReturnForm },
    { label: "Add Sale Form", component: AddSaleForm },
    { label: "Add Sale Account Form", component: AddSaleAccountForm },
    { label: "Add Registration Form", component: AddRegistrationForm },
    { label: "Optional Field Form", component: OptionalFieldForm },
    { label: "Verify Transaction Form", component: VerifyTransactionForm }
];

export function renderAccounts(session) {
    const sheetUrl = getSheetUrlForSession(session);
    const driveUrl = getDriveUrlForSession(session);

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
    let activeIndex = null;

    FORMS.forEach(({ label, component }, index) => {
        const li = document.createElement("li");
        li.textContent = label;
        li.dataset.index = index;
        li.className = "app-nav__item";

        li.addEventListener("click", () => {
            if (activeIndex === index) return;
            activeIndex = index;

            formList.querySelectorAll("li").forEach(el => el.removeAttribute("data-active"));
            li.dataset.active = "true";

            contentArea.innerHTML = "";
            component.mount(contentArea, session);
        });

        formList.appendChild(li);
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
