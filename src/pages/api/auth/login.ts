import type { APIRoute } from "astro";
import { loginSchema } from "@/lib/validations/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane logowania",
          details: validationResult.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt to sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic error message for security (don't reveal which field is wrong)
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane logowania",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.session) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć sesji",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set user role in metadata if not exists (default to 'user')
    const user = data.user;
    if (!user.user_metadata?.role) {
      await locals.supabase.auth.updateUser({
        data: { role: "user" },
      });
    }

    // IMPORTANT: Explicitly set the session in Supabase client
    // This ensures cookies are properly set through the SSR client
    await locals.supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    // Session is automatically saved in cookies by Supabase SSR client
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || "user",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas logowania",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
