import type { APIRoute } from "astro";
import type { CreateFlashcardResponseDTO } from "../../../../types";
import { logError } from "../../../../lib/logging";
import { createFlashcard } from "../../../../lib/services/flashcard.service";
import { CreateFlashcardSchema } from "../../../../lib/validations/flashcards";

export const prerender = false;

/**
 * POST /api/flashcard-sets/:setId/flashcards
 * Creates a new flashcard in the specified set
 *
 * @returns 201 Created with CreateFlashcardResponseDTO
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if set doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error on unexpected errors
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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

    // Step 2: Parse and validate setId parameter
    const setId = parseInt(params.id || "", 10);
    if (isNaN(setId) || setId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid flashcard set ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Parse and validate request body
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

    const validation = CreateFlashcardSchema.safeParse(body);

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

    // Step 4: Create flashcard
    const result: CreateFlashcardResponseDTO | null = await createFlashcard(supabase, setId, user.id, validation.data);

    if (!result) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Flashcard set not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to create flashcard",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    await logError(supabase, "Unexpected error in POST /api/flashcard-sets/:setId/flashcards", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      setId: params.id,
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
