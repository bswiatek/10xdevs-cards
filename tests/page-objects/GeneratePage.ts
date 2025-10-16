import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Generate Page (/generate)
 * Handles flashcard generation from source text
 */
export class GeneratePage {
  readonly page: Page;
  readonly sourceTextArea: Locator;
  readonly generateButton: Locator;
  readonly loadingOverlay: Locator;
  readonly charCounter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextArea = page.getByTestId("generate-source-textarea");
    this.generateButton = page.getByTestId("generate-submit-button");
    this.loadingOverlay = page.getByTestId("generate-loading-overlay");
    this.charCounter = page.locator("text=/\\d+\\/10000/");
  }

  /**
   * Navigate to generate page
   */
  async goto() {
    await this.page.goto("/generate");
  }

  /**
   * Fill source text area
   */
  async fillSourceText(text: string) {
    await this.sourceTextArea.fill(text);
  }

  /**
   * Click generate button
   */
  async clickGenerate() {
    await this.generateButton.click();
  }

  /**
   * Wait for loading overlay to appear
   */
  async waitForLoadingToStart() {
    await this.loadingOverlay.waitFor({ state: "visible" });
  }

  /**
   * Wait for loading overlay to disappear (generation complete)
   */
  async waitForLoadingToComplete(timeout = 70000) {
    await this.loadingOverlay.waitFor({ state: "hidden", timeout });
  }

  /**
   * Wait for redirect to review page after generation
   */
  async waitForReviewRedirect() {
    await this.page.waitForURL(/\/review\/\d+/);
  }

  /**
   * Complete generation flow: fill text, submit, wait for completion
   */
  async generateFlashcards(text: string, waitForComplete = true) {
    await this.fillSourceText(text);
    await this.clickGenerate();

    if (waitForComplete) {
      await this.waitForLoadingToStart();
      await this.waitForLoadingToComplete();
      await this.waitForReviewRedirect();
    }
  }

  /**
   * Check if generate button is enabled
   */
  async isGenerateButtonEnabled() {
    return this.generateButton.isEnabled();
  }

  /**
   * Get current character count from counter
   */
  async getCharacterCount(): Promise<number> {
    const text = await this.charCounter.textContent();
    if (!text) return 0;
    const match = text.match(/(\d+)\/\d+/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
