import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetDetailsEmptyStateProps {
  onAddFlashcard: () => void;
}

export function SetDetailsEmptyState({ onAddFlashcard }: SetDetailsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg" role="status">
      <FileX className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold mb-2">Brak fiszek w zestawie</h3>
      <p className="text-muted-foreground mb-4">
        Ten zestaw nie zawiera jeszcze żadnych fiszek. Dodaj pierwszą fiszkę, aby rozpocząć naukę.
      </p>
      <Button onClick={onAddFlashcard}>Dodaj pierwszą fiszkę</Button>
    </div>
  );
}
