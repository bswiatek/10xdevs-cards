import { useState, useEffect, useCallback, useRef } from "react";
import type { FlashcardSetListDTO, FlashcardSetListResponseDTO, PaginationDTO } from "../../types";

interface UseDashboardSetsResult {
  sets: FlashcardSetListDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  currentPage: number;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

const DEBOUNCE_DELAY = 300;
const ITEMS_PER_PAGE = 20;

export function useDashboardSets(): UseDashboardSetsResult {
  const [sets, setSets] = useState<FlashcardSetListDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Only search if query is empty or has at least 3 characters
      if (searchQuery.length === 0 || searchQuery.length >= 3) {
        setDebouncedQuery(searchQuery.trim());
        setCurrentPage(1); // Reset to first page on search
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch sets
  const fetchSets = useCallback(async () => {
    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sort: "created_at",
        order: "desc",
      });

      if (debouncedQuery) {
        params.set("search", debouncedQuery);
      }

      const response = await fetch(`/api/flashcard-sets?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch flashcard sets");
      }

      const data: FlashcardSetListResponseDTO = await response.json();
      setSets(data.flashcard_sets);
      setPagination(data.pagination);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, ignore
        return;
      }
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setSets([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedQuery]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    sets,
    pagination,
    isLoading,
    error,
    searchQuery,
    currentPage,
    setSearchQuery,
    setCurrentPage,
    refetch: fetchSets,
  };
}
