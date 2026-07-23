import { backendRequest } from "../../api/index.js";
import { panelHeader, setStatus } from "../ui.js";

const LIMIT = 20;
const BRANCHES = ["ASKA", "MOHANA", "SURADA"];
const FINANCE_COL = 5; // Column E in COLLECTION sheet is column index 5

const PendingDisbursementReport = (() => {
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
        
        // Showroom branch check
        const isShowroom = session.role === "showroom" || (!["admin", "account"].includes(session.role) && session.branch);
        let currentBranch = isShowroom ? session.branch : "ALL";
        let currentFinancer = "ALL";
        let financersList = [];
        let scrollCleanup = null;

        function renderRow(row) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatDate(row.saleDate)}</td>
                ${!isShowroom ? `<td>${row.branch ?? ""}</td>` : ""}
                <td>${row.customerName ?? ""}</td>
                <td>${row.cashFinance ?? ""}</td>
                <td>${row.financerName ?? ""}</td>
                <td>${row.chassisNumber ?? ""}</td>
                <td>${row.model ?? ""}</td>
            `;
            return tr;
        }

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-sales-report-view">
                    ${panelHeader("Pending Disbursement Report", `
                        <button id="pdr-filter-btn" class="ui-button ui-button--ghost" type="button" style="padding: 8px 12px; min-height: 36px; display: inline-flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            <span>Filters</span>
                        </button>
                    `)}
                    <div id="pdr-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="pdr-table">
                            <thead>
                                <tr>
                                    <th>Sale Date</th>
                                    ${!isShowroom ? `<th>Branch</th>` : ""}
                                    <th>Customer Name</th>
                                    <th>Cash / Finance</th>
                                    <th>Financer Name</th>
                                    <th>Chassis Number</th>
                                    <th>Model</th>
                                </tr>
                            </thead>
                            <tbody id="pdr-tbody"></tbody>
                        </table>
                    </div>
                </section>
                <div id="pdr-filter-drawer" class="ui-drawer" aria-hidden="true">
                    <div class="ui-drawer__overlay"></div>
                    <div class="ui-drawer__content">
                        <div class="ui-drawer__header">
                            <h3 class="ui-drawer__title">Filters</h3>
                            <button id="pdr-filter-close" class="ui-drawer__close" type="button" aria-label="Close filters">
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
                                <select id="pdr-branch-filter" class="ui-select">
                                    <option value="ALL">All Branches</option>
                                    ${BRANCHES.map(branch => `<option value="${branch}">${branch}</option>`).join("")}
                                </select>
                            </div>
                            ` : ""}
                            <div class="ui-field">
                                <label class="ui-label" style="margin-bottom: var(--space-1); display: block;">Financer</label>
                                <select id="pdr-financer-filter" class="ui-select">
                                    <option value="ALL">All Financers</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const tbody = container.querySelector("#pdr-tbody");
            const tableScroll = container.querySelector(".ui-table-scroll");
            const branchFilter = container.querySelector("#pdr-branch-filter");
            const financerFilter = container.querySelector("#pdr-financer-filter");
            const statusEl = container.querySelector("#pdr-status");
            const filterBtn = container.querySelector("#pdr-filter-btn");
            const filterDrawer = container.querySelector("#pdr-filter-drawer");
            const filterClose = container.querySelector("#pdr-filter-close");
            const filterOverlay = container.querySelector(".ui-drawer__overlay");

            const openDrawer = () => filterDrawer?.setAttribute("aria-hidden", "false");
            const closeDrawer = () => {
                const wasOpen = filterDrawer?.getAttribute("aria-hidden") === "false";
                filterDrawer?.setAttribute("aria-hidden", "true");
                if (wasOpen) {
                    const nextBranch = branchFilter ? branchFilter.value : currentBranch;
                    const nextFinancer = financerFilter.value;
                    if (nextBranch !== currentBranch || nextFinancer !== currentFinancer) {
                        currentBranch = nextBranch;
                        currentFinancer = nextFinancer;
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
                setStatus(statusEl, reset ? "Loading records..." : "Loading more records...", "info", true);

                try {
                    const res = await backendRequest("getPendingDisbursementList", {
                        branch: currentBranch,
                        financer: currentFinancer,
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

                    const totalCols = isShowroom ? 6 : 7;
                    if (page === 1 && rows.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="${totalCols}">No pending disbursement records found.</td></tr>`;
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
                    }

                    setStatus(statusEl);
                } catch (err) {
                    console.error("[getPendingDisbursementList]", err);
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
            financerFilter.value = currentFinancer;

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

            async function loadFinancers() {
                try {
                    const res = await backendRequest("getDropdown", FINANCE_COL);
                    if (res.status === 1 && res.data) {
                        financerFilter.innerHTML = '<option value="ALL">All Financers</option>';
                        res.data.forEach(item => {
                            const trimmed = String(item).trim();
                            // Ignore "CASH" option from frontend select list
                            if (trimmed.toUpperCase() !== "CASH" && trimmed !== "") {
                                const opt = document.createElement("option");
                                opt.value = trimmed;
                                opt.textContent = trimmed;
                                financerFilter.appendChild(opt);
                            }
                        });
                        financerFilter.value = currentFinancer;
                    }
                } catch (err) {
                    console.error("[loadFinancers]", err);
                }
            }

            loadFinancers();
            loadPage({ reset: true });
        }

        showList();
    }

    return { mount };
})();

export { PendingDisbursementReport };
