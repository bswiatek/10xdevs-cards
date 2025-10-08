<conversation_summary>

## Decisions

1. Relacja użytkownik-zestawy: Każdy użytkownik może mieć wiele zestawów fiszek (relacja 1:N), każdy zestaw należy do dokładnie jednego użytkownika z kaskadowym usuwaniem.
2. Dane algorytmu FSRS: Przechowywanie parametrów `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state` (New/Learning/Review/Relearning), `last_review`, `due` w osobnej tabeli `flashcard_progress`.
3. Kandydaci na fiszki: Nie są zapisywani w bazie danych, pozostają w pamięci sesji użytkownika do momentu akceptacji.
4. Metryki generowania: Tabela `generation_sessions` ze statystykami: długość wejścia, liczba kandydatów, czas generowania, liczby zaakceptowanych/odrzuconych/edytowanych, procent akceptacji, timestamp z indeksami na `created_at` i `user_id`.
5. Logi systemowe: Tabela `system_logs` z kolumnami: poziom (ERROR/WARNING/INFO), typ zdarzenia, opis, ID użytkownika (nullable), metadata JSONB, timestamp z indeksami na `log_level`, `event_type`, `created_at`.
6. Sesje nauki: Dwie tabele - `study_sessions` (agregaty sesji) i `study_reviews` (pojedyncze odpowiedzi) dla granularnego śledzenia postępów.
7. Wyszukiwanie: Operator ILIKE z indeksami `pg_trgm` bez rozszerzenia full-text search.
8. Role i RLS: Kolumna `role` (enum: user/admin) w tabeli `users`, funkcja pomocnicza `is_admin()`, policies ograniczające dostęp użytkowników do własnych zasobów (`user_id = auth.uid()`), administratorzy z pełnym dostępem.
9. Strategia usuwania: Hard delete z `ON DELETE CASCADE` dla relacji zależnych.
10. Partycjonowanie: Nie stosować w MVP.
11. Struktura fiszek: Tabela `flashcards` z kolumnami: `id`, `flashcard_set_id`, `front` (TEXT, max 200 znaków), `back` (TEXT, max 500 znaków), `created_at`, `updated_at`, ograniczenia przez CHECK constraints.
12. Relacja fiszka-postęp: Osobna tabela `flashcard_progress` z relacją 1:1 do `flashcards`, klucz obcy UNIQUE NOT NULL z CASCADE.
13. Metadane zestawów: Tabela `flashcard_sets`: `id`, `user_id`, `title` (TEXT NOT NULL), `created_at`, `updated_at`, `cards_count` (INT, trigger), `due_cards_count` (INT, widok/funkcja), indeks na `(user_id, created_at DESC)`.
14. ENUM dla stanu FSRS: Typ `flashcard_state` z wartościami ('New', 'Learning', 'Review', 'Relearning'), domyślnie 'New'.
15. ENUM dla poziomów logów: Typ `log_level_type` z wartościami ('INFO', 'WARNING', 'ERROR'), domyślnie 'INFO'.
16. Indeksowanie kolumny `due`: Partial index `WHERE due <= NOW()` oraz indeks `(flashcard_id, due)` dla join-ów.
17. Trigery timestamp: Funkcja `update_updated_at_column()` z triggerami dla tabel z `created_at`/`updated_at`.
18. RLS dla metryk: Użytkownicy dostęp tylko do własnych danych, administratorzy pełny dostęp do odczytu, brak UPDATE/DELETE (immutable).
19. RLS dla sesji nauki: `study_sessions` - SELECT/INSERT dla właściciela, UPDATE tylko dla niezakończonych sesji, `study_reviews` - dostęp przez JOIN, admini tylko odczyt.

## Matched Recommendations

