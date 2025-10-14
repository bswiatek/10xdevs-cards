import { useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type FormStatus = "idle" | "loading" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!EMAIL_REGEX.test(email)) {
      errors.email = "Nieprawidłowy format email";
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Hasło musi mieć minimum ${MIN_PASSWORD_LENGTH} znaków`;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Hasła muszą być identyczne";
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirm: confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd podczas rejestracji");
      }

      setStatus("success");
      onSuccess?.();

      // Small delay to ensure cookies are set before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Auto-login successful, redirect to /generate
      window.location.href = "/generate";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Błąd podczas rejestracji";
      setErrorMessage(message);
      setStatus("error");
      onError?.(message);
    }
  };

  const isLoading = status === "loading";
  const hasError = status === "error" && (errorMessage || Object.keys(validationErrors).length > 0);

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
          <label htmlFor={emailId} className="block text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setValidationErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="twoj@email.pl"
            aria-required="true"
            aria-invalid={!!validationErrors.email}
            aria-describedby={validationErrors.email ? `${emailId}-error` : undefined}
            required
            disabled={isLoading}
            autoComplete="email"
          />
          {validationErrors.email && (
            <p id={`${emailId}-error`} className="text-sm text-destructive" role="alert">
              {validationErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor={passwordId} className="block text-sm font-medium">
            Hasło <span className="text-destructive">*</span>
          </label>
          <Input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="Minimum 8 znaków"
            aria-required="true"
            aria-invalid={!!validationErrors.password}
            aria-describedby={validationErrors.password ? `${passwordId}-error` : undefined}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          {validationErrors.password && (
            <p id={`${passwordId}-error`} className="text-sm text-destructive" role="alert">
              {validationErrors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor={confirmPasswordId} className="block text-sm font-medium">
            Potwierdź hasło <span className="text-destructive">*</span>
          </label>
          <Input
            id={confirmPasswordId}
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            placeholder="Powtórz hasło"
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
            Rejestracja...
          </>
        ) : (
          "Zarejestruj się"
        )}
      </Button>
    </form>
  );
}
