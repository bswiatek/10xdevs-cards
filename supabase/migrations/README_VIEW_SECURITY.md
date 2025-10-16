# View Security - flashcard_sets_with_due_count

## Problem

W PostgreSQL widoki (views) domyślnie działają z uprawnieniami właściciela widoku (SECURITY DEFINER), co oznacza, że **omijają polityki RLS** z tabel bazowych. 

Przed migracją `20251016181407_secure_flashcard_sets_view.sql`, widok `flashcard_sets_with_due_count` umożliwiał dostęp do wszystkich danych niezależnie od polityk RLS na tabelach `flashcard_sets`, `flashcards` i `flashcard_progress`.

## Rozwiązanie

Migracja `20251016181407_secure_flashcard_sets_view.sql` odtwarza widok z opcją `security_invoker = true`, która:

1. **Wykonuje widok z uprawnieniami użytkownika** wywołującego zapytanie (nie właściciela widoku)
2. **Respektuje polityki RLS** z tabel bazowych
3. **Zapewnia izolację danych** - użytkownicy widzą tylko własne dane

## Weryfikacja

Sprawdź, że widok ma włączoną opcję `security_invoker`:

```sql
SELECT c.relname, c.reloptions 
FROM pg_class c 
WHERE c.relkind = 'v' 
  AND c.relname = 'flashcard_sets_with_due_count';
```

Powinno zwrócić:
```
relname                        | reloptions
-------------------------------+-------------------------
flashcard_sets_with_due_count | {security_invoker=true}
```

## Testowanie RLS na widoku

### Test 1: Zalogowany użytkownik widzi tylko swoje dane

```sql
-- Ustaw kontekst użytkownika (w Supabase automatycznie ustawiane przez auth)
SET LOCAL "request.jwt.claim.sub" TO '<user-uuid>';

-- Powinno zwrócić tylko dane tego użytkownika
SELECT * FROM flashcard_sets_with_due_count;
```

### Test 2: Anonimowi użytkownicy nie widzą danych

```sql
-- Ustaw kontekst jako anon
SET ROLE anon;

-- Powinno zwrócić 0 wierszy
SELECT * FROM flashcard_sets_with_due_count;
```

## Uwagi

- Wszystkie widoki, które bazują na tabelach z RLS, powinny używać `security_invoker = true`
- Alternatywnie można używać `security_barrier = true`, ale `security_invoker` jest preferowane dla widoków zależnych od RLS
- W aplikacji używaj klienta Supabase z kontekstem zalogowanego użytkownika (`context.locals.supabase`)

## Dodatkowe zasoby

- [PostgreSQL Security Invoker Views](https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-SECURITY)
- [Supabase Views and RLS](https://supabase.com/docs/guides/database/postgres/views#security-considerations)
