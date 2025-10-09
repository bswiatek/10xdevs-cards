# Schemat Bazy Danych PostgreSQL - Generator Fiszek AI

## 1. Tabele

### 1.1 users

Tabela zarządzana przez Supabase Auth, rozszerzona o system ról.

```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**

- `id` (UUID, PK) - Unikalny identyfikator użytkownika (zarządzany przez Supabase Auth)
- `email` (TEXT, UNIQUE, NOT NULL) - Adres email użytkownika
- `role` (user_role, NOT NULL, DEFAULT 'user') - Rola użytkownika (user/admin)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data utworzenia konta

**Ograniczenia:**

- Primary Key: `id`
- Unique: `email`

---

### 1.2 flashcard_sets

Zestawy fiszek należące do użytkowników.

```sql
CREATE TABLE flashcard_sets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cards_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**

- `id` (BIGSERIAL, PK) - Unikalny identyfikator zestawu
- `user_id` (UUID, FK→users.id, NOT NULL) - Właściciel zestawu
- `title` (TEXT, NOT NULL) - Tytuł zestawu
- `cards_count` (INT, NOT NULL, DEFAULT 0) - Liczba fiszek w zestawie (aktualizowana przez trigger)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data utworzenia
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data ostatniej modyfikacji

**Ograniczenia:**

- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- NOT NULL: `user_id`, `title`, `cards_count`, `created_at`, `updated_at`

---

### 1.3 flashcards

Indywidualne fiszki należące do zestawów.

```sql
CREATE TABLE flashcards (
  id BIGSERIAL PRIMARY KEY,
  flashcard_set_id BIGINT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  front TEXT NOT NULL CHECK (char_length(front) <= 200),
  back TEXT NOT NULL CHECK (char_length(back) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**

- `id` (BIGSERIAL, PK) - Unikalny identyfikator fiszki
- `flashcard_set_id` (BIGINT, FK→flashcard_sets.id, NOT NULL) - Zestaw, do którego należy fiszka
- `front` (TEXT, NOT NULL, CHECK ≤200) - Przód fiszki (pytanie)
- `back` (TEXT, NOT NULL, CHECK ≤500) - Tył fiszki (odpowiedź)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data utworzenia
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data ostatniej modyfikacji

**Ograniczenia:**

- Primary Key: `id`
- Foreign Key: `flashcard_set_id` REFERENCES `flashcard_sets(id)` ON DELETE CASCADE
- CHECK: `char_length(front) <= 200`
- CHECK: `char_length(back) <= 500`
- NOT NULL: `flashcard_set_id`, `front`, `back`, `created_at`, `updated_at`

---

### 1.4 flashcard_progress

Dane postępu nauki dla algorytmu FSRS (relacja 1:1 z flashcards).

```sql
CREATE TYPE flashcard_state AS ENUM ('New', 'Learning', 'Review', 'Relearning');

