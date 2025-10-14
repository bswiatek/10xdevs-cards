import { FileX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  onAddFlashcard?: () => void;
}

export function EmptyState({ searchQuery, onClearSearch, onAddFlashcard }: EmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center" role="status">
        <Search className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold mb-2">Brak wyników wyszukiwania</h3>
        <p className="text-muted-foreground mb-4">
          Nie znaleziono zestawów pasujących do zapytania &quot;{searchQuery}&quot;
        </p>
        {onClearSearch && (
          <Button variant="outline" onClick={onClearSearch}>
            Wyczyść wyszukiwanie
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" role="status">
      <FileX className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold mb-2">Brak zestawów fiszek</h3>
      <p className="text-muted-foreground mb-4">
        Nie masz jeszcze żadnych zestawów fiszek. Stwórz pierwszy zestaw, aby rozpocząć naukę.
      </p>
      {onAddFlashcard && (
        <Button onClick={onAddFlashcard}>
          Dodaj pierwszą fiszkę
        </Button>
      )}
    </div>
  );
}
