import { useState, useCallback } from "react";
import type { GenerateFlashcardsCommand, GenerationSessionDTO } from "@/types";

const TIMEOUT_MS = 60000; // 60 seconds

interface UseGenerateFormOptions {
  minChars: number;
  maxChars: number;
}

export interface GenerationErrorViewModel {
  code: "validation_400" | "timeout_60s" | "service_unavailable" | "network" | "server_500" | "unknown";
  message: string;
  timestamp: string;
}

interface UseGenerateFormReturn {
  sourceText: string;
  charCount: number;
  isValidLength: boolean;
  isSubmitting: boolean;
  error: GenerationErrorViewModel | null;
  setSourceText: (text: string) => void;
  submit: () => Promise<void>;
  resetError: () => void;
}

/**
 * Sanityzacja tekstu - usuwa znaczniki HTML i normalizuje białe znaki
 */
function sanitizeText(text: string): string {
  // Usuwanie znaczników HTML
  let sanitized = text.replace(/<[^>]*>/g, "");

  // Normalizacja białych znaków (zamiana wielu białych znaków na pojedyncze spacje)
  sanitized = sanitized.replace(/\s+/g, " ");

  // Usuwanie białych znaków z początku i końca
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Custom hook do zarządzania formularzem generowania fiszek
 */
export function useGenerateForm({ minChars, maxChars }: UseGenerateFormOptions): UseGenerateFormReturn {
  const [sourceText, setSourceTextState] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isValidLength, setIsValidLength] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<GenerationErrorViewModel | null>(null);

  const setSourceText = useCallback(
    (text: string) => {
      const sanitized = sanitizeText(text);
      const count = sanitized.length;

      setSourceTextState(sanitized);
      setCharCount(count);
      setIsValidLength(count >= minChars && count <= maxChars);

      // Reset error when user modifies text
      if (error) {
        setError(null);
      }
    },
    [minChars, maxChars, error]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (!isValidLength || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Zachowanie tekstu w localStorage na wypadek błędu
    try {
      localStorage.setItem("generate_draft", sourceText);
    } catch {
      // Ignore localStorage errors
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const command: GenerateFlashcardsCommand = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 400) {
          setError({
            code: "validation_400",
            message: errorData.message || "Nieprawidłowa długość tekstu. Wymagane 1000-10000 znaków.",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (response.status === 503) {
          setError({
            code: "service_unavailable",
            message: "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie za chwilę.",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        setError({
          code: "server_500",
          message: "Wystąpił błąd serwera. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const data: GenerationSessionDTO = await response.json();

      // Czyszczenie draft po sukcesie
      try {
        localStorage.removeItem("generate_draft");
      } catch {
        // Ignore
      }

      // Store session data in sessionStorage for the review page
      try {
        sessionStorage.setItem(`generation_session_${data.generation_session_id}`, JSON.stringify(data));
      } catch {
        // Ignore sessionStorage errors
      }

      // Przekierowanie do widoku recenzji z danymi sesji
      window.location.href = `/review/${data.generation_session_id}`;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === "AbortError") {
        setError({
          code: "timeout_60s",
          message: "Przekroczono limit czasu (60s). Spróbuj ponownie lub użyj krótszego tekstu.",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError({
          code: "network",
          message: "Błąd połączenia sieciowego. Sprawdź połączenie z internetem.",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      setError({
        code: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [sourceText, isValidLength, isSubmitting]);

  return {
    sourceText,
    charCount,
    isValidLength,
    isSubmitting,
    error,
    setSourceText,
    submit,
    resetError,
  };
}
