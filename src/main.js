

const priorities = ["low", "normal", "high"];
const statuses = ["new", "doing", "testing", "done"];
const priorityLabels = { low: "Niski", normal: "Średni", high: "Wysoki" };
const statusLabels = { new: "Nowe", doing: "W Realizacji", testing: "W Testach", done: "Ukończone" };
let tickets = [];
let nextId = 1;

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

const form = document.querySelector("#ticketForm");
const titleInput = document.querySelector("#title");
const formMessage = document.querySelector("#formMessage");
const filter = document.querySelector("#statusFilter");
const sort = document.querySelector("#prioritySorter");
const list = document.querySelector("#ticketList");
const counter = document.querySelector("#ticketCounter");
const emptyMessage = document.querySelector("#emptyMessage");

function createTicketRow(ticket) {
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
