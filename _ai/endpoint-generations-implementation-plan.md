# API Endpoint Implementation Plan: POST /generations

## 1. Przegląd punktu końcowego

Ten punkt końcowy inicjuje proces generowania kandydatów na fiszki przy użyciu AI. Uwierzytelniony użytkownik wysyła fragment tekstu, który jest następnie przesyłany do zewnętrznego dostawcy AI (OpenRouter) w celu analizy i ekstrakcji par pytanie-odpowiedź. Wynik jest zwracany jako sesja generowania, zawierająca listę kandydatów na fiszki do dalszej weryfikacji przez użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/generations`
- **Nagłówki:**
  - `Authorization` (Wymagane): `Bearer <supabase_jwt_token>`
  - `Content-Type`: `application/json`
- **Request Body:**
  ```json
  {
    "source_text": "String zawierający materiał do nauki o długości od 1000 do 10000 znaków."
  }
  ```

## 3. Wykorzystywane typy

- **Command (Request):** `GenerateFlashcardsCommand`
  ```typescript
  export interface GenerateFlashcardsCommand {
    source_text: string;
  }
  ```
- **DTO (Response):** `GenerationSessionDTO`
  ```typescript
  export interface GenerationSessionDTO {
    generation_session_id: number;
    candidates: CandidateFlashcardDTO[];
    created_at: string;
  }
  ```
- **DTO (Nested):** `CandidateFlashcardDTO`
  ```typescript
  export interface CandidateFlashcardDTO {
    id: string; // UUID wygenerowane po stronie klienta
    front: string;
    back: string;
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created):**
  ```json
  {
    "generation_session_id": 12345,
    "candidates": [
      {
        "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
        "front": "Jakie są główne założenia teorii względności?",
        "back": "Teoria względności Einsteina opiera się na dwóch postulatach: stałości prędkości światła i zasadzie względności."
      }
    ],
    "created_at": "2025-10-08T19:05:30Z"
  }
  ```
- **Odpowiedzi błędów:** Zobacz sekcję 7. Obsługa błędów.

## 5. Przepływ danych

1.  Użytkownik wysyła żądanie `POST` na `/api/generations` z `source_text` w ciele.
2.  Middleware Astro weryfikuje token JWT i dołącza sesję użytkownika do `context.locals`.
3.  Handler API w `src/pages/api/generations/index.ts` odbiera żądanie.
4.  Handler sprawdza, czy użytkownik jest uwierzytelniony. Jeśli nie, zwraca `401 Unauthorized`.
5.  Dane wejściowe są walidowane za pomocą schematu Zod (`GenerateFlashcardsSchema`). W przypadku błędu zwracane jest `400 Bad Request`.
6.  Handler wywołuje funkcję `generateFlashcardsFromText` z serwisu `GenerationService` (`src/lib/services/generation.service.ts`), przekazując `source_text` i `user_id`.
7.  `GenerationService` konstruuje i wysyła zapytanie do API OpenRouter, zawierające `source_text` w odpowiednio przygotowanym prompcie.
8.  Serwis oczekuje na odpowiedź od AI. W przypadku przekroczenia limitu czasu (np. 60s), zwraca błąd.
9.  Po otrzymaniu odpowiedzi, serwis parsuje ją, aby wyodrębnić listę kandydatów na fiszki.
10. Serwis zapisuje metadane sesji (długość tekstu, liczba kandydatów, czas generowania) do tabeli `generation_sessions` w bazie danych Supabase.
11. Serwis zwraca obiekt `GenerationSessionDTO` do handlera API.
12. Handler API serializuje DTO i wysyła odpowiedź `201 Created` do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Dostęp do punktu końcowego musi być chroniony i wymagać ważnego tokenu JWT od Supabase. Każde żądanie musi być powiązane z konkretnym użytkownikiem.
- **Autoryzacja:** Każdy uwierzytelniony użytkownik ma prawo do korzystania z tego punktu końcowego. Nie ma dodatkowych ról (np. admin).
- **Walidacja danych wejściowych:** Wszystkie dane wejściowe (`source_text`) muszą być rygorystycznie walidowane za pomocą Zod, aby zapobiec błędom przetwarzania i potencjalnym atakom (np. nadmiernie długi tekst).
- **Ochrona przed nadużyciami (Rate Limiting):** Należy zaimplementować mechanizm ograniczający liczbę żądań generowania na użytkownika w danym okresie (np. 10 żądań na godzinę), aby kontrolować koszty API AI.
- **Zarządzanie kluczami API:** Klucz do API OpenRouter musi być przechowywany jako zmienna środowiskowa po stronie serwera (`OPENROUTER_API_KEY`) i nigdy nie może być eksponowany po stronie klienta.

