# C04 JS Async - Helpdesk implementation plan

This document is the implementation plan only. No source file is changed by it.
Two people work in parallel against the contracts in section 2.

---

## 1. Current baseline (why this plan is needed)

| File | Current problem | Required direction |
| --- | --- | --- |
| `src/index.html` | Loads five classic scripts, not ES modules. Paths (`main.js`, `storage.js`, ...) are wrong because files live in `src/js/`. No import UI. | One `<script type="module" src="./js/main.js">`. Add file/fetch import controls. |
| `src/js/main.js` | Uses `tickets`, `addTicket`, `renderTickets`, etc. without imports. Has top-level `await renderTickets()`. Submit handler does not save. | Module entry point. Import all dependencies. No top-level await. Wire add/delete/status/import. |
| `src/js/tickets.js` | Every function is `async` although none awaits anything. Uses undefined `priorities` / `statuses`. `saveTicket()` writes an undeclared `tickets`. `validateTicketSet` is missing. | Pure synchronous rules. Export shared constants. Add a full validator. Delete `saveTicket`. |
| `src/js/storage.js` | Imports missing `validateTicketSet`. `commitTickets` and `replaceTickets` have different ordering but are not wired to UI. | Own the in-memory list. `loadTickets`, `commitTickets`, `replaceTickets`, `StorageError`. |
| `src/js/ui.js` | No imports. Uses undefined DOM/ticket globals. Calls `changeStatus` instead of `changeTicket`. `renderTickets` / `createTicketRow` are `async` with no `await`. | Synchronous DOM rendering. Import storage/rules. Add busy-state and message helpers. |
| `src/js/import.js` | `JSON.parse(file, "[]")` is wrong: the second argument is a reviver, not a default value, and `file` is not text. | File/fetch adapters plus one `importFrom(load)` orchestrator. |
| `src/js/globals.js` | `export const NextID = 1` can never be incremented. `Tickets` is an unused object. | Delete the file and all references. State belongs to `storage.js`. |

---

## 2. Contract to agree on before coding

### 2.1 Data model

```js
// One ticket, exactly four fields after validation:
{
  id: string,        // trimmed, non-empty, max 100 chars, unique in the list
  title: string,     // trimmed, 3..80 chars
  priority: "low" | "normal" | "high",
  status: "new" | "doing" | "testing" | "done"
}

// The list:
// - always an Array
// - max 1000 tickets
// - no duplicate id values
```

Shared fixtures for testing:

```json
[
  { "id": "1", "title": "Drukarka nie działa", "priority": "high", "status": "new" },
  { "id": "2", "title": "Reset hasła", "priority": "normal", "status": "doing" },
  { "id": "3", "title": "Nowy monitor", "priority": "low", "status": "done" }
]
```

### 2.2 Module exports (exact names)

| File | Exports |
| --- | --- |
| `src/js/tickets.js` | `PRIORITIES`, `STATUSES`, `PRIORITY_LABELS`, `STATUS_LABELS`, `MAX_TICKETS`, `validateTicketSet`, `addTicket`, `deleteTicket`, `changeTicket`, `nextTicketId` |
| `src/js/storage.js` | `STORAGE_KEY`, `StorageError`, `getTickets`, `loadTickets`, `commitTickets`, `replaceTickets` |
| `src/js/import.js` | `isImportInProgress`, `loadFromFile`, `loadFromUrl`, `importFrom` |
| `src/js/ui.js` | `renderTickets`, `createTicketRow`, `setBusy`, `showFormMessage`, `showImportMessage` |
| `src/js/main.js` | No exports. It is the only side-effect entry module. |
| `src/js/globals.js` | Deleted. |

No module may read or write a global variable. The only shared list state is the
private `tickets` array inside `storage.js`. Every relative import must include the
`.js` extension (for example `import { getTickets } from "./storage.js";`), because
the browser does not resolve extensionless module specifiers.

### 2.3 HTML IDs that must remain stable

Existing: `#ticketForm`, `#title`, `#add`, `#formMessage`, `#statusFilter`,
`#prioritySorter`, `#ticketList`, `#ticketCounter`, `#emptyMessage`.

