/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

import type { SupabaseClient as SupabaseClientType } from "./db/supabase.client.ts";
import type { Runtime } from "@astrojs/cloudflare";

type CloudflareEnv = {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENROUTER_API_KEY: string;
};

declare global {
  namespace App {
    interface Locals extends Runtime<CloudflareEnv> {
      supabase: SupabaseClientType;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
