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
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
    }

    async function mount(container, session) {
        let page = 1;
        let hasMore = true;
        let isLoading = false;
        let currentStatus = "ALL";
        let currentBranch = session.role === "admin" ? "ALL" : session.branch;
        let scrollCleanup = null;

        function renderRow(row) {
            const tr = document.createElement("tr");
            tr.className = "ui-table-row";
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
                <td>${row.remarks || ""}</td>
                <td>${firstFeedbackDate}</td>
                <td>${row.first_feedback || ""}</td>
                <td>${lastFeedbackDate}</td>
                <td>${row.last_feedback || ""}</td>
            `;
            tr.addEventListener("click", () => showForm(row));
            return tr;
        }

        function showList() {
            container.innerHTML = `
                <section class="ui-table-card ui-table-card--tight ui-follow-up-view">
                    ${panelHeader("Follow Up Customer List", `
                        <div class="u-flex" style="gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                            ${session.role === "admin" ? '<select id="fup-branch-filter" class="ui-select ui-select--compact"><option value="ALL">All Branches</option>' + BRANCHES.map(branch => `<option value="${branch}">${branch}</option>`).join("") + '</select>' : ""}
                            <select id="fup-status-filter" class="ui-select ui-select--compact"><option value="ALL">All</option><option value="OPENED">Opened</option><option value="CLOSED">Closed</option><option value="PURCHASED">Purchased</option><option value="BOOKED">Booked</option></select>
                        </div>
                    `)}
                    <div id="fup-status" class="ui-status" role="status" aria-live="polite"></div>
                    <div class="ui-table-scroll">
                        <table class="ui-table" id="follow-up-table">
                            <thead>
                                <tr>
                                    <th>Visit Date</th>
                                    <th>Location</th>
                                    <th>Customer Name</th>
                                    <th>Mobile Number</th>
                                    <th>Address</th>
                                    <th>Vehicle Details</th>
                                    <th>Follow Up Status</th>
                                    <th>Remarks</th>
                                    <th>First Feedback Date</th>
                                    <th>First Feedback</th>
                                    <th>Last Feedback Date</th>
                                    <th>Last Feedback</th>
                                </tr>
                            </thead>
                            <tbody id="follow-up-tbody"></tbody>
                        </table>
                    </div>
                </section>
            `;

            const tbody = container.querySelector("#follow-up-tbody");
            const tableScroll = container.querySelector(".ui-table-scroll");
            const statusFilter = container.querySelector("#fup-status-filter");
            const branchFilter = container.querySelector("#fup-branch-filter");
            const statusEl = container.querySelector("#fup-status");

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
                        status: currentStatus
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
                        tbody.innerHTML = '<tr><td colspan="12">No records found.</td></tr>';
                    } else if (rows.length > 0) {
                        rows.forEach(row => tbody.appendChild(renderRow(row)));
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
            statusFilter.addEventListener("change", () => {
                currentStatus = statusFilter.value;
                resetAndLoad();
            });

            if (branchFilter) {
                branchFilter.value = currentBranch;
                branchFilter.addEventListener("change", () => {
                    currentBranch = branchFilter.value;
                    resetAndLoad();
                });
            }

            const onScroll = () => {
                if (!tableScroll || isLoading || !hasMore) return;
                const remaining = tableScroll.scrollHeight - tableScroll.scrollTop - tableScroll.clientHeight;
                if (remaining <= 160) {
                    page += 1;
                    loadPage();
                }
            };

            tableScroll.addEventListener("scroll", onScroll, { passive: true });
            scrollCleanup = () => tableScroll.removeEventListener("scroll", onScroll);

            loadPage({ reset: true });
        }

        function showForm(rowData) {
            container.innerHTML = "";
            if (scrollCleanup) {
                scrollCleanup();
                scrollCleanup = null;
            }
            UpdateFollowUpForm.mount(container, rowData, () => {
                showList();
            });
        }

        showList();
    }

    return { mount };
})();

export { FollowUpList };
