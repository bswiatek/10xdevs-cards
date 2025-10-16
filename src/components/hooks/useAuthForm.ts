import { useState, useCallback } from "react";
import { z } from "zod";

type FormStatus = "idle" | "loading" | "success" | "error";

interface UseAuthFormOptions<T extends z.ZodTypeAny> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  initialValues?: Partial<z.infer<T>>;
}

interface UseAuthFormReturn<T extends z.ZodTypeAny> {
  values: z.infer<T>;
  errors: Partial<Record<keyof z.infer<T>, string>>;
  status: FormStatus;
  errorMessage: string;
  isLoading: boolean;
  setValue: <K extends keyof z.infer<T>>(field: K, value: z.infer<T>[K]) => void;
  clearError: (field: keyof z.infer<T>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useAuthForm<T extends z.ZodTypeAny>({
  schema,
  onSubmit,
  initialValues = {},
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [values, setValues] = useState<z.infer<T>>(initialValues as z.infer<T>);
  const [errors, setErrors] = useState<Partial<Record<keyof z.infer<T>, string>>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const setValue = useCallback(<K extends keyof z.infer<T>>(field: K, value: z.infer<T>[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearError = useCallback((field: keyof z.infer<T>) => {
    setErrors((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...newErrors } = prev;
      return newErrors as Partial<Record<keyof z.infer<T>, string>>;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");
      setErrors({});

      const result = schema.safeParse(values);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        const formattedErrors: Partial<Record<keyof z.infer<T>, string>> = {};

        for (const [key, messages] of Object.entries(fieldErrors)) {
          if (messages && messages.length > 0) {
            formattedErrors[key as keyof z.infer<T>] = messages[0];
          }
        }

        setErrors(formattedErrors);
        setStatus("error");
        return;
      }

      setStatus("loading");

      try {
        await onSubmit(result.data);
        setStatus("success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
        setErrorMessage(message);
        setStatus("error");
      }
    },
    [schema, values, onSubmit]
  );

  return {
    values,
    errors,
    status,
    errorMessage,
    isLoading: status === "loading",
    setValue,
    clearError,
    handleSubmit,
  };
}
