// localStorage implementation
let tickets = [];

function saveTickets() {
    localStorage.setItem("tickets", JSON.stringify(tickets))
}

function loadTickets() {
    tickets = JSON.parse(localStorage.getItem("tickets") || "[]")
}