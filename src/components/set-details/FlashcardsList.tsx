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
    <div className="border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  );
}

export function FlashcardsList({ flashcards, onEdit, onDelete, isLoading = false }: FlashcardsListProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Ładowanie fiszek"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <FlashcardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Lista fiszek"
    >
      {flashcards.map((flashcard) => (
        <FlashcardListItem key={flashcard.id} flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
