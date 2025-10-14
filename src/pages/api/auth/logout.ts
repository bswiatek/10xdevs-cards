import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się wylogować",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Session is automatically cleared from cookies by Supabase SSR client
    return new Response(
      JSON.stringify({
        success: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wylogowania",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
