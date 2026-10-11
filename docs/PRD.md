# PRD: Symulator budżetu marketingowego i ROI

## 1. Cel

Prosta aplikacja internetowa, w której użytkownik podaje roczny budżet marketingowy,
dzieli go procentowo między kategorie (social media, WWW, radio itd.), dla każdej
kategorii podaje oczekiwany ROI i otrzymuje całkowity zwrot z inwestycji.
Użytkownik może przygotować dwa warianty podziału i porównać je ze sobą.

## 2. Użytkownik

Osoba planująca budżet marketingowy (marketer, właściciel małej firmy, student),
która chce szybko sprawdzić, który podział budżetu da lepszy zwrot. Nie musi znać
arkuszy kalkulacyjnych ani się logować.

## 3. Założenia (uzgodnione)

| Obszar | Decyzja |
|---|---|
| Model ROI | ROI netto: `zysk = kwota × ROI%`, `przychód = kwota + zysk`. Całkowity ROI = suma zysków / suma zainwestowanych kwot (średnia ważona). |
| Suma udziałów | Musi wynosić **dokładnie 100%**. Dopóki tak nie jest, wynik nie jest liczony, a aplikacja pokazuje aktualną sumę i brakujące/nadmiarowe punkty procentowe. |
| Funkcje dodatkowe | Porównanie dwóch wariantów (A i B). Wykres i zapisywanie scenariuszy są poza zakresem. |
| Technologia | Statyczna strona: HTML + CSS + czysty JavaScript, bez budowania i bez zależności. |
| Język, waluta | Interfejs po polsku, kwoty w PLN, format liczb `pl-PL`. |

## 4. Wymagania funkcjonalne

### F1. Budżet roczny
- Pole liczbowe „Roczny budżet (PLN)”, wartość > 0.
- Błędna wartość (pusta, 0, ujemna) blokuje wynik i pokazuje komunikat.

### F2. Kategorie
- Domyślne kategorie: Social media, WWW, Radio, TV, Prasa, Outdoor.
- Użytkownik może: zmienić nazwę, dodać nową kategorię, usunąć kategorię (min. 1).
- Dla każdej kategorii podaje:
  1. **% budżetu** (0–100, dopuszczalne ułamki),
  2. **oczekiwany ROI %** (≥ −100; ROI ujemny = strata, −100% = utrata całej kwoty).
- Przy każdej kategorii widoczna wyliczona kwota w PLN.

### F3. Walidacja sumy
- Pod tabelą wskaźnik „Suma udziałów: X%”.
- X = 100% (tolerancja 0,001 pp na błędy zaokrągleń) → stan poprawny (zielony).
- X ≠ 100% → stan błędu (czerwony) z informacją „brakuje Y pp” albo „przekroczono o Y pp”;
  wyniki są ukryte i zastąpione komunikatem.
- Przycisk „Rozłóż równo” dzieli 100% po równo między kategorie (reszta z zaokrągleń
  trafia do ostatniej kategorii, żeby suma była dokładnie 100).

### F4. Wynik
Gdy dane są poprawne, aplikacja pokazuje na żywo (bez przycisku „Licz”):
- tabelę per kategoria: kwota, ROI %, zysk, przychód,
- podsumowanie: zainwestowano, całkowity zysk (zwrot netto), całkowity przychód,
  **całkowity ROI %**.

### F5. Dwa warianty i porównanie
- Dwie zakładki: **Wariant A** i **Wariant B**, każda z własnym budżetem i kategoriami.
- Przycisk „Kopiuj do drugiego wariantu” nadpisuje drugi wariant kopią bieżącego
  (punkt wyjścia do modyfikacji).
- Sekcja „Porównanie” pokazuje obok siebie dla A i B: budżet, zysk, przychód, ROI %,
  oraz kolumnę różnicy (B − A) i wskazanie lepszego wariantu (wg całkowitego zysku).
- Jeśli któryś wariant jest niepoprawny, porównanie wskazuje który i dlaczego.

## 5. Wymagania niefunkcjonalne
- Działa po otwarciu `index.html` w przeglądarce, bez serwera i bez internetu.
- Responsywność: używalne na telefonie (szerokość od 360 px).
- Dostępność: etykiety dla wszystkich pól, komunikaty błędów czytelne nie tylko kolorem.
- Logika obliczeń w osobnym module (`calc.js`) z testami jednostkowymi (Node, `node --test`).

## 6. Poza zakresem
- Wykres, zapis/wczytywanie scenariuszy, eksport.
- Konta użytkowników, backend.
- Uwzględnianie czasu (zwrot rozłożony w miesiącach), inflacji, podatków.

## 7. Przykład (kryterium akceptacji)
Budżet 100 000 PLN: Social media 50% / ROI 40%, WWW 30% / ROI 20%, Radio 20% / ROI −10%.
- Kwoty: 50 000 / 30 000 / 20 000
- Zyski: 20 000 / 6 000 / −2 000 → całkowity zysk **24 000 PLN**
- Przychód: **124 000 PLN**, całkowity ROI **24%**

## 8. Kryteria akceptacji
1. Przykład z p. 7 daje dokładnie podane wartości.
2. Suma 99% lub 101% ukrywa wynik i pokazuje komunikat o brakujących/nadmiarowych pp.
3. Dodanie/usunięcie kategorii natychmiast aktualizuje sumę i wynik.
4. Porównanie poprawnie liczy różnicę B − A i wskazuje lepszy wariant.
5. `node --test` przechodzi.
