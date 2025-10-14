# Plan Testów dla Aplikacji "Generator Fiszek AI"

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji "Generator Fiszek AI". Aplikacja jest nowoczesnym narzędziem webowym zbudowanym w oparciu o technologie Astro, React, TypeScript i Supabase. Jej główną funkcjonalnością jest generowanie fiszek edukacyjnych na podstawie tekstu dostarczonego przez użytkownika, z wykorzystaniem zewnętrznych modeli językowych poprzez usługę OpenRouter.

Plan ten ma na celu zapewnienie kompleksowego podejścia do weryfikacji jakości, funkcjonalności, wydajności i bezpieczeństwa aplikacji przed jej wdrożeniem produkcyjnym.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

*   **Weryfikacja funkcjonalna:** Zapewnienie, że wszystkie funkcje aplikacji działają zgodnie z założeniami, a krytyczna ścieżka użytkownika (od rejestracji, przez generowanie i recenzję, po zarządzanie zestawami) jest wolna od błędów blokujących.
*   **Zapewnienie stabilności i niezawodności:** Identyfikacja i eliminacja błędów, które mogłyby prowadzić do awarii aplikacji, utraty danych lub negatywnych doświadczeń użytkownika.
*   **Ocena wydajności:** Weryfikacja, czy kluczowe operacje, w szczególności generowanie fiszek przez AI, mieszczą się w akceptowalnych ramach czasowych.
*   **Weryfikacja bezpieczeństwa:** Upewnienie się, że dane użytkowników są odizolowane i zabezpieczone przed nieautoryzowanym dostępem.
*   **Zapewnienie jakości UI/UX:** Sprawdzenie, czy interfejs użytkownika jest spójny, intuicyjny i responsywny na różnych urządzeniach.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami (In-Scope)

*   **Moduł Uwierzytelniania:** Rejestracja, logowanie, wylogowywanie, zmiana hasła.
*   **Ochrona Stron i API:** Weryfikacja, czy dostęp do chronionych zasobów wymaga zalogowania.
*   **Moduł Generowania Fiszki:**
    *   Walidacja tekstu źródłowego (minimalna i maksymalna długość).
    *   Proces generowania i obsługa stanu ładowania.
    *   Obsługa błędów (timeout, błędy API AI, błędy sieci).
*   **Moduł Recenzji Fiszki:**
    *   Wyświetlanie kandydatów na fiszki.
    *   Funkcjonalność akceptacji, odrzucenia, edycji i cofania akcji.
    *   Zapisywanie nowego zestawu fiszek.
*   **Moduł Zarządzania Zestawami (Dashboard):**
    *   Wyświetlanie, wyszukiwanie i paginacja zestawów.
    *   Tworzenie, edycja i usuwanie zestawów oraz pojedynczych fiszek.
*   **Responsywność Interfejsu:** Podstawowa weryfikacja wyglądu na urządzeniach mobilnych i desktopowych.

### 2.2. Funkcjonalności wyłączone z testów (Out-of-Scope)

*   **Testowanie infrastruktury chmurowej:** Niezawodność i działanie usług Supabase oraz OpenRouter.
*   **Testowanie przeglądarek:** Testy będą ograniczone do najnowszych wersji Google Chrome i Firefox.
*   **Moduł Nauki:** Funkcjonalność jest obecnie zaślepką i nie będzie testowana.
*   **Funkcjonalności administracyjne:** Obszary oznaczone jako `admin-only` są wyłączone z tego planu.

## 3. Typy Testów do Przeprowadzenia

Proces testowania zostanie podzielony na kilka poziomów, aby zapewnić kompleksowe pokrycie.

### 3.1. Testy Jednostkowe (Unit Tests)

*   **Cel:** Weryfikacja poprawności działania małych, izolowanych fragmentów kodu.
*   **Zakres:**
    *   Logika walidacji (wszystkie schematy Zod w `src/lib/validations/`).
    *   Funkcje pomocnicze (`src/lib/utils.ts`, `src/lib/logging.ts`).
    *   Logika biznesowa w customowych hookach React (`src/components/hooks/*`), np. walidacja w `useFlashcardValidation`, obliczenia w `useReviewSession`.

### 3.2. Testy Integracyjne (Integration Tests)

*   **Cel:** Weryfikacja poprawnej współpracy między różnymi modułami aplikacji.
*   **Zakres:**
    *   **Integracja komponentów:** Testowanie interakcji między komponentem-rodzicem a jego dziećmi (np. `DashboardView` z `SetsGrid` i `SetsSearchBar`).
    *   **Integracja API:** Testowanie każdego endpointu API (`src/pages/api/**/*.ts`). Każdy test zweryfikuje logikę biznesową, interakcję z Supabase (mockowanym lub testowym) oraz poprawność formatu odpowiedzi dla różnych scenariuszy (sukces, błąd walidacji, brak autoryzacji, błąd serwera).

### 3.3. Testy End-to-End (E2E)

