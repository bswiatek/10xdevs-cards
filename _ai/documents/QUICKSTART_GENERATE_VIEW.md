# Quick Start - Widok Generowanie Fiszek AI

## Uruchomienie aplikacji

```bash
# 1. Zainstaluj zależności (jeśli nie zostały zainstalowane)
npm install

# 2. Uruchom dev server
npm run dev

# 3. Otwórz w przeglądarce
# http://localhost:3000/generate
```

## Test Flow - Happy Path

1. **Przejdź do**: `http://localhost:3000/generate`

2. **Wklej przykładowy tekst** (1000-10000 znaków):

```
TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. TypeScript adds additional syntax to JavaScript to support a tighter integration with your editor. Catch errors early in your editor. TypeScript code converts to JavaScript, which runs anywhere JavaScript runs: In a browser, on Node.js or Deno and in your apps. TypeScript understands JavaScript and uses type inference to give you great tooling without additional code. TypeScript is a syntactic superset of JavaScript which adds static typing. This basically means that TypeScript adds syntax on top of JavaScript, allowing developers to add types. TypeScript being a "Syntactic Superset" means that it shares the same base syntax as JavaScript, but adds something to it. For example with TypeScript we are able to specify the types of variables, parameters, and return values within JavaScript code. All valid JavaScript code is also valid TypeScript code. TypeScript adds additional syntax to JavaScript to specify types. This helps developers catch type-related errors during development, rather than at runtime. TypeScript provides static type checking at compile time, which helps catch type errors before the code is executed. This makes it easier to find and fix bugs early in the development process. TypeScript is designed for the development of large applications and transcompiles to JavaScript. As TypeScript is a superset of JavaScript, existing JavaScript programs are also valid TypeScript programs.
```

3. **Obserwuj licznik znaków** - powinien pokazać się jako zielony ✓

4. **Kliknij "Generuj fiszki"**

5. **Zobacz overlay z loaderem** - "Generowanie fiszek..."

6. **Po sukcesie** - przekierowanie do `/review?session={id}`

## Test Flow - Walidacja

### Tekst za krótki (< 1000 znaków)

1. Wklej krótki tekst np. "Test"
2. Licznik pokaże się na pomarańczowo
3. Komunikat: "Potrzebujesz jeszcze X znaków"
4. Przycisk "Generuj fiszki" jest nieaktywny (disabled)

### Tekst za długi (> 10000 znaków)

1. Wklej bardzo długi tekst (więcej niż 10000 znaków)
2. Licznik pokaże się na czerwono
3. Komunikat: "Przekroczono limit o X znaków"
4. Przycisk "Generuj fiszki" jest nieaktywny

### Sanityzacja HTML

1. Wklej tekst z HTML:
```html
<h1>Tytuł</h1><p>Paragraf z <strong>bold</strong> i <em>italic</em></p>
```

2. HTML zostanie automatycznie usunięty
3. Licznik pokaże długość czystego tekstu

## Test Flow - Obsługa błędów

### Symulacja timeout (do testów manualnych z modyfikacją kodu)

W `useGenerateForm.ts` zmień:
```typescript
const TIMEOUT_MS = 1000; // Zmień z 60000 na 1000 (1 sekunda)
```

Następnie:
1. Wklej poprawny tekst
2. Kliknij "Generuj fiszki"
3. Po 1 sekundzie pojawi się banner z błędem timeout
4. Kliknij "Spróbuj ponownie"
5. Tekst pozostaje w formularzu

### Symulacja błędu API (jeśli endpoint zwraca błąd)

Jeśli API zwróci błąd:
- **400** - Banner: "Błąd walidacji" z komunikatem
- **503** - Banner: "Usługa niedostępna" + przycisk retry
- **500** - Banner: "Błąd serwera" + przycisk retry

## Dostępność (a11y) - Test z czytnikiem ekranu

1. **Uruchom czytnik ekranu** (NVDA/JAWS/VoiceOver)

2. **Nawigacja Tab**:
   - Textarea powinien ogłosić label i helper text
   - Licznik znaków aktualizuje się na żywo
   - Przycisk jest oznaczony jako disabled gdy walidacja nie przechodzi

3. **Podczas generowania**:
   - Overlay ogłasza "Generowanie fiszek..."
   - Stan busy jest komunikowany

4. **Przy błędzie**:
   - Banner jest ogłaszany jako alert
   - Tytuł i komunikat są czytane

## Testy responsywności

### Mobile (< 640px)
- Przycisk "Generuj fiszki" ma full width
- Textarea zajmuje pełną szerokość
- Layout jest jednkolumnowy

### Tablet/Desktop (>= 640px)
- Przycisk "Generuj fiszki" ma auto width
- Layout pozostaje czytelny z paddingami

## Dark Mode

1. Przełącz system na dark mode
2. Aplikacja powinna automatycznie zmienić kolory
3. Wszystkie komponenty powinny być czytelne

## localStorage - Zachowanie draft przy błędzie

1. Otwórz DevTools → Application → Local Storage
2. Wklej tekst i spróbuj wygenerować (symuluj błąd)
3. W localStorage pojawi się klucz `generate_draft` z tekstem
4. Po sukcesie klucz zostanie usunięty

## Linting i TypeScript

```bash
# Sprawdź czy nie ma błędów TypeScript
npm run build

# Uruchom linter
npm run lint

# Napraw błędy lintera
npm run lint:fix
```

## Quick Debug

Jeśli coś nie działa:

1. **Sprawdź konsolę przeglądarki** - błędy JavaScript
2. **Sprawdź Network tab** - czy request do `/api/generations` wychodzi
3. **Sprawdź terminal serwera** - błędy Astro/API
4. **Sprawdź localStorage** - czy draft jest zapisywany

## Struktura komponentów (dla zrozumienia)

```
GenerateView (kontener)
├── Header (tytuł + opis)
├── ErrorBanner (jeśli error !== null)
├── Form
│   ├── SourceTextArea (textarea + walidacja)
│   ├── CharCounter (licznik w czasie rzeczywistym)
│   ├── InfoHelper (wskazówki)
│   └── GenerateButton (submit)
└── LoadingOverlay (jeśli isSubmitting === true)
```

## Przykładowe długości tekstów do testów

- **< 1000** (za krótki): "Test text"
- **~1000** (minimum): Fragment artykułu ~1000 znaków
- **~5000** (środek): Normalny artykuł
- **~10000** (maksimum): Długi artykuł/rozdział
- **> 10000** (za długi): Kilka rozdziałów

## API Endpoint Reference

**POST** `/api/generations`

Request:
```json
{
  "source_text": "string (1000-10000 chars)"
}
```

Response 201:
```json
{
  "generation_session_id": 1,
  "input_length": 5000,
  "candidates_generated": 10,
  "generation_time_ms": 2500,
  "candidates": [...],
  "created_at": "2025-10-11T12:00:00Z"
}
```

Response 400:
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {...}
}
```

## Kontakt/Issues

Jeśli znajdziesz problemy:
1. Sprawdź dokumentację: `_ai/view-generation-implementation-status.md`
2. Sprawdź plan: `_ai/view-generation-implementation-plan.md`
3. Sprawdź logi w terminalu serwera dev
