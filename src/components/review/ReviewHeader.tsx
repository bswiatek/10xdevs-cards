import { Button } from "@/components/ui/button";
import type { ReviewCounters } from "@/types";
import { Check, X, Clock, Save, CheckCheck } from "lucide-react";

interface ReviewHeaderProps {
  counters: ReviewCounters;
  onRequestSave: () => void;
  onAcceptAll: () => void;
}

export function ReviewHeader({ counters, onRequestSave, onAcceptAll }: ReviewHeaderProps) {
  const canSave = counters.accepted > 0;
  const hasRemaining = counters.remaining > 0;

  return (
    <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold">Recenzja kandydatów</h1>
            <p className="mt-1 text-sm text-muted-foreground">Zaakceptuj, edytuj lub odrzuć wygenerowane fiszki</p>
          </div>

          {/* Counters and action */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Counters */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  Zaakceptowano: <span className="font-bold">{counters.accepted}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">
                  Odrzucono: <span className="font-bold">{counters.rejected}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">
                  Pozostało: <span className="font-bold">{counters.remaining}</span>
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Accept all button */}
              <Button
                onClick={onAcceptAll}
                disabled={!hasRemaining}
                variant="outline"
                size="lg"
                data-test-id="review-accept-all-button"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Zaakceptuj wszystkie
              </Button>

              {/* Save button */}
              <Button onClick={onRequestSave} disabled={!canSave} size="lg" data-test-id="review-save-set-button">
                <Save className="mr-2 h-4 w-4" />
                Zapisz zestaw
              </Button>
            </div>
          </div>
        </div>

        {/* Warning when no accepted but some were processed */}
        {!canSave && counters.remaining === 0 && counters.accepted + counters.rejected > 0 && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/20">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              Musisz zaakceptować lub edytować co najmniej jedną fiszkę, aby zapisać zestaw.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
