import { useState } from "react";
import { useDashboardSets } from "./hooks/useDashboardSets";
import { SetsSearchBar } from "./dashboard/SetsSearchBar";
import { SetsToolbar } from "./dashboard/SetsToolbar";
import { SetsGrid } from "./dashboard/SetsGrid";
import { SetsPagination } from "./dashboard/SetsPagination";
import { EmptyState } from "./dashboard/EmptyState";
import { ErrorState } from "./dashboard/ErrorState";
import { AddFlashcardModal } from "./dashboard/AddFlashcardModal";

export function DashboardView() {
  const { sets, pagination, isLoading, error, searchQuery, setSearchQuery, setCurrentPage, refetch } =
    useDashboardSets();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSetClick = (id: number) => {
    window.location.href = `/sets/${id}`;
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleAddFlashcard = () => {
    setIsAddModalOpen(true);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const showEmptyState = !isLoading && !error && sets.length === 0;
  const showContent = !isLoading && !error && sets.length > 0;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Moje zestawy fiszek</h1>
        <p className="text-muted-foreground">Zarządzaj swoimi zestawami i rozpocznij naukę</p>
      </div>

      {/* Search and Toolbar */}
      <div className="space-y-4">
        <SetsSearchBar value={searchQuery} onChange={setSearchQuery} />
        <SetsToolbar onAddFlashcard={handleAddFlashcard} />
      </div>

      {/* Error State */}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {/* Empty State */}
      {showEmptyState && (
        <EmptyState
          searchQuery={searchQuery}
          onClearSearch={searchQuery ? handleClearSearch : undefined}
          onAddFlashcard={!searchQuery ? handleAddFlashcard : undefined}
        />
      )}

      {/* Content */}
      {showContent && (
        <>
          <SetsGrid sets={sets} onClickSet={handleSetClick} searchQuery={searchQuery} />
          {pagination && <SetsPagination pagination={pagination} onPageChange={setCurrentPage} />}
        </>
      )}

      {/* Loading State */}
      {isLoading && <SetsGrid sets={[]} onClickSet={handleSetClick} isLoading={true} />}

      {/* Add Flashcard Modal */}
      <AddFlashcardModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        availableSets={sets}
      />
    </div>
  );
}
