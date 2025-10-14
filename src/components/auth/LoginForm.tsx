import { useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type FormStatus = "idle" | "loading" | "success" | "error";

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nieprawidłowe dane logowania");
      }

      setStatus("success");
      onSuccess?.();

      // Small delay to ensure cookies are set before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to /generate after successful login
      window.location.href = "/generate";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieprawidłowe dane logowania";
      setErrorMessage(message);
      setStatus("error");
      onError?.(message);
    }
  };

  const isLoading = status === "loading";
  const hasError = status === "error";

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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="twoj@email.pl"
            aria-required="true"
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={passwordId} className="block text-sm font-medium">
            Hasło <span className="text-destructive">*</span>
          </label>
          <Input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wprowadź hasło"
            aria-required="true"
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg" aria-busy={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Logowanie...
          </>
        ) : (
          "Zaloguj się"
        )}
      </Button>
    </form>
  );
}
