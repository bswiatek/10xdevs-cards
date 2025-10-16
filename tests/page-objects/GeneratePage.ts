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
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextArea = page.getByLabel(/tekst źródłowy/i);
    this.generateButton = page.getByRole("button", { name: /generuj fiszki/i });
    this.loadingOverlay = page.getByTestId("generate-loading-overlay");
    this.charCounter = page.locator("text=/\\d+/").first();
    this.errorAlert = page.locator('[role="alert"]');
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
    await this.sourceTextArea.click();
    await this.sourceTextArea.fill(text);
    // Wait for React state to update
    await this.page.waitForTimeout(100);
  }

  /**
   * Click generate button
   */
  async clickGenerate() {
    await this.generateButton.click();
  }

  /**
   * Wait for loading overlay to appear or check if generation started
   */
  async waitForLoadingToStart() {
    // Wait a bit for the UI to react
    await this.page.waitForTimeout(500);

    // Check if we got redirected (generation might be very fast) or if there's an error
    const currentUrl = this.page.url();
    if (currentUrl.includes("/review/")) {
      return; // Already redirected, skip waiting for overlay
    }

    // Check for error alert
    const hasError = await this.errorAlert.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await this.errorAlert.textContent();
      throw new Error(`Generation failed with error: ${errorText}`);
    }

    // Wait for loading overlay to appear (with shorter timeout since we might have missed it)
    await this.loadingOverlay.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
      // Overlay might not appear if generation is very fast, check URL again
    });
  }

  /**
   * Wait for loading overlay to disappear (generation complete)
   */
  async waitForLoadingToComplete(timeout = 70000) {
    // First check if there's an error instead of loading
    const hasError = await this.errorAlert.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await this.errorAlert.textContent();
      throw new Error(`Generation failed with error: ${errorText}`);
    }

    // Wait for loading overlay to disappear
    await this.loadingOverlay.waitFor({ state: "hidden", timeout }).catch(async () => {
      // Check for error again in case it appeared during generation
      const hasErrorNow = await this.errorAlert.isVisible().catch(() => false);
      if (hasErrorNow) {
        const errorText = await this.errorAlert.textContent();
        throw new Error(`Generation failed with error: ${errorText}`);
      }
    });
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
