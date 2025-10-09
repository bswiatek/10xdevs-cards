# API Endpoint Implementation Plan: Create New Flashcard Set

## 1. Przegląd punktu końcowego

Endpoint odpowiada za tworzenie nowego zestawu fiszek, zarówno na podstawie generacji AI, jak i ręcznego tworzenia przez użytkownika. Celem jest zapisanie zestawu fiszek w bazie danych wraz z odpowiednimi metadanymi, takimi jak liczba fiszek, dane sesji generacji oraz informacje o postępie nauki.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Endpoint URL**: /api/generations/flashcard-sets
- **Nagłówki**:
  - Authorization: Bearer {access_token}
- **Parametry**:
  - **Wymagane**:
    - Dla obu trybów: tytuł zestawu "title"
  - **Opcjonalne** (tylko dla generacji AI):
    - generation_session_id (numeric, identyfikator sesji generacji)
    - flashcards (tablica obiektów zawierających dane kandydatów)
      - temp_id (string)
      - front (string)
      - back (string)
      - action (jedna z: accepted, edited, rejected)

**Przykłady Request Body**:

- **Generacja AI**:
```json
{
  "title": "Introduction to Psychology",
  "generation_session_id": 12345,
  "flashcards": [
    {
      "temp_id": "cand_001",
      "front": "What is spaced repetition?",
      "back": "A learning technique that involves reviewing information at increasing intervals.",
      "action": "accepted"
    },
    {
      "temp_id": "cand_005",
      "front": "What is FSRS?",
      "back": "Free Spaced Repetition Scheduler - an open-source algorithm for optimizing learning schedules. Modified by user.",
      "action": "edited"
    }
  ]
}
```

- **Ręczne stworzenie**:
```json
{
  "title": "My Custom Flashcard Set"
}
```

## 3. Wykorzystywane typy

- **DTO i Command Modele**:
  - CreateFlashcardSetCommand (pole title oraz opcjonalnie dane do generacji)
  - CreateFlashcardSetResponseDTO (zawiera pola: id, user_id, title, cards_count, due_cards_count, created_at, updated_at oraz generation_metadata, jeśli dotyczy)
  - GenerationMetadataDTO (generation_session_id, candidates_accepted, candidates_rejected, candidates_edited, acceptance_rate)
  - Inne typy pomocnicze zdefiniowane w pliku types.ts

## 4. Szczegóły odpowiedzi

- **Kod 201 Created**: Pomyślne utworzenie zestawu fiszek. Body odpowiedzi zawiera:
  - id (unikalny identyfikator zestawu)
  - user_id (ID użytkownika)
  - title
  - cards_count
  - due_cards_count
  - created_at
  - updated_at
  - generation_metadata (jeśli dotyczy)

- **Przykład odpowiedzi**:
```json
{
  "id": 1003,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Introduction to Psychology",
  "cards_count": 12,
  "due_cards_count": 12,
  "created_at": "2025-10-08T19:10:00Z",
  "updated_at": "2025-10-08T19:10:00Z",
  "generation_metadata": {
    "generation_session_id": 12345,
    "candidates_accepted": 10,
    "candidates_rejected": 3,
    "candidates_edited": 2,
    "acceptance_rate": 80.0
  }
}
```

## 5. Przepływ danych

1. Odbiór żądania wraz z nagłówkiem Authorization.
2. Weryfikacja tokenu i autoryzacja użytkownika - to powinien być aktualnie mock, analogicznie jak w endpoind /generations
3. Walidacja danych wejściowych:
   - Sprawdzenie, czy pole "title" nie jest puste.
   - W przypadku generacji AI: walidacja generation_session_id oraz poprawności struktur w tablicy flashcards (długość tekstu, format danych).
4. Przekazanie danych do warstwy serwisowej, która wyodrębnia logikę tworzenia zestawu.
5. Utworzenie rekordu w tabeli flashcard_sets oraz, w razie potrzeby, powiązanych rekordów w flashcards i flashcard_progress.
6. Zaktualizowanie danych metrycznych sesji generacji w tabeli generation_sessions (jeśli dotyczy).
7. Zwrócenie odpowiedzi z kodem 201 Created oraz szczegółami utworzonego zestawu.

## 6. Względy bezpieczeństwa

- Weryfikacja tokenu w nagłówku Authorization.
- Walidacja danych wejściowych przy użyciu Zod oraz weryfikacja zgodności z regułami bazy danych (np. ograniczenia długości tekstu fiszek).
- Ograniczenie dostępu do endpointu jedynie dla uwierzytelnionych użytkowników.
- Ochrona przed SQL injection poprzez stosowanie parametrów w zapytaniach.

## 7. Obsługa błędów

- **400 Bad Request**: 
  - Pusty tytuł
  - Brak wymaganych danych (np. flashcards przy generacji AI)
  - Niepoprawny format danych wejściowych
- **401 Unauthorized**: 
  - Brak lub nieprawidłowy token
- **404 Not Found**: 
  - Nie znaleziono sesji generacji (dla generation_session_id)
- **422 Unprocessable Entity**: 
  - Błędy walidacyjne, np. przekroczenie dozwolonej długości tekstu fiszek
- **500 Internal Server Error**: 
  - Błędy systemowe lub naruszenia zasad logiki biznesowej
