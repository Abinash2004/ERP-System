import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, createOption, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const COLS = {
    KEY_NUMBER: 14,
    EST_DISBURSEMENT: 15,
    CUST_ALT_MOBILE: 16,
    ADV_ALT_MOBILE: 17
};

const OptionalFieldForm = (() => {

    async function mount(container, session) {
        let dropdowns = {
            keyChassis: null,
            estChassis: null,
            custChassis: null,
            advName: null
        };

        container.innerHTML = createFormLayout({
            id: "optional-field-form",
            title: "Optional Field Form",
            body: `
                ${field("Optional Field", `<select id="off-type" class="ui-select" required>${createOption("", "Select type...", true)}${createOption("1", "Key Number")}${createOption("2", "Customer Alternate Mobile Number")}${createOption("3", "Estimated Disbursement")}${createOption("4", "Advancer Alternate Mobile Number")}</select>`, { required: true, full: true })}
                <div id="section-1" class="off-section">
                    ${field("Chassis Number", '<div id="off-chassis-1"></div>', { required: true })}
                    ${field("Model", '<input id="off-model-1" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Color", '<input id="off-color-1" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Key Number", '<input id="off-key-val" class="ui-input" type="text" placeholder="Enter key number" required />', { required: true })}
                </div>
                <div id="section-2" class="off-section">
                    ${field("Chassis Number", '<div id="off-chassis-2"></div>', { required: true })}
                    ${field("Customer Name", '<input id="off-customer-2" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Customer Alternate Mobile Number", '<input id="off-cust-mobile-val" class="ui-input" type="tel" maxlength="10" placeholder="10-digit number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" required />', { required: true })}
                </div>
                <div id="section-3" class="off-section">
                    ${field("Chassis Number", '<div id="off-chassis-3"></div>', { required: true })}
                    ${field("Customer Name", '<input id="off-customer-3" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Estimated Disbursement", '<input id="off-est-disb-val" class="ui-input" type="number" placeholder="Enter amount" required />', { required: true })}
                </div>
                <div id="section-4" class="off-section">
                    ${field("Advancer Name", '<div id="off-adv-name-4"></div>', { required: true })}
                    ${field("Advancer Alternate Mobile Number", '<input id="off-adv-mobile-val" class="ui-input" type="tel" maxlength="10" placeholder="10-digit number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" required />', { required: true })}
                </div>
                ${formActions("off-submit", "off-status", "Submit", true)}
            `
        });

        const typeSelect = container.querySelector("#off-type");
        const submitButton = container.querySelector("#off-submit");
        const statusEl = container.querySelector("#off-status");
        const form = container.querySelector("#optional-field-form");

        const sections = {
            1: container.querySelector("#section-1"),
            2: container.querySelector("#section-2"),
            3: container.querySelector("#section-3"),
            4: container.querySelector("#section-4")
        };

        const inputs = {
            1: { keyNumber: container.querySelector("#off-key-val"), model: container.querySelector("#off-model-1"), color: container.querySelector("#off-color-1") },
            2: { alternateMobileNumber: container.querySelector("#off-cust-mobile-val"), customer: container.querySelector("#off-customer-2") },
            3: { estimatedDisbursement: container.querySelector("#off-est-disb-val"), customer: container.querySelector("#off-customer-3") },
            4: { alternateMobileNumber: container.querySelector("#off-adv-mobile-val") }
        };

        dropdowns.keyChassis = SearchableDropdown.mount(container.querySelector("#off-chassis-1"), {
            placeholder: "Select chassis number...",
            required: true,
            onChange: async (val) => {
                if (!val) { inputs[1].model.value = ""; inputs[1].color.value = ""; return; }
                inputs[1].model.value = "Fetching...";
                inputs[1].color.value = "Fetching...";
                setStatus(statusEl, "Fetching chassis details...", "info", true);
                try {
                    const res = await backendRequest("getChassis", val);
                    if (res.status === 1) {
                        inputs[1].model.value = res.data.model || "N/A";
                        inputs[1].color.value = res.data.color || "N/A";
                    }
                    setStatus(statusEl);
                } catch (e) {
                    setStatus(statusEl, "Error fetching chassis details.", "error");
                    console.error(e);
                }
            }
        });

        dropdowns.custChassis = SearchableDropdown.mount(container.querySelector("#off-chassis-2"), {
            placeholder: "Select chassis number...",
            required: true,
            onChange: async (val) => {
                if (!val) { inputs[2].customer.value = ""; return; }
                inputs[2].customer.value = "Fetching...";
                setStatus(statusEl, "Fetching chassis details...", "info", true);
                try {
                    const res = await backendRequest("getChassis", val);
                    if (res.status === 1) { inputs[2].customer.value = res.data.customer || "N/A"; }
                    setStatus(statusEl);
                } catch (e) {
                    setStatus(statusEl, "Error fetching chassis details.", "error");
                    console.error(e);
                }
            }
        });

        dropdowns.estChassis = SearchableDropdown.mount(container.querySelector("#off-chassis-3"), {
            placeholder: "Select chassis number...",
            required: true,
            onChange: async (val) => {
                if (!val) { inputs[3].customer.value = ""; return; }
                inputs[3].customer.value = "Fetching...";
                setStatus(statusEl, "Fetching chassis details...", "info", true);
                try {
                    const res = await backendRequest("getChassis", val);
                    if (res.status === 1) { inputs[3].customer.value = res.data.customer || "N/A"; }
                    setStatus(statusEl);
                } catch (e) {
                    setStatus(statusEl, "Error fetching chassis details.", "error");
                    console.error(e);
                }
            }
        });

        dropdowns.advName = SearchableDropdown.mount(container.querySelector("#off-adv-name-4"), {
            placeholder: "Select advancer name...",
            required: true
        });

        setupFormValidation(form);

        typeSelect.addEventListener("change", () => {
            Object.values(sections).forEach(s => s.classList.remove("visible"));
            const code = typeSelect.value;
            if (code && sections[code]) {
                sections[code].classList.add("visible");
            } else {
            }
            setStatus(statusEl);
        });

        setStatus(statusEl, "Fetching dropdowns...", "info", true);
        try {
            const [res1, res2, res3, res4] = await Promise.all([
                backendRequest("getDropdown", COLS.KEY_NUMBER),
                backendRequest("getDropdown", COLS.CUST_ALT_MOBILE),
                backendRequest("getDropdown", COLS.EST_DISBURSEMENT),
                backendRequest("getDropdown", COLS.ADV_ALT_MOBILE)
            ]);
            if (res1.status === 1) dropdowns.keyChassis.setOptions(res1.data);
            if (res2.status === 1) dropdowns.custChassis.setOptions(res2.data);
            if (res3.status === 1) dropdowns.estChassis.setOptions(res3.data);
            if (res4.status === 1) dropdowns.advName.setOptions(res4.data);
            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error loading data.", "error");
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const code = parseInt(typeSelect.value);
            let payload = { code };

            if (code === 1) {
                payload.chassis = dropdowns.keyChassis.getValue();
                payload.keyNumber = inputs[1].keyNumber.value.trim();
                if (!payload.chassis || !payload.keyNumber) { setStatus(statusEl, "All fields required.", "error"); return; }
            } else if (code === 2) {
                payload.chassis = dropdowns.custChassis.getValue();
                payload.alternateMobileNumber = inputs[2].alternateMobileNumber.value.trim();
                if (!payload.chassis || !payload.alternateMobileNumber) { setStatus(statusEl, "All fields required.", "error"); return; }
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(payload.alternateMobileNumber)) { setStatus(statusEl, "Valid 10-digit mobile number required.", "error"); return; }
            } else if (code === 3) {
                payload.chassis = dropdowns.estChassis.getValue();
                payload.estimatedDisbursement = inputs[3].estimatedDisbursement.value.trim();
                if (!payload.chassis || !payload.estimatedDisbursement) { setStatus(statusEl, "All fields required.", "error"); return; }
            } else if (code === 4) {
                payload.advancerName = dropdowns.advName.getValue();
                payload.alternateMobileNumber = inputs[4].alternateMobileNumber.value.trim();
                if (!payload.advancerName || !payload.alternateMobileNumber) { setStatus(statusEl, "All fields required.", "error"); return; }
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(payload.alternateMobileNumber)) { setStatus(statusEl, "Valid 10-digit mobile number required.", "error"); return; }
            }

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("optionalFieldForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Updated successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Failed.", "error");
                    submitButton.disabled = false;
                }
            } catch (err) {
                setStatus(statusEl, "Network error.", "error");
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { OptionalFieldForm };