New for import:

```html
<input type="file" id="importFile" accept=".json,application/json">
<button type="button" id="importUrl">Importuj tickets.json</button>
<p id="importMessage" role="status" aria-live="polite"></p>
```

The fetch URL is one constant in `main.js`:

```js
const TICKETS_URL = "./data/tickets.json";
```

`src/data/tickets.json` must exist and contain a valid array. `index.html` lives in
`src/`, so `./data/tickets.json` resolves to `src/data/tickets.json`.

---

## 3. Exact async/sync decisions

This is the most important part. Do not mark a function `async` just because the
project is about promises. `async` is only for functions that actually wait for an
asynchronous API and whose result/error must be observed by a caller.

### 3.1 Functions that MUST be `async`

| Function | File | What it awaits | Why it is async |
| --- | --- | --- | --- |
| `loadFromFile(file)` | `import.js` | `await file.text()` | `File.text()` returns `Promise<string>`. |
| `loadFromUrl(url)` | `import.js` | `await fetch(url, ...)`, then `await response.text()` | `fetch` and `Response.text()` return promises. |
| `importFrom(load, options)` | `import.js` | `await load()` | The read adapter is asynchronous. It also owns the busy lock and must release it in `finally`. |
| `handleFileImport(event)` | `main.js` | `await importFrom(...)` | Event handler must wait for the whole import before rendering the result. |
| `handleUrlImport()` | `main.js` | `await importFrom(...)` | Same as above. |

Exact signatures:

```js
export async function loadFromFile(file)
export async function loadFromUrl(url)
export async function importFrom(load, { confirmMessage, onBusyChange } = {})
async function handleFileImport(event)
async function handleUrlImport()
```

An `async` function always returns a Promise. A thrown error becomes a rejected
promise. Therefore every call site must `await` it inside `try/catch`; otherwise the
error becomes an unhandled rejection and the user sees no message.

### 3.2 Functions that MUST stay synchronous

Remove the existing `async` keyword from these. None of them performs I/O.

| Function | File | Why sync |
| --- | --- | --- |
| `validateTicketSet(value)` | `tickets.js` | Pure validation. `JSON.parse` already happened. It returns a new normalized array or throws. |
| `addTicket(currentTickets, ticket)` | `tickets.js` | Pure array operation. |
| `deleteTicket(currentTickets, id)` | `tickets.js` | Pure array operation. |
| `changeTicket(currentTickets, id, status)` | `tickets.js` | Pure array operation. |
| `nextTicketId(currentTickets)` | `tickets.js` | Pure calculation. |
| `loadTickets()` | `storage.js` | `localStorage.getItem` is synchronous. |
| `commitTickets(nextTickets)` | `storage.js` | `localStorage.setItem` is synchronous. |
| `replaceTickets(nextTickets)` | `storage.js` | `localStorage.setItem` is synchronous. |
| `parseJSONText(text, source)` (private) | `import.js` | `JSON.parse` is synchronous. |
| `renderTickets()` | `ui.js` | DOM only. Remove the existing `async`. |
| `createTicketRow(ticket)` | `ui.js` | DOM only. Remove the existing `async`. |
| `setBusy(value)` | `ui.js` | DOM attributes only. |
| `showFormMessage(...)` / `showImportMessage(...)` | `ui.js` | DOM text only. |
| `handleSubmit(event)` | `main.js` | Add + persist are synchronous. Do not make it async. |
| `handleDelete` / status-change handlers | `ui.js` | Rules + localStorage are synchronous. |
| `init()` | `main.js` | Startup load + render are synchronous. |
| filter/sort/pageshow listeners | `main.js` | DOM only. |

Do not use top-level `await`. `main.js` should call `init()` and `renderTickets()`
without `await`.

### 3.3 What to delete

- Delete `src/js/globals.js` (`Tickets`, `NextID`). `NextID` cannot be updated
  because it is a `const`, and the ID must be derived from the current list.
- Delete `saveTicket()` from `tickets.js`; it writes an undeclared variable and
  duplicates storage responsibility.
- Delete all five classic `<script>` tags from `index.html`.
- Delete the `async` keywords listed in section 3.2.
- Delete `await renderTickets()` from `main.js`.

