# Przykłady testowania endpointa POST /api/flashcard-sets

## Wymagania wstępne

1. Uruchom dev server: `npm run dev`
2. Server powinien działać na `http://localhost:3000` (domyślny port Astro)
3. Upewnij się, że połączenie z Supabase jest skonfigurowane
4. Dla testów z generacją AI, najpierw utwórz sesję generacji przez endpoint `/api/generations`

---

## SCENARIUSZ A: Ręczne tworzenie pustego zestawu

### 1. Test poprawnego żądania - pusty zestaw (201 Created)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Flashcard Set"
  }' | jq '.'
```

**Oczekiwana odpowiedź (201):**

```json
{
  "id": 1,
  "user_id": "06f9f64c-fd4a-4466-9954-0e35ce6dfd15",
  "title": "My First Flashcard Set",
  "cards_count": 0,
  "due_cards_count": 0,
  "created_at": "2025-10-09T12:34:56.789Z",
  "updated_at": "2025-10-09T12:34:56.789Z"
}
```

---

### 2. Test walidacji - brak tytułu (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "title": {
      "_errors": ["Title is required"]
    }
  }
}
```

---

### 3. Test walidacji - tytuł za długi (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$(python3 -c 'print("A" * 201)')\"
  }" | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "title": {
      "_errors": ["Title must not exceed 200 characters"]
    }
  }
}
```

---

## SCENARIUSZ B: Tworzenie zestawu z generacji AI

### 4. Pełny workflow - od generacji do utworzenia zestawu

**Krok 1: Utwórz sesję generacji**

```bash
GENERATION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers and companies. React allows developers to create large web applications that can update and render efficiently in response to data changes. The main concept behind React is the component-based architecture, where the UI is divided into independent, reusable pieces called components. Each component manages its own state and can be composed together to build complex user interfaces. React uses a virtual DOM to optimize rendering performance by minimizing direct manipulation of the actual DOM. This approach makes React applications fast and responsive. React also introduced JSX, a syntax extension that allows you to write HTML-like code within JavaScript, making the code more readable and easier to write. React also introduced JSX, a syntax extension that allows you to write HTML-like code within JavaScript, making the code more readable and easier to write."
  }')

echo "Generation Response:"
echo $GENERATION_RESPONSE | jq '.'

# Wyciągnij generation_session_id i candidates
GENERATION_ID=$(echo $GENERATION_RESPONSE | jq -r '.generation_session_id')
echo "Generation Session ID: $GENERATION_ID"
```

**Krok 2: Utwórz zestaw fiszek z wygenerowanych kandydatów**

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d @- << EOF | jq '.'
{
  "title": "React Fundamentals",
  "generation_session_id": 9,
  "flashcards": [
    {
      "temp_id": "uuid-1",
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces",
      "action": "accepted"
    },
    {
      "temp_id": "uuid-2",
      "front": "What is the main concept behind React?",
      "back": "Component-based architecture - UI divided into reusable components (edited by user)",
      "action": "edited",
      "was_edited": true
    },
    {
      "temp_id": "uuid-3",
      "front": "What is JSX?",
      "back": "A syntax extension that allows writing HTML-like code in JavaScript",
      "action": "accepted"
    },
    {
      "temp_id": "uuid-4",
      "front": "This question was not good",
      "back": "So I rejected it",
      "action": "rejected"
    }
  ]
}
EOF
```

**Oczekiwana odpowiedź (201):**

```json
{
  "id": 2,
  "user_id": "06f9f64c-fd4a-4466-9954-0e35ce6dfd15",
  "title": "React Fundamentals",
  "cards_count": 3,
  "due_cards_count": 3,
  "created_at": "2025-10-09T12:35:00.000Z",
  "updated_at": "2025-10-09T12:35:00.000Z",
  "generation_metadata": {
    "generation_session_id": 1,
    "candidates_accepted": 2,
    "candidates_rejected": 1,
    "candidates_edited": 1,
    "acceptance_rate": 75.0
  }
}
```

---

### 5. Test z generation_session_id który nie istnieje (404 Not Found)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Set",
    "generation_session_id": 99999,
    "flashcards": [
      {
        "temp_id": "test-1",
        "front": "Question",
        "back": "Answer",
        "action": "accepted"
      }
    ]
  }' | jq '.'
