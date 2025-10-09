import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationSessionDTO, CandidateFlashcardDTO } from "../../types";
import { logError, logInfo } from "../logging";
import { randomUUID } from "crypto";

/**
 * Mock mode flag - set to true to use mock data instead of real AI
 * TODO: Replace with real OpenRouter integration in production
 */
const USE_MOCK_AI = true;

/**
 * Generates mock flashcard candidates for MVP testing
 * TODO: Replace with real AI integration
 */
function generateMockCandidates(sourceText: string): CandidateFlashcardDTO[] {
  const wordCount = sourceText.split(/\s+/).length;
  const candidatesCount = Math.min(Math.max(Math.floor(wordCount / 100), 3), 10);

  const mockCandidates: CandidateFlashcardDTO[] = [];

  for (let i = 0; i < candidatesCount; i++) {
    mockCandidates.push({
      temp_id: randomUUID(),
      front: `Mock Question ${i + 1}: What is the key concept from the source text?`,
      back: `Mock Answer ${i + 1}: This is a generated answer based on the provided text. It demonstrates how the flashcard system will work with real AI-generated content.`,
    });
  }

  return mockCandidates;
}

/**
 * Generates flashcard candidates from source text using mock data (MVP)
 * TODO: Replace with real OpenRouter AI integration
 *
 * @param supabase - Supabase client instance
 * @param sourceText - Text to analyze (1000-10000 characters)
 * @returns GenerationSessionDTO with candidates
 * @throws Error if database operations fail
 */
export async function generateFlashcardsFromText(
  supabase: SupabaseClient<Database>,
  sourceText: string
): Promise<GenerationSessionDTO> {
  const startTime = Date.now();

  try {
    // Step 1: Generate mock candidates (replace with real AI later)
    if (USE_MOCK_AI) {
      await logInfo(supabase, "Using mock AI generation (MVP mode)", {
        inputLength: sourceText.length,
      });
    }

    const candidates = generateMockCandidates(sourceText);
    const generationTimeMs = Date.now() - startTime;

    // Step 2: Save generation session to database
    const { data: sessionData, error: dbError } = await supabase
      .from("generation_sessions")
      .insert({
        user_id: "06f9f64c-fd4a-4466-9954-0e35ce6dfd15", // Mock user ID for MVP
        input_text: sourceText,
        input_length: sourceText.length,
        generated_count: candidates.length,
        model_name: "mock-ai-v1",
      })
      .select("id, started_at")
      .single();

    if (dbError || !sessionData) {
      await logError(supabase, "Failed to save generation session", {
        error: dbError?.message || "No data returned",
      });
      throw new Error("DATABASE_ERROR");
    }

    // Step 3: Log success
    await logInfo(supabase, "Flashcards generated successfully (mock)", {
      sessionId: sessionData.id,
      candidatesCount: candidates.length,
      generationTimeMs,
    });

    // Step 4: Return DTO
    return {
      generation_session_id: sessionData.id,
      input_length: sourceText.length,
      candidates_generated: candidates.length,
      generation_time_ms: generationTimeMs,
      candidates,
      created_at: sessionData.started_at,
    };
  } catch (error) {
    // Re-throw known errors
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw error;
    }

    // Log and throw unexpected errors
    await logError(supabase, "Unexpected error in generateFlashcardsFromText", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw new Error("GENERATION_FAILED");
  }
}
