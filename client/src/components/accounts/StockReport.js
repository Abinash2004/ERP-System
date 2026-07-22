import { backendRequest } from "../../api/index.js";
import { panelHeader, setStatus } from "../ui.js";

const LIMIT = 20;
const BRANCHES = ["ASKA", "MOHANA", "SURADA"];

const StockReport = (() => {
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
        let currentBranch = "ALL";
        let currentModel = "ALL";
        let scrollCleanup = null;

        function renderRow(row) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.currentCounter ?? ""}</td>
                <td>${row.chassisNumber ?? ""}</td>
                <td>${row.model ?? ""}</td>
                <td>${row.color ?? ""}</td>
            `;
            return tr;
        }

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-stock-report-view">
                    ${panelHeader("Stock Report", `
                        <button id="stock-filter-btn" class="ui-button ui-button--ghost" type="button" style="padding: 8px 12px; min-height: 36px; display: inline-flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            <span>Filters</span>
                        </button>
                    `)}
                    <div id="stock-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="stock-table">
                            <thead>
                                <tr>
                                    <th>Branch</th>
                                    <th>Chassis Number</th>
                                    <th>Model</th>
                                    <th>Color</th>
                                </tr>
                            </thead>
                            <tbody id="stock-tbody"></tbody>
                        </table>
                    </div>
                </section>
                <div id="stock-filter-drawer" class="ui-drawer" aria-hidden="true">
                    <div class="ui-drawer__overlay"></div>
                    <div class="ui-drawer__content">
                        <div class="ui-drawer__header">
                            <h3 class="ui-drawer__title">Filters</h3>
                            <button id="stock-filter-close" class="ui-drawer__close" type="button" aria-label="Close filters">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="ui-drawer__body">
                            <div class="ui-field" style="margin-bottom: var(--space-4);">
                                <label class="ui-label" style="margin-bottom: var(--space-1); display: block;">Branch</label>
                                <select id="stock-branch-filter" class="ui-select">
                                    <option value="ALL">All Branches</option>
                                    ${BRANCHES.map(branch => `<option value="${branch}">${branch}</option>`).join("")}
                                </select>
                            </div>
                            <div class="ui-field">
                                <label class="ui-label" style="margin-bottom: var(--space-1); display: block;">Model</label>
                                <select id="stock-model-filter" class="ui-select">
                                    <option value="ALL">All Models</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const tbody = container.querySelector("#stock-tbody");
            const tableScroll = container.querySelector(".ui-table-scroll");
            const branchFilter = container.querySelector("#stock-branch-filter");
            const modelFilter = container.querySelector("#stock-model-filter");
            const statusEl = container.querySelector("#stock-status");
            const filterBtn = container.querySelector("#stock-filter-btn");
            const filterDrawer = container.querySelector("#stock-filter-drawer");
            const filterClose = container.querySelector("#stock-filter-close");
            const filterOverlay = container.querySelector(".ui-drawer__overlay");

            const openDrawer = () => filterDrawer?.setAttribute("aria-hidden", "false");
            const closeDrawer = () => {
                const wasOpen = filterDrawer?.getAttribute("aria-hidden") === "false";
                filterDrawer?.setAttribute("aria-hidden", "true");
                if (wasOpen) {
                    const nextBranch = branchFilter.value;
                    const nextModel = modelFilter.value;
                    if (nextBranch !== currentBranch || nextModel !== currentModel) {
                        currentBranch = nextBranch;
                        currentModel = nextModel;
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
                setStatus(statusEl, reset ? "Loading stock records..." : "Loading more records...", "info", true);

                try {
                    const res = await backendRequest("getStockList", {
                        branch: currentBranch,
                        model: currentModel,
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
                        tbody.innerHTML = `<tr><td colspan="4">No stock records found.</td></tr>`;
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
                    }

                    setStatus(statusEl);
                } catch (err) {
                    console.error("[getStockList]", err);
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

            branchFilter.value = currentBranch;
            modelFilter.value = currentModel;

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

            async function loadModels() {
                try {
                    const res = await backendRequest("getDropdown", 1);
                    if (res.status === 1 && res.data) {
                        modelFilter.innerHTML = '<option value="ALL">All Models</option>';
                        res.data.forEach(model => {
                            const opt = document.createElement("option");
                            opt.value = model;
                            opt.textContent = model;
                            modelFilter.appendChild(opt);
                        });
                        modelFilter.value = currentModel;
                    }
                } catch (err) {
                    console.error("[loadModels]", err);
                }
            }

            loadModels();
            loadPage({ reset: true });
        }

        showList();
    }

    return { mount };
})();

export { StockReport };
