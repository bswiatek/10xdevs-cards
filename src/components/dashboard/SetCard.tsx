import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FlashcardSetListDTO } from "../../types";
import { Calendar, FileText } from "lucide-react";

interface SetCardProps {
  set: FlashcardSetListDTO;
  onClick: (id: number) => void;
  searchQuery?: string;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 3) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SetCard({ set, onClick, searchQuery = "" }: SetCardProps) {
  const formattedDate = new Date(set.created_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(set.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(set.id);
        }
      }}
      aria-label={`Zestaw fiszek: ${set.title}, ${set.cards_count} fiszek, ${set.due_cards_count} do nauki`}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-start justify-between gap-2">
          <span className="flex-1 break-words">{highlightText(set.title, searchQuery)}</span>
          {set.due_cards_count > 0 && (
            <Badge variant="default" className="shrink-0">
              {set.due_cards_count} do nauki
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>{set.cards_count} fiszek</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
