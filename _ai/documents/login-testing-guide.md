# Przewodnik testowania integracji logowania

## Przygotowanie środowiska

### 1. Wymagane zmienne środowiskowe

Upewnij się, że masz w pliku `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 2. Uruchomienie serwera deweloperskiego

```bash
npm run dev
```

Aplikacja powinna być dostępna pod adresem `http://localhost:4321`

## Scenariusze testowe

### ✅ Test 1: Rejestracja nowego użytkownika

1. Otwórz `http://localhost:4321/register`
2. Wprowadź dane:
   - Email: `test@example.com`
   - Hasło: `testpassword123` (min. 8 znaków)
   - Potwierdzenie: `testpassword123`
3. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**

- ✅ Przekierowanie na `/generate`
- ✅ Widoczna nawigacja z przyciskiem "Wyloguj"
- ✅ Użytkownik zalogowany automatycznie

**Weryfikacja w Supabase Dashboard:**

- Sprawdź w Authentication → Users czy użytkownik został utworzony
- Sprawdź czy w `user_metadata` jest `role: "user"`

### ✅ Test 2: Logowanie istniejącego użytkownika

1. Otwórz `http://localhost:4321/login`
2. Wprowadź dane z Testu 1:
   - Email: `test@example.com`
   - Hasło: `testpassword123`
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ✅ Przekierowanie na `/generate`
- ✅ Widoczna nawigacja z przyciskiem "Wyloguj"

### ✅ Test 3: Nieprawidłowe dane logowania

1. Otwórz `http://localhost:4321/login`
2. Wprowadź nieprawidłowe dane:
   - Email: `test@example.com`
   - Hasło: `wrongpassword`
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ✅ Pozostanie na stronie `/login`
- ✅ Komunikat błędu: "Nieprawidłowe dane logowania"
- ✅ Brak informacji, które pole jest błędne (security)

### ✅ Test 4: Walidacja formularza rejestracji

1. Otwórz `http://localhost:4321/register`
2. Test A - Nieprawidłowy email:
   - Email: `invalid-email`
   - Hasło: `testpassword123`
   - Potwierdzenie: `testpassword123`
   - Kliknij "Zarejestruj się"
   - **Oczekiwany rezultat:** Błąd "Nieprawidłowy format email"

3. Test B - Za krótkie hasło:
   - Email: `test2@example.com`
   - Hasło: `short`
   - Potwierdzenie: `short`
   - Kliknij "Zarejestruj się"
   - **Oczekiwany rezultat:** Błąd "Hasło musi mieć minimum 8 znaków"

4. Test C - Niezgodne hasła:
   - Email: `test2@example.com`
   - Hasło: `testpassword123`
   - Potwierdzenie: `differentpassword`
   - Kliknij "Zarejestruj się"
   - **Oczekiwany rezultat:** Błąd "Hasła muszą być identyczne"

### ✅ Test 5: Duplikat email przy rejestracji

1. Otwórz `http://localhost:4321/register`
2. Wprowadź email już użyty w Teście 1:
   - Email: `test@example.com`
   - Hasło: `testpassword123`
   - Potwierdzenie: `testpassword123`
3. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**

- ✅ Komunikat błędu: "Konto z tym adresem email już istnieje"

### ✅ Test 6: Wylogowanie

1. Będąc zalogowanym, kliknij przycisk "Wyloguj" w nawigacji
2. Obserwuj spinner podczas wylogowania

**Oczekiwany rezultat:**

- ✅ Przekierowanie na `/login`
- ✅ Brak przycisku "Wyloguj" na stronie logowania
- ✅ Sesja wyczyszczona (sprawdź cookies w DevTools)

### ✅ Test 7: Ochrona tras - dostęp bez logowania

1. Wyloguj się (jeśli jesteś zalogowany)
2. Spróbuj otworzyć chronione strony:
   - `http://localhost:4321/generate`
   - `http://localhost:4321/account/password`

**Oczekiwany rezultat:**

- ✅ Automatyczne przekierowanie na `/login`

### ✅ Test 8: Redirect zalogowanego użytkownika ze stron auth

1. Zaloguj się
2. Spróbuj otworzyć:
   - `http://localhost:4321/login`
   - `http://localhost:4321/register`

**Oczekiwany rezultat:**

