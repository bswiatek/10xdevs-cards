import { Page } from "@playwright/test";

/**
 * Page Object Model for Login Page
 * This demonstrates the POM pattern recommended by Playwright
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  // Locators
  get emailInput() {
    return this.page.getByLabel(/email/i);
  }

  get passwordInput() {
    return this.page.getByLabel(/password|hasło/i);
  }

  get submitButton() {
    return this.page.getByRole("button", { name: /login|sign in|zaloguj/i });
  }

  get errorMessage() {
    return this.page.locator('[role="alert"]');
  }

  // Actions
  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorText() {
    return this.errorMessage.textContent();
  }
}

/**
 * Page Object Model for Dashboard Page
 */
export class DashboardPage {
  constructor(private readonly page: Page) {}

  // Locators
  get welcomeMessage() {
    return this.page.getByRole("heading", { name: /dashboard|welcome/i });
  }

  get logoutButton() {
    return this.page.getByRole("button", { name: /logout|wyloguj/i });
  }

  get flashcardSets() {
    return this.page.locator('[data-testid="flashcard-set"]');
  }

  // Actions
  async goto() {
    await this.page.goto("/dashboard");
  }

  async logout() {
    await this.logoutButton.click();
  }

  async getFlashcardSetCount() {
    return this.flashcardSets.count();
  }
}

/**
 * Example usage of POM in tests:
 *
 * import { test, expect } from '@playwright/test';
 * import { LoginPage, DashboardPage } from '../fixtures/page-objects';
 *
 * test('user can login', async ({ page }) => {
 *   const loginPage = new LoginPage(page);
 *   await loginPage.goto();
 *   await loginPage.login('user@example.com', 'password123');
 *
 *   const dashboard = new DashboardPage(page);
 *   await expect(dashboard.welcomeMessage).toBeVisible();
 * });
 */
