import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationSessionDTO, CandidateFlashcardDTO, Message, JsonSchemaFormat } from "../../types";
import { logError, logInfo } from "../logging";
import { randomUUID } from "crypto";
import { OpenRouterService } from "./openrouter.service";

/**
 * JSON Schema for flashcard candidates
 * Defines the structure that the AI model must follow
 */
const FLASHCARD_SCHEMA: JsonSchemaFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcard_candidates",
    strict: true,
    schema: {
      type: "object",
      properties: {
        candidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: {
                type: "string",
                description: "The question or prompt side of the flashcard",
              },
              back: {
                type: "string",
                description: "The answer or explanation side of the flashcard",
              },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
        },
      },
      required: ["candidates"],
      additionalProperties: false,
    },
  },
};

/**
 * Creates the system message for flashcard generation
 */
function buildSystemMessage(): Message {
  return {
    role: "system",
    content: `You are an expert at creating educational flashcards from text content.

Your task is to analyze the provided text and generate high-quality flashcard candidates.

Guidelines:
- Extract key concepts, definitions, facts, and relationships from the text
- Create clear, concise questions that test understanding
- Provide complete, accurate answers without being overly verbose
- Generate 3-10 flashcards depending on the richness of the source material
- Focus on the most important and testable information
- Ensure questions are specific and answers are self-contained
- Use simple, direct language suitable for learning
- Avoid trivial or overly complex questions

Return your response as a JSON object with a "candidates" array containing the flashcards.`,
  };
}

/**
 * Creates the user message with the source text
 */
function buildUserMessage(sourceText: string): Message {
  return {
    role: "user",
    content: `Please analyze the following text and generate flashcard candidates:

${sourceText}

Generate between 3-10 flashcards based on the key information in this text. Return the result as JSON.`,
  };
}

/**
 * Parses and validates AI response into flashcard candidates
 */
function parseFlashcardCandidates(content: string): CandidateFlashcardDTO[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI_RESPONSE_INVALID_JSON");
  }

  // Validate structure
  if (typeof parsed !== "object" || parsed === null || !("candidates" in parsed) || !Array.isArray(parsed.candidates)) {
    throw new Error("AI_RESPONSE_INVALID_STRUCTURE");
  }

  const candidates = parsed.candidates as unknown[];

  // Validate and transform each candidate
  const result: CandidateFlashcardDTO[] = [];

  for (const candidate of candidates) {
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      !("front" in candidate) ||
      !("back" in candidate) ||
      typeof candidate.front !== "string" ||
      typeof candidate.back !== "string"
    ) {
      throw new Error("AI_RESPONSE_INVALID_CANDIDATE");
    }

    result.push({
      temp_id: randomUUID(),
      front: candidate.front.trim(),
      back: candidate.back.trim(),
    });
  }

  if (result.length === 0) {
    throw new Error("AI_RESPONSE_NO_CANDIDATES");
  }

  return result;
}

/**
 * Generates flashcard candidates from source text using OpenRouter AI
 *
 * @param supabase - Supabase client instance
 * @param sourceText - Text to analyze (1000-10000 characters)
 * @returns GenerationSessionDTO with candidates
 * @throws Error if database operations or AI generation fail
 */
export async function generateFlashcardsFromText(
  supabase: SupabaseClient<Database>,
  sourceText: string
): Promise<GenerationSessionDTO> {
  const startTime = Date.now();

  try {
    // Step 1: Initialize OpenRouter service
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      await logError(supabase, "OpenRouter API key not configured", {});
      throw new Error("AI_SERVICE_NOT_CONFIGURED");
    }

    const openRouter = new OpenRouterService({
      apiKey,
      defaultParams: {
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 2000,
      },
    });

    await logInfo(supabase, "Starting AI flashcard generation", {
      inputLength: sourceText.length,
      model: "openai/gpt-4o-mini",
    });

    // Step 2: Build messages and call AI
    const messages = [buildSystemMessage(), buildUserMessage(sourceText)];

    let aiResponse;
    try {
      aiResponse = await openRouter.chat({
        messages,
        params: {
          response_format: FLASHCARD_SCHEMA,
          structured_outputs: true,
        },
      });
    } catch (error) {
      await logError(supabase, "AI generation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("AI_GENERATION_FAILED");
    }

    // Step 3: Parse and validate AI response
    let candidates: CandidateFlashcardDTO[];
    try {
      candidates = parseFlashcardCandidates(aiResponse.content);
    } catch (error) {
      await logError(supabase, "Failed to parse AI response", {
        error: error instanceof Error ? error.message : String(error),
        responseContent: aiResponse.content,
      });
      throw new Error("AI_RESPONSE_PARSE_ERROR");
    }

    const generationTimeMs = Date.now() - startTime;

    // Step 4: Save generation session to database
    const { data: sessionData, error: dbError } = await supabase
      .from("generation_sessions")
      .insert({
        user_id: "06f9f64c-fd4a-4466-9954-0e35ce6dfd15", // Mock user ID for MVP
        input_text: sourceText,
        input_length: sourceText.length,
        generated_count: candidates.length,
        model_name: "openai/gpt-4o-mini",
      })
      .select("id, started_at")
      .single();

    if (dbError || !sessionData) {
      await logError(supabase, "Failed to save generation session", {
        error: dbError?.message || "No data returned",
      });
      throw new Error("DATABASE_ERROR");
    }

    // Step 5: Log success
    await logInfo(supabase, "Flashcards generated successfully", {
      sessionId: sessionData.id,
      candidatesCount: candidates.length,
      generationTimeMs,
      tokensUsed: aiResponse.usage?.total_tokens,
    });

    // Step 6: Return DTO
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
    if (
      error instanceof Error &&
      ["DATABASE_ERROR", "AI_SERVICE_NOT_CONFIGURED", "AI_GENERATION_FAILED", "AI_RESPONSE_PARSE_ERROR"].includes(
        error.message
      )
    ) {
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
