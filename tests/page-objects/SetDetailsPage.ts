import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Set Details Page (/sets/[id])
 * Handles viewing and managing individual flashcard set
 */
export class SetDetailsPage {
  readonly page: Page;
  readonly setTitle: Locator;
  readonly deleteButton: Locator;
  readonly startStudyButton: Locator;
  readonly dashboardLink: Locator;
  readonly flashcardsList: Locator;
  readonly cardsCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.setTitle = page.getByTestId("set-title");
    this.deleteButton = page.getByTestId("set-delete-button");
    this.startStudyButton = page.getByRole("button", { name: /rozpocznij naukę/i });
    this.dashboardLink = page.getByTestId("nav-dashboard-link");
    this.flashcardsList = page.locator('[data-testid*="flashcard"]');
    this.cardsCount = page.locator("text=/\\d+ fiszek/");
  }

  /**
   * Navigate to set details page by ID
   */
  async goto(setId: number) {
    await this.page.goto(`/sets/${setId}`);
  }

  /**
   * Get set title
   */
  async getTitle() {
    return this.setTitle.textContent();
  }

  /**
   * Click delete button
   */
  async clickDelete() {
    await this.deleteButton.click();
  }

  /**
   * Click start study button
   */
  async clickStartStudy() {
    await this.startStudyButton.click();
  }

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
    await this.dashboardLink.click();
  }

  /**
   * Get flashcards count
   */
  async getFlashcardsCount(): Promise<number> {
    return this.flashcardsList.count();
  }

  /**
   * Get cards count from header
   */
  async getCardsCountFromHeader(): Promise<number> {
    const text = await this.cardsCount.textContent();
    const match = text?.match(/(\d+) fiszek/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if delete button is visible
   */
  async isDeleteButtonVisible() {
    return this.deleteButton.isVisible();
  }

  /**
   * Wait for redirect after deletion
   */
  async waitForDashboardRedirect() {
    await this.page.waitForURL("/dashboard");
  }
}
