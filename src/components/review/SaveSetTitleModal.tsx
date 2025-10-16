import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SaveSetTitleModalProps {
  isOpen: boolean;
  acceptedCount: number;
  onSave: (title: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 200;

export function SaveSetTitleModal({ isOpen, acceptedCount, onSave, onClose, isSaving }: SaveSetTitleModalProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string>();

  // Validate title
  const validateTitle = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length < TITLE_MIN_LENGTH) {
      return "Tytuł zestawu nie może być pusty";
    }
    if (value.length > TITLE_MAX_LENGTH) {
      return `Tytuł nie może przekraczać ${TITLE_MAX_LENGTH} znaków`;
    }
    return undefined;
  };

  // Handle title change
  const handleTitleChange = (value: string) => {
    setTitle(value);
    const validationError = validateTitle(value);
    setError(validationError);
  };

  // Handle save
  const handleSave = () => {
    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(title.trim());
  };

  // Handle close
  const handleClose = () => {
    if (!isSaving) {
      setTitle("");
      setError(undefined);
      onClose();
    }
  };

  const isValid = !error && title.trim().length >= TITLE_MIN_LENGTH;
  const charCount = title.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="save-set-title-modal">
        <DialogHeader>
          <DialogTitle>Zapisz zestaw fiszek</DialogTitle>
          <DialogDescription>
            Nadaj tytuł zestawowi zawierającemu {acceptedCount} {acceptedCount === 1 ? "fiszkę" : "fiszek"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Tytuł zestawu</Label>
              <span
                className={`text-xs ${
                  charCount > TITLE_MAX_LENGTH ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                }`}
              >
                {charCount}/{TITLE_MAX_LENGTH}
              </span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="np. Historia Polski - Daty"
              className={error ? "border-red-500" : ""}
              disabled={isSaving}
              data-testid="save-set-title-input"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving} data-testid="save-set-confirm-button">
            {isSaving ? "Zapisywanie..." : "Zapisz zestaw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
