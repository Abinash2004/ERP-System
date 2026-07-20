import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const CHASSIS_COL = 13;

const RTO_STATUSES = [
    "Entry Done",
    "Document Uploaded",
    "Added to Cart",
    "Payment Success",
    "Approval(HSRP)",
    "Order Sent",
    "Number Plate Received",
    "FIT"
];

const RTOForm = (() => {

    async function mount(container, session) {
        let chassisDropdown = null;

        container.innerHTML = createFormLayout({
            id: "rto-form",
            title: "RTO Form",
            body: `
                ${field("Chassis Number", '<div id="rto-chassis-container"></div>', { required: true })}
                ${field("Customer Name", '<input id="rto-customer-name" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched on chassis selection" />')}
                ${field("RTO Entry Date", '<input id="rto-entry-date" class="ui-input" type="date" />')}
                ${field("Application Number", '<input id="rto-app-number" class="ui-input" type="text" placeholder="Enter application number" maxlength="30" />')}
                ${field("RTO Status", '<select id="rto-status-select" class="ui-select"><option value="" disabled selected>Available after chassis selection</option></select>')}
                <div id="rto-registration-container" style="display: none;">
                    ${field("Registration Number", '<input id="rto-registration-number" class="ui-input" type="text" placeholder="Enter registration number" />')}
                </div>
                ${formActions("rto-submit", "rto-status-msg")}
            `
        });

        const customerInput = container.querySelector("#rto-customer-name");
        const entryDateInput = container.querySelector("#rto-entry-date");
        const appNumberInput = container.querySelector("#rto-app-number");
        const statusSelect = container.querySelector("#rto-status-select");
        const regContainer = container.querySelector("#rto-registration-container");
        const registrationInput = container.querySelector("#rto-registration-number");
        const submitButton = container.querySelector("#rto-submit");
        const statusEl = container.querySelector("#rto-status-msg");
        const form = container.querySelector("#rto-form");

        // Alphanumeric validation helper
        appNumberInput.addEventListener("input", () => {
            appNumberInput.value = appNumberInput.value.replace(/[^a-zA-Z0-9]/g, "");
        });

        function findStatusIndex(status) {
            if (!status) return -1;
            const normalized = String(status).replace(/\s+/g, "").toLowerCase();
            return RTO_STATUSES.findIndex(s => s.replace(/\s+/g, "").toLowerCase() === normalized);
        }

        function populateStatusOptions(currentStatus) {
            statusSelect.innerHTML = '<option value="" disabled selected>Select RTO Status</option>';
            const matchedIndex = findStatusIndex(currentStatus);
            const allowed = matchedIndex === -1 ? RTO_STATUSES : RTO_STATUSES.slice(matchedIndex);

            allowed.forEach(status => {
                const opt = document.createElement("option");
                opt.value = status;
                opt.textContent = status;
                statusSelect.appendChild(opt);
            });

            if (matchedIndex !== -1) {
                statusSelect.value = RTO_STATUSES[matchedIndex];
            }
        }

        function updateRegistrationVisibility() {
            const selectedStatus = statusSelect.value;
            const allowedStatuses = ["Approval(HSRP)", "Order Sent", "Number Plate Received", "FIT"];
            const isAllowed = allowedStatuses.some(status => {
                return String(selectedStatus).replace(/\s+/g, "").toLowerCase() === status.replace(/\s+/g, "").toLowerCase();
            });

            if (isAllowed) {
                regContainer.style.display = "block";
                if (!registrationInput.readOnly) {
                    registrationInput.required = true;
                }
            } else {
                regContainer.style.display = "none";
                registrationInput.required = false;
            }
        }

        statusSelect.addEventListener("change", updateRegistrationVisibility);

        chassisDropdown = SearchableDropdown.mount(container.querySelector("#rto-chassis-container"), {
            options: [],
            placeholder: "Select chassis number...",
            required: true,
            onChange: async (val) => {
                if (!val) {
                    customerInput.value = "";
                    entryDateInput.value = "";
                    entryDateInput.readOnly = false;
                    entryDateInput.classList.remove("ui-readonly");
                    appNumberInput.value = "";
                    appNumberInput.readOnly = false;
                    appNumberInput.classList.remove("ui-readonly");
                    registrationInput.value = "";
                    registrationInput.readOnly = false;
                    registrationInput.classList.remove("ui-readonly");
                    statusSelect.innerHTML = '<option value="" disabled selected>Available after chassis selection</option>';
                    regContainer.style.display = "none";
                    return;
                }

                setStatus(statusEl, "Fetching RTO details...", "info", true);
                try {
                    const res = await backendRequest("getRTODetails", { chassis: val });
                    if (res.status === 1 && res.data) {
                        const { customerName, rtoEntryDate, applicationNumber, rtoStatus, registrationNumber } = res.data;

                        customerInput.value = customerName || "";
                        entryDateInput.value = rtoEntryDate || "";
                        appNumberInput.value = applicationNumber || "";
                        registrationInput.value = registrationNumber || "";

                        // Handle read-only logic
                        if (rtoEntryDate) {
                            entryDateInput.readOnly = true;
                            entryDateInput.classList.add("ui-readonly");
                        } else {
                            entryDateInput.readOnly = false;
                            entryDateInput.classList.remove("ui-readonly");
                        }

                        if (applicationNumber) {
                            appNumberInput.readOnly = true;
                            appNumberInput.classList.add("ui-readonly");
                        } else {
                            appNumberInput.readOnly = false;
                            appNumberInput.classList.remove("ui-readonly");
                        }

                        if (registrationNumber) {
                            registrationInput.readOnly = true;
                            registrationInput.classList.add("ui-readonly");
                        } else {
                            registrationInput.readOnly = false;
                            registrationInput.classList.remove("ui-readonly");
                        }

                        populateStatusOptions(rtoStatus);
                        updateRegistrationVisibility();
                        setStatus(statusEl);
                    } else {
                        setStatus(statusEl, res.message || "Failed to load details.", "error");
                    }
                } catch (err) {
                    setStatus(statusEl, "Error loading details.", "error");
                }
            }
        });

        setupFormValidation(form);

        setStatus(statusEl, "Fetching chassis numbers...", "info", true);
        try {
            const res = await backendRequest("getDropdown", CHASSIS_COL);
            if (res.status === 1) {
                chassisDropdown.setOptions(res.data);
                setStatus(statusEl);
            } else {
                setStatus(statusEl, "Failed to load chassis numbers.", "error");
            }
        } catch (err) {
            setStatus(statusEl, "Error fetching dropdown.", "error");
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const chassis = chassisDropdown.getValue();
            const rtoEntryDate = entryDateInput.value;
            const applicationNumber = appNumberInput.value.trim();
            const rtoStatus = statusSelect.value;
            const registrationNumber = registrationInput.value.trim();

            if (!chassis) {
                setStatus(statusEl, "Chassis number is required.", "error");
                return;
            }

            const thresholdIndex = RTO_STATUSES.indexOf("Approval(HSRP)");
            const selectedIndex = findStatusIndex(rtoStatus);
            if (selectedIndex >= thresholdIndex && selectedIndex !== -1 && !registrationNumber) {
                setStatus(statusEl, "Registration number is required for current status.", "error");
                return;
            }

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting RTO details...", "info", true);

            try {
                const res = await backendRequest("addRegistrationForm", {
                    chassis,
                    rtoEntryDate,
                    applicationNumber,
                    rtoStatus,
                    registrationNumber
                });

                if (res.status === 1) {
                    setStatus(statusEl, "RTO details updated successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Failed to update RTO details.", "error");
                    submitButton.disabled = false;
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { RTOForm };