```

**Oczekiwana odpowiedź (404):**

```json
{
  "error": "Not Found",
  "message": "Generation session not found"
}
```

---

### 6. Test z generation_session_id który został już użyty (422 Unprocessable Entity)

```bash
# Użyj tego samego GENERATION_ID co wcześniej
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Trying to use same session again\",
    \"generation_session_id\": $GENERATION_ID,
    \"flashcards\": [
      {
        \"temp_id\": \"test-1\",
        \"front\": \"Question\",
        \"back\": \"Answer\",
        \"action\": \"accepted\"
      }
    ]
  }" | jq '.'
```

**Oczekiwana odpowiedź (422):**

```json
{
  "error": "Unprocessable Entity",
  "message": "Generation session has already been used to create a flashcard set"
}
```

---

### 7. Test walidacji - generation_session_id bez flashcards (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invalid Set",
    "generation_session_id": 1
  }' | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "flashcards": {
      "_errors": ["When generation_session_id is provided, flashcards array must contain at least one flashcard"]
    }
  }
}
```

---

### 8. Test walidacji - flashcards bez generation_session_id (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invalid Set",
    "flashcards": [
      {
        "temp_id": "test-1",
        "front": "Question",
        "back": "Answer",
        "action": "accepted"
      }
    ]
  }' | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "generation_session_id": {
      "_errors": ["When flashcards are provided, generation_session_id must also be provided"]
    }
  }
}
```

---

### 9. Test walidacji - wszystkie fiszki odrzucone (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "All Rejected",
    "generation_session_id": 1,
    "flashcards": [
      {
        "temp_id": "test-1",
        "front": "Question 1",
        "back": "Answer 1",
        "action": "rejected"
      },
      {
        "temp_id": "test-2",
        "front": "Question 2",
        "back": "Answer 2",
        "action": "rejected"
      }
    ]
  }' | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "flashcards": {
      "_errors": ["At least one flashcard must have action 'accepted' or 'edited'"]
    }
  }
}
```

---

### 10. Test walidacji - front fiszki za długi (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Invalid Flashcard\",
    \"generation_session_id\": 1,
    \"flashcards\": [
      {
        \"temp_id\": \"test-1\",
        \"front\": \"$(python3 -c 'print("Q" * 201)')\",
        \"back\": \"Answer\",
        \"action\": \"accepted\"
      }
    ]
  }" | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "flashcards": {
      "0": {
        "front": {
          "_errors": ["Front must not exceed 200 characters"]
        }
      }
    }
  }
}
```

---

### 11. Test walidacji - nieprawidłowa akcja (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invalid Action",
    "generation_session_id": 1,
    "flashcards": [
      {
        "temp_id": "test-1",
        "front": "Question",
        "back": "Answer",
        "action": "invalid_action"
      }
    ]
  }' | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "flashcards": {
      "0": {
        "action": {
          "_errors": ["Action must be one of: accepted, edited, rejected"]
        }
      }
    }
  }
}
```

---

### 12. Test nieprawidłowego JSON (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d 'invalid json here' | jq '.'
```

**Oczekiwana odpowiedź (400):**

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

---

## Kompleksowy test workflow

### 13. Pełny scenariusz end-to-end z prawdziwymi danymi

```bash
#!/bin/bash

echo "=== KROK 1: Generacja fiszek z AI ==="
GENERATION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "The SOLID principles are five design principles intended to make software designs more understandable, flexible, and maintainable. These principles were introduced by Robert C. Martin and have become fundamental concepts in object-oriented programming. The first principle is Single Responsibility Principle (SRP), which states that a class should have only one reason to change, meaning it should have only one job or responsibility. This makes the code easier to understand and maintain. The second principle is Open/Closed Principle (OCP), which suggests that software entities should be open for extension but closed for modification. This means you should be able to add new functionality without changing existing code. The third principle is Liskov Substitution Principle (LSP), named after Barbara Liskov, which states that objects of a superclass should be replaceable with objects of a subclass without breaking the application. The fourth principle is Interface Segregation Principle (ISP), which states that clients should not be forced to depend on interfaces they do not use. This principle encourages creating smaller, more specific interfaces rather than large, general-purpose ones."
  }')

echo $GENERATION_RESPONSE | jq '.'
GENERATION_ID=$(echo $GENERATION_RESPONSE | jq -r '.generation_session_id')
CANDIDATES=$(echo $GENERATION_RESPONSE | jq -c '.candidates')

