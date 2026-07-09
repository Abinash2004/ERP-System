import { backendRequest } from "../../api/index.js";
import { UpdateFollowUpForm } from "./UpdateFollowUpForm.js";
import { panelHeader, setStatus } from "../ui.js";

const LIMIT = 20;
const BRANCHES = ["ASKA", "MOHANA", "SURADA"];

function normalizeFollowUpStatus(value) {
    const status = String(value || "").trim().toUpperCase();
    if (status === "OPEN" || status === "OPENED") return "OPENED";
    if (status === "CLOSE" || status === "CLOSED") return "CLOSED";
    if (status === "PURCHASED") return "PURCHASED";
    if (status === "BOOKED") return "BOOKED";
    return "OPENED";
}

const FollowUpList = (() => {
    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function renderOverflowCell(value) {
        const text = String(value ?? "").trim();
        if (!text) {
            return `<span class="ui-overflow-cell ui-overflow-cell--empty">-</span>`;
        }

        const escaped = escapeHtml(text);
        return `
            <span class="ui-overflow-cell" data-ui-overflow-text="${escaped}">
                <span class="ui-overflow-cell__text">${escaped}</span>
                <button class="ui-overflow-cell__more" type="button" aria-expanded="false" hidden>
                    [more]
                </button>
            </span>
        `;
    }

    async function mount(container, session) {
        let page = 1;
        let hasMore = true;
        let isLoading = false;
        let currentStatus = "ALL";
        let currentBranch = session.role === "admin" ? "ALL" : session.branch;
        let scrollCleanup = null;
        const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
        const isInteractive = session.role !== "accounts";
        let visitDateFrom = "";
        let visitDateTo = "";
        let firstFeedbackDateFrom = "";
        let firstFeedbackDateTo = "";
        let lastFeedbackDateFrom = "";
        let lastFeedbackDateTo = "";

        function renderRow(row) {
            const tr = document.createElement("tr");
            const serialNumber = row.serial_number ?? row.serialNumber ?? "";
            const visitDate = formatDate(row.visit_date || row.visitDate || row.created_at);
            const firstFeedbackDate = formatDate(row.first_feedback_date);
            const lastFeedbackDate = formatDate(row.last_feedback_date);
            const followUpStatus = normalizeFollowUpStatus(row.status);
            const statusVariant = followUpStatus === "PURCHASED"
                ? "success"
                : followUpStatus === "CLOSED"
                    ? "danger"
                    : followUpStatus === "BOOKED"
                        ? "info"
                        : "warning";

            tr.innerHTML = `
                <td>${serialNumber}</td>
                <td>${visitDate}</td>
                <td>${row.location || ""}</td>
                <td>${row.customer_name || ""}</td>
                <td class="u-nowrap">
                    <div class="u-flex-center" style="gap: 8px;">
                        ${row.mobile_number || ""}
                        ${row.mobile_number ? `
                            <a href="tel:${row.mobile_number}"
                               class="ui-phone-btn"
                               title="Call Customer"
                               onclick="event.stopPropagation()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 18.5 18.5 0 0 1-5.08-5.08 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                            </a>
                        ` : ""}
                    </div>
                </td>
                <td>${row.address || ""}</td>
                <td>${row.vehicle_details || ""}</td>
                <td><span class="ui-follow-status ui-follow-status--${statusVariant}">${followUpStatus}</span></td>
                <td>${firstFeedbackDate}</td>
                <td class="ui-overflow-col">${renderOverflowCell(row.first_feedback)}</td>
                <td>${lastFeedbackDate}</td>
                <td class="ui-overflow-col">${renderOverflowCell(row.last_feedback)}</td>
                ${isInteractive ? `
                    <td>
                        <button class="ui-edit-btn" title="Edit Follow Up" type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                    </td>
                ` : ""}
            `;
            if (isInteractive) {
                const editBtn = tr.querySelector(".ui-edit-btn");
                editBtn?.addEventListener("click", (event) => {
                    event.stopPropagation();
                    showForm(row);
                });
            }
            return tr;
        }

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-follow-up-view">
                    ${panelHeader("Follow Up Customer List", `
                        <button id="fup-filter-btn" class="ui-button ui-button--ghost" type="button" style="padding: 8px 12px; min-height: 36px; display: inline-flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            <span>Filters</span>
                        </button>
                    `)}
                    <div id="fup-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="follow-up-table">
                            <thead>
                                <tr>
                                    <th>Serial No.</th>
                                    <th>Visit Date</th>
                                    <th>Location</th>
                                    <th>Customer Name</th>
                                    <th>Mobile Number</th>
                                    <th>Address</th>
                                    <th>Vehicle Details</th>
                                    <th>Follow Up Status</th>
                                    <th>First Feedback Date</th>
                                    <th>First Feedback</th>
                                    <th>Last Feedback Date</th>
                                    <th>Last Feedback</th>
                                    ${isInteractive ? '<th>Actions</th>' : ""}
                                </tr>
                            </thead>
                            <tbody id="follow-up-tbody"></tbody>
                        </table>
                    </div>
                    <div class="ui-overflow-layer" aria-hidden="true">
                        <div class="ui-overflow-popover" role="dialog" aria-hidden="true"></div>
                    </div>
                </section>
                <div id="fup-filter-drawer" class="ui-drawer" aria-hidden="true">
                    <div class="ui-drawer__overlay"></div>
                    <div class="ui-drawer__content">
                        <div class="ui-drawer__header">
                            <h3 class="ui-drawer__title">Filters</h3>
                            <button id="fup-filter-close" class="ui-drawer__close" type="button" aria-label="Close filters">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="ui-drawer__body">
                            <div class="ui-field">
                                <label class="ui-label">Status</label>
                                <select id="fup-status-filter" class="ui-select">
                                    <option value="ALL">All</option>
                                    <option value="OPENED">Opened</option>
                                    <option value="CLOSED">Closed</option>
                                    <option value="PURCHASED">Purchased</option>
                                    <option value="BOOKED">Booked</option>
                                </select>
                            </div>
                            ${session.role === "admin" ? `
                                <div class="ui-field" style="margin-top: 16px;">
                                    <label class="ui-label">Branch</label>
                                    <select id="fup-branch-filter" class="ui-select">
                                        <option value="ALL">All</option>
                                        ${BRANCHES.map(branch => `<option value="${branch}">${branch}</option>`).join("")}
                                    </select>
                                </div>
                            ` : ""}
                            <div class="ui-field" style="margin-top: 16px;">
                                <label class="ui-label">Visit Date Range</label>
                                <div class="u-flex" style="gap: 8px;">
                                    <input id="fup-visit-from" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                    <input id="fup-visit-to" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                </div>
                            </div>
                            <div class="ui-field" style="margin-top: 16px;">
                                <label class="ui-label">First Feedback Date Range</label>
                                <div class="u-flex" style="gap: 8px;">
                                    <input id="fup-first-feedback-from" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                    <input id="fup-first-feedback-to" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                </div>
                            </div>
                            <div class="ui-field" style="margin-top: 16px;">
                                <label class="ui-label">Last Feedback Date Range</label>
                                <div class="u-flex" style="gap: 8px;">
                                    <input id="fup-last-feedback-from" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                    <input id="fup-last-feedback-to" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const tbody = container.querySelector("#follow-up-tbody");
            const tableScroll = container.querySelector(".ui-table-scroll");
            const overflowLayer = container.querySelector(".ui-overflow-layer");
            const overflowPopover = container.querySelector(".ui-overflow-popover");
            const statusFilter = container.querySelector("#fup-status-filter");
            const branchFilter = container.querySelector("#fup-branch-filter");
            const visitFromFilter = container.querySelector("#fup-visit-from");
            const visitToFilter = container.querySelector("#fup-visit-to");
            const firstFromFilter = container.querySelector("#fup-first-feedback-from");
            const firstToFilter = container.querySelector("#fup-first-feedback-to");
            const lastFromFilter = container.querySelector("#fup-last-feedback-from");
            const lastToFilter = container.querySelector("#fup-last-feedback-to");
            const statusEl = container.querySelector("#fup-status");

            function syncOverflowButtons() {
                const cells = container.querySelectorAll(".ui-overflow-cell");
                cells.forEach((cell) => {
                    const textEl = cell.querySelector(".ui-overflow-cell__text");
                    const button = cell.querySelector(".ui-overflow-cell__more");
                    if (!textEl || !button) return;

                    const isOverflowing = textEl.scrollWidth > textEl.clientWidth + 1;
                    button.hidden = !isOverflowing;
                    cell.classList.toggle("is-truncated", isOverflowing);
                });
            }

            function closeAllPopovers() {
                container.querySelectorAll(".ui-overflow-cell.is-open").forEach((cell) => {
                    cell.classList.remove("is-open");
                    const button = cell.querySelector(".ui-overflow-cell__more");
                    button?.setAttribute("aria-expanded", "false");
                });
                overflowLayer?.setAttribute("aria-hidden", "true");
                overflowPopover?.setAttribute("aria-hidden", "true");
                overflowPopover?.replaceChildren();
            }

            function openPopover(cell, triggerButton) {
                if (!overflowPopover || !overflowLayer) return;

                const textEl = cell.querySelector(".ui-overflow-cell__text");
                const text = textEl?.textContent || "";
                closeAllPopovers();
                cell.classList.add("is-open");
                triggerButton.setAttribute("aria-expanded", "true");
                overflowLayer.setAttribute("aria-hidden", "false");
                overflowPopover.setAttribute("aria-hidden", "false");
                overflowPopover.textContent = text;

                const rect = triggerButton.getBoundingClientRect();
                const popoverWidth = Math.min(420, window.innerWidth - 24);
                const centeredLeft = rect.left + (rect.width / 2);
                const left = Math.max(12 + popoverWidth / 2, Math.min(window.innerWidth - 12 - popoverWidth / 2, centeredLeft));
                const top = Math.min(window.innerHeight - 16, rect.top - 12);
                const bottom = top < 56 ? Math.min(window.innerHeight - 16, rect.bottom + 8) : null;

                overflowPopover.style.left = `${left}px`;
                overflowPopover.style.transform = "translateX(-50%)";
                if (bottom !== null) {
                    overflowPopover.style.top = `${bottom}px`;
                    overflowPopover.style.bottom = "auto";
                } else {
                    overflowPopover.style.top = `${top}px`;
                    overflowPopover.style.bottom = "auto";
                }
            }

            const onCellClick = (event) => {
                const button = event.target.closest(".ui-overflow-cell__more");
                if (button) {
                    const cell = button.closest(".ui-overflow-cell");
                    if (!cell) return;

                    event.preventDefault();
                    event.stopPropagation();
                    openPopover(cell, button);
                    return;
                }

                if (!event.target.closest(".ui-overflow-popover")) {
                    closeAllPopovers();
                }
            };

            const onCellHover = (event) => {
                if (!hoverQuery.matches) return;
                const cell = event.target.closest(".ui-overflow-cell");
                if (!cell) return;
                const button = cell.querySelector(".ui-overflow-cell__more");
                if (!button || button.hidden) return;

                openPopover(cell, button);
            };

            const onCellLeave = (event) => {
                if (!hoverQuery.matches) return;
                const cell = event.target.closest(".ui-overflow-cell");
                if (!cell) return;
                const related = event.relatedTarget;
                if (related && cell.contains(related)) return;
                closeAllPopovers();
            };

            const filterBtn = container.querySelector("#fup-filter-btn");
            const filterDrawer = container.querySelector("#fup-filter-drawer");
            const filterClose = container.querySelector("#fup-filter-close");
            const filterOverlay = container.querySelector(".ui-drawer__overlay");

            const openDrawer = () => filterDrawer?.setAttribute("aria-hidden", "false");
            const closeDrawer = () => {
                const wasOpen = filterDrawer?.getAttribute("aria-hidden") === "false";
                filterDrawer?.setAttribute("aria-hidden", "true");
                if (wasOpen) {
                    const nextStatus = statusFilter.value;
                    const nextBranch = branchFilter ? branchFilter.value : currentBranch;
                    const nextVisitFrom = visitFromFilter.value;
                    const nextVisitTo = visitToFilter.value;
                    const nextFirstFrom = firstFromFilter.value;
                    const nextFirstTo = firstToFilter.value;
                    const nextLastFrom = lastFromFilter.value;
                    const nextLastTo = lastToFilter.value;

                    if (
                        nextStatus !== currentStatus ||
                        nextBranch !== currentBranch ||
                        nextVisitFrom !== visitDateFrom ||
                        nextVisitTo !== visitDateTo ||
                        nextFirstFrom !== firstFeedbackDateFrom ||
                        nextFirstTo !== firstFeedbackDateTo ||
                        nextLastFrom !== lastFeedbackDateFrom ||
                        nextLastTo !== lastFeedbackDateTo
                    ) {
                        currentStatus = nextStatus;
                        currentBranch = nextBranch;
                        visitDateFrom = nextVisitFrom;
                        visitDateTo = nextVisitTo;
                        firstFeedbackDateFrom = nextFirstFrom;
                        firstFeedbackDateTo = nextFirstTo;
                        lastFeedbackDateFrom = nextLastFrom;
                        lastFeedbackDateTo = nextLastTo;
                        resetAndLoad();
                    }
                }
            };

            filterBtn?.addEventListener("click", openDrawer);
            filterClose?.addEventListener("click", closeDrawer);
            filterOverlay?.addEventListener("click", closeDrawer);

            const onKeyDown = (event) => {
                if (event.key === "Escape") {
                    closeAllPopovers();
                    closeDrawer();
                }
            };

            container.addEventListener("click", onCellClick);
            container.addEventListener("mouseover", onCellHover);
            container.addEventListener("mouseout", onCellLeave);
            container.addEventListener("keydown", onKeyDown);
            window.addEventListener("resize", closeAllPopovers);

            async function loadPage({ reset = false } = {}) {
                if (isLoading) return;
                if (!reset && !hasMore) return;

                isLoading = true;
                setStatus(statusEl, reset ? "Loading follow up records..." : "Loading more records...", "info", true);

                try {
                    const res = await backendRequest("getFollowUpList", {
                        branch: currentBranch,
                        page,
                        limit: LIMIT,
                        status: currentStatus,
                        visitDateFrom,
                        visitDateTo,
                        firstFeedbackDateFrom,
                        firstFeedbackDateTo,
                        lastFeedbackDateFrom,
                        lastFeedbackDateTo
                    });

                    if (res.status !== 1) {
                        setStatus(statusEl, res.message || "Unable to load records.", "error");
                        return;
                    }

                    const rows = res.data || [];
                    hasMore = rows.length === LIMIT;

                    if (reset) {
                        tbody.innerHTML = "";
                    }

                    if (page === 1 && rows.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="${isInteractive ? 13 : 12}">No records found.</td></tr>`;
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
                        requestAnimationFrame(syncOverflowButtons);
                    }

                    setStatus(statusEl);
                } catch (err) {
                    console.error("[getFollowUpList]", err);
                    setStatus(statusEl, "Unable to load records.", "error");
                } finally {
                    isLoading = false;
                }
            }

            function resetAndLoad() {
                page = 1;
                hasMore = true;
                tbody.innerHTML = "";
                loadPage({ reset: true });
            }

            statusFilter.value = currentStatus;
            if (branchFilter) {
                branchFilter.value = currentBranch;
            }
            visitFromFilter.value = visitDateFrom;
            visitToFilter.value = visitDateTo;
            firstFromFilter.value = firstFeedbackDateFrom;
            firstToFilter.value = firstFeedbackDateTo;
            lastFromFilter.value = lastFeedbackDateFrom;
            lastToFilter.value = lastFeedbackDateTo;

            const onScroll = () => {
                if (!tableScroll || isLoading || !hasMore) return;
                const remaining = tableScroll.scrollHeight - tableScroll.scrollTop - tableScroll.clientHeight;
                if (remaining <= 160) {
                    page += 1;
                    loadPage();
                }
            };

            tableScroll.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("scroll", closeAllPopovers, { passive: true, capture: true });
            scrollCleanup = () => {
                tableScroll.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", closeAllPopovers);
                window.removeEventListener("scroll", closeAllPopovers, { capture: true });
                container.removeEventListener("click", onCellClick);
                container.removeEventListener("mouseover", onCellHover);
                container.removeEventListener("mouseout", onCellLeave);
                container.removeEventListener("keydown", onKeyDown);
                filterBtn?.removeEventListener("click", openDrawer);
                filterClose?.removeEventListener("click", closeDrawer);
                filterOverlay?.removeEventListener("click", closeDrawer);
            };

            loadPage({ reset: true });
            requestAnimationFrame(() => requestAnimationFrame(syncOverflowButtons));
        }

        function showForm(rowData) {
            container.innerHTML = "";
            if (scrollCleanup) {
                scrollCleanup();
                scrollCleanup = null;
            }
            container.replaceChildren();
            UpdateFollowUpForm.mount(container, rowData, () => {
                showList();
            });
        }

        showList();
    }

    return { mount };
})();

export { FollowUpList };
