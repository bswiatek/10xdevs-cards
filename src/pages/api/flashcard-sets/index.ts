import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  CreateFlashcardSetCommand,
  CreateFlashcardSetResponseDTO,
  FlashcardCandidateWithActionDTO,
  FlashcardSetListResponseDTO,
} from "../../../types";
import { logError } from "../../../lib/logging";
import { createEmptyFlashcardSet, createFlashcardSetFromGeneration } from "../../../lib/services/flashcard-set.service";
import { listFlashcardSets } from "../../../lib/services/flashcard.service";
import { FlashcardSetsListQuerySchema } from "../../../lib/validations/flashcards";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * Zod schema for validating individual flashcard candidate with action
 */
const FlashcardCandidateWithActionSchema = z.object({
  temp_id: z.string().min(1, "temp_id is required"),
  front: z.string().min(1, "Front is required").max(200, "Front must not exceed 200 characters"),
  back: z.string().min(1, "Back is required").max(500, "Back must not exceed 500 characters"),
  action: z.enum(["accepted", "edited", "rejected"], {
    errorMap: () => ({ message: "Action must be one of: accepted, edited, rejected" }),
  }),
  was_edited: z.boolean().optional(),
}) satisfies z.ZodType<FlashcardCandidateWithActionDTO>;

/**
 * Zod schema for validating CreateFlashcardSetCommand
 * Supports two modes:
 * 1. Manual creation - only title required
 * 2. AI generation - title + generation_session_id + flashcards required
 */
const CreateFlashcardSetSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title must not exceed 200 characters"),
    generation_session_id: z.number().int().positive().optional(),
    flashcards: z.array(FlashcardCandidateWithActionSchema).optional(),
  })
  .refine(
    (data) => {
      // If generation_session_id is provided, flashcards must also be provided
      if (data.generation_session_id !== undefined) {
        return data.flashcards !== undefined && data.flashcards.length > 0;
      }
      return true;
    },
    {
      message: "When generation_session_id is provided, flashcards array must contain at least one flashcard",
      path: ["flashcards"],
    }
  )
  .refine(
    (data) => {
      // If flashcards are provided, generation_session_id must also be provided
      if (data.flashcards !== undefined && data.flashcards.length > 0) {
        return data.generation_session_id !== undefined;
      }
      return true;
    },
    {
      message: "When flashcards are provided, generation_session_id must also be provided",
      path: ["generation_session_id"],
    }
  )
  .refine(
    (data) => {
      // If flashcards are provided, at least one must be accepted or edited
      if (data.flashcards !== undefined && data.flashcards.length > 0) {
        return data.flashcards.some((card) => card.action === "accepted" || card.action === "edited");
      }
      return true;
    },
    {
      message: "At least one flashcard must have action 'accepted' or 'edited'",
      path: ["flashcards"],
    }
  ) satisfies z.ZodType<CreateFlashcardSetCommand>;

/**
 * GET /api/flashcard-sets
 * Lists flashcard sets for the authenticated user with pagination and search
 *
 * @returns 200 OK with FlashcardSetListResponseDTO
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 500 Internal Server Error on unexpected errors
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  try {
    // Step 1: Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search"),
      sort: url.searchParams.get("sort"),
      order: url.searchParams.get("order"),
    };

    const validation = FlashcardSetsListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid query parameters",
          details: validation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Call service to list flashcard sets
    const result: FlashcardSetListResponseDTO = await listFlashcardSets(supabase, user.id, validation.data);

    // Step 4: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to retrieve flashcard sets",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    await logError(supabase, "Unexpected error in GET /api/flashcard-sets", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/flashcard-sets
 * Creates a new flashcard set, either empty (manual) or from AI generation
 *
 * NOTE: MVP version without authentication - will be added later
 *
 * @returns 201 Created with CreateFlashcardSetResponseDTO
 * @returns 400 Bad Request if validation fails
 * @returns 404 Not Found if generation_session_id doesn't exist
 * @returns 422 Unprocessable Entity if business logic validation fails
 * @returns 500 Internal Server Error on unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  try {
    // Step 1: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validation = CreateFlashcardSetSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: validation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: CreateFlashcardSetCommand = validation.data;

    // Step 2: Determine mode and call appropriate service
    let result: CreateFlashcardSetResponseDTO;

    try {
      if (command.generation_session_id && command.flashcards) {
        // AI generation mode
        result = await createFlashcardSetFromGeneration(
          supabase,
          command.title,
          command.generation_session_id,
          command.flashcards
        );
      } else {
        // Manual creation mode
        result = await createEmptyFlashcardSet(supabase, command.title);
      }
    } catch (serviceError) {
      // Handle known service errors
      if (serviceError instanceof Error) {
        if (serviceError.message === "GENERATION_SESSION_NOT_FOUND") {
          return new Response(
            JSON.stringify({
              error: "Not Found",
              message: "Generation session not found",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (serviceError.message === "GENERATION_SESSION_ALREADY_USED") {
          return new Response(
            JSON.stringify({
              error: "Unprocessable Entity",
              message: "Generation session has already been used to create a flashcard set",
            }),
            {
              status: 422,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (serviceError.message === "DATABASE_ERROR") {
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: "Failed to create flashcard set",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Re-throw unexpected errors to be caught by outer try-catch
      throw serviceError;
    }

    // Step 3: Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors
    await logError(supabase, "Unexpected error in POST /api/flashcard-sets", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
