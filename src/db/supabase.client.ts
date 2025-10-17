import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

// Get environment variables with fallback to runtime env (for Cloudflare Pages)
function getEnvVar(key: string): string {
  // Try import.meta.env first (available during build and in dev)
  const value = import.meta.env[key];
  if (value) return value;

  // Fallback to process.env for server-side runtime
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }

  throw new Error(`Environment variable ${key} is not defined`);
}

const supabaseUrl = getEnvVar("SUPABASE_URL");
const supabaseAnonKey = getEnvVar("SUPABASE_KEY");

// Client-side Supabase client
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with cookie handling for SSR
export function createSupabaseServerClient(cookies: AstroCookies, runtime?: Record<string, string>) {
  // Allow runtime env override (for Cloudflare Pages)
  const url = runtime?.SUPABASE_URL || supabaseUrl;
  const key = runtime?.SUPABASE_KEY || supabaseAnonKey;

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
