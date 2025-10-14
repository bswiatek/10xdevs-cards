# Plan implementacji widoków: Lista zestawów, Szczegóły zestawu, Dodawanie fiszki ręcznie

## 1. Przegląd

Widoki obejmują dashboard z listą zestawów do szybkiego wejścia w naukę i zarządzanie, szczegóły zestawu z listą fiszek i akcjami CRUD oraz modal do ręcznego dodawania fiszki z walidacją długości i podglądem, zgodnie z PRD i user stories US-017…US-024 oraz dostarczonymi endpointami REST i typami DTO/VM w projekcie TypeScript.

## 2. Routing widoku

- Lista zestawów: “/” lub “/dashboard” (zabezpieczona routingiem auth).
- Szczegóły zestawu: “/sets/:id” (zabezpieczona, sprawdza 403/404).
- Dodawanie fiszki ręcznie: modal kontekstowy w dashboardzie i szczegółach zestawu (bez osobnej ścieżki, stan w URL opcjonalny ?modal=add).


## 3. Struktura komponentów

- DashboardPage
    - SetsSearchBar
    - SetsToolbar
        - NewSetButton
    - SetsGrid
        - SetCard (powtarzalny)
    - SetsPagination
    - EmptyState / ErrorState
    - AddFlashcardModal (portal, współdzielony)
- SetDetailsPage
    - SetHeader
        - SetMeta
        - StartStudyButton
        - DeleteSetButton
    - FlashcardsList
        - FlashcardListItem (EditButton, DeleteButton)
    - InfiniteLoader/Pagination
    - EmptyState / ErrorState
    - AddFlashcardModal (portal, współdzielony)
    - EditFlashcardModal (portal)
    - ConfirmDialog (usuwanie fiszki/zestawu)


## 4. Szczegóły komponentów

### DashboardPage

- Opis komponentu: Widok listy zestawów z wyszukiwaniem pełnotekstowym (debounce ≥300 ms), paginacją 20/stronę, sortowaniem po created_at desc i CTA do tworzenia/generowania oraz szybkiego wejścia w naukę.
- Główne elementy: nagłówek, pasek wyszukiwania, siatka kart, paginacja, stany puste/błędu.
- Obsługiwane interakcje:
    - Wpisywanie frazy (min 3 znaki uruchamia zapytanie, highlight wyników w tytułach).
    - Zmiana strony (pobranie GET /flashcard-sets?page=N\&limit=20\&search=).
    - Klik w SetCard → nawigacja do /sets/:id.
    - Klik “Nowy zestaw fiszek” → nawigacja do flow generowania lub otwarcie modalu dodawania fiszki (wg PRD preferowany generator; modal służy US-017).
- Obsługiwana walidacja:
    - Walidacja długości wyszukiwanej frazy (zapytania dopiero od 3 znaków; <3 znaków nie wysyła zapytań, czyści highlight).
    - Walidacja parametrów paginacji (limit max 100, u nas 20; fallback przy 422).
- Typy:
    - FlashcardSetListDTO, FlashcardSetListResponseDTO, PaginationDTO.
- Propsy: brak (strona), korzysta z hooków i klienta API.


### SetsSearchBar

- Opis: Input z debouncingiem, wsparcie clear i komunikat “Wpisz min. 3 znaki”.
- Elementy: input, ikonka, przycisk X.
- Interakcje: onChange, onClear, onSubmit (enter).
- Walidacja: min 3 znaki do triggera; trim whitespace.
- Typy: { value: string; onSearch: (q: string)=>void }.
- Propsy: value, onChange/onDebounced.


### SetsGrid

- Opis: Siatka kart zestawów; każdy SetCard pokazuje tytuł, datę, liczbę fiszek i due_cards_count.
- Elementy: lista kart responsywna, loader skeletony.
- Interakcje: klik w kartę.
- Walidacja: brak, tylko prezentacja.
- Typy: FlashcardSetListDTO[].
- Propsy: items: FlashcardSetListDTO[], onClickSet(id).


### SetCard

- Opis: Pojedyncza karta zestawu; wyróżnia due_cards_count, pokazuje “Brak fiszek do powtórzenia” gdy 0.
- Elementy: tytuł, liczby, data utworzenia, CTA “Ucz się” (opcjonalnie).
- Interakcje: onClick, przycisk Ucz się → nawigacja do trybu nauki (out of scope, link przygotowany).
- Walidacja: brak.
- Typy: FlashcardSetListDTO.
- Propsy: data: FlashcardSetListDTO.


