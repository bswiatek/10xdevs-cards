import { test, expect } from "@playwright/test";
import { LoginPage, GeneratePage } from "../fixtures/page-objects";

/**
 * E2E Test: User Authentication and Login Flow
 *
 * This test covers the first part of the critical user journey:
 * - Navigate to login page
 * - Fill in email and password from test environment variables
 * - Submit login form
 * - Verify successful redirect to /generate page
 * - Verify page title "Generuj fiszki AI" is displayed
 *
 * Test data:
 * - Uses existing test user from .env.test (E2E_USERNAME, E2E_PASSWORD)
 * - Test environment uses dedicated Supabase test database
 */

test.describe("Authentication - Login Flow", () => {
  let loginPage: LoginPage;
  let generatePage: GeneratePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    generatePage = new GeneratePage(page);
  });

  test("should successfully login and redirect to generate page", async ({ page }) => {
    // Get test credentials from environment variables
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    // Verify environment variables are set
    expect(email, "E2E_USERNAME should be defined in .env.test").toBeDefined();
    expect(password, "E2E_PASSWORD should be defined in .env.test").toBeDefined();

    // Step 1: Navigate to login page
    await loginPage.goto();

    // Assert: Login page is loaded
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(page).toHaveURL("/login");

    // Assert: Form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();

    // Step 2: Fill in login credentials (use pressSequentially for React controlled inputs)
    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }

    await loginPage.emailInput.click();
    await loginPage.emailInput.pressSequentially(email, { delay: 50 });

    await loginPage.passwordInput.click();
    await loginPage.passwordInput.pressSequentially(password, { delay: 50 });

    // Assert: Fields are filled correctly
    await expect(loginPage.emailInput).toHaveValue(email);
    await expect(loginPage.passwordInput).toHaveValue(password);

    // Step 3: Submit the login form and wait for navigation
    const navigationPromise = page.waitForURL("**/generate", { timeout: 15000 });
    await loginPage.submitButton.click();
    await navigationPromise;

    // Assert: Now on /generate page
    await expect(page).toHaveURL("/generate");

    // Step 4: Verify the generate page is displayed
    await expect(generatePage.pageTitle).toBeVisible({ timeout: 5000 });

    // Assert: Page title contains correct text
    await expect(generatePage.pageTitle).toHaveText(/generuj fiszki ai/i);

    // Assert: Key elements of generate page are visible
    await expect(generatePage.sourceTextArea).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();
  });

  test("should show error message for invalid credentials", async ({ page }) => {
    // Step 1: Navigate to login page
    await loginPage.goto();

    // Step 2: Fill in invalid credentials
    await loginPage.emailInput.click();
    await loginPage.emailInput.pressSequentially("invalid@email.com", { delay: 50 });
    await loginPage.passwordInput.click();
    await loginPage.passwordInput.pressSequentially("wrongpassword", { delay: 50 });

    // Step 3: Submit the form
    await loginPage.submitButton.click();

    // Assert: Error message is displayed (wait for API response)
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });

    // Assert: Error message contains appropriate text
    const errorText = await loginPage.errorMessage.textContent();
    expect(errorText).toMatch(/nieprawidłowe/i);

    // Assert: User remains on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect to /generate if user is already logged in", async ({ page }) => {
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    // Step 1: Login first
    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }

    await loginPage.goto();
    await loginPage.emailInput.click();
    await loginPage.emailInput.pressSequentially(email, { delay: 50 });
    await loginPage.passwordInput.click();
    await loginPage.passwordInput.pressSequentially(password, { delay: 50 });

    const navigationPromise = page.waitForURL("**/generate", { timeout: 15000 });
    await loginPage.submitButton.click();
    await navigationPromise;

    await expect(page).toHaveURL("/generate");

    // Step 2: Try to access login page again
    await page.goto("/login");

    // Assert: Should be redirected back to /generate
    await expect(page).toHaveURL("/generate", { timeout: 5000 });
  });
});
