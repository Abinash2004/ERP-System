import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, createOption, field, formActions, setStatus } from "../ui.js";

const CHASSIS_COL = 12;
const ADVANCER_COL = 9;

const AddSaleAccountForm = (() => {

    async function mount(container, session) {
        let chassisDropdown = null;
        let advancerDropdown = null;

        container.innerHTML = createFormLayout({
            id: "add-sale-account-form",
            title: "Add Sale Account Form",
            body: `
                ${field("Chassis Number", '<div id="asa-chassis-container"></div>', { required: true })}
                ${field("Customer Name", '<input id="asa-customer-name" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched on chassis selection" />')}
                ${field("Price Tag Number", '<input id="asa-price-tag" class="ui-input" type="text" placeholder="Enter price tag number" />', { required: true })}
                ${field("Total Down Payment", '<input id="asa-total-dp" class="ui-input" type="number" min="0" placeholder="0" />', { required: true })}
                ${field("Any Advance?", `<select id="asa-any-advance" class="ui-select">${createOption("NO", "NO", true)}${createOption("YES", "YES")}</select>`, { required: true })}
                <div id="asa-advance-section" class="conditional-section">
                    ${field("Advancer Name", '<div id="asa-advancer-container"></div>', { required: true })}
                    ${field("Advance Amount", '<input id="asa-advance-amount" class="ui-input ui-readonly" type="number" readonly placeholder="0" />')}
                </div>
                ${field("Any Exchange?", `<select id="asa-any-exchange" class="ui-select">${createOption("NO", "NO", true)}${createOption("YES", "YES")}</select>`, { required: true })}
                <div id="asa-exchange-section" class="conditional-section">
                    ${field("Exchange Model", '<input id="asa-ex-model" class="ui-input" type="text" placeholder="Enter exchange model" />', { required: true })}
                    ${field("Exchange Register Number", '<input id="asa-ex-reg" class="ui-input" type="text" placeholder="Enter registration number" />', { required: true })}
                    ${field("Customer Exchange Value", '<input id="asa-ex-cust-val" class="ui-input" type="number" min="0" placeholder="0" />', { required: true })}
                    ${field("Exchange Dealer", '<input id="asa-ex-dealer" class="ui-input" type="text" placeholder="Enter dealer name" />', { required: true })}
                    ${field("Dealer Exchange Value", '<input id="asa-ex-deal-val" class="ui-input" type="number" min="0" placeholder="0" />', { required: true })}
                </div>
                ${field("Customer On Road Price", '<input id="asa-customer-on-road-price" class="ui-input" type="number" min="0" placeholder="0" />', { required: true })}
                ${field("Estimated Disbursement", '<input id="asa-estimated-disbursement" class="ui-input" type="number" min="0" placeholder="0" />')}
                ${field("Received Down Payment", '<input id="asa-received-dp" class="ui-input" type="number" min="0" placeholder="0" />', { required: true })}
                ${field("Due Amount", '<input id="asa-due-amount" class="ui-input ui-readonly" type="number" readonly placeholder="0" />', { hint: 'Formula: Total DP - (Advance + Received DP + Cust Exchange Value)' })}
                ${formActions("asa-submit", "asa-status")}
            `
        });

        const priceTagInput = container.querySelector("#asa-price-tag");
        const customerNameInput = container.querySelector("#asa-customer-name");
        const totalDpInput = container.querySelector("#asa-total-dp");
        const anyAdvanceSelect = container.querySelector("#asa-any-advance");
        const advanceSection = container.querySelector("#asa-advance-section");
        const advanceAmountInput = container.querySelector("#asa-advance-amount");
        const anyExchangeSelect = container.querySelector("#asa-any-exchange");
        const exchangeSection = container.querySelector("#asa-exchange-section");
        const exModelInput = container.querySelector("#asa-ex-model");
        const exRegInput = container.querySelector("#asa-ex-reg");
        const exCustValInput = container.querySelector("#asa-ex-cust-val");
        const exDealerInput = container.querySelector("#asa-ex-dealer");
        const exDealValInput = container.querySelector("#asa-ex-deal-val");
        const receivedDpInput = container.querySelector("#asa-received-dp");
        const onRoadPriceInput = container.querySelector("#asa-customer-on-road-price");
        const estDisbursementInput = container.querySelector("#asa-estimated-disbursement");
        const dueAmountInput = container.querySelector("#asa-due-amount");
        const submitButton = container.querySelector("#asa-submit");
        const statusEl = container.querySelector("#asa-status");
        const form = container.querySelector("#add-sale-account-form");

        const updateDueAmount = () => {
            const total = parseFloat(totalDpInput.value) || 0;
            const advance = anyAdvanceSelect.value === "YES" ? (parseFloat(advanceAmountInput.value) || 0) : 0;
            const received = parseFloat(receivedDpInput.value) || 0;
            const exVal = anyExchangeSelect.value === "YES" ? (parseFloat(exCustValInput.value) || 0) : 0;

            const due = total - (advance + received + exVal);
            dueAmountInput.value = due;
        };

        totalDpInput.addEventListener("input", updateDueAmount);
        receivedDpInput.addEventListener("input", updateDueAmount);
        exCustValInput.addEventListener("input", updateDueAmount);

        anyAdvanceSelect.addEventListener("change", () => {
            if (anyAdvanceSelect.value === "YES") {
                advanceSection.classList.add("section-visible");
            } else {
                advanceSection.classList.remove("section-visible");
                advanceAmountInput.value = 0;
            }
            updateDueAmount();
        });

        anyExchangeSelect.addEventListener("change", () => {
            if (anyExchangeSelect.value === "YES") {
                exchangeSection.classList.add("section-visible");
            } else {
                exchangeSection.classList.remove("section-visible");
                exCustValInput.value = 0;
            }
            updateDueAmount();
        });

        chassisDropdown = SearchableDropdown.mount(container.querySelector("#asa-chassis-container"), {
            options: [],
            placeholder: "Select chassis number...",
            onChange: async (val) => {
                if (!val) {
                    customerNameInput.value = "";
                    return;
                }

                customerNameInput.value = "Fetching...";
                setStatus(statusEl, "Fetching customer details...", "info", true);

                try {
                    const res = await backendRequest("getChassis", val);
                    if (res.status === 1 && res.data) {
                        customerNameInput.value = res.data.customer || "N/A";
                        setStatus(statusEl);
                    } else {
                        customerNameInput.value = "Not Found";
                        setStatus(statusEl, "Chassis details not found.", "error");
                    }
                } catch (err) {
                    customerNameInput.value = "Error";
                    setStatus(statusEl, "Error fetching chassis details.", "error");
                }
            }
        });

        advancerDropdown = SearchableDropdown.mount(container.querySelector("#asa-advancer-container"), {
            options: [],
            placeholder: "Select advancer name...",
            onChange: async (val) => {
                if (!val) {
                    advanceAmountInput.value = 0;
                    updateDueAmount();
                    return;
                }
                advanceAmountInput.value = "";
                advanceAmountInput.placeholder = "Fetching...";
                setStatus(statusEl, "Fetching advance details...", "info", true);
                try {
                    const res = await backendRequest("getAdvance", val);
                    if (res.status === 1 && res.data) {
                        advanceAmountInput.value = res.data.amount || 0;
                        setStatus(statusEl);
                    } else {
                        advanceAmountInput.value = 0;
                        setStatus(statusEl, "Advancer not found or not active.", "error");
                    }
                } catch (err) {
                    advanceAmountInput.value = 0;
                    setStatus(statusEl, "Error fetching advance details.", "error");
                }
                updateDueAmount();
            }
        });

        setStatus(statusEl, "Fetching dropdown values...", "info", true);
        try {
            const [chassisRes, advancerRes] = await Promise.all([
                backendRequest("getDropdown", CHASSIS_COL),
                backendRequest("getDropdown", ADVANCER_COL)
            ]);

            if (chassisRes.status === 1) chassisDropdown.setOptions(chassisRes.data);
            if (advancerRes.status === 1) advancerDropdown.setOptions(advancerRes.data);

            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error fetching dropdown values.", "error");
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const chassis = chassisDropdown.getValue();
            const priceTagNumber = priceTagInput.value.trim();
            const totalDp = totalDpInput.value.trim();
            const anyAdvance = anyAdvanceSelect.value;
            const anyExchange = anyExchangeSelect.value;
            const receivedDp = receivedDpInput.value.trim();
            const customerOnRoadPrice = onRoadPriceInput.value.trim();

            if (!chassis || !priceTagNumber || !totalDp || !receivedDp || !customerOnRoadPrice) {
                setStatus(statusEl, "Mandatory fields (*) are required.", "error");
                return;
            }

            const payload = {
                chassis,
                priceTagNumber,
                totalDp: parseFloat(totalDp),
                anyAdvance,
                receivedDp: parseFloat(receivedDp),
                anyExchange,
                customerName: customerNameInput.value.trim(),
                customerOnRoadPrice: parseFloat(customerOnRoadPrice),
                estimatedDisbursement: parseFloat(estDisbursementInput.value) || 0
            };

            if (anyAdvance === "YES") {
                const advancerName = advancerDropdown.getValue();
                const advanceAmount = advanceAmountInput.value;
                if (!advancerName || !advanceAmount) {
                    setStatus(statusEl, "Advancer name is required for YES.", "error");
                    return;
                }
                payload.advancerName = advancerName;
                payload.advanceAmount = parseFloat(advanceAmount);
            }

            if (anyExchange === "YES") {
                const exModel = exModelInput.value.trim();
                const exReg = exRegInput.value.trim();
                const exCustVal = exCustValInput.value.trim();
                const exDealer = exDealerInput.value.trim();
                const exDealVal = exDealValInput.value.trim();

                if (!exModel || !exReg || !exCustVal || !exDealer || !exDealVal) {
                    setStatus(statusEl, "Exchange fields are required for YES.", "error");
                    return;
                }
                payload.exchangeModel = exModel;
                payload.exchangeRegisterNumber = exReg;
                payload.customerExchangeValue = parseFloat(exCustVal);
                payload.dealerName = exDealer;
                payload.dealerExchangeValue = parseFloat(exDealVal);
            }

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting Sale Account...", "info", true);

            try {
                const res = await backendRequest("addSaleAccountForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Sale Account added successfully. Refreshing...", "success");
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

export { AddSaleAccountForm };
