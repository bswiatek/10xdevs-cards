import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Play, Trash2 } from "lucide-react";
import type { FlashcardSetDetailDTO } from "../../types";

interface SetHeaderProps {
  setDetails: FlashcardSetDetailDTO;
  onStartStudy: () => void;
  onDeleteSet: () => void;
}

export function SetHeader({ setDetails, onStartStudy, onDeleteSet }: SetHeaderProps) {
  const formattedDate = new Date(setDetails.created_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasDueCards = setDetails.due_cards_count > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold break-words">{setDetails.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>{setDetails.cards_count} fiszek</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Utworzono {formattedDate}</span>
            </div>
            {hasDueCards && (
              <Badge variant="default">
                {setDetails.due_cards_count} do nauki
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onStartStudy}
            disabled={setDetails.cards_count === 0}
            aria-label={hasDueCards ? `Rozpocznij naukę ${setDetails.due_cards_count} fiszek` : "Rozpocznij naukę"}
          >
            <Play className="h-4 w-4 mr-2" />
            Rozpocznij naukę
          </Button>
          <Button variant="destructive" size="icon" onClick={onDeleteSet} aria-label="Usuń zestaw">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
