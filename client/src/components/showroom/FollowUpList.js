import { backendRequest } from "../../api/index.js";
import { UpdateFollowUpForm } from "./UpdateFollowUpForm.js";
import { panelHeader, setStatus } from "../ui.js";

const LIMIT = 10;

const COL = {
    VISIT_DATE: 1,
    CUSTOMER_NAME: 3,
    MOBILE_NUMBER: 4,
    STATUS: 8,
    FIRST_FEEDBACK: 11,
    LAST_FEEDBACK: 13
};

const FollowUpList = (() => {

    async function mount(container, session) {
        let page = 1;
        let hasMore = true;
        let currentStatus = "ALL";

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card">
                    ${panelHeader("Follow Up Customer List", '<select id="fup-status-filter" class="ui-select"><option value="ALL">All</option><option value="OPEN">Open</option><option value="CLOSE">Close</option><option value="PURCHASED">Purchased</option></select>')}
                    <div id="fup-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="follow-up-table">
                            <thead>
                                <tr>
                                    <th>Visit Date</th>
                                    <th>Customer Name</th>
                                    <th>Mobile Number</th>
                                    <th>Follow Up Status</th>
                                    <th>Feedback Status</th>
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
                        tbody.innerHTML = '<tr><td colspan="5">No records found.</td></tr>';
                    } else {
                        rows.forEach(row => {
                            const tr = document.createElement("tr");
                            tr.className = "ui-table-row";
                            const rawDate = row[COL.VISIT_DATE];
                            const visitDate = rawDate ? new Date(rawDate).toLocaleDateString() : "";
                            const hasFirst = !!row[COL.FIRST_FEEDBACK];
                            const hasLast = !!row[COL.LAST_FEEDBACK];

                            let feedbackStatus = '<span class="ui-badge">First Feedback Pending</span>';
                            if (hasFirst && hasLast) {
                                feedbackStatus = '<span class="ui-badge is-success">Both Feedback Given</span>';
                            } else if (hasFirst && !hasLast) {
                                feedbackStatus = '<span class="ui-badge is-partial">Last Feedback Pending</span>';
                            }

                            const followUpStatus = row[COL.STATUS] || "OPEN";

                            tr.innerHTML = `
                                <td>${visitDate}</td>
                                <td>${row[COL.CUSTOMER_NAME] || ""}</td>
                                <td>${row[COL.MOBILE_NUMBER] || ""}</td>
                                <td>${followUpStatus}</td>
                                <td>${feedbackStatus}</td>
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
