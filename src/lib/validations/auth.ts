import { z } from "zod";

// Email validation according to RFC 5322 (simplified)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .refine((email) => emailRegex.test(email), {
      message: "Nieprawidłowy format email",
    }),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email jest wymagany")
      .email("Nieprawidłowy format email")
      .refine((email) => emailRegex.test(email), {
        message: "Nieprawidłowy format email",
      }),
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    confirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Hasła muszą być identyczne",
    path: ["confirm"],
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Stare hasło jest wymagane"),
    newPassword: z.string().min(8, "Nowe hasło musi mieć minimum 8 znaków"),
    confirm: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.newPassword === data.confirm, {
    message: "Hasła muszą być identyczne",
    path: ["confirm"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .refine((email) => emailRegex.test(email), {
      message: "Nieprawidłowy format email",
    }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
