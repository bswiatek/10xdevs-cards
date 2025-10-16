# Page Object Models (POM)

This directory contains Page Object Model classes for E2E testing with Playwright. Each class encapsulates the interactions and locators for a specific page or component in the application.

## Overview

The Page Object Model (POM) pattern helps maintain clean, reusable, and maintainable test code by:

- Separating page-specific logic from test logic
- Providing a single source of truth for locators
- Making tests more readable and easier to understand
- Reducing code duplication across tests

## Available Page Objects

### Pages

#### `LoginPage`
Handles login page interactions (`/login`)
- Email/password input
- Login submission
- Error handling
- Navigation to other auth pages

#### `GeneratePage`
Manages flashcard generation from source text (`/generate`)
- Source text input
- Generate button interaction
- Loading state handling
- Character count validation

#### `ReviewPage`
Controls candidate review and set creation (`/review/[id]`)
- Accept/reject candidates
- Accept all functionality
- Counter tracking (accepted, rejected, remaining)
- Save set initiation

#### `DashboardPage`
Manages flashcard sets listing (`/` or `/dashboard`)
- Set cards display
- Search functionality
- Set selection by title or ID
- Navigation to other pages

#### `SetDetailsPage`
Handles individual set management (`/sets/[id]`)
- Set information display
- Deletion functionality
- Study initiation
- Navigation

### Components

#### `NavigationComponent`
Global navigation bar interactions
- Dashboard navigation
- Generate page navigation
- Logout functionality

#### `SaveSetTitleModal`
Modal for saving flashcard set with title
- Title input
- Validation handling
- Confirm/cancel actions

#### `ConfirmDialog`
Generic confirmation dialog (used for deletions)
- Dialog content access
- Confirm/cancel actions
- Visibility management

## Usage Examples

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../page-objects';

test('user can view dashboard after login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Navigate and login
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  
  // Verify dashboard is accessible
  await expect(page).toHaveURL('/dashboard');
  await expect(dashboardPage.pageTitle).toBeVisible();
});
```

### Complete Flow Test

```typescript
import { test, expect } from '@playwright/test';
import {
  LoginPage,
  GeneratePage,
  ReviewPage,
  SaveSetTitleModal,
  DashboardPage
} from '../page-objects';

test('complete flashcard creation flow', async ({ page }) => {
  // Initialize page objects
  const loginPage = new LoginPage(page);
  const generatePage = new GeneratePage(page);
  const reviewPage = new ReviewPage(page);
  const saveTitleModal = new SaveSetTitleModal(page);
  const dashboardPage = new DashboardPage(page);

  // Login
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');

  // Generate flashcards
  await generatePage.fillSourceText('a'.repeat(1500));
  await generatePage.clickGenerate();
  await generatePage.waitForLoadingToComplete();

  // Review and save
  await reviewPage.clickAcceptAll();
  await reviewPage.clickSaveSet();
  await saveTitleModal.saveSet('My Test Set');

  // Verify on dashboard
  await dashboardPage.goto();
  const hasSet = await dashboardPage.hasSetWithTitle('My Test Set');
  expect(hasSet).toBe(true);
});
```

### Modal Interactions

```typescript
import { test, expect } from '@playwright/test';
import { SetDetailsPage, ConfirmDialog } from '../page-objects';

test('user can delete a set with confirmation', async ({ page }) => {
  const setDetailsPage = new SetDetailsPage(page);
  const confirmDialog = new ConfirmDialog(page);

  await setDetailsPage.goto(123);
  await setDetailsPage.clickDelete();
  
  await confirmDialog.waitForVisible();
  await expect(confirmDialog.dialog).toBeVisible();
  
  const title = await confirmDialog.getTitle();
  expect(title).toContain('Usuń zestaw');
  
  await confirmDialog.confirmAndWait();
  await setDetailsPage.waitForDashboardRedirect();
});
```

### Navigation

```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage, NavigationComponent } from '../page-objects';

test('user can navigate between pages', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  const navigation = new NavigationComponent(page);

  await dashboardPage.goto();
  
  // Navigate to generate
  await navigation.goToGenerate();
  await expect(page).toHaveURL('/generate');
  
  // Navigate back to dashboard
  await navigation.goToDashboard();
  await expect(page).toHaveURL('/dashboard');
  
  // Logout
  await navigation.logout();
  await expect(page).toHaveURL('/login');
});
```

## Best Practices

### 1. Use Locators from Page Objects

❌ **Bad:**
```typescript
await page.getByTestId('login-submit-button').click();
```

✅ **Good:**
```typescript
const loginPage = new LoginPage(page);
await loginPage.clickLogin();
```

### 2. Keep Tests Readable

Use descriptive method names and test steps:

```typescript
test('user journey', async ({ page }) => {
  await test.step('User logs in', async () => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);
  });

  await test.step('User creates flashcard set', async () => {
    // ... test logic
  });
});
```

### 3. Initialize Page Objects as Needed

Only create page objects when you need them:

```typescript
test('specific feature', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  
  // Only create when needed
  const dashboardPage = new DashboardPage(page);
  await expect(dashboardPage.pageTitle).toBeVisible();
});
```

### 4. Use Helper Methods

Page objects provide helper methods for common operations:

```typescript
// Instead of multiple steps:
await generatePage.fillSourceText(text);
await generatePage.clickGenerate();
await generatePage.waitForLoadingToStart();
await generatePage.waitForLoadingToComplete();
await generatePage.waitForReviewRedirect();

// Use the helper:
await generatePage.generateFlashcards(text);
```

### 5. Leverage Assertions in Tests, Not Page Objects

Keep assertions in tests, not in page objects:

❌ **Bad:**
```typescript
// In page object
async verifyTitle(expectedTitle: string) {
  await expect(this.title).toHaveText(expectedTitle);
}
```

✅ **Good:**
```typescript
// In test
const title = await setDetailsPage.getTitle();
expect(title).toContain('Expected Title');
```

## File Structure

```
tests/
├── page-objects/
│   ├── index.ts                    # Central exports
│   ├── LoginPage.ts                # Login page
│   ├── GeneratePage.ts             # Generate page
│   ├── ReviewPage.ts               # Review page
│   ├── DashboardPage.ts            # Dashboard page
│   ├── SetDetailsPage.ts           # Set details page
│   ├── NavigationComponent.ts      # Navigation component
│   ├── SaveSetTitleModal.ts        # Save modal
│   ├── ConfirmDialog.ts            # Confirm dialog
│   └── README.md                   # This file
├── e2e/
│   └── flashcard-generation-flow.spec.ts  # Example test
└── helpers/
    └── ...                         # Test helpers
```

## Adding New Page Objects

When creating a new page object:

1. Create a new file in `tests/page-objects/`
2. Extend the class with `readonly page: Page`
3. Define locators using `data-test-id` or semantic selectors
4. Add action methods that encapsulate interactions
5. Add helper methods for common workflows
6. Export the class in `index.ts`

Example template:

```typescript
import { type Page, type Locator } from '@playwright/test';

export class NewPage {
  readonly page: Page;
  readonly someElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someElement = page.getByTestId('some-element');
  }

  async goto() {
    await this.page.goto('/new-page');
  }

  async doSomething() {
    await this.someElement.click();
  }
}
```

## Related Documentation

- [E2E_TEST_IDS.md](../../E2E_TEST_IDS.md) - Complete list of data-test-id attributes
- [Playwright Best Practices](../../_ai/rules/playwright.mdc) - Testing guidelines
- [Playwright Documentation](https://playwright.dev/docs/pom) - Official POM guide
