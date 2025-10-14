import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Example unit test for a simple component
 * This demonstrates:
 * - Component rendering
 * - User interactions
 * - Assertions with Testing Library
 * - AAA pattern (Arrange-Act-Assert)
 */

// Example component to test
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = React.useState(initialCount);

  return (
    <div>
      <p data-testid="count-value">Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

describe("Counter Component", () => {
  it("renders with initial count", () => {
    // Arrange
    render(<Counter initialCount={5} />);

    // Act & Assert
    expect(screen.getByTestId("count-value")).toHaveTextContent("Count: 5");
  });

  it("increments count when increment button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Counter />);

    // Act
    await user.click(screen.getByRole("button", { name: /increment/i }));

    // Assert
    expect(screen.getByTestId("count-value")).toHaveTextContent("Count: 1");
  });

  it("decrements count when decrement button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Counter initialCount={10} />);

    // Act
    await user.click(screen.getByRole("button", { name: /decrement/i }));

    // Assert
    expect(screen.getByTestId("count-value")).toHaveTextContent("Count: 9");
  });

  it("resets count to zero when reset button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Counter initialCount={42} />);

    // Act
    await user.click(screen.getByRole("button", { name: /reset/i }));

    // Assert
    expect(screen.getByTestId("count-value")).toHaveTextContent("Count: 0");
  });
});

// Add React import for JSX
import React from "react";
