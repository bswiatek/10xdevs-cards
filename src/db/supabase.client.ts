import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side Supabase client
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with cookie handling for SSR
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // In Astro 5, we need to manually iterate through potential cookie names
        // Supabase typically uses these cookie patterns
        const cookiesList: Array<{ name: string; value: string }> = [];
        
        // Extract project reference from URL for cookie naming
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "";
        
        // Check for all possible Supabase auth token cookies
        const cookiePatterns = [
          `sb-${projectRef}-auth-token`,
          `sb-${projectRef}-auth-token.0`,
          `sb-${projectRef}-auth-token.1`,
          `sb-${projectRef}-auth-token-code-verifier`,
        ];
        
        for (const pattern of cookiePatterns) {
          const cookie = cookies.get(pattern);
          if (cookie?.value) {
            cookiesList.push({
              name: pattern,
              value: cookie.value,
            });
          }
        }
        
        return cookiesList;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}

// Type export for use in context.locals
export type SupabaseClient = ReturnType<typeof createSupabaseServerClient>;
