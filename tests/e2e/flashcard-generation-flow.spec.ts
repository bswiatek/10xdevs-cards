import { test, expect } from "@playwright/test";
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

/**
 * Complete E2E test for flashcard generation workflow
 * Tests the full user journey from login to set deletion
 */
test.describe("Flashcard Generation E2E Flow", () => {
  test("complete workflow: login -> generate -> review -> save -> delete -> logout", async ({ page }) => {
    // Generate unique title for this test run
    const uniqueTitle = `Test Set ${Date.now()}`;
    const sourceText = "a".repeat(1500); // Minimum 1000 characters required

    // Initialize page objects
    const loginPage = new LoginPage(page);
    const generatePage = new GeneratePage(page);
    const reviewPage = new ReviewPage(page);
    const saveTitleModal = new SaveSetTitleModal(page);
    const setDetailsPage = new SetDetailsPage(page);
    const confirmDialog = new ConfirmDialog(page);
    const dashboardPage = new DashboardPage(page);
    const navigation = new NavigationComponent(page);

    // Step 1: Login
    await test.step("User logs in", async () => {
      await loginPage.goto();
      await loginPage.login("test@example.com", "password123");
      await loginPage.waitForRedirect();
      await expect(page).toHaveURL("/generate");
    });

    // Step 2: Generate flashcards
    await test.step("User generates flashcards from source text", async () => {
      await generatePage.fillSourceText(sourceText);
      await expect(generatePage.generateButton).toBeEnabled();
      await generatePage.clickGenerate();
    });

    // Step 3: Wait for generation to complete
    await test.step("Wait for AI generation to complete", async () => {
      await generatePage.waitForLoadingToStart();
      await expect(generatePage.loadingOverlay).toBeVisible();
      await generatePage.waitForLoadingToComplete();
      await generatePage.waitForReviewRedirect();
      await expect(page).toHaveURL(/\/review\/\d+/);
    });

    // Step 4: Review and accept candidates
    await test.step("User accepts all candidates", async () => {
      await expect(reviewPage.acceptAllButton).toBeEnabled();
      await reviewPage.clickAcceptAll();
      await expect(reviewPage.acceptAllButton).toBeDisabled();
      await expect(reviewPage.saveSetButton).toBeEnabled();
    });

    // Step 5: Save set with title
    await test.step("User saves set with unique title", async () => {
      await reviewPage.clickSaveSet();
      await saveTitleModal.waitForVisible();
      await expect(saveTitleModal.modal).toBeVisible();
      await saveTitleModal.saveSet(uniqueTitle);
    });

    // Step 6: Verify redirect to set details
    await test.step("User is redirected to set details page", async () => {
      await expect(page).toHaveURL(/\/sets\/\d+/);
      const title = await setDetailsPage.getTitle();
      expect(title).toContain(uniqueTitle);
    });

    // Step 7: Navigate to dashboard
    await test.step("User navigates to dashboard", async () => {
      await setDetailsPage.goToDashboard();
      await expect(page).toHaveURL("/dashboard");
    });

    // Step 8: Verify set is visible on dashboard
    await test.step("Created set is visible on dashboard", async () => {
      await dashboardPage.waitForSetsToLoad();
      const setCard = dashboardPage.getSetCardByTitle(uniqueTitle);
      await expect(setCard).toBeVisible();
    });

    // Step 9: Navigate to set and delete it
    await test.step("User deletes the created set", async () => {
      await dashboardPage.clickSetByTitle(uniqueTitle);
      await expect(page).toHaveURL(/\/sets\/\d+/);
      await setDetailsPage.clickDelete();
      await confirmDialog.waitForVisible();
      await expect(confirmDialog.dialog).toBeVisible();
      const dialogTitle = await confirmDialog.getTitle();
      expect(dialogTitle).toContain("Usuń zestaw");
      await confirmDialog.confirmAndWait();
    });

    // Step 10: Verify redirect back to dashboard
    await test.step("User is redirected to dashboard after deletion", async () => {
      await setDetailsPage.waitForDashboardRedirect();
      await expect(page).toHaveURL("/");
    });

    // Step 11: Verify set is no longer visible
    await test.step("Deleted set is no longer visible on dashboard", async () => {
      await dashboardPage.waitForSetsToLoad();
      const hasSet = await dashboardPage.hasSetWithTitle(uniqueTitle);
      expect(hasSet).toBe(false);
    });

    // Step 12: Logout
    await test.step("User logs out", async () => {
      await navigation.logout();
      await expect(page).toHaveURL("/login");
    });
  });

  test("user can cancel set deletion", async ({ page }) => {
    // Initialize page objects
    const loginPage = new LoginPage(page);
    const generatePage = new GeneratePage(page);
    const reviewPage = new ReviewPage(page);
    const saveTitleModal = new SaveSetTitleModal(page);
    const setDetailsPage = new SetDetailsPage(page);
    const confirmDialog = new ConfirmDialog(page);

    const uniqueTitle = `Cancel Test ${Date.now()}`;
    const sourceText = "b".repeat(1500);

    // Login and create a set
    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");
    await generatePage.generateFlashcards(sourceText);
    await reviewPage.acceptAllAndPrepareToSave();
    await saveTitleModal.saveSet(uniqueTitle);

    // Attempt to delete but cancel
    await test.step("User cancels set deletion", async () => {
      await setDetailsPage.clickDelete();
      await confirmDialog.waitForVisible();
      await confirmDialog.clickCancel();
      await confirmDialog.waitForHidden();
      // Should still be on set details page
      await expect(page).toHaveURL(/\/sets\/\d+/);
      const title = await setDetailsPage.getTitle();
      expect(title).toContain(uniqueTitle);
    });
  });

  test("validation: source text must be between 1000-10000 characters", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const generatePage = new GeneratePage(page);

    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");

    await test.step("Generate button is disabled with too short text", async () => {
      await generatePage.fillSourceText("Short text");
      await expect(generatePage.generateButton).toBeDisabled();
    });

    await test.step("Generate button is enabled with valid length text", async () => {
      await generatePage.fillSourceText("a".repeat(1500));
      await expect(generatePage.generateButton).toBeEnabled();
    });

    await test.step("Generate button is disabled with too long text", async () => {
      await generatePage.fillSourceText("a".repeat(10001));
      await expect(generatePage.generateButton).toBeDisabled();
    });
  });

  test("validation: set title cannot be empty", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const generatePage = new GeneratePage(page);
    const reviewPage = new ReviewPage(page);
    const saveTitleModal = new SaveSetTitleModal(page);

    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");
    await generatePage.generateFlashcards("c".repeat(1500));
    await reviewPage.acceptAllAndPrepareToSave();

    await test.step("Confirm button is disabled with empty title", async () => {
      await saveTitleModal.waitForVisible();
      await expect(saveTitleModal.confirmButton).toBeDisabled();
    });

    await test.step("Confirm button is enabled with valid title", async () => {
      await saveTitleModal.fillTitle("Valid Title");
      await expect(saveTitleModal.confirmButton).toBeEnabled();
    });
  });
});
