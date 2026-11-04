# C04_JS_ASYNC - Helpdesk: moduły, zapis i import

## Założenia wstępne:

- Rozwijacie własny kod z collabu 3 - aplikację "Szkolny helpdesk" (lub to co zrobiliście bazując na tym szkielecie).
- Pracujecie w zespołach dwu lub trzy osobowych:
    - Osobą pozostającą w zespole jest "osiołek" (właściciel repozytorium; przypominam - "osiołek" gdyż dźwiga ciężar repozytorium!)
    - Jedna osoba z zespołu tworzącego kod w collabie 3 odchodzi do innego zespołu:
        - W każdym zespole musi znaleźć się jeden nowy programista/nowa programistka z innego zespołu
        - Zespół wprowadza nowego członka/nową członkinię w kod i założenia stojące za jego powstaniem
    - Kontrakt danych dla zespołu obowiązuje taki jak w poprzednim collabie w zespole, w którym jest "osiołek"

## Do zrobienia:

- wydzielenie modułów ESM
- korzystanie z obiektu Promise! (async, await, finally)
- dodanie `localStorage`
- import:
    - lokalnego JSONa ze zgłoszeniami przez `fetch`
    - z pliku wskazanego przez użytkownika:
        - (obowiązkowy) JSON
        - (opcjonalnie) CSV
        - (hardcore) XML
    - importowane dane zastępują aktualną listę dopiero po:
        -  potwierdzeniu przez użytkownika 
        - walidacji danych
    - błąd podczas importu zachowuje poprzednią listę
    - na czas importowania blokowane jest:
        - edycja listy (dodawanie, zmiana statusów, usuwanie)
        - kolejne importy
- protokół HTTP obsługujecie przez uruchomienie wtyczki `Live Server` z poziomu `Visual Studio Code`:
    - [Live Server - Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
    - NIE instalujecie Node.js, ani npm

## Do sprawdzenia:

- odczyt po odświeżeniu
- odmowa zapisu
- zły JSON w storage
- import []
- duplikat
- zły ostatni rekord
- 404
- HTML zamiast JSON
- anulowane potwierdzenie
- podwójne kliknięcie

## Nice to have

**TYLKO I WYŁĄCZNIE PO UKOŃCZENIU PODSTAWOWEJ FUNKCJONALNOŚCI!**

- eksport listy:
    - (easy) JSON
    - (medium) CSV
    - (hell) XML
- oprawa wizualna (lepsze UI z wykorzystaniem CSS)
- dodatkowe wodotryski wedle fantazji zespołu
