import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidateCard } from "./CandidateCard";
import type { ReviewCandidateVM } from "@/types";

describe("CandidateCard", () => {
  // ============================================================================
  // Test Fixtures & Setup
  // ============================================================================

  const createMockCandidate = (overrides: Partial<ReviewCandidateVM> = {}): ReviewCandidateVM => ({
    id: "test-candidate-123",
    front: "Co to jest React?",
    back: "Biblioteka JavaScript do budowania interfejsów użytkownika",
    action: "pending",
    wasEdited: false,
    ...overrides,
  });

  const defaultProps = {
    candidate: createMockCandidate(),
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onEditStart: vi.fn(),
    onUndo: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. RENDERING TESTS - Basic Display
  // ============================================================================

  describe("Basic rendering", () => {
    it("renders candidate front text correctly", () => {
      render(<CandidateCard {...defaultProps} />);
      expect(screen.getByText("Co to jest React?")).toBeInTheDocument();
    });

    it("renders candidate back text correctly", () => {
      render(<CandidateCard {...defaultProps} />);
      expect(screen.getByText("Biblioteka JavaScript do budowania interfejsów użytkownika")).toBeInTheDocument();
    });

    it("renders 'Przód' label for front side", () => {
      render(<CandidateCard {...defaultProps} />);
      expect(screen.getByText("Przód")).toBeInTheDocument();
    });

    it("renders 'Tył' label for back side", () => {
      render(<CandidateCard {...defaultProps} />);
      expect(screen.getByText("Tył")).toBeInTheDocument();
    });

    it("preserves whitespace in front text with whitespace-pre-wrap", () => {
      const candidate = createMockCandidate({
        front: "Line 1\nLine 2\n\nLine 3",
      });
      const { container } = render(<CandidateCard {...defaultProps} candidate={candidate} />);

      const frontText = container.querySelector(".whitespace-pre-wrap");
      expect(frontText).toBeInTheDocument();
      expect(frontText?.textContent).toBe("Line 1\nLine 2\n\nLine 3");
    });

    it("handles very long text without breaking layout", () => {
      const longText = "A".repeat(500);
      const candidate = createMockCandidate({
        front: longText,
        back: longText,
      });

      render(<CandidateCard {...defaultProps} candidate={candidate} />);
      // Text appears twice (front and back), so use getAllByText
      const elements = screen.getAllByText(longText);
      expect(elements).toHaveLength(2);
      expect(elements[0]).toBeInTheDocument();
    });

    it("handles empty strings gracefully", () => {
      const candidate = createMockCandidate({
        front: "",
        back: "",
      });

      render(<CandidateCard {...defaultProps} candidate={candidate} />);
      expect(screen.getByText("Przód")).toBeInTheDocument();
      expect(screen.getByText("Tył")).toBeInTheDocument();
    });

    it("handles special characters and HTML entities", () => {
      const candidate = createMockCandidate({
        front: "<script>alert('xss')</script>",
        back: "& < > \" '",
      });

      render(<CandidateCard {...defaultProps} candidate={candidate} />);
      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
      expect(screen.getByText("& < > \" '")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 2. STATE-BASED RENDERING - Conditional UI Elements
  // ============================================================================

  describe("State-based rendering - PENDING state", () => {
    it("shows all three action buttons when action is pending", () => {
      render(<CandidateCard {...defaultProps} />);

      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edytuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
    });

    it("does not show undo button when action is pending", () => {
      render(<CandidateCard {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /cofnij/i })).not.toBeInTheDocument();
    });

    it("does not show status indicator when action is pending", () => {
      render(<CandidateCard {...defaultProps} />);

      expect(screen.queryByText(/zaakceptowano/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/odrzucono/i)).not.toBeInTheDocument();
    });

    it("applies default border styling when action is pending", () => {
      const { container } = render(<CandidateCard {...defaultProps} />);

      const card = container.querySelector('[class*="border-border"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("State-based rendering - ACCEPTED state", () => {
    it("shows only undo button when action is accepted", () => {
      const candidate = createMockCandidate({ action: "accepted" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByRole("button", { name: /cofnij/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /akceptuj/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /edytuj/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /odrzuć/i })).not.toBeInTheDocument();
    });

    it("shows accepted status indicator with checkmark", () => {
      const candidate = createMockCandidate({ action: "accepted" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByText(/zaakceptowano/i)).toBeInTheDocument();
    });

    it("applies green border and background when action is accepted", () => {
      const candidate = createMockCandidate({ action: "accepted" });
      const { container } = render(<CandidateCard {...defaultProps} candidate={candidate} />);

      const card = container.querySelector('[class*="border-green-500"]');
      expect(card).toBeInTheDocument();
      expect(card?.className).toContain("bg-green-50");
    });

    it("does not show rejected status indicator when accepted", () => {
      const candidate = createMockCandidate({ action: "accepted" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.queryByText(/odrzucono/i)).not.toBeInTheDocument();
    });
  });

  describe("State-based rendering - EDITED state", () => {
    it("shows only undo button when action is edited", () => {
      const candidate = createMockCandidate({ action: "edited" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByRole("button", { name: /cofnij/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /akceptuj/i })).not.toBeInTheDocument();
    });

    it("shows accepted status indicator when action is edited", () => {
      const candidate = createMockCandidate({ action: "edited" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByText(/zaakceptowano/i)).toBeInTheDocument();
    });

    it("applies green styling when action is edited", () => {
      const candidate = createMockCandidate({ action: "edited" });
      const { container } = render(<CandidateCard {...defaultProps} candidate={candidate} />);

      const card = container.querySelector('[class*="border-green-500"]');
      expect(card).toBeInTheDocument();
    });

    it("treats edited as accepted for isAccepted calculation", () => {
      const candidate = createMockCandidate({ action: "edited" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      // Should show accepted UI, not rejected
      expect(screen.getByText(/zaakceptowano/i)).toBeInTheDocument();
      expect(screen.queryByText(/odrzucono/i)).not.toBeInTheDocument();
    });
  });

  describe("State-based rendering - REJECTED state", () => {
    it("shows only undo button when action is rejected", () => {
      const candidate = createMockCandidate({ action: "rejected" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByRole("button", { name: /cofnij/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /akceptuj/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /edytuj/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /odrzuć/i })).not.toBeInTheDocument();
    });

    it("shows rejected status indicator with X icon", () => {
      const candidate = createMockCandidate({ action: "rejected" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByText(/odrzucono/i)).toBeInTheDocument();
    });

    it("applies red border, background and reduced opacity when rejected", () => {
      const candidate = createMockCandidate({ action: "rejected" });
      const { container } = render(<CandidateCard {...defaultProps} candidate={candidate} />);

      const card = container.querySelector('[class*="border-red-500"]');
      expect(card).toBeInTheDocument();
      expect(card?.className).toContain("bg-red-50");
      expect(card?.className).toContain("opacity-60");
    });

    it("does not show accepted status indicator when rejected", () => {
      const candidate = createMockCandidate({ action: "rejected" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.queryByText(/zaakceptowano/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // 3. EDITED BADGE RENDERING
  // ============================================================================

  describe("'Edytowano' badge rendering", () => {
    it("shows 'Edytowano' badge when wasEdited is true", () => {
      const candidate = createMockCandidate({ wasEdited: true });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByText("Edytowano")).toBeInTheDocument();
    });

    it("does not show 'Edytowano' badge when wasEdited is false", () => {
      const candidate = createMockCandidate({ wasEdited: false });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.queryByText("Edytowano")).not.toBeInTheDocument();
    });

    it("shows badge when wasEdited is true regardless of action state", () => {
      const states: ("pending" | "accepted" | "edited" | "rejected")[] = ["pending", "accepted", "edited", "rejected"];

      states.forEach((action) => {
        const candidate = createMockCandidate({ action, wasEdited: true });
        const { unmount } = render(<CandidateCard {...defaultProps} candidate={candidate} />);

        expect(screen.getByText("Edytowano")).toBeInTheDocument();
        unmount();
      });
    });

    it("applies correct badge styling", () => {
      const candidate = createMockCandidate({ wasEdited: true });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      const badge = screen.getByText("Edytowano");
      expect(badge.className).toContain("rounded-full");
      expect(badge.className).toContain("bg-blue-100");
      expect(badge.className).toContain("text-blue-800");
    });
  });

  // ============================================================================
  // 4. CALLBACK INVOCATIONS - User Interactions
  // ============================================================================

  describe("Callback invocations - Accept action", () => {
    it("calls onAccept with correct id when accept button is clicked", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();

      render(<CandidateCard {...defaultProps} onAccept={onAccept} />);

      const acceptButton = screen.getByRole("button", { name: /akceptuj/i });
      await user.click(acceptButton);

      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(onAccept).toHaveBeenCalledWith("test-candidate-123");
    });

    it("does not call other callbacks when accept is clicked", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const onReject = vi.fn();
      const onEditStart = vi.fn();
      const onUndo = vi.fn();

      render(
        <CandidateCard
          {...defaultProps}
          onAccept={onAccept}
          onReject={onReject}
          onEditStart={onEditStart}
          onUndo={onUndo}
        />
      );

      await user.click(screen.getByRole("button", { name: /akceptuj/i }));

      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(onReject).not.toHaveBeenCalled();
      expect(onEditStart).not.toHaveBeenCalled();
      expect(onUndo).not.toHaveBeenCalled();
    });

    it("can be called multiple times if button is clicked multiple times", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();

      render(<CandidateCard {...defaultProps} onAccept={onAccept} />);

      const acceptButton = screen.getByRole("button", { name: /akceptuj/i });
      await user.click(acceptButton);
      await user.click(acceptButton);
      await user.click(acceptButton);

      expect(onAccept).toHaveBeenCalledTimes(3);
    });
  });

  describe("Callback invocations - Reject action", () => {
    it("calls onReject with correct id when reject button is clicked", async () => {
      const user = userEvent.setup();
      const onReject = vi.fn();

      render(<CandidateCard {...defaultProps} onReject={onReject} />);

      await user.click(screen.getByRole("button", { name: /odrzuć/i }));

      expect(onReject).toHaveBeenCalledTimes(1);
      expect(onReject).toHaveBeenCalledWith("test-candidate-123");
    });

    it("does not call other callbacks when reject is clicked", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const onReject = vi.fn();
      const onEditStart = vi.fn();
      const onUndo = vi.fn();

      render(
        <CandidateCard
          {...defaultProps}
          onAccept={onAccept}
          onReject={onReject}
          onEditStart={onEditStart}
          onUndo={onUndo}
        />
      );

      await user.click(screen.getByRole("button", { name: /odrzuć/i }));

      expect(onReject).toHaveBeenCalledTimes(1);
      expect(onAccept).not.toHaveBeenCalled();
      expect(onEditStart).not.toHaveBeenCalled();
      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe("Callback invocations - Edit action", () => {
    it("calls onEditStart with full candidate object when edit button is clicked", async () => {
      const user = userEvent.setup();
      const onEditStart = vi.fn();
      const candidate = createMockCandidate();

      render(<CandidateCard {...defaultProps} candidate={candidate} onEditStart={onEditStart} />);

      await user.click(screen.getByRole("button", { name: /edytuj/i }));

      expect(onEditStart).toHaveBeenCalledTimes(1);
      expect(onEditStart).toHaveBeenCalledWith(candidate);
    });

    it("passes complete candidate object including all properties", async () => {
      const user = userEvent.setup();
      const onEditStart = vi.fn();
      const candidate = createMockCandidate({
        id: "complex-id-456",
        front: "Complex front",
        back: "Complex back",
        action: "pending",
        wasEdited: true,
        errors: { front: "Error message" },
      });

      render(<CandidateCard {...defaultProps} candidate={candidate} onEditStart={onEditStart} />);

      await user.click(screen.getByRole("button", { name: /edytuj/i }));

      expect(onEditStart).toHaveBeenCalledWith(candidate);
      expect(onEditStart.mock.calls[0][0]).toEqual(candidate);
    });

    it("does not call other callbacks when edit is clicked", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const onReject = vi.fn();
      const onEditStart = vi.fn();
      const onUndo = vi.fn();

      render(
        <CandidateCard
          {...defaultProps}
          onAccept={onAccept}
          onReject={onReject}
          onEditStart={onEditStart}
          onUndo={onUndo}
        />
      );

      await user.click(screen.getByRole("button", { name: /edytuj/i }));

      expect(onEditStart).toHaveBeenCalledTimes(1);
      expect(onAccept).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();
      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe("Callback invocations - Undo action", () => {
    it("calls onUndo with correct id when undo button is clicked (accepted state)", async () => {
      const user = userEvent.setup();
      const onUndo = vi.fn();
      const candidate = createMockCandidate({ action: "accepted" });

      render(<CandidateCard {...defaultProps} candidate={candidate} onUndo={onUndo} />);

      await user.click(screen.getByRole("button", { name: /cofnij/i }));

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith("test-candidate-123");
    });

    it("calls onUndo with correct id when undo button is clicked (rejected state)", async () => {
      const user = userEvent.setup();
      const onUndo = vi.fn();
      const candidate = createMockCandidate({ action: "rejected" });

      render(<CandidateCard {...defaultProps} candidate={candidate} onUndo={onUndo} />);

      await user.click(screen.getByRole("button", { name: /cofnij/i }));

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith("test-candidate-123");
    });

    it("calls onUndo with correct id when undo button is clicked (edited state)", async () => {
      const user = userEvent.setup();
      const onUndo = vi.fn();
      const candidate = createMockCandidate({ action: "edited" });

      render(<CandidateCard {...defaultProps} candidate={candidate} onUndo={onUndo} />);

      await user.click(screen.getByRole("button", { name: /cofnij/i }));

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith("test-candidate-123");
    });

    it("does not call undo when action is pending", () => {
      const onUndo = vi.fn();
      const candidate = createMockCandidate({ action: "pending" });

      render(<CandidateCard {...defaultProps} candidate={candidate} onUndo={onUndo} />);

      // Undo button should not exist
      expect(screen.queryByRole("button", { name: /cofnij/i })).not.toBeInTheDocument();
      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 5. EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe("Edge cases", () => {
    it("handles undefined errors field gracefully", () => {
      const candidate = createMockCandidate({ errors: undefined });

      expect(() => render(<CandidateCard {...defaultProps} candidate={candidate} />)).not.toThrow();
    });

    it("handles candidate with errors object", () => {
      const candidate = createMockCandidate({
        errors: {
          front: "Front is required",
          back: "Back is required",
        },
      });

      expect(() => render(<CandidateCard {...defaultProps} candidate={candidate} />)).not.toThrow();
    });

    it("renders correctly with minimal candidate object", () => {
      const minimalCandidate: ReviewCandidateVM = {
        id: "minimal-id",
        front: "Front",
        back: "Back",
        action: "pending",
        wasEdited: false,
      };

      render(<CandidateCard {...defaultProps} candidate={minimalCandidate} />);

      expect(screen.getByText("Front")).toBeInTheDocument();
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("handles rapid state transitions", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const { rerender } = render(<CandidateCard {...defaultProps} onAccept={onAccept} />);

      // Click accept
      await user.click(screen.getByRole("button", { name: /akceptuj/i }));

      // Simulate state change to accepted
      const acceptedCandidate = createMockCandidate({ action: "accepted" });
      rerender(<CandidateCard {...defaultProps} candidate={acceptedCandidate} />);

      // Should now show undo button
      expect(screen.getByRole("button", { name: /cofnij/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /akceptuj/i })).not.toBeInTheDocument();
    });

    it("preserves callback references across re-renders", () => {
      const onAccept = vi.fn();
      const { rerender } = render(<CandidateCard {...defaultProps} onAccept={onAccept} />);

      rerender(<CandidateCard {...defaultProps} onAccept={onAccept} />);
      rerender(<CandidateCard {...defaultProps} onAccept={onAccept} />);

      expect(() => screen.getByRole("button", { name: /akceptuj/i })).not.toThrow();
    });
  });

  // ============================================================================
  // 6. ACCESSIBILITY
  // ============================================================================

  describe("Accessibility", () => {
    it("renders buttons with proper role", () => {
      render(<CandidateCard {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("buttons have accessible names", () => {
      render(<CandidateCard {...defaultProps} />);

      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edytuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
    });

    it("undo button has accessible name", () => {
      const candidate = createMockCandidate({ action: "accepted" });
      render(<CandidateCard {...defaultProps} candidate={candidate} />);

      expect(screen.getByRole("button", { name: /cofnij/i })).toBeInTheDocument();
    });

    it("renders semantic HTML structure", () => {
      const { container } = render(<CandidateCard {...defaultProps} />);

      // Should have proper div structure, not just plain text
      expect(container.querySelector("div")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 7. INTEGRATION SCENARIOS
  // ============================================================================

  describe("Integration scenarios", () => {
    it("completes full accept workflow", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const { rerender } = render(<CandidateCard {...defaultProps} onAccept={onAccept} />);

      // Initial state: pending
      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();

      // User clicks accept
      await user.click(screen.getByRole("button", { name: /akceptuj/i }));
      expect(onAccept).toHaveBeenCalledWith("test-candidate-123");

      // Parent updates state to accepted
      const acceptedCandidate = createMockCandidate({ action: "accepted" });
      rerender(<CandidateCard {...defaultProps} candidate={acceptedCandidate} onAccept={onAccept} />);

      // New state: accepted
      expect(screen.getByText(/zaakceptowano/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cofnij/i })).toBeInTheDocument();
    });

    it("completes full reject workflow", async () => {
      const user = userEvent.setup();
      const onReject = vi.fn();
      const { rerender } = render(<CandidateCard {...defaultProps} onReject={onReject} />);

      // User clicks reject
      await user.click(screen.getByRole("button", { name: /odrzuć/i }));
      expect(onReject).toHaveBeenCalledWith("test-candidate-123");

      // Parent updates state
      const rejectedCandidate = createMockCandidate({ action: "rejected" });
      rerender(<CandidateCard {...defaultProps} candidate={rejectedCandidate} onReject={onReject} />);

      // New state: rejected
      expect(screen.getByText(/odrzucono/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cofnij/i })).toBeInTheDocument();
    });

    it("completes full edit workflow", async () => {
      const user = userEvent.setup();
      const onEditStart = vi.fn();
      const { rerender } = render(<CandidateCard {...defaultProps} onEditStart={onEditStart} />);

      // User clicks edit
      await user.click(screen.getByRole("button", { name: /edytuj/i }));
      expect(onEditStart).toHaveBeenCalledWith(defaultProps.candidate);

      // After editing, parent updates with wasEdited flag and edited action
      const editedCandidate = createMockCandidate({
        front: "Edited front text",
        back: "Edited back text",
        action: "edited",
        wasEdited: true,
      });
      rerender(<CandidateCard {...defaultProps} candidate={editedCandidate} onEditStart={onEditStart} />);

      // New state: edited (treated as accepted)
      expect(screen.getByText("Edited front text")).toBeInTheDocument();
      expect(screen.getByText("Edited back text")).toBeInTheDocument();
      expect(screen.getByText("Edytowano")).toBeInTheDocument();
      expect(screen.getByText(/zaakceptowano/i)).toBeInTheDocument();
    });

    it("completes undo workflow from accepted to pending", async () => {
      const user = userEvent.setup();
      const onUndo = vi.fn();
      const acceptedCandidate = createMockCandidate({ action: "accepted" });
      const { rerender } = render(<CandidateCard {...defaultProps} candidate={acceptedCandidate} onUndo={onUndo} />);

      // User clicks undo
      await user.click(screen.getByRole("button", { name: /cofnij/i }));
      expect(onUndo).toHaveBeenCalledWith("test-candidate-123");

      // Parent resets to pending
      const pendingCandidate = createMockCandidate({ action: "pending" });
      rerender(<CandidateCard {...defaultProps} candidate={pendingCandidate} onUndo={onUndo} />);

      // Back to pending state
      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edytuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
      expect(screen.queryByText(/zaakceptowano/i)).not.toBeInTheDocument();
    });
  });
});
