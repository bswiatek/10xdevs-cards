import { CandidateCard } from "./CandidateCard";
import type { ReviewCandidateVM } from "@/types";

interface CandidateListProps {
  candidates: ReviewCandidateVM[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEditStart: (candidate: ReviewCandidateVM) => void;
  onUndo: (id: string) => void;
}

export function CandidateList({ candidates, onAccept, onReject, onEditStart, onUndo }: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Brak kandydatów do recenzji</p>
          <p className="mt-2 text-sm text-muted-foreground">Wszystkie fiszki zostały już przetworzone</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onAccept={onAccept}
          onReject={onReject}
          onEditStart={onEditStart}
          onUndo={onUndo}
        />
      ))}
    </div>
  );
}
