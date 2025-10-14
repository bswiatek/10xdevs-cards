import type { APIRoute } from "astro";
import { logError } from "../../../lib/logging";
import { updateFlashcard, deleteFlashcard } from "../../../lib/services/flashcard.service";
import { UpdateFlashcardSchema } from "../../../lib/validations/flashcards";

export const prerender = false;

/**
 * PATCH /api/flashcards/:id
 * Updates a flashcard's content (front and/or back)
 *
 * @returns 200 OK with updated flashcard data
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if flashcard doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error on unexpected errors
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    // Step 2: Parse and validate ID parameter
    const flashcardId = parseInt(params.id || "", 10);
    if (isNaN(flashcardId) || flashcardId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid flashcard ID",
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

    const validation = UpdateFlashcardSchema.safeParse(body);

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

    // Step 4: Update flashcard
    const result = await updateFlashcard(supabase, flashcardId, user.id, validation.data);

    if (!result) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return success response
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
          message: "Failed to update flashcard",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    await logError(supabase, "Unexpected error in PATCH /api/flashcards/:id", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      flashcardId: params.id,
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
 * DELETE /api/flashcards/:id
 * Deletes a flashcard (cascades to progress, decrements cards_count)
 *
 * @returns 204 No Content on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if flashcard doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error on unexpected errors
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Step 2: Parse and validate ID parameter
    const flashcardId = parseInt(params.id || "", 10);
    if (isNaN(flashcardId) || flashcardId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid flashcard ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Delete flashcard
    const deleted = await deleteFlashcard(supabase, flashcardId, user.id);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to delete flashcard",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    await logError(supabase, "Unexpected error in DELETE /api/flashcards/:id", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      flashcardId: params.id,
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
