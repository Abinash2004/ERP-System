import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, createOption, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const COLS = {
    ADV_REC: 18,
    ADV_RET: 19,
    DP: 20,
    INS: 21,
    RTO: 22,
    DISB: 23,
    EXCH: 24,
    CODE_26: 25,
    CODE_27: 26,
    CODE_28: 27
};

const VerifyTransactionForm = (() => {

    async function mount(container, session) {
        let dropdowns = {
            advRecName: null,
            advRecCode: null,
            advRetName: null,
            advRetCode: null,
            dpChassis: null,
            dpCode: null,
            insChassis: null,
            insCode: null,
            rtoChassis: null,
            rtoCode: null,
            disbChassis: null,
            disbCode: null,
            exchChassis: null,
            exchCode: null
        };

        container.innerHTML = createFormLayout({
            id: "verify-transaction-form",
            title: "Verify Transaction Form",
            body: `
                ${field("Transaction Field", `<select id="vtf-type" class="ui-select" required>${createOption("", "Select type...", true)}${createOption("1", "Advance Received")}${createOption("2", "Advance Returned")}${createOption("3", "Received Down Payment")}${createOption("4", "Insurance Amount")}${createOption("5", "RTO Amount")}${createOption("6", "Disbursement Amount")}${createOption("7", "Exchange Amount")}</select>`, { required: true, full: true })}
                <div id="vtf-section-1" class="vtf-section">
                    ${field("Advancer Name", '<div id="vtf-adv-rec-name"></div>', { required: true })}
                    ${field("Advance Received Amount", '<input id="vtf-adv-rec-amt" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Transaction Code", '<div id="vtf-adv-rec-code"></div>', { required: true })}
                </div>
                <div id="vtf-section-2" class="vtf-section">
                    ${field("Advancer Name", '<div id="vtf-adv-ret-name"></div>', { required: true })}
                    ${field("Advance Returned Amount", '<input id="vtf-adv-ret-amt" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Transaction Code", '<div id="vtf-adv-ret-code"></div>', { required: true })}
                </div>
                <div id="vtf-section-3" class="vtf-section">
                    ${field("Chassis Number", '<div id="vtf-dp-chassis"></div>', { required: true })}
                    ${field("Customer Name", '<input id="vtf-dp-cust" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Received Down Payment Amount", '<input id="vtf-dp-amt" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Transaction Code", '<div id="vtf-dp-code"></div>', { required: true })}
                </div>
                <div id="vtf-section-4" class="vtf-section">
                    ${field("Chassis Number", '<div id="vtf-ins-chassis"></div>', { required: true })}
                    ${field("Customer Name", '<input id="vtf-ins-cust" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Transaction Code", '<div id="vtf-ins-code"></div>', { required: true })}
                </div>
                <div id="vtf-section-5" class="vtf-section">
                    ${field("Chassis Number", '<div id="vtf-rto-chassis"></div>', { required: true })}
                    ${field("Customer Name", '<input id="vtf-rto-cust" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Transaction Code", '<div id="vtf-rto-code"></div>', { required: true })}
                </div>
                <div id="vtf-section-6" class="vtf-section">
                    ${field("Chassis Number", '<div id="vtf-disb-chassis"></div>', { required: true })}
                    ${field("Customer Name", '<input id="vtf-disb-cust" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Transaction Code", '<div id="vtf-disb-code"></div>', { required: true })}
                </div>
                <div id="vtf-section-7" class="vtf-section">
                    ${field("Chassis Number", '<div id="vtf-exch-chassis"></div>', { required: true })}
                    ${field("Customer Name", '<input id="vtf-exch-cust" class="ui-input ui-readonly" type="text" readonly placeholder="Auto-fetched" />')}
                    ${field("Transaction Code", '<div id="vtf-exch-code"></div>', { required: true })}
                </div>
                ${formActions("vtf-submit", "vtf-status", "Submit", true)}
            `
        });

        const typeSelect = container.querySelector("#vtf-type");
        const submitButton = container.querySelector("#vtf-submit");
        const statusEl = container.querySelector("#vtf-status");
        const form = container.querySelector("#verify-transaction-form");

        const sections = {};
        for (let i = 1; i <= 7; i++) sections[i] = container.querySelector(`#vtf-section-${i}`);

        async function fetchChassisData(val, custEl, amtEl = null) {
            if (!val) { custEl.value = ""; if (amtEl) amtEl.value = ""; return; }
            custEl.value = "Fetching...";
            if (amtEl) amtEl.value = "Fetching...";
            setStatus(statusEl, "Fetching chassis details...", "info", true);
            try {
                const res = await backendRequest("getChassis", val);
                if (res.status === 1) {
                    custEl.value = res.data.customer || "N/A";
                    if (amtEl) amtEl.value = res.data.receivedDP || "0";
                }
                setStatus(statusEl);
            } catch (e) {
                setStatus(statusEl, "Error fetching chassis details.", "error");
                console.error(e);
            }
        }

        async function fetchAdvancerData(val, amtEl, isReturn = false) {
            if (!val) { amtEl.value = ""; return; }
            amtEl.value = "Fetching...";
            setStatus(statusEl, "Fetching advance details...", "info", true);
            try {
                const res = await backendRequest("getAdvance", val);
                if (res.status === 1) {
                    amtEl.value = (isReturn ? res.data.returnAmount : res.data.amount) || "0";
                }
                setStatus(statusEl);
            } catch (e) {
                setStatus(statusEl, "Error fetching advance details.", "error");
                console.error(e);
            }
        }

        dropdowns.advRecName = SearchableDropdown.mount(container.querySelector("#vtf-adv-rec-name"), {
            placeholder: "Select advancer...",
            required: true,
            onChange: (val) => fetchAdvancerData(val, container.querySelector("#vtf-adv-rec-amt"))
        });
        dropdowns.advRecCode = SearchableDropdown.mount(container.querySelector("#vtf-adv-rec-code"), { placeholder: "Select code...", required: true });

        dropdowns.advRetName = SearchableDropdown.mount(container.querySelector("#vtf-adv-ret-name"), {
            placeholder: "Select advancer...",
            required: true,
            onChange: (val) => fetchAdvancerData(val, container.querySelector("#vtf-adv-ret-amt"), true)
        });
        dropdowns.advRetCode = SearchableDropdown.mount(container.querySelector("#vtf-adv-ret-code"), { placeholder: "Select code...", required: true });

        dropdowns.dpChassis = SearchableDropdown.mount(container.querySelector("#vtf-dp-chassis"), {
            placeholder: "Select chassis...",
            required: true,
            onChange: (val) => fetchChassisData(val, container.querySelector("#vtf-dp-cust"), container.querySelector("#vtf-dp-amt"))
        });
        dropdowns.dpCode = SearchableDropdown.mount(container.querySelector("#vtf-dp-code"), { placeholder: "Select code...", required: true });

        dropdowns.insChassis = SearchableDropdown.mount(container.querySelector("#vtf-ins-chassis"), {
            placeholder: "Select chassis...",
            required: true,
            onChange: (val) => fetchChassisData(val, container.querySelector("#vtf-ins-cust"))
        });
        dropdowns.insCode = SearchableDropdown.mount(container.querySelector("#vtf-ins-code"), { placeholder: "Select code...", required: true });

        dropdowns.rtoChassis = SearchableDropdown.mount(container.querySelector("#vtf-rto-chassis"), {
            placeholder: "Select chassis...",
            required: true,
            onChange: (val) => fetchChassisData(val, container.querySelector("#vtf-rto-cust"))
        });
        dropdowns.rtoCode = SearchableDropdown.mount(container.querySelector("#vtf-rto-code"), { placeholder: "Select code...", required: true });

        dropdowns.disbChassis = SearchableDropdown.mount(container.querySelector("#vtf-disb-chassis"), {
            placeholder: "Select chassis...",
            required: true,
            onChange: (val) => fetchChassisData(val, container.querySelector("#vtf-disb-cust"))
        });
        dropdowns.disbCode = SearchableDropdown.mount(container.querySelector("#vtf-disb-code"), { placeholder: "Select code...", required: true });

        dropdowns.exchChassis = SearchableDropdown.mount(container.querySelector("#vtf-exch-chassis"), {
            placeholder: "Select chassis...",
            required: true,
            onChange: (val) => fetchChassisData(val, container.querySelector("#vtf-exch-cust"))
        });
        dropdowns.exchCode = SearchableDropdown.mount(container.querySelector("#vtf-exch-code"), { placeholder: "Select code...", required: true });

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
            const results = await Promise.all([
                backendRequest("getDropdown", COLS.ADV_REC),
                backendRequest("getDropdown", COLS.ADV_RET),
                backendRequest("getDropdown", COLS.CODE_26),
                backendRequest("getDropdown", COLS.DP),
                backendRequest("getDropdown", COLS.INS),
                backendRequest("getDropdown", COLS.RTO),
                backendRequest("getDropdown", COLS.DISB),
                backendRequest("getDropdown", COLS.CODE_27),
                backendRequest("getDropdown", COLS.EXCH),
                backendRequest("getDropdown", COLS.CODE_28)
            ]);

            if (results[0].status === 1) dropdowns.advRecName.setOptions(results[0].data);
            if (results[1].status === 1) dropdowns.advRetName.setOptions(results[1].data);
            if (results[2].status === 1) {
                dropdowns.advRecCode.setOptions(results[2].data);
                dropdowns.dpCode.setOptions(results[2].data);
                dropdowns.exchCode.setOptions(results[2].data);
            }
            if (results[3].status === 1) dropdowns.dpChassis.setOptions(results[3].data);
            if (results[4].status === 1) dropdowns.insChassis.setOptions(results[4].data);
            if (results[5].status === 1) dropdowns.rtoChassis.setOptions(results[5].data);
            if (results[6].status === 1) dropdowns.disbChassis.setOptions(results[6].data);
            if (results[7].status === 1) {
                dropdowns.advRetCode.setOptions(results[7].data);
                dropdowns.insCode.setOptions(results[7].data);
                dropdowns.rtoCode.setOptions(results[7].data);
            }
            if (results[8].status === 1) dropdowns.exchChassis.setOptions(results[8].data);
            if (results[9].status === 1) dropdowns.disbCode.setOptions(results[9].data);

            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error loading initial data.", "error");
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const code = parseInt(typeSelect.value);
            let payload = { code };

            const config = {
                1: { key: "advancerName", dd: dropdowns.advRecName, codeKey: "receivedTransactionCode", codeDD: dropdowns.advRecCode },
                2: { key: "advancerName", dd: dropdowns.advRetName, codeKey: "returnedTransactionCode", codeDD: dropdowns.advRetCode },
                3: { key: "chassis", dd: dropdowns.dpChassis, codeKey: "dpTransactionCode", codeDD: dropdowns.dpCode },
                4: { key: "chassis", dd: dropdowns.insChassis, codeKey: "insuranceTransactionCode", codeDD: dropdowns.insCode },
                5: { key: "chassis", dd: dropdowns.rtoChassis, codeKey: "rtoTransactionCode", codeDD: dropdowns.rtoCode },
                6: { key: "chassis", dd: dropdowns.disbChassis, codeKey: "disbursementTransactionCode", codeDD: dropdowns.disbCode },
                7: { key: "chassis", dd: dropdowns.exchChassis, codeKey: "exchangeTransactionCode", codeDD: dropdowns.exchCode }
            };

            const c = config[code];
            if (!c) {
                setStatus(statusEl, "All fields required.", "error");
                return;
            }
            payload[c.key] = c.dd.getValue();
            payload[c.codeKey] = c.codeDD.getValue();

            if (!payload[c.key] || !payload[c.codeKey]) {
                setStatus(statusEl, "All fields required.", "error");
                return;
            }

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("verifyTransactionForm", payload);
                if (res.status !== 1) {
                    setStatus(statusEl, res.message || "Failed.", "error");
                    submitButton.disabled = false;
                    return;
                }

                setStatus(statusEl, "Updated successfully. Refreshing...", "success");
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                setStatus(statusEl, "Network error.", "error");
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { VerifyTransactionForm };
