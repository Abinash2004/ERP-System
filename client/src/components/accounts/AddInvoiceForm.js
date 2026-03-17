import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const CHASSIS_COL = 11;

const AddInvoiceForm = (() => {

    async function mount(container, session) {
        let chassisDropdown = null;

        container.innerHTML = createFormLayout({
            id: "add-invoice-form",
            title: "Add Invoice Form",
            body: `
                ${field("Chassis Number", '<div id="ai-chassis-container"></div>', { required: true })}
                ${field("Invoice Date", '<input id="ai-date" class="ui-input" type="date" required />', { required: true })}
                ${field("Purchased Invoice Number", '<input id="ai-invoice" class="ui-input" type="text" placeholder="Enter invoice number" required />', { required: true })}
                ${field("Gross Value Before Discount", '<input id="ai-gvbd" class="ui-input" type="number" step="0.01" placeholder="Enter gross value" required />', { required: true })}
                ${formActions("ai-submit", "ai-status")}
            `
        });

        const dateInput = container.querySelector("#ai-date");
        const invoiceInput = container.querySelector("#ai-invoice");
        const gvbdInput = container.querySelector("#ai-gvbd");
        const submitButton = container.querySelector("#ai-submit");
        const statusEl = container.querySelector("#ai-status");
        const form = container.querySelector("#add-invoice-form");

        chassisDropdown = SearchableDropdown.mount(container.querySelector("#ai-chassis-container"), {
            options: [],
            placeholder: "Select chassis number...",
            required: true
        });

        setupFormValidation(form);

        setStatus(statusEl, "Fetching chassis numbers...", "info", true);

        try {
            const res = await backendRequest("getDropdown", CHASSIS_COL);
            if (res.status === 1) {
                chassisDropdown.setOptions(res.data);
                setStatus(statusEl);
            } else {
                setStatus(statusEl, res.message || "Failed to fetch chassis numbers.", "error");
            }
        } catch (err) {
            setStatus(statusEl, "Error fetching chassis numbers.", "error");
            console.error("[getDropdown]", err);
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusEl);

            const chassis = chassisDropdown.getValue();
            const date = dateInput.value;
            const invoice = invoiceInput.value.trim();
            const gvbd = gvbdInput.value.trim();

            if (!chassis || !date || !invoice || !gvbd) {
                setStatus(statusEl, "All fields are mandatory.", "error");
                return;
            }

            const payload = {
                chassis,
                date,
                invoice,
                gvbd: parseFloat(gvbd)
            };

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("addInvoiceForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Invoice added successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                console.error("[addInvoiceForm]", err);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { AddInvoiceForm };
