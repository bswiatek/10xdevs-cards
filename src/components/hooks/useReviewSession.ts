import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  GenerationSessionDTO,
  ReviewCandidateVM,
  ReviewState,
  ReviewCounters,
  FlashcardActionType,
} from "@/types";

/**
 * Custom hook for managing review session state
 * Handles initialization from GenerationSessionDTO and provides actions for candidate management
 */
export function useReviewSession(sessionId: number, initialSession?: GenerationSessionDTO) {
  // Initialize candidates from GenerationSessionDTO
  const initialCandidates: ReviewCandidateVM[] = useMemo(() => {
    if (!initialSession) return [];
    return initialSession.candidates.map((candidate) => ({
      id: candidate.temp_id,
      front: candidate.front,
      back: candidate.back,
      action: "pending" as const,
      wasEdited: false,
    }));
  }, [initialSession]);

  // Initialize review state
  const [state, setState] = useState<ReviewState>({
    sessionId,
    candidates: initialCandidates,
    counters: {
      accepted: 0,
      rejected: 0,
      remaining: initialCandidates.length,
    },
    isSaving: false,
    titleModalOpen: false,
    editModal: {
      open: false,
    },
  });

  // Update candidates when initialSession changes (e.g., loaded from sessionStorage)
  useEffect(() => {
    if (initialSession && initialCandidates.length > 0 && state.candidates.length === 0) {
      setState((prev) => ({
        ...prev,
        candidates: initialCandidates,
        counters: {
          accepted: 0,
          rejected: 0,
          remaining: initialCandidates.length,
        },
      }));
    }
  }, [initialSession, initialCandidates, state.candidates.length]);

  // Calculate counters from candidates (O(1) for updates, O(n) for validation)
  const recalculateCounters = useCallback((candidates: ReviewCandidateVM[]): ReviewCounters => {
    let accepted = 0;
    let rejected = 0;
    let remaining = 0;

    for (const candidate of candidates) {
      if (candidate.action === "accepted" || candidate.action === "edited") {
        accepted++;
      } else if (candidate.action === "rejected") {
        rejected++;
      } else {
        remaining++;
      }
    }

    return { accepted, rejected, remaining };
  }, []);

  // Accept a candidate
  const acceptCandidate = useCallback(
    (candidateId: string) => {
      setState((prev) => {
        const updatedCandidates = prev.candidates.map((c) =>
          c.id === candidateId ? { ...c, action: "accepted" as FlashcardActionType } : c
        );
        return {
          ...prev,
          candidates: updatedCandidates,
          counters: recalculateCounters(updatedCandidates),
        };
      });
    },
    [recalculateCounters]
  );

  // Reject a candidate
  const rejectCandidate = useCallback(
    (candidateId: string) => {
      setState((prev) => {
        const updatedCandidates = prev.candidates.map((c) =>
          c.id === candidateId ? { ...c, action: "rejected" as FlashcardActionType } : c
        );
        return {
          ...prev,
          candidates: updatedCandidates,
          counters: recalculateCounters(updatedCandidates),
        };
      });
    },
    [recalculateCounters]
  );

  // Undo action on a candidate (restore to pending)
  const undoCandidate = useCallback(
    (candidateId: string) => {
      setState((prev) => {
        const updatedCandidates = prev.candidates.map((c) =>
          c.id === candidateId ? { ...c, action: "pending" as const } : c
        );
        return {
          ...prev,
          candidates: updatedCandidates,
          counters: recalculateCounters(updatedCandidates),
        };
      });
    },
    [recalculateCounters]
  );

  // Edit a candidate (update content and mark as edited)
  const editCandidate = useCallback(
    (candidateId: string, front: string, back: string) => {
      setState((prev) => {
        const updatedCandidates = prev.candidates.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                front,
                back,
                action: "edited" as FlashcardActionType,
                wasEdited: true,
                errors: undefined,
              }
            : c
        );
        return {
          ...prev,
          candidates: updatedCandidates,
          counters: recalculateCounters(updatedCandidates),
          editModal: { open: false },
        };
      });
    },
    [recalculateCounters]
  );

  // Open edit modal for a candidate
  const openEditModal = useCallback((candidateId: string) => {
    setState((prev) => ({
      ...prev,
      editModal: { open: true, candidateId },
    }));
  }, []);

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editModal: { open: false },
    }));
  }, []);

  // Open title modal for saving
  const openTitleModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      titleModalOpen: true,
    }));
  }, []);

  // Close title modal
  const closeTitleModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      titleModalOpen: false,
    }));
  }, []);

  // Set saving state
  const setSaving = useCallback((isSaving: boolean) => {
    setState((prev) => ({ ...prev, isSaving }));
  }, []);

  // Get accepted and edited candidates for saving
  const getAcceptedAndEditedCandidates = useCallback(() => {
    return state.candidates.filter((c) => c.action === "accepted" || c.action === "edited");
  }, [state.candidates]);

  // Get candidate by ID
  const getCandidateById = useCallback(
    (candidateId: string) => {
      return state.candidates.find((c) => c.id === candidateId);
    },
    [state.candidates]
  );

  return {
    state,
    actions: {
      acceptCandidate,
      rejectCandidate,
      undoCandidate,
      editCandidate,
      openEditModal,
      closeEditModal,
      openTitleModal,
      closeTitleModal,
      setSaving,
      getAcceptedAndEditedCandidates,
      getCandidateById,
    },
  };
}
