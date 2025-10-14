import { FlashcardListItem } from "./FlashcardListItem";
import { Skeleton } from "@/components/ui/skeleton";
import type { FlashcardWithProgressDTO } from "../../types";

interface FlashcardsListProps {
  flashcards: FlashcardWithProgressDTO[];
  onEdit: (flashcard: FlashcardWithProgressDTO) => void;
  onDelete: (flashcard: FlashcardWithProgressDTO) => void;
  isLoading?: boolean;
}

function FlashcardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function FlashcardsList({ flashcards, onEdit, onDelete, isLoading = false }: FlashcardsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Ładowanie fiszek">
        {Array.from({ length: 5 }).map((_, i) => (
          <FlashcardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" role="list" aria-label="Lista fiszek">
      {flashcards.map((flashcard) => (
        <FlashcardListItem key={flashcard.id} flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