### 3.4 Where promises and `finally` are used

1. `loadFromFile`:
   - `const text = await file.text();`
   - then synchronous `parseJSONText(text, ...)`.
   - A read failure rejects the promise.

2. `loadFromUrl`:
   - `const response = await fetch(url, { cache: "no-store" });`
   - `fetch` does **not** reject on HTTP 404/500, so check `response.ok` and throw
     `Error("HTTP " + response.status)` manually.
   - `const text = await response.text();`
   - Detect HTML before parsing: reject `content-type: text/html` or a body whose
     first non-space character is `<`.
   - then synchronous `parseJSONText`.

3. `importFrom`:
   - `if (importInProgress) throw new Error("Import już trwa...")`.
   - Set `importInProgress = true`, then enter `try` and call
     `onBusyChange(true)` **before the first `await`**.
   - `try { onBusyChange(true); ... await load() ... } finally { importInProgress = false; onBusyChange(false); }`
   - `finally` must run for success, validation error, network error, storage error
     and user cancellation.
   - Use `replaceTickets(...)`, never `commitTickets(...)`, so an import failure
     keeps the previous list.

4. `handleFileImport` / `handleUrlImport`:
   - `try { const result = await importFrom(...); ... }`
   - `catch (error) { showImportMessage(error.message, true); renderTickets(); }`
   - file handler `finally { input.value = ""; }` so the same file can be selected
     again and so a cancelled import cleans up.
   - Do not rethrow after displaying the message.

5. Do **not** use `new Promise(...)` to wrap synchronous code, and do not add fake
   `setTimeout` delays. `File.text()` already returns a promise, so no `FileReader`
   wrapper is needed.

6. `window.confirm` is synchronous. Do not `await` it. Confirmation happens inside
   `importFrom`; it is not a promise.

### 3.5 Exact import flow

```
User selects a file / clicks import URL
  -> handleFileImport / handleUrlImport (async)
     -> showImportMessage("")
     -> await importFrom(adapter, { onBusyChange: setBusy })
        -> if importInProgress: throw "Import już trwa"
        -> importInProgress = true
        -> onBusyChange(true)                  // synchronously disables controls
        -> window.confirm(confirmMessage)      // synchronous
           -> false: return { status: "cancelled" }
        -> await adapter()
           -> await file.text() / fetch + response.text()
           -> JSON.parse (sync)
        -> replaceTickets(rawImport)           // validates, writes storage, then memory
        -> return { status: "imported", tickets }
        -> finally: importInProgress = false; onBusyChange(false)
     -> success: renderTickets(); showImportMessage("Zaimportowano N ...")
     -> cancel:  showImportMessage("Import anulowany.")
     -> error:   showImportMessage(error.message, true); renderTickets()
     -> finally: reset <input type="file">.value
```

The busy flag is set before `await` because `await` yields control to the event
loop. Without that, a second click could start a second import while the first
request is pending.

### 3.6 `commitTickets` vs `replaceTickets` (do not mix them)

The two functions have deliberately different ordering:

```js
// Normal edit: add / delete / change status.
// A storage failure must NOT lose the new in-memory state; warn the user.
export function commitTickets(nextTickets) {
  const clean = validateTicketSet(nextTickets);
  tickets = clean;             // memory first
  writeTickets(clean);         // may throw StorageError; memory keeps `clean`
  return clean;
}

// Import: all-or-nothing.
// If storage fails, keep both the previous memory list and the previous storage.
export function replaceTickets(nextTickets) {
  const clean = validateTicketSet(nextTickets);
  writeTickets(clean);         // storage first; may throw before any state change
  tickets = clean;             // only after a successful write
  return clean;
}
```

Exact failure behavior:

