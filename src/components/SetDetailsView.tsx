import { useState } from "react";
import { useSetDetails } from "./hooks/useSetDetails";
import { SetHeader } from "./set-details/SetHeader";
import { FlashcardsList } from "./set-details/FlashcardsList";
import { SetDetailsEmptyState } from "./set-details/SetDetailsEmptyState";
import { ErrorState } from "./dashboard/ErrorState";
import { EditFlashcardModal } from "./set-details/EditFlashcardModal";
import { ConfirmDialog } from "./set-details/ConfirmDialog";
import { AddFlashcardModal } from "./dashboard/AddFlashcardModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { FlashcardWithProgressDTO } from "../types";

interface SetDetailsViewProps {
  setId: number;
}

export function SetDetailsView({ setId }: SetDetailsViewProps) {
  const { setDetails, isLoading, error, refetch } = useSetDetails(setId);

  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardWithProgressDTO | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardWithProgressDTO | null>(null);
  const [isDeletingSet, setIsDeletingSet] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleStartStudy = () => {
    // TODO: Implement study session
    toast.info("Funkcja nauki zostanie wkrótce dodana");
  };

  const handleDeleteSet = () => {
    setIsDeletingSet(true);
  };

  const confirmDeleteSet = async () => {
    try {
      const response = await fetch(`/api/flashcard-sets/${setId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete flashcard set");
      }

      toast.success("Zestaw został usunięty");
      // Redirect to dashboard
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setIsDeletingSet(false);
    }
  };

  const handleEditFlashcard = (flashcard: FlashcardWithProgressDTO) => {
    setEditingFlashcard(flashcard);
  };

  const handleDeleteFlashcard = (flashcard: FlashcardWithProgressDTO) => {
    setDeletingFlashcard(flashcard);
  };

  const confirmDeleteFlashcard = async () => {
    if (!deletingFlashcard) return;

    try {
      const response = await fetch(`/api/flashcards/${deletingFlashcard.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete flashcard");
      }

      toast.success("Fiszka została usunięta");
      setDeletingFlashcard(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setDeletingFlashcard(null);
    }
  };

  const handleAddFlashcard = () => {
    setIsAddModalOpen(true);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // Show loading state
  if (isLoading || !setDetails) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="space-y-4">
          <div className="h-10 w-2/3 bg-muted animate-pulse rounded" />
          <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
        </div>
        <FlashcardsList flashcards={[]} onEdit={handleEditFlashcard} onDelete={handleDeleteFlashcard} isLoading={true} />
      </div>
    );
  }

  const hasFlashcards = setDetails.flashcards && setDetails.flashcards.length > 0;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <SetHeader setDetails={setDetails} onStartStudy={handleStartStudy} onDeleteSet={handleDeleteSet} />

      {/* Add Flashcard Button */}
      {hasFlashcards && (
        <div className="flex justify-end">
          <Button onClick={handleAddFlashcard} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj fiszkę
          </Button>
        </div>
      )}

      {/* Flashcards List or Empty State */}
      {hasFlashcards ? (
        <FlashcardsList
          flashcards={setDetails.flashcards}
          onEdit={handleEditFlashcard}
          onDelete={handleDeleteFlashcard}
        />
      ) : (
        <SetDetailsEmptyState onAddFlashcard={handleAddFlashcard} />
      )}

      {/* Edit Flashcard Modal */}
      <EditFlashcardModal
        open={!!editingFlashcard}
        onClose={() => setEditingFlashcard(null)}
        onSuccess={handleModalSuccess}
        flashcard={editingFlashcard}
      />

      {/* Delete Flashcard Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingFlashcard}
        onClose={() => setDeletingFlashcard(null)}
        onConfirm={confirmDeleteFlashcard}
        title="Usuń fiszkę"
        description={`Czy na pewno chcesz usunąć tę fiszkę? Ta akcja jest nieodwracalna. Postęp nauki dla tej fiszki również zostanie usunięty.`}
        confirmLabel="Usuń fiszkę"
        cancelLabel="Anuluj"
        isDestructive={true}
      />

      {/* Delete Set Confirm Dialog */}
      <ConfirmDialog
        open={isDeletingSet}
        onClose={() => setIsDeletingSet(false)}
        onConfirm={confirmDeleteSet}
        title="Usuń zestaw"
        description={`Czy na pewno chcesz usunąć zestaw "${setDetails.title}"? Wszystkie fiszki (${setDetails.cards_count}) i postępy nauki zostaną trwale usunięte. Ta akcja jest nieodwracalna.`}
        confirmLabel="Usuń zestaw"
        cancelLabel="Anuluj"
        isDestructive={true}
      />

      {/* Add Flashcard Modal */}
      <AddFlashcardModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        availableSets={setDetails ? [{
          id: setDetails.id,
          user_id: setDetails.user_id,
          title: setDetails.title,
          cards_count: setDetails.cards_count,
          due_cards_count: setDetails.due_cards_count,
          created_at: setDetails.created_at,
          updated_at: setDetails.updated_at,
        }] : []}
      />
    </div>
  );
}
