import type { APIRoute } from "astro";
import { registerSchema } from "@/lib/validations/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane rejestracji",
          details: validationResult.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt to sign up with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "user", // Default role
        },
      },
    });

    if (error) {
      // Check for duplicate email
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "Konto z tym adresem email już istnieje",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: error.message || "Nie udało się utworzyć konta",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // IMPORTANT: After registration, explicitly set session if it exists
    // This ensures cookies are properly set through the SSR client
    if (data.session) {
      await locals.supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    // Auto-login after registration (session is automatically saved)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || "user",
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
