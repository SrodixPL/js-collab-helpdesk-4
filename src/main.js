function addTicket(currentTickets, ticket) {
    if (typeof ticket.id !== "string" || !ticket.id.trim() || ticket.id.length > 100 ||
        currentTickets.some(item => item.id === ticket.id)) {
        throw new Error("Identyfikator zgłoszenia jest nieprawidłowy lub już istnieje.");
    }
    if (typeof ticket.title !== "string" || ticket.title.trim().length < 3 || ticket.title.trim().length > 80) {
        throw new Error("Tytuł musi mieć od 3 do 80 znaków po usunięciu spacji.");
    }
    if (!priorities.includes(ticket.priority) || ticket.status !== "new") {
        throw new Error("Nieprawidłowy priorytet lub status zgłoszenia.");
    }
    if (currentTickets.length >= 1000) throw new Error("Można dodać maksymalnie 1000 zgłoszeń.");
    return [...currentTickets, { ...ticket, title: ticket.title.trim() }];
}

function changeStatus(currentTickets, id, status) {
    if (!statuses.includes(status)) throw new Error("Nieprawidłowy status zgłoszenia.");
    if (!currentTickets.some(ticket => ticket.id === id)) throw new Error("Nie znaleziono zgłoszenia.");
    return currentTickets.map(ticket => ticket.id === id ? { ...ticket, status } : ticket);
}

function deleteTicket(currentTickets, id) {
    return currentTickets.filter(ticket => ticket.id !== id);
}
form.addEventListener("submit", event => {
    event.preventDefault();
    const priority = form.querySelector('input[name="Priorytet"]:checked');
    try {
        tickets = addTicket(tickets, {
            id: String(nextId), title: titleInput.value,
            priority: priority ? priority.value : "", status: "new"
        });
        nextId++;
        titleInput.value = "";
        titleInput.removeAttribute("aria-invalid");
        formMessage.textContent = "Dodano zgłoszenie.";
        renderTickets();
        titleInput.focus();
    } catch (error) {
        formMessage.textContent = error.message;
        if (titleInput.value.trim().length < 3 || titleInput.value.trim().length > 80) {
            titleInput.setAttribute("aria-invalid", "true");
            titleInput.focus();
        }
    }
});
filter.addEventListener("change", renderTickets);
sort.addEventListener("change", renderTickets)
renderTickets();

window.addEventListener("pageshow", event => {
    if (event.persisted) return;
    filter.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.checked = input.defaultChecked;
    });
    sort.selectedIndex = 0;
    renderTickets();
});
