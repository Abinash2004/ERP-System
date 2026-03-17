import { backendRequest } from "../../api/index.js";
import { createFormLayout, field, formActions, setStatus, setupFormValidation } from "../ui.js";

const NewWalkInForm = (() => {

    async function mount(container, session) {
        container.innerHTML = createFormLayout({
            id: "new-walk-in-form",
            title: "New Walk In",
            body: `
                ${field("Customer Name", '<input id="nwi-customer-name" class="ui-input" type="text" placeholder="Enter customer name" required />', { required: true })}
                ${field("Mobile Number", '<input id="nwi-mobile-number" class="ui-input" type="tel" maxlength="10" placeholder="Enter 10-digit mobile number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" required />', { required: true })}
                ${field("Alternate Mobile Number", '<input id="nwi-alt-mobile-number" class="ui-input" type="tel" maxlength="10" placeholder="Enter 10-digit alternate mobile number" oninput="this.value = this.value.replace(/[^0-9]/g, \"\")" />')}
                ${field("Address", '<input id="nwi-address" class="ui-input" type="text" placeholder="Enter address" />', { full: true })}
                ${field("Vehicle Details", '<input id="nwi-vehicle-details" class="ui-input" type="text" placeholder="Enter vehicle details" />', { full: true })}
                ${formActions("nwi-submit", "nwi-status")}
            `
        });

        const customerNameInput = container.querySelector("#nwi-customer-name");
        const mobileNumberInput = container.querySelector("#nwi-mobile-number");
        const altMobileNumberInput = container.querySelector("#nwi-alt-mobile-number");
        const addressInput = container.querySelector("#nwi-address");
        const vehicleDetailsInput = container.querySelector("#nwi-vehicle-details");
        const submitButton = container.querySelector("#nwi-submit");
        const statusEl = container.querySelector("#nwi-status");
        const form = container.querySelector("#new-walk-in-form");
        setupFormValidation(form);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(statusEl);

            const customerName = customerNameInput.value.trim();
            const mobileNumber = mobileNumberInput.value.trim();
            const alternateMobileNumber = altMobileNumberInput.value.trim();
            const address = addressInput.value.trim();
            const vehicleDetails = vehicleDetailsInput.value.trim();

            if (!customerName || !mobileNumber) {
                setStatus(statusEl, "Customer Name and Mobile Number are mandatory.", "error");
                return;
            }

            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(mobileNumber)) {
                setStatus(statusEl, "Please enter a valid 10-digit Mobile Number.", "error");
                return;
            }

            if (alternateMobileNumber && !phoneRegex.test(alternateMobileNumber)) {
                setStatus(statusEl, "Please enter a valid 10-digit Alternate Mobile Number.", "error");
                return;
            }

            const payload = {
                location: session.branch,
                customerName,
                mobileNumber,
                alternateMobileNumber,
                address,
                vehicleDetails
            };

            submitButton.disabled = true;
            setStatus(statusEl, "Submitting...", "info", true);

            try {
                const res = await backendRequest("newWalkInForm", payload);
                if (res.status === 1) {
                    setStatus(statusEl, "Submitted successfully. Refreshing...", "success");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatus(statusEl, res.message || "Submission failed.", "error");
                }
            } catch (err) {
                setStatus(statusEl, "Network error. Please try again.", "error");
                console.error("[newWalkIn]", err);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    return { mount };
})();

export { NewWalkInForm };
