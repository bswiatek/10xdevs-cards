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
        // Get ALL cookies that Astro has access to
        // This is crucial for Supabase SSR to work properly
        const allCookies: { name: string; value: string }[] = [];

        // Extract project reference from URL for cookie naming
        // Handle both cloud (https://xxx.supabase.co) and local (http://127.0.0.1:54321)
        let projectRef = "";

        if (supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) {
          // Local Supabase uses "127" as project ref
          projectRef = "127";
        } else {
          // Cloud Supabase extracts from subdomain
          projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "";
        }

        // Check for all possible Supabase auth token cookies
        const cookiePatterns = [
          `sb-${projectRef}-auth-token`,
          `sb-${projectRef}-auth-token.0`,
          `sb-${projectRef}-auth-token.1`,
          `sb-${projectRef}-auth-token-code-verifier`,
        ];

        // Iterate through all known patterns
        for (const pattern of cookiePatterns) {
          const cookie = cookies.get(pattern);
          if (cookie?.value) {
            allCookies.push({
              name: pattern,
              value: cookie.value,
            });
          }
        }

        return allCookies;
      },
      setAll(cookiesToSet) {
        // Set cookies one by one with proper options
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            ...options,
            path: "/",
            // Ensure cookies are set properly for SSR
            sameSite: "lax",
          });
        });
      },
    },
  });
}

// Type export for use in context.locals
export type SupabaseClient = ReturnType<typeof createSupabaseServerClient>;
