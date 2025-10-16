# Atrybuty data-test-id dla scenariusza E2E

## Przegląd scenariusza testowego

Ten dokument zawiera listę wszystkich atrybutów `data-test-id` dodanych do komponentów w aplikacji, które są używane w scenariuszu testów E2E.

## 1. Strona logowania (/login)

### LoginForm.tsx
- `data-test-id="login-form"` - Formularz logowania
- `data-test-id="login-email-input"` - Pole email
- `data-test-id="login-password-input"` - Pole hasła
- `data-test-id="login-submit-button"` - Przycisk "Zaloguj się"

**Przykład użycia:**
```typescript
await page.getByTestId('login-email-input').fill('user@example.com');
await page.getByTestId('login-password-input').fill('password123');
await page.getByTestId('login-submit-button').click();
```

## 2. Strona generowania (/generate)

### SourceTextArea.tsx
- `data-test-id="generate-source-textarea"` - Pole tekstowe do wprowadzenia tekstu źródłowego

### GenerateButton.tsx
- `data-test-id="generate-submit-button"` - Przycisk "Generuj fiszki"

### LoadingOverlay.tsx
- `data-test-id="generate-loading-overlay"` - Modal z komunikatem "Generowanie fiszek..."

**Przykład użycia:**
```typescript
await page.getByTestId('generate-source-textarea').fill('Długi tekst źródłowy...');
await page.getByTestId('generate-submit-button').click();
await page.getByTestId('generate-loading-overlay').waitFor({ state: 'hidden' });
```

## 3. Strona recenzji kandydatów (/review/[id])

### ReviewHeader.tsx
- `data-test-id="review-accept-all-button"` - Przycisk "Zaakceptuj wszystkie"
- `data-test-id="review-save-set-button"` - Przycisk "Zapisz zestaw"

### SaveSetTitleModal.tsx
- `data-test-id="save-set-title-modal"` - Modal do nadania tytułu zestawowi
- `data-test-id="save-set-title-input"` - Pole do wprowadzenia tytułu zestawu
- `data-test-id="save-set-confirm-button"` - Przycisk "Zapisz zestaw" w modalu

**Przykład użycia:**
```typescript
await page.getByTestId('review-accept-all-button').click();
await page.getByTestId('review-save-set-button').click();
await page.getByTestId('save-set-title-input').fill('Mój zestaw testowy');
await page.getByTestId('save-set-confirm-button').click();
```

## 4. Strona szczegółów zestawu (/sets/[id])

### SetHeader.tsx
- `data-test-id="set-delete-button"` - Ikona kosza do usunięcia zestawu

### ConfirmDialog.tsx
- `data-test-id="confirm-dialog"` - Modal potwierdzenia
- `data-test-id="confirm-dialog-confirm-button"` - Przycisk "Usuń zestaw" w modalu potwierdzenia

**Przykład użycia:**
```typescript
await page.getByTestId('set-delete-button').click();
await page.getByTestId('confirm-dialog-confirm-button').click();
```

## 5. Dashboard (/dashboard)

### Layout.astro
- `data-test-id="nav-dashboard-link"` - Link "Dashboard" w nawigacji

### SetCard.tsx
- `data-test-id="dashboard-set-card"` - Karta zestawu na dashboardzie
- `data-set-id="{id}"` - Atrybut przechowujący ID zestawu

**Przykład użycia:**
```typescript
await page.getByTestId('nav-dashboard-link').click();
const setCard = page.getByTestId('dashboard-set-card').filter({ has: page.getByText('Mój zestaw testowy') });
await setCard.click();
```

## 6. Wylogowanie

### LogoutButton.tsx
- `data-test-id="logout-button"` - Przycisk "Wyloguj"

**Przykład użycia:**
```typescript
await page.getByTestId('logout-button').click();
```

## Pełny przykładowy scenariusz testu E2E

