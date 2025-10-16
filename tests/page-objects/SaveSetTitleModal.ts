import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Save Set Title Modal
 * Handles saving flashcard set with title
 */
export class SaveSetTitleModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly titleInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId("save-set-title-modal");
    this.titleInput = page.getByTestId("save-set-title-input");
    this.confirmButton = page.getByTestId("save-set-confirm-button");
    this.cancelButton = page.getByRole("button", { name: /anuluj/i });
    this.errorMessage = page.locator(".text-red-600, .text-red-400");
  }

  /**
   * Wait for modal to be visible
   */
  async waitForVisible() {
    await this.modal.waitFor({ state: "visible" });
  }

  /**
   * Fill title input
   */
  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  /**
   * Click confirm button
   */
  async clickConfirm() {
    await this.confirmButton.click();
  }

  /**
   * Click cancel button
   */
  async clickCancel() {
    await this.cancelButton.click();
  }

  /**
   * Complete save action with title
   */
  async saveSet(title: string) {
    await this.fillTitle(title);
    await this.clickConfirm();
  }

  /**
   * Wait for modal to disappear
   */
  async waitForHidden() {
    await this.modal.waitFor({ state: "hidden" });
  }

  /**
   * Check if modal is visible
   */
  async isVisible() {
    return this.modal.isVisible();
  }

  /**
   * Check if confirm button is enabled
   */
  async isConfirmButtonEnabled() {
    return this.confirmButton.isEnabled();
  }

  /**
   * Get error message text
   */
  async getErrorText() {
    return this.errorMessage.textContent();
  }

  /**
   * Check if error is visible
   */
  async hasError() {
    return this.errorMessage.isVisible();
  }
}
