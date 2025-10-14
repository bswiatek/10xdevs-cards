import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SetsToolbarProps {
  onAddFlashcard: () => void;
}

export function SetsToolbar({ onAddFlashcard }: SetsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button onClick={onAddFlashcard} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj fiszkę
        </Button>
      </div>
    </div>
  );
}
