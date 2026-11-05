const priorities = ["low", "normal", "high"];
const statuses = ["new", "doing", "testing", "done"];
const priorityLabels = { low: "Niski", normal: "Średni", high: "Wysoki" };
const statusLabels = { new: "Nowe", doing: "W Realizacji", testing: "W Testach", done: "Ukończone" };

let nextId = 1;

const form = document.querySelector("#ticketForm");
const titleInput = document.querySelector("#title");
const formMessage = document.querySelector("#formMessage");
const filter = document.querySelector("#statusFilter");
const sort = document.querySelector("#prioritySorter");
const list = document.querySelector("#ticketList");
const counter = document.querySelector("#ticketCounter");
const emptyMessage = document.querySelector("#emptyMessage");

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
