# API Endpoint Implementation Plan: Flashcard Sets and Flashcards

## 1. Przegląd punktu końcowego

Plan obejmuje wdrożenie CRUD i listowania dla zestawów fiszek oraz tworzenia/aktualizacji/usuwania pojedynczych fiszek z kontrolą dostępu użytkownika, paginacją, wyszukiwaniem i walidacją zgodną z constraintami bazy i RLS.

## 2. Szczegóły żądania

- Metody HTTP: GET, PATCH, DELETE dla /flashcard-sets; GET dla /flashcard-sets/:id; POST dla /flashcard-sets/:setId/flashcards; PATCH i DELETE dla /flashcards/:id.
- Struktury URL:
  - /flashcard-sets
  - /flashcard-sets/:id
  - /flashcard-sets/:setId/flashcards
  - /flashcards/:id
- Parametry:
  - Wymagane: Authorization: Bearer {access_token} dla wszystkich endpointów.
  - Opcjonalne (GET /flashcard-sets): page (default 1), limit (default 20, max 100), search, sort (created_at|updated_at|title, default created_at), order (asc|desc, default desc).
- Request Body:
  - PATCH /flashcard-sets/:id: { title } wymagany, niepusty, max 200.
  - POST /flashcard-sets/:setId/flashcards: { front, back } wymagane; front 1..200, back 1..500.
  - PATCH /flashcards/:id: { front?, back? } co najmniej jedno pole; front 1..200, back 1..500.

## 3. Wykorzystywane typy

- DTO/Command:
  - PaginationDTO, FlashcardSetListDTO, FlashcardSetListResponseDTO.
  - FlashcardProgressDTO, FlashcardWithProgressDTO, FlashcardSetDetailDTO.
  - UpdateFlashcardSetCommand, CreateFlashcardCommand, CreateFlashcardResponseDTO, UpdateFlashcardCommand.
- Tabele i typy DB: flashcardsets, flashcards, flashcardprogress, widok flashcardsets_with_due_count, ENUM flashcardstate, triggery updated_at i cardscount, RLS policies.

## 3. Szczegóły odpowiedzi

- GET /flashcard-sets: 200 z { flashcard_sets: FlashcardSetListDTO[], pagination: PaginationDTO } zgodnie ze specyfikacją; due_cards_count z widoku (coalesce 0).
- GET /flashcard-sets/:id: 200 z FlashcardSetDetailDTO, gdzie flashcards zawiera progress (state, due, reps, lapses).
- PATCH /flashcard-sets/:id: 200 z zaktualizowanym FlashcardSetListDTO.
- DELETE /flashcard-sets/:id: 204 bez body.
- POST /flashcard-sets/:setId/flashcards: 201 z CreateFlashcardResponseDTO (flashcard + progress inicjalizowany state=New, reps=0, lapses=0, due=NOW).
- PATCH /flashcards/:id: 200 z zaktualizowaną fiszką (bez progress w odpowiedzi).

## 4. Przepływ danych

- Autentykacja: Supabase Auth; auth.uid dostępny po stronie serwera; Authorization Bearer wymagany dla wszystkich wywołań.
- RLS: Włączony dla flashcardsets/flashcards/flashcardprogress, ogranicza dostęp do zasobów użytkownika; admin może mieć rozszerzony odczyt.
- Listowanie setów: SELECT z widoku flashcardsets_with_due_count filtrowany po userid=auth.uid, z paginacją i sortowaniem zgodnym z allowlist; search realizowane przez ILIKE na title oraz dołączenia do flashcards dla content (z DISTINCT ON/EXISTS).
- Szczegóły setu: SELECT setu użytkownika + LEFT JOIN flashcards + LEFT JOIN progress, agregacja do struktury DTO; rely on RLS dla filtracji.
- Tworzenie fiszki: INSERT do flashcards (flashcardsetid = :setId) z RLS ensure owner; trigger zwiększa cardscount; następnie INSERT do flashcardprogress z domyślnymi wartościami; transakcja.
- Aktualizacje: PATCH setu aktualizuje title (trigger updated_at); PATCH fiszki aktualizuje front/back (trigger updated_at).
- Usuwanie: DELETE setu kaskadowo usuwa fiszki i progress (ON DELETE CASCADE); DELETE fiszki usuwa także progress i dekrementuje cardscount przez trigger.

## 5. Względy bezpieczeństwa

- Autoryzacja: weryfikacja tokena; RLS policies egzekwują dostęp na poziomie wiersza; dodatkowe sprawdzenie właścicielstwa przy operacjach 403 vs 404 według polityki błędów.
- Walidacja i sanitizacja: allowlist na sort/order; limit ograniczony do 100; trim i długości dla title/front/back; parametryzowane zapytania, brak interpolacji.
- Rate limiting: na modyfikujące endpointy i potencjalnie GET z search; rekomendowane per user/IP w warstwie edge/server.
- Logowanie audytowe: systemlogs (servicerole) dla ERROR i kluczowych zdarzeń; metadata JSONB z kontekstem, ale bez PII wrażliwego.

