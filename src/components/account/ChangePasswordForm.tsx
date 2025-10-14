import { useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type FormStatus = "idle" | "loading" | "success" | "error";

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordForm({ onSuccess, onError }: ChangePasswordFormProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const oldPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!oldPassword) {
      errors.oldPassword = "Podaj obecne hasło";
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `Nowe hasło musi mieć minimum ${MIN_PASSWORD_LENGTH} znaków`;
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Hasła muszą być identyczne";
    }

    if (oldPassword === newPassword) {
      errors.newPassword = "Nowe hasło musi różnić się od obecnego";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      // TODO: Implement API call to /api/auth/change-password
      // const response = await fetch("/api/auth/change-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     oldPassword,
      //     newPassword,
      //     confirm: confirmPassword,
      //   }),
      // });

      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.message || "Błąd podczas zmiany hasła");
      // }

      // Placeholder for backend implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStatus("success");
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Błąd podczas zmiany hasła";
      setErrorMessage(message);
      setStatus("error");
      onError?.(message);
    }
  };

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const hasError = status === "error" && (errorMessage || Object.keys(validationErrors).length > 0);

  if (isSuccess) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasError && errorMessage && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor={oldPasswordId} className="block text-sm font-medium">
            Obecne hasło <span className="text-destructive">*</span>
          </label>
          <Input
            id={oldPasswordId}
            type="password"
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, oldPassword: "" }));
            }}
            placeholder="Wprowadź obecne hasło"
            aria-required="true"
            aria-invalid={!!validationErrors.oldPassword}
            aria-describedby={validationErrors.oldPassword ? `${oldPasswordId}-error` : undefined}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
          {validationErrors.oldPassword && (
            <p id={`${oldPasswordId}-error`} className="text-sm text-destructive" role="alert">
              {validationErrors.oldPassword}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor={newPasswordId} className="block text-sm font-medium">
            Nowe hasło <span className="text-destructive">*</span>
          </label>
          <Input
            id={newPasswordId}
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, newPassword: "" }));
            }}
            placeholder="Minimum 8 znaków"
            aria-required="true"
            aria-invalid={!!validationErrors.newPassword}
            aria-describedby={validationErrors.newPassword ? `${newPasswordId}-error` : undefined}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          {validationErrors.newPassword && (
            <p id={`${newPasswordId}-error`} className="text-sm text-destructive" role="alert">
              {validationErrors.newPassword}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor={confirmPasswordId} className="block text-sm font-medium">
            Potwierdź nowe hasło <span className="text-destructive">*</span>
          </label>
          <Input
            id={confirmPasswordId}
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            placeholder="Powtórz nowe hasło"
            aria-required="true"
            aria-invalid={!!validationErrors.confirmPassword}
            aria-describedby={validationErrors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          {validationErrors.confirmPassword && (
            <p id={`${confirmPasswordId}-error`} className="text-sm text-destructive" role="alert">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>
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
