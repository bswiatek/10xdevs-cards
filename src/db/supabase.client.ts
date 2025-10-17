import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

// Get environment variables with fallback to runtime env (for Cloudflare Pages)
function getEnvVar(key: string, required: boolean = true): string | undefined {
  // Try import.meta.env first (available during build and in dev)
  const value = import.meta.env[key];
  if (value) return value;

  // Fallback to process.env for server-side runtime
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }

  if (required) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return undefined;
}

// Lazy initialization for client-side Supabase client
let _supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (!_supabaseClient) {
    const supabaseUrl = getEnvVar("SUPABASE_URL");
    const supabaseAnonKey = getEnvVar("SUPABASE_KEY");
    _supabaseClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
  }
  return _supabaseClient;
}

// Backward compatibility - export as const but with getter
export const supabaseClient = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createClient<Database>>];
  }
});

// Server-side Supabase client with cookie handling for SSR
export function createSupabaseServerClient(cookies: AstroCookies, runtime?: Record<string, string>) {
  // Get credentials from runtime env (Cloudflare Pages) or fallback to import.meta.env/process.env
  const url = runtime?.SUPABASE_URL || getEnvVar("SUPABASE_URL", false);
  const key = runtime?.SUPABASE_KEY || getEnvVar("SUPABASE_KEY", false);

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be defined in environment variables");
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        // Get ALL cookies that Astro has access to
        // This is crucial for Supabase SSR to work properly
        const allCookies: { name: string; value: string }[] = [];

        // Extract project reference from URL for cookie naming
        // Handle both cloud (https://xxx.supabase.co) and local (http://127.0.0.1:54321)
        let projectRef = "";

        if (url.includes("127.0.0.1") || url.includes("localhost")) {
          // Local Supabase uses "127" as project ref
          projectRef = "127";
        } else {
          // Cloud Supabase extracts from subdomain
          projectRef = url.match(/https:\/\/([^.]+)/)?.[1] || "";
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
