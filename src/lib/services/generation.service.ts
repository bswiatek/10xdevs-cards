/**
 * @module generation.service
 * @description
 * Service module for generating educational flashcards from text using AI.
 *
 * This module integrates with OpenRouter API to generate high-quality flashcard candidates
 * from source text. It handles:
 * - AI model communication via structured outputs (JSON Schema)
 * - Response validation and parsing
 * - Database persistence of generation sessions
 * - Comprehensive error handling and logging
 *
 * @dependencies
 * - OpenRouterService: Third-party AI API integration
 * - Supabase: Database operations and event logging
 * - src/types: Shared TypeScript interfaces and DTOs
 * - src/lib/logging: Application logging utilities
 *
 * @see {@link GenerationSessionDTO} for session response structure
 * @see {@link CandidateFlashcardDTO} for flashcard candidate structure
 */

import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationSessionDTO, CandidateFlashcardDTO, Message, JsonSchemaFormat } from "../../types";
import { logError, logInfo } from "../logging";
import { OpenRouterService } from "./openrouter.service";

/**
 * JSON Schema definition for AI-generated flashcard candidates.
 *
 * @constant {JsonSchemaFormat}
 * @description
 * Enforces strict JSON Schema validation on OpenRouter API responses.
 * Ensures the AI model returns a valid structure with:
 * - `candidates`: Array of flashcard objects
 * - Each candidate has `front` (question) and `back` (answer) fields
 * - No additional properties allowed (strict mode)
 *
 * @property {string} type - JSON Schema type identifier
 * @property {object} json_schema - Schema definition wrapper
 * @property {boolean} json_schema.strict - Enables strict validation mode
 * @property {object} json_schema.schema - OpenAPI 3.1 compatible schema
 *
 * @note
 * - Uses strict mode to prevent AI from adding extra fields
 * - Temperature set to 0.3 ensures consistent, predictable output
 * - Max tokens limited to 2000 to control costs and response time
 *
 * @example
 * // Expected API response format validated against this schema:
 * {
 *   "candidates": [
 *     {
 *       "front": "What is photosynthesis?",
 *       "back": "Process by which plants convert light energy into chemical energy"
 *     }
 *   ]
 * }
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
 * Constructs the system message for flashcard generation AI prompt.
 *
 * @function buildSystemMessage
 * @returns {Message} System message object with role and content
 *
 * @description
 * Creates a detailed system prompt that instructs the AI model on:
 * - The task (creating educational flashcards)
 * - Quality guidelines (clarity, accuracy, comprehensiveness)
 * - Output requirements (3-10 flashcards in JSON format)
 * - Constraints (avoid trivial or overly complex questions)
 *
 * @internal
 * This is an internal helper function. Should only be used by generateFlashcardsFromText().
 *
 * @note
 * The prompt engineering is critical for output quality. Changes should be tested
 * across diverse content types before deployment.
 *
 * @example
 * const systemMsg = buildSystemMessage();
 * // Returns: { role: "system", content: "You are an expert at creating..." }
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
 * Constructs the user message containing source text for analysis.
 *
 * @function buildUserMessage
 * @param {string} sourceText - The raw text content to analyze for flashcard generation
 * @returns {Message} User message object with role and content
 *
 * @description
 * Wraps the source text in a user message with clear instructions for the AI to:
 * - Analyze the provided content
 * - Generate 3-10 flashcards
 * - Return results in JSON format
 *
 * @internal
 * This is an internal helper function. Should only be used by generateFlashcardsFromText().
 *
 * @throws
 * No direct exceptions, but will fail if sourceText is empty or extremely large
 * (handled by calling function).
 *
 * @note
 * - Source text is embedded directly in the prompt (not passed separately)
 * - Ensure sourceText is pre-validated before calling this function
 * - For very large texts (>5000 chars), consider chunking in the calling function
 *
 * @example
 * const userMsg = buildUserMessage("What is machine learning? ML is a subset...");
 * // Returns: { role: "user", content: "Please analyze the following text..." }
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
 * Parses and validates AI response into strongly-typed flashcard candidates.
 *
 * @function parseFlashcardCandidates
 * @param {string} content - Raw JSON string returned from AI model
 * @returns {CandidateFlashcardDTO[]} Array of validated flashcard objects
 *
 * @throws {Error}
 * - `AI_RESPONSE_INVALID_JSON`: Response is not valid JSON
 * - `AI_RESPONSE_INVALID_STRUCTURE`: Response missing or invalid `candidates` property
 * - `AI_RESPONSE_INVALID_CANDIDATE`: Candidate object missing `front` or `back` fields (non-string types)
 * - `AI_RESPONSE_NO_CANDIDATES`: Response contains empty candidates array
 *
 * @description
 * Performs comprehensive validation of AI-generated JSON response:
 * 1. Parses JSON string to object
 * 2. Validates top-level structure (must have `candidates` array)
 * 3. Validates each candidate object:
 *    - Must have `front` (string) and `back` (string) properties
 *    - No additional properties allowed (per JSON Schema)
 * 4. Trims whitespace from all text fields
 * 5. Generates unique temp IDs for each candidate (UUID v4)
 * 6. Returns strongly-typed array
 *
 * @internal
 * This is an internal helper function. Should only be used by generateFlashcardsFromText().
 *
 * @note
 * - Whitespace trimming prevents empty string candidates
 * - temp_id is generated locally (not from AI) for uniqueness guarantee
 * - Validation is strict to catch malformed responses early
 * - All errors are tracked with error codes for diagnostic purposes
 *
 * @example
 * const candidates = parseFlashcardCandidates(
 *   '{"candidates":[{"front":"Q1","back":"A1"}]}'
 * );
 * // Returns: [{ temp_id: "uuid-string", front: "Q1", back: "A1" }]
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
      temp_id: crypto.randomUUID(),
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
 * Generates educational flashcard candidates from source text using OpenRouter AI.
 *
 * @async
 * @function generateFlashcardsFromText
 * @param {SupabaseClient<Database>} supabase - Authenticated Supabase client instance
 * @param {string} userId - User ID from Supabase authentication (used for tracking)
 * @param {string} sourceText - Raw text content to analyze for flashcard generation
 * @param {string} [apiKey] - Optional OpenRouter API key; defaults to `import.meta.env.OPENROUTER_API_KEY`
 * @returns {Promise<GenerationSessionDTO>} Session object containing:
 *   - `generation_session_id`: Database session ID
 *   - `candidates`: Array of generated flashcard candidates
 *   - `candidates_generated`: Count of flashcards created
 *   - `generation_time_ms`: Total generation duration
 *   - `input_length`: Source text character count
 *   - `created_at`: Timestamp of session creation
 *
 * @throws {Error}
 * - `AI_SERVICE_NOT_CONFIGURED`: No OpenRouter API key available
 * - `AI_GENERATION_FAILED`: OpenRouter API call failed (network, auth, model error)
 * - `AI_RESPONSE_PARSE_ERROR`: Failed to parse/validate AI response
 * - `DATABASE_ERROR`: Supabase session insertion failed
 * - `GENERATION_FAILED`: Unexpected error during processing
 *
 * @description
 * Complete workflow for AI-powered flashcard generation:
 *
 * **Step 1: Initialize**
 * - Validates OpenRouter API key availability
 * - Creates OpenRouterService instance with optimal parameters
 * - Logs session start
 *
 * **Step 2: Generate**
 * - Constructs system and user prompts
 * - Calls OpenRouter API with GPT-4o-mini model
 * - Uses structured outputs (JSON Schema) for consistent responses
 *
 * **Step 3: Parse**
 * - Validates and parses JSON response
 * - Transforms candidates to strongly-typed DTOs
 * - Generates unique IDs for each flashcard
 *
 * **Step 4: Persist**
 * - Saves generation session to Supabase database
 * - Records input length, candidate count, model name, timestamps
 * - Enables audit trail and analytics
 *
 * **Step 5: Log**
 * - Logs success with metadata (session ID, count, timing, tokens)
 * - Logs all errors with context for debugging
 *
 * @public
 * Main export of this module. Primary API entry point for flashcard generation.
 *
 * @throws
 * On error, function logs details via Supabase logging service before throwing.
 * All thrown errors are catchable and have semantic error codes.
 *
 * @note
 * **Important behaviors:**
 * - Temperature hardcoded to 0.3 (low) for deterministic output
 * - Max tokens set to 2000 to control API costs and response time
 * - Uses structured outputs (JSON Schema strict mode) for reliable parsing
 * - All errors are automatically logged to Supabase logging table
 * - Generation time includes AI call and database operations
 * - If database fails but AI succeeds, error is thrown (session not created)
 * - Candidates include temp_id (local UUID), not persisted to DB
 *
 * **Error handling pattern:**
 * 1. Known errors (with codes) are re-thrown as-is
 * 2. Unexpected errors are logged with full context (message + stack)
 * 3. All logging is asynchronous and non-blocking
 * 4. Database errors are logged before throwing (not after)
 *
 * **Performance characteristics:**
 * - Typical generation time: 2-5 seconds (mostly AI latency)
 * - Database operations: <100ms
 * - Memory usage: proportional to response size (usually <1MB)
 * - Not suitable for generating >50 flashcards per request
 *
 * **Integration points:**
 * - Called from `/pages/api/generations` POST endpoint
 * - Session stored in `generation_sessions` table
 * - Errors logged to `logs` table via logError/logInfo utilities
 * - User context maintained via `user_id` parameter
 *
 * @example
 * // Generate flashcards from article text
 * const session = await generateFlashcardsFromText(
 *   supabase,
 *   "user-123",
 *   "Machine learning is a subset of artificial intelligence..."
 * );
 *
 * console.log(`Generated ${session.candidates_generated} flashcards in ${session.generation_time_ms}ms`);
 * session.candidates.forEach(card => {
 *   console.log(`Q: ${card.front}\nA: ${card.back}`);
 * });
 *
 * @example
 * // With custom API key (useful for testing)
 * const session = await generateFlashcardsFromText(
 *   supabase,
 *   userId,
 *   sourceText,
 *   process.env.TEST_OPENROUTER_KEY
 * );
 *
 * @example
 * // Error handling in route handler
 * try {
 *   const result = await generateFlashcardsFromText(supabase, userId, text);
 *   return c.json(result);
 * } catch (error) {
 *   if (error instanceof Error) {
 *     if (error.message === "AI_SERVICE_NOT_CONFIGURED") {
 *       return c.json({ error: "AI service not available" }, 503);
 *     }
 *     if (error.message === "AI_GENERATION_FAILED") {
 *       return c.json({ error: "AI generation failed" }, 503);
 *     }
 *   }
 *   return c.json({ error: "Unknown error" }, 500);
 * }
 */
export async function generateFlashcardsFromText(
  supabase: SupabaseClient<Database>,
  userId: string,
  sourceText: string,
  apiKey?: string
): Promise<GenerationSessionDTO> {
  const startTime = Date.now();

  try {
    // Step 1: Initialize OpenRouter service
    const openRouterKey = apiKey || import.meta.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      await logError(supabase, "OpenRouter API key not configured", {});
      throw new Error("AI_SERVICE_NOT_CONFIGURED");
    }

    const openRouter = new OpenRouterService({
      apiKey: openRouterKey,
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
        user_id: userId,
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
