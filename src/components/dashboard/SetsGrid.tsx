import type { FlashcardSetListDTO } from "../../types";
import { SetCard } from "./SetCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SetsGridProps {
  sets: FlashcardSetListDTO[];
  onClickSet: (id: number) => void;
  isLoading?: boolean;
  searchQuery?: string;
}

function SetCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function SetsGrid({ sets, onClickSet, isLoading = false, searchQuery = "" }: SetsGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-busy="true"
        aria-label="Ładowanie zestawów"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SetCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (sets.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="list"
      aria-label="Lista zestawów fiszek"
    >
      {sets.map((set) => (
        <SetCard key={set.id} set={set} onClick={onClickSet} searchQuery={searchQuery} />
      ))}
    </div>
  );
}
