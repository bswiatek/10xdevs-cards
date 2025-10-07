# AGENTS.md - Kontekst projektu dla AI Agentów

## Informacje o projekcie

**Nazwa projektu:** 10x Astro Starter  
**Wersja:** 0.0.1  
**Typ:** Szablon startowy dla nowoczesnych aplikacji webowych  
**Repository:** https://github.com/przeprogramowani/10x-astro-starter

## Tech Stack

### Core Framework
- **Astro 5.13.7** - główny framework (SSR mode, adapter: Node.js standalone)
- **TypeScript 5** - język programowania
- **Node.js v22.14.0** - środowisko uruchomieniowe (patrz: `.nvmrc`)

### Frontend
- **React 19.1.1** - biblioteka UI dla interaktywnych komponentów
- **Tailwind CSS 4.1.13** - framework CSS (Vite plugin)
- **Shadcn/ui** - komponenty UI (gotowe do integracji)
- **Lucide React 0.487.0** - ikony
- **class-variance-authority** - warianty komponentów
- **clsx + tailwind-merge** - zarządzanie klasami CSS

### Development Tools
- **ESLint 9.23.0** - linter (z pluginami dla Astro, React, TypeScript)
- **Prettier** - formatowanie kodu (z pluginem dla Astro)
- **Husky 9.1.7** - Git hooks
- **lint-staged 15.5.0** - pre-commit linting

## Struktura projektu

```
10x-astro-starter/
├── .github/
│   └── copilot-instructions.md     # Instrukcje dla GitHub Copilot
├── .cursor/                         # Konfiguracja dla Cursor IDE
├── .husky/                          # Git hooks (pre-commit)
├── public/                          # Statyczne pliki publiczne
├── src/
│   ├── components/                  # Komponenty UI
│   │   ├── ui/                      # Komponenty Shadcn/ui
│   │   └── Welcome.astro            # Przykładowy komponent
│   ├── layouts/
│   │   └── Layout.astro             # Główny layout
│   ├── lib/                         # Serwisy i helpery
│   ├── pages/
│   │   ├── api/                     # API endpoints (SSR)
│   │   └── index.astro              # Strona główna
│   ├── styles/                      # Style globalne
│   └── env.d.ts                     # Typy środowiskowe
├── astro.config.mjs                 # Konfiguracja Astro
├── components.json                  # Konfiguracja Shadcn/ui
├── eslint.config.js                 # Konfiguracja ESLint
├── package.json                     # Zależności projektu
├── tsconfig.json                    # Konfiguracja TypeScript
├── .windsurfrules                   # Konfiguracja dla Windsurf
└── README.md                        # Dokumentacja projektu
```

## Konfiguracja Astro

- **Output mode:** `server` (SSR)
- **Adapter:** `@astrojs/node` w trybie standalone
- **Port:** 3000
- **Integracje:**
  - `@astrojs/react` - wsparcie dla React
  - `@astrojs/sitemap` - generowanie sitemap
  - `@tailwindcss/vite` - Tailwind CSS przez Vite

## Konwencje kodowania

### Architektura komponentów
- **Komponenty Astro (.astro)** - dla statycznej treści i layoutów
- **Komponenty React (.tsx)** - tylko gdy potrzebna interaktywność
- **NIE używaj** dyrektyw Next.js (`"use client"`, itp.)

### Struktura plików
- **API Endpoints:** `src/pages/api/` - używaj `export const prerender = false`
- **Serwisy:** `src/lib/services/` - logika biznesowa
- **Custom Hooks:** `src/components/hooks/` - logika React
- **Typy:** `src/types.ts` - współdzielone typy (gdy projekt się rozwinie)
- **Klienty DB:** `src/db/` - klienty Supabase (gdy będą dodane)

### Styling (Tailwind CSS)
- Używaj utility classes bezpośrednio w komponentach
- Arbitrary values: `w-[123px]` dla precyzyjnych wartości
- Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Dark mode: `dark:` variant
- State variants: `hover:`, `focus-visible:`, `active:`, `disabled:`
- Organizuj style przez `@layer` (base, components, utilities)

### Obsługa błędów
- **Guard clauses** na początku funkcji
- **Early returns** dla warunków błędów
- Unikaj głęboko zagnieżdżonych `if` statements
- Happy path na końcu funkcji
- Logowanie błędów z kontekstem
- User-friendly komunikaty błędów

### Accessibility (A11y)
- Semantyczny HTML jako priorytet
- ARIA tylko gdy brak natywnych alternatyw
- `aria-label` / `aria-labelledby` dla elementów bez widocznych etykiet
- `aria-expanded` / `aria-controls` dla rozwijalnych elementów
- `aria-live` dla dynamicznych treści
- `aria-hidden` dla dekoracyjnych elementów
- Testuj z czytnikiem ekranu

### React Best Practices
- Functional components + hooks
- `React.memo()` dla często renderowanych komponentów
- `useCallback` dla event handlerów przekazywanych do dzieci
- `useMemo` dla kosztownych obliczeń
- `React.lazy()` + `Suspense` dla code-splitting
- `useId()` dla unikalnych ID w accessibility

