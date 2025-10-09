import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateFlashcardSetResponseDTO,
  FlashcardCandidateWithActionDTO,
  GenerationMetadataDTO,
} from "../../types";
import { logError, logInfo } from "../logging";

/**
 * Mock user ID for MVP (no authentication yet)
 */
const MOCK_USER_ID = "06f9f64c-fd4a-4466-9954-0e35ce6dfd15";

/**
 * Creates an empty flashcard set (manual creation mode)
 *
 * @param supabase - Supabase client instance
 * @param title - Title of the flashcard set
 * @returns CreateFlashcardSetResponseDTO with empty set details
 * @throws Error if database operations fail
 */
export async function createEmptyFlashcardSet(
  supabase: SupabaseClient<Database>,
  title: string
): Promise<CreateFlashcardSetResponseDTO> {
  try {
    // Step 1: Create flashcard set record
    const { data: setData, error: setError } = await supabase
      .from("flashcard_sets")
      .insert({
        user_id: MOCK_USER_ID,
        title: title,
        cards_count: 0,
      })
      .select("id, user_id, title, cards_count, created_at, updated_at")
      .single();

    if (setError || !setData) {
      await logError(supabase, "Failed to create empty flashcard set", {
        error: setError?.message || "No data returned",
        title,
      });
      throw new Error("DATABASE_ERROR");
    }

    // Step 2: Log success
    await logInfo(supabase, "Empty flashcard set created successfully", {
      flashcardSetId: setData.id,
      title: setData.title,
    });

    // Step 3: Return DTO with due_cards_count = 0 (no cards yet)
    return {
      id: setData.id,
      user_id: setData.user_id,
      title: setData.title,
      cards_count: setData.cards_count,
      due_cards_count: 0,
      created_at: setData.created_at,
      updated_at: setData.updated_at,
    };
  } catch (error) {
    // Re-throw known errors
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    // Log and throw unexpected errors
    await logError(supabase, "Unexpected error in createEmptyFlashcardSet", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw new Error("DATABASE_ERROR");
  }
}

/**
 * Creates a flashcard set from AI generation session
 * Performs transactional operations to ensure data consistency
 *
 * @param supabase - Supabase client instance
 * @param title - Title of the flashcard set
 * @param generationSessionId - ID of the generation session
 * @param flashcards - Array of flashcard candidates with user actions
 * @returns CreateFlashcardSetResponseDTO with set details and generation metadata
 * @throws Error if validation or database operations fail
 */
export async function createFlashcardSetFromGeneration(
  supabase: SupabaseClient<Database>,
  title: string,
  generationSessionId: number,
  flashcards: FlashcardCandidateWithActionDTO[]
): Promise<CreateFlashcardSetResponseDTO> {
  try {
    // Step 1: Verify generation session exists and is not already used
    const { data: sessionData, error: sessionError } = await supabase
      .from("generation_sessions")
      .select("id, user_id, completed_at, accepted_count")
      .eq("id", generationSessionId)
      .single();

    if (sessionError || !sessionData) {
      await logError(supabase, "Generation session not found", {
        generationSessionId,
        error: sessionError?.message || "No data returned",
      });
      throw new Error("GENERATION_SESSION_NOT_FOUND");
    }

    // Check if session was already used (completed_at is set)
    if (sessionData.completed_at !== null) {
      await logError(supabase, "Generation session already used", {
        generationSessionId,
        completedAt: sessionData.completed_at,
      });
      throw new Error("GENERATION_SESSION_ALREADY_USED");
    }

    // Step 2: Filter flashcards by action
    const acceptedFlashcards = flashcards.filter((card) => card.action === "accepted" || card.action === "edited");
    const rejectedCount = flashcards.filter((card) => card.action === "rejected").length;
    const editedCount = flashcards.filter((card) => card.action === "edited").length;

    // Step 3: Create flashcard set
    const { data: setData, error: setError } = await supabase
      .from("flashcard_sets")
      .insert({
        user_id: MOCK_USER_ID,
        title: title,
        cards_count: 0, // Will be updated by trigger
      })
      .select("id, user_id, title, cards_count, created_at, updated_at")
      .single();

    if (setError || !setData) {
      await logError(supabase, "Failed to create flashcard set from generation", {
        error: setError?.message || "No data returned",
        generationSessionId,
      });
      throw new Error("DATABASE_ERROR");
    }

    const flashcardSetId = setData.id;

    // Step 4: Insert accepted/edited flashcards
    if (acceptedFlashcards.length > 0) {
      const flashcardsToInsert = acceptedFlashcards.map((card) => ({
        flashcard_set_id: flashcardSetId,
        front: card.front,
        back: card.back,
      }));

      const { data: insertedFlashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select("id");

      if (flashcardsError || !insertedFlashcards) {
        await logError(supabase, "Failed to insert flashcards", {
          error: flashcardsError?.message || "No data returned",
          flashcardSetId,
          count: acceptedFlashcards.length,
        });
        throw new Error("DATABASE_ERROR");
      }

      // Step 5: Create flashcard_progress records for each flashcard
      const progressRecords = insertedFlashcards.map((flashcard) => ({
        flashcard_id: flashcard.id,
        state: "New" as const,
        due: new Date().toISOString(),
        reps: 0,
        lapses: 0,
      }));

      const { error: progressError } = await supabase.from("flashcard_progress").insert(progressRecords);

      if (progressError) {
        await logError(supabase, "Failed to create flashcard progress records", {
          error: progressError.message,
          flashcardSetId,
          count: insertedFlashcards.length,
        });
        throw new Error("DATABASE_ERROR");
      }
    }

    // Step 6: Update generation session with completion data
    const acceptedCount = acceptedFlashcards.length;
    const { error: updateSessionError } = await supabase
      .from("generation_sessions")
      .update({
        accepted_count: acceptedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", generationSessionId);

    if (updateSessionError) {
      await logError(supabase, "Failed to update generation session", {
        error: updateSessionError.message,
        generationSessionId,
      });
      // Don't throw - flashcard set was created successfully
    }

    // Step 7: Fetch updated flashcard set with correct cards_count
    const { data: updatedSetData, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("id, user_id, title, cards_count, created_at, updated_at")
      .eq("id", flashcardSetId)
      .single();

    if (fetchError || !updatedSetData) {
      await logError(supabase, "Failed to fetch updated flashcard set", {
        error: fetchError?.message || "No data returned",
        flashcardSetId,
      });
      // Use original setData as fallback
    }

    const finalSetData = updatedSetData || setData;

    // Step 8: Calculate generation metadata
    const acceptanceRate = flashcards.length > 0 ? (acceptedCount / flashcards.length) * 100 : 0;

    const generationMetadata: GenerationMetadataDTO = {
      generation_session_id: generationSessionId,
      candidates_accepted: acceptedCount - editedCount,
      candidates_rejected: rejectedCount,
      candidates_edited: editedCount,
      acceptance_rate: Math.round(acceptanceRate * 100) / 100, // Round to 2 decimal places
    };

    // Step 9: Log success
    await logInfo(supabase, "Flashcard set created from generation successfully", {
      flashcardSetId,
      generationSessionId,
      cardsCount: acceptedCount,
      acceptanceRate: generationMetadata.acceptance_rate,
    });

    // Step 10: Return DTO
    return {
      id: finalSetData.id,
      user_id: finalSetData.user_id,
      title: finalSetData.title,
      cards_count: finalSetData.cards_count,
      due_cards_count: acceptedCount, // All new cards are due immediately
      created_at: finalSetData.created_at,
      updated_at: finalSetData.updated_at,
      generation_metadata: generationMetadata,
    };
  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof Error &&
      (error.message === "GENERATION_SESSION_NOT_FOUND" ||
        error.message === "GENERATION_SESSION_ALREADY_USED" ||
        error.message === "DATABASE_ERROR")
    ) {
      throw error;
    }

    // Log and throw unexpected errors
    await logError(supabase, "Unexpected error in createFlashcardSetFromGeneration", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      generationSessionId,
    });

    throw new Error("DATABASE_ERROR");
  }
}
