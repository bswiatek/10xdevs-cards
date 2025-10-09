# Przykłady testowania endpointa POST /api/generations

## Wymagania wstępne
1. Uruchom dev server: `npm run dev`
2. Server powinien działać na `http://localhost:4321` (domyślny port Astro)
3. Upewnij się, że połączenie z Supabase jest skonfigurowane

---

## 1. Test poprawnego żądania (201 Created)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers and companies. React allows developers to create large web applications that can update and render efficiently in response to data changes. The main concept behind React is the component-based architecture, where the UI is divided into independent, reusable pieces called components. Each component manages its own state and can be composed together to build complex user interfaces. React uses a virtual DOM to optimize rendering performance by minimizing direct manipulation of the actual DOM. This approach makes React applications fast and responsive. React also introduced JSX, a syntax extension that allows you to write HTML-like code within JavaScript, making the code more readable and easier to write."
  }'
```

**Oczekiwana odpowiedź (201):**
```json
{
  "generation_session_id": 1,
  "input_length": 1023,
  "candidates_generated": 5,
  "generation_time_ms": 123,
  "candidates": [
    {
      "temp_id": "uuid-here",
      "front": "Mock Question 1: What is the key concept from the source text?",
      "back": "Mock Answer 1: This is a generated answer based on the provided text..."
    }
  ],
  "created_at": "2025-10-09T12:34:56.789Z"
}
```

---

## 2. Test z ładnie sformatowanym outputem (użyj jq)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing to JavaScript, which helps catch errors early during development. TypeScript code is transpiled to JavaScript, allowing it to run anywhere JavaScript runs. The type system in TypeScript is structural, meaning that types are compatible based on their structure rather than explicit declarations. TypeScript supports modern JavaScript features and adds additional capabilities like interfaces, enums, and generics. Many popular frameworks and libraries, including Angular and React, have excellent TypeScript support. The TypeScript compiler can catch many common programming errors before runtime, improving code quality and developer productivity. TypeScript also provides excellent tooling support with features like autocompletion, refactoring, and inline documentation in modern IDEs."
  }' | jq '.'
```

---

## 3. Test walidacji - tekst za krótki (400 Bad Request)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "This text is way too short to generate flashcards."
  }' | jq '.'
```

**Oczekiwana odpowiedź (400):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "source_text": {
      "_errors": [
        "Source text must be at least 1000 characters"
      ]
    }
  }
}
```

---

## 4. Test walidacji - tekst za długi (400 Bad Request)

Wygeneruj tekst powyżej 10000 znaków:

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"$(python3 -c 'print("A" * 10001)')\"
  }" | jq '.'
```

**Oczekiwana odpowiedź (400):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": [],
    "source_text": {
      "_errors": [
        "Source text must not exceed 10000 characters"
      ]
    }
  }
}
```

---

## 5. Test nieprawidłowego JSON (400 Bad Request)

```bash
curl -X POST http://localhost:4321/api/generations \
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

## 6. Test braku pola source_text (400 Bad Request)

```bash
curl -X POST http://localhost:4321/api/generations \
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
    "source_text": {
      "_errors": [
        "Required"
      ]
    }
  }
}
```

---

## 7. Test z długim tekstem (granica dolna - 1000 znaków)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"$(python3 -c 'print("A" * 1000)')\"
  }" | jq '.'
```

Powinno zwrócić **201 Created** z wygenerowanymi fiszkami.

---

## 8. Test z pełnym przykładowym tekstem edukacyjnym

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq '.'
{
  "source_text": "The SOLID principles are five design principles intended to make software designs more understandable, flexible, and maintainable. These principles were introduced by Robert C. Martin and have become fundamental concepts in object-oriented programming. The first principle is Single Responsibility Principle (SRP), which states that a class should have only one reason to change, meaning it should have only one job or responsibility. This makes the code easier to understand and maintain. The second principle is Open/Closed Principle (OCP), which suggests that software entities should be open for extension but closed for modification. This means you should be able to add new functionality without changing existing code. The third principle is Liskov Substitution Principle (LSP), named after Barbara Liskov, which states that objects of a superclass should be replaceable with objects of a subclass without breaking the application. The fourth principle is Interface Segregation Principle (ISP), which states that clients should not be forced to depend on interfaces they do not use. This principle encourages creating smaller, more specific interfaces rather than large, general-purpose ones. The fifth and final principle is Dependency Inversion Principle (DIP), which suggests that high-level modules should not depend on low-level modules, but both should depend on abstractions. Additionally, abstractions should not depend on details, but details should depend on abstractions. These principles work together to create more modular, testable, and maintainable code. When applied correctly, they help developers create systems that are easier to extend and modify over time."
}
EOF
```

---

## Weryfikacja w bazie danych

Po wykonaniu testów możesz sprawdzić w Supabase:

### Sprawdź zapisane sesje generowania:
```sql
SELECT * FROM generation_sessions ORDER BY started_at DESC LIMIT 5;
```

### Sprawdź logi systemowe:
```sql
SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 10;
```

---

## Troubleshooting

### Błąd połączenia:
- Sprawdź czy dev server jest uruchomiony: `npm run dev`
- Sprawdź port: domyślnie `4321`, ale może być inny

### Błąd 500:
- Sprawdź logi konsoli serwera
- Sprawdź czy zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY` są ustawione
- Sprawdź tabele `system_logs` w bazie danych

### Timeout:
- Mock AI powinien działać natychmiastowo
- Jeśli wystąpi timeout, sprawdź połączenie z bazą danych
