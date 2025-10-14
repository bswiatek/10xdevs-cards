import { describe, it, expect, vi, beforeEach } from "vitest";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Example unit test for utility functions
 * This demonstrates:
 * - Testing pure functions
 * - Testing with different inputs
 * - Edge case handling
 */

// The actual utility function from src/lib/utils.ts
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    // Arrange & Act
    const result = cn("px-2 py-1", "px-4");

    // Assert - twMerge should resolve conflicting utilities
    expect(result).toBe("py-1 px-4");
  });

  it("handles conditional classes", () => {
    // Arrange
    const isActive = true;
    const isDisabled = false;

    // Act
    const result = cn("base-class", isActive && "active-class", isDisabled && "disabled-class");

    // Assert
    expect(result).toBe("base-class active-class");
  });

  it("handles undefined and null values", () => {
    // Arrange & Act
    const result = cn("valid-class", undefined, null, false, "another-class");

    // Assert
    expect(result).toBe("valid-class another-class");
  });

  it("handles empty input", () => {
    // Arrange & Act
    const result = cn();

    // Assert
    expect(result).toBe("");
  });
});

/**
 * Example test with mocking
 * This demonstrates:
 * - Using vi.fn() for function mocks
 * - Verifying function calls
 * - Mocking return values
 */

describe("Function mocking example", () => {
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mock before each test
    mockCallback = vi.fn();
  });

  it("calls callback with correct arguments", () => {
    // Arrange
    const items = [1, 2, 3];

    // Act
    items.forEach((item) => mockCallback(item));

    // Assert
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(mockCallback).toHaveBeenCalledWith(2);
    expect(mockCallback).toHaveBeenCalledWith(3);
  });

  it("can mock return values", () => {
    // Arrange
    mockCallback.mockReturnValue(42);

    // Act
    const result = mockCallback("test");

    // Assert
    expect(result).toBe(42);
    expect(mockCallback).toHaveBeenCalledWith("test");
  });
});
