import { AlertCircle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenerationErrorViewModel } from "../hooks/useGenerateForm";

interface ErrorBannerProps {
  error: GenerationErrorViewModel;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  const getErrorIcon = () => {
    switch (error.code) {
      case "timeout_60s":
      case "service_unavailable":
        return <RefreshCw className="h-5 w-5" aria-hidden="true" />;
      default:
        return <AlertCircle className="h-5 w-5" aria-hidden="true" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.code) {
      case "validation_400":
        return "Błąd walidacji";
      case "timeout_60s":
        return "Przekroczono limit czasu";
      case "service_unavailable":
        return "Usługa niedostępna";
      case "network":
        return "Błąd połączenia";
      case "server_500":
        return "Błąd serwera";
      default:
        return "Wystąpił błąd";
    }
  };

  const canRetry = ["timeout_60s", "service_unavailable", "network", "server_500"].includes(error.code);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-destructive">{getErrorIcon()}</div>

        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-destructive">{getErrorTitle()}</h3>
          <p className="text-sm text-foreground/90">{error.message}</p>

          {canRetry && onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-destructive/50 hover:bg-destructive/20"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Spróbuj ponownie
              </Button>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-background/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Zamknij komunikat o błędzie"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Wystąpił: {new Date(error.timestamp).toLocaleString("pl-PL")}
      </p>
    </div>
  );
}
