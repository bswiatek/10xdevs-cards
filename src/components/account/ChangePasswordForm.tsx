import { useId, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/forms/PasswordField";
import { FormError } from "@/components/forms/FormError";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import { changePasswordSchema } from "@/lib/validations/auth";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function PasswordChangeSuccess() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-green-500 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
        <p className="font-medium">Hasło zostało zmienione</p>
        <p className="mt-1">
          Twoje hasło zostało pomyślnie zaktualizowane. Wszystkie sesje zostały unieważnione. Za chwilę zostaniesz
          przekierowany do strony logowania.
        </p>
      </div>
    </div>
  );
}

export function ChangePasswordForm({ onSuccess, onError }: ChangePasswordFormProps) {
  const oldPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();

  const { values, errors, status, errorMessage, isLoading, setValue, clearError, handleSubmit } = useAuthForm({
    schema: changePasswordSchema,
    onSubmit: async () => {
      // TODO: Implement API call to /api/auth/change-password
      // const response = await fetch("/api/auth/change-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     oldPassword: data.oldPassword,
      //     newPassword: data.newPassword,
      //     confirm: data.confirm,
      //   }),
      // });

      // if (!response.ok) {
      //   const responseData = await response.json();
      //   throw new Error(responseData.message || "Błąd podczas zmiany hasła");
      // }

      // Placeholder for backend implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSuccess?.();
    },
    initialValues: {
      oldPassword: "",
      newPassword: "",
      confirm: "",
    },
  });

  // Call onError callback if error occurs
  useEffect(() => {
    if (errorMessage) {
      onError?.(errorMessage);
    }
  }, [errorMessage, onError]);

  if (status === "success") {
    return <PasswordChangeSuccess />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && <FormError id={errorId} message={errorMessage} />}

      <div className="space-y-4">
        <PasswordField
          id={oldPasswordId}
          label="Obecne hasło"
          value={values.oldPassword || ""}
          onChange={(value) => {
            setValue("oldPassword", value);
            clearError("oldPassword");
          }}
          error={errors.oldPassword}
          placeholder="Wprowadź obecne hasło"
          autoComplete="current-password"
          disabled={isLoading}
        />

        <PasswordField
          id={newPasswordId}
          label="Nowe hasło"
          value={values.newPassword || ""}
          onChange={(value) => {
            setValue("newPassword", value);
            clearError("newPassword");
          }}
          error={errors.newPassword}
          placeholder="Minimum 8 znaków"
          autoComplete="new-password"
          disabled={isLoading}
        />

        <PasswordField
          id={confirmPasswordId}
          label="Potwierdź nowe hasło"
          value={values.confirm || ""}
          onChange={(value) => {
            setValue("confirm", value);
            clearError("confirm");
          }}
          error={errors.confirm}
          placeholder="Powtórz nowe hasło"
          autoComplete="new-password"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg" aria-busy={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Zmiana hasła...
          </>
        ) : (
          "Zmień hasło"
        )}
      </Button>
    </form>
  );
}
