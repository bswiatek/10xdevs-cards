import { useState, useId } from "react";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ForgotPasswordRequestFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type FormStatus = "idle" | "loading" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordRequestForm({ onSuccess, onError }: ForgotPasswordRequestFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const emailId = useId();
  const errorId = useId();
  const infoId = useId();

  const validateEmail = (): boolean => {
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Nieprawidłowy format email");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateEmail()) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      // TODO: Implement API call to /api/auth/forgot-password
      // const response = await fetch("/api/auth/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // });

      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.message || "Błąd podczas wysyłania prośby");
      // }

      // Placeholder for backend implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStatus("success");
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Błąd podczas wysyłania prośby";
      setErrorMessage(message);
      setStatus("error");
      onError?.(message);
    }
  };

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const hasError = status === "error";

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-green-500 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <p className="font-medium">Prośba została wysłana</p>
          <p className="mt-1">
            Administrator otrzymał Twoją prośbę o zresetowanie hasła. Skontaktuje się z Tobą w celu przekazania nowego
            hasła tymczasowego.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <a href="/login">Wróć do logowania</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        id={infoId}
        className="flex gap-3 rounded-md border border-blue-500 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-400"
      >
        <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-medium">Reset hasła wymaga interwencji administratora</p>
          <p className="mt-1">
            W związku z brakiem automatycznej weryfikacji email w MVP, po wysłaniu prośby administrator ręcznie
            wygeneruje dla Ciebie hasło tymczasowe i skontaktuje się z Tobą.
          </p>
        </div>
      </div>

      {hasError && errorMessage && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

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
            setEmailError("");
          }}
          placeholder="twoj@email.pl"
          aria-required="true"
          aria-invalid={!!emailError}
          aria-describedby={`${infoId} ${emailError ? `${emailId}-error` : ""}`}
          required
          disabled={isLoading}
          autoComplete="email"
        />
        {emailError && (
          <p id={`${emailId}-error`} className="text-sm text-destructive" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg" aria-busy={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Wysyłanie prośby...
          </>
        ) : (
          "Wyślij prośbę o reset hasła"
        )}
      </Button>
    </form>
  );
}