- ✅ Automatyczne przekierowanie na `/generate`

### ✅ Test 9: Strona główna

1. Test A - Niezalogowany:
   - Otwórz `http://localhost:4321/`
   - **Oczekiwany rezultat:** Widoczna strona Welcome

2. Test B - Zalogowany:
   - Zaloguj się i otwórz `http://localhost:4321/`
   - **Oczekiwany rezultat:** Automatyczne przekierowanie na `/generate`

### ✅ Test 10: Persistence sesji

1. Zaloguj się na `http://localhost:4321/login`
2. Odśwież stronę (F5)
3. Przejdź na inną chronioną stronę

**Oczekiwany rezultat:**

- ✅ Pozostajesz zalogowany
- ✅ Brak konieczności ponownego logowania
- ✅ Sesja utrzymana w cookies

### ✅ Test 11: Nawigacja w aplikacji

1. Będąc zalogowanym:
2. Kliknij link "Generuj" w nawigacji
3. Kliknij link "Moje zestawy" w nawigacji

**Oczekiwany rezultat:**

- ✅ Nawigacja działa poprawnie
- ✅ Przycisk "Wyloguj" widoczny na każdej stronie

## Testy DevTools

### Sprawdzenie cookies

1. Zaloguj się
2. Otwórz DevTools (F12)
3. Przejdź do zakładki "Application" → "Cookies"
4. Sprawdź obecność cookies Supabase:
   - `sb-{project-ref}-auth-token`
   - `sb-{project-ref}-auth-token.0`
   - `sb-{project-ref}-auth-token.1`

### Sprawdzenie Network

1. Otwórz DevTools → Network
2. Wykonaj logowanie
3. Sprawdź request do `/api/auth/login`:
   - ✅ Method: POST
   - ✅ Status: 200
   - ✅ Response zawiera `success: true` i dane użytkownika

### Sprawdzenie Console

1. Otwórz DevTools → Console
2. Wykonaj różne akcje (login, logout, etc.)
3. Sprawdź, czy:
   - ✅ Brak błędów JavaScript
   - ✅ Błędy API są logowane tylko w przypadku rzeczywistych problemów

## Test API z curl

### Login

```bash
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Oczekiwana odpowiedź:**

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### Register

```bash
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "newpassword123",
    "confirm": "newpassword123"
  }'
```

**Oczekiwana odpowiedź:**

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

### Logout

```bash
curl -X POST http://localhost:4321/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-..." \
  -d '{}'
```

**Oczekiwana odpowiedź:**

```json
{
  "success": true
}
```

## Checklist przed wdrożeniem

- [ ] Wszystkie testy scenariuszowe przechodzą
- [ ] Brak błędów w console
- [ ] Brak błędów TypeScript (`npm run build`)
- [ ] Cookies są prawidłowo ustawiane i czyszczone
- [ ] Redirecty działają poprawnie
- [ ] Walidacja działa po stronie klienta i serwera
- [ ] Komunikaty błędów są bezpieczne (nie ujawniają szczegółów)
- [ ] Nawigacja z przyciskiem wylogowania widoczna na wszystkich chronionych stronach
- [ ] Role użytkowników są prawidłowo ustawiane w Supabase

## Troubleshooting

### Problem: "Nie udało się utworzyć sesji"

**Rozwiązanie:** Sprawdź konfigurację Supabase i poprawność SUPABASE_URL i SUPABASE_KEY

### Problem: Redirect loop

**Rozwiązanie:** Sprawdź czy middleware działa poprawnie i czy cookies są ustawiane

### Problem: Sesja nie jest utrzymywana po odświeżeniu

**Rozwiązanie:** Sprawdź czy SSR client jest prawidłowo skonfigurowany i czy cookies są HttpOnly

### Problem: CORS errors

**Rozwiązanie:** Upewnij się, że używasz tego samego origin (localhost:4321) i że Supabase jest prawidłowo skonfigurowany

## Dalsze kroki

Po pomyślnym przejściu testów, możesz przejść do implementacji:

1. Endpointu zmiany hasła (`/api/auth/change-password`)
2. Formularza "Forgot Password"
3. Panelu administracyjnego (`/admin/users`)

---

**Dokument utworzony:** 2025-10-14
**Status:** Gotowy do testów
