import { Info } from "lucide-react";

export function InfoHelper() {
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/50 p-4">
      <div className="flex-shrink-0">
        <Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Wskazówki dotyczące tekstu źródłowego:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Tekst musi zawierać od 1,000 do 10,000 znaków</li>
          <li>Formatowanie HTML zostanie automatycznie usunięte</li>
          <li>Generowanie może potrwać do 60 sekund</li>
          <li>Im lepiej ustrukturyzowany tekst, tym lepsze fiszki</li>
        </ul>
      </div>
    </div>
  );
}