### TypeScript
- Zawsze definiuj typy dla props
- Unikaj `any` - użyj `unknown` gdy typ nieznany
- Używaj `interface` dla object shapes
- Używaj `type` dla unions, intersections, primitives
- Eksportuj typy gdy współdzielone między modułami

## Skrypty NPM

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build produkcyjny
npm run preview      # Podgląd buildu
npm run lint         # Uruchom ESLint
npm run lint:fix     # Napraw problemy ESLint
npm run format       # Formatuj kod Prettier
```

## Linting & Pre-commit

### Pre-commit hooks (lint-staged)
- **TypeScript/TSX/Astro:** ESLint --fix
- **JSON/CSS/MD:** Prettier --write

### ESLint plugins aktywne
- `eslint-plugin-astro` - reguły dla Astro
- `eslint-plugin-react` - reguły dla React
- `eslint-plugin-react-hooks` - hooks rules
- `eslint-plugin-react-compiler` - React compiler
- `eslint-plugin-jsx-a11y` - accessibility
- `eslint-plugin-import` - import/export
- `@typescript-eslint` - TypeScript rules

## Backend & Database (Planowane)

### Supabase (gdy zostanie dodany)
- Używaj `supabase` z `context.locals` w Astro routes
- NIE importuj `supabaseClient` bezpośrednio
- Typ `SupabaseClient` z `src/db/supabase.client.ts`
- Walidacja danych przez **Zod schemas**
- Middleware w `src/middleware/index.ts`

### API Endpoints
- Uppercase handlers: `GET`, `POST`, `PUT`, `DELETE`
- `export const prerender = false` dla dynamic routes
- Walidacja input przez Zod
- Ekstraktuj logikę do serwisów (`src/lib/services/`)

## Environment Variables

- **Prefix:** `PUBLIC_` dla zmiennych dostępnych w kliencie
- **Dostęp:** `import.meta.env.NAZWA_ZMIENNEJ`
- **Plik:** `.env.example` (template), `.env` (lokalne - gitignored)
- **Typ safety:** Definiuj w `src/env.d.ts`

## Git Workflow

1. Pre-commit hook automatycznie uruchamia lint-staged
2. Sprawdza i naprawia pliki przed commitem
3. Commituj tylko gdy linter przechodzi bez błędów

## Notatki dla AI Agentów

### Podczas modyfikacji kodu
1. ✅ Sprawdź istniejące konwencje w podobnych plikach
2. ✅ Użyj lintera przed commitem: `npm run lint:fix`
3. ✅ Minimalne zmiany - chirurgiczna precyzja
4. ✅ Zachowaj istniejący styl i formatowanie
5. ✅ Aktualizuj dokumentację gdy zmieniasz strukturę

### Podczas dodawania nowych feature'ów
1. ✅ Użyj odpowiednich narzędzi ekosystemu (npm, scaffolding tools)
2. ✅ Dodaj typy TypeScript dla nowych modułów
3. ✅ Testuj zmiany przez `npm run dev`
4. ✅ Sprawdź dostępność (A11y) dla UI changes
5. ✅ Dokumentuj API endpoints w komentarzach

### Podczas debugowania
1. ✅ Uruchom `npm run lint` aby znaleźć problemy
2. ✅ Sprawdź console w devtools przeglądarki
3. ✅ Użyj TypeScript errors jako wskazówek
4. ✅ Testuj w trybie dev przed buildem produkcyjnym

### Nie rób tego
- ❌ Nie usuwaj działającego kodu bez wyraźnej potrzeby
- ❌ Nie ignoruj niezwiązanych błędów testów/buildu
- ❌ Nie dodawaj nowych narzędzi linting/testing bez potrzeby
- ❌ Nie commituj sekretów/credentials do repo
- ❌ Nie używaj dyrektyw Next.js w projekcie Astro
- ❌ Nie importuj `"use client"` - to nie Next.js!

## Stan projektu

### ✅ Skonfigurowane
- Astro 5 z SSR
- React 19 integration
- Tailwind CSS 4
- TypeScript 5
- ESLint + Prettier
- Git hooks (Husky + lint-staged)
- Podstawowa struktura projektu
- AI development support (Cursor, Copilot, Windsurf)

### 📋 Do dodania (gdy potrzebne)
- Supabase integration
- Autentykacja
- Middleware
- Content Collections
- Image optimization
- SEO meta tags
- Testing framework
- CI/CD pipeline
- Error tracking
- Analytics

## Przydatne linki

- [Astro Docs](https://docs.astro.build/)
- [React Docs](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Shadcn/ui](https://ui.shadcn.com/)

---

**Ostatnia aktualizacja:** 2025-01-XX  
**Maintainer:** Przeprogramowani Team

_Ten plik jest przeznaczony dla AI Agentów (GitHub Copilot, Cursor, Windsurf, itp.) aby zapewnić pełny kontekst projektu w kolejnych sesjach._
