import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerateFlashcardsCommand, GenerationSessionDTO } from "../../../types";
import { logError } from "../../../lib/logging";
import { generateFlashcardsFromText } from "../../../lib/services/generation.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * Zod schema for validating GenerateFlashcardsCommand
 */
const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters"),
}) satisfies z.ZodType<GenerateFlashcardsCommand>;

/**
 * POST /api/generations
 * Initiates AI flashcard generation from source text
 *
 * @returns 201 Created with GenerationSessionDTO
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error on unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Step 2: Parse and validate request body
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

    const validation = GenerateFlashcardsSchema.safeParse(body);

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

    const command: GenerateFlashcardsCommand = validation.data;

    // Step 3: Call generation service
    let result: GenerationSessionDTO;
    try {
      result = await generateFlashcardsFromText(supabase, user.id, command.source_text);
    } catch (serviceError) {
      // Handle known service errors
      if (serviceError instanceof Error) {
        if (serviceError.message === "DATABASE_ERROR") {
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: "Failed to save generation session.",
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

    // Step 4: Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors
    await logError(supabase, "Unexpected error in POST /api/generations", {
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
