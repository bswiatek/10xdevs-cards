interface CharCounterProps {
  count: number;
  min: number;
  max: number;
  isValid: boolean;
}

export function CharCounter({ count, min, max }: CharCounterProps) {
  const getStatusColor = () => {
    if (count === 0) return "text-muted-foreground";
    if (count < min) return "text-orange-600 dark:text-orange-400";
    if (count > max) return "text-destructive";
    return "text-green-600 dark:text-green-400";
  };

  const getStatusText = () => {
    if (count === 0) return "Wklej tekst aby zobaczyć licznik";
    if (count < min) return `Potrzebujesz jeszcze ${min - count} znaków`;
    if (count > max) return `Przekroczono limit o ${count - max} znaków`;
    return "Długość tekstu jest poprawna ✓";
  };

  return (
    <div className="flex items-center justify-between text-sm" role="status" aria-live="polite" aria-atomic="true">
      <span className={getStatusColor()}>{getStatusText()}</span>
      <span className={getStatusColor()}>
        <span className="font-mono font-semibold">{count.toLocaleString()}</span>
        <span className="text-muted-foreground">
          {" "}
          / {min.toLocaleString()}-{max.toLocaleString()}
        </span>
      </span>
    </div>
  );
}
