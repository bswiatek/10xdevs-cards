import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewCandidateVM } from "@/types";
import { Check, X, Pencil, Undo2 } from "lucide-react";

interface CandidateCardProps {
  candidate: ReviewCandidateVM;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEditStart: (candidate: ReviewCandidateVM) => void;
  onUndo: (id: string) => void;
}

export function CandidateCard({ candidate, onAccept, onReject, onEditStart, onUndo }: CandidateCardProps) {
  const isAccepted = candidate.action === "accepted" || candidate.action === "edited";
  const isRejected = candidate.action === "rejected";
  const isPending = candidate.action === "pending";

  return (
    <Card
      className={`transition-all ${
        isAccepted
          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
          : isRejected
            ? "border-red-500 bg-red-50 dark:bg-red-950/20 opacity-60"
            : "border-border"
      }`}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Front side */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Przód</span>
              {candidate.wasEdited && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Edytowano
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm">{candidate.front}</p>
          </div>

          {/* Back side */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-muted-foreground">Tył</span>
            <p className="whitespace-pre-wrap text-sm">{candidate.back}</p>
          </div>

          {/* Status indicator */}
          {isAccepted && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Zaakceptowano</span>
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <X className="h-4 w-4" />
              <span>Odrzucono</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isPending && (
              <>
                <Button
                  onClick={() => onAccept(candidate.id)}
                  variant="default"
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Akceptuj
                </Button>
                <Button onClick={() => onEditStart(candidate)} variant="outline" size="sm" className="flex-1">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edytuj
                </Button>
                <Button
                  onClick={() => onReject(candidate.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  <X className="mr-2 h-4 w-4" />
                  Odrzuć
                </Button>
              </>
            )}
            {(isAccepted || isRejected) && (
              <Button onClick={() => onUndo(candidate.id)} variant="outline" size="sm">
                <Undo2 className="mr-2 h-4 w-4" />
                Cofnij
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