## 7. Obsługa błędów

- **`400 Bad Request`**:
  - `source_text` jest pusty, nie jest stringiem, jest za krótki (<1000 znaków) lub za długi (>10000 znaków).
- **`401 Unauthorized`**:
  - Brak nagłówka `Authorization` lub token JWT jest nieprawidłowy/wygasł.
- **`408 Request Timeout`**:
  - Odpowiedź z API OpenRouter nie nadeszła w określonym czasie (np. 60 sekund).
- **`500 Internal Server Error`**:
  - Wystąpił błąd podczas zapisu do tabeli `generation_sessions`.
  - Wystąpił nieoczekiwany błąd serwera.
  - Błąd logowania do tabeli `system_logs`.
- **`503 Service Unavailable`**:
  - API OpenRouter jest niedostępne lub zwróciło błąd 5xx.
  - Nie udało się przetworzyć odpowiedzi z AI (np. nieprawidłowy format JSON).

Wszystkie krytyczne błędy po stronie serwera (5xx) będą rejestrowane w tabeli `system_logs` z poziomem `ERROR`.

## 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi AI:** Głównym wąskim gardłem jest czas odpowiedzi od zewnętrznego API. Należy zaimplementować rozsądny timeout (np. 60 sekund) i poinformować użytkownika o trwającym procesie za pomocą wskaźnika ładowania na froncie.
- **Asynchroniczność:** Operacja jest z natury asynchroniczna. Cały przepływ po stronie serwera musi być zaimplementowany bez blokowania pętli zdarzeń Node.js.
- **Rozmiar payloadu:** Ograniczenie długości `source_text` do 10000 znaków zapobiega przesyłaniu zbyt dużych payloadów. Odpowiedź również powinna być monitorowana pod kątem rozmiaru.

## 9. Etapy wdrożenia

1.  **Konfiguracja środowiska:** Dodać `OPENROUTER_API_KEY` do zmiennych środowiskowych (`.env`).
2.  **Struktura plików:**
    - Utworzyć plik handlera API: `src/pages/api/generations/index.ts`.
    - Utworzyć plik serwisu: `src/lib/services/generation.service.ts`.
    - Utworzyć plik z funkcjami pomocniczymi do logowania: `src/lib/logging.ts` (jeśli nie istnieje).
3.  **Implementacja handlera API (`.../api/generations/index.ts`):**
    - Dodać `export const prerender = false;`.
    - Zaimplementować logikę handlera `POST`.
    - Dodać pobieranie użytkownika z `context.locals.supabase`.
    - Zdefiniować i zastosować schemat walidacji Zod dla `source_text`.
    - Dodać bloki `try...catch` do obsługi błędów z serwisu i zwracania odpowiednich kodów HTTP.
4.  **Implementacja serwisu (`.../services/generation.service.ts`):**
    - Utworzyć funkcję `generateFlashcardsFromText(sourceText, userId)`.
    - Zaimplementować logikę komunikacji z API OpenRouter za pomocą `fetch`.
    - Dodać logikę parsowania odpowiedzi AI.
    - Zaimplementować zapis do tabeli `generation_sessions` przy użyciu klienta Supabase.
5.  **Logowanie błędów:** Zintegrować wywołania funkcji `logError` w blokach `catch` w handlerze i serwisie.