1. **Klucze obce z CASCADE**: Wszystkie relacje nadrzędne (user→flashcard_sets, flashcard_sets→flashcards, flashcards→flashcard_progress) powinny używać `ON DELETE CASCADE` dla zapewnienia integralności referencyjnej i automatycznego czyszczenia danych podrzędnych.
2. **Typy UUID vs BIGSERIAL**: Dla tabeli `users` zarządzanej przez Supabase Auth używać UUID, dla pozostałych tabel aplikacyjnych (`flashcards`, `flashcard_sets`, etc.) używać BIGSERIAL dla lepszej wydajności i prostszych relacji.
3. **Timestampy ze strefą czasową**: Wszystkie kolumny timestamp używają typu TIMESTAMPTZ z domyślną wartością `NOW()` dla spójności czasowej w aplikacji międzynarodowej.
4. **Indeksowanie foreign keys**: Automatyczne tworzenie indeksów B-tree na wszystkich kolumnach foreign key (`user_id`, `flashcard_set_id`, `flashcard_id`, `study_session_id`) dla optymalizacji JOIN-ów.
5. **Domyślne wartości dla liczników**: Kolumny `cards_count`, `reps`, `lapses` z wartością DEFAULT 0, kolumna `state` z DEFAULT 'New', kolumna `role` z DEFAULT 'user'.
6. **Constraints NOT NULL**: Wszystkie kolumny kluczowe (foreign keys, tytuły, treść fiszek) powinny mieć constraint NOT NULL dla zapewnienia integralności danych.
7. **Funkcja is_admin()**: Utworzenie funkcji pomocniczej `CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $ SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'); $ LANGUAGE SQL SECURITY DEFINER;` dla uproszczenia policies RLS.
8. **Trigger aktualizacji cards_count**: Automatyczne aktualizowanie licznika fiszek w zestawie przy INSERT/DELETE w tabeli `flashcards` przez trigger.
9. **Widok due_cards_count**: Utworzenie widoku lub funkcji obliczającej liczbę fiszek do powtórzenia dzisiaj dla każdego zestawu zamiast denormalizacji w tabeli.
10. **Polityki RLS USING vs WITH CHECK**: Używać klauzuli USING dla SELECT/UPDATE/DELETE (sprawdzenie istniejących wierszy) i WITH CHECK dla INSERT/UPDATE (walidacja nowych wartości) dla precyzyjnej kontroli dostępu.
11. **Indeks na metadata JSONB**: Dla kolumny `metadata` w `system_logs` rozważyć indeks GIN dla szybkich zapytań po zawartości JSON: `CREATE INDEX idx_system_logs_metadata ON system_logs USING GIN (metadata);`.
12. **Constraints CHECK na rating**: W tabeli `study_reviews` dodać `CHECK (rating >= 1 AND rating <= 5)` dla walidacji zgodności z interfejsem oceny.
13. **Nullable vs NOT NULL dla timestamps**: Kolumny `completed_at` w `study_sessions` i `last_review` w `flashcard_progress` powinny być nullable (sesja/fiszka może być niezakończona).
14. **Polityka bezpieczeństwa INSERT dla study_reviews**: Policy sprawdzająca czy `study_session_id` należy do aktywnej sesji użytkownika: `EXISTS (SELECT 1 FROM study_sessions WHERE id = study_session_id AND user_id = auth.uid() AND completed_at IS NULL)`.
15. **Kolumna acceptance_rate jako DECIMAL**: W tabeli `generation_sessions` użyć typu `DECIMAL(5,2)` dla `acceptance_rate` zamiast przechowywania jako procent integer.

## Database Planning Summary

### Główne wymagania schematu bazy danych

Baza danych PostgreSQL dla aplikacji Generator Fiszek AI obsługuje system nauki oparty na algorytmie FSRS z pełną kontrolą użytkownika nad procesem generowania i zarządzania fiszkami edukacyjnymi. Schemat musi zapewniać:

- **Autentykację i autoryzację**: Integracja z Supabase Auth dla zarządzania użytkownikami z systemem ról (user/admin) i Row Level Security dla izolacji danych między użytkownikami.
- **Generowanie i recenzję fiszek**: Przechowywanie metryk generowania AI bez zapisywania kandydatów (sesja tymczasowa w pamięci aplikacji).
- **System nauki FSRS**: Osobne tabele dla struktury fiszek i danych postępu algorytmu z precyzyjnym śledzeniem parametrów (stabilność, trudność, stan, harmonogram).
- **Granularne śledzenie postępów**: Architektura dwupoziomowa (sesje nauki + pojedyncze odpowiedzi) dla statystyk i analityki.
- **Administracja i monitoring**: Logi systemowe z metadanymi w formacie JSONB, dostępne tylko dla administratorów.
- **Wyszukiwanie**: Operator ILIKE na tytułach zestawów i treści fiszek bez zaawansowanego full-text search.


### Kluczowe encje i ich relacje

**1. users** (zarządzane przez Supabase Auth)

- Kolumny: `id` (UUID, PK), `email`, `role` (enum: user/admin), `created_at`
- Rozszerzenie profilu użytkownika przez Supabase Auth

**2. flashcard_sets**

- Kolumny: `id` (BIGSERIAL, PK), `user_id` (FK→users.id, CASCADE), `title` (TEXT NOT NULL), `cards_count` (INT DEFAULT 0), `created_at`, `updated_at`
- Relacja: 1 user → N flashcard_sets
- Indeksy: `(user_id, created_at DESC)` dla sortowania listy

**3. flashcards**

- Kolumny: `id` (BIGSERIAL, PK), `flashcard_set_id` (FK→flashcard_sets.id, CASCADE), `front` (TEXT, CHECK ≤200), `back` (TEXT, CHECK ≤500), `created_at`, `updated_at`
- Relacja: 1 flashcard_set → N flashcards
- Indeksy foreign key na `flashcard_set_id`

**4. flashcard_progress** (relacja 1:1 z flashcards)

- Kolumny: `id` (BIGSERIAL, PK), `flashcard_id` (FK UNIQUE→flashcards.id, CASCADE), `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps` (INT DEFAULT 0), `lapses` (INT DEFAULT 0), `state` (enum flashcard_state DEFAULT 'New'), `last_review` (TIMESTAMPTZ nullable), `due` (TIMESTAMPTZ)
- Indeksy: partial index `WHERE due <= NOW()`, composite `(flashcard_id, due)`

**5. generation_sessions** (metryki AI)

- Kolumny: `id` (BIGSERIAL, PK), `user_id` (FK→users.id), `input_length`, `candidates_generated`, `generation_time_ms`, `candidates_accepted`, `candidates_rejected`, `candidates_edited`, `acceptance_rate` (DECIMAL), `created_at`
- Indeksy: `created_at`, `user_id` dla analityki
- Immutable (brak UPDATE/DELETE policies)

**6. study_sessions**

- Kolumny: `id` (BIGSERIAL, PK), `user_id` (FK→users.id), `flashcard_set_id` (FK→flashcard_sets.id), `cards_reviewed`, `average_rating`, `duration_seconds`, `started_at`, `completed_at` (nullable)
- Relacja: 1 user → N study_sessions, 1 flashcard_set → N study_sessions

**7. study_reviews** (granularne odpowiedzi)

- Kolumny: `id` (BIGSERIAL, PK), `study_session_id` (FK→study_sessions.id, CASCADE), `flashcard_id` (FK→flashcards.id), `rating` (INT CHECK 1-5), `response_time_ms`, `reviewed_at`
- Relacja: 1 study_session → N study_reviews

**8. system_logs**

- Kolumny: `id` (BIGSERIAL, PK), `log_level` (enum: INFO/WARNING/ERROR DEFAULT 'INFO'), `event_type`, `message`, `user_id` (FK nullable→users.id), `metadata` (JSONB), `created_at`
- Indeksy: `log_level`, `event_type`, `created_at`, GIN na `metadata`