CREATE TABLE flashcard_progress (
  id BIGSERIAL PRIMARY KEY,
  flashcard_id BIGINT UNIQUE NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  stability DECIMAL(10, 4),
  difficulty DECIMAL(10, 4),
  elapsed_days INT,
  scheduled_days INT,
  reps INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0,
  state flashcard_state NOT NULL DEFAULT 'New',
  last_review TIMESTAMPTZ,
  due TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**

- `id` (BIGSERIAL, PK) - Unikalny identyfikator rekordu postępu
- `flashcard_id` (BIGINT, UNIQUE, FK→flashcards.id, NOT NULL) - Fiszka, której dotyczy postęp
- `stability` (DECIMAL(10,4)) - Parametr stabilności FSRS
- `difficulty` (DECIMAL(10,4)) - Parametr trudności FSRS
- `elapsed_days` (INT) - Liczba dni od ostatniej powtórki
- `scheduled_days` (INT) - Liczba dni do następnej powtórki
- `reps` (INT, NOT NULL, DEFAULT 0) - Liczba powtórzeń
- `lapses` (INT, NOT NULL, DEFAULT 0) - Liczba pomyłek
- `state` (flashcard_state, NOT NULL, DEFAULT 'New') - Stan fiszki (New/Learning/Review/Relearning)
- `last_review` (TIMESTAMPTZ, nullable) - Data ostatniej powtórki
- `due` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data następnej powtórki

**Ograniczenia:**

- Primary Key: `id`
- Foreign Key: `flashcard_id` REFERENCES `flashcards(id)` ON DELETE CASCADE
- UNIQUE: `flashcard_id`
- NOT NULL: `flashcard_id`, `reps`, `lapses`, `state`, `due`

---

### 1.5 generation_sessions

Metryki sesji generowania fiszek przez AI (immutable).

```sql
CREATE TABLE generation_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_length INT NOT NULL,
  candidates_generated INT NOT NULL,
  generation_time_ms INT NOT NULL,
  candidates_accepted INT NOT NULL DEFAULT 0,
  candidates_rejected INT NOT NULL DEFAULT 0,
  candidates_edited INT NOT NULL DEFAULT 0,
  acceptance_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**

- `id` (BIGSERIAL, PK) - Unikalny identyfikator sesji
- `user_id` (UUID, FK→users.id, NOT NULL) - Użytkownik inicjujący generowanie
- `input_length` (INT, NOT NULL) - Długość tekstu wejściowego w znakach
- `candidates_generated` (INT, NOT NULL) - Liczba wygenerowanych kandydatów
- `generation_time_ms` (INT, NOT NULL) - Czas generowania w milisekundach
- `candidates_accepted` (INT, NOT NULL, DEFAULT 0) - Liczba zaakceptowanych kandydatów
- `candidates_rejected` (INT, NOT NULL, DEFAULT 0) - Liczba odrzuconych kandydatów
- `candidates_edited` (INT, NOT NULL, DEFAULT 0) - Liczba edytowanych kandydatów
- `acceptance_rate` (DECIMAL(5,2)) - Procent akceptacji (0.00-100.00)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data sesji

**Ograniczenia:**

- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- NOT NULL: `user_id`, `input_length`, `candidates_generated`, `generation_time_ms`, `created_at`

---

### 1.6 study_sessions

Agregowane sesje nauki użytkowników.

```sql
CREATE TABLE study_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_set_id BIGINT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  cards_reviewed INT NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2),
  duration_seconds INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Kolumny:**

