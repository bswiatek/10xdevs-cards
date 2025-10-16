import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Confirm Dialog
 * Handles confirmation dialogs (e.g., delete confirmations)
 */
export class ConfirmDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("confirm-dialog");
    this.title = page.getByTestId("confirm-dialog-title");
    this.description = page.getByTestId("confirm-dialog-description");
    this.confirmButton = page.getByTestId("confirm-dialog-confirm-button");
    this.cancelButton = this.dialog.getByRole("button", { name: /anuluj/i });
  }

  /**
   * Wait for dialog to be visible
   */
  async waitForVisible() {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Get dialog title
   */
  async getTitle() {
    return this.title.textContent();
  }

  /**
   * Get dialog description
   */
  async getDescription() {
    return this.description.textContent();
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
   * Wait for dialog to disappear
   */
  async waitForHidden() {
    await this.dialog.waitFor({ state: "hidden" });
  }

  /**
   * Check if dialog is visible
   */
  async isVisible() {
    return this.dialog.isVisible();
  }

  /**
   * Confirm action and wait for dialog to close
   */
  async confirmAndWait() {
    await this.clickConfirm();
    await this.waitForHidden();
  }
}
