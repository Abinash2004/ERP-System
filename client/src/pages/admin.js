import { clearSession } from "../services/session.js";
import { FollowUpList } from "../components/showroom/FollowUpList.js";
import { StockReport } from "../components/accounts/StockReport.js";
import { SalesReport } from "../components/accounts/SalesReport.js";
import { initResponsiveSidebar, renderSidebarLayout, renderWelcomeState } from "../components/ui.js";
import { getSheetUrlForSession } from "../config/index.js";

const FORMS = [
    { label: "Follow Up List", component: FollowUpList },
    { label: "Stock Report", component: StockReport },
    { label: "Sales Report", component: SalesReport }
];

export function renderAdmin(session) {
    const sheetUrl = getSheetUrlForSession(session);

    document.getElementById("app").innerHTML = renderSidebarLayout({
        pageId: "admin-page",
        sidebarTitle: "Admin Tasks",
        listId: "admin-form-list",
        contentId: "admin-content",
        emptyContent: renderWelcomeState(`<span class="ui-welcome-state__accent">ADMIN</span> Panel`),
        showViewSheetButton: Boolean(sheetUrl)
    });

    const formList = document.getElementById("admin-form-list");
    const contentArea = document.getElementById("admin-content");

    FORMS.forEach(({ label, component }, index) => {
        const li = document.createElement("li");
        li.textContent = label;
        li.dataset.index = index;
        li.className = "app-nav__item";

        li.addEventListener("click", () => {
            formList.querySelectorAll("li").forEach(el => el.removeAttribute("data-active"));
            li.dataset.active = "true";
            contentArea.innerHTML = "";
            component.mount(contentArea, session);
        });

        formList.appendChild(li);
    });

    initResponsiveSidebar("admin-page");

    document.getElementById("view-sheet")?.addEventListener("click", () => {
        window.open(sheetUrl, "_blank", "noopener,noreferrer");
    });

    document.getElementById("logout").addEventListener("click", () => {
        clearSession();
        window.navigateTo("/login");
    });
}
