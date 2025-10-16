import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFlashcardValidation } from "../hooks/useFlashcardValidation";
import { useTitleValidation } from "../hooks/useTitleValidation";
import { toast } from "sonner";
import type { FlashcardSetListDTO } from "../../types";

interface AddFlashcardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableSets: FlashcardSetListDTO[];
}

type Mode = "existing" | "new";

export function AddFlashcardModal({ open, onClose, onSuccess, availableSets }: AddFlashcardModalProps) {
  const [mode, setMode] = useState<Mode>("existing");
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [newSetTitle, setNewSetTitle] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const flashcardValidation = useFlashcardValidation();
  const titleValidation = useTitleValidation();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setMode("existing");
      setSelectedSetId("");
      setNewSetTitle("");
      setFront("");
      setBack("");
      flashcardValidation.clearErrors();
      titleValidation.clearErrors();
    } else {
      // Set default selected set if available
      if (availableSets.length > 0 && !selectedSetId) {
        setSelectedSetId(availableSets[0].id.toString());
      }
    }
  }, [open, availableSets, selectedSetId, flashcardValidation, titleValidation]);

  // Live validation for flashcard fields
  const handleFrontChange = (value: string) => {
    setFront(value);
    if (flashcardValidation.errors.front) {
      flashcardValidation.validateField("front", value);
    }
  };

  const handleBackChange = (value: string) => {
    setBack(value);
    if (flashcardValidation.errors.back) {
      flashcardValidation.validateField("back", value);
    }
  };

  const handleTitleChange = (value: string) => {
    setNewSetTitle(value);
    if (titleValidation.errors.title) {
      titleValidation.validate(value);
    }
  };

  const handleSubmit = useCallback(async () => {
    // Validate flashcard content
    const flashcardValid = flashcardValidation.validate({ front, back });

    // Validate set selection or new title
    let titleValid = true;
    if (mode === "new") {
      titleValid = titleValidation.validate(newSetTitle);
    } else if (!selectedSetId) {
      toast.error("Wybierz zestaw fiszek");
      return;
    }

    if (!flashcardValid || !titleValid) {
      return;
    }

    setIsSaving(true);

    try {
      let setIdToUse = selectedSetId;

      // Create new set if in "new" mode
      if (mode === "new") {
        const createSetResponse = await fetch("/api/flashcard-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newSetTitle.trim() }),
        });

        if (!createSetResponse.ok) {
          const errorData = await createSetResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to create flashcard set");
        }

        const createdSet = await createSetResponse.json();
        setIdToUse = createdSet.id.toString();
      }

      // Add flashcard to the set
      const addFlashcardResponse = await fetch(`/api/flashcard-sets/${setIdToUse}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
        }),
      });

      if (!addFlashcardResponse.ok) {
        const errorData = await addFlashcardResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add flashcard");
      }

      toast.success(mode === "new" ? "Utworzono zestaw i dodano fiszkę" : "Dodano fiszkę do zestawu");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSaving(false);
    }
  }, [mode, selectedSetId, newSetTitle, front, back, flashcardValidation, titleValidation, onSuccess, onClose]);

  const frontLength = front.trim().length;
  const backLength = back.trim().length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="add-flashcard-description">
        <DialogHeader>
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <p id="add-flashcard-description" className="text-sm text-muted-foreground">
            Stwórz nową fiszkę i dodaj ją do istniejącego zestawu lub utwórz nowy zestaw
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Wybierz opcję</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <SelectTrigger aria-label="Wybierz tryb dodawania fiszki">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">Dodaj do istniejącego zestawu</SelectItem>
                <SelectItem value="new">Utwórz nowy zestaw</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Set Selection or New Set Title */}
          {mode === "existing" ? (
            <div className="space-y-2">
              <Label htmlFor="set-select">Zestaw fiszek</Label>
              {availableSets.length > 0 ? (
                <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                  <SelectTrigger id="set-select">
                    <SelectValue placeholder="Wybierz zestaw" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSets.map((set) => (
                      <SelectItem key={set.id} value={set.id.toString()}>
                        {set.title} ({set.cards_count} fiszek)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Brak dostępnych zestawów. Przełącz na tryb &quot;Utwórz nowy zestaw&quot;.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="new-set-title">Tytuł nowego zestawu</Label>
              <Input
                id="new-set-title"
                value={newSetTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Wprowadź tytuł zestawu"
                aria-invalid={!!titleValidation.errors.title}
                aria-describedby={titleValidation.errors.title ? "title-error" : undefined}
              />
              {titleValidation.errors.title && (
                <p id="title-error" className="text-sm text-destructive" role="alert">
                  {titleValidation.errors.title}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{newSetTitle.trim().length}/200 znaków</p>
            </div>
          )}

          {/* Flashcard Front */}
          <div className="space-y-2">
            <Label htmlFor="flashcard-front">Przód fiszki</Label>
            <Textarea
              id="flashcard-front"
              value={front}
              onChange={(e) => handleFrontChange(e.target.value)}
              placeholder="Wprowadź pytanie lub pojęcie"
              rows={3}
              aria-invalid={!!flashcardValidation.errors.front}
              aria-describedby={flashcardValidation.errors.front ? "front-error" : "front-hint"}
            />
            {flashcardValidation.errors.front ? (
              <p id="front-error" className="text-sm text-destructive" role="alert">
                {flashcardValidation.errors.front}
              </p>
            ) : (
              <p id="front-hint" className="text-xs text-muted-foreground">
                {frontLength}/200 znaków
              </p>
            )}
          </div>

          {/* Flashcard Back */}
          <div className="space-y-2">
            <Label htmlFor="flashcard-back">Tył fiszki</Label>
            <Textarea
              id="flashcard-back"
              value={back}
              onChange={(e) => handleBackChange(e.target.value)}
              placeholder="Wprowadź odpowiedź lub definicję"
              rows={4}
              aria-invalid={!!flashcardValidation.errors.back}
              aria-describedby={flashcardValidation.errors.back ? "back-error" : "back-hint"}
            />
            {flashcardValidation.errors.back ? (
              <p id="back-error" className="text-sm text-destructive" role="alert">
                {flashcardValidation.errors.back}
              </p>
            ) : (
              <p id="back-hint" className="text-xs text-muted-foreground">
                {backLength}/500 znaków
              </p>
            )}
          </div>

          {/* Preview */}
          {front.trim() && back.trim() && (
            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
              <p className="text-sm font-semibold">Podgląd:</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Przód:</p>
                  <p className="text-sm">{front.trim()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tył:</p>
                  <p className="text-sm">{back.trim()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Dodaj fiszkę"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
