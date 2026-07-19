import { backendRequest } from "../../api/index.js";
import { panelHeader, setStatus } from "../ui.js";

const LIMIT = 20;
const BRANCHES = ["ASKA", "MOHANA", "SURADA"];

const SalesReport = (() => {
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
        let scrollCleanup = null;

        function renderRow(row) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.serialNumber ?? ""}</td>
                <td>${formatDate(row.invoiceDate)}</td>
                <td>${row.purchasedInvoiceNumber ?? ""}</td>
                <td>${row.currentCounter ?? ""}</td>
                <td>${row.keyNumber ?? ""}</td>
                <td>${row.engineNumber ?? ""}</td>
                <td>${row.chassisNumber ?? ""}</td>
                <td>${row.model ?? ""}</td>
                <td>${row.color ?? ""}</td>
                <td>${row.stockStatus ?? ""}</td>
                <td>${formatDate(row.saleDate)}</td>
                <td>${row.customerOnRoadPrice ?? ""}</td>
                <td>${row.saleCounter ?? ""}</td>
                <td>${row.customerName ?? ""}</td>
                <td>${row.mobileNumber ?? ""}</td>
                <td>${row.alternateMobileNumber ?? ""}</td>
                <td>${row.cashFinance ?? ""}</td>
                <td>${row.financer ?? ""}</td>
                <td>${row.salesPerson ?? ""}</td>
                <td>${row.advancerName ?? ""}</td>
                <td>${row.totalDp ?? ""}</td>
                <td>${row.advanceAmount ?? ""}</td>
                <td>${row.receivedDp ?? ""}</td>
                <td>${row.totalReceived ?? ""}</td>
                <td>${row.due ?? ""}</td>
                <td>${row.anyExchange ?? ""}</td>
                <td>${row.exchangeModel ?? ""}</td>
                <td>${row.exchangeRegisterNumber ?? ""}</td>
                <td>${row.customerExchangeValue ?? ""}</td>
                <td>${row.dealerExchangeValue ?? ""}</td>
                <td>${row.dealerName ?? ""}</td>
            `;
            return tr;
        }

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-sales-report-view">
                    ${panelHeader("Sales Report", `
                        <button id="sales-filter-btn" class="ui-button ui-button--ghost" type="button" style="padding: 8px 12px; min-height: 36px; display: inline-flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            <span>Filters</span>
                        </button>
                    `)}
                    <div id="sales-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="sales-table">
                            <thead>
                                <tr>
                                    <th>Serial No.</th>
                                    <th>Invoice Date</th>
                                    <th>Invoice Number</th>
                                    <th>Current Counter</th>
                                    <th>Key Number</th>
                                    <th>Engine Number</th>
                                    <th>Chassis Number</th>
                                    <th>Model</th>
                                    <th>Color</th>
                                    <th>Stock Status</th>
                                    <th>Sale Date</th>
                                    <th>Customer On-Road Price</th>
                                    <th>Sale Counter</th>
                                    <th>Customer Name</th>
                                    <th>Mobile Number</th>
                                    <th>Alt Mobile Number</th>
                                    <th>Cash / Finance</th>
                                    <th>Financer</th>
                                    <th>Sales Person</th>
                                    <th>Advancer Name</th>
                                    <th>Total DP</th>
                                    <th>Advance Amount</th>
                                    <th>Received DP</th>
                                    <th>Total Received</th>
                                    <th>Due</th>
                                    <th>Any Exchange</th>
                                    <th>Exchange Model</th>
                                    <th>Exchange Register No.</th>
                                    <th>Cust Exchange Value</th>
                                    <th>Dealer Exchange Value</th>
                                    <th>Dealer Name</th>
                                </tr>
                            </thead>
                            <tbody id="sales-tbody"></tbody>
                        </table>
                    </div>
                </section>
                <div id="sales-filter-drawer" class="ui-drawer" aria-hidden="true">
                    <div class="ui-drawer__overlay"></div>
                    <div class="ui-drawer__content">
                        <div class="ui-drawer__header">
                            <h3 class="ui-drawer__title">Filters</h3>
                            <button id="sales-filter-close" class="ui-drawer__close" type="button" aria-label="Close filters">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="ui-drawer__body">
                            <div class="ui-field">
                                <select id="sales-branch-filter" class="ui-select">
                                    <option value="ALL">All Branches</option>
                                    ${BRANCHES.map(branch => `<option value="${branch}">${branch}</option>`).join("")}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const tbody = container.querySelector("#sales-tbody");
            const tableScroll = container.querySelector(".ui-table-scroll");
            const branchFilter = container.querySelector("#sales-branch-filter");
            const statusEl = container.querySelector("#sales-status");
            const filterBtn = container.querySelector("#sales-filter-btn");
            const filterDrawer = container.querySelector("#sales-filter-drawer");
            const filterClose = container.querySelector("#sales-filter-close");
            const filterOverlay = container.querySelector(".ui-drawer__overlay");

            const openDrawer = () => filterDrawer?.setAttribute("aria-hidden", "false");
            const closeDrawer = () => {
                const wasOpen = filterDrawer?.getAttribute("aria-hidden") === "false";
                filterDrawer?.setAttribute("aria-hidden", "true");
                if (wasOpen) {
                    const nextBranch = branchFilter.value;
                    if (nextBranch !== currentBranch) {
                        currentBranch = nextBranch;
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
                setStatus(statusEl, reset ? "Loading sales records..." : "Loading more records...", "info", true);

                try {
                    const res = await backendRequest("getSalesList", {
                        branch: currentBranch,
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
                        tbody.innerHTML = `<tr><td colspan="31">No sales records found.</td></tr>`;
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
                    }

                    setStatus(statusEl);
                } catch (err) {
                    console.error("[getSalesList]", err);
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

export { SalesReport };
