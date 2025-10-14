import { useEffect, useState } from "react";
import { useReviewSession } from "@/components/hooks/useReviewSession";
import { ReviewHeader } from "./review/ReviewHeader";
import { CandidateList } from "./review/CandidateList";
import { EditCandidateModal } from "./review/EditCandidateModal";
import { SaveSetTitleModal } from "./review/SaveSetTitleModal";
import { toast } from "sonner";
import type { GenerationSessionDTO, CreateFlashcardSetCommand, FlashcardCandidateWithActionDTO } from "@/types";

interface ReviewViewProps {
  generationSessionId: number;
  initialSession?: GenerationSessionDTO;
  onSaveSuccess?: (setId: number) => void;
}

export function ReviewView({ generationSessionId, initialSession, onSaveSuccess }: ReviewViewProps) {
  // Try to load session from sessionStorage if not provided
  const sessionData = useState<GenerationSessionDTO | undefined>(() => {
    // Try to load from initialSession first
    if (initialSession) return initialSession;

    // Otherwise try to load from sessionStorage
    try {
      const stored = sessionStorage.getItem(`generation_session_${generationSessionId}`);
      if (stored) {
        return JSON.parse(stored) as GenerationSessionDTO;
      }
    } catch {
      // Ignore errors
    }

    return undefined;
  })[0];

  const { state, actions } = useReviewSession(generationSessionId, sessionData);

  // Check if session data is available
  useEffect(() => {
    if (!sessionData) {
      toast.error("Brak danych sesji generowania", {
        description: "Przekieruj się do strony generowania, aby utworzyć nową sesję.",
      });
    }
  }, [sessionData]);

  // Handle save set
  const handleSaveSet = async (title: string) => {
    actions.setSaving(true);

    try {
      // Get accepted and edited candidates
      const acceptedCandidates = actions.getAcceptedAndEditedCandidates();

      // Map to FlashcardCandidateWithActionDTO
      const flashcards: FlashcardCandidateWithActionDTO[] = acceptedCandidates.map((c) => ({
        temp_id: c.id,
        front: c.front,
        back: c.back,
        action: c.action === "pending" ? "accepted" : c.action,
        was_edited: c.wasEdited,
      }));

      // Create command
      const command: CreateFlashcardSetCommand = {
        title,
        generation_session_id: generationSessionId,
        flashcards,
      };

      // Call API
      const response = await fetch("/api/flashcard-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 400) {
          toast.error("Błąd walidacji", {
            description: errorData.message || "Sprawdź poprawność danych i spróbuj ponownie.",
          });
        } else if (response.status === 404) {
          toast.error("Sesja generowania nie istnieje", {
            description: "Rozpocznij nową sesję generowania.",
          });
        } else if (response.status === 422) {
          toast.error("Sesja została już użyta", {
            description: "Rozpocznij nową sesję generowania.",
          });
        } else {
          toast.error("Wystąpił błąd serwera", {
            description: "Spróbuj ponownie za chwilę.",
          });
        }

        actions.setSaving(false);
        actions.closeTitleModal();
        return;
      }

      const result = await response.json();

      // Show success toast
      toast.success("Zestaw został zapisany!", {
        description: `Utworzono zestaw "${title}" z ${flashcards.length} ${
          flashcards.length === 1 ? "fiszką" : "fiszkami"
        }.`,
      });

      // Close modal and call success callback or redirect
      actions.closeTitleModal();
      actions.setSaving(false);

      if (onSaveSuccess && result.id) {
        onSaveSuccess(result.id);
      } else if (result.id) {
        // Default redirect to the set details page
        setTimeout(() => {
          window.location.href = `/sets/${result.id}`;
        }, 1000);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving flashcard set:", error);
      toast.error("Wystąpił błąd podczas zapisywania", {
        description: "Sprawdź połączenie internetowe i spróbuj ponownie.",
      });
      actions.setSaving(false);
      actions.closeTitleModal();
    }
  };

  // Show message when no session data
  if (!sessionData) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Brak danych sesji generowania</h2>
          <p className="mt-2 text-muted-foreground">Przekieruj się do strony generowania, aby utworzyć nową sesję.</p>
          <a
            href="/generate"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
          >
            Przejdź do generowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ReviewHeader
        counters={state.counters}
        onRequestSave={actions.openTitleModal}
        onAcceptAll={actions.acceptAllCandidates}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <CandidateList
          candidates={state.candidates}
          onAccept={actions.acceptCandidate}
          onReject={actions.rejectCandidate}
          onEditStart={(candidate) => actions.openEditModal(candidate.id)}
          onUndo={actions.undoCandidate}
        />
      </div>

      {/* Edit Modal */}
      <EditCandidateModal
        isOpen={state.editModal.open}
        candidate={state.editModal.candidateId ? actions.getCandidateById(state.editModal.candidateId) : undefined}
        onSave={actions.editCandidate}
        onClose={actions.closeEditModal}
      />

      {/* Save Title Modal */}
      <SaveSetTitleModal
        isOpen={state.titleModalOpen}
        acceptedCount={state.counters.accepted}
        onSave={handleSaveSet}
        onClose={actions.closeTitleModal}
        isSaving={state.isSaving}
      />
    </div>
  );
}
