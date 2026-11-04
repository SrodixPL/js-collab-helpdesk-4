# C04_JS_ASYNC - Prowadzenie krok po kroku

## Praca zespołu
W parze:

- A zaczyna reguły
- B interfejs

W trójce:

- A zaczyna reguły
- B interfejs
- C pisze próby i adapter danych


### Wytyczne

- **Najpierw uzgodnijcie wejście i wynik funkcji, aby pracować równolegle**. 

- \[sugestia\] Po pierwszym działającym przyroście (commicie) zamieńcie role; każdy pisze kod i przegląda zmianę partnera. 

- \[zalecenie\] Małe branche w istniejącym repo GitHub, małe commity, przegląd i integracja po każdym etapie. 

- Nie czekajcie z merge'owaniem branchy do końca collaba. 


## 1. Przejście na HTTP
- otwórzcie folder w VS Code
- zainstalujcie Live Server (autor: Ritwick Dey)
- kliknijcie `index.html → Open with Live Server`

**Sprawdźcie:**

- adres `http://`, nie `file://`
- sprawdźcie własny tickets.json w przeglądarce.

## 2. Moduły
- eksportujcie reguły `domain.js`
- importujcie w `app.js`
- HTML jeden tag `<script>` z atrybutem `type=module`

**Sprawdźcie:** 

- kod z C03 nadal działa
- ewentualne występowanie błędów `404`: najpewniej przyczyną będą niewłaściwe ścieżki

## 3. Walidator zbioru
- zwracacie nową kolekcję z czterema polami
- sprawdźcie duplikaty i limit przed zmianą stanu

**Sprawdźcie:** 

- błędny ostatni rekord nie daje częściowego importu (*all or nothing*)

## 4. Zapis i odczyt
- zapis po poprawnej zmianie
- przy starcie brak klucza to pusta lista
- istniejący tekst walidujcie

**Sprawdźcie:** 

- odświeżenie zachowuje dane;
- uszkodzenie JSON pokazuje błąd

## 5. Import pliku
- po wyborze pliku:
    -  potwierdzenie chęci importu
    - zablokowanie działania formularza,
    - odczytanie `text`
    - `parse`
    - `validate`
-  zapisanie w DOM

**Sprawdźcie:** 

- niepoprawny plik zachowuje stan i zapis
- [] opróżnia po zgodzie

## 6. Import HTTP
- użyjcie tego samego mechanizmu zatwierdzania dla `fetch`
- sprawdźcie `ok`, JSON i model.

**Sprawdźcie:** 

- 404
- zły JSON
-  zły rekord 

## Naprawa i porządkowanie
Podmiana tickets przed walidacją całości albo brak finally pozostawiający blokadę. Odtwórzcie awarię jednym fixture. Najpierw odtwórzcie błąd, potem naprawcie i powtórzcie to samo wejście.

Jedna funkcja importFrom(load) obsługuje wspólne zatwierdzanie i błędy; różnią się tylko adaptery odczytu. Refaktoryzacja zachowuje wynik, więc wykonajcie próby przed i po zmianie.

## Końcowa próba zespołu
Odczyt po odświeżeniu, odmowa zapisu, zły JSON w storage, import [], duplikat, zły ostatni rekord, 404, HTML zamiast JSON, anulowane potwierdzenie, podwójne kliknięcie, wolna sieć.

Eksport JSON jako kopia danych.