| Failure point | In-memory list | `localStorage` | UI requirement |
| --- | --- | --- | --- |
| Validation of a normal add/delete/status | previous | previous | Show validation error. |
| `localStorage.setItem` in `commitTickets` | **new** | previous | Show warning; render new list. It works until refresh. |
| File read / parse / validation during import | previous | previous | Show error; keep rendered previous list. |
| `localStorage.setItem` in `replaceTickets` | previous | previous | Show error; keep rendered previous list. |
| User cancels confirmation | previous | previous | "Import anulowany"; controls re-enabled. |
| `localStorage.getItem` throws at startup | `[]` | unchanged | Show error; app still usable. |
| Corrupt JSON in storage at startup | `[]` | corrupt text **not deleted** | Show error; key stays until the next successful save overwrites it. |

Every caller of `commitTickets` must catch `StorageError` separately, because the
in-memory state has already changed when that error is thrown:

```js
let warning = "";
try {
  commitTickets(next);
} catch (error) {
  if (!(error instanceof StorageError)) throw error; // validation: no state change
  warning = error.message;                          // storage: state already changed
}
renderTickets();
showFormMessage(warning || "Zapisano.", Boolean(warning));
```

---

## 4. Work split between two people

### Person A - data, rules, storage, async import

Branch: `feature/a-data-import`

Owned files:

- `src/js/tickets.js`
- `src/js/storage.js`
- `src/js/import.js`
- `src/data/tickets.json`

Do not edit `index.html`, `main.js` or `ui.js`. If a contract must change, agree
with Person B first and update section 2 in this file.

#### A1. `tickets.js` - shared constants

- Move `priorities`, `statuses`, `priorityLabels`, `statusLabels` from `main.js`
  into `tickets.js`.
- Export them as `PRIORITIES`, `STATUSES`, `PRIORITY_LABELS`, `STATUS_LABELS`.
- Add `MAX_TICKETS = 1000`.
- Use `Object.freeze` for the arrays/objects so no module mutates them.

Acceptance: no other module declares its own copy of these constants.

#### A2. `tickets.js` - `validateTicketSet(value)`

```js
export function validateTicketSet(value)
```

Required checks, in this order:

1. `Array.isArray(value)`; otherwise throw `"Dane muszą być tablicą zgłoszeń."`.
2. `value.length <= MAX_TICKETS`; otherwise throw the limit message.
3. For each element, with `index` used in the message (`Rekord ${index + 1}`):
   - not `null`; `typeof === "object"`; not an array;
   - `id` is a string; trim it; trimmed length is `1..100`;
   - the trimmed `id` is not already in a `Set` (duplicate check);
   - `title` is a string; `title.trim().length` is between 3 and 80;
   - `priority` is in `PRIORITIES`;
   - `status` is in `STATUSES`.
4. Return a **new** array with exactly four fields per ticket:
   `{ id: trimmedId, title: trimmedTitle, priority, status }`. Extra fields are
   stripped.
5. `[]` is valid and returns `[]`.
6. Throw before returning anything if any record is bad. This gives
   all-or-nothing validation.

Acceptance: a list with a bad last record throws and returns no partial array.

#### A3. `tickets.js` - synchronous rules

```js
export function addTicket(currentTickets, ticket)
export function deleteTicket(currentTickets, id)
export function changeTicket(currentTickets, id, status)
export function nextTicketId(currentTickets)
```

- `addTicket`: require `ticket.status === "new"`; append and return
  `validateTicketSet([...currentTickets, ticket])`. Validator catches duplicate IDs,
  the 1000 limit, bad title, priority and status.
- `deleteTicket`: return `currentTickets.filter(t => t.id !== id)`. No mutation.
- `changeTicket`: reject unknown status; reject missing ID; return a mapped new
  array. No mutation.
- `nextTicketId`: find the greatest numeric ID in the current list, return
  `String(max + 1)`; non-numeric IDs are ignored by the max calculation.
- Remove `saveTicket`.
- No imports, no DOM, no `localStorage`, no `async`.

Acceptance: calling any rule twice with the same inputs gives the same output; the
input array is never mutated.

#### A4. `storage.js` - state and load

```js
export const STORAGE_KEY = "tickets";
let tickets = [];

export function getTickets()        // return a copy: [...tickets]
export function loadTickets()
export function commitTickets(nextTickets)
export function replaceTickets(nextTickets)
export class StorageError extends Error { ... }
```

`loadTickets()`:

- `localStorage.getItem(STORAGE_KEY)` inside `try/catch`; on failure throw
  `StorageError` and keep current memory.
- `null` means empty list: set `tickets = []`, return `[]`, and do not throw.
- `JSON.parse` inside its own `try/catch`; on syntax error throw a descriptive
  `Error` that says the saved data is corrupt and the key was **not** deleted.
- Run `validateTicketSet(parsed)` before assigning `tickets`. On validation error
  leave `tickets` unchanged and the key untouched.
- Return the loaded array.

#### A5. `storage.js` - save

Private `writeTickets(nextTickets)`:

```js
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTickets));
} catch (error) {
  throw new StorageError("Nie udało się zapisać zgłoszeń w localStorage...", error);
}
```

Keep `commitTickets` memory-first and `replaceTickets` storage-first exactly as in
section 3.6. Do not replace one with the other.

#### A6. `import.js` - adapters

```js
function parseJSONText(text, source)          // sync private helper
export async function loadFromFile(file)
export async function loadFromUrl(url)
```

- `parseJSONText`: strip a leading BOM, reject empty text, `JSON.parse` in
  `try/catch`, wrap syntax errors with the source name.
- `loadFromFile`: reject a missing file; `await file.text()`; call
  `parseJSONText(text, \`Plik ${file.name}\`)`.
- `loadFromUrl`:
  - `await fetch(url, { cache: "no-store" })` inside `try/catch` for network errors;
  - `if (!response.ok) throw new Error(\`HTTP ${response.status}\`)`;
  - reject `text/html` content type and bodies starting with `<`;
  - `await response.text()`;
  - parse with the URL as the source name.
- Neither adapter touches the DOM or the ticket list.

Acceptance: a 404 rejects with an HTTP message; a 200 HTML response rejects with
"HTML zamiast JSON"; a valid JSON array resolves to the parsed value.

#### A7. `import.js` - `importFrom` and busy lock

```js
let importInProgress = false;
export function isImportInProgress()
export async function importFrom(load, {
  confirmMessage = "Czy zastąpić bieżącą listę zaimportowanymi zgłoszeniami?",
  onBusyChange = () => {}
} = {})
```

- Reject re-entry if `importInProgress`.
- Set the flag and call `onBusyChange(true)` before any `await`.
- Use `window.confirm`; on cancel return `{ status: "cancelled" }`.
- `const tickets = replaceTickets(await load());`
- Return `{ status: "imported", tickets }`.
- `finally` always resets the flag and calls `onBusyChange(false)`.
- No DOM access and no `renderTickets` call here; the caller decides how to render.

Acceptance: two simultaneous calls can never both reach `load`; cancellation and
all error paths re-enable the UI.

#### A8. `src/data/tickets.json`

Add a valid fixture array (2-3 tickets). This is the file fetched by
`main.js` through `TICKETS_URL`.

#### A9. Person A tests (browser console under Live Server, no Node/npm)

Use dynamic import for direct tests:

```js
const t = await import("./js/tickets.js");
t.validateTicketSet([{ id: "1", title: "Test", priority: "low", status: "new" }]);
```

Cover: valid list, non-array, `null`, duplicate ID, bad last record, >1000,
bad priority/status, title trim, `[]`, `nextTicketId`, corrupted storage,
storage write refusal, 404, HTML response, cancel, double call, slow fetch.

---

### Person B - HTML, rendering, event wiring

Branch: `feature/b-ui-main`

Owned files:

- `src/index.html`
- `src/js/ui.js`
- `src/js/main.js`
- delete `src/js/globals.js`

Do not edit `tickets.js`, `storage.js` or `import.js`. Code against the signatures
in section 2.2; if A has not merged yet, use the agreed signature, not a local copy.

#### B1. `index.html` - ES modules

Replace all five script tags:

```html
<script src="main.js" defer></script>
<script src="storage.js" defer></script>
<script src="tickets.js" defer></script>
<script src="ui.js" defer></script>
<script src="import.js" defer></script>
```

with exactly one module entry point:

```html
<script type="module" src="./js/main.js"></script>
```

