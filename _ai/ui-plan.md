# Architektura UI dla Generator Fiszek AI

Aplikacja składa się z publicznych widoków logowania/rejestracji oraz chronionych obszarów do generowania, recenzji, zarządzania zestawami, nauki i panelu administratora, zgodnie z wymaganiami funkcjonalnymi i modelem autoryzacji JWT z Supabase Auth. Wszystkie kluczowe przepływy oparte są o scenariusze PRD i mapują się bezpośrednio na udokumentowane endpointy REST dla generacji, zestawów, fiszek i sesji nauki, z egzekwowaniem limitów i walidacji długości treści na poziomie API.

## 1. Przegląd struktury UI

- Publiczne ścieżki obejmują logowanie i rejestrację, a dostęp do pozostałych widoków wymaga poprawnej sesji użytkownika opartej o token w nagłówku Authorization Bearer, co odpowiada poziomom autoryzacji i RLS po stronie API.
- Rdzeń produktu to cztery przepływy: generowanie kandydatów AI, recenzja kandydatów, manualne tworzenie fiszek oraz nauka z algorytmem FSRS, które są opisane jako historyjki i wymagania w PRD i obsługiwane przez dedykowane endpointy.
- Warstwa zarządzania zawiera listę zestawów z wyszukiwaniem pełnotekstowym, szczegóły zestawu z CRUD na fiszkach oraz metryki i operacje administracyjne dostępne wyłącznie dla roli administratora zgodnie z uprawnieniami API.

## 2. Lista widoków

- Nazwa widoku: Logowanie
  - Ścieżka widoku: /login
  - Główny cel: Uwierzytelnienie konta za pomocą emaila i hasła, aby uzyskać dostęp do chronionych zasobów.
  - Kluczowe informacje do wyświetlenia: Pola email/hasło, komunikaty błędu walidacji oraz błąd przy niepoprawnych danych bez ujawniania, który parametr jest błędny.
  - Kluczowe komponenty widoku: Formularz logowania, przycisk „Zaloguj”, link do rejestracji, bannery/toasty błędów.
  - UX, dostępność i względy bezpieczeństwa: Maskowanie hasła, walidacja RFC 5322 dla email, focus states i obsługa klawiatury, obsługa błędów 401 i przekierowanie po zalogowaniu.
- Nazwa widoku: Rejestracja
  - Ścieżka widoku: /register
  - Główny cel: Utworzenie konta poprzez email i hasło z potwierdzeniem, z automatycznym zalogowaniem po sukcesie.
  - Kluczowe informacje do wyświetlenia: Pola email, hasło, potwierdzenie hasła, komunikaty o unikalności email i minimalnej długości hasła.
  - Kluczowe komponenty widoku: Formularz rejestracji, przycisk „Utwórz konto”, link do logowania, toasty sukcesu/błędu.
  - UX, dostępność i względy bezpieczeństwa: Walidacja w czasie rzeczywistym, jasne komunikaty błędów, brak weryfikacji email w MVP, poprawne zarządzanie sesją po rejestracji.
- Nazwa widoku: Lista zestawów (Dashboard)
  - Ścieżka widoku: / lub /dashboard
  - Główny cel: Przegląd i szybkie wejście do nauki, generowania lub zarządzania zestawami z możliwością wyszukiwania pełnotekstowego.
  - Kluczowe informacje do wyświetlenia: Tytuł zestawu, data utworzenia, liczba fiszek, liczba fiszek do powtórzenia dzisiaj i ewentualne statystyki ostatniej sesji.
  - Kluczowe komponenty widoku: Pasek wyszukiwania, siatka kart zestawów, przycisk „Nowy zestaw fiszek”, paginacja listy zestawów zgodnie z limitami API.
  - UX, dostępność i względy bezpieczeństwa: Debounce wyszukiwania, podświetlanie wyników, paginacja/limit, obsługa błędów 401/422, wyraźne stany pustej listy.
- Nazwa widoku: Generowanie fiszek AI
  - Ścieżka widoku: /generate
  - Główny cel: Wklejenie tekstu źródłowego i uruchomienie generacji kandydatów z limitem 1000–10000 znaków i czasem oczekiwania do 60 s.
  - Kluczowe informacje do wyświetlenia: Pole textarea z licznikiem znaków w czasie rzeczywistym, stany przycisku „Generuj fiszki”, komunikaty o błędach długości i timeout.
  - Kluczowe komponenty widoku: Textarea, licznik znaków, przycisk „Generuj”, wskaźnik ładowania bez progresu, bannery błędów.
  - UX, dostępność i względy bezpieczeństwa: Blokada przycisku przy nieprawidłowej długości, zachowanie tekstu po błędzie, komunikaty o błędach 400/408/503, sanityzacja tekstu.
