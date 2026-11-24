const usersStatus = document.getElementById("usersStatus");
const usersList = document.getElementById("usersList");
const currentUserId = Number(document.getElementById("usersManagement").dataset.currentUserId);

function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

async function loadUsers(message) {
    usersStatus.textContent = message || "Cargando usuarios...";

    try {
        const response = await fetch("/api/users");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "No se pudieron cargar los usuarios");
        }

        usersList.replaceChildren();

        for (const user of data.payload) {
            const row = document.createElement("tr");
            const isAdmin = Number(user.is_admin) === 1;
            row.append(
                createCell(user.name),
                createCell(user.email),
                createCell(isAdmin ? "Administrador" : "Normal")
            );

            const actionCell = document.createElement("td");
            const actionButton = document.createElement("button");

            if (isAdmin && user.id === currentUserId) {
                actionButton.textContent = "Administrador actual";
                actionButton.disabled = true;
            } else {
                actionButton.textContent = isAdmin ? "Quitar administrador" : "Promover a administrador";
                actionButton.addEventListener("click", () => updateRole(user.id, isAdmin ? 0 : 1));
            }

            actionCell.appendChild(actionButton);
            row.appendChild(actionCell);
            usersList.appendChild(row);
        }

        usersStatus.textContent = message || `${data.payload.length} usuarios cargados.`;
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        usersStatus.textContent = error.message;
    }
}

async function updateRole(userId, isAdmin) {
    try {
        const response = await fetch(`/api/users/${userId}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_admin: isAdmin })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "No se pudo actualizar el rol");
        }

        await loadUsers(data.message);
    } catch (error) {
        console.error("Error al actualizar el rol:", error);
        usersStatus.textContent = error.message;
    }
}

loadUsers();