*   **Cel:** Symulacja pełnych scenariuszy użytkowania z perspektywy użytkownika końcowego w środowisku zbliżonym do produkcyjnego.
*   **Zakres:** Testowanie "ścieżki krytycznej":
    *   Rejestracja nowego użytkownika, logowanie.
    *   Stworzenie nowego zestawu fiszek poprzez proces generowania AI.
    *   Recenzja fiszek: akceptacja kilku, edycja jednej, odrzucenie jednej.
    *   Zapisanie zestawu.
    *   Odnalezienie zestawu na dashboardzie i wejście w jego szczegóły.
    *   Edycja i usunięcie pojedynczej fiszki w zestawie.
    *   Usunięcie całego zestawu.
    *   Wylogowanie.

### 3.4. Testy Wydajnościowe

*   **Cel:** Ocena czasu odpowiedzi i stabilności aplikacji pod obciążeniem.
*   **Zakres:**
    *   **Test obciążeniowy:** Endpoint `POST /api/generations`, aby zmierzyć czas odpowiedzi i zużycie zasobów.
    *   **Test warunków skrajnych:** Endpoint `GET /api/flashcard-sets` z dużą liczbą (np. 1000+) zestawów w bazie danych, aby sprawdzić wydajność paginacji i wyszukiwania.

### 3.5. Testy Bezpieczeństwa

*   **Cel:** Weryfikacja podstawowych mechanizmów bezpieczeństwa.
*   **Zakres:**
    *   **Kontrola dostępu:** Próba wykonania operacji CRUD na zasobach (zestawach, fiszkach) należących do innego użytkownika.
    *   **Ochrona routingu:** Próba dostępu do chronionych stron (np. `/dashboard`) bez zalogowania.

### 3.6. Testy Wizualnej Regresji

*   **Cel:** Automatyczne wykrywanie niezamierzonych zmian w interfejsie użytkownika.
*   **Zakres:** Kluczowe komponenty z biblioteki UI (`src/components/ui/*`) oraz główne widoki aplikacji (`DashboardView`, `SetDetailsView`, `GenerateView`, `ReviewView`).

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniżej przedstawiono przykładowe, wysokopoziomowe scenariusze testowe.

| Funkcjonalność | Scenariusz | Oczekiwany Rezultat | Priorytet |
| :--- | :--- | :--- | :--- |
| **Rejestracja** | Użytkownik podaje poprawne i unikalne dane | Konto zostaje utworzone, użytkownik jest automatycznie logowany i przekierowany do `/generate`. | Wysoki |
| | Użytkownik podaje email, który już istnieje w bazie | Wyświetlany jest komunikat o błędzie "Konto z tym adresem email już istnieje". | Wysoki |
| | Użytkownik podaje hasła, które nie są identyczne | Wyświetlany jest błąd walidacji "Hasła muszą być identyczne". | Wysoki |
| **Logowanie** | Użytkownik podaje poprawne dane logowania | Użytkownik zostaje zalogowany i przekierowany do `/generate`. | Wysoki |
| | Użytkownik podaje nieprawidłowe hasło | Wyświetlany jest komunikat o błędzie "Nieprawidłowe dane logowania". | Wysoki |
| **Generowanie Fiszki** | Użytkownik wkleja tekst o poprawnej długości (1000-10000 znaków) i klika "Generuj" | Wyświetlany jest stan ładowania, a po pomyślnym zakończeniu użytkownik jest przekierowany do widoku recenzji (`/review/[sessionId]`) z wygenerowanymi fiszkami. | Wysoki |
| | Użytkownik wkleja tekst za krótki (<1000 znaków) | Przycisk "Generuj" jest nieaktywny, wyświetlany jest komunikat o minimalnej długości. | Średni |
| | Generowanie przez AI przekracza limit czasu (60s) | Stan ładowania znika, a na stronie generowania wyświetlany jest baner z błędem o przekroczeniu limitu czasu. | Wysoki |
| **Recenzja i Zapis** | Użytkownik akceptuje 5 fiszek, odrzuca 2 i klika "Zapisz zestaw" | Pojawia się modal do wpisania tytułu. Po wpisaniu i zatwierdzeniu zestaw zostaje zapisany, a użytkownik jest przekierowany na stronę szczegółów nowego zestawu. | Wysoki |
| | Użytkownik odrzuca wszystkie fiszki i próbuje zapisać zestaw | Przycisk "Zapisz zestaw" jest nieaktywny. | Średni |
| **Zarządzanie Zestawem**| Użytkownik usuwa pojedynczą fiszkę z zestawu | Fiszka znika z listy, licznik fiszek w zestawie jest zaktualizowany. | Wysoki |
| | Użytkownik usuwa cały zestaw fiszek | Zestaw znika z dashboardu. | Wysoki |

## 5. Środowisko Testowe

