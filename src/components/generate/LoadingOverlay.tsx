import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-test-id="generate-loading-overlay"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">Generowanie fiszek...</h2>
          <p className="text-sm text-muted-foreground">
            AI analizuje tekst i tworzy fiszki. To może potrwać do 60 sekund.
          </p>
        </div>
      </div>
    </div>
  );
}
