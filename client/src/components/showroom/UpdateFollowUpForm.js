import { backendRequest } from "../../api/index.js";
import { createFormLayout, createOption, field, formActions, formSection, setStatus, setupFormValidation } from "../ui.js";

const COL = {
    SERIAL_NUMBER: 0,
    VISIT_DATE: 1,
    CUSTOMER_NAME: 3,
    MOBILE_NUMBER: 4,
    ALT_MOBILE_NUMBER: 5,
    ADDRESS: 6,
    VEHICLE_DETAILS: 7,
    STATUS: 8,
    REMARKS: 9,
    FIRST_FEEDBACK_DATE: 10,
    FIRST_FEEDBACK: 11,
    LAST_FEEDBACK_DATE: 12,
    LAST_FEEDBACK: 13
};

const UpdateFollowUpForm = (() => {

    function normalizeFollowUpStatus(value) {
        const status = String(value || "").trim().toUpperCase();
        if (status === "OPEN" || status === "OPENED") return "OPENED";
        if (status === "CLOSE" || status === "CLOSED") return "CLOSED";
        if (status === "PURCHASED") return "PURCHASED";
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
        const isFirstFeedback = !rowData[COL.FIRST_FEEDBACK];

        const visitDate = rowData[COL.VISIT_DATE]
            ? new Date(rowData[COL.VISIT_DATE]).toLocaleDateString()
            : "";
        const firstFeedbackDate = rowData[COL.FIRST_FEEDBACK_DATE]
            ? new Date(rowData[COL.FIRST_FEEDBACK_DATE]).toLocaleDateString()
            : "";
        const lastFeedbackDate = rowData[COL.LAST_FEEDBACK_DATE]
            ? new Date(rowData[COL.LAST_FEEDBACK_DATE]).toLocaleDateString()
            : "";

        const existingStatus = normalizeFollowUpStatus(rowData[COL.STATUS]);

        container.innerHTML = `
            <div class="u-stack-md">
                <div class="ui-panel-header">
                    <button id="uf-back" class="ui-button ui-button--ghost" type="button">Back to List</button>
                </div>
                ${createFormLayout({
                    id: "uf-form",
                    title: "Customer Follow Up",
                    body: `
                        ${formSection("Customer Info")}
                        ${field("Visit Date", `<input class="ui-input ui-readonly" type="text" value="${visitDate}" readonly />`)}
                        ${field("Customer Name", `<input class="ui-input ui-readonly" type="text" value="${rowData[COL.CUSTOMER_NAME] || ""}" readonly />`)}
                        ${field("Mobile Number", `<input class="ui-input ui-readonly" type="text" value="${rowData[COL.MOBILE_NUMBER] || ""}" readonly />`)}
                        ${formSection("Details")}
                        ${field("Alternate Mobile Number", `<input id="uf-alt-mobile" class="ui-input" type="tel" maxlength="10" value="${rowData[COL.ALT_MOBILE_NUMBER] || ""}" oninput="this.value = this.value.replace(/[^0-9]/g, '')" />`)}
                        ${field("Address", `<input id="uf-address" class="ui-input" type="text" value="${rowData[COL.ADDRESS] || ""}" />`)}
                        ${field("Vehicle Details", `<input id="uf-vehicle-details" class="ui-input" type="text" value="${rowData[COL.VEHICLE_DETAILS] || ""}" />`)}
                        ${field("Status", `<select id="uf-status" class="ui-select">${createOption("OPENED", "Opened", existingStatus === "OPENED")}${createOption("CLOSED", "Closed", existingStatus === "CLOSED")}${createOption("PURCHASED", "Purchased", existingStatus === "PURCHASED")}</select>`)}
                        ${field("Remarks", `<input id="uf-remarks" class="ui-input" type="text" value="${rowData[COL.REMARKS] || ""}" />`)}
                        ${formSection("Feedback")}
                        ${isFirstFeedback
                            ? feedbackBlock("First Feedback", "", "", { editable: true, id: "uf-first-feedback", required: true, placeholder: "Enter feedback..." })
                            : `
                                ${feedbackBlock("First Feedback", rowData[COL.FIRST_FEEDBACK] || "", firstFeedbackDate)}
                                ${feedbackBlock("Last Feedback", rowData[COL.LAST_FEEDBACK] || "", lastFeedbackDate, { editable: true, id: "uf-last-feedback", required: true, placeholder: "Enter latest feedback..." })}
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
                serialNumber: rowData[COL.SERIAL_NUMBER],
                alternateMobileNumber: container.querySelector("#uf-alt-mobile").value.trim(),
                address: container.querySelector("#uf-address").value.trim(),
                vehicleDetails: container.querySelector("#uf-vehicle-details").value.trim(),
                status: container.querySelector("#uf-status").value,
                remarks: container.querySelector("#uf-remarks").value.trim(),
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


