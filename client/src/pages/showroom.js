import { clearSession } from "../services/session.js";
import { DailyTransactionForm } from "../components/showroom/DailyTransactionForm.js";
import { NewWalkInForm } from "../components/showroom/NewWalkInForm.js";
import { FollowUpList } from "../components/showroom/FollowUpList.js";
import { initResponsiveSidebar, renderSidebarLayout, renderWelcomeState } from "../components/ui.js";
import { getSheetUrlForSession } from "../config/index.js";

const FORMS = [
    { label: "Daily Transaction", component: DailyTransactionForm },
    { label: "New Walk In", component: NewWalkInForm },
    { label: "Customer Follow Up", component: FollowUpList }
];

export function renderShowroom(session) {
    const sheetUrl = getSheetUrlForSession(session);

    document.getElementById("app").innerHTML = renderSidebarLayout({
        pageId: "showroom-page",
        sidebarTitle: "Showroom Tasks",
        listId: "form-list",
        contentId: "showroom-content",
        emptyContent: renderWelcomeState(`<span class="ui-welcome-state__accent">${session.branch}</span> Team`),
        showViewSheetButton: Boolean(sheetUrl)
    });

    const formList = document.getElementById("form-list");
    const contentArea = document.getElementById("showroom-content");
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

    initResponsiveSidebar("showroom-page");

    document.getElementById("view-sheet")?.addEventListener("click", () => {
        window.open(sheetUrl, "_blank", "noopener,noreferrer");
    });

    document.getElementById("logout").addEventListener("click", () => {
        clearSession();
        window.navigateTo();
    });
}
