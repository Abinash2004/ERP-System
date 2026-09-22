import { backendRequest } from "../../api/index.js";
import { LIMIT } from "../../constants.js";
import { panelHeader, setStatus } from "../ui.js";

const RTOReport = (() => {
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

        const currentBranch = session.branch || "ALL";
        let scrollCleanup = null;

        function renderRow(row) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatDate(row.rtoEntDt)}</td>
                <td>${row.customerName ?? ""}</td>
                <td>${row.rtoStatus ?? ""}</td>
                <td>${row.regNo ?? ""}</td>
                <td>${row.chassisNumber ?? ""}</td>
            `;
            return tr;
        }

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-sales-report-view">
                    ${panelHeader("RTO Report", "")}
                    <div id="rto-rep-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="rto-rep-table">
                            <thead>
                                <tr>
                                    <th>RTO ENT DT</th>
                                    <th>Customer Name</th>
                                    <th>RTO Status</th>
                                    <th>Reg No</th>
                                    <th>Chassis Number</th>
                                </tr>
                            </thead>
                            <tbody id="rto-rep-tbody"></tbody>
                        </table>
                    </div>
                </section>
            `;

            const tbody = container.querySelector("#rto-rep-tbody");
            const tableScroll = container.querySelector(".ui-table-scroll");
            const statusEl = container.querySelector("#rto-rep-status");

            async function loadPage({ reset = false } = {}) {
                if (isLoading) return;
                if (!reset && !hasMore) return;

                isLoading = true;
                setStatus(statusEl, reset ? "Loading RTO records..." : "Loading more records...", "info", true);

                try {
                    const res = await backendRequest("getRTOReportList", {
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
                        tbody.innerHTML = `<tr><td colspan="5">No RTO records found.</td></tr>`;
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
                    }

                    setStatus(statusEl);
                } catch (err) {
                    console.error("[getRTOReportList]", err);
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

export { RTOReport };
