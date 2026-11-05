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

