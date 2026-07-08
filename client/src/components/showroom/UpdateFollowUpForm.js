import { backendRequest } from "../../api/index.js";
import { createFormLayout, createOption, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const UpdateFollowUpForm = (() => {

    function normalizeFollowUpStatus(value) {
        const status = String(value || "").trim().toUpperCase();
        if (status === "OPEN" || status === "OPENED") return "OPENED";
        if (status === "CLOSE" || status === "CLOSED") return "CLOSED";
        if (status === "PURCHASED") return "PURCHASED";
        if (status === "BOOKED") return "BOOKED";
        return "OPENED";
    }

    function feedbackBlock(label, content, date, { editable = false, id = "", required = false, placeholder = "" } = {}) {
        const control = editable
            ? `<textarea${id ? ` id="${id}"` : ""} class="ui-textarea" rows="4" placeholder="${placeholder}"${required ? " required" : ""}>${content || ""}</textarea>`
            : `<textarea class="ui-textarea ui-readonly" rows="4" readonly>${content || ""}</textarea>`;

        return field(
            label,
            `
                <div class="ui-feedback-block">
                    ${control}
                    ${date ? `<span class="ui-feedback-time">${date}</span>` : ""}
                </div>
            `,
            { required, full: true }
        );
    }

    function mount(container, rowData, goBack) {
        const isFirstFeedback = !rowData.first_feedback;

        function formatDate(value) {
            if (!value) return "";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "";
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }

        const visitDate = formatDate(rowData.visit_date);
        const firstFeedbackDate = formatDate(rowData.first_feedback_date);
        const lastFeedbackDate = formatDate(rowData.last_feedback_date);

        const existingStatus = normalizeFollowUpStatus(rowData.status);

        container.innerHTML = `
            <div class="u-stack-md">
                <div class="ui-panel-header">
                    <button id="uf-back" class="ui-button ui-button--ghost" type="button">Back to List</button>
                </div>
                ${createFormLayout({
                    id: "uf-form",
                    title: "Customer Follow Up",
                    body: `
                        ${field("Visit Date", `<input class="ui-input ui-readonly" type="text" value="${visitDate}" readonly />`)}
                        ${field("Customer Name", `<input class="ui-input ui-readonly" type="text" value="${rowData.customer_name || ""}" readonly />`)}
                        ${field("Mobile Number", `<input class="ui-input ui-readonly" type="text" value="${rowData.mobile_number || ""}" readonly />`)}
                        ${field("Address", `<input id="uf-address" class="ui-input" type="text" value="${rowData.address || ""}" />`)}
                        ${field("Vehicle Details", `<input id="uf-vehicle-details" class="ui-input" type="text" value="${rowData.vehicle_details || ""}" />`)}
                        ${field("Status", `<select id="uf-status" class="ui-select">${createOption("OPENED", "Opened", existingStatus === "OPENED")}${createOption("CLOSED", "Closed", existingStatus === "CLOSED")}${createOption("PURCHASED", "Purchased", existingStatus === "PURCHASED")}${createOption("BOOKED", "Booked", existingStatus === "BOOKED")}</select>`)}
                        ${isFirstFeedback
                            ? feedbackBlock("First Feedback", "", "", { editable: true, id: "uf-first-feedback", required: true, placeholder: "Enter feedback..." })
                            : `
                                ${feedbackBlock("First Feedback", rowData.first_feedback || "", firstFeedbackDate)}
                                ${feedbackBlock("Last Feedback", rowData.last_feedback || "", lastFeedbackDate, { editable: true, id: "uf-last-feedback", required: true, placeholder: "Enter latest feedback..." })}
                            `}
                        ${formActions("uf-submit", "uf-status-msg")}
                    `
                })}
            </div>
        `;

        container.querySelector("#uf-back").addEventListener("click", () => {
            if (typeof goBack === "function") goBack();
        });

        const form = container.querySelector("#uf-form");
        const submitBtn = container.querySelector("#uf-submit");
        const statusMsg = container.querySelector("#uf-status-msg");
        setupFormValidation(form);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusMsg);

            const firstFeedback = container.querySelector("#uf-first-feedback")?.value.trim();
            const lastFeedback = container.querySelector("#uf-last-feedback")?.value.trim();

            if (isFirstFeedback && !firstFeedback) {
                setStatus(statusMsg, "First Feedback is required.", "error");
                return;
            }
            if (!isFirstFeedback && !lastFeedback) {
                setStatus(statusMsg, "Last Feedback is required.", "error");
                return;
            }

            const payload = {
                serialNumber: rowData.serial_number,
                address: container.querySelector("#uf-address").value.trim(),
                vehicleDetails: container.querySelector("#uf-vehicle-details").value.trim(),
                status: container.querySelector("#uf-status").value,
                firstFeedback: firstFeedback || "",
                lastFeedback: lastFeedback || ""
            };

            submitBtn.disabled = true;
            setStatus(statusMsg, "Submitting...", "info", true);

            try {
                const res = await backendRequest("updateFollowUpForm", payload);
                if (res.status === 1) {
                    setStatus(statusMsg, "Updated successfully. Returning to list...", "success");
                    setTimeout(() => {
                        if (typeof goBack === "function") goBack();
                    }, 500);
                } else {
                    setStatus(statusMsg, res.message || "Update failed.", "error");
                    submitBtn.disabled = false;
                }
            } catch (err) {
                setStatus(statusMsg, "Network error. Please try again.", "error");
                console.error("[updateFollowUp]", err);
                submitBtn.disabled = false;
            }
        });
    }

    return { mount };
})();

export { UpdateFollowUpForm };


