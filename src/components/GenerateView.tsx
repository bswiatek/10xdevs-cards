import { SourceTextArea } from "./generate/SourceTextArea";
import { CharCounter } from "./generate/CharCounter";
import { GenerateButton } from "./generate/GenerateButton";
import { LoadingOverlay } from "./generate/LoadingOverlay";
import { ErrorBanner } from "./generate/ErrorBanner";
import { InfoHelper } from "./generate/InfoHelper";
import { useGenerateForm } from "./hooks/useGenerateForm";

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

export default function GenerateView() {
  const { sourceText, charCount, isValidLength, isSubmitting, error, setSourceText, submit, resetError } =
    useGenerateForm({ minChars: MIN_CHARS, maxChars: MAX_CHARS });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generuj fiszki AI</h1>
        <p className="text-muted-foreground">Wklej tekst źródłowy, a AI wygeneruje dla Ciebie fiszki do nauki</p>
      </header>

      {/* Error Banner */}
      {error && <ErrorBanner error={error} onRetry={submit} onDismiss={resetError} />}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <SourceTextArea
            value={sourceText}
            onChange={setSourceText}
            errorMessage={
              !isValidLength && charCount > 0
                ? charCount < MIN_CHARS
                  ? `Tekst jest za krótki. Minimum ${MIN_CHARS} znaków.`
                  : `Tekst jest za długi. Maksimum ${MAX_CHARS} znaków.`
                : undefined
            }
            required
          />

          <CharCounter count={charCount} min={MIN_CHARS} max={MAX_CHARS} isValid={isValidLength} />

          <InfoHelper />
        </div>

        <GenerateButton disabled={!isValidLength || isSubmitting} loading={isSubmitting} />
      </form>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isSubmitting} />
    </div>
  );
}
