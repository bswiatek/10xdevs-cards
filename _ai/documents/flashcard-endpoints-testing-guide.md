# API Testing Guide - Flashcard Endpoints

## Authentication Setup

All endpoints require authentication. Include the Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. List Flashcard Sets

```http
GET /api/flashcard-sets?page=1&limit=20&search=javascript&sort=created_at&order=desc
```

**Query Parameters:**

- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20, max 100
- `search` (optional): Search in title or flashcard content
- `sort` (optional): created_at | updated_at | title, default created_at
- `order` (optional): asc | desc, default desc

**Response 200:**

```json
{
  "flashcard_sets": [
    {
      "id": 1,
      "user_id": "uuid",
      "title": "JavaScript Basics",
      "cards_count": 10,
      "due_cards_count": 5,
      "created_at": "2024-10-14T10:00:00Z",
      "updated_at": "2024-10-14T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 50,
    "items_per_page": 20
  }
}
```

### 2. Get Flashcard Set Details

```http
GET /api/flashcard-sets/1
```

**Response 200:**

```json
{
  "id": 1,
  "user_id": "uuid",
  "title": "JavaScript Basics",
  "cards_count": 2,
  "due_cards_count": 2,
  "created_at": "2024-10-14T10:00:00Z",
  "updated_at": "2024-10-14T10:00:00Z",
  "flashcards": [
    {
      "id": 1,
      "flashcard_set_id": 1,
      "front": "What is a closure?",
      "back": "A function that has access to variables in its outer scope",
      "created_at": "2024-10-14T10:00:00Z",
      "updated_at": "2024-10-14T10:00:00Z",
      "progress": {
        "state": "New",
        "due": "2024-10-14T10:00:00Z",
        "reps": 0,
        "lapses": 0
      }
    }
  ]
}
```

### 3. Update Flashcard Set Title

```http
PATCH /api/flashcard-sets/1
Content-Type: application/json

{
  "title": "JavaScript Advanced"
}
```

**Response 200:**

```json
{
  "id": 1,
  "user_id": "uuid",
  "title": "JavaScript Advanced",
  "cards_count": 10,
  "due_cards_count": 5,
  "created_at": "2024-10-14T10:00:00Z",
  "updated_at": "2024-10-14T10:30:00Z"
}
```

### 4. Delete Flashcard Set

```http
DELETE /api/flashcard-sets/1
```

**Response 204:** No content

### 5. Create Flashcard in Set

```http
POST /api/flashcard-sets/1/flashcards
Content-Type: application/json

{
  "front": "What is hoisting?",
  "back": "JavaScript's default behavior of moving declarations to the top"
}
```

**Response 201:**

```json
{
  "id": 2,
  "flashcard_set_id": 1,
  "front": "What is hoisting?",
  "back": "JavaScript's default behavior of moving declarations to the top",
  "created_at": "2024-10-14T10:00:00Z",
  "updated_at": "2024-10-14T10:00:00Z",
  "progress": {
    "id": 2,
    "flashcard_id": 2,
    "state": "New",
    "due": "2024-10-14T10:00:00Z",
    "stability": null,
    "difficulty": null,
    "elapsed_days": null,
    "scheduled_days": null,
    "reps": 0,
    "lapses": 0,
    "last_review": null
  }
}
```

### 6. Update Flashcard

```http
PATCH /api/flashcards/2
Content-Type: application/json

{
  "front": "What is JavaScript hoisting?",
  "back": "JavaScript's default behavior of moving variable and function declarations to the top of their scope"
}
```

**Response 200:**

```json
{
  "id": 2,
  "front": "What is JavaScript hoisting?",
  "back": "JavaScript's default behavior of moving variable and function declarations to the top of their scope",
  "created_at": "2024-10-14T10:00:00Z",
  "updated_at": "2024-10-14T10:15:00Z"
}
```

### 7. Delete Flashcard

```http
DELETE /api/flashcards/2
```

**Response 204:** No content

## Error Responses

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "title": {
      "_errors": ["Title must not exceed 200 characters"]
    }
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Flashcard set not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to create flashcard"
}
```

## Validation Rules

### Flashcard Set Title

- Required
- Trimmed
- 1-200 characters

### Flashcard Front

- Required
- Trimmed
- 1-200 characters

### Flashcard Back

- Required
- Trimmed
- 1-500 characters

### Query Parameters

- `page`: integer >= 1
- `limit`: integer 1-100
- `sort`: one of [created_at, updated_at, title]
- `order`: one of [asc, desc]
- `search`: any string (optional)

## Testing with curl

### Get all sets

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4321/api/flashcard-sets
```

### Create flashcard

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"front":"Test front","back":"Test back"}' \
  http://localhost:4321/api/flashcard-sets/1/flashcards
```

### Update set title

```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Title"}' \
  http://localhost:4321/api/flashcard-sets/1
```

### Delete flashcard

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4321/api/flashcards/1
```