### SetsPagination

- Opis: Kontrolka do nawigacji po stronach, zgodna z PaginationDTO.
- Elementy: przyciski prev/next, numery stron.
- Interakcje: onPageChange.
- Walidacja: page w zakresie 1..total_pages.
- Typy: PaginationDTO.
- Propsy: pagination, onChange.


### SetDetailsPage

- Opis: Szczegóły zestawu z listą fiszek, akcjami edycji/usuwania i CTA “Rozpocznij naukę”.
- Elementy: SetHeader, FlashcardsList, paginacja/ładowanie porcjami, dialogi.
- Interakcje: edycja/usuwanie fiszki (PATCH/DELETE), dodaj fiszkę (modal), usuń zestaw (dialog + DELETE).
- Walidacja: długości 200/500 przy edycji fiszki; potwierdzenia przy usunięciach.
- Typy: FlashcardSetDetailDTO, FlashcardWithProgressDTO.
- Propsy: z routera param id.


### SetHeader

- Opis: Nagłówek: tytuł, meta (daty, counts), akcje: Dodaj fiszkę, Rozpocznij naukę, Usuń zestaw.
- Elementy: przyciski, meta chips.
- Interakcje: open AddFlashcardModal, start study (link/akcja), delete set (ConfirmDialog).
- Walidacja: confirm dialog z liczbą fiszek, ostrzeżenie o nieodwracalności.
- Typy: FlashcardSetDetailDTO.
- Propsy: set: FlashcardSetDetailDTO, onDelete, onAdd.


### FlashcardsList

- Opis: Lista fiszek z akcjami Edytuj/Usuń, lazy loading/paginacja.
- Elementy: wiersze z front/back, progress summary (opcjonalnie).
- Interakcje: EditFlashcardModal, ConfirmDelete.
- Walidacja: przy edycji 200/500, przy usuwaniu confirm.
- Typy: FlashcardWithProgressDTO[].
- Propsy: items, onEdit, onDelete, pagination/infinite props.


### AddFlashcardModal

- Opis: Modal do ręcznego tworzenia fiszki z live walidacją długości, wyborem zestawu lub utworzeniem nowego, oraz podglądem fiszki przed zapisem.
- Elementy: pola “przód”, “tył”, dropdown “zestaw”, checkbox “Utwórz nowy zestaw”, input tytułu nowego zestawu, sekcja “Podgląd”.
- Interakcje:
    - Live walidacja: front ≤200, back ≤500, niewymuszone min>0; blokuj zapis, pokaż błędy 400/422.
    - Tryb “nowy zestaw”: wymaga niepustego tytułu; po zapisie tworzy set + POST flashcards (lub jeden złożony flow po stronie API — zmapowane niżej).
    - Po sukcesie: komunikat sukcesu, zamknięcie modalu, odświeżenie listy/sekcji.
- Walidacja: front non-empty ≤200, back non-empty ≤500; jeśli createNewSet=true → title non-empty; sanitize input (trim, normalizacja whitespaces).
- Typy: CreateFlashcardCommand, CreateFlashcardResponseDTO, CreateFlashcardSetCommand (gdy nowy zestaw).
- Propsy: isOpen, onClose, defaultSetId?, onCreated(result).


### EditFlashcardModal

- Opis: Modal do edycji fiszki z live walidacją, zachowuje historię nauki (backend).
- Elementy: pola “przód”, “tył”, podgląd zmian.
- Interakcje: zapis → PATCH /flashcards/:id; sukces → toast + aktualizacja listy.
- Walidacja: identycznie 200/500.
- Typy: UpdateFlashcardCommand.
- Propsy: isOpen, flashcard, onClose, onSaved.


### ConfirmDialog

- Opis: Ogólny dialog potwierdzenia dla usuwania fiszki/zestawu; treść zawiera fragment fiszki lub liczby z zestawu.
- Elementy: tytuł, opis, przyciski potwierdź/anuluj.
- Interakcje: onConfirm, onCancel; ESC, focus trap.
- Walidacja: brak, informacja o nieodwracalności operacji przy zestawie.
- Typy: none specyficzne.


## 5. Typy

