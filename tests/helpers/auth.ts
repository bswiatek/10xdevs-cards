import { Page } from "@playwright/test";

/**
 * Authentication helpers for E2E tests
 * Provides utilities for login/logout and session management
 */

interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Performs login via API endpoint
 * This is faster than UI login for tests that don't test login itself
 */
export async function loginViaAPI(page: Page, credentials: LoginCredentials) {
  const response = await page.request.post("/api/auth/login", {
    data: credentials,
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  return response;
}

/**
 * Performs logout via API endpoint
 */
export async function logoutViaAPI(page: Page) {
  const response = await page.request.post("/api/auth/logout");

  if (!response.ok()) {
    throw new Error(`Logout failed: ${response.status()}`);
  }

  return response;
}

/**
 * Clears all cookies and local storage
 * Useful for ensuring clean state between tests
 */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Gets test user credentials from environment variables
 */
export function getTestCredentials(): LoginCredentials {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Test credentials not found in environment variables (E2E_USERNAME, E2E_PASSWORD)");
  }

  return { email, password };
}

/**
 * Sets up authenticated context by logging in via API
 * Use this in beforeEach hooks for tests that require authentication
 */
export async function setupAuthenticatedContext(page: Page) {
  const credentials = getTestCredentials();
  await loginViaAPI(page, credentials);
}
