import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const CASH_IN_COL = 7;
const CASH_OUT_COL = 8;

const ACTION_OPTIONS = ["CASH IN", "CASH OUT"];

const DailyTransactionForm = (() => {

    async function mount(container, session) {
        let openingBalance = 0;
        let currentAction = "";
        const leisureCache = {};
        let actionDropdown = null;
        let leisureDropdown = null;

        container.innerHTML = createFormLayout({
            id: "daily-transaction-form",
            title: "Daily Transaction",
            body: `
                ${field("Opening Balance", '<input id="dt-opening-balance" class="ui-input ui-readonly" type="text" readonly value="Loading..." />', { full: true })}
                ${field("Action", '<div id="dt-action-container"></div>', { required: true })}
                ${field("Cash Leisure", '<div id="dt-leisure-container"></div>', { required: true })}
                ${field("Amount", '<input id="dt-amount" class="ui-input" type="number" min="0" placeholder="Enter amount" required />', { required: true })}
                ${field("Remark", '<textarea id="dt-remark" class="ui-textarea" placeholder="Enter remark" rows="4" required></textarea>', { required: true, full: true })}
                ${formActions("dt-submit", "dt-status")}
            `
        });

        const openingBalanceInput = container.querySelector("#dt-opening-balance");
        const actionContainer = container.querySelector("#dt-action-container");
        const leisureContainer = container.querySelector("#dt-leisure-container");
        const amountInput = container.querySelector("#dt-amount");
        const remarkInput = container.querySelector("#dt-remark");
        const submitButton = container.querySelector("#dt-submit");
        const statusEl = container.querySelector("#dt-status");
        const form = container.querySelector("#daily-transaction-form");

        actionDropdown = SearchableDropdown.mount(actionContainer, {
            options: ACTION_OPTIONS,
            placeholder: "Select action...",
            onChange: handleActionChange,
            required: true
        });

        leisureDropdown = SearchableDropdown.mount(leisureContainer, {
            options: [],
            placeholder: "Select leisure...",
            required: true
        });

        setupFormValidation(form);

        setStatus(statusEl, "Fetching balances and dropdowns...", "info", true);

        const [balanceRes, cashInRes, cashOutRes] = await Promise.allSettled([
            backendRequest("getOpeningBalance", { branch: session.branch }),
            backendRequest("getDropdown", CASH_IN_COL),
            backendRequest("getDropdown", CASH_OUT_COL)
        ]);

        if (balanceRes.status === "fulfilled" && balanceRes.value.status === 1) {
            openingBalance = balanceRes.value.openingBalance ?? 0;
            openingBalanceInput.value = openingBalance;
        } else {
            openingBalanceInput.value = "Error";
            console.error("[getOpeningBalance]", balanceRes.reason ?? balanceRes.value?.message);
        }

        if (cashInRes.status === "fulfilled" && cashInRes.value.status === 1) {
            leisureCache[CASH_IN_COL] = cashInRes.value.data;
            syncLeisureOptions();
        } else {
            console.error("[getDropdown col 7]", cashInRes.reason ?? cashInRes.value?.message);
        }

        if (cashOutRes.status === "fulfilled" && cashOutRes.value.status === 1) {
            leisureCache[CASH_OUT_COL] = cashOutRes.value.data;
            syncLeisureOptions();
        } else {
            console.error("[getDropdown col 8]", cashOutRes.reason ?? cashOutRes.value?.message);
        }

        setStatus(statusEl, balanceRes.status === "fulfilled" || cashInRes.status === "fulfilled" || cashOutRes.status === "fulfilled" ? "" : "Unable to load form data.", balanceRes.status === "fulfilled" || cashInRes.status === "fulfilled" || cashOutRes.status === "fulfilled" ? "" : "error");

        function handleActionChange(action) {
            currentAction = action;
            syncLeisureOptions();
        }

        function syncLeisureOptions() {
            if (!currentAction) {
                leisureDropdown.setOptions([]);
                return;
            }

            const col = currentAction === "CASH IN" ? CASH_IN_COL : CASH_OUT_COL;
            leisureDropdown.setOptions(leisureCache[col] ?? []);
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusEl);

            const action = actionDropdown.getValue();
            const cashLeisure = leisureDropdown.getValue();
            const amount = amountInput.value.trim();
            const remark = remarkInput.value.trim();

            if (!action || !cashLeisure || !amount || !remark) {
                setStatus(statusEl, "All fields are required.", "error");
                return;
            }

            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount < 0) {
                setStatus(statusEl, "Amount must be a valid non-negative number.", "error");
                return;
            }

            const payload = {
                location: session.branch,
                openingBalance,
                cashIn: action === "CASH IN" ? numericAmount : 0,
                cashOut: action === "CASH OUT" ? numericAmount : 0,
                cashLeisure,
                remark
            };

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("dailyTransactionForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Submitted successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                console.error("[dailyTransaction]", err);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { DailyTransactionForm };
