// ui logic

export async function renderTickets() {
    const selectedStatuses = new Set([...filter.querySelectorAll('input:checked')].map(input => input.value));
    const visible = tickets
        .filter(ticket => selectedStatuses.has(ticket.status))
        .sort((a, b) => {
            if (sort.value === "htl") {
                return priorities.indexOf(b.priority) - priorities.indexOf(a.priority);
            }
            if (sort.value === "lth") {
                return priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
            }
            return Number(a.id) - Number(b.id);
        });

    list.replaceChildren(...visible.map(createTicketRow));
    counter.textContent = `Widoczne: ${visible.length} / Wszystkie: ${tickets.length}`;
    emptyMessage.textContent = visible.length ? "" : "Brak zgłoszeń dla wybranego filtra.";
}

export async function createTicketRow(ticket) {
    const row = document.createElement("li");
    row.className = "list-group-item";

    const header = document.createElement("div");
    header.className = "d-flex justify-content-between align-items-center gap-3 mb-2";

    const description = document.createElement("span");
    description.className = "text-break";
    description.textContent = `#${ticket.id} — ${ticket.title} | Priorytet: ${priorityLabels[ticket.priority]}`;

    const delbtn = document.createElement("button");
    delbtn.className = "btn btn-danger flex-shrink-0";
    delbtn.textContent = "Usuń";
    delbtn.addEventListener("click", () => {
        tickets = deleteTicket(tickets, ticket.id);
        renderTickets();
    });

    header.append(description, delbtn);

    const label = document.createElement("label");
    label.className = "d-block";
    label.textContent = "Status: ";

    const select = document.createElement("select");
    select.className = "form-select form-select-sm mt-1";
    select.setAttribute("aria-label", `Status zgłoszenia ${ticket.id}: ${ticket.title}`);

    for (const status of statuses) {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = statusLabels[status];
        select.append(option);
    }

    select.value = ticket.status;

    select.addEventListener("change", () => {
        tickets = changeStatus(tickets, ticket.id, select.value);
        renderTickets();
        filter.querySelector("input").focus();
        formMessage.textContent = `Zmieniono status zgłoszenia #${ticket.id}.`;
    });

    label.append(select);
    row.append(header, label);

    return row;
}