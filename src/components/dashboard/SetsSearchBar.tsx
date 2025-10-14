import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SetsSearchBar({ value, onChange }: SetsSearchBarProps) {
  const showHint = value.length > 0 && value.length < 3;

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Szukaj zestawów..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Wyszukaj zestawy fiszek"
          aria-describedby={showHint ? "search-hint" : undefined}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onChange("")}
            aria-label="Wyczyść wyszukiwanie"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {showHint && (
        <p id="search-hint" className="text-sm text-muted-foreground" role="status">
          Wpisz min. 3 znaki, aby rozpocząć wyszukiwanie
        </p>
      )}
    </div>
  );
}
