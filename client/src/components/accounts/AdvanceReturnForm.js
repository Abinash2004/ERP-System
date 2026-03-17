import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const ADVANCER_COL = 9;
const RETURN_PERSON_COL = 4;

const AdvanceReturnForm = (() => {

    async function mount(container, session) {
        let advancerDropdown = null;
        let returnPersonDropdown = null;

        container.innerHTML = createFormLayout({
            id: "advance-return-form",
            title: "Advance Return Form",
            body: `
                ${field("Advancer Name", '<div id="at-advancer-container"></div>', { required: true })}
                ${field("Advance Return", '<input id="at-return-amount" class="ui-input" type="number" min="0" placeholder="Enter amount to return" required />', { required: true })}
                ${field("Return Person", '<div id="at-return-person-container"></div>', { required: true })}
                ${formActions("at-submit", "at-status")}
            `
        });

        const returnAmountInput = container.querySelector("#at-return-amount");
        const submitButton = container.querySelector("#at-submit");
        const statusEl = container.querySelector("#at-status");
        const form = container.querySelector("#advance-return-form");

        advancerDropdown = SearchableDropdown.mount(container.querySelector("#at-advancer-container"), {
            options: [],
            placeholder: "Select advancer name...",
            required: true
        });

        returnPersonDropdown = SearchableDropdown.mount(container.querySelector("#at-return-person-container"), {
            options: [],
            placeholder: "Select return person...",
            required: true
        });

        setupFormValidation(form);

        setStatus(statusEl, "Fetching dropdown values...", "info", true);

        try {
            const [advancerRes, personRes] = await Promise.all([
                backendRequest("getDropdown", ADVANCER_COL),
                backendRequest("getDropdown", RETURN_PERSON_COL)
            ]);

            if (advancerRes.status === 1) advancerDropdown.setOptions(advancerRes.data);
            if (personRes.status === 1) returnPersonDropdown.setOptions(personRes.data);

            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error fetching dropdown values.", "error");
            console.error("[getDropdown]", err);
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusEl);

            const advancer_name = advancerDropdown.getValue();
            const advance_return = returnAmountInput.value.trim();
            const return_person = returnPersonDropdown.getValue();

            if (!advancer_name || !advance_return || !return_person) {
                setStatus(statusEl, "All fields are mandatory.", "error");
                return;
            }

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("advanceReturnForm", {
                    advancer_name,
                    advance_return: parseFloat(advance_return),
                    return_person
                });
                if (res.status === 1) {
                    setStatus(statusEl, "Advance returned successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                console.error("[advanceReturnForm]", err);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { AdvanceReturnForm };
