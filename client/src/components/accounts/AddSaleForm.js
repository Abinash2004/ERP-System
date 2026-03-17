import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, createOption, field, formActions, setStatus } from "../ui.js";

const CHASSIS_COL = 10;
const COUNTER_COL = 3;
const CASH_FINANCE_COL = 5;
const SALES_PERSON_COL = 4;

const AddSaleForm = (() => {

    async function mount(container, session) {
        let chassisDropdown = null;
        let counterDropdown = null;
        let cashFinanceDropdown = null;
        let salesPersonDropdown = null;

        container.innerHTML = createFormLayout({
            id: "add-sale-form",
            title: "Add Sale Form",
            body: `
                ${field("Chassis Number", '<div id="as-chassis-container"></div>', { required: true })}
                ${field("Model", '<input id="as-model" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-filled" />')}
                ${field("Color", '<input id="as-color" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-filled" />')}
                ${field("Sale Counter", '<div id="as-counter-container"></div>', { required: true })}
                ${field("Stock Status", `<select id="as-stock-status" class="ui-select">${createOption("B2C", "B2C", true)}${createOption("RETURN", "RETURN")}</select>`, { required: true })}
                ${field("Sale Date", '<input id="as-date" class="ui-input" type="date" />', { required: true })}
                ${field("Customer Name", '<input id="as-customer-name" class="ui-input" type="text" placeholder="Enter customer name" />', { required: true })}
                <div id="as-b2c-fields" class="b2c-only b2c-visible">
                    ${field("Mobile Number", '<input id="as-mobile" class="ui-input" type="tel" maxlength="10" placeholder="10-digit number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" />', { required: true })}
                    ${field("Alternate Mobile Number", '<input id="as-alt-mobile" class="ui-input" type="tel" maxlength="10" placeholder="10-digit number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" />')}
                    ${field("Cash / Finance", '<div id="as-cash-finance-container"></div>', { required: true })}
                    ${field("Financer", '<input id="as-financer" class="ui-input" type="text" placeholder="Enter financer name" />', { required: true })}
                </div>
                ${field("Sales Person", '<div id="as-sales-person-container"></div>', { required: true })}
                ${formActions("as-submit", "as-status")}
            `
        });

        const modelInput = container.querySelector("#as-model");
        const colorInput = container.querySelector("#as-color");
        const statusSelect = container.querySelector("#as-stock-status");
        const dateInput = container.querySelector("#as-date");
        const nameInput = container.querySelector("#as-customer-name");
        const mobileInput = container.querySelector("#as-mobile");
        const altMobileInput = container.querySelector("#as-alt-mobile");
        const financerInput = container.querySelector("#as-financer");
        const b2cFields = container.querySelector("#as-b2c-fields");
        const submitButton = container.querySelector("#as-submit");
        const statusEl = container.querySelector("#as-status");
        const form = container.querySelector("#add-sale-form");

        chassisDropdown = SearchableDropdown.mount(container.querySelector("#as-chassis-container"), {
            options: [],
            placeholder: "Select chassis number...",
            onChange: async (val) => {
                if (!val) {
                    modelInput.value = "";
                    colorInput.value = "";
                    return;
                }

                modelInput.value = "Fetching...";
                colorInput.value = "Fetching...";
                setStatus(statusEl, "Fetching chassis details...", "info", true);

                try {
                    const res = await backendRequest("getChassis", val);
                    if (res.status === 1 && res.data) {
                        modelInput.value = res.data.model || "N/A";
                        colorInput.value = res.data.color || "N/A";
                        setStatus(statusEl);
                    } else {
                        modelInput.value = "Not Found";
                        colorInput.value = "Not Found";
                        setStatus(statusEl, "Chassis details not found.", "error");
                    }
                } catch (err) {
                    modelInput.value = "Error";
                    colorInput.value = "Error";
                    setStatus(statusEl, "Error fetching chassis details.", "error");
                }
            }
        });

        counterDropdown = SearchableDropdown.mount(container.querySelector("#as-counter-container"), {
            options: [],
            placeholder: "Select sale counter..."
        });

        cashFinanceDropdown = SearchableDropdown.mount(container.querySelector("#as-cash-finance-container"), {
            options: [],
            placeholder: "Select cash/finance..."
        });

        salesPersonDropdown = SearchableDropdown.mount(container.querySelector("#as-sales-person-container"), {
            options: [],
            placeholder: "Select sales person..."
        });

        function syncB2cFields() {
            if (statusSelect.value === "B2C") {
                b2cFields.classList.add("b2c-visible");
            } else {
                b2cFields.classList.remove("b2c-visible");
            }
        }

        statusSelect.addEventListener("change", syncB2cFields);
        syncB2cFields();

        setStatus(statusEl, "Fetching dropdown values...", "info", true);

        try {
            const [chassisRes, counterRes, cashRes, personRes] = await Promise.all([
                backendRequest("getDropdown", CHASSIS_COL),
                backendRequest("getDropdown", COUNTER_COL),
                backendRequest("getDropdown", CASH_FINANCE_COL),
                backendRequest("getDropdown", SALES_PERSON_COL)
            ]);

            if (chassisRes.status === 1) chassisDropdown.setOptions(chassisRes.data);
            if (counterRes.status === 1) counterDropdown.setOptions(counterRes.data);
            if (cashRes.status === 1) cashFinanceDropdown.setOptions(cashRes.data);
            if (personRes.status === 1) salesPersonDropdown.setOptions(personRes.data);

            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error fetching dropdown values.", "error");
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const chassis = chassisDropdown.getValue();
            const saleCounter = counterDropdown.getValue();
            const stockStatus = statusSelect.value;
            const saleDate = dateInput.value;
            const customerName = nameInput.value.trim();
            const salesPerson = salesPersonDropdown.getValue();

            if (!chassis || !saleCounter || !stockStatus || !saleDate || !customerName || !salesPerson) {
                setStatus(statusEl, "All mandatory fields (*) are required.", "error");
                return;
            }

            const mobile = mobileInput.value.trim();
            const altMobile = altMobileInput.value.trim();
            const cashOrFinance = cashFinanceDropdown.getValue();
            const financer = financerInput.value.trim();

            if (stockStatus === "B2C") {
                if (!mobile || !cashOrFinance || !financer) {
                    setStatus(statusEl, "B2C mandatory fields are required.", "error");
                    return;
                }
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(mobile)) {
                    setStatus(statusEl, "Valid 10-digit mobile number required.", "error");
                    return;
                }
                if (altMobile && !phoneRegex.test(altMobile)) {
                    setStatus(statusEl, "Valid 10-digit alternate mobile required.", "error");
                    return;
                }
            }

            const payload = {
                chassis,
                saleCounter,
                stockStatus,
                saleDate,
                customerName,
                salesPerson,
                mobileNumber: mobile,
                alternate_mobile_number: altMobile,
                cashOrFinance,
                financer
            };

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting Sale...", "info", true);

            try {
                const res = await backendRequest("addSaleForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Sale added successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Try again.", "error");
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { AddSaleForm };
