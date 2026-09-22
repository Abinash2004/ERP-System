import { backendRequest } from "../../api/index.js";
import { panelHeader, setStatus } from "../ui.js";

const LIMIT = 20;
const BRANCHES = ["ASKA", "MOHANA", "SURADA", "PURUSOTTAMPUR"];

const AdvanceReport = (() => {
    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    async function mount(container, session) {
        let page = 1;
        let hasMore = true;
        let isLoading = false;

        const isShowroom = session.role === "showroom" || (!["admin", "account"].includes(session.role) && session.branch);
        let currentBranch = isShowroom ? session.branch : "ALL";
        let fromDate = "";
        let toDate = "";
        let scrollCleanup = null;

        function renderRow(row) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatDate(row.advanceDate)}</td>
                <td>${row.advancerName ?? ""}</td>
                <td class="u-nowrap">
                    <div class="u-flex-center" style="gap: 8px;">
                        ${row.mobileNumber ?? ""}
                        ${row.mobileNumber ? `
                            <a href="tel:${row.mobileNumber}"
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
                <td>${row.amount ?? ""}</td>
                <td>${row.model ?? ""}</td>
                <td>${row.color ?? ""}</td>
                ${!isShowroom ? `<td>${row.branch ?? ""}</td>` : ""}
            `;
            return tr;
        }

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-sales-report-view">
                    ${panelHeader("Advance Report", `
                        <button id="adv-filter-btn" class="ui-button ui-button--ghost" type="button" style="padding: 8px 12px; min-height: 36px; display: inline-flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            <span>Filters</span>
                        </button>
                    `)}
                    <div id="adv-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="adv-table">
                            <thead>
                                <tr>
                                    <th>Advance Date</th>
                                    <th>Advancer Name</th>
                                    <th>Mobile Number</th>
                                    <th>Amount</th>
                                    <th>Model</th>
                                    <th>Color</th>
                                    ${!isShowroom ? `<th>Branch</th>` : ""}
                                </tr>
                            </thead>
                            <tbody id="adv-tbody"></tbody>
                        </table>
                    </div>
                </section>
                <div id="adv-filter-drawer" class="ui-drawer" aria-hidden="true">
                    <div class="ui-drawer__overlay"></div>
                    <div class="ui-drawer__content">
                        <div class="ui-drawer__header">
                            <h3 class="ui-drawer__title">Filters</h3>
                            <button id="adv-filter-close" class="ui-drawer__close" type="button" aria-label="Close filters">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="ui-drawer__body">
                            ${!isShowroom ? `
                            <div class="ui-field" style="margin-bottom: var(--space-4);">
                                <label class="ui-label" style="margin-bottom: var(--space-1); display: block;">Branch</label>
                                <select id="adv-branch-filter" class="ui-select">
                                    <option value="ALL">All Branches</option>
                                    ${BRANCHES.map(branch => `<option value="${branch}">${branch}</option>`).join("")}
                                </select>
                            </div>
                            ` : ""}
                            <div class="ui-field">
                                <label class="ui-label" style="margin-bottom: var(--space-1); display: block;">Advance Date Range</label>
                                <div class="u-flex" style="gap: 8px;">
                                    <input id="adv-date-from" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                    <input id="adv-date-to" class="ui-input" type="date" style="flex: 1; min-width: 0;" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const tbody = container.querySelector("#adv-tbody");
            const tableScroll = container.querySelector(".ui-table-scroll");
            const branchFilter = container.querySelector("#adv-branch-filter");
            const dateFromInput = container.querySelector("#adv-date-from");
            const dateToInput = container.querySelector("#adv-date-to");
            const statusEl = container.querySelector("#adv-status");
            const filterBtn = container.querySelector("#adv-filter-btn");
            const filterDrawer = container.querySelector("#adv-filter-drawer");
            const filterClose = container.querySelector("#adv-filter-close");
            const filterOverlay = container.querySelector(".ui-drawer__overlay");

            const openDrawer = () => filterDrawer?.setAttribute("aria-hidden", "false");
            const closeDrawer = () => {
                const wasOpen = filterDrawer?.getAttribute("aria-hidden") === "false";
                filterDrawer?.setAttribute("aria-hidden", "true");
                if (wasOpen) {
                    const nextBranch = branchFilter ? branchFilter.value : currentBranch;
                    const nextFrom = dateFromInput.value;
                    const nextTo = dateToInput.value;
                    if (nextBranch !== currentBranch || nextFrom !== fromDate || nextTo !== toDate) {
                        currentBranch = nextBranch;
                        fromDate = nextFrom;
                        toDate = nextTo;
                        resetAndLoad();
                    }
                }
            };

            filterBtn?.addEventListener("click", openDrawer);
            filterClose?.addEventListener("click", closeDrawer);
            filterOverlay?.addEventListener("click", closeDrawer);

            const onKeyDown = (event) => {
                if (event.key === "Escape") {
                    closeDrawer();
                }
            };

            container.addEventListener("keydown", onKeyDown);

            async function loadPage({ reset = false } = {}) {
                if (isLoading) return;
                if (!reset && !hasMore) return;

                isLoading = true;
                setStatus(statusEl, reset ? "Loading advance records..." : "Loading more records...", "info", true);

                try {
                    const res = await backendRequest("getAdvanceReportList", {
                        branch: currentBranch,
                        fromDate,
                        toDate,
                        page,
                        limit: LIMIT
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
                        const totalCols = isShowroom ? 6 : 7;
                        tbody.innerHTML = `<tr><td colspan="${totalCols}">No advance records found.</td></tr>`;
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
                    }

                    setStatus(statusEl);
                } catch (err) {
                    console.error("[getAdvanceReportList]", err);
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

            if (branchFilter) {
                branchFilter.value = currentBranch;
            }
            dateFromInput.value = fromDate;
            dateToInput.value = toDate;

            let lastScrollTop = 0;
            const onScroll = () => {
                if (!tableScroll || isLoading || !hasMore) return;
                const scrollTop = tableScroll.scrollTop;
                if (scrollTop === lastScrollTop) return;
                lastScrollTop = scrollTop;

                const remaining = tableScroll.scrollHeight - scrollTop - tableScroll.clientHeight;
                if (remaining <= 160) {
                    page += 1;
                    loadPage();
                }
            };

            tableScroll.addEventListener("scroll", onScroll, { passive: true });
            scrollCleanup = () => {
                tableScroll.removeEventListener("scroll", onScroll);
                container.removeEventListener("keydown", onKeyDown);
                filterBtn?.removeEventListener("click", openDrawer);
                filterClose?.removeEventListener("click", closeDrawer);
                filterOverlay?.removeEventListener("click", closeDrawer);
            };

            loadPage({ reset: true });
        }

        showList();
    }

    return { mount };
})();

export { AdvanceReport };