## 6. Obsługa błędów

- 400 Bad Request: nieprawidłowe query/body (limit>100, sort/order spoza allowlist, puste lub zbyt długie pola; brak pól w PATCH flashcards).
- 401 Unauthorized: brak lub niepoprawny Bearer token; brak auth.uid.
- 403 Forbidden: zasób istnieje, lecz nie należy do użytkownika; wykryte przez RLS przy dodatkowej weryfikacji istnienia zasobu (sprawdzanej serwerowo).
- 404 Not Found: zasób nie istnieje (set lub flashcard); rozróżnienie od 403 przez wcześniejszy check po roli serwisowej albo neutralne 404 dla obu.
- 422 Unprocessable Entity: formalnie poprawny JSON, ale nie spełnia ograniczeń domenowych (np. walidacje treści); można mapować walidacje aplikacyjne na 422 zgodnie ze spec.
- 500 Internal Server Error: błędy bazy/nieoczekiwane; log do systemlogs z loglevel=ERROR i eventtype (np. api.flashcards.create.failed).

## 7. Rozważania dotyczące wydajności

- Indeksy: wykorzystanie idx_flashcardsets_user_created (userid, created_at DESC) dla list; idx_flashcards_flashcardsetid dla dołączeń; widok due count oparty o joiny i partial index na flashcardprogress.due.
- Wyszukiwanie: ILIKE na title i treści fiszek może być kosztowne; rozważyć pg_trgm dla przyspieszenia, gdy search stanie się popularny.
- Paginacja: LIMIT/OFFSET z total count; opcjonalnie keyset w przyszłości; limit maks. 100.
- Transakcje: tworzenie fiszki + progress w jednej transakcji; zmniejsza ryzyko niespójności.
- Reuse RLS: minimalizacja logiki autoryzacji w kodzie, przeniesienie kosztu do DB.

## 8. Etapy wdrożenia

1. Schemat i RLS: upewnić się, że tabele, widoki, indeksy, triggery i RLS (flashcardsets, flashcards, flashcardprogress, systemlogs) są wdrożone jak w db-plan.md.
2. Warstwa typów: zaimportować DTO/Command z types.ts i powiązać z handlerami endpointów; zdefiniować mapowania rekordów DB → DTO.
3. Walidacja: zbudować schematy dla query/body (page, limit, sort, order, search; title/front/back), z ograniczeniami długości i allowlist; trim i normalizacja whitespace.
4. Serwisy:
   - FlashcardSetService: list, getDetail, updateTitle, deleteSet; zapytania korzystają z widoku due count i indeksów; parametryzowane; paginacja i sortowanie.
   - FlashcardService: createWithProgress (transakcja), updateContent, delete; sprawdzanie przynależności do setu przez RLS.
   - LoggingService: helper insert do systemlogs z eventtype, loglevel, userid i metadata.
5. Handlery HTTP:
   - GET /flashcard-sets: walidacja query, wywołanie serwisu, składanie PaginationDTO i listy.
   - GET /flashcard-sets/:id: pobranie setu + fiszek + progress; 404, jeśli nie istnieje; 403, jeśli brak dostępu (wg przyjętej polityki).
   - PATCH /flashcard-sets/:id: walidacja tytułu, update; zwrócenie 200 z DTO.
   - DELETE /flashcard-sets/:id: delete; 204 na sukces; rozróżnić 404/403 zgodnie z polityką.
   - POST /flashcard-sets/:setId/flashcards: walidacja front/back, transakcyjny insert fiszki i progress; 201 z CreateFlashcardResponseDTO.
   - PATCH /flashcards/:id: walidacja częściowa, update treści; 200 z rekordem.
6. Błędy i logowanie: middleware mapujący wyjątki walidacji na 400/422; błędy DB na 500; wpisy ERROR do systemlogs z metadanymi (endpoint, payload lengths, trace id).
7. Bezpieczeństwo: middleware autoryzacji Bearer; whitelist sort/order; rate limiting na modyfikujące endpointy i search (per user/IP).
8. Testy: przypadki 200/201/204 i błędowe 400/401/403/404/422/500; testy RLS z różnymi użytkownikami; sprawdzenie triggerów cardscount/updated_at i widoku due count.
9. Obserwowalność: metryki czasu odpowiedzi i błędów; logowanie WARNING dla naruszeń limitów; INFO dla operacji kluczowych (create/delete).
10. Optymalizacje: jeśli search spowalnia, dodać pg_trgm i indeksy ILIKE; rozważyć keyset pagination dla dużych zbiorów.