- Nazwa widoku: Recenzja kandydatów
  - Ścieżka widoku: /review/:generationSessionId
  - Główny cel: Akceptacja, edycja lub odrzucenie kandydatów oraz zapis zaakceptowanych pozycji do nowego zestawu.
  - Kluczowe informacje do wyświetlenia: Lista kandydatów z przodem/tyłem, liczniki zaakceptowanych/odrzuconych/pozostałych, walidacja 200/500 znaków przy edycji.
  - Kluczowe komponenty widoku: Lista kart kandydata, przyciski Akceptuj/Edytuj/Odrzuć, modal edycji, przycisk „Zapisz zestaw” z modalem tytułu.
  - UX, dostępność i względy bezpieczeństwa: Stany wizualne dla akcji, blokada zapisu przy 0 zaakceptowanych, odporność na błędy 422/500 oraz zgodność z limitami długości.
- Nazwa widoku: Szczegóły zestawu
  - Ścieżka widoku: /sets/:id
  - Główny cel: Przegląd fiszek zestawu, edycja/usuń fiszkę, uruchomienie nauki i prezentacja metadanych zestawu.
  - Kluczowe informacje do wyświetlenia: Tytuł, data utworzenia, liczba fiszek, liczba do powtórzenia, lista fiszek z przodem/tyłem i postępem.
  - Kluczowe komponenty widoku: Nagłówek zestawu, lista fiszek z akcjami Edytuj/Usuń, przycisk „Rozpocznij naukę”, „Dodaj fiszkę ręcznie”.
  - UX, dostępność i względy bezpieczeństwa: Paginacja/lista ładowana porcjami, confirm dialog przy usuwaniu, obsługa błędów 403/404/422 i zachowanie integralności danych.
- Nazwa widoku: Dodawanie fiszki ręcznie
  - Ścieżka widoku: Modal w kontekście listy lub szczegółów zestawu
  - Główny cel: Utworzenie pojedynczej fiszki z walidacją 200/500 i przypisaniem do istniejącego lub nowego zestawu.
  - Kluczowe informacje do wyświetlenia: Pola przód/tył, wybór zestawu, opcja „Utwórz nowy zestaw”, podgląd fiszki przed zapisem.
  - Kluczowe komponenty widoku: Formularz w modalu, dropdown zestawu, pole tytułu nowego zestawu, przycisk „Zapisz”.
  - UX, dostępność i względy bezpieczeństwa: Walidacja live, czytelne błędy 400/422, focus management w modalu i bezpieczna obsługa wejścia.
- Nazwa widoku: Sesja nauki
  - Ścieżka widoku: /study/:setId
  - Główny cel: Przeprowadzenie sesji nauki z prezentacją przodu, ujawnieniem tyłu i oceną 1–5 zgodnie z FSRS.
  - Kluczowe informacje do wyświetlenia: Indykator „Fiszka X z Y”, stan odpowiedzi, pięć opisanych poziomów oceny i komunikat o braku fiszek do powtórzenia.
  - Kluczowe komponenty widoku: Karta fiszki, przycisk „Pokaż odpowiedź”, pięć przycisków oceny, przycisk „Przerwij sesję”, podsumowanie sesji.
  - UX, dostępność i względy bezpieczeństwa: Duże przyciski, płynne przejścia, obsługa błędów 400/403/404, poprawne zakończenie/patch sesji i zapisywanie ocen.
- Nazwa widoku: Ustawienia konta (zmiana hasła)
  - Ścieżka widoku: /settings
  - Główny cel: Zmiana hasła z wymogiem minimalnej długości i unieważnieniem sesji po zmianie.
  - Kluczowe informacje do wyświetlenia: Pola stare hasło, nowe hasło, potwierdzenie nowego, komunikaty walidacji i sukcesu.
  - Kluczowe komponenty widoku: Formularz zmiany hasła, przycisk „Zapisz”, toasty/statusy.
  - UX, dostępność i względy bezpieczeństwa: Maskowanie, walidacja live, wymuszenie ponownego logowania i poprawne komunikaty błędów.
