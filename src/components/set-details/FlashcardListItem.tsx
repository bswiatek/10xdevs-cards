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
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Przód:</p>
              <p className="text-sm font-medium break-words">{flashcard.front}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tył:</p>
              <p className="text-sm break-words">{flashcard.back}</p>
            </div>
            {flashcard.progress && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(flashcard)}
              aria-label={`Edytuj fiszkę: ${flashcard.front}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(flashcard)}
              aria-label={`Usuń fiszkę: ${flashcard.front}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