`index.html` is in `src/`, so `./js/main.js` is `src/js/main.js`. Module scripts are
deferred automatically; no `defer` attribute is needed. The page must be opened
through Live Server (`http://...`), not `file://`, or module imports will be blocked
by CORS.

#### B2. `index.html` - import controls

Add a section under the "Nowe zgłoszenie" form:

- `#importFile`: `<input type="file" accept=".json,application/json">`
- `#importUrl`: `<button type="button">Importuj tickets.json</button>`
- `#importMessage`: `<p role="status" aria-live="polite">`
- Keep both import controls outside the form so they cannot submit it.
- Add `aria-live="polite"` / `role="status"` to `#formMessage` as well.
- Add `maxlength="80"` to `#title` as a hint (the validator remains authoritative).

Acceptance: page loads only one JS request for `main.js`; all transitive modules load
with 200, no 404; no `globals.js` request.

#### B3. `ui.js` - imports and shared references

```js
import { getTickets, commitTickets, StorageError } from "./storage.js";
import {
  PRIORITIES, STATUSES, PRIORITY_LABELS, STATUS_LABELS,
  deleteTicket, changeTicket
} from "./tickets.js";
```

Remove all references to undeclared `tickets`, `priorities`, `statuses`, `filter`,
`sort`, `list`, etc. Query the DOM inside this module or import helpers; do not
depend on `main.js` globals.

#### B4. `ui.js` - rendering (synchronous)

`renderTickets()`:

- `const tickets = getTickets();`
- filter by checked status checkboxes (`new Set` of values);
- sort by priority (`htl`/`lth`) or by ID;
- default numeric sort must not produce `NaN`: if both IDs are finite numbers compare
  them, otherwise use `String(a.id).localeCompare(String(b.id), "pl", { numeric: true })`;
- `list.replaceChildren(...visible.map(createTicketRow));`
- update `#ticketCounter` and `#emptyMessage`.
- No `async`, no `await`, no return value needed.

`createTicketRow(ticket)`:

- Build the same `li`, description, delete button and status select as now.
- Delete button: if busy, return; call `commitTickets(deleteTicket(getTickets(), ticket.id))`;
  catch `StorageError` as a warning (state already changed); finally `renderTickets()`.
- Status select: same pattern with `changeTicket(getTickets(), ticket.id, select.value)`.
- Do not focus `filter.querySelector("input")` after a status change.
- Set `delbtn.disabled = busy` and `select.disabled = busy` when creating a row.
- No `async`.

#### B5. `ui.js` - busy state and messages

```js
let busy = false;
export function setBusy(value)
export function showFormMessage(text, isError = false)
export function showImportMessage(text, isError = false)
```

`setBusy(value)` must:

- store `busy = value`;
- disable/enable every interactive control:
  `#ticketForm input`, `#ticketForm button`, `#ticketList button`,
  `#ticketList select`, `#importFile`, `#importUrl`, `#statusFilter input`,
  `#prioritySorter`;
- set `#ticketList` `aria-busy` to `"true"`/`"false"`;
- when `true`, show `"Import trwa..."` in `#importMessage`.
- New rows created while busy must start disabled (check `busy` in
  `createTicketRow`).

The message helpers use `textContent` only. Add/remove a Bootstrap class such as
`text-danger` for errors; never use `innerHTML`.

#### B6. `main.js` - module wiring and initialization

Imports:

```js
import { loadTickets, getTickets, commitTickets, StorageError } from "./storage.js";
import { addTicket, nextTicketId } from "./tickets.js";
import { renderTickets, setBusy, showFormMessage, showImportMessage } from "./ui.js";
import { loadFromFile, loadFromUrl, importFrom, isImportInProgress } from "./import.js";
```

`init()` (synchronous):

```js
function init() {
  try {
    loadTickets();
  } catch (error) {
    showFormMessage(error.message, true); // empty list, storage key not removed
  }
  renderTickets();
}
```

- Call `init()` at the end; do not use top-level `await`.
- Wire `#ticketForm` submit, filter/sort changes, import file/URL, and `pageshow`.
- `pageshow`: reset filter checkboxes to `defaultChecked`, reset sort to index 0,
  then `renderTickets()`. Do not skip bfcache with an early return if you want a
  fresh render; at minimum keep the reset.

