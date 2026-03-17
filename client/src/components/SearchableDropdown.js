const SearchableDropdown = (() => {

    function mount(container, { options = [], placeholder = "Select...", onChange = null, required = false } = {}) {
        let currentOptions = [...options];
        let selectedValue = "";
        let isOpen = false;
        let highlightedIndex = -1;

        const wrapper = document.createElement("div");
        wrapper.className = "sd-wrapper";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = placeholder;
        input.autocomplete = "off";
        input.className = "sd-input";

        const proxyInput = document.createElement("input");
        proxyInput.type = "text";
        proxyInput.className = "ui-validation-proxy";
        proxyInput.tabIndex = -1;
        proxyInput.setAttribute("aria-hidden", "true");
        if (required) {
            proxyInput.classList.add("required-field");
        }

        const list = document.createElement("ul");
        list.className = "sd-list";

        wrapper.appendChild(input);
        wrapper.appendChild(proxyInput);
        wrapper.appendChild(list);
        container.appendChild(wrapper);

        function syncProxy(value) {
            proxyInput.value = value;
            proxyInput.dispatchEvent(new Event("input", { bubbles: true }));
            proxyInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        function getVisibleItems() {
            return Array.from(list.querySelectorAll("li:not(.sd-no-results)"));
        }

        function applyHighlight(index) {
            const items = getVisibleItems();
            items.forEach((li, i) => {
                li.classList.toggle("sd-highlighted", i === index);
            });
            if (index >= 0 && items[index]) {
                items[index].scrollIntoView({ block: "nearest" });
            }
        }

        function renderList(filter = "") {
            list.innerHTML = "";
            highlightedIndex = -1;

            const q = filter.trim().toLowerCase();
            const filtered = q
                ? currentOptions.filter(o => String(o).toLowerCase().includes(q))
                : currentOptions;

            if (filtered.length === 0) {
                const li = document.createElement("li");
                li.textContent = "No results";
                li.className = "sd-no-results";
                list.appendChild(li);
                return;
            }

            filtered.forEach(opt => {
                const li = document.createElement("li");
                li.textContent = opt;
                li.addEventListener("mouseenter", () => {
                    highlightedIndex = getVisibleItems().indexOf(li);
                    applyHighlight(highlightedIndex);
                });
                li.addEventListener("mousedown", (e) => {
                    e.preventDefault();
                    select(opt);
                });
                list.appendChild(li);
            });
        }

        function openList() {
            if (isOpen) return;
            isOpen = true;
            renderList(input.value);
            list.classList.add("sd-open");
        }

        function closeList() {
            if (!isOpen) return;
            isOpen = false;
            highlightedIndex = -1;
            list.classList.remove("sd-open");
            input.value = selectedValue;
        }

        function select(value) {
            selectedValue = value;
            input.value = value;
            syncProxy(value);
            closeList();
            if (typeof onChange === "function") onChange(value);
        }

        input.addEventListener("focus", openList);
        input.addEventListener("click", openList);

        input.addEventListener("input", () => {
            if (!isOpen) openList();
            else renderList(input.value);
        });

        input.addEventListener("blur", closeList);

        input.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") return;

            if (e.key === "Escape") {
                closeList();
                return;
            }

            if (!isOpen) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    openList();
                }
                return;
            }

            const items = getVisibleItems();

            if (e.key === "ArrowDown") {
                e.preventDefault();
                highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
                applyHighlight(highlightedIndex);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, 0);
                applyHighlight(highlightedIndex);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (highlightedIndex >= 0 && items[highlightedIndex]) {
                    select(items[highlightedIndex].textContent);
                }
            }
        });

        document.addEventListener("click", (e) => {
            if (!wrapper.contains(e.target)) closeList();
        });

        return {
            getValue() {
                return selectedValue;
            },
            setValue(value) {
                selectedValue = value;
                input.value = value;
                syncProxy(value);
            },
            setOptions(newOptions) {
                currentOptions = [...newOptions];
                selectedValue = "";
                input.value = "";
                syncProxy("");
                highlightedIndex = -1;
                if (isOpen) renderList();
            }
        };
    }

    return { mount };
})();

export { SearchableDropdown };
