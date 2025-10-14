import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationDTO } from "../../types";

interface SetsPaginationProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
}

export function SetsPagination({ pagination, onPageChange }: SetsPaginationProps) {
  const { current_page, total_pages } = pagination;

  if (total_pages <= 1) {
    return null;
  }

  const canGoPrev = current_page > 1;
  const canGoNext = current_page < total_pages;

  return (
    <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Paginacja">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(current_page - 1)}
        disabled={!canGoPrev}
        aria-label="Poprzednia strona"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className="text-sm text-muted-foreground px-4"
        aria-current="page"
        aria-label={`Strona ${current_page} z ${total_pages}`}
      >
        Strona {current_page} z {total_pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(current_page + 1)}
        disabled={!canGoNext}
        aria-label="Następna strona"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