- Nazwa widoku: Admin – Użytkownicy
  - Ścieżka widoku: /admin/users
  - Główny cel: Przegląd i zarządzanie kontami użytkowników (reset hasła, usuwanie) dla roli administratora.
  - Kluczowe informacje do wyświetlenia: Lista użytkowników z email, rolą, metrykami konta, filtry i paginacja.
  - Kluczowe komponenty widoku: Tabela, filtry, akcje wierszy „Resetuj hasło” i „Usuń konto”, confirm dialogi.
  - UX, dostępność i względy bezpieczeństwa: Wymuszone uprawnienia admina, wyraźne ostrzeżenia o nieodwracalności i logowanie operacji.

## 3. Mapa podróży użytkownika

- Przepływ: Generowanie fiszek AI

1. Wejście do „Nowy zestaw fiszek” i wklejenie tekstu 1000–10000 znaków z licznikiem i walidacją live.
2. Uruchomienie generacji i oczekiwanie do 60 s na wynik lub komunikat timeout z opcją ponów.
3. Automatyczne przejście do widoku recenzji kandydatów po sukcesie.
4. Akceptacja/edycja/odrzucanie kandydatów z licznikami postępu.
5. Zapis zestawu z wymuszonym tytułem i tylko zaakceptowanymi/zaedytowanymi fiszkami.
6. Przekierowanie na listę zestawów z potwierdzeniem sukcesu.

- Przepływ: Manualne tworzenie fiszki

1. Otwarcie modalu „Dodaj fiszkę ręcznie” z polami przód/tył i walidacją 200/500.
2. Wybór istniejącego zestawu lub utworzenie nowego z walidacją tytułu.
3. Zapis fiszki i odświeżenie listy/aktualizacja licznika w zestawie.

- Przepływ: Sesja nauki

1. Start z widoku zestawu, sprawdzenie dostępnych fiszek do powtórzenia i inicjacja sesji.
2. Prezentacja przodu, ujawnienie tyłu i ocena 1–5, zapis review i przejście do następnej fiszki.
3. Zakończenie sesji z podsumowaniem lub przerwanie z częściowym zapisem i powrotem do listy.

- Przepływ: Wyszukiwanie i zarządzanie

1. Wpisywanie zapytania 3+ znaki i filtrowanie zestawów wraz z treścią fiszek.
2. Przejście do szczegółów zestawu, edycja/usuń fiszkę i powrót do listy lub start nauki.

## 4. Układ i struktura nawigacji

- Nawigacja główna zawiera widoczne wejścia do listy zestawów, generowania, ustawień konta i wylogowania w kontekście zalogowanego użytkownika, a linki do panelu admina są warunkowo widoczne dla roli administratora.
- Publiczne widoki logowania/rejestracji są odseparowane od chronionych tras i stosują przekierowania po poprawnym uwierzytelnieniu, z uwzględnieniem przechwytywania prób wejścia bez sesji i odpowiedzi 401.
- Wewnątrz chronionych widoków zachowany jest spójny układ z persistent search na liście zestawów, akcjami kontekstowymi na kartach i modalami do edycji/zapisu, zgodnie z wymaganiami PRD.

## 5. Kluczowe komponenty

- Formularze uwierzytelnienia i konta: Pola email/hasło, maskowanie, walidacja live, toasty i poprawne komunikaty 401/422, zgodne z regułami haseł i unikalnością email.
- Generator: Textarea z licznikiem, blokadą zakresu 1000–10000, przycisk „Generuj”, spinner i bannery błędów 400/408/503 oraz zachowanie danych wejściowych po błędzie.
- Recenzja: Lista kart kandydatów, akcje Akceptuj/Edytuj/Odrzuć, modal edycji z walidacją 200/500, przeliczanie liczników i modal tytułu przed zapisem.
- Zestawy i fiszki: Karty/wiersze z przodem/tyłem, akcje Edytuj/Usuń, confirm dialogi, paginacja/limit oraz widoczne wskaźniki „do powtórzenia”.
- Nauka (FSRS): Karta fiszki, „Pokaż odpowiedź”, pięć ocen 1–5 z opisami, wskaźnik postępu sesji, podsumowanie sesji i opcja przerwania z częściowym zapisem.
- Wyszukiwanie i filtry: Pole wyszukiwania real-time dla zestawów i treści fiszek z podświetlaniem oraz bezpieczne mapowanie na parametry zapytań API.
- Admin: Tabele użytkowników, logów i metryk z filtrami, paginacją i akcjami wysokiego ryzyka z confirm dialogami i kontrolą uprawnień.
- Obsługa błędów i stany: Ekrany 403/404, bannery dla błędów krytycznych, toasty sukcesu/info, wskaźniki offline i retry, zgodne z typami błędów zdefiniowanymi w API.
