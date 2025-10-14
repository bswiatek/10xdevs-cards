# Quickstart: Logowanie i rejestracja

## 🚀 Co zostało zaimplementowane?

### Podstawowe funkcje
- ✅ Rejestracja użytkownika (`/register`)
- ✅ Logowanie użytkownika (`/login`)
- ✅ Wylogowanie (przycisk w nawigacji)
- ✅ Ochrona chronionych stron (redirect do `/login`)
- ✅ Redirect zalogowanych ze stron auth (do `/generate`)

### Techniczne
- ✅ Supabase SSR z cookies
- ✅ Walidacja Zod (client + server)
- ✅ TypeScript (pełne typowanie)
- ✅ Accessibility (ARIA)

## 📦 Zainstalowane pakiety

```bash
npm install zod @supabase/ssr
```

## 🔧 Szybki start

### 1. Sprawdź zmienne środowiskowe

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 2. Build projektu

```bash
npm run build
```

### 3. Uruchom dev server

```bash
npm run dev
```

### 4. Testuj

- Otwórz `http://localhost:4321/register`
- Zarejestruj nowe konto
- Zostaniesz automatycznie przekierowany do `/generate`

## 📝 API Endpoints

### POST `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirm": "password123"
}
```

### POST `/api/auth/logout`
```json
{}
```

## 🛣️ Flow użytkownika

```
REJESTRACJA:
/register → POST /api/auth/register → auto-login → redirect /generate

LOGOWANIE:
/login → POST /api/auth/login → redirect /generate

WYLOGOWANIE:
Click "Wyloguj" → POST /api/auth/logout → redirect /login

CHRONIONE STRONY:
/generate, /review/*, /account/password
→ jeśli niezalogowany: redirect /login
```

## 🔒 Bezpieczeństwo

- Hasła: minimum 8 znaków
- Email: walidacja RFC 5322
- Błędy: ogólne komunikaty (nie ujawniają szczegółów)
- Sesje: HTTP-only cookies
- Role: w `user_metadata.role` (default: "user")

## 📂 Kluczowe pliki

```
src/
├── db/supabase.client.ts          # SSR client
├── lib/validations/auth.ts        # Zod schemas
├── pages/api/auth/
│   ├── login.ts                   # Login endpoint
│   ├── register.ts                # Register endpoint
│   └── logout.ts                  # Logout endpoint
├── components/auth/
│   ├── LoginForm.tsx              # Login form
│   ├── RegisterForm.tsx           # Register form
│   └── LogoutButton.tsx           # Logout button
└── layouts/Layout.astro           # + navigation
```

## 📖 Dokumentacja

- Pełna dokumentacja: `_ai/documents/login-integration-implementation.md`
- Przewodnik testowania: `_ai/documents/login-testing-guide.md`
- Specyfikacja: `_ai/auth-spec.md`

## ⚠️ TODO (poza zakresem tego zadania)

- [ ] Zmiana hasła (`/api/auth/change-password`)
- [ ] Forgot password flow
- [ ] Panel administracyjny
- [ ] RLS policies w Supabase

## 🐛 Troubleshooting

**Błąd: "cookies.getAll is not a function"?**
→ ✅ **NAPRAWIONE** - Astro 5 nie ma metody `getAll()`, zaimplementowano manualną iterację

**Sesja nie jest utrzymywana?**
→ Sprawdź czy cookies są ustawiane w DevTools

**"Nie udało się utworzyć sesji"?**
→ Sprawdź SUPABASE_URL i SUPABASE_KEY

**TypeScript errors?**
→ `npm run build` powinien przejść bez błędów

## 🔧 Rozwiązane problemy

### Astro 5 Cookies API
- **Problem:** `AstroCookies` nie posiada metody `getAll()`
- **Rozwiązanie:** Manualna iteracja przez wzorce cookies Supabase
- **Status:** ✅ Działa poprawnie

---

✅ **Status:** Gotowe do użycia (przetestowane)
📅 **Data:** 2025-10-14
🐛 **Bugfix:** cookies.getAll → manual iteration
