import { useId, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailField } from "@/components/forms/EmailField";
import { PasswordField } from "@/components/forms/PasswordField";
import { FormError } from "@/components/forms/FormError";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import { registerSchema } from "@/lib/validations/auth";

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();

  const { values, errors, isLoading, errorMessage, setValue, clearError, handleSubmit } = useAuthForm({
    schema: registerSchema,
    onSubmit: async (data) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, confirm: data.confirm }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Błąd podczas rejestracji");
      }

      onSuccess?.();

      // Small delay to ensure cookies are set before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Auto-login successful, redirect to /generate
      // eslint-disable-next-line react-compiler/react-compiler
      window.location.href = "/generate";
    },
    initialValues: {
      email: "",
      password: "",
      confirm: "",
    },
  });

  // Call onError callback if error occurs
  useEffect(() => {
    if (errorMessage) {
      onError?.(errorMessage);
    }
  }, [errorMessage, onError]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && <FormError id={errorId} message={errorMessage} />}

      <div className="space-y-4">
        <EmailField
          id={emailId}
          value={values.email || ""}
          onChange={(value) => {
            setValue("email", value);
            clearError("email");
          }}
          error={errors.email}
          disabled={isLoading}
        />

        <PasswordField
          id={passwordId}
          label="Hasło"
          value={values.password || ""}
          onChange={(value) => {
            setValue("password", value);
            clearError("password");
          }}
          error={errors.password}
          autoComplete="new-password"
          disabled={isLoading}
        />

        <PasswordField
          id={confirmPasswordId}
          label="Potwierdź hasło"
          value={values.confirm || ""}
          onChange={(value) => {
            setValue("confirm", value);
            clearError("confirm");
          }}
          error={errors.confirm}
          placeholder="Powtórz hasło"
          autoComplete="new-password"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg" aria-busy={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Rejestracja...
          </>
        ) : (
          "Zarejestruj się"
        )}
      </Button>
    </form>
  );
}
