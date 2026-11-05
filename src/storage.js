// localStorage implementation

const form = document.querySelector("#ticketForm");
const titleInput = document.querySelector("#title");
const formMessage = document.querySelector("#formMessage");
const filter = document.querySelector("#statusFilter");
const sort = document.querySelector("#prioritySorter");
const list = document.querySelector("#ticketList");
const counter = document.querySelector("#ticketCounter");
const emptyMessage = document.querySelector("#emptyMessage");

const priorities = ["low", "normal", "high"];
const statuses = ["new", "doing", "testing", "done"];
const priorityLabels = { low: "Niski", normal: "Średni", high: "Wysoki" };
const statusLabels = { new: "Nowe", doing: "W Realizacji", testing: "W Testach", done: "Ukończone" };
let tickets = [];
let nextId = 1;