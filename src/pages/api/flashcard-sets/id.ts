import type { APIRoute } from "astro";
import type { FlashcardSetDetailDTO, FlashcardSetListDTO } from "../../../types";
import { logError } from "../../../lib/logging";
import {
  getFlashcardSetDetail,
  updateFlashcardSetTitle,
  deleteFlashcardSet,
} from "../../../lib/services/flashcard.service";
import { UpdateFlashcardSetSchema } from "../../../lib/validations/flashcards";

export const prerender = false;

/**
 * GET /api/flashcard-sets/:id
 * Gets detailed information about a flashcard set including all flashcards
 *
 * @returns 200 OK with FlashcardSetDetailDTO
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if set doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error on unexpected errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // Step 3: Get flashcard set details
    const result: FlashcardSetDetailDTO | null = await getFlashcardSetDetail(supabase, setId, user.id);

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
          message: "Failed to retrieve flashcard set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    await logError(supabase, "Unexpected error in GET /api/flashcard-sets/:id", {
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

/**
 * PATCH /api/flashcard-sets/:id
 * Updates the title of a flashcard set
 *
 * @returns 200 OK with updated FlashcardSetListDTO
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if set doesn't exist or doesn't belong to user
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

    const validation = UpdateFlashcardSetSchema.safeParse(body);

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

    // Step 4: Update flashcard set
    const result: FlashcardSetListDTO | null = await updateFlashcardSetTitle(supabase, setId, user.id, validation.data);

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
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to update flashcard set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    await logError(supabase, "Unexpected error in PATCH /api/flashcard-sets/:id", {
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

/**
 * DELETE /api/flashcard-sets/:id
 * Deletes a flashcard set (cascades to flashcards and progress)
 *
 * @returns 204 No Content on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if set doesn't exist or doesn't belong to user
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

    // Step 3: Delete flashcard set
    const deleted = await deleteFlashcardSet(supabase, setId, user.id);

    if (!deleted) {
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
          message: "Failed to delete flashcard set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    await logError(supabase, "Unexpected error in DELETE /api/flashcard-sets/:id", {
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
