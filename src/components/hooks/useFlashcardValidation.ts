import { useState, useCallback } from "react";

interface FlashcardValidation {
  front: string;
  back: string;
}

interface ValidationErrors {
  front?: string;
  back?: string;
}

interface UseFlashcardValidationResult {
  errors: ValidationErrors;
  validate: (values: FlashcardValidation) => boolean;
  validateField: (field: keyof FlashcardValidation, value: string) => string | undefined;
  clearErrors: () => void;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

export function useFlashcardValidation(): UseFlashcardValidationResult {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((field: keyof FlashcardValidation, value: string): string | undefined => {
    const trimmedValue = value.trim();

    if (field === "front") {
      if (trimmedValue.length === 0) {
        return "Przód fiszki jest wymagany";
      }
      if (trimmedValue.length > MAX_FRONT_LENGTH) {
        return `Przód fiszki nie może przekraczać ${MAX_FRONT_LENGTH} znaków (aktualnie: ${trimmedValue.length})`;
      }
    }

    if (field === "back") {
      if (trimmedValue.length === 0) {
        return "Tył fiszki jest wymagany";
      }
      if (trimmedValue.length > MAX_BACK_LENGTH) {
        return `Tył fiszki nie może przekraczać ${MAX_BACK_LENGTH} znaków (aktualnie: ${trimmedValue.length})`;
      }
    }

    return undefined;
  }, []);

  const validate = useCallback(
    (values: FlashcardValidation): boolean => {
      const newErrors: ValidationErrors = {};

      const frontError = validateField("front", values.front);
      if (frontError) newErrors.front = frontError;

      const backError = validateField("back", values.back);
      if (backError) newErrors.back = backError;

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
  };
}
