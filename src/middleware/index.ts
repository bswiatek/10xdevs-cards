import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Get runtime env from Cloudflare Pages (if available)
  const runtime = context.locals.runtime?.env as Record<string, string> | undefined;

  // Create SSR-compatible Supabase client with cookie handling
  context.locals.supabase = createSupabaseServerClient(context.cookies, runtime);
  return next();
});
