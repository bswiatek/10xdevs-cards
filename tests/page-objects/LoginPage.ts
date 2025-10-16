import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Login Page (/login)
 * Encapsulates login functionality and form interactions
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.locator('[role="alert"]');
    this.forgotPasswordLink = page.getByRole("link", { name: /zapomniałeś hasła/i });
    this.registerLink = page.getByRole("link", { name: /zarejestruj się/i });
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto("/login");
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click login button
   */
  async clickLogin() {
    await this.submitButton.click();
  }

  /**
   * Perform complete login action
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Wait for redirect after successful login
   */
  async waitForRedirect() {
    await this.page.waitForURL("/generate");
  }

  /**
   * Check if error message is visible
   */
  async hasError() {
    return this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText() {
    return this.errorMessage.textContent();
  }
}
