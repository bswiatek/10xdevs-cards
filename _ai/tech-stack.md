## Szybkość dostarczenia MVP

Zaproponowany stack **umożliwia szybki rozwój MVP**. Astro 5 charakteryzuje się krótką krzywą uczenia (1-2 tygodnie dla programistów znających React) i przyspiesza rozwój funkcjonalności o 30% w porównaniu z tradycyjnym Reactem. Supabase eliminuje potrzebę budowania backendu od zera, dostarczając gotową autentykację, bazę danych PostgreSQL i API w ciągu sekund. OpenRouter upraszcza integrację z modelami AI poprzez zunifikowane API bez konieczności zarządzania wieloma dostawcami.

Dla projektu realizowanego przez jedną osobę to połączenie jest **optymalne** - eliminuje potrzebę pisania kodu backendowego, konfiguracji serwerów i zarządzania infrastrukturą.

## Skalowalność rozwiązania

**Problemy ze skalowalnością** mogą pojawić się w trzech obszarach. Supabase oferuje skalowanie enterprise-grade oparte na PostgreSQL, ale wymaga świadomego zarządzania planami i kosztami przy wzroście bazy użytkowników. OpenRouter automatycznie trasuje zapytania do dostępnych providerów, maksymalizując uptime, co jest kluczowe dla wymagania 99% dostępności z PRD.

Astro z SSG/SSR świetnie skaluje się dla treści statycznych, ale aplikacja zawiera znaczące komponenty dynamiczne (system nauki FSRS, real-time recenzja fiszek), które wymagają więcej logiki po stronie serwera niż typowy content-driven website. **Rekomendacja**: przeanalizować czy nie warto części logiki FSRS przenieść do Supabase Edge Functions zamiast obciążać klienta.

## Koszty utrzymania i rozwoju

**Struktura kosztów** wygląda następująco. Supabase oferuje darmowy tier, który wystarczy na początkowe testy, ale produkcja z wymaganiem 99% uptime wymaga płatnego planu (\$25-599+/miesiąc w zależności od liczby użytkowników). OpenRouter pobiera opłaty za tokeny AI - przy generowaniu fiszek (1000-10000 znaków wejścia) koszt jednej sesji to ok. \$0.01-0.05 dla GPT-4o lub Claude 3.5 Sonnet. DigitalOcean hosting zaczyna się od \$4-12/miesiąc dla podstawowych dropletów.

**Bezpłatny model biznesowy** bez limitów (z PRD) może szybko wygenerować nieakceptowalne koszty API AI przy większej liczbie użytkowników. **Krytyczny problem**: brak mechanizmów kontroli kosztów w PRD może doprowadzić do nieprzewidywalnych wydatków.

## Złożoność rozwiązania

Stack jest **zbyt złożony** dla obecnych wymagań MVP. Astro 5 + React 19 to podwójna warstwa frameworków, która ma sens dla content-heavy websites z wyspami interaktywności, ale aplikacja to klasyczny SPA z autentykacją i CRUD. TypeScript 5 i Tailwind 4 to uzasadnione wybory, ale Shadcn/ui dodaje kolejną warstwę abstrakcji tam, gdzie prosty Tailwind wystarczyłby.

**Prostsze alternatywy** mogłyby przyspieszyć rozwój. Dla MVP wystarczyłby **Next.js 15 + Supabase + Tailwind**, eliminując złożoność Astro Islands i konieczność integracji dwóch frameworków. Albo **SvelteKit + Supabase**, który oferuje prostszą architekturę i mniejsze bundle size niż React.

## Prostsze podejście spełniające wymagania

**Rekomendowane uproszczenie stosu**:

- Frontend: Next.js 15 App Router (eliminuje potrzebę Astro+React, lepsze dla aplikacji SPA z autentykacją)
- UI: Tailwind 4 + podstawowe komponenty (bez Shadcn/ui w MVP)
- Backend: Supabase (pozostaje)
- AI: OpenRouter (pozostaje, ale z rate limitingiem)
- Hosting: Vercel (bezpłatny tier wystarczy na start, lepiej zintegrowany z Next.js niż DigitalOcean)

To podejście **redukuje złożoność o 30-40%** przy zachowaniu wszystkich funkcjonalności PRD. Astro ma sens dla blogów i marketing websites, ale nie dla interaktywnych aplikacji edukacyjnych.

## Bezpieczeństwo rozwiązania

Stack **zapewnia solidne fundamenty bezpieczeństwa**. Supabase dostarcza Row Level Security (RLS), autentykację z haszowaniem haseł, ochronę przed SQL injection i HTTPS out-of-the-box. OpenRouter dodaje warstwę abstrakcji chroniącą klucze API przed ekspozycją w frontendzie.

**Luki bezpieczeństwa w PRD** wymagają uwagi: brak weryfikacji emaila przy rejestracji ułatwia spam, brak rate limitingu na generowanie fiszek umożliwia nadużycia kosztowe, brak CAPTCHA na formularzach logowania/rejestracji otwiera drogę do botów. Te problemy nie wynikają ze stosu technologicznego, ale z brakujących wymagań w PRD.

**Krytyczna rekomendacja**: dodać Supabase Auth rate limiting i email verification, nawet jeśli to wydłuży czas do MVP o tydzień - bez tego aplikacja jest podatna na nadużycia.
