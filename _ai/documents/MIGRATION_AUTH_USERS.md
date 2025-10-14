# Migracja z tabeli `users` na `auth.users`

## Problem

Aplikacja używała własnej tabeli `users` do zarządzania użytkownikami, co duplikowało funkcjonalność Supabase Auth (`auth.users`). Powodowało to błędy foreign key przy próbie zapisywania danych dla zalogowanych użytkowników:

```json
{
  "error": "insert or update on table \"generation_sessions\" violates foreign key constraint \"generation_sessions_user_id_fkey\""
}
```

## Rozwiązanie

Migracja usuwa własną tabelę `users` i wszystkie odniesienia do niej, zastępując je bezpośrednimi odniesieniami do `auth.users` z Supabase Auth.

## Co robi migracja?

### 1. Usuwa stare polityki RLS
- Usuwa wszystkie polityki które używały funkcji `is_admin()`
- Czyści polityki dla nieistniejącej już tabeli `users`

### 2. Usuwa powiązania z tabelą `users`
- Usuwa foreign key constraints z tabel:
  - `flashcard_sets`
  - `generation_sessions`
  - `study_sessions`
  - `system_logs`
- Usuwa indeksy na kolumnach `user_id`

### 3. Usuwa tabelę `users` i powiązane obiekty
- Usuwa funkcję `is_admin()` (nie jest już potrzebna)
- Usuwa typ enum `user_role` (bez systemu ról)
- Usuwa tabelę `users` całkowicie

### 4. Tworzy nowe powiązania z `auth.users`
- Dodaje foreign key constraints wskazujące na `auth.users`:
  - `flashcard_sets.user_id` → `auth.users(id)` ON DELETE CASCADE
  - `generation_sessions.user_id` → `auth.users(id)` ON DELETE CASCADE
  - `study_sessions.user_id` → `auth.users(id)` ON DELETE CASCADE
  - `system_logs.user_id` → `auth.users(id)` ON DELETE SET NULL

### 5. Odtwarza indeksy
- Tworzy indeksy na kolumnach `user_id` dla wydajności zapytań

### 6. Tworzy uproszczone polityki RLS
- Wszystkie polityki używają teraz tylko `auth.uid()`
- Usunięto całą logikę administratora (można dodać później jeśli potrzebne)
- Użytkownicy mają dostęp tylko do swoich danych

## Jak uruchomić migrację?

### Opcja 1: Przez Supabase CLI (zalecane dla lokalnego developmentu)

```bash
# Upewnij się że masz uruchomiony lokalny Supabase
supabase status

# Zastosuj migrację
supabase db push

# Lub zresetuj bazę i zastosuj wszystkie migracje od początku
supabase db reset
```

### Opcja 2: Przez Supabase Dashboard (dla produkcji)

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **SQL Editor**
4. Skopiuj zawartość pliku `supabase/migrations/20251014000000_migrate_to_auth_users.sql`
5. Wklej do SQL Editor i uruchom

### Opcja 3: Automatyczne przez Supabase (po push do repozytorium)

Jeśli masz skonfigurowane GitHub integration:
```bash
git add supabase/migrations/20251014000000_migrate_to_auth_users.sql
git commit -m "Migrate from users table to auth.users"
git push
```

Supabase automatycznie wykryje nową migrację i zaaplikuje ją.

## Weryfikacja migracji

Po uruchomieniu migracji sprawdź:

### 1. Sprawdź czy tabela `users` została usunięta

```sql
-- To zapytanie powinno zwrócić błąd "relation does not exist"
SELECT * FROM users;
```

### 2. Sprawdź foreign keys

```sql
-- Sprawdź czy foreign keys wskazują na auth.users
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';
```

Powinno pokazać że wszystkie `user_id` foreign keys wskazują na `auth.users`.

### 3. Sprawdź polityki RLS

```sql
-- Lista polityk dla flashcard_sets
SELECT * FROM pg_policies WHERE tablename = 'flashcard_sets';
```

Polityki powinny używać tylko `auth.uid()`, bez `is_admin()`.

### 4. Przetestuj tworzenie fiszek

Zaloguj się w aplikacji i spróbuj wygenerować fiszki. Nie powinno być już błędu foreign key.

## Co się zmienia w aplikacji?

### Brak zmian w kodzie! 🎉

Kod aplikacji **nie wymaga żadnych zmian**, ponieważ:

1. Wszystkie serwisy już używają `userId` jako parametru ✅
2. Endpointy API już pobierają `user.id` z `supabase.auth.getUser()` ✅
3. Foreign keys są transparentne dla aplikacji ✅

Migracja to **tylko zmiana struktury bazy danych**.

## Rollback (w razie problemów)

Jeśli migracja spowoduje problemy, możesz wrócić do poprzedniej wersji:

### Dla lokalnego Supabase:

```bash
# Reset do poprzedniego stanu
supabase db reset
```

Następnie zakomentuj lub usuń plik migracji `20251014000000_migrate_to_auth_users.sql`.

### Dla produkcji:

**WAŻNE:** Przed uruchomieniem migracji na produkcji:
1. **Zrób backup bazy danych**
2. Przetestuj migrację na środowisku staging/dev
3. Upewnij się że nie ma aktywnych użytkowników w systemie

Rollback na produkcji będzie wymagał manualnej interwencji.

## Checklist przed migracją na produkcji

- [ ] Wykonano backup bazy danych
- [ ] Przetestowano migrację lokalnie
- [ ] Sprawdzono czy wszyscy użytkownicy w `users` są w `auth.users`
- [ ] Zaplanowano okno serwisowe (jeśli potrzebne)
- [ ] Przygotowano plan rollback
- [ ] Powiadomiono użytkowników o możliwych przerwach

## Możliwe problemy

### Problem: Użytkownicy w `users` ale nie w `auth.users`

Jeśli masz użytkowników w tabeli `users` którzy nie istnieją w `auth.users`, migracja usunie ich dane (ON DELETE CASCADE).

**Rozwiązanie przed migracją:**

```sql
-- Sprawdź użytkowników którzy nie istnieją w auth.users
SELECT u.id, u.email
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL;
```

Jeśli są tacy użytkownicy, musisz zdecydować:
1. Ręcznie utworzyć ich w auth.users (przez Supabase Auth)
2. Zaakceptować utratę ich danych
3. Zmodyfikować migrację by najpierw przenieść dane

### Problem: Mock user był tylko w `users`

Zamockowany użytkownik (`06f9f64c-fd4a-4466-9954-0e35ce6dfd15`) prawdopodobnie istnieje tylko w `users`, nie w `auth.users`.

**Rozwiązanie:** 
- Dane tego użytkownika zostaną usunięte podczas migracji
- To jest oczekiwane zachowanie - chcemy używać tylko prawdziwych użytkowników z auth
- Możesz utworzyć testowego użytkownika przez normalną rejestrację

## Wsparcie

Jeśli napotkasz problemy podczas migracji:

1. Sprawdź logi Supabase
2. Sprawdź czy wszystkie poprzednie migracje zostały zaaplikowane
3. Sprawdź czy lokalna baza danych jest w sync z produkcją
4. W razie wątpliwości - wykonaj rollback i skontaktuj się z zespołem

---

**Status:** ✅ Gotowe do testowania lokalnie  
**Data utworzenia:** 2025-10-14  
**Autor:** Database Migration System
