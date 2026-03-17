import { backendRequest } from "../../api/index.js";
import { SearchableDropdown } from "../SearchableDropdown.js";
import { createFormLayout, field, formActions, setStatus } from "../ui.js";

const CHASSIS_COL = 13;

const AddRegistrationForm = (() => {

    async function mount(container, session) {
        let chassisDropdown = null;

        container.innerHTML = createFormLayout({
            id: "add-registration-form",
            title: "Add Registration Form",
            body: `
                ${field("Chassis Number", '<div id="ar-chassis-container"></div>', { required: true })}
                ${field("Registration Number", '<input id="ar-registration-number" class="ui-input" type="text" placeholder="Enter registration number" />', { required: true })}
                ${formActions("ar-submit", "ar-status")}
            `
        });

        const registrationInput = container.querySelector("#ar-registration-number");
        const submitButton = container.querySelector("#ar-submit");
        const statusEl = container.querySelector("#ar-status");
        const form = container.querySelector("#add-registration-form");

        chassisDropdown = SearchableDropdown.mount(container.querySelector("#ar-chassis-container"), {
            options: [],
            placeholder: "Select chassis number..."
        });

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
            const registrationNumber = registrationInput.value.trim();

            if (!chassis || !registrationNumber) {
                setStatus(statusEl, "Both fields are required.", "error");
                return;
            }

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting registration...", "info", true);

            try {
                const res = await backendRequest("addRegistrationForm", {
                    chassis,
                    registrationNumber
                });

                if (res.status === 1) {
                    setStatus(statusEl, "Registration added successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Failed to add registration.", "error");
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

export { AddRegistrationForm };
