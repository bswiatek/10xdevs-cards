import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Create SSR-compatible Supabase client with cookie handling
  context.locals.supabase = createSupabaseServerClient(context.cookies);
  return next();
});
