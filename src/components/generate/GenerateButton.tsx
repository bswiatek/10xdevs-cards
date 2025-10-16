import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  disabled: boolean;
  loading: boolean;
}

export function GenerateButton({ disabled, loading }: GenerateButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled}
      className="w-full sm:w-auto"
      size="lg"
      aria-busy={loading}
      data-test-id="generate-submit-button"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Generowanie...
        </>
      ) : (
        "Generuj fiszki"
      )}
    </Button>
  );
}
