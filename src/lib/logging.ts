import type { Database, TablesInsert, Json } from "../db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Log level types for system logs
 */
export type LogLevel = Database["public"]["Enums"]["log_level_type"];

/**
 * Logs an error to the system_logs table in Supabase
 *
 * @param supabase - Supabase client instance
 * @param level - Log level (INFO, WARNING, ERROR)
 * @param message - Error message
 * @param metadata - Additional context (e.g., error stack, request data, category)
 */
export async function logToDatabase(
  supabase: SupabaseClient<Database>,
  level: LogLevel,
  message: string,
  metadata?: Json
): Promise<void> {
  try {
    const logEntry: TablesInsert<"system_logs"> = {
      level,
      message,
      metadata: metadata || null,
    };

    const { error } = await supabase.from("system_logs").insert(logEntry);

    if (error) {
      // Fallback to console if database logging fails - silence eslint as this is error handling
      // eslint-disable-next-line no-console
      console.error("[LOGGING ERROR] Failed to write to system_logs:", error);
      // eslint-disable-next-line no-console
      console.error("[ORIGINAL LOG]", { level, message, metadata });
    }
  } catch (err) {
    // Catch any unexpected errors during logging - silence eslint as this is error handling
    // eslint-disable-next-line no-console
    console.error("[LOGGING ERROR] Unexpected error during logging:", err);
    // eslint-disable-next-line no-console
    console.error("[ORIGINAL LOG]", { level, message, metadata });
  }
}

/**
 * Convenience function to log errors
 */
export async function logError(supabase: SupabaseClient<Database>, message: string, metadata?: Json): Promise<void> {
  await logToDatabase(supabase, "ERROR", message, metadata);
}

/**
 * Convenience function to log warnings
 */
export async function logWarning(supabase: SupabaseClient<Database>, message: string, metadata?: Json): Promise<void> {
  await logToDatabase(supabase, "WARNING", message, metadata);
}

/**
 * Convenience function to log info messages
 */
export async function logInfo(supabase: SupabaseClient<Database>, message: string, metadata?: Json): Promise<void> {
  await logToDatabase(supabase, "INFO", message, metadata);
}
