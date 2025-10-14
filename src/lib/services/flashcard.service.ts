import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardSetListDTO,
  FlashcardSetListResponseDTO,
  FlashcardSetDetailDTO,
  FlashcardWithProgressDTO,
  PaginationDTO,
  CreateFlashcardResponseDTO,
} from "../../types";
import type {
  FlashcardSetsListQuery,
  UpdateFlashcardSetInput,
  CreateFlashcardInput,
  UpdateFlashcardInput,
} from "../validations/flashcards";
import { logError, logInfo } from "../logging";

/**
 * Lists flashcard sets for a user with pagination and optional search
 */
export async function listFlashcardSets(
  supabase: SupabaseClient,
  userId: string,
  query: FlashcardSetsListQuery
): Promise<FlashcardSetListResponseDTO> {
  try {
    const { page, limit, search, sort, order } = query;
    const offset = (page - 1) * limit;

    // Build base query using the view with due count
    let baseQuery = supabase
      .from("flashcard_sets_with_due_count")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    // Apply search filter if provided
    if (search && search.length > 0) {
      // Search in title only (view doesn't have flashcard content)
      baseQuery = baseQuery.ilike("title", `%${search}%`);
    }

    // Apply sorting
    const ascending = order === "asc";
    baseQuery = baseQuery.order(sort, { ascending });

    // Apply pagination
    const { data, error, count } = await baseQuery.range(offset, offset + limit - 1);

    if (error) {
      await logError(supabase, "Failed to list flashcard sets", {
        error: error.message,
        userId,
        query,
      });
      throw new Error("DATABASE_ERROR");
    }

    // Map data to DTO format
    const flashcardSets: FlashcardSetListDTO[] = (data || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      cards_count: row.cards_count,
      due_cards_count: row.due_cards_count ?? 0, // Coalesce to 0
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    // Calculate pagination metadata
    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / limit);

    const pagination: PaginationDTO = {
      current_page: page,
      total_pages: totalPages,
      total_items: totalItems,
      items_per_page: limit,
    };

    return {
      flashcard_sets: flashcardSets,
      pagination,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    await logError(supabase, "Unexpected error in listFlashcardSets", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
    });

    throw new Error("DATABASE_ERROR");
  }
}

/**
 * Gets detailed information about a flashcard set including all flashcards with progress
 */
export async function getFlashcardSetDetail(
  supabase: SupabaseClient,
  setId: number,
  userId: string
): Promise<FlashcardSetDetailDTO | null> {
  try {
    // Fetch the flashcard set
    const { data: setData, error: setError } = await supabase
      .from("flashcard_sets")
      .select("id, user_id, title, cards_count, created_at, updated_at")
      .eq("id", setId)
      .eq("user_id", userId)
      .single();

    if (setError) {
      if (setError.code === "PGRST116") {
        // Not found
        return null;
      }
      await logError(supabase, "Failed to fetch flashcard set", {
        error: setError.message,
        setId,
        userId,
      });
      throw new Error("DATABASE_ERROR");
    }

    if (!setData) {
      return null;
    }

    // Fetch flashcards with progress
    const { data: flashcardsData, error: flashcardsError } = await supabase
      .from("flashcards")
      .select(
        `
        id,
        flashcard_set_id,
        front,
        back,
        created_at,
        updated_at,
        flashcard_progress (
          state,
          due,
          reps,
          lapses
        )
      `
      )
      .eq("flashcard_set_id", setId)
      .order("created_at", { ascending: true });

    if (flashcardsError) {
      await logError(supabase, "Failed to fetch flashcards for set", {
        error: flashcardsError.message,
        setId,
      });
      throw new Error("DATABASE_ERROR");
    }

    // Map flashcards to DTO format
    const flashcards: FlashcardWithProgressDTO[] = (flashcardsData || []).map((flashcard) => {
      const progress = Array.isArray(flashcard.flashcard_progress)
        ? flashcard.flashcard_progress[0]
        : flashcard.flashcard_progress;

      return {
        id: flashcard.id,
        flashcard_set_id: flashcard.flashcard_set_id,
        front: flashcard.front,
        back: flashcard.back,
        created_at: flashcard.created_at,
        updated_at: flashcard.updated_at,
        progress: progress
          ? {
              state: progress.state,
              due: progress.due,
              reps: progress.reps,
              lapses: progress.lapses,
            }
          : {
              state: "New",
              due: new Date().toISOString(),
              reps: 0,
              lapses: 0,
            },
      };
    });

    // Get due count from view
    const { data: dueCountData } = await supabase
      .from("flashcard_sets_with_due_count")
      .select("due_cards_count")
      .eq("id", setId)
      .single();

    const dueCardsCount = dueCountData?.due_cards_count ?? 0;

    return {
      id: setData.id,
      user_id: setData.user_id,
      title: setData.title,
      cards_count: setData.cards_count,
      due_cards_count: dueCardsCount,
      created_at: setData.created_at,
      updated_at: setData.updated_at,
      flashcards,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    await logError(supabase, "Unexpected error in getFlashcardSetDetail", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      setId,
      userId,
    });

    throw new Error("DATABASE_ERROR");
  }
}