```typescript
import { test, expect } from '@playwright/test';

test('pełny przepływ: logowanie -> generowanie -> recenzja -> zapis -> dashboard -> usunięcie -> wylogowanie', async ({ page }) => {
  const uniqueTitle = `Test Set ${Date.now()}`;
  
  // 1. Logowanie
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill('test@example.com');
  await page.getByTestId('login-password-input').fill('password123');
  await page.getByTestId('login-submit-button').click();
  
  // 2. Przekierowanie na /generate i wypełnienie formularza
  await expect(page).toHaveURL('/generate');
  const longText = 'a'.repeat(1500); // Minimum 1000 znaków
  await page.getByTestId('generate-source-textarea').fill(longText);
  await page.getByTestId('generate-submit-button').click();
  
  // 3. Czekanie aż modal zniknie i przekierowanie na /review/[id]
  await page.getByTestId('generate-loading-overlay').waitFor({ state: 'visible' });
  await page.getByTestId('generate-loading-overlay').waitFor({ state: 'hidden', timeout: 70000 });
  await expect(page).toHaveURL(/\/review\/\d+/);
  
  // 4. Akceptacja wszystkich i zapisanie zestawu
  await page.getByTestId('review-accept-all-button').click();
  await page.getByTestId('review-save-set-button').click();
  await page.getByTestId('save-set-title-input').fill(uniqueTitle);
  await page.getByTestId('save-set-confirm-button').click();
  
  // 5. Przekierowanie na /sets/[id]
  await expect(page).toHaveURL(/\/sets\/\d+/);
  
  // 6. Kliknięcie w link Dashboard
  await page.getByTestId('nav-dashboard-link').click();
  await expect(page).toHaveURL('/dashboard');
  
  // 7. Weryfikacja czy zestaw jest widoczny i kliknięcie w jego nazwę
  const setCard = page.getByTestId('dashboard-set-card').filter({ has: page.getByText(uniqueTitle) });
  await expect(setCard).toBeVisible();
  await setCard.click();
  
  // 8. Usunięcie zestawu
  await page.getByTestId('set-delete-button').click();
  await page.getByTestId('confirm-dialog').waitFor({ state: 'visible' });
  await page.getByTestId('confirm-dialog-confirm-button').click();
  
  // 9. Weryfikacja przekierowania na dashboard
  await expect(page).toHaveURL('/');
  
  // 10. Wylogowanie
  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL('/login');
});
```

## Notatki

- Wszystkie atrybuty `data-test-id` są unikalne w kontekście danej strony/widoku
- Atrybuty są w języku angielskim z kebab-case
- Wartości są opisowe i odpowiadają akcji/znaczeniu elementu
- Modal loading overlay znika automatycznie po zakończeniu generowania
- Modal potwierdzenia usunięcia zestawu używa tego samego komponentu ConfirmDialog, więc ma te same test-id
- Karta zestawu na dashboardzie ma dodatkowy atrybut `data-set-id` dla łatwiejszej identyfikacji konkretnego zestawu

## Page Object Models

Dla wszystkich kluczowych komponentów zostały utworzone dedykowane klasy Page Object Model (POM) w katalogu `tests/page-objects/`:

- **LoginPage** - Strona logowania
- **GeneratePage** - Strona generowania fiszek
- **ReviewPage** - Strona recenzji kandydatów
- **SaveSetTitleModal** - Modal zapisu zestawu z tytułem
- **SetDetailsPage** - Strona szczegółów zestawu
- **ConfirmDialog** - Modal potwierdzenia (usuwanie)
- **DashboardPage** - Dashboard z listą zestawów
- **NavigationComponent** - Komponent nawigacji

Więcej informacji i przykłady użycia znajdziesz w [tests/page-objects/README.md](tests/page-objects/README.md).

Przykładowy test z użyciem POM znajduje się w [tests/e2e/flashcard-generation-flow.spec.ts](tests/e2e/flashcard-generation-flow.spec.ts).