#### B7. `main.js` - add ticket handler (synchronous, no `async`)

```js
function handleSubmit(event) {
  event.preventDefault();
  if (isImportInProgress()) {
    showFormMessage("Trwa import. Poczekaj na jego zakończenie.", true);
    return;
  }

  const priority = form.querySelector('input[name="Priorytet"]:checked');
  const candidate = {
    id: nextTicketId(getTickets()),
    title: titleInput.value,
    priority: priority?.value ?? "",
    status: "new"
  };

  let next;
  try {
    next = addTicket(getTickets(), candidate);
  } catch (error) {
    showFormMessage(error.message, true);
    if (titleInput.value.trim().length < 3 || titleInput.value.trim().length > 80) {
      titleInput.setAttribute("aria-invalid", "true");
    }
    titleInput.focus();
    return;
  }

  let warning = "";
  try {
    commitTickets(next);
  } catch (error) {
    if (!(error instanceof StorageError)) {
      showFormMessage(error.message, true); // validation: memory not changed
      return;
    }
    warning = error.message;                // storage: memory already changed
  }

  titleInput.value = "";
  titleInput.removeAttribute("aria-invalid");
  renderTickets();
  showFormMessage(warning || "Dodano zgłoszenie.", Boolean(warning));
  titleInput.focus();
}
```

- Do not `await` anything in this handler.
- `nextTicketId` prevents ID reuse after imports with numeric IDs.

#### B8. `main.js` - import handlers (async)

`handleFileImport(event)`:

```js
async function handleFileImport(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  showImportMessage("");
  try {
    const result = await importFrom(() => loadFromFile(file), {
      onBusyChange: setBusy
    });
    if (result.status === "cancelled") {
      showImportMessage("Import anulowany.");
    } else {
      renderTickets();
      showImportMessage(`Zaimportowano ${result.tickets.length} zgłoszeń.`);
    }
  } catch (error) {
    showImportMessage(error.message, true);
    renderTickets(); // replaceTickets keeps the previous list on every error
  } finally {
    input.value = "";
  }
}
```

`handleUrlImport()` is the same, using `() => loadFromUrl(TICKETS_URL)`, no file
input reset.

Acceptance: confirmation cancel keeps list and storage; bad file/404/HTML keeps
list and storage; success replaces the list; `[]` empties it; double click starts
only one import; controls are disabled before the first `await` and re-enabled in
`finally`.

#### B9. Delete `globals.js`

- `git rm src/js/globals.js`.
- Remove all references/imports.
- Confirm `#` no longer appears in module graph and no file declares `NextID`.

#### B10. Person B tests (UI)

- Add ticket, delete ticket, change status; refresh after each and verify persistence.
- Corrupt storage, reload, verify error and empty list; add a valid ticket and verify
  the corrupt value is overwritten.
- Import valid file, invalid JSON, `{}`, `[]`, duplicate IDs, bad last record.
- Import URL valid, 404, HTML response, network offline.
- Cancel confirmation.
- Double click import with network throttled.
- Verify all controls disabled during a slow import and re-enabled after success,
  error and cancellation.
- Verify filter/sort/counter/empty message and the `pageshow` reset.

---

## 5. Implementation order (parallel)

### Phase 0 - together (before writing code)

- Agree on section 2 (data model, exports, IDs, error behavior).
- Agree to the `commitTickets` vs `replaceTickets` split (section 3.6).
- Create the two branches; do not merge directly to `master` without review.
- Put the shared fixture contents in `src/data/tickets.json` (Person A owns it).

### Phase 1 - parallel

- Person A: A1-A5 (`tickets.js` + `storage.js`).
- Person B: B1-B2 (`index.html` module entry + import UI).

Checkpoint: both branches build/load without 404. Person B can merge the HTML
skeleton; Person A can expose the storage contract.

### Phase 2 - parallel

- Person A: A6-A8 (`import.js` + `tickets.json` fixture).
- Person B: B3-B8 (`ui.js` + `main.js`).

Checkpoint: end-to-end add/refresh works before import is wired.

