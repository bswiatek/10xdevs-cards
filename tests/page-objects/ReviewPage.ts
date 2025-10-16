import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Review Page (/review/[id])
 * Handles candidate flashcards review and set creation
 */
export class ReviewPage {
  readonly page: Page;
  readonly acceptAllButton: Locator;
  readonly saveSetButton: Locator;
  readonly acceptedCounter: Locator;
  readonly rejectedCounter: Locator;
  readonly remainingCounter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.acceptAllButton = page.getByTestId("review-accept-all-button");
    this.saveSetButton = page.getByTestId("review-save-set-button");
    this.acceptedCounter = page.locator("text=/Zaakceptowano: \\d+/");
    this.rejectedCounter = page.locator("text=/Odrzucono: \\d+/");
    this.remainingCounter = page.locator("text=/Pozostało: \\d+/");
  }

  /**
   * Navigate to review page by session ID
   */
  async goto(sessionId: number) {
    await this.page.goto(`/review/${sessionId}`);
  }

  /**
   * Click accept all button
   */
  async clickAcceptAll() {
    await this.acceptAllButton.click();
  }

  /**
   * Click save set button
   */
  async clickSaveSet() {
    await this.saveSetButton.click();
  }

  /**
   * Check if save set button is enabled
   */
  async isSaveSetButtonEnabled() {
    return this.saveSetButton.isEnabled();
  }

  /**
   * Check if accept all button is enabled
   */
  async isAcceptAllButtonEnabled() {
    return this.acceptAllButton.isEnabled();
  }

  /**
   * Get accepted count
   */
  async getAcceptedCount(): Promise<number> {
    const text = await this.acceptedCounter.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Get rejected count
   */
  async getRejectedCount(): Promise<number> {
    const text = await this.rejectedCounter.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Get remaining count
   */
  async getRemainingCount(): Promise<number> {
    const text = await this.remainingCounter.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Accept all candidates and open save modal
   */
  async acceptAllAndPrepareToSave() {
    await this.clickAcceptAll();
    await this.clickSaveSet();
  }
}