### Kwestie bezpieczeństwa

**Row Level Security (RLS)**:

- Wszystkie tabele aplikacyjne mają włączone RLS
- Funkcja pomocnicza `is_admin()` dla sprawdzania roli administratora
- **Policies dla użytkowników**: SELECT/INSERT/UPDATE/DELETE tylko dla własnych zasobów (`user_id = auth.uid()`)
- **Policies dla adminów**: Pełny dostęp SELECT, ograniczony UPDATE/DELETE (np. tylko odczyt logów i metryk)
- **Specjalne policies**: `study_reviews` - INSERT tylko podczas aktywnej sesji użytkownika, `generation_sessions` - immutable po zapisie

**Integralność danych**:

- Kaskadowe usuwanie (`ON DELETE CASCADE`) dla wszystkich relacji nadrzędnych zapewnia spójność przy usuwaniu użytkowników i zestawów
- CHECK constraints na długość tekstu (front ≤200, back ≤500 znaków)
- CHECK constraints na rating (1-5)
- UNIQUE constraint na `flashcard_progress.flashcard_id` dla relacji 1:1
- NOT NULL constraints na wszystkich kluczowych kolumnach

**Audyt i monitoring**:

- Wszystkie operacje administracyjne (resetowanie haseł, usuwanie kont) logowane w `system_logs`
- Metadata w JSONB dla elastycznego przechowywania kontekstu błędów
- Timestampy ze strefą czasową dla śledzenia zdarzeń w czasie


### Kwestie skalowalności

**Strategia indeksowania**:

- Indeksy B-tree na wszystkich foreign keys dla JOIN-ów
- Composite index `(user_id, created_at DESC)` dla sortowanej listy zestawów
- Partial index `WHERE due <= NOW()` dla optymalizacji zapytań o fiszki do powtórzenia
- Rezygnacja z indeksów trigram dla uproszczenia MVP

**Wydajność**:

- Trigery dla automatycznej aktualizacji `updated_at` i `cards_count` eliminują konieczność ręcznej synchronizacji
- Widok lub funkcja dla `due_cards_count` zamiast denormalizacji
- Typ BIGSERIAL zamiast UUID dla tabel aplikacyjnych (lepsza wydajność sekwencyjnych INSERT-ów)
- Brak partycjonowania w MVP - PostgreSQL radzi sobie z milionami rekordów bez tej optymalizacji

**Architektura danych**:

- Separacja struktury fiszek (`flashcards`) od danych nauki (`flashcard_progress`) ułatwia resetowanie postępu
- Separacja agregowanych sesji (`study_sessions`) od granularnych odpowiedzi (`study_reviews`) dla elastycznych zapytań analitycznych
- Immutable metryki generowania (`generation_sessions`) dla integralności danych historycznych

**Koszt i zasoby**:

- Supabase oferuje tier darmowy dla MVP, produkcja wymaga płatnego planu (\$25-599/miesiąc)
- Wymaganie 99% uptime wymaga monitorowania i zarządzania planami Supabase
- Brak mechanizmów kontroli kosztów AI w schemacie (do implementacji w logice aplikacji)


### Funkcje PostgreSQL wykorzystane w projekcie

1. **ENUMs**: `flashcard_state`, `log_level_type`, `role` dla type safety
2. **JSONB**: Kolumna `metadata` w `system_logs` z indeksem GIN
3. **CHECK constraints**: Walidacja długości tekstu i zakresów numerycznych
4. **Triggers**: Automatyczna aktualizacja timestampów i liczników
5. **Partial indexes**: Optymalizacja zapytań warunkowych (fiszki do powtórzenia)
6. **Row Level Security**: Izolacja danych między użytkownikami
7. **TIMESTAMPTZ**: Obsługa stref czasowych dla aplikacji międzynarodowej
8. **CASCADE constraints**: Automatyczne czyszczenie danych zależnych

</conversation_summary>