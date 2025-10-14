import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFlashcardValidation } from "../hooks/useFlashcardValidation";
import { toast } from "sonner";
import type { FlashcardWithProgressDTO } from "../../types";

interface EditFlashcardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flashcard: FlashcardWithProgressDTO | null;
}

export function EditFlashcardModal({ open, onClose, onSuccess, flashcard }: EditFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { errors, validate, validateField, clearErrors } = useFlashcardValidation();

  // Initialize form with flashcard data
  useEffect(() => {
    if (open && flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      clearErrors();
    } else if (!open) {
      setFront("");
      setBack("");
      clearErrors();
    }
  }, [open, flashcard, clearErrors]);

  // Live validation
  const handleFrontChange = (value: string) => {
    setFront(value);
    if (errors.front) {
      validateField("front", value);
    }
  };

  const handleBackChange = (value: string) => {
    setBack(value);
    if (errors.back) {
      validateField("back", value);
    }
  };

  const handleSubmit = async () => {
    if (!flashcard) return;

    const isValid = validate({ front, back });
    if (!isValid) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update flashcard");
      }

      toast.success("Fiszka została zaktualizowana");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSaving(false);
    }
  };

  const frontLength = front.trim().length;
  const backLength = back.trim().length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl" aria-describedby="edit-flashcard-description">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <p id="edit-flashcard-description" className="text-sm text-muted-foreground">
            Zmień treść fiszki. Zmiany będą widoczne natychmiast.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Flashcard Front */}
          <div className="space-y-2">
            <Label htmlFor="edit-front">Przód fiszki</Label>
            <Textarea
              id="edit-front"
              value={front}
              onChange={(e) => handleFrontChange(e.target.value)}
              placeholder="Wprowadź pytanie lub pojęcie"
              rows={3}
              aria-invalid={!!errors.front}
              aria-describedby={errors.front ? "edit-front-error" : "edit-front-hint"}
            />
            {errors.front ? (
              <p id="edit-front-error" className="text-sm text-destructive" role="alert">
                {errors.front}
              </p>
            ) : (
              <p id="edit-front-hint" className="text-xs text-muted-foreground">
                {frontLength}/200 znaków
              </p>
            )}
          </div>

          {/* Flashcard Back */}
          <div className="space-y-2">
            <Label htmlFor="edit-back">Tył fiszki</Label>
            <Textarea
              id="edit-back"
              value={back}
              onChange={(e) => handleBackChange(e.target.value)}
              placeholder="Wprowadź odpowiedź lub definicję"
              rows={4}
              aria-invalid={!!errors.back}
              aria-describedby={errors.back ? "edit-back-error" : "edit-back-hint"}
            />
            {errors.back ? (
              <p id="edit-back-error" className="text-sm text-destructive" role="alert">
                {errors.back}
              </p>
            ) : (
              <p id="edit-back-hint" className="text-xs text-muted-foreground">
                {backLength}/500 znaków
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