- `id` (BIGSERIAL, PK) - Unikalny identyfikator sesji
- `user_id` (UUID, FK→users.id, NOT NULL) - Użytkownik uczący się
- `flashcard_set_id` (BIGINT, FK→flashcard_sets.id, NOT NULL) - Zestaw używany w sesji
- `cards_reviewed` (INT, NOT NULL, DEFAULT 0) - Liczba przejrzanych fiszek
- `average_rating` (DECIMAL(3,2)) - Średnia ocena odpowiedzi (1.00-5.00)
- `duration_seconds` (INT) - Czas trwania sesji w sekundach
- `started_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data rozpoczęcia
- `completed_at` (TIMESTAMPTZ, nullable) - Data zakończenia (NULL jeśli sesja aktywna)

**Ograniczenia:**

- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- Foreign Key: `flashcard_set_id` REFERENCES `flashcard_sets(id)` ON DELETE CASCADE
- NOT NULL: `user_id`, `flashcard_set_id`, `cards_reviewed`, `started_at`

---

### 1.7 study_reviews

Granularne odpowiedzi użytkownika na pojedyncze fiszki.

```sql
CREATE TABLE study_reviews (
  id BIGSERIAL PRIMARY KEY,
  study_session_id BIGINT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  flashcard_id BIGINT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  response_time_ms INT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**

- `id` (BIGSERIAL, PK) - Unikalny identyfikator odpowiedzi
- `study_session_id` (BIGINT, FK→study_sessions.id, NOT NULL) - Sesja, do której należy odpowiedź
- `flashcard_id` (BIGINT, FK→flashcards.id, NOT NULL) - Fiszka, której dotyczy odpowiedź
- `rating` (INT, NOT NULL, CHECK 1-5) - Ocena jakości odpowiedzi (1-5)
- `response_time_ms` (INT) - Czas odpowiedzi w milisekundach
- `reviewed_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data odpowiedzi

**Ograniczenia:**

- Primary Key: `id`
- Foreign Key: `study_session_id` REFERENCES `study_sessions(id)` ON DELETE CASCADE
- Foreign Key: `flashcard_id` REFERENCES `flashcards(id)` ON DELETE CASCADE
- CHECK: `rating >= 1 AND rating <= 5`
- NOT NULL: `study_session_id`, `flashcard_id`, `rating`, `reviewed_at`

---

### 1.8 system_logs

Logi systemowe dla monitoringu i audytu.

```sql
CREATE TYPE log_level_type AS ENUM ('INFO', 'WARNING', 'ERROR');

CREATE TABLE system_logs (
  id BIGSERIAL PRIMARY KEY,
  log_level log_level_type NOT NULL DEFAULT 'INFO',
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**

- `id` (BIGSERIAL, PK) - Unikalny identyfikator logu
- `log_level` (log_level_type, NOT NULL, DEFAULT 'INFO') - Poziom logu (INFO/WARNING/ERROR)
- `event_type` (TEXT, NOT NULL) - Typ zdarzenia (np. 'user_registration', 'ai_generation_failed')
- `message` (TEXT, NOT NULL) - Opis zdarzenia
- `user_id` (UUID, FK→users.id, nullable) - Użytkownik związany ze zdarzeniem (jeśli dotyczy)
- `metadata` (JSONB) - Dodatkowe dane kontekstowe w formacie JSON
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Data zdarzenia

**Ograniczenia:**

- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `users(id)` ON DELETE SET NULL
- NOT NULL: `log_level`, `event_type`, `message`, `created_at`

---

## 2. Relacje między tabelami

### 2.1 Relacje jeden-do-wielu (1:N)

**users → flashcard_sets**

- Jeden użytkownik może mieć wiele zestawów fiszek
- Kaskadowe usuwanie: usunięcie użytkownika usuwa wszystkie jego zestawy
- FK: `flashcard_sets.user_id` → `users.id`

**flashcard_sets → flashcards**

- Jeden zestaw może zawierać wiele fiszek
- Kaskadowe usuwanie: usunięcie zestawu usuwa wszystkie jego fiszki
- FK: `flashcards.flashcard_set_id` → `flashcard_sets.id`

**users → generation_sessions**

- Jeden użytkownik może mieć wiele sesji generowania
- Kaskadowe usuwanie: usunięcie użytkownika usuwa historię jego sesji
- FK: `generation_sessions.user_id` → `users.id`

**users → study_sessions**

- Jeden użytkownik może mieć wiele sesji nauki
- Kaskadowe usuwanie: usunięcie użytkownika usuwa historię jego nauki
- FK: `study_sessions.user_id` → `users.id`

**flashcard_sets → study_sessions**

- Jeden zestaw może być używany w wielu sesjach nauki
- Kaskadowe usuwanie: usunięcie zestawu usuwa związane sesje nauki
- FK: `study_sessions.flashcard_set_id` → `flashcard_sets.id`

**study_sessions → study_reviews**

- Jedna sesja nauki zawiera wiele pojedynczych odpowiedzi
- Kaskadowe usuwanie: usunięcie sesji usuwa wszystkie odpowiedzi
- FK: `study_reviews.study_session_id` → `study_sessions.id`

**flashcards → study_reviews**

- Jedna fiszka może być przejrzana wiele razy
- Kaskadowe usuwanie: usunięcie fiszki usuwa historię odpowiedzi
- FK: `study_reviews.flashcard_id` → `flashcards.id`

**users → system_logs**

- Użytkownik może mieć wiele logów systemowych
- ON DELETE SET NULL: usunięcie użytkownika zachowuje logi ale nulluje user_id
- FK: `system_logs.user_id` → `users.id`

### 2.2 Relacje jeden-do-jednego (1:1)

**flashcards → flashcard_progress**

- Każda fiszka ma dokładnie jeden rekord postępu
- Kaskadowe usuwanie: usunięcie fiszki usuwa jej postęp
- FK: `flashcard_progress.flashcard_id` → `flashcards.id` (UNIQUE)

---

## 3. Indeksy

### 3.1 Indeksy automatyczne (Primary Keys i UNIQUE)

```sql
-- Automatycznie tworzone przez PostgreSQL
-- users: id (PK), email (UNIQUE)
-- flashcard_sets: id (PK)
-- flashcards: id (PK)
-- flashcard_progress: id (PK), flashcard_id (UNIQUE)
-- generation_sessions: id (PK)
-- study_sessions: id (PK)
-- study_reviews: id (PK)
-- system_logs: id (PK)
```

### 3.2 Indeksy Foreign Keys

```sql
-- Optymalizacja JOIN-ów i filtrowania
CREATE INDEX idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX idx_flashcards_flashcard_set_id ON flashcards(flashcard_set_id);
CREATE INDEX idx_flashcard_progress_flashcard_id ON flashcard_progress(flashcard_id);
CREATE INDEX idx_generation_sessions_user_id ON generation_sessions(user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_flashcard_set_id ON study_sessions(flashcard_set_id);
CREATE INDEX idx_study_reviews_study_session_id ON study_reviews(study_session_id);
CREATE INDEX idx_study_reviews_flashcard_id ON study_reviews(flashcard_id);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
```

### 3.3 Indeksy kompozytowe

```sql
-- Lista zestawów użytkownika sortowana po dacie
CREATE INDEX idx_flashcard_sets_user_created ON flashcard_sets(user_id, created_at DESC);

-- Fiszki do powtórzenia z opcją JOIN
CREATE INDEX idx_flashcard_progress_flashcard_due ON flashcard_progress(flashcard_id, due);
```

### 3.4 Indeksy częściowe (Partial Indexes)

```sql
-- Optymalizacja zapytań o fiszki do powtórzenia dzisiaj
CREATE INDEX idx_flashcard_progress_due_today ON flashcard_progress(due)
  WHERE due <= NOW();
```

### 3.5 Indeksy analityczne

```sql
-- Filtrowanie metryk generowania po dacie
CREATE INDEX idx_generation_sessions_created_at ON generation_sessions(created_at);

-- Filtrowanie logów
CREATE INDEX idx_system_logs_log_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- Zapytania po zawartości JSONB
CREATE INDEX idx_system_logs_metadata ON system_logs USING GIN(metadata);
```

---

## 4. Funkcje i Triggery

### 4.1 Funkcja pomocnicza dla RLS

```sql
-- Sprawdzanie czy aktualny użytkownik jest administratorem
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

### 4.2 Funkcja automatycznej aktualizacji updated_at

```sql
-- Automatyczne ustawienie updated_at przy UPDATE
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.3 Triggery dla updated_at

```sql
-- Automatyczna aktualizacja timestamp dla tabel z updated_at
CREATE TRIGGER update_flashcard_sets_updated_at
  BEFORE UPDATE ON flashcard_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4.4 Funkcja i trigger dla cards_count

```sql
-- Automatyczne aktualizowanie licznika fiszek w zestawie
CREATE FUNCTION update_flashcard_set_cards_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE flashcard_sets
    SET cards_count = cards_count + 1
    WHERE id = NEW.flashcard_set_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE flashcard_sets
    SET cards_count = cards_count - 1
    WHERE id = OLD.flashcard_set_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_flashcards_cards_count
  AFTER INSERT OR DELETE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_flashcard_set_cards_count();
```

### 4.5 Widok/funkcja dla due_cards_count

```sql
-- Widok obliczający liczbę fiszek do powtórzenia dla każdego zestawu
CREATE VIEW flashcard_sets_with_due_count AS
SELECT
  fs.id,
  fs.user_id,
  fs.title,
  fs.cards_count,
  fs.created_at,
  fs.updated_at,
  COUNT(fp.id) FILTER (WHERE fp.due <= NOW()) AS due_cards_count
FROM flashcard_sets fs
LEFT JOIN flashcards f ON f.flashcard_set_id = fs.id
LEFT JOIN flashcard_progress fp ON fp.flashcard_id = f.id
GROUP BY fs.id;
```

---

## 5. Row Level Security (RLS) Policies

### 5.1 Włączenie RLS dla wszystkich tabel aplikacyjnych

```sql
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
```

### 5.2 Policies dla flashcard_sets

```sql
-- Użytkownicy widzą tylko własne zestawy
CREATE POLICY flashcard_sets_select_policy ON flashcard_sets
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Użytkownicy tworzą zestawy tylko dla siebie
CREATE POLICY flashcard_sets_insert_policy ON flashcard_sets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Użytkownicy edytują tylko własne zestawy
CREATE POLICY flashcard_sets_update_policy ON flashcard_sets
  FOR UPDATE
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid());

-- Użytkownicy usuwają tylko własne zestawy
CREATE POLICY flashcard_sets_delete_policy ON flashcard_sets
  FOR DELETE
  USING (user_id = auth.uid() OR is_admin());
```

### 5.3 Policies dla flashcards

```sql
-- Użytkownicy widzą fiszki ze swoich zestawów
CREATE POLICY flashcards_select_policy ON flashcards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE id = flashcard_set_id
        AND (user_id = auth.uid() OR is_admin())
    )
  );

