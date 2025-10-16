# Implementacja UI dla systemu autentykacji

## Przegląd

Zaimplementowano interfejs użytkownika dla systemu logowania, rejestracji i odzyskiwania hasła zgodnie ze specyfikacją z `_ai/auth-spec.md`. Wszystkie komponenty są gotowe do integracji z backendem.

## Utworzone komponenty

### Komponenty React

#### `src/components/auth/LoginForm.tsx`

- Formularz logowania z polami email i hasło
- Walidacja i obsługa błędów
- Stany: idle/loading/success/error
- Komunikaty ogólne przy błędach (bez precyzowania, co jest niepoprawne)
- Props: `onSuccess`, `onError`

#### `src/components/auth/RegisterForm.tsx`

- Formularz rejestracji: email, hasło, potwierdzenie hasła
- Walidacja RFC 5322 dla email
- Walidacja minimum 8 znaków dla hasła
- Sprawdzanie zgodności haseł
- Walidacja w czasie rzeczywistym z komunikatami dla użytkownika
- Props: `onSuccess`, `onError`

#### `src/components/auth/ForgotPasswordRequestForm.tsx`

- Formularz prośby o reset hasła
- Informacja o ręcznym procesie przez administratora (brak automatycznej wysyłki email w MVP)
- Po wysłaniu wyświetla komunikat sukcesu z instrukcją
- Props: `onSuccess`, `onError`

#### `src/components/account/ChangePasswordForm.tsx`

- Formularz zmiany hasła dla zalogowanego użytkownika
- Pola: stare hasło, nowe hasło, potwierdzenie
- Walidacja minimum 8 znaków i zgodności haseł
- Sprawdzanie, czy nowe hasło różni się od starego
- Po sukcesie wyświetla komunikat o unieważnieniu sesji
- Props: `onSuccess`, `onError`

### Layouts

#### `src/layouts/AuthLayout.astro`

- Uproszczony layout dla stron auth (login, register, forgot-password)
- Wycentrowany kontener bez elementów aplikacji
- Maksymalna szerokość 28rem (md)

### Strony Astro

#### `src/pages/login.astro`

- Strona logowania
- Zawiera LoginForm z linkami do rejestracji i odzyskiwania hasła
- Route: `/login`

#### `src/pages/register.astro`

- Strona rejestracji
- Zawiera RegisterForm z linkiem do logowania
- Route: `/register`

#### `src/pages/forgot-password.astro`

- Strona odzyskiwania hasła
- Zawiera ForgotPasswordRequestForm z linkiem powrotu do logowania
- Route: `/forgot-password`

#### `src/pages/account/password.astro`

- Strona zmiany hasła dla zalogowanego użytkownika
- Używa głównego Layout (nie AuthLayout)
- Zawiera ChangePasswordForm z linkiem powrotu
- Route: `/account/password`

## Stylistyka

Wszystkie komponenty wykorzystują:

- Shadcn/ui komponenty (Button, Input)
- Tailwind CSS dla stylizacji
- Lucide React dla ikon (Loader2, Info)
- Spójną paletę kolorów z resztą aplikacji
- Wzorce z istniejącego `GenerateView.tsx`

## Accessibility (ARIA)

Wszystkie formularze zawierają:

- Prawidłowe labelowanie pól
- `aria-required` dla wymaganych pól
- `aria-invalid` dla błędnych pól
- `aria-describedby` dla komunikatów walidacji
- `aria-busy` dla stanów ładowania
- `role="alert"` dla komunikatów błędów
- Unikalne ID generowane przez `useId()`

## Walidacja

### Email

- RFC 5322 regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Komunikat: "Nieprawidłowy format email"

### Hasło

- Minimum 8 znaków
- Sprawdzanie zgodności przy potwierdzeniu
- Komunikaty: "Hasło musi mieć minimum 8 znaków", "Hasła muszą być identyczne"

### Specjalne przypadki

- Zmiana hasła: sprawdza, czy nowe hasło różni się od starego
- Formularz odzyskiwania: waliduje format email przed wysłaniem

## Stany formularzy

Każdy formularz ma 4 stany:

1. **idle** - początkowy stan
2. **loading** - podczas wysyłania (spinner, disabled inputs)
3. **success** - po pomyślnym zakończeniu (niektóre formularze pokazują komunikat sukcesu)
4. **error** - po błędzie (komunikat błędu)

## Integracja z backendem (TODO)

Wszystkie komponenty zawierają zakomentowane sekcje TODO dla wywołań API:

- `POST /api/auth/login` - LoginForm
- `POST /api/auth/register` - RegisterForm
- `POST /api/auth/forgot-password` - ForgotPasswordRequestForm
- `POST /api/auth/change-password` - ChangePasswordForm

Obecnie używają placeholder'ów z `setTimeout(1000)` do symulacji wywołań API.

## Testowanie lokalne

Projektu można przetestować poprzez:

```bash
npm run dev
```

Dostępne ścieżki:

- http://localhost:4321/login
- http://localhost:4321/register
- http://localhost:4321/forgot-password
- http://localhost:4321/account/password

## Status

✅ Wszystkie komponenty UI zaimplementowane
✅ Lint przechodzi bez błędów
✅ Build przechodzi pomyślnie
⏳ Oczekuje na implementację backendu (API endpoints)
⏳ Oczekuje na implementację middleware dla ochrony tras
⏳ Oczekuje na implementację zarządzania sesją

## Zgodność ze specyfikacją

Implementacja jest zgodna z:

- `_ai/auth-spec.md` - specyfikacja architektury UI
- `.cursor/rules/astro.mdc` - zasady dla Astro
- `.cursor/rules/react.mdc` - zasady dla React
- Stylistyka z `src/pages/generate.astro`
