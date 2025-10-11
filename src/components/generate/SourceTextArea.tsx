interface SourceTextAreaProps {
  value: string;
  onChange: (text: string) => void;
  errorMessage?: string;
  required?: boolean;
}

export function SourceTextArea({ value, onChange, errorMessage, required = false }: SourceTextAreaProps) {
  const hasError = !!errorMessage;
  const textareaId = "source-text";
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className="space-y-2">
      <label htmlFor={textareaId} className="block text-sm font-medium">
        Tekst źródłowy {required && <span className="text-destructive">*</span>}
      </label>

      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          // Sanityzacja nastąpi w onChange przez hook
          const pastedText = e.clipboardData.getData("text");
          e.preventDefault();
          onChange(pastedText);
        }}
        className={`w-full min-h-[300px] px-3 py-2 rounded-md border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
          hasError ? "border-destructive focus-visible:ring-destructive" : "border-input"
        }`}
        placeholder="Wklej tutaj tekst, z którego AI wygeneruje fiszki... (1000-10000 znaków)"
        aria-describedby={`${hasError ? errorId : ""} ${helperId}`.trim()}
        aria-invalid={hasError}
        aria-required={required}
        required={required}
      />

      {/* Error message */}
      {hasError && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Helper text */}
      <p id={helperId} className="text-sm text-muted-foreground">
        Wklej tekst w zakresie 1000-10000 znaków. Formatowanie zostanie usunięte automatycznie.
      </p>
    </div>
  );
}