-- Użytkownicy dodają fiszki do swoich zestawów
CREATE POLICY flashcards_insert_policy ON flashcards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE id = flashcard_set_id AND user_id = auth.uid()
    )
  );

-- Użytkownicy edytują fiszki ze swoich zestawów
CREATE POLICY flashcards_update_policy ON flashcards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE id = flashcard_set_id
        AND (user_id = auth.uid() OR is_admin())
    )
  );

-- Użytkownicy usuwają fiszki ze swoich zestawów
CREATE POLICY flashcards_delete_policy ON flashcards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE id = flashcard_set_id
        AND (user_id = auth.uid() OR is_admin())
    )
  );
```

### 5.4 Policies dla flashcard_progress

```sql
-- Dostęp do postępu przez przynależność fiszki
CREATE POLICY flashcard_progress_select_policy ON flashcard_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flashcards f
      JOIN flashcard_sets fs ON fs.id = f.flashcard_set_id
      WHERE f.id = flashcard_id
        AND (fs.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY flashcard_progress_insert_policy ON flashcard_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flashcards f
      JOIN flashcard_sets fs ON fs.id = f.flashcard_set_id
      WHERE f.id = flashcard_id AND fs.user_id = auth.uid()
    )
  );

CREATE POLICY flashcard_progress_update_policy ON flashcard_progress
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM flashcards f
      JOIN flashcard_sets fs ON fs.id = f.flashcard_set_id
      WHERE f.id = flashcard_id
        AND (fs.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY flashcard_progress_delete_policy ON flashcard_progress
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM flashcards f
      JOIN flashcard_sets fs ON fs.id = f.flashcard_set_id
      WHERE f.id = flashcard_id
        AND (fs.user_id = auth.uid() OR is_admin())
    )
  );
