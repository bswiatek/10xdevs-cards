import { useState, useCallback } from "react";

interface ValidationError {
  title?: string;
}

interface UseTitleValidationResult {
  errors: ValidationError;
  validate: (value: string) => boolean;
  clearErrors: () => void;
}

const MAX_TITLE_LENGTH = 200;

export function useTitleValidation(): UseTitleValidationResult {
  const [errors, setErrors] = useState<ValidationError>({});

  const validate = useCallback((value: string): boolean => {
    const trimmedValue = value.trim();
    const newErrors: ValidationError = {};

    if (trimmedValue.length === 0) {
      newErrors.title = "Tytuł zestawu jest wymagany";
    } else if (trimmedValue.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Tytuł nie może przekraczać ${MAX_TITLE_LENGTH} znaków (aktualnie: ${trimmedValue.length})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    clearErrors,
  };
}
