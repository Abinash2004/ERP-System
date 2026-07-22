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
                ${field("Invoice Value After GST After Discount", '<input id="ai-gvbd" class="ui-input" type="number" step="0.01" placeholder="Enter Invoice Value" required />', { required: true })}
                ${field("Ex Showroom Price", '<input id="ai-ex-showroom" class="ui-input" type="number" step="0.01" placeholder="Enter Ex Showroom Price" required />', { required: true })}
                ${field("Auto Invoice Price", '<input id="ai-auto-invoice" class="ui-input ui-readonly" type="number" step="0.01" placeholder="Auto calculated" readonly />')}
                ${field("Gap Price", '<input id="ai-gap-price" class="ui-input ui-readonly" type="number" step="0.01" placeholder="Auto calculated" readonly />')}
                ${field("YBC Name", `
                    <select id="ai-dealer" class="ui-select" required>
                        <option value="" disabled selected>Select YBC Name</option>
                        <option value="ADITI">ADITI</option>
                        <option value="PL">PL</option>
                    </select>
                `, { required: true })}
                ${formActions("ai-submit", "ai-status")}
            `
        });

        const dateInput = container.querySelector("#ai-date");
        const invoiceInput = container.querySelector("#ai-invoice");
        const gvbdInput = container.querySelector("#ai-gvbd");
        const exShowroomInput = container.querySelector("#ai-ex-showroom");
        const autoInvoiceInput = container.querySelector("#ai-auto-invoice");
        const gapPriceInput = container.querySelector("#ai-gap-price");
        const dealerSelect = container.querySelector("#ai-dealer");
        const submitButton = container.querySelector("#ai-submit");
        const statusEl = container.querySelector("#ai-status");
        const form = container.querySelector("#add-invoice-form");

        function calculateRealtimeFields() {
            const gvbd = parseFloat(gvbdInput.value) || 0;
            const exShowroom = parseFloat(exShowroomInput.value) || 0;

            const autoInvoice = exShowroom * 0.965;
            const gapPrice = gvbd - autoInvoice;

            autoInvoiceInput.value = exShowroom ? autoInvoice.toFixed(2) : "";
            gapPriceInput.value = (gvbd && exShowroom) ? gapPrice.toFixed(2) : "";
        }

        gvbdInput.addEventListener("input", calculateRealtimeFields);
        exShowroomInput.addEventListener("input", calculateRealtimeFields);

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
            const exShowroomPrice = exShowroomInput.value.trim();
            const dealer = dealerSelect.value;

            if (!chassis || !date || !invoice || !gvbd || !exShowroomPrice || !dealer) {
                setStatus(statusEl, "All fields are mandatory.", "error");
                return;
            }

            const payload = {
                chassis,
                date,
                invoice,
                gvbd: parseFloat(gvbd),
                exShowroomPrice: parseFloat(exShowroomPrice),
                dealer
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
