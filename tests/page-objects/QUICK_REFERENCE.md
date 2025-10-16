# Page Object Models - Quick Reference

## Import

```typescript
import {
  LoginPage,
  GeneratePage,
  ReviewPage,
  SaveSetTitleModal,
  SetDetailsPage,
  ConfirmDialog,
  DashboardPage,
  NavigationComponent,
} from "../page-objects";
```

## Quick Usage

### LoginPage

```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login("user@example.com", "password");
await loginPage.waitForRedirect();
```

### GeneratePage

```typescript
const generatePage = new GeneratePage(page);
await generatePage.fillSourceText("a".repeat(1500));
await generatePage.clickGenerate();
await generatePage.waitForLoadingToComplete();
await generatePage.waitForReviewRedirect();

// Or use helper:
await generatePage.generateFlashcards("a".repeat(1500));
```

### ReviewPage

```typescript
const reviewPage = new ReviewPage(page);
await reviewPage.clickAcceptAll();
await reviewPage.clickSaveSet();

// Or use helper:
await reviewPage.acceptAllAndPrepareToSave();

// Get counts:
const accepted = await reviewPage.getAcceptedCount();
```

### SaveSetTitleModal

```typescript
const saveTitleModal = new SaveSetTitleModal(page);
await saveTitleModal.waitForVisible();
await saveTitleModal.saveSet("My Set Title");
```

### SetDetailsPage

```typescript
const setDetailsPage = new SetDetailsPage(page);
await setDetailsPage.goto(123);
await setDetailsPage.clickDelete();
await setDetailsPage.goToDashboard();

const title = await setDetailsPage.getTitle();
```

### ConfirmDialog

```typescript
const confirmDialog = new ConfirmDialog(page);
await confirmDialog.waitForVisible();
await confirmDialog.confirmAndWait();

// Or:
await confirmDialog.clickConfirm();
```

### DashboardPage

```typescript
const dashboardPage = new DashboardPage(page);
await dashboardPage.goto();

// Find and click set:
await dashboardPage.clickSetByTitle("My Set");
// Or by ID:
await dashboardPage.clickSetById(123);

// Check if exists:
const hasSet = await dashboardPage.hasSetWithTitle("My Set");
```

### NavigationComponent

```typescript
const navigation = new NavigationComponent(page);
await navigation.goToDashboard();
await navigation.goToGenerate();
await navigation.logout();
```

## Complete Flow Example

```typescript
test("complete e2e flow", async ({ page }) => {
  // Initialize
  const loginPage = new LoginPage(page);
  const generatePage = new GeneratePage(page);
  const reviewPage = new ReviewPage(page);
  const saveTitleModal = new SaveSetTitleModal(page);
  const setDetailsPage = new SetDetailsPage(page);
  const confirmDialog = new ConfirmDialog(page);
  const dashboardPage = new DashboardPage(page);
  const navigation = new NavigationComponent(page);

  // Login
  await loginPage.goto();
  await loginPage.login("test@example.com", "password");

  // Generate
  await generatePage.generateFlashcards("a".repeat(1500));

  // Review
  await reviewPage.acceptAllAndPrepareToSave();

  // Save
  await saveTitleModal.saveSet("Test Set");

  // Dashboard
  await setDetailsPage.goToDashboard();
  await dashboardPage.clickSetByTitle("Test Set");

  // Delete
  await setDetailsPage.clickDelete();
  await confirmDialog.confirmAndWait();

  // Logout
  await navigation.logout();
});
```

## Key Locators by data-test-id

| Element           | data-test-id                    | Page Object         |
| ----------------- | ------------------------------- | ------------------- |
| Email input       | `login-email-input`             | LoginPage           |
| Password input    | `login-password-input`          | LoginPage           |
| Login button      | `login-submit-button`           | LoginPage           |
| Source textarea   | `generate-source-textarea`      | GeneratePage        |
| Generate button   | `generate-submit-button`        | GeneratePage        |
| Loading overlay   | `generate-loading-overlay`      | GeneratePage        |
| Accept all button | `review-accept-all-button`      | ReviewPage          |
| Save set button   | `review-save-set-button`        | ReviewPage          |
| Title modal       | `save-set-title-modal`          | SaveSetTitleModal   |
| Title input       | `save-set-title-input`          | SaveSetTitleModal   |
| Confirm button    | `save-set-confirm-button`       | SaveSetTitleModal   |
| Delete button     | `set-delete-button`             | SetDetailsPage      |
| Confirm dialog    | `confirm-dialog`                | ConfirmDialog       |
| Dialog confirm    | `confirm-dialog-confirm-button` | ConfirmDialog       |
| Dashboard link    | `nav-dashboard-link`            | NavigationComponent |
| Logout button     | `logout-button`                 | NavigationComponent |
| Set card          | `dashboard-set-card`            | DashboardPage       |

## Tips

1. **Always use page objects** instead of direct selectors in tests
2. **Initialize only what you need** - create page objects as needed
3. **Use helper methods** for common workflows (e.g., `generateFlashcards()`)
4. **Keep assertions in tests**, not in page objects
5. **Use test.step()** for better test organization and reporting
6. **Handle timeouts** appropriately for async operations (generation can take up to 60s)

## See Also

- [tests/page-objects/README.md](tests/page-objects/README.md) - Detailed documentation
- [tests/e2e/flashcard-generation-flow.spec.ts](tests/e2e/flashcard-generation-flow.spec.ts) - Example tests
- [E2E_TEST_IDS.md](E2E_TEST_IDS.md) - Complete list of test IDs
