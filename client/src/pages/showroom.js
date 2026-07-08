import { clearSession } from "../services/session.js";
import { NewWalkInForm } from "../components/showroom/NewWalkInForm.js";
import { FollowUpList } from "../components/showroom/FollowUpList.js";
import { initResponsiveSidebar, renderSidebarLayout, renderWelcomeState } from "../components/ui.js";
import { getDriveUrlForSession } from "../config/index.js";

const FORMS = [
    { label: "New Walk In", component: NewWalkInForm },
    { label: "Customer Follow Up", component: FollowUpList }
];

export function renderShowroom(session) {
    const driveUrl = getDriveUrlForSession(session);

    document.getElementById("app").innerHTML = renderSidebarLayout({
        pageId: "showroom-page",
        sidebarTitle: "Showroom Tasks",
        listId: "form-list",
        contentId: "showroom-content",
        emptyContent: renderWelcomeState(`<span class="ui-welcome-state__accent">${session.branch}</span> Team`),
        showViewSheetButton: false,
        showViewDriveButton: Boolean(driveUrl)
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

    document.getElementById("view-drive")?.addEventListener("click", () => {
        window.open(driveUrl, "_blank", "noopener,noreferrer");
    });

    document.getElementById("logout").addEventListener("click", () => {
        clearSession();
        window.navigateTo();
    });
}
