import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardWithProgressDTO } from "../../types";

interface FlashcardListItemProps {
  flashcard: FlashcardWithProgressDTO;
  onEdit: (flashcard: FlashcardWithProgressDTO) => void;
  onDelete: (flashcard: FlashcardWithProgressDTO) => void;
}

export function FlashcardListItem({ flashcard, onEdit, onDelete }: FlashcardListItemProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Front side */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-muted-foreground">Przód</span>
            <p className="whitespace-pre-wrap text-sm">{flashcard.front}</p>
          </div>

          {/* Back side */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-muted-foreground">Tył</span>
            <p className="whitespace-pre-wrap text-sm">{flashcard.back}</p>
          </div>

          {/* Progress info */}
          {flashcard.progress && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <span>Stan: {flashcard.progress.state}</span>
              <span>•</span>
              <span>Powtórzeń: {flashcard.progress.reps}</span>
              {flashcard.progress.lapses > 0 && (
                <>
                  <span>•</span>
                  <span>Pomyłek: {flashcard.progress.lapses}</span>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onEdit(flashcard)}
              variant="outline"
              size="sm"
              className="flex-1"
              aria-label={`Edytuj fiszkę: ${flashcard.front}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </Button>
            <Button
              onClick={() => onDelete(flashcard)}
              variant="outline"
              size="sm"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
              aria-label={`Usuń fiszkę: ${flashcard.front}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
