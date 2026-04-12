import { backendRequest } from "../../api/index.js";
import { UpdateFollowUpForm } from "./UpdateFollowUpForm.js";
import { panelHeader, setStatus } from "../ui.js";

const LIMIT = 10;

const COL = {
    VISIT_DATE: 1,
    CUSTOMER_NAME: 3,
    MOBILE_NUMBER: 4,
    STATUS: 8
};

function normalizeFollowUpStatus(value) {
    const status = String(value || "").trim().toUpperCase();
    if (status === "OPEN" || status === "OPENED") return "OPENED";
    if (status === "CLOSE" || status === "CLOSED") return "CLOSED";
    if (status === "PURCHASED") return "PURCHASED";
    if (status === "BOOKED") return "BOOKED";
    return "OPENED";
}

const FollowUpList = (() => {

    async function mount(container, session) {
        let page = 1;
        let hasMore = true;
        let currentStatus = "ALL";

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight">
                    ${panelHeader("Follow Up Customer List", '<select id="fup-status-filter" class="ui-select ui-select--compact"><option value="ALL">All</option><option value="OPENED">Opened</option><option value="CLOSED">Closed</option><option value="PURCHASED">Purchased</option><option value="BOOKED">Booked</option></select>')}
                    <div id="fup-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="follow-up-table">
                            <thead>
                                <tr>
                                    <th>Visit Date</th>
                                    <th>Customer Name</th>
                                    <th>Mobile Number</th>
                                    <th>Follow Up Status</th>
                                </tr>
                            </thead>
                            <tbody id="follow-up-tbody"></tbody>
                        </table>
                    </div>
                    <div class="ui-pagination">
                        <button id="fup-prev" class="ui-button ui-button--ghost" type="button" disabled>&larr;</button>
                        <span id="fup-page-info" class="u-muted">Page ${page}</span>
                        <button id="fup-next" class="ui-button ui-button--ghost" type="button">&rarr;</button>
                    </div>
                </section>
            `;

            const tbody = container.querySelector("#follow-up-tbody");
            const prevBtn = container.querySelector("#fup-prev");
            const nextBtn = container.querySelector("#fup-next");
            const pageInfo = container.querySelector("#fup-page-info");
            const statusFilter = container.querySelector("#fup-status-filter");
            const statusEl = container.querySelector("#fup-status");

            async function loadPage() {
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                tbody.innerHTML = "";
                setStatus(statusEl, "Loading follow up records...", "info", true);

                try {
                    const res = await backendRequest("getFollowUpList", {
                        branch: session.branch,
                        page,
                        limit: LIMIT,
                        status: currentStatus
                    });

                    if (res.status !== 1) {
                        setStatus(statusEl, res.message || "Unable to load records.", "error");
                        return;
                    }

                    const rows = res.data;
                    hasMore = rows.length === LIMIT;

                    if (rows.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4">No records found.</td></tr>';
                    } else {
                        rows.forEach(row => {
                            const tr = document.createElement("tr");
                            tr.className = "ui-table-row";
                            const rawDate = row[COL.VISIT_DATE];
                            const visitDate = rawDate ? new Date(rawDate).toLocaleDateString() : "";
                            const followUpStatus = normalizeFollowUpStatus(row[COL.STATUS]);
                            const statusVariant = followUpStatus === "PURCHASED"
                                ? "success"
                                : followUpStatus === "CLOSED"
                                    ? "danger"
                                    : followUpStatus === "BOOKED"
                                        ? "info"
                                        : "warning";

                            tr.innerHTML = `
                                <td>${visitDate}</td>
                                <td>${row[COL.CUSTOMER_NAME] || ""}</td>
                                <td class="u-nowrap">
                                    <div class="u-flex-center" style="gap: 8px;">
                                        ${row[COL.MOBILE_NUMBER] || ""}
                                        ${row[COL.MOBILE_NUMBER] ? `
                                            <a href="tel:${row[COL.MOBILE_NUMBER]}" 
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
                                <td><span class="ui-follow-status ui-follow-status--${statusVariant}">${followUpStatus}</span></td>
                            `;
                            tr.addEventListener("click", () => showForm(row));
                            tbody.appendChild(tr);
                        });
                    }

                    setStatus(statusEl);
                    pageInfo.textContent = `Page ${page}`;
                    prevBtn.disabled = page === 1;
                    nextBtn.disabled = !hasMore;
                } catch (err) {
                    console.error("[getFollowUpList]", err);
                    setStatus(statusEl, "Unable to load records.", "error");
                    prevBtn.disabled = page === 1;
                    nextBtn.disabled = !hasMore;
                }
            }

            statusFilter.value = currentStatus;
            statusFilter.addEventListener("change", () => {
                currentStatus = statusFilter.value;
                page = 1;
                loadPage();
            });

            prevBtn.addEventListener("click", () => {
                if (page > 1) {
                    page--;
                    loadPage();
                }
            });
            nextBtn.addEventListener("click", () => {
                if (hasMore) {
                    page++;
                    loadPage();
                }
            });

            loadPage();
        }

        function showForm(rowData) {
            container.innerHTML = "";
            UpdateFollowUpForm.mount(container, rowData, () => {
                showList();
            });
        }

        showList();
    }

    return { mount };
})();

export { FollowUpList };

