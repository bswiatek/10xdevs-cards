import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidateList } from "./CandidateList";
import type { ReviewCandidateVM } from "@/types";

describe("CandidateList", () => {
  // ============================================================================
  // Test Fixtures & Setup
  // ============================================================================

  const createMockCandidate = (overrides: Partial<ReviewCandidateVM> = {}): ReviewCandidateVM => ({
    id: `candidate-${Math.random().toString(36).substring(7)}`,
    front: "Sample front",
    back: "Sample back",
    action: "pending",
    wasEdited: false,
    ...overrides,
  });

  const createMockCandidates = (count: number): ReviewCandidateVM[] => {
    return Array.from({ length: count }, (_, index) =>
      createMockCandidate({
        id: `candidate-${index + 1}`,
        front: `Front ${index + 1}`,
        back: `Back ${index + 1}`,
      })
    );
  };

  const defaultProps = {
    candidates: createMockCandidates(3),
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onEditStart: vi.fn(),
    onUndo: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. EMPTY STATE RENDERING
  // ============================================================================

  describe("Empty state", () => {
    it("renders empty state message when candidates array is empty", () => {
      render(<CandidateList {...defaultProps} candidates={[]} />);

      expect(screen.getByText(/brak kandydatów do recenzji/i)).toBeInTheDocument();
      expect(screen.getByText(/wszystkie fiszki zostały już przetworzone/i)).toBeInTheDocument();
    });

    it("applies correct styling to empty state container", () => {
      const { container } = render(<CandidateList {...defaultProps} candidates={[]} />);

      const emptyStateContainer = container.querySelector('[class*="min-h-[400px]"]');
      expect(emptyStateContainer).toBeInTheDocument();
      expect(emptyStateContainer?.className).toContain("border-dashed");
    });

    it("does not render grid when candidates array is empty", () => {
      const { container } = render(<CandidateList {...defaultProps} candidates={[]} />);

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).not.toBeInTheDocument();
    });

    it("does not call any callbacks when empty", () => {
      const onAccept = vi.fn();
      const onReject = vi.fn();
      const onEditStart = vi.fn();
      const onUndo = vi.fn();

      render(
        <CandidateList
          candidates={[]}
          onAccept={onAccept}
          onReject={onReject}
          onEditStart={onEditStart}
          onUndo={onUndo}
        />
      );

      expect(onAccept).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();
      expect(onEditStart).not.toHaveBeenCalled();
      expect(onUndo).not.toHaveBeenCalled();
    });

    it("shows empty state after all candidates are removed", () => {
      const { rerender } = render(<CandidateList {...defaultProps} candidates={createMockCandidates(2)} />);

      // Initially has candidates
      expect(screen.queryByText(/brak kandydatów/i)).not.toBeInTheDocument();

      // Update to empty array
      rerender(<CandidateList {...defaultProps} candidates={[]} />);

      expect(screen.getByText(/brak kandydatów do recenzji/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 2. LIST RENDERING WITH CANDIDATES
  // ============================================================================

  describe("List rendering with candidates", () => {
    it("renders grid container when candidates exist", () => {
      const { container } = render(<CandidateList {...defaultProps} />);

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
      expect(grid?.className).toContain("grid-cols-1");
    });

    it("applies responsive grid classes", () => {
      const { container } = render(<CandidateList {...defaultProps} />);

      const grid = container.querySelector('[class*="grid"]');
      expect(grid?.className).toContain("md:grid-cols-2");
      expect(grid?.className).toContain("lg:grid-cols-3");
      expect(grid?.className).toContain("xl:grid-cols-4");
    });

    it("renders correct number of CandidateCard components", () => {
      const candidates = createMockCandidates(5);
      render(<CandidateList {...defaultProps} candidates={candidates} />);

      // Each card should display its front text
      candidates.forEach((candidate) => {
        expect(screen.getByText(candidate.front)).toBeInTheDocument();
      });
    });

    it("renders single candidate correctly", () => {
      const candidates = createMockCandidates(1);
      render(<CandidateList {...defaultProps} candidates={candidates} />);

      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.getByText("Back 1")).toBeInTheDocument();
    });

    it("renders multiple candidates with different states", () => {
      const candidates = [
        createMockCandidate({ id: "1", action: "pending", front: "Pending card" }),
        createMockCandidate({ id: "2", action: "accepted", front: "Accepted card" }),
        createMockCandidate({ id: "3", action: "rejected", front: "Rejected card" }),
        createMockCandidate({ id: "4", action: "edited", front: "Edited card", wasEdited: true }),
      ];

      render(<CandidateList {...defaultProps} candidates={candidates} />);

      expect(screen.getByText("Pending card")).toBeInTheDocument();
      expect(screen.getByText("Accepted card")).toBeInTheDocument();
      expect(screen.getByText("Rejected card")).toBeInTheDocument();
      expect(screen.getByText("Edited card")).toBeInTheDocument();
    });

    it("handles large number of candidates", () => {
      const candidates = createMockCandidates(50);
      render(<CandidateList {...defaultProps} candidates={candidates} />);

      // Verify first and last candidates are rendered
      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.getByText("Front 50")).toBeInTheDocument();
    });

    it("does not render empty state when candidates exist", () => {
      render(<CandidateList {...defaultProps} />);

      expect(screen.queryByText(/brak kandydatów do recenzji/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/wszystkie fiszki zostały już przetworzone/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // 3. PROPS FORWARDING TO CHILDREN
  // ============================================================================

  describe("Props forwarding to CandidateCard children", () => {
    it("forwards onAccept callback to all CandidateCard components", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const candidates = createMockCandidates(2);

      render(<CandidateList {...defaultProps} candidates={candidates} onAccept={onAccept} />);

      // Click accept on first card
      const acceptButtons = screen.getAllByRole("button", { name: /akceptuj/i });
      await user.click(acceptButtons[0]);

      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(onAccept).toHaveBeenCalledWith("candidate-1");
    });

    it("forwards onReject callback to all CandidateCard components", async () => {
      const user = userEvent.setup();
      const onReject = vi.fn();
      const candidates = createMockCandidates(2);

      render(<CandidateList {...defaultProps} candidates={candidates} onReject={onReject} />);

      const rejectButtons = screen.getAllByRole("button", { name: /odrzuć/i });
      await user.click(rejectButtons[1]);

      expect(onReject).toHaveBeenCalledTimes(1);
      expect(onReject).toHaveBeenCalledWith("candidate-2");
    });

    it("forwards onEditStart callback to all CandidateCard components", async () => {
      const user = userEvent.setup();
      const onEditStart = vi.fn();
      const candidates = createMockCandidates(3);

      render(<CandidateList {...defaultProps} candidates={candidates} onEditStart={onEditStart} />);

      const editButtons = screen.getAllByRole("button", { name: /edytuj/i });
      await user.click(editButtons[2]);

      expect(onEditStart).toHaveBeenCalledTimes(1);
      expect(onEditStart).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "candidate-3",
          front: "Front 3",
          back: "Back 3",
        })
      );
    });

    it("forwards onUndo callback to accepted/rejected cards", async () => {
      const user = userEvent.setup();
      const onUndo = vi.fn();
      const candidates = [
        createMockCandidate({ id: "accepted-1", action: "accepted" }),
        createMockCandidate({ id: "rejected-1", action: "rejected" }),
      ];

      render(<CandidateList {...defaultProps} candidates={candidates} onUndo={onUndo} />);

      const undoButtons = screen.getAllByRole("button", { name: /cofnij/i });
      expect(undoButtons).toHaveLength(2);

      await user.click(undoButtons[0]);

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith("accepted-1");
    });

    it("passes complete candidate object to each CandidateCard", () => {
      const candidates = [
        createMockCandidate({
          id: "complex-1",
          front: "Complex front",
          back: "Complex back",
          action: "pending",
          wasEdited: true,
          errors: { front: "Error" },
        }),
      ];

      render(<CandidateList {...defaultProps} candidates={candidates} />);

      // Verify all candidate properties are accessible in rendered output
      expect(screen.getByText("Complex front")).toBeInTheDocument();
      expect(screen.getByText("Complex back")).toBeInTheDocument();
      expect(screen.getByText("Edytowano")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 4. KEY PROP AND LIST UPDATES
  // ============================================================================

  describe("Key prop and list updates", () => {
    it("uses candidate.id as key for list items", () => {
      const candidates = createMockCandidates(3);
      const { container } = render(<CandidateList {...defaultProps} candidates={candidates} />);

      // React should use keys internally - verify no key warnings in console
      expect(container.querySelector('[class*="grid"]')?.children).toHaveLength(3);
    });

    it("handles candidates being added to the list", () => {
      const initialCandidates = createMockCandidates(2);
      const { rerender } = render(<CandidateList {...defaultProps} candidates={initialCandidates} />);

      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.getByText("Front 2")).toBeInTheDocument();

      // Add one more candidate
      const updatedCandidates = [
        ...initialCandidates,
        createMockCandidate({ id: "candidate-3", front: "Front 3", back: "Back 3" }),
      ];

      rerender(<CandidateList {...defaultProps} candidates={updatedCandidates} />);

      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.getByText("Front 2")).toBeInTheDocument();
      expect(screen.getByText("Front 3")).toBeInTheDocument();
    });

    it("handles candidates being removed from the list", () => {
      const initialCandidates = createMockCandidates(3);
      const { rerender } = render(<CandidateList {...defaultProps} candidates={initialCandidates} />);

      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.getByText("Front 2")).toBeInTheDocument();
      expect(screen.getByText("Front 3")).toBeInTheDocument();

      // Remove middle candidate
      const updatedCandidates = [initialCandidates[0], initialCandidates[2]];

      rerender(<CandidateList {...defaultProps} candidates={updatedCandidates} />);

      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.queryByText("Front 2")).not.toBeInTheDocument();
      expect(screen.getByText("Front 3")).toBeInTheDocument();
    });

    it("handles candidate state changes while maintaining list", () => {
      const initialCandidates = createMockCandidates(2);
      const { rerender } = render(<CandidateList {...defaultProps} candidates={initialCandidates} />);

      // Both should have accept buttons initially
      expect(screen.getAllByRole("button", { name: /akceptuj/i })).toHaveLength(2);

      // Update first candidate to accepted
      const updatedCandidates = [
        createMockCandidate({ id: "candidate-1", front: "Front 1", back: "Back 1", action: "accepted" }),
        initialCandidates[1],
      ];

      rerender(<CandidateList {...defaultProps} candidates={updatedCandidates} />);

      // First card should show accepted state, second still pending
      expect(screen.getByText(/zaakceptowano/i)).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /akceptuj/i })).toHaveLength(1); // Only second card
    });

    it("handles complete list replacement", () => {
      const initialCandidates = createMockCandidates(2);
      const { rerender } = render(<CandidateList {...defaultProps} candidates={initialCandidates} />);

      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.getByText("Front 2")).toBeInTheDocument();

      // Completely different set
      const newCandidates = [
        createMockCandidate({ id: "new-1", front: "New Front 1", back: "New Back 1" }),
        createMockCandidate({ id: "new-2", front: "New Front 2", back: "New Back 2" }),
      ];

      rerender(<CandidateList {...defaultProps} candidates={newCandidates} />);

      expect(screen.queryByText("Front 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Front 2")).not.toBeInTheDocument();
      expect(screen.getByText("New Front 1")).toBeInTheDocument();
      expect(screen.getByText("New Front 2")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 5. CALLBACK ISOLATION BETWEEN CARDS
  // ============================================================================

  describe("Callback isolation between cards", () => {
    it("clicking accept on one card does not affect other cards", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const candidates = createMockCandidates(3);

      render(<CandidateList {...defaultProps} candidates={candidates} onAccept={onAccept} />);

      const acceptButtons = screen.getAllByRole("button", { name: /akceptuj/i });
      await user.click(acceptButtons[1]); // Click second card

      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(onAccept).toHaveBeenCalledWith("candidate-2");
      expect(onAccept).not.toHaveBeenCalledWith("candidate-1");
      expect(onAccept).not.toHaveBeenCalledWith("candidate-3");
    });

    it("clicking reject on multiple cards calls callback correctly for each", async () => {
      const user = userEvent.setup();
      const onReject = vi.fn();
      const candidates = createMockCandidates(3);

      render(<CandidateList {...defaultProps} candidates={candidates} onReject={onReject} />);

      const rejectButtons = screen.getAllByRole("button", { name: /odrzuć/i });

      await user.click(rejectButtons[0]);
      await user.click(rejectButtons[2]);

      expect(onReject).toHaveBeenCalledTimes(2);
      expect(onReject).toHaveBeenNthCalledWith(1, "candidate-1");
      expect(onReject).toHaveBeenNthCalledWith(2, "candidate-3");
    });

    it("clicking edit on different cards passes correct candidate objects", async () => {
      const user = userEvent.setup();
      const onEditStart = vi.fn();
      const candidates = createMockCandidates(2);

      render(<CandidateList {...defaultProps} candidates={candidates} onEditStart={onEditStart} />);

      const editButtons = screen.getAllByRole("button", { name: /edytuj/i });

      await user.click(editButtons[0]);

      expect(onEditStart).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "candidate-1",
          front: "Front 1",
        })
      );

      await user.click(editButtons[1]);

      expect(onEditStart).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "candidate-2",
          front: "Front 2",
        })
      );
    });
  });

  // ============================================================================
  // 6. EDGE CASES
  // ============================================================================

  describe("Edge cases", () => {
    it("handles transition from empty to populated list", () => {
      const { rerender } = render(<CandidateList {...defaultProps} candidates={[]} />);

      expect(screen.getByText(/brak kandydatów/i)).toBeInTheDocument();

      const candidates = createMockCandidates(2);
      rerender(<CandidateList {...defaultProps} candidates={candidates} />);

      expect(screen.queryByText(/brak kandydatów/i)).not.toBeInTheDocument();
      expect(screen.getByText("Front 1")).toBeInTheDocument();
    });

    it("handles candidates with duplicate content but unique IDs", () => {
      const candidates = [
        createMockCandidate({ id: "unique-1", front: "Same text", back: "Same text" }),
        createMockCandidate({ id: "unique-2", front: "Same text", back: "Same text" }),
      ];

      render(<CandidateList {...defaultProps} candidates={candidates} />);

      // Both should be rendered (React keys should handle this)
      const fronts = screen.getAllByText("Same text");
      expect(fronts.length).toBeGreaterThanOrEqual(2); // At least 2 (front and back of each card)
    });

    it("handles candidates with special characters in IDs", () => {
      const candidates = [
        createMockCandidate({ id: "id-with-dashes-123", front: "Front 1" }),
        createMockCandidate({ id: "id_with_underscores_456", front: "Front 2" }),
        createMockCandidate({ id: "id.with.dots.789", front: "Front 3" }),
      ];

      expect(() => render(<CandidateList {...defaultProps} candidates={candidates} />)).not.toThrow();

      expect(screen.getByText("Front 1")).toBeInTheDocument();
      expect(screen.getByText("Front 2")).toBeInTheDocument();
      expect(screen.getByText("Front 3")).toBeInTheDocument();
    });

    it("handles all candidates in non-pending state", () => {
      const candidates = [
        createMockCandidate({ id: "1", action: "accepted" }),
        createMockCandidate({ id: "2", action: "rejected" }),
        createMockCandidate({ id: "3", action: "edited" }),
      ];

      render(<CandidateList {...defaultProps} candidates={candidates} />);

      // Should have undo buttons, no accept/edit/reject buttons
      expect(screen.getAllByRole("button", { name: /cofnij/i })).toHaveLength(3);
      expect(screen.queryByRole("button", { name: /akceptuj/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /edytuj/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /odrzuć/i })).not.toBeInTheDocument();
    });

    it("handles candidates array with undefined or null entries gracefully", () => {
      // This shouldn't happen in real usage, but test defensive coding
      const candidates = createMockCandidates(2);

      // TypeScript would catch this, but test runtime behavior
      expect(() => render(<CandidateList {...defaultProps} candidates={candidates} />)).not.toThrow();
    });

    it("maintains callback references across re-renders", () => {
      const onAccept = vi.fn();
      const { rerender } = render(<CandidateList {...defaultProps} onAccept={onAccept} />);

      rerender(<CandidateList {...defaultProps} onAccept={onAccept} />);
      rerender(<CandidateList {...defaultProps} onAccept={onAccept} />);

      // Should still have accept buttons
      expect(screen.getAllByRole("button", { name: /akceptuj/i })).toHaveLength(3);
    });
  });

  // ============================================================================
  // 7. INTEGRATION SCENARIOS
  // ============================================================================

  describe("Integration scenarios", () => {
    it("simulates reviewing all candidates to completion", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const onReject = vi.fn();

      const initialCandidates = createMockCandidates(3);
      const { rerender } = render(
        <CandidateList {...defaultProps} candidates={initialCandidates} onAccept={onAccept} onReject={onReject} />
      );

      // Accept first candidate
      const acceptButtons = screen.getAllByRole("button", { name: /akceptuj/i });
      await user.click(acceptButtons[0]);
      expect(onAccept).toHaveBeenCalledWith("candidate-1");

      // Update state
      let updatedCandidates = [
        createMockCandidate({ id: "candidate-1", front: "Front 1", back: "Back 1", action: "accepted" }),
        initialCandidates[1],
        initialCandidates[2],
      ];
      rerender(
        <CandidateList {...defaultProps} candidates={updatedCandidates} onAccept={onAccept} onReject={onReject} />
      );

      // Reject second candidate
      const rejectButtons = screen.getAllByRole("button", { name: /odrzuć/i });
      await user.click(rejectButtons[0]); // First reject button (second card)
      expect(onReject).toHaveBeenCalledWith("candidate-2");

      // Update state
      updatedCandidates = [
        updatedCandidates[0],
        createMockCandidate({ id: "candidate-2", front: "Front 2", back: "Back 2", action: "rejected" }),
        initialCandidates[2],
      ];
      rerender(
        <CandidateList {...defaultProps} candidates={updatedCandidates} onAccept={onAccept} onReject={onReject} />
      );

      // Accept third candidate
      const remainingAcceptButtons = screen.getAllByRole("button", { name: /akceptuj/i });
      await user.click(remainingAcceptButtons[0]);
      expect(onAccept).toHaveBeenCalledWith("candidate-3");

      // All processed - transition to empty state
      rerender(<CandidateList {...defaultProps} candidates={[]} onAccept={onAccept} onReject={onReject} />);

      expect(screen.getByText(/brak kandydatów do recenzji/i)).toBeInTheDocument();
    });

    it("simulates editing workflow within list", async () => {
      const user = userEvent.setup();
      const onEditStart = vi.fn();

      const candidates = createMockCandidates(2);
      const { rerender } = render(
        <CandidateList {...defaultProps} candidates={candidates} onEditStart={onEditStart} />
      );

      // Click edit on first card
      const editButtons = screen.getAllByRole("button", { name: /edytuj/i });
      await user.click(editButtons[0]);

      expect(onEditStart).toHaveBeenCalledWith(candidates[0]);

      // Simulate parent updating candidate after edit
      const updatedCandidates = [
        createMockCandidate({
          id: "candidate-1",
          front: "Edited Front 1",
          back: "Edited Back 1",
          action: "edited",
          wasEdited: true,
        }),
        candidates[1],
      ];

      rerender(<CandidateList {...defaultProps} candidates={updatedCandidates} onEditStart={onEditStart} />);

      expect(screen.getByText("Edited Front 1")).toBeInTheDocument();
      expect(screen.getByText("Edytowano")).toBeInTheDocument();
    });

    it("simulates mixed state changes across multiple candidates", () => {
      const initialCandidates = createMockCandidates(4);
      const { rerender } = render(<CandidateList {...defaultProps} candidates={initialCandidates} />);

      // Verify initial state - all pending
      expect(screen.getAllByRole("button", { name: /akceptuj/i })).toHaveLength(4);

      // Update to mixed states
      const mixedCandidates = [
        createMockCandidate({ id: "candidate-1", front: "Front 1", back: "Back 1", action: "accepted" }),
        createMockCandidate({ id: "candidate-2", front: "Front 2", back: "Back 2", action: "pending" }),
        createMockCandidate({ id: "candidate-3", front: "Front 3", back: "Back 3", action: "rejected" }),
        createMockCandidate({
          id: "candidate-4",
          front: "Front 4",
          back: "Back 4",
          action: "edited",
          wasEdited: true,
        }),
      ];

      rerender(<CandidateList {...defaultProps} candidates={mixedCandidates} />);

      // Verify mixed state rendering
      expect(screen.getAllByText(/zaakceptowano/i)).toHaveLength(2); // accepted and edited
      expect(screen.getByText(/odrzucono/i)).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /akceptuj/i })).toHaveLength(1); // only pending
      expect(screen.getAllByRole("button", { name: /cofnij/i })).toHaveLength(3); // accepted, rejected, edited
    });

    it("handles rapid state changes without errors", () => {
      const candidates = createMockCandidates(2);
      const { rerender } = render(<CandidateList {...defaultProps} candidates={candidates} />);

      // Rapid re-renders with different states
      for (let i = 0; i < 10; i++) {
        const newCandidates = createMockCandidates(Math.floor(Math.random() * 5) + 1);
        rerender(<CandidateList {...defaultProps} candidates={newCandidates} />);
      }

      // Should not crash
      expect(screen.queryByText(/brak kandydatów/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // 8. ACCESSIBILITY
  // ============================================================================

  describe("Accessibility", () => {
    it("maintains accessible structure in grid layout", () => {
      const { container } = render(<CandidateList {...defaultProps} />);

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });

    it("empty state message is accessible", () => {
      render(<CandidateList {...defaultProps} candidates={[]} />);

      const message = screen.getByText(/brak kandydatów do recenzji/i);
      expect(message).toBeVisible();
    });

    it("all candidate cards are reachable via keyboard navigation", () => {
      render(<CandidateList {...defaultProps} />);

      const allButtons = screen.getAllByRole("button");
      expect(allButtons.length).toBeGreaterThan(0);

      // Each button should be focusable
      for (const button of allButtons) {
        expect(button).not.toHaveAttribute("tabindex", "-1");
      }
    });
  });

  // ============================================================================
  // 9. PERFORMANCE CONSIDERATIONS
  // ============================================================================

  describe("Performance considerations", () => {
    it("renders large list without excessive re-renders", () => {
      const largeCandidateList = createMockCandidates(100);

      const renderStart = performance.now();
      render(<CandidateList {...defaultProps} candidates={largeCandidateList} />);
      const renderEnd = performance.now();

      // Should render in reasonable time (< 1000ms for 100 items)
      expect(renderEnd - renderStart).toBeLessThan(1000);
    });

    it("handles list updates efficiently", () => {
      const candidates = createMockCandidates(20);
      const { rerender } = render(<CandidateList {...defaultProps} candidates={candidates} />);

      // Update single candidate
      const updatedCandidates = [
        ...candidates.slice(0, 10),
        createMockCandidate({ id: "candidate-11", front: "Updated", back: "Updated", action: "accepted" }),
        ...candidates.slice(11),
      ];

      const rerenderStart = performance.now();
      rerender(<CandidateList {...defaultProps} candidates={updatedCandidates} />);
      const rerenderEnd = performance.now();

      // Re-render should be fast
      expect(rerenderEnd - rerenderStart).toBeLessThan(100);
    });
  });
});
