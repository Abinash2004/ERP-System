import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus } from "../ui.js";

const COUNTER_COL = 3;
const RECEIVER_COL = 4;
const MODEL_COL = 1;
const COLOR_COL = 2;

const AdvanceReceiveForm = (() => {

    async function mount(container, session) {
        let counterDropdown = null;
        let receiverDropdown = null;
        let modelDropdown = null;
        let colorDropdown = null;

        container.innerHTML = createFormLayout({
            id: "advance-receive-form",
            title: "Advance Receive Form",
            body: `
                ${field("Advancer Name", '<input id="ar-advancer-name" class="ui-input" type="text" placeholder="Enter advancer name" />', { required: true })}
                ${field("Mobile Number", '<input id="ar-mobile" class="ui-input" type="tel" maxlength="10" placeholder="Enter 10-digit mobile number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" />', { required: true })}
                ${field("Alternate Mobile Number", '<input id="ar-alt-mobile" class="ui-input" type="tel" maxlength="10" placeholder="Enter 10-digit alternate mobile number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" />')}
                ${field("Amount", '<input id="ar-amount" class="ui-input" type="number" min="0" placeholder="Enter amount" />', { required: true })}
                ${field("Counter", '<div id="ar-counter-container"></div>', { required: true })}
                ${field("Receiver Name", '<div id="ar-receiver-container"></div>', { required: true })}
                ${field("Model", '<div id="ar-model-container"></div>', { required: true })}
                ${field("Color", '<div id="ar-color-container"></div>')}
                ${field("Remark", '<textarea id="ar-remark" class="ui-textarea" placeholder="Enter remark" rows="4"></textarea>', { full: true })}
                ${formActions("ar-submit", "ar-status")}
            `
        });

        const nameInput = container.querySelector("#ar-advancer-name");
        const mobileInput = container.querySelector("#ar-mobile");
        const altMobileInput = container.querySelector("#ar-alt-mobile");
        const amountInput = container.querySelector("#ar-amount");
        const remarkInput = container.querySelector("#ar-remark");
        const submitButton = container.querySelector("#ar-submit");
        const statusEl = container.querySelector("#ar-status");
        const form = container.querySelector("#advance-receive-form");

        counterDropdown = SearchableDropdown.mount(container.querySelector("#ar-counter-container"), {
            options: [],
            placeholder: "Select counter..."
        });

        receiverDropdown = SearchableDropdown.mount(container.querySelector("#ar-receiver-container"), {
            options: [],
            placeholder: "Select receiver..."
        });

        modelDropdown = SearchableDropdown.mount(container.querySelector("#ar-model-container"), {
            options: [],
            placeholder: "Select model..."
        });

        colorDropdown = SearchableDropdown.mount(container.querySelector("#ar-color-container"), {
            options: [],
            placeholder: "Select color..."
        });

        setStatus(statusEl, "Fetching dropdown values...", "info", true);

        try {
            const [counterRes, receiverRes, modelRes, colorRes] = await Promise.all([
                backendRequest("getDropdown", COUNTER_COL),
                backendRequest("getDropdown", RECEIVER_COL),
                backendRequest("getDropdown", MODEL_COL),
                backendRequest("getDropdown", COLOR_COL)
            ]);

            if (counterRes.status === 1) counterDropdown.setOptions(counterRes.data);
            if (receiverRes.status === 1) receiverDropdown.setOptions(receiverRes.data);
            if (modelRes.status === 1) modelDropdown.setOptions(modelRes.data);
            if (colorRes.status === 1) colorDropdown.setOptions(colorRes.data);

            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error fetching dropdown values.", "error");
            console.error("[getDropdown]", err);
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusEl);

            const advancer_name = nameInput.value.trim();
            const mobile_number = mobileInput.value.trim();
            const alternate_mobile_number = altMobileInput.value.trim();
            const amount = amountInput.value.trim();
            const counter = counterDropdown.getValue();
            const receiver_name = receiverDropdown.getValue();
            const model = modelDropdown.getValue();
            const color = colorDropdown.getValue();
            const remark = remarkInput.value.trim();

            if (!advancer_name || !mobile_number || !amount || !counter || !receiver_name || !model) {
                setStatus(statusEl, "All mandatory fields (*) are required.", "error");
                return;
            }

            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(mobile_number)) {
                setStatus(statusEl, "Please enter a valid 10-digit Mobile Number.", "error");
                return;
            }

            if (alternate_mobile_number && !phoneRegex.test(alternate_mobile_number)) {
                setStatus(statusEl, "Please enter a valid 10-digit Alternate Mobile Number.", "error");
                return;
            }

            const payload = {
                advancer_name,
                mobile_number,
                alternate_mobile_number,
                amount: parseFloat(amount),
                counter,
                receiver_name,
                model,
                color,
                remark
            };

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("advanceReceiveForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Advance received successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                console.error("[advanceReceiveForm]", err);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { AdvanceReceiveForm };
