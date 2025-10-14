import { useState, useEffect, useCallback, useRef } from "react";
import type { FlashcardSetDetailDTO } from "../../types";

interface UseSetDetailsResult {
  setDetails: FlashcardSetDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSetDetails(setId: number): UseSetDetailsResult {
  const [setDetails, setSetDetails] = useState<FlashcardSetDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSetDetails = useCallback(async () => {
    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcard-sets/${setId}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch flashcard set details");
      }

      const data: FlashcardSetDetailDTO = await response.json();
      setSetDetails(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, ignore
        return;
      }
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setSetDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [setId]);

  // Fetch on mount and when setId changes
  useEffect(() => {
    fetchSetDetails();
  }, [fetchSetDetails]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    setDetails,
    isLoading,
    error,
    refetch: fetchSetDetails,
  };
}
