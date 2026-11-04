# C04_JS_ASYNC - Mechanizmy, przydatne koncepty i konstrukcje

- **ESM**: 
    - `export` udostępnia nazwę 
    - `import` pobiera ją z pliku
    - w kodzie HTML tag `<script>`  ma atrybut `type=module`
    - ścieżka `./domain.js` jest względna wobec importującego pliku
    - moduły uruchamiamy przez HTTP:
        - Live Server jedynie dostarcza pliki
        - reguły nadal wykonuje przeglądarka

Przykład spoza domeny collaba:

```js
// measurements.js
export function mean(values) {
  if (!values.length) throw Error('Brak pomiarów');
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
```

- JSON jest formatem tekstowym, nie zapisem dowolnego kodu JS
- `parse` sprawdza składnię, nie znaczenie danych
-  sprawdźcie:
    -  `Array.isArray` 
    - obiekty inne niż null
    -  pola
    - dozwolone wartości
    - unikalność ID
-  `set` zapamiętuje różne wartości; jego `size` można porównać z długością kolekcji

```js
async function loadMeasurements(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  const raw = await response.json();
  if (!Array.isArray(raw) || !raw.every(Number.isFinite)) throw Error('Złe pomiary');
  return raw;
}
```

- obiekt `Promise` reprezentuje przyszły wynik lub błąd
    - `async` zawsze zwraca `Promise`
    - `await` zawiesza dalszy ciąg tej funkcji, a UI może odbierać kolejne zdarzenia (dlatego `busy` trzeba ustawić przed `await`)
    - `finally` zwalnia blokadę również po błędzie
    - `404` nie odrzuca automatycznie `fetch`; sprawdzamy `response.ok`
- `File.text()` odczytuje plik wybrany kontrolką bez wysyłania go na serwer
- `Storage` przechowuje tekst
- `getItem` daje `null` przy braku klucza
- `stringify` i `parse` służą do przejścia między tablicą a tekstem
- Odczyt i zapis mogą rzucić wyjątek. 
- Błąd zapisu pozostawia dane w pamięci i wymaga ostrzeżenia. 
- Uszkodzony zapis nie jest automatycznie kasowany przy starcie
    - w tej prostej wersji następna świadoma poprawna zmiana go zastąpi
- Origin obejmuje protokół, host i port.

### Dodatkowe źródła

- [korzystanie z asynchronicznych callbacków]([https://www.w3schools.com/js/js_async_callbacks.asp)
- [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Promise](https://www.w3schools.com/js/js_async_promises.asp)