*   **Infrastruktura:** Dedykowany projekt Supabase na potrzeby środowiska testowego/stagingowego, odizolowany od danych produkcyjnych.
*   **Dane testowe:** Skrypty do wypełniania bazy danych testowymi użytkownikami, zestawami fiszek i progresami w nauce, aby umożliwić testowanie paginacji, wyszukiwania i wydajności.
*   **Klucze API:** Dedykowane klucze API dla OpenRouter na potrzeby testów manualnych i E2E na środowisku stagingowym.
*   **Mock Serwer:** Mock serwera API OpenRouter dla testów integracyjnych i E2E uruchamianych lokalnie/w CI, symulujący różne scenariusze odpowiedzi (sukces, błędy, opóźnienia).

## 6. Narzędzia do Testowania

| Typ Testu | Proponowane Narzędzie | Uzasadnienie |
| :--- | :--- | :--- |
| Jednostkowe / Integracyjne | **Vitest + React Testing Library** | Zintegrowane ze środowiskiem Vite/Astro. Szybkie i wydajne. RTL promuje dobre praktyki testowania z perspektywy użytkownika. |
| End-to-End | **Playwright** | Nowoczesne i szybkie narzędzie, oferuje doskonałą kontrolę nad przeglądarką, mockowanie API i nagrywanie testów. |
| Wizualna Regresja | **Storybook + Chromatic** | Storybook do izolowanego rozwoju komponentów UI, Chromatic do automatyzacji testów wizualnych i wykrywania regresji. |
| Wydajnościowe | **k6 (Grafana)** | Nowoczesne narzędzie do testów obciążeniowych, pisane w JavaScripcie, łatwe do integracji w procesie CI/CD. |
| Raportowanie Błędów | **GitHub Issues / Jira** | Integracja z repozytorium kodu / zaawansowane zarządzanie projektem. |

## 7. Harmonogram Testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju.

*   **Testy Jednostkowe i Integracyjne:** Pisane przez deweloperów równolegle z implementacją nowych funkcji. Muszą być częścią każdego Pull Requestu.
*   **Testy E2E:** Uruchamiane automatycznie w ramach pipeline'u CI/CD po każdym pushu do gałęzi `main` oraz przed każdym wdrożeniem na produkcję.
*   **Testy manualne i eksploracyjne:** Przeprowadzane przed każdym wydaniem (np. raz na sprint) na środowisku stagingowym.
*   **Testy wydajnościowe:** Wykonywane kwartalnie lub przed wdrożeniem zmian mogących znacząco wpłynąć na wydajność.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Entry Criteria)

*   Zakończono rozwój funkcjonalności w ramach sprintu.
*   Kod źródłowy został wdrożony na środowisku testowym/stagingowym.
*   Wszystkie testy jednostkowe i integracyjne przechodzą pomyślnie.

### 8.2. Kryteria Wyjścia (Exit Criteria)

*   **Pokrycie kodu testami:** Co najmniej 80% dla kluczowych modułów (serwisy, haki).
*   **Status testów E2E:** 100% testów krytycznej ścieżki użytkownika musi kończyć się sukcesem.
*   **Błędy:**
    *   Brak błędów krytycznych (blokujących).
    *   Wszystkie błędy o wysokim priorytecie zostały rozwiązane.
    *   Liczba znanych błędów o średnim i niskim priorytecie jest zaakceptowana przez Product Ownera.

## 9. Role i Odpowiedzialności

*   **Deweloperzy:**
    *   Odpowiedzialni za pisanie testów jednostkowych i integracyjnych dla tworzonego kodu.
    *   Naprawianie błędów zgłoszonych przez zespół QA.
    *   Utrzymywanie pipeline'u CI/CD.
*   **Inżynier QA (rola obsadzana przez autora tego planu):**
    *   Tworzenie i utrzymanie tego planu testów.
    *   Implementacja i utrzymanie automatycznych testów E2E, wydajnościowych i bezpieczeństwa.
    *   Przeprowadzanie testów manualnych i eksploracyjnych.
    *   Zarządzanie procesem raportowania błędów.
*   **Product Owner / Manager:**
    *   Definiowanie priorytetów dla testowanych funkcjonalności.
    *   Udział w Testach Akceptacyjnych Użytkownika (UAT).
    *   Podejmowanie decyzji o akceptacji znanych błędów o niskim priorytecie.

## 10. Procedury Raportowania Błędów

Wszystkie zidentyfikowane błędy będą raportowane w systemie śledzenia (np. GitHub Issues) i powinny zawierać następujące informacje:

*   **Tytuł:** Zwięzły i jednoznaczny opis problemu.
*   **Środowisko:** (np. Lokalnie, Staging, Produkcja) oraz wersja przeglądarki.
*   **Kroki do odtworzenia:** Szczegółowa, numerowana lista kroków potrzebnych do wywołania błędu.
*   **Rezultat Oczekiwany:** Co powinno się wydarzyć.
*   **Rezultat Rzeczywisty:** Co się wydarzyło.
*   **Priorytet/Waga:** (np. Krytyczny, Wysoki, Średni, Niski).
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.