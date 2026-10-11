# Symulator budżetu i ROI

Aplikacja internetowa: podajesz roczny budżet marketingowy, dzielisz go procentowo między
kategorie (social media, WWW, radio…), dla każdej podajesz oczekiwany ROI, a aplikacja liczy
całkowity zwrot z inwestycji. Można przygotować dwa warianty (A i B) i je porównać.

Wymagania produktowe: [docs/PRD.md](docs/PRD.md).

## Uruchomienie

Otwórz `index.html` w przeglądarce — bez instalacji i bez serwera.

## Testy

```sh
node --test
```

## Struktura

- `calc.js` — logika obliczeń i walidacji (bez DOM)
- `app.js` — interfejs: warianty, edycja kategorii, wyniki, porównanie
- `index.html`, `style.css` — strona
- `test/calc.test.js` — testy jednostkowe logiki