- Z istniejących:
    - FlashcardSetListDTO, FlashcardSetListResponseDTO, PaginationDTO, FlashcardSetDetailDTO, FlashcardWithProgressDTO, CreateFlashcardCommand, CreateFlashcardResponseDTO, UpdateFlashcardCommand.
- Nowe ViewModel:
    - SearchState: { query: string; debounced: string; isActive: boolean } do sterowania wyszukiwaniem.
    - HighlightMatch: { text: string; ranges: { start: number; end: number }[] } do podświetlania wyników w tytułach; generowane na kliencie z debounced query.
    - AddFlashcardFormVM: { front: string; back: string; setId?: number; createNewSet: boolean; newSetTitle: string; errors: { front?: string; back?: string; newSetTitle?: string }; isValid: boolean }.
    - EditFlashcardFormVM: { id: number; front: string; back: string; errors: { front?: string; back?: string }; isValid: boolean }.
    - ListState<T>: { items: T[]; loading: boolean; error?: string; pagination: PaginationDTO } dla dashboardu.
    - DetailState: { data?: FlashcardSetDetailDTO; loading: boolean; error?: string }.


## 6. Zarządzanie stanem

- Dashboard: useDashboardSetsState
    - Stan: query, debouncedQuery, page, listState<FlashcardSetListDTO>, highlight map.
    - Efekty: debounce 300–500 ms; fetch przy zmianie page/debouncedQuery; anulowanie w locie; reset page przy nowym debouncedQuery.
- SetDetails: useSetDetailsState
    - Stan: detail, pagination/infinite cursor, loading, error.
    - Akcje: refetch po CRUD (optimistic: usunięcie fiszki; pessimistic: dodanie/edycja).
- Modale: useModalState dla AddFlashcardModal/EditFlashcardModal/ConfirmDialog (open, data, methods).
- Walidacja: useFlashcardValidation(front, back) → errors, isValid; useTitleValidation(title) dla nowego zestawu.
- Komunikaty: useToast do sukcesów/błędów; focus management i aria-hidden dla body przy modalach.


## 7. Integracja API

- GET /flashcard-sets?page\&limit=20\&search\&sort=created_at\&order=desc → FlashcardSetListResponseDTO.
- GET /flashcard-sets/:id → FlashcardSetDetailDTO.
- POST /flashcard-sets/:setId/flashcards body: CreateFlashcardCommand { front, back } → 201 CreateFlashcardResponseDTO.
- PATCH /flashcards/:id body: UpdateFlashcardCommand { front, back } → 200.
- DELETE /flashcards/:id → 204.
- DELETE /flashcard-sets/:id → 204.
- Nagłówki: Authorization: Bearer {access_token} we wszystkich chronionych wywołaniach; obsługa 401/403/404/422 zgodnie z specyfikacją.


## 8. Interakcje użytkownika

- Wyszukiwanie: po 3+ znakach uruchamia się debounce i odświeżenie listy; highlight wystąpień w tytułach; brak wyników → EmptyState z komunikatem.
- Paginacja: kliknięcie zmienia stronę i pobiera nowe wyniki; utrzymanie frazy search w zapytaniu.
- Wejście do zestawu: klik w kartę przenosi do /sets/:id; ładowanie i obsługa 404/403.
- Dodawanie fiszki: otwarcie modalu, wypełnienie pól, live walidacja, podgląd; zapis do istniejącego zestawu lub utworzenie nowego + zapis fiszki; toast sukcesu i odświeżenie.
- Edycja fiszki: otwarcie modalu, live walidacja, zapis PATCH; aktualizacja listy i toast.
- Usuwanie fiszki: dialog potwierdzenia z treścią; po potwierdzeniu DELETE i aktualizacja counts; toast sukcesu.
- Usuwanie zestawu: dialog z liczbą fiszek i ostrzeżeniem; DELETE i redirect do dashboardu; toast sukcesu.


## 9. Warunki i walidacja

- Wyszukiwanie: nie wysyłać zapytań dla <3 znaków; trim; zabezpieczyć przed 422 parametrami limit/order/sort zgodnie z dozwolonymi wartościami.
- Add/Edit fiszka:
    - front: non-empty, długość ≤200; back: non-empty, długość ≤500; błędy wyświetlane inline live (US-017/US-022).
    - createNewSet: wymaga newSetTitle non-empty; blokuje Submit i prezentuje błąd.
