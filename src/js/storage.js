// Warstwa localStorage: stan listy i trwały zapis.
import { validateTicketSet } from "./tickets.js";

export const STORAGE_KEY = "tickets";

let tickets = [];

export class StorageError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = "StorageError";
        this.cause = cause;
    }
}

export function getTickets() {
    return tickets;
}

function writeTickets(nextTickets) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTickets));
    } catch (error) {
        throw new StorageError(
            "Nie udało się zapisać zgłoszeń w localStorage. Dane pozostają tylko w pamięci.",
            error
        );
    }
}

export function loadTickets() {
    tickets = [];

    let raw;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        throw new StorageError("Nie udało się odczytać danych z localStorage.", error);
    }

    if (raw === null) return [];

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error(
            "Zapisane zgłoszenia są uszkodzone (nieprawidłowy JSON). " +
            "Zapis w localStorage nie został usunięty."
        );
    }

    try {
        tickets = validateTicketSet(parsed);
    } catch (error) {
        throw new Error(
            `Zapisane zgłoszenia są nieprawidłowe: ${error.message} ` +
            "Zapis w localStorage nie został usunięty."
        );
    }

    return tickets;
}

export function commitTickets(nextTickets) {
    const cleanTickets = validateTicketSet(nextTickets);
    tickets = cleanTickets;
    writeTickets(cleanTickets);
    return cleanTickets;
}

export function replaceTickets(nextTickets) {
    const cleanTickets = validateTicketSet(nextTickets);
    writeTickets(cleanTickets);
    tickets = cleanTickets;
    return cleanTickets;
}
