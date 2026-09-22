import { backendRequest } from "../../api/index.js";
import { LIMIT } from "../../constants.js";
import { panelHeader, setStatus } from "../ui.js";
import { AdminVerificationForm } from "./AdminVerificationForm.js";

const AccountReport = (() => {
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
        let scrollCleanup = null;

        // Set up separate list and form view slots
        container.innerHTML = `
            <div id="acc-rep-list-view"></div>
            <div id="acc-rep-form-view" style="display: none;"></div>
        `;

        const listView = container.querySelector("#acc-rep-list-view");
        const formView = container.querySelector("#acc-rep-form-view");

        function renderRow(row) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatDate(row.saleDate)}</td>
                <td>${row.customerName ?? ""}</td>
                <td>${row.saleCounter ?? ""}</td>
                <td>${row.model ?? ""}</td>
                <td>${row.color ?? ""}</td>
                <td>${row.cashFinance ?? ""}</td>
                <td>${row.onRoad ?? ""}</td>
                <td>
                    <button class="ui-verify-btn" title="Verify Record" type="button" style="background: none; border: none; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; color: var(--accent);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </button>
                </td>
            `;

            const verifyBtn = tr.querySelector(".ui-verify-btn");
            verifyBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                // Toggle view display
                listView.style.display = "none";
                formView.style.display = "block";

                // Mount verification form
                AdminVerificationForm.mount(formView, session, row, (shouldRefresh) => {
                    formView.style.display = "none";
                    formView.innerHTML = "";
                    listView.style.display = "block";

                    if (shouldRefresh) {
                        showList(); // Re-fetch list only when submitted
                    }
                });
            });

            return tr;
        }

        function showList() {
            page = 1;
            hasMore = true;
            isLoading = false;

            listView.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-sales-report-view">
                    ${panelHeader("Account Report", "")}
                    <div id="acc-rep-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="acc-rep-table">
                            <thead>
                                <tr>
                                    <th>Sale Date</th>
                                    <th>Customer Name</th>
                                    <th>Sale Counter</th>
                                    <th>Model</th>
                                    <th>Color</th>
                                    <th>Cash / Finance</th>
                                    <th>On Road</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="acc-rep-tbody"></tbody>
                        </table>
                    </div>
                </section>
            `;

            const tbody = listView.querySelector("#acc-rep-tbody");
            const tableScroll = listView.querySelector(".ui-table-scroll");
            const statusEl = listView.querySelector("#acc-rep-status");

            async function loadPage({ reset = false } = {}) {
                if (isLoading) return;
                if (!reset && !hasMore) return;

                isLoading = true;
                setStatus(statusEl, reset ? "Loading account records..." : "Loading more records...", "info", true);

                try {
                    const res = await backendRequest("getAccountReportList", {
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
                        tbody.innerHTML = `<tr><td colspan="8">No account records found.</td></tr>`;
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
                    }

                    setStatus(statusEl);
                } catch (err) {
                    console.error("[getAccountReportList]", err);
                    setStatus(statusEl, "Unable to load records.", "error");
                } finally {
                    isLoading = false;
                }
            }

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
            };

            loadPage({ reset: true });
        }

        showList();
    }

    return { mount };
})();

export { AccountReport };