```

### 5.5 Policies dla generation_sessions (immutable dla użytkowników)

```sql
-- Użytkownicy widzą tylko własne metryki
CREATE POLICY generation_sessions_select_policy ON generation_sessions
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Użytkownicy mogą tworzyć własne metryki
CREATE POLICY generation_sessions_insert_policy ON generation_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Brak UPDATE i DELETE dla użytkowników (dane immutable)
-- Administratorzy mają dostęp tylko do odczytu
```

### 5.6 Policies dla study_sessions

```sql
-- Użytkownicy widzą tylko własne sesje
CREATE POLICY study_sessions_select_policy ON study_sessions
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Użytkownicy tworzą tylko własne sesje
CREATE POLICY study_sessions_insert_policy ON study_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Użytkownicy edytują tylko niezakończone własne sesje
CREATE POLICY study_sessions_update_policy ON study_sessions
  FOR UPDATE
  USING (user_id = auth.uid() AND completed_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- Brak DELETE dla użytkowników (historia nauki chroniona)
```

### 5.7 Policies dla study_reviews

```sql
-- Użytkownicy widzą odpowiedzi ze swoich sesji
CREATE POLICY study_reviews_select_policy ON study_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions
      WHERE id = study_session_id
        AND (user_id = auth.uid() OR is_admin())
    )
  );

-- Użytkownicy dodają odpowiedzi tylko do aktywnych własnych sesji
CREATE POLICY study_reviews_insert_policy ON study_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_sessions
      WHERE id = study_session_id
        AND user_id = auth.uid()
        AND completed_at IS NULL
    )
  );

-- Brak UPDATE i DELETE (odpowiedzi są immutable)
```

### 5.8 Policies dla system_logs (tylko administratorzy)

```sql
-- Tylko administratorzy widzą logi
CREATE POLICY system_logs_select_policy ON system_logs
  FOR SELECT
  USING (is_admin());

-- System może tworzyć logi (bez ograniczeń RLS dla service_role)
CREATE POLICY system_logs_insert_policy ON system_logs
  FOR INSERT
  WITH CHECK (true);

