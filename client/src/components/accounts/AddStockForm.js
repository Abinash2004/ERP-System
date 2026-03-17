import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const MODEL_COL = 1;
const COLOR_COL = 2;
const COUNTER_COL = 3;

const AddStockForm = (() => {

    async function mount(container, session) {
        let modelDropdown = null;
        let colorDropdown = null;
        let counterDropdown = null;

        container.innerHTML = createFormLayout({
            id: "add-stock-form",
            title: "Add Stock Form",
            body: `
                ${field("Chassis Number", '<input id="as-chassis" class="ui-input" type="text" placeholder="Enter chassis number" required />', { required: true })}
                ${field("Engine Number", '<input id="as-engine" class="ui-input" type="text" placeholder="Enter engine number" required />', { required: true })}
                ${field("Model", '<div id="as-model-container"></div>', { required: true })}
                ${field("Color", '<div id="as-color-container"></div>', { required: true })}
                ${field("Current Counter", '<div id="as-counter-container"></div>', { required: true })}
                ${field("Key Number", '<input id="as-key" class="ui-input" type="text" placeholder="Enter key number" />')}
                ${formActions("as-submit", "as-status")}
            `
        });

        const chassisInput = container.querySelector("#as-chassis");
        const engineInput = container.querySelector("#as-engine");
        const keyInput = container.querySelector("#as-key");
        const submitButton = container.querySelector("#as-submit");
        const statusEl = container.querySelector("#as-status");
        const form = container.querySelector("#add-stock-form");

        modelDropdown = SearchableDropdown.mount(container.querySelector("#as-model-container"), {
            options: [],
            placeholder: "Select model...",
            required: true
        });

        colorDropdown = SearchableDropdown.mount(container.querySelector("#as-color-container"), {
            options: [],
            placeholder: "Select color...",
            required: true
        });

        counterDropdown = SearchableDropdown.mount(container.querySelector("#as-counter-container"), {
            options: [],
            placeholder: "Select counter...",
            required: true
        });

        setupFormValidation(form);

        setStatus(statusEl, "Fetching dropdown values...", "info", true);

        try {
            const [modelRes, colorRes, counterRes] = await Promise.all([
                backendRequest("getDropdown", MODEL_COL),
                backendRequest("getDropdown", COLOR_COL),
                backendRequest("getDropdown", COUNTER_COL)
            ]);

            if (modelRes.status === 1) modelDropdown.setOptions(modelRes.data);
            if (colorRes.status === 1) colorDropdown.setOptions(colorRes.data);
            if (counterRes.status === 1) counterDropdown.setOptions(counterRes.data);

            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error fetching dropdown values.", "error");
            console.error("[getDropdown]", err);
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusEl);

            const chassis = chassisInput.value.trim();
            const engine = engineInput.value.trim();
            const model = modelDropdown.getValue();
            const color = colorDropdown.getValue();
            const counter = counterDropdown.getValue();
            const key = keyInput.value.trim();

            if (!chassis || !engine || !model || !color || !counter) {
                setStatus(statusEl, "All mandatory fields (*) are required.", "error");
                return;
            }

            const payload = { chassis, engine, model, color, counter, key };

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("addStockForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Stock added successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                console.error("[addStockForm]", err);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { AddStockForm };