- Usuwanie: confirm dialogs wymagane, z ostrzeżeniem o nieodwracalności dla zestawu; focus na przycisku potwierdzenia; ESC anuluje.
- Dostęp: reakcja na 401/403 — redirect do logowania/komunikat dostępu; 404 — stan “Nie znaleziono”.


## 10. Obsługa błędów

- 401 Unauthorized: wyczyść sesję, redirect do logowania, toast “Sesja wygasła”.
- 403 Forbidden: toast “Brak dostępu do zasobu”, pozostaw na bieżącym widoku lub redirect na dashboard.
- 404 Not Found: SetDetailsPage pokazuje EmptyState “Zestaw nie istnieje lub został usunięty”.
- 422 Unprocessable Entity: dla search/paramów — pokaż notyfikację i przywróć bezpieczne domyślne (page=1, limit=20, sort=created_at, order=desc).
- 400 Bad Request: walidacja client-side zapobiega; jeśli wystąpi, pokaż konkretne błędy pól.
- Network/offline: banner “Utracono połączenie. Spróbuj ponownie.”, retry przywraca ostatnie zapytanie; formularze zachowują wprowadzone dane.


## 11. Kroki implementacji

1. Routing: zarejestruj trasy “/” i “/sets/:id” w routerze aplikacji, zabezpiecz middlewarem auth i przechwytywaniem 401/403.
2. Klient API: utwórz warstwę fetch z domyślnymi query params (limit=20, sort=created_at, order=desc) i dołączeniem Authorization; mapowanie do typów DTO.
3. DashboardPage: zaimplementuj useDashboardSetsState z debounce i fetch GET /flashcard-sets; wyrenderuj SetsSearchBar, SetsGrid, SetsPagination, EmptyState/ErrorState.
4. Highlight: dodaj util do generowania zakresów dopasowań dla tytułów na podstawie debouncedQuery i zastosuj lekkie podświetlenie w SetCard.
5. AddFlashcardModal: formularz z live walidacją 200/500, wyborem zestawu (lista z lokalnych danych lub dodatkowe GET /flashcard-sets dla dropdownu), tryb nowego zestawu z polem tytułu; przy zapisie wywołaj:
    - gdy istniejący zestaw: POST /flashcard-sets/:setId/flashcards,
    - gdy nowy zestaw: najpierw POST do endpointu tworzenia zestawu (jeśli dostępny wg types CreateFlashcardSetCommand), następnie POST fiszki do nowo utworzonego setu; jeśli brak endpointu tworzenia zestawu w opisie, dodać fallback: komunikat i prowadzić do generatora AI (po PRD jest proces tworzenia przez generator; opcjonalnie zapewnić minimalny endpoint w backendzie).
6. SetDetailsPage: fetch GET /flashcard-sets/:id; wyrenderuj SetHeader, FlashcardsList z paginacją (lub batch loading), przyciski akcji, ConfirmDialog dla usunięć.
7. EditFlashcardModal: implementacja z PATCH /flashcards/:id i odświeżeniem listy po sukcesie.
8. Delete flashcard: ConfirmDialog → DELETE /flashcards/:id; optimistic update items i decrement cards_count w nagłówku; revert przy błędzie.
9. Delete set: ConfirmDialog → DELETE /flashcard-sets/:id; redirect do dashboardu po 204; toast sukcesu.
10. UX i A11y: focus trap w modalach, aria-labels, role dialog; klawisz ESC zamyka modale; skeletony ładowania; stany puste z klarownym copy.
11. Testy E2E i jednostkowe: scenariusze US-017–US-024, walidacje długości, 401/403/404/422, debounce i paginacja, confirm dialogs, optimistic updates.

<implementation_breakdown>

1) Podsumowania i wymagania:

