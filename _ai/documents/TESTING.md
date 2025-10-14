# Testing Documentation

## Overview

This project uses **Vitest** for unit and integration tests, and **Playwright** for end-to-end (E2E) tests.

## Test Structure

```
project-root/
├── src/
│   ├── __tests__/              # Unit tests (co-located with source)
│   │   ├── example.test.tsx
│   │   └── utils.test.ts
│   └── components/
│       └── MyComponent/
│           └── MyComponent.test.tsx  # Component-specific tests
├── tests/
│   ├── e2e/                    # E2E tests
│   │   └── example.spec.ts
│   └── fixtures/               # Test helpers and Page Objects
│       └── page-objects.ts
├── vitest.config.ts            # Vitest configuration
├── vitest.setup.ts             # Test setup (mocks, globals)
└── playwright.config.ts        # Playwright configuration
```

## Unit Tests (Vitest)

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Unit Tests

**Location**: Place tests in `src/__tests__/` or co-located with components (`*.test.ts`, `*.test.tsx`)

**Example**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names**: Describe what the test does
3. **Test user behavior**: Not implementation details
4. **Use Testing Library queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
5. **Mock external dependencies**: Use `vi.mock()` for API calls, Supabase, etc.

## E2E Tests (Playwright)

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Writing E2E Tests

**Location**: Place tests in `tests/e2e/` directory (`*.spec.ts`)

**Example**:

```typescript
import { test, expect } from '@playwright/test';

test('user can login and see dashboard', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill login form
  await page.getByLabel(/email/i).fill('user@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
```

### Page Object Model (POM)

For complex flows, use the Page Object Model pattern:

```typescript
// tests/fixtures/page-objects.ts
import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /login/i }).click();
  }
}

// In your test
import { LoginPage } from '../fixtures/page-objects';

test('login with POM', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login('user@example.com', 'password123');
});
```

### Best Practices

1. **Use semantic locators**: Prefer `getByRole`, `getByLabel` over CSS selectors
2. **Wait for elements**: Use `await expect(element).toBeVisible()` instead of fixed timeouts
3. **Isolate tests**: Each test should be independent
4. **Use Page Object Model**: For complex, reusable flows
5. **Take screenshots on failure**: Configured automatically in `playwright.config.ts`

## Configuration

### Vitest Configuration (`vitest.config.ts`)

- **Environment**: jsdom (for React component testing)
- **Setup file**: `vitest.setup.ts` (global mocks, cleanup)
- **Coverage**: v8 provider with 70% thresholds
- **Aliases**: `@/` points to `src/`

### Playwright Configuration (`playwright.config.ts`)

- **Browser**: Chromium only (Desktop Chrome)
- **Base URL**: `http://localhost:3000`
- **Dev server**: Automatically starts before tests
- **Reports**: HTML and JSON reports in `playwright-report/`
- **Retries**: 2 retries on CI, 0 locally

## Mocking

### Mocking in Vitest

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue(42);

// Mock a module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signIn: vi.fn().mockResolvedValue({ user: { id: '123' } }),
    },
  },
}));

// Spy on existing function
const spy = vi.spyOn(console, 'log');
```

### Mocking in Playwright

```typescript
// Mock API responses
await page.route('**/api/flashcard-sets', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify([{ id: '1', title: 'Test Set' }]),
  });
});
```

## CI/CD Integration

### Pre-commit

- Unit tests run automatically via Husky pre-commit hook
- Only staged files are tested (lint-staged)

### Pull Request

```yaml
# .github/workflows/test.yml (example)
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
```

## Troubleshooting

### Common Issues

**Vitest: "Cannot find module '@/...'"**
- Check path aliases in `vitest.config.ts`
- Ensure TypeScript paths match

**Playwright: "Timed out waiting for..."**
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Use `await page.pause()` to debug

**Tests fail in CI but pass locally**
- Check environment variables
- Ensure database/API mocks are consistent
- Review CI logs for race conditions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
