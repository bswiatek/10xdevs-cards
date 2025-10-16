import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Dashboard Page (/)
 * Handles flashcard sets listing and navigation
 */
export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly searchBar: Locator;
  readonly setCards: Locator;
  readonly generateLink: Locator;
  readonly dashboardLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1", { hasText: /moje zestawy fiszek/i });
    this.searchBar = page.locator('input[type="search"], input[placeholder*="szukaj"]');
    this.setCards = page.getByTestId("dashboard-set-card");
    this.generateLink = page.getByRole("link", { name: /generuj/i });
    this.dashboardLink = page.getByTestId("nav-dashboard-link");
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto("/dashboard");
  }

  /**
   * Navigate to root (also shows dashboard)
   */
  async gotoRoot() {
    await this.page.goto("/");
  }

  /**
   * Search for sets
   */
  async search(query: string) {
    await this.searchBar.fill(query);
  }

  /**
   * Get all set cards
   */
  getSetCards() {
    return this.setCards;
  }

  /**
   * Get set card by title
   */
  getSetCardByTitle(title: string) {
    return this.page.getByTestId("dashboard-set-card").filter({ hasText: title });
  }

  /**
   * Get set card by ID
   */
  getSetCardById(setId: number) {
    return this.page.locator(`[data-test-id="dashboard-set-card"][data-set-id="${setId}"]`);
  }

  /**
   * Click on set card by title
   */
  async clickSetByTitle(title: string) {
    await this.getSetCardByTitle(title).click();
  }

  /**
   * Click on set card by ID
   */
  async clickSetById(setId: number) {
    await this.getSetCardById(setId).click();
  }

  /**
   * Get count of visible set cards
   */
  async getSetsCount(): Promise<number> {
    return this.setCards.count();
  }

  /**
   * Check if set exists by title
   */
  async hasSetWithTitle(title: string): Promise<boolean> {
    const card = this.getSetCardByTitle(title);
    return card.isVisible();
  }

  /**
   * Check if set exists by ID
   */
  async hasSetWithId(setId: number): Promise<boolean> {
    const card = this.getSetCardById(setId);
    return card.isVisible();
  }

  /**
   * Navigate to generate page
   */
  async goToGenerate() {
    await this.generateLink.click();
  }

  /**
   * Wait for sets to load
   */
  async waitForSetsToLoad() {
    await this.page.waitForLoadState("networkidle");
  }
}