echo ""
echo "=== KROK 2: Tworzenie zestawu z akceptacją 3 pierwszych kandydatów ==="

# Wyciągnij pierwsze 3 kandydatów i ustaw im action
FLASHCARD_1=$(echo $CANDIDATES | jq '.[0] | . + {"action": "accepted"}')
FLASHCARD_2=$(echo $CANDIDATES | jq '.[1] | . + {"action": "edited", "was_edited": true}')
FLASHCARD_3=$(echo $CANDIDATES | jq '.[2] | . + {"action": "accepted"}')
FLASHCARD_4=$(echo $CANDIDATES | jq '.[3] | . + {"action": "rejected"}')

CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"SOLID Principles Study Set\",
    \"generation_session_id\": $GENERATION_ID,
    \"flashcards\": [$FLASHCARD_1, $FLASHCARD_2, $FLASHCARD_3, $FLASHCARD_4]
  }")

echo $CREATE_RESPONSE | jq '.'

echo ""
echo "=== SUKCES! Zestaw utworzony ==="
SET_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
CARDS_COUNT=$(echo $CREATE_RESPONSE | jq -r '.cards_count')
ACCEPTANCE_RATE=$(echo $CREATE_RESPONSE | jq -r '.generation_metadata.acceptance_rate')

echo "Set ID: $SET_ID"
echo "Cards Count: $CARDS_COUNT"
echo "Acceptance Rate: $ACCEPTANCE_RATE%"
```

---

## Weryfikacja w bazie danych

Po wykonaniu testów możesz sprawdzić w Supabase:

### Sprawdź utworzone zestawy fiszek:

```sql
SELECT * FROM flashcard_sets ORDER BY created_at DESC LIMIT 5;
```

### Sprawdź fiszki w zestawie:

```sql
SELECT
  fs.title as set_title,
  f.id,
  f.front,
  f.back,
  fp.state,
  fp.due
FROM flashcards f
JOIN flashcard_sets fs ON f.flashcard_set_id = fs.id
LEFT JOIN flashcard_progress fp ON fp.flashcard_id = f.id
WHERE fs.id = 1  -- Zamień na ID swojego zestawu
ORDER BY f.id;
```

### Sprawdź sesje generacji (completed_at powinno być ustawione):

```sql
SELECT
  id,
  generated_count,
  accepted_count,
  completed_at,
  started_at
FROM generation_sessions
ORDER BY started_at DESC
LIMIT 5;
```

### Sprawdź logi systemowe:

```sql
SELECT * FROM system_logs
WHERE message LIKE '%flashcard%'
ORDER BY created_at DESC
LIMIT 10;
```

### Sprawdź liczbę fiszek w zestawach (trigger powinien aktualizować):

```sql
SELECT
  fs.id,
  fs.title,
  fs.cards_count as cached_count,
  COUNT(f.id) as actual_count
FROM flashcard_sets fs
LEFT JOIN flashcards f ON f.flashcard_set_id = fs.id
GROUP BY fs.id, fs.title, fs.cards_count
ORDER BY fs.id;
```

---

## Troubleshooting

### Błąd połączenia:

- Sprawdź czy dev server jest uruchomiony: `npm run dev`
- Sprawdź port: domyślnie `4321` dla Astro

### Błąd 500:

- Sprawdź logi konsoli serwera
- Sprawdź czy zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY` są ustawione
- Sprawdź tabele `system_logs` w bazie danych

### Błąd 404 przy prawidłowym generation_session_id:

- Sprawdź czy sesja istnieje: `SELECT * FROM generation_sessions WHERE id = X;`
- Sprawdź czy mock user ID jest poprawny w bazie danych

### Błąd 422 (session already used):

- To jest oczekiwane zachowanie - sesja może być użyta tylko raz
- Utwórz nową sesję generacji przez `/api/generations`

### cards_count nie zgadza się:

- Sprawdź czy triggery są aktywne w bazie danych
- Triggery: `trigger_flashcards_insert_count`, `trigger_flashcards_delete_count`

### flashcard_progress nie zostały utworzone:

- Sprawdź czy wszystkie fiszki mają odpowiednie rekordy progress
- Powinno być jedno progress na jedną fiszkę (relacja 1:1)
