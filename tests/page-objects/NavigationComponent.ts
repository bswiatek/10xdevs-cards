import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Navigation Component
 * Handles global navigation and logout
 */
export class NavigationComponent {
  readonly page: Page;
  readonly dashboardLink: Locator;
  readonly generateLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardLink = page.getByTestId("nav-dashboard-link");
    this.generateLink = page.getByRole("link", { name: /generuj/i });
    this.logoutButton = page.getByTestId("logout-button");
  }

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
    await this.dashboardLink.click();
  }

  /**
   * Navigate to generate page
   */
  async goToGenerate() {
    await this.generateLink.click();
  }

  /**
   * Click logout button
   */
  async clickLogout() {
    await this.logoutButton.click();
  }

  /**
   * Logout and wait for redirect to login
   */
  async logout() {
    await this.clickLogout();
    await this.page.waitForURL("/login");
  }

  /**
   * Check if navigation is visible (user is logged in)
   */
  async isVisible() {
    return this.dashboardLink.isVisible();
  }
}
