import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { ReviewCandidateVM } from "@/types";

interface EditCandidateModalProps {
  isOpen: boolean;
  candidate?: ReviewCandidateVM;
  onSave: (candidateId: string, front: string, back: string) => void;
  onClose: () => void;
}

const FRONT_MAX_LENGTH = 200;
const BACK_MAX_LENGTH = 500;

export function EditCandidateModal({ isOpen, candidate, onSave, onClose }: EditCandidateModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  // Initialize form when candidate changes
  useEffect(() => {
    if (candidate) {
      setFront(candidate.front);
      setBack(candidate.back);
      setErrors({});
    }
  }, [candidate]);

  // Validate front field
  const validateFront = (value: string): string | undefined => {
    if (value.trim().length === 0) {
      return "Przód fiszki nie może być pusty";
    }
    if (value.length > FRONT_MAX_LENGTH) {
      return `Przód fiszki nie może przekraczać ${FRONT_MAX_LENGTH} znaków`;
    }
    return undefined;
  };

  // Validate back field
  const validateBack = (value: string): string | undefined => {
    if (value.trim().length === 0) {
      return "Tył fiszki nie może być pusty";
    }
    if (value.length > BACK_MAX_LENGTH) {
      return `Tył fiszki nie może przekraczać ${BACK_MAX_LENGTH} znaków`;
    }
    return undefined;
  };

  // Handle front change with validation
  const handleFrontChange = (value: string) => {
    setFront(value);
    const error = validateFront(value);
    setErrors((prev) => ({ ...prev, front: error }));
  };

  // Handle back change with validation
  const handleBackChange = (value: string) => {
    setBack(value);
    const error = validateBack(value);
    setErrors((prev) => ({ ...prev, back: error }));
  };

  // Handle save
  const handleSave = () => {
    const frontError = validateFront(front);
    const backError = validateBack(back);

    if (frontError || backError) {
      setErrors({ front: frontError, back: backError });
      return;
    }

    if (candidate) {
      onSave(candidate.id, front, back);
      handleClose();
    }
  };

  // Handle close
  const handleClose = () => {
    setFront("");
    setBack("");
    setErrors({});
    onClose();
  };

  const isValid = !errors.front && !errors.back && front.trim() && back.trim();
  const frontCharCount = front.length;
  const backCharCount = back.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>
            Wprowadź zmiany w treści fiszki. Przód może mieć maksymalnie {FRONT_MAX_LENGTH} znaków, a tył{" "}
            {BACK_MAX_LENGTH} znaków.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Front field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="front">Przód fiszki</Label>
              <span
                className={`text-xs ${
                  frontCharCount > FRONT_MAX_LENGTH ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                }`}
              >
                {frontCharCount}/{FRONT_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => handleFrontChange(e.target.value)}
              placeholder="Wprowadź przód fiszki..."
              className={`min-h-[100px] ${errors.front ? "border-red-500" : ""}`}
            />
            {errors.front && <p className="text-sm text-red-600 dark:text-red-400">{errors.front}</p>}
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="back">Tył fiszki</Label>
              <span
                className={`text-xs ${
                  backCharCount > BACK_MAX_LENGTH ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                }`}
              >
                {backCharCount}/{BACK_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => handleBackChange(e.target.value)}
              placeholder="Wprowadź tył fiszki..."
              className={`min-h-[150px] ${errors.back ? "border-red-500" : ""}`}
            />
            {errors.back && <p className="text-sm text-red-600 dark:text-red-400">{errors.back}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