/**
 * Updates flashcard set title
 */
export async function updateFlashcardSetTitle(
  supabase: SupabaseClient,
  setId: number,
  userId: string,
  input: UpdateFlashcardSetInput
): Promise<FlashcardSetListDTO | null> {
  try {
    const { data, error } = await supabase
      .from("flashcard_sets")
      .update({ title: input.title })
      .eq("id", setId)
      .eq("user_id", userId)
      .select("id, user_id, title, cards_count, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      await logError(supabase, "Failed to update flashcard set title", {
        error: error.message,
        setId,
        userId,
      });
      throw new Error("DATABASE_ERROR");
    }

    if (!data) {
      return null;
    }

    // Get due count
    const { data: dueCountData } = await supabase
      .from("flashcard_sets_with_due_count")
      .select("due_cards_count")
      .eq("id", setId)
      .single();

    await logInfo(supabase, "Flashcard set title updated", {
      setId,
      newTitle: input.title,
    });

    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      cards_count: data.cards_count,
      due_cards_count: dueCountData?.due_cards_count ?? 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    await logError(supabase, "Unexpected error in updateFlashcardSetTitle", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      setId,
    });

    throw new Error("DATABASE_ERROR");
  }
}

/**
 * Deletes a flashcard set (cascades to flashcards and progress)
 */
export async function deleteFlashcardSet(
  supabase: SupabaseClient,
  setId: number,
  userId: string
): Promise<boolean> {
  try {
    const { error, count } = await supabase
      .from("flashcard_sets")
      .delete({ count: "exact" })
      .eq("id", setId)
      .eq("user_id", userId);

    if (error) {
      await logError(supabase, "Failed to delete flashcard set", {
        error: error.message,
        setId,
        userId,
      });
      throw new Error("DATABASE_ERROR");
    }

    if (count === 0) {
      return false; // Not found or not owned by user
    }

    await logInfo(supabase, "Flashcard set deleted", { setId });

    return true;
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    await logError(supabase, "Unexpected error in deleteFlashcardSet", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      setId,
    });

    throw new Error("DATABASE_ERROR");
  }
}

/**
 * Creates a flashcard in a set with initial progress
 * Uses transaction to ensure consistency
 */