- PRD: Lista zestawów z paginacją 20, wyszukiwanie pełnotekstowe z podświetlaniem, ręczne dodawanie fiszki z walidacją 200/500, confirm dialogs dla usunięć, A11y, obsługa błędów; brak multimediów i formatowania; polski UI.
- User Stories: US-017/018 ręczne dodawanie i tworzenie zestawu w modalu; US-019 lista zestawów z meta i paginacją; US-020 wyszukiwanie min 3 znaki z highlight; US-021 szczegóły z listą fiszek i CRUD; US-022 edycja z live walidacją; US-023/024 usuwanie fiszki/zestawu z confirm i konsekwencjami (liczniki, redirect).
- Endpoint Description: Dostępne: GET listy, GET detale, POST fiszka w istniejącym zestawie, PATCH fiszka, DELETE fiszka, DELETE zestaw; brak jawnego POST /flashcard-sets (pojawia się w types.ts ale nie w opisie endpointów użytkownika) — trzeba przewidzieć dwa warianty.
- Type Definitions: Szczegółowe DTO: FlashcardSetListDTO/Response, FlashcardSetDetailDTO, CreateFlashcardCommand/Response, UpdateFlashcardCommand; istnieje CreateFlashcardSetCommand w types.ts, co implikuje endpoint tworzenia zestawu (w projekcie może istnieć mimo braku w skróconym opisie).
- Tech Stack: React + TypeScript, zalecenia Next.js/Vercel; Supabase/Auth; A11y, rate limiting, RLS; jednak z perspektywy frontu kluczowe jest trzymanie się REST, auth bearer i debounce/paginacja.

Wyzwania: niespójność dokumentacji endpointów (brak POST setu w sekcji 2.4, ale jest w types.ts) — zaprojektowano plan z fallbackiem; wydajne highlighty przy dużych listach — stosować tylko tytuły i pamiętać o debounced query; integralność liczb (cards_count) przy operacjach — optimistic updates z bezpiecznym refetchem.

2) Kluczowe wymagania z PRD: min 3 znaki do search, highlight, 20/strona, sort created_at desc, due_cards_count na kartach, confirm dialogs, live walidacja 200/500, podgląd fiszki, focus management w modalach, 401/422/403/404 obsługa.
3) Główne komponenty: opisane wyżej, typy/zdarzenia/walidacje dodane.
4) Drzewo komponentów:
App

- DashboardPage
    - SetsSearchBar
    - SetsToolbar
        - NewSetButton
    - SetsGrid
        - SetCard*
    - SetsPagination
    - EmptyState/ErrorState
    - AddFlashcardModal
- SetDetailsPage
    - SetHeader
    - FlashcardsList
        - FlashcardListItem*
    - Pagination/InfiniteLoader
    - EmptyState/ErrorState
    - AddFlashcardModal
    - EditFlashcardModal
    - ConfirmDialog

5) DTO/VM: zdefiniowane w sekcji typów; AddFlashcardFormVM, EditFlashcardFormVM, SearchState, ListState, DetailState, HighlightMatch.
6) Stan i hooki: useDashboardSetsState, useSetDetailsState, useFlashcardValidation, useTitleValidation, useModalState, useToast.
7) Wywołania API i akcje: mapowane w sekcji 7; każde z akcjami UI (toast, redirect, refetch, optimistic).
8) Mapowanie user stories:

- US-017/018: AddFlashcardModal z trybem nowego zestawu, walidacją, podglądem i sukces toasts.
- US-019: DashboardPage lista z paginacją, meta.
- US-020: SetsSearchBar + highlight + real-time po 3 znakach.
- US-021: SetDetailsPage lista fiszek, edycja/usuwanie, CTA “Rozpocznij naukę”.
- US-022: EditFlashcardModal live walidacja, natychmiastowo widoczne zmiany.
- US-023: Usuwanie fiszki dialog, aktualizacja liczb, komunikat.
- US-024: Usuwanie zestawu dialog, ostrzeżenie, redirect i komunikat.

9) Interakcje i oczekiwane wyniki: opisane w sekcji 8; każdy krok kończy się czytelnym feedbackiem.
10) Warunki API i weryfikacja: 200/201/204 ścieżki szczęśliwe; 400/422 walidacje pól; 401 auth redirect; 403 brak dostępu; 404 brak zasobu; komponenty walidują lokalnie i prezentują komunikaty.
11) Scenariusze błędów i obsługa: wyżej w sekcji 10.
12) Wyzwania i rozwiązania:

- Debounce i wyścigi zapytań: użyć AbortController i znaczników requestId.
- Niespójność endpointów tworzenia zestawu: wykrywanie możliwości POST /flashcard-sets przez feature flag w kliencie; jeśli brak, kierować do flow generatora lub blokować tryb “nowy zestaw” z komunikatem.
- Spójność liczników cards_count/due_cards_count: po operacjach odświeżać nagłówki i/lub re-fetch danych szczegółów.
- A11y modalów i dialogów: użyć gotowych komponentów z focus trap; testy klawiatury.
</implementation_breakdown>