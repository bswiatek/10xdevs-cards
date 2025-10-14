import { test, expect } from "@playwright/test";

/**
 * Example E2E test
 * This demonstrates:
 * - Page navigation
 * - Element interaction
 * - Assertions with Playwright
 * - Page Object Model (POM) pattern preparation
 */

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify page title or main heading
    await expect(page).toHaveTitle(/10xdevs/i);
  });

  test("should display navigation elements", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Check if main navigation exists (adjust selectors based on your app)
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });
});

/**
 * Example: Authentication flow test
 * This demonstrates a complete user journey
 */
test.describe("Authentication Flow", () => {
  test("should navigate to login page", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click login link (adjust selector based on your app)
    const loginLink = page.getByRole("link", { name: /login|sign in/i });
    if ((await loginLink.count()) > 0) {
      await loginLink.first().click();

      // Verify navigation to login page
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test("should show validation error for empty login form", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Find and click submit button without filling form
    const submitButton = page.getByRole("button", { name: /login|sign in/i });
    if ((await submitButton.count()) > 0) {
      await submitButton.first().click();

      // Wait for validation message (adjust based on your implementation)
      // This is a generic example - customize for your app
      await page.waitForTimeout(500);
    }
  });
});

/**
 * Example: Visual regression test
 * This demonstrates screenshot comparison
 */
test.describe("Visual Regression", () => {
  test("homepage should match screenshot", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Wait for all content to load
    await page.waitForLoadState("networkidle");

    // Take screenshot and compare (first run will create baseline)
    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      // Mask dynamic content like dates, user-specific data
      mask: [page.locator('[data-testid="dynamic-content"]')],
    });
  });
});
