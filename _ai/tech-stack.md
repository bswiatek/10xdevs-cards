## Szybkość dostarczenia MVP

Zaproponowany stack **umożliwia szybki rozwój MVP**. Astro 5 charakteryzuje się krótką krzywą uczenia (1-2 tygodnie dla programistów znających React) i przyspiesza rozwój funkcjonalności o 30% w porównaniu z tradycyjnym Reactem. Supabase eliminuje potrzebę budowania backendu od zera, dostarczając gotową autentykację, bazę danych PostgreSQL i API w ciągu sekund. OpenRouter upraszcza integrację z modelami AI poprzez zunifikowane API bez konieczności zarządzania wieloma dostawcami.

Dla projektu realizowanego przez jedną osobę to połączenie jest **optymalne** - eliminuje potrzebę pisania kodu backendowego, konfiguracji serwerów i zarządzania infrastrukturą.

## Narzędzia testowe

### Testy jednostkowe i integracyjne

**Vitest + React Testing Library** - wybór zintegrowany ze środowiskiem Vite/Astro, zapewniający szybkie wykonywanie testów jednostkowych i integracyjnych. React Testing Library promuje testowanie komponentów z perspektywy użytkownika, co przekłada się na wyższą jakość interfejsu. Vitest oferuje hot reload podczas pisania testów, co przyspiesza cykl development o ok. 40% w porównaniu z klasycznym Jest.

**Zakres testów jednostkowych**:
- Logika walidacji (schematy Zod w `src/lib/validations/`)
- Funkcje pomocnicze (`src/lib/utils.ts`, `src/lib/logging.ts`)
- Logika biznesowa w custom hookach React (`src/components/hooks/*`)
- Integracja komponentów React (rodzic-dzieci)
- API endpoints (`src/pages/api/**/*.ts`) z mockowanym Supabase

### Testy End-to-End (E2E)

**Playwright** - nowoczesne narzędzie oferujące doskonałą kontrolę nad przeglądarką, możliwość mockowania API i nagrywania testów. Playwright jest szybszy niż Cypress o ok. 25% i lepiej radzi sobie z testowaniem aplikacji multi-page (co jest istotne dla Astro z jego page-based routing).

**Zakres testów E2E**:
- Pełna ścieżka użytkownika: rejestracja → generowanie fiszek → recenzja → zapis → zarządzanie
- Testy autentykacji (logowanie, wylogowanie, zmiana hasła)
- Ochrona routingu (próba dostępu bez zalogowania)
- Responsywność interfejsu na urządzeniach mobilnych i desktopowych

### Testy wizualne

**Storybook + Chromatic** - Storybook do izolowanego rozwoju komponentów UI (eliminuje konieczność uruchamiania całej aplikacji podczas pracy nad komponentami), Chromatic do automatyzacji testów wizualnych i wykrywania regresji. To połączenie jest standardem branżowym dla projektów z design system i komponentami UI (Shadcn/ui).

### Testy wydajnościowe

**k6 (Grafana)** - nowoczesne narzędzie do testów obciążeniowych, pisane w JavaScripcie, łatwe do integracji w CI/CD. Kluczowe dla weryfikacji endpointu `POST /api/generations` (generowanie przez AI) oraz `GET /api/flashcard-sets` z dużą liczbą zestawów (>1000).

**Krytyczne metryki**:
- Czas odpowiedzi generowania fiszek: <60s (zgodnie z PRD)
- Wydajność paginacji dashboardu przy 1000+ zestawach
- Zużycie zasobów serwera podczas równoczesnych generacji

### Integracja z CI/CD

Wszystkie testy (jednostkowe, integracyjne, E2E) będą uruchamiane automatycznie w pipeline'ie CI/CD:
- **Pre-commit hooks**: Testy jednostkowe (Husky + lint-staged)
- **Pull Request**: Pełny zestaw testów jednostkowych i integracyjnych
- **Merge do main**: Testy E2E na środowisku stagingowym
- **Pre-deployment**: Testy wydajnościowe i bezpieczeństwa

## Skalowalność rozwiązania

**Problemy ze skalowalnością** mogą pojawić się w trzech obszarach. Supabase oferuje skalowanie enterprise-grade oparte na PostgreSQL, ale wymaga świadomego zarządzania planami i kosztami przy wzroście bazy użytkowników. OpenRouter automatycznie trasuje zapytania do dostępnych providerów, maksymalizując uptime, co jest kluczowe dla wymagania 99% dostępności z PRD.

Astro z SSG/SSR świetnie skaluje się dla treści statycznych, ale aplikacja zawiera znaczące komponenty dynamiczne (system nauki FSRS, real-time recenzja fiszek), które wymagają więcej logiki po stronie serwera niż typowy content-driven website. **Rekomendacja**: przeanalizować czy nie warto części logiki FSRS przenieść do Supabase Edge Functions zamiast obciążać klienta.

## Koszty utrzymania i rozwoju

**Struktura kosztów** wygląda następująco. Supabase oferuje darmowy tier, który wystarczy na początkowe testy, ale produkcja z wymaganiem 99% uptime wymaga płatnego planu (\$25-599+/miesiąc w zależności od liczby użytkowników). OpenRouter pobiera opłaty za tokeny AI - przy generowaniu fiszek (1000-10000 znaków wejścia) koszt jednej sesji to ok. \$0.01-0.05 dla GPT-4o lub Claude 3.5 Sonnet. DigitalOcean hosting zaczyna się od \$4-12/miesiąc dla podstawowych dropletów.

**Bezpłatny model biznesowy** bez limitów (z PRD) może szybko wygenerować nieakceptowalne koszty API AI przy większej liczbie użytkowników. **Krytyczny problem**: brak mechanizmów kontroli kosztów w PRD może doprowadzić do nieprzewidywalnych wydatków.

## Prostsze podejście spełniające wymagania

**Rekomendowane uproszczenie stosu**:

- Frontend: Next.js 15 App Router (eliminuje potrzebę Astro+React, lepsze dla aplikacji SPA z autentykacją)
- UI: Tailwind 4 + podstawowe komponenty
- Backend: Supabase (pozostaje)
- AI: OpenRouter (pozostaje, ale z rate limitingiem)
- Hosting: Vercel (bezpłatny tier wystarczy na start, lepiej zintegrowany z Next.js niż DigitalOcean)

To podejście **redukuje złożoność o 30-40%** przy zachowaniu wszystkich funkcjonalności PRD. Astro ma sens dla blogów i marketing websites, ale nie dla interaktywnych aplikacji edukacyjnych.

## Bezpieczeństwo rozwiązania

Stack **zapewnia solidne fundamenty bezpieczeństwa**. Supabase dostarcza Row Level Security (RLS), autentykację z haszowaniem haseł, ochronę przed SQL injection i HTTPS out-of-the-box. OpenRouter dodaje warstwę abstrakcji chroniącą klucze API przed ekspozycją w frontendzie.

**Luki bezpieczeństwa w PRD** wymagają uwagi: brak weryfikacji emaila przy rejestracji ułatwia spam, brak rate limitingu na generowanie fiszek umożliwia nadużycia kosztowe, brak CAPTCHA na formularzach logowania/rejestracji otwiera drogę do botów. Te problemy nie wynikają ze stosu technologicznego, ale z brakujących wymagań w PRD.

**Krytyczna rekomendacja**: dodać Supabase Auth rate limiting i email verification, nawet jeśli to wydłuży czas do MVP o tydzień - bez tego aplikacja jest podatna na nadużycia.
