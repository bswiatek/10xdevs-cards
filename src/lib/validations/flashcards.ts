import { z } from "zod";

/**
 * Allowed sort fields for flashcard sets listing
 */
const ALLOWED_SORT_FIELDS = ["created_at", "updated_at", "title"] as const;

/**
 * Allowed sort orders
 */
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

/**
 * Schema for flashcard sets list query parameters
 */
export const FlashcardSetsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sort: z.enum(ALLOWED_SORT_FIELDS).default("created_at"),
  order: z.enum(ALLOWED_SORT_ORDERS).default("desc"),
});

/**
 * Schema for updating flashcard set title
 */
export const UpdateFlashcardSetSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must not exceed 200 characters"),
});

/**
 * Schema for creating a flashcard in a set
 */
export const CreateFlashcardSchema = z.object({
  front: z.string().trim().min(1, "Front is required").max(200, "Front must not exceed 200 characters"),
  back: z.string().trim().min(1, "Back is required").max(500, "Back must not exceed 500 characters"),
});

/**
 * Schema for updating a flashcard
 * At least one field must be provided
 */
export const UpdateFlashcardSchema = z
  .object({
    front: z
      .string()
      .trim()
      .min(1, "Front cannot be empty")
      .max(200, "Front must not exceed 200 characters")
      .optional(),
    back: z.string().trim().min(1, "Back cannot be empty").max(500, "Back must not exceed 500 characters").optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

export type FlashcardSetsListQuery = z.infer<typeof FlashcardSetsListQuerySchema>;
export type UpdateFlashcardSetInput = z.infer<typeof UpdateFlashcardSetSchema>;
export type CreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof UpdateFlashcardSchema>;
