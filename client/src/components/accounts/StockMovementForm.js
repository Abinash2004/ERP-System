import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const CHASSIS_COL = 10;
const COUNTER_COL = 3;

const StockMovementForm = (() => {

    async function mount(container, session) {
        let chassisDropdown = null;
        let counterDropdown = null;

        container.innerHTML = createFormLayout({
            id: "stock-movement-form",
            title: "Stock Movement Form",
            body: `
                ${field("Chassis Number", '<div id="sm-chassis-container"></div>', { required: true })}
                ${field("New Counter", '<div id="sm-counter-container"></div>', { required: true })}
                ${formActions("sm-submit", "sm-status")}
            `
        });

        const submitButton = container.querySelector("#sm-submit");
        const statusEl = container.querySelector("#sm-status");
        const form = container.querySelector("#stock-movement-form");

        chassisDropdown = SearchableDropdown.mount(container.querySelector("#sm-chassis-container"), {
            options: [],
            placeholder: "Select chassis number...",
            required: true
        });

        counterDropdown = SearchableDropdown.mount(container.querySelector("#sm-counter-container"), {
            options: [],
            placeholder: "Select counter...",
            required: true
        });

        setupFormValidation(form);

        setStatus(statusEl, "Fetching dropdown values...", "info", true);

        try {
            const [chassisRes, counterRes] = await Promise.all([
                backendRequest("getDropdown", CHASSIS_COL),
                backendRequest("getDropdown", COUNTER_COL)
            ]);

            if (chassisRes.status === 1) chassisDropdown.setOptions(chassisRes.data);
            if (counterRes.status === 1) counterDropdown.setOptions(counterRes.data);

            setStatus(statusEl);
        } catch (err) {
            setStatus(statusEl, "Error fetching dropdown values.", "error");
            console.error("[getDropdown]", err);
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusEl);

            const chassis = chassisDropdown.getValue();
            const counter = counterDropdown.getValue();

            if (!chassis || !counter) {
                setStatus(statusEl, "All fields are mandatory.", "error");
                return;
            }

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("stockMovementForm", { chassis, counter });
                if (res.status === 1) {
                    setStatus(statusEl, "Stock moved successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                console.error("[stockMovementForm]", err);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { StockMovementForm };
