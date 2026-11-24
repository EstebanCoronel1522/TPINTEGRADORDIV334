window.createProductAutocomplete = async (inputId, optionsId) => {
    const input = document.getElementById(inputId);
    const optionsContainer = document.getElementById(optionsId);
    const status = document.getElementById("productSearchStatus");

    if (!input || !optionsContainer) {
        throw new Error("No se encontró el campo de búsqueda de productos");
    }

    const response = await fetch(`${window.location.origin}/api/products`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los productos");
    }

    const products = data.payload.map((product) => ({
        id: product.id,
        label: `${product.name} (ID: ${product.id})`,
        name: product.name
    }));
    const productIds = new Map(products.map((product) => [product.label, product.id]));

    const hideOptions = () => {
        optionsContainer.hidden = true;
        input.setAttribute("aria-expanded", "false");
    };

    const selectProduct = (product) => {
        input.value = product.label;
        input.setCustomValidity("");
        hideOptions();
    };

    const renderOptions = () => {
        const query = input.value.trim().toLocaleLowerCase();
        const matches = query
            ? products.filter((product) => product.label.toLocaleLowerCase().includes(query)).slice(0, 20)
            : [];

        optionsContainer.replaceChildren();
        for (const product of matches) {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "product-search-option";
            option.setAttribute("role", "option");
            option.textContent = product.label;
            option.addEventListener("click", () => selectProduct(product));
            optionsContainer.appendChild(option);
        }

        optionsContainer.hidden = matches.length === 0;
        input.setAttribute("aria-expanded", String(!optionsContainer.hidden));
    };

    input.addEventListener("input", () => {
        input.setCustomValidity(
            !input.value || productIds.has(input.value)
                ? ""
                : "Selecciona un producto de las sugerencias."
        );
        renderOptions();
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" && !optionsContainer.hidden) {
            event.preventDefault();
            optionsContainer.querySelector("button")?.focus();
        } else if (event.key === "Escape") {
            hideOptions();
        }
    });

    input.parentElement.addEventListener("focusout", (event) => {
        if (!input.parentElement.contains(event.relatedTarget)) {
            hideOptions();
        }
    });

    optionsContainer.addEventListener("pointerdown", (event) => {
        if (event.target instanceof HTMLButtonElement) {
            event.preventDefault();
        }
    });

    optionsContainer.addEventListener("keydown", (event) => {
        const options = Array.from(optionsContainer.querySelectorAll("button"));
        const currentIndex = options.indexOf(event.target);

        if (event.key === "ArrowDown" && currentIndex < options.length - 1) {
            event.preventDefault();
            options[currentIndex + 1].focus();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (currentIndex > 0) {
                options[currentIndex - 1].focus();
            } else {
                input.focus();
            }
        } else if (event.key === "Escape") {
            hideOptions();
            input.focus();
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (!input.parentElement.contains(event.target)) {
            hideOptions();
        }
    });

    if (status) {
        status.textContent = "Escribe el nombre del producto y selecciónalo de las sugerencias.";
    }

    return {
        getSelectedId: () => productIds.get(input.value) ?? null
    };
};