### Phase 3 - integration

- Merge Person A, then Person B (or vice versa; files do not overlap).
- Run the test matrix in section 6.
- Person A reviews `ui.js`/`main.js`; Person B reviews `tickets.js`/`storage.js`/
  `import.js`.
- Reproduce at least one failure before fixing it, then rerun the same input.

### Phase 4 - optional only after all base tests pass

- Export JSON (easy), CSV (medium), XML (hard).
- CSV/XML import adapters reuse `importFrom` and `validateTicketSet`; the only new
  code is a synchronous parser plus an async file-text read.
- Styling and extra UI polish.

---

## 6. Acceptance test matrix

| # | Case | Action | Expected list / storage | Owner |
| --- | --- | --- | --- | --- |
| 1 | Read after refresh | Add, change status, delete, reload | Same list and storage after each reload | B |
| 2 | Save refusal, normal edit | Override `Storage.prototype.setItem` to throw; add ticket | New ticket visible; warning; storage unchanged; reload loses it | A + B |
| 3 | Bad JSON in storage | `localStorage.setItem("tickets", "{bad")`; reload | Error message; empty list; key still `{bad`; next valid add overwrites key | A + B |
| 4 | Import `[]` | Confirm import of `[]` | Empty list; storage `"[]"`; message 0 | B |
| 5 | Duplicate | Import two records with the same `id` | Error; previous list and storage unchanged | A |
| 6 | Bad last record | Valid records followed by one bad record | Error; no partial import; previous list and storage unchanged | A |
| 7 | 404 | Fetch a missing JSON URL | `HTTP 404`; previous list unchanged | A |
| 8 | HTML instead of JSON | Fetch `/index.html` | HTML/JSON error; previous list unchanged | A |
| 9 | Cancelled confirmation | Click Cancel | List/storage unchanged; controls enabled; file input reset | B |
| 10 | Double click | Throttle network; click import twice | One confirmation/one request; second blocked; controls disabled | B |
| 11 | Slow network | Throttle fetch | Busy state visible for whole request; released after success/error | B |
| 12 | Import storage refusal | Override `setItem`; import | Error; previous list and storage unchanged; controls enabled | A + B |
| 13 | Empty/whitespace file | Import empty text | Parse error; previous list unchanged | A |
| 14 | Non-array JSON | Import `{}` | Validation error; previous list unchanged | A |
| 15 | Over limit | Import 1001 valid records | Limit error; previous list unchanged | A |
| 16 | Non-numeric IDs | Import IDs `"a"`, `"b"` and render | No `NaN` comparator; stable order | B |
| 17 | Module loading | Open DevTools Network, hard reload | Only `main.js` entry and its imports; no 404; no classic scripts | B |

Storage-failure simulation (DevTools console):

```js
const original = Storage.prototype.setItem;
Storage.prototype.setItem = () => {
  throw new DOMException("Quota exceeded", "QuotaExceededError");
};
// run the UI test, then restore:
Storage.prototype.setItem = original;
```

---

## 7. Definition of done

- [ ] ES modules: one `<script type="module" src="./js/main.js">`; no globals.
- [ ] `tickets.js` is pure and synchronous; no `async` without `await`.
- [ ] `storage.js` owns the only mutable list; load/save/commit/replace implemented.
- [ ] `localStorage` key `"tickets"`; missing key means empty list; corrupt key is
      reported and not deleted automatically.
- [ ] File JSON import: confirmation, busy lock, `file.text()`, parse, validate,
      commit, render.
- [ ] Fetch JSON import: `response.ok`, HTML detection, parse, validate, commit,
      render.
- [ ] Import replaces the list only after confirmation and full validation.
- [ ] Any import error keeps the previous list and previous storage.
- [ ] During import, add/delete/status changes and further imports are blocked.
- [ ] `try/finally` releases the busy lock on success, error and cancellation.
- [ ] Double click starts only one import.
- [ ] Refresh preserves valid data; save refusal warns without losing the current
      in-memory state.
- [ ] All cases in section 6 pass under Live Server.
- [ ] No Node.js/npm used.
- [ ] Optional export/CSV/XML work starts only after the base is green.