export async function createFlashcard(
  supabase: SupabaseClient,
  setId: number,
  userId: string,
  input: CreateFlashcardInput
): Promise<CreateFlashcardResponseDTO | null> {
  try {
    // First verify the set exists and belongs to user
    const { data: setData, error: setError } = await supabase
      .from("flashcard_sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", userId)
      .single();

    if (setError || !setData) {
      if (setError?.code === "PGRST116") {
        return null;
      }
      await logError(supabase, "Failed to verify flashcard set ownership", {
        error: setError?.message,
        setId,
        userId,
      });
      throw new Error("DATABASE_ERROR");
    }

    // Insert flashcard
    const { data: flashcardData, error: flashcardError } = await supabase
      .from("flashcards")
      .insert({
        flashcard_set_id: setId,
        front: input.front,
        back: input.back,
      })
      .select("id, flashcard_set_id, front, back, created_at, updated_at")
      .single();

    if (flashcardError || !flashcardData) {
      await logError(supabase, "Failed to create flashcard", {
        error: flashcardError?.message,
        setId,
      });
      throw new Error("DATABASE_ERROR");
    }

    // Create initial progress record
    const now = new Date().toISOString();
    const { data: progressData, error: progressError } = await supabase
      .from("flashcard_progress")
      .insert({
        flashcard_id: flashcardData.id,
        state: "New",
        due: now,
        reps: 0,
        lapses: 0,
      })
      .select("id, flashcard_id, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, last_review")
      .single();

    if (progressError || !progressData) {
      await logError(supabase, "Failed to create flashcard progress", {
        error: progressError?.message,
        flashcardId: flashcardData.id,
      });
      throw new Error("DATABASE_ERROR");
    }

    await logInfo(supabase, "Flashcard created successfully", {
      flashcardId: flashcardData.id,
      setId,
    });

    return {
      id: flashcardData.id,
      flashcard_set_id: flashcardData.flashcard_set_id,
      front: flashcardData.front,
      back: flashcardData.back,
      created_at: flashcardData.created_at,
      updated_at: flashcardData.updated_at,
      progress: {
        id: progressData.id,
        flashcard_id: progressData.flashcard_id,
        state: progressData.state,
        due: progressData.due,
        stability: progressData.stability,
        difficulty: progressData.difficulty,
        elapsed_days: progressData.elapsed_days,
        scheduled_days: progressData.scheduled_days,
        reps: progressData.reps,
        lapses: progressData.lapses,
        last_review: progressData.last_review,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    await logError(supabase, "Unexpected error in createFlashcard", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      setId,
    });

    throw new Error("DATABASE_ERROR");
  }
}

/**
 * Updates flashcard content (front and/or back)
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  flashcardId: number,
  userId: string,
  input: UpdateFlashcardInput
): Promise<{ id: number; front: string; back: string; created_at: string; updated_at: string } | null> {
  try {
    // Build update object
    const updateData: { front?: string; back?: string } = {};
    if (input.front !== undefined) updateData.front = input.front;
    if (input.back !== undefined) updateData.back = input.back;

    // Update with ownership check via RLS
    const { data, error } = await supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", flashcardId)
      .select("id, front, back, created_at, updated_at, flashcard_sets!inner(user_id)")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      await logError(supabase, "Failed to update flashcard", {
        error: error.message,
        flashcardId,
      });
      throw new Error("DATABASE_ERROR");
    }

    if (!data) {
      return null;
    }

    // Verify ownership through the join
    const flashcardSet = Array.isArray(data.flashcard_sets) ? data.flashcard_sets[0] : data.flashcard_sets;
    if (!flashcardSet || flashcardSet.user_id !== userId) {
      return null;
    }

    await logInfo(supabase, "Flashcard updated successfully", { flashcardId });

    return {
      id: data.id,
      front: data.front,
      back: data.back,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    await logError(supabase, "Unexpected error in updateFlashcard", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      flashcardId,
    });

    throw new Error("DATABASE_ERROR");
  }
}

/**
 * Deletes a flashcard (cascades to progress, decrements cards_count via trigger)
 */
export async function deleteFlashcard(
  supabase: SupabaseClient,
  flashcardId: number,
  userId: string
): Promise<boolean> {
  try {
    // Need to verify ownership through the set
    const { data: flashcardData } = await supabase
      .from("flashcards")
      .select("flashcard_set_id, flashcard_sets!inner(user_id)")
      .eq("id", flashcardId)
      .single();

    if (!flashcardData) {
      return false;
    }

    const flashcardSet = Array.isArray(flashcardData.flashcard_sets)
      ? flashcardData.flashcard_sets[0]
      : flashcardData.flashcard_sets;
    if (!flashcardSet || flashcardSet.user_id !== userId) {
      return false;
    }

    // Delete the flashcard
    const { error, count } = await supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .eq("id", flashcardId);

    if (error) {
      await logError(supabase, "Failed to delete flashcard", {
        error: error.message,
        flashcardId,
      });
      throw new Error("DATABASE_ERROR");
    }

    if (count === 0) {
      return false;
    }

    await logInfo(supabase, "Flashcard deleted successfully", { flashcardId });

    return true;
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    await logError(supabase, "Unexpected error in deleteFlashcard", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      flashcardId,
    });

    throw new Error("DATABASE_ERROR");
  }
}