-- Brak UPDATE i DELETE (logi są immutable)
```

---

## 6. Uwagi dotyczące implementacji

### 6.1 Decyzje projektowe

**Typy kluczy głównych:**

- `users.id`: UUID (zarządzane przez Supabase Auth)
- Pozostałe tabele: BIGSERIAL (lepsza wydajność sekwencyjnych wstawień, prostsze relacje)

**Strategie usuwania:**

- Hard delete z kaskadowym usuwaniem (`ON DELETE CASCADE`) dla wszystkich relacji zależnych
- Wyjątek: `system_logs.user_id` używa `ON DELETE SET NULL` dla zachowania logów po usunięciu użytkownika

**Kandydaci na fiszki:**

- Nie są zapisywani w bazie danych
- Pozostają w pamięci sesji użytkownika (state management po stronie aplikacji)
- Tylko zaakceptowane/zaedytowane fiszki trafiają do tabeli `flashcards`

**Immutable dane:**

- `generation_sessions`: Brak policies UPDATE/DELETE, dane historyczne chronione
- `study_reviews`: Brak policies UPDATE/DELETE, odpowiedzi niezmienne

**Partycjonowanie:**

- Nie stosowane w MVP
- PostgreSQL radzi sobie z milionami rekordów bez partycjonowania
- Rozważyć w przyszłości dla `study_reviews` i `system_logs` po osiągnięciu skali

### 6.2 Wydajność i optymalizacja

**Indeksowanie:**

- Wszystkie foreign keys mają indeksy B-tree
- Partial index na `flashcard_progress.due` dla zapytań o fiszki do powtórzenia
- Composite index `(user_id, created_at DESC)` dla sortowanych list zestawów
- GIN index na `system_logs.metadata` dla zapytań po JSONB

**Wyszukiwanie:**

- Operator ILIKE bez rozszerzeń full-text search (zgodnie z decyzjami sesji)
- Rekomendacja: rozważyć `pg_trgm` extension dla ILIKE performance w przyszłości

**Liczniki i agregacje:**

- `cards_count` w `flashcard_sets` aktualizowany przez trigger (denormalizacja)
- `due_cards_count` obliczany przez widok (brak denormalizacji)

### 6.3 Bezpieczeństwo

**Row Level Security:**

- Wszystkie tabele aplikacyjne mają włączone RLS
- Funkcja pomocnicza `is_admin()` z `SECURITY DEFINER` dla sprawdzania roli
- Policies używają `auth.uid()` (Supabase Auth)
- Użytkownicy mają dostęp tylko do własnych zasobów
- Administratorzy mają pełny dostęp do odczytu, ograniczony UPDATE/DELETE

**Walidacja danych:**

- CHECK constraints na długość tekstu (`front` ≤200, `back` ≤500)
- CHECK constraints na rating (1-5)
- ENUM types dla type safety (`user_role`, `flashcard_state`, `log_level_type`)

**Audyt:**

- Tabela `system_logs` dla monitorowania błędów i zdarzeń administracyjnych
- Metadata w JSONB dla elastycznego przechowywania kontekstu
- Timestampy ze strefą czasową (`TIMESTAMPTZ`) dla śledzenia zdarzeń

### 6.4 Kompatybilność z Supabase

**Autentykacja:**

- Integracja z Supabase Auth przez `auth.uid()`
- Tabela `users` rozszerza profil użytkownika o kolumnę `role`

**Realtime (opcjonalnie):**

- Schemat wspiera Supabase Realtime subscriptions
- Możliwość obserwacji zmian w `flashcard_sets`, `flashcards` dla UI updates

**Edge Functions:**

- Logika FSRS może być zaimplementowana w Supabase Edge Functions
- Schemat wspiera wywołania funkcji przez kolumny JSONB (`metadata`)

### 6.5 Migracje i wersjonowanie

**Kolejność tworzenia obiektów:**

1. Typy ENUM (`user_role`, `flashcard_state`, `log_level_type`)
2. Tabele w kolejności zależności (users → flashcard_sets → flashcards → flashcard_progress)
3. Indeksy
4. Funkcje (`is_admin()`, `update_updated_at_column()`, `update_flashcard_set_cards_count()`)
5. Triggery
6. Widoki (`flashcard_sets_with_due_count`)
7. Policies RLS

**Rollback strategy:**

- Wszystkie DROP CASCADE dla bezpiecznego cofania migracji
- Backup danych przed migracjami produkcyjnymi
