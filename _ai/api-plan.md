# REST API Plan

## 1. Resources

- **auth** - Authentication and authorization (Supabase Auth integration)
- **users** - User account management (email: auth.users.email)
- **flashcard-sets** - Collections of flashcards (db: flashcard_sets)
- **flashcards** - Individual flashcard items (db: flashcards)
- **flashcard-progress** - FSRS algorithm tracking data (db: flashcard_progress)
- **generations** - AI flashcard generation sessions (db: generation_sessions)
- **study-sessions** - Learning session tracking (db: study_sessions)
- **study-reviews** - Individual card review responses (db: study_reviews)
- **admin** - Administrative operations (metrics, logs, user management)


## 2. Endpoints

### 2.1 AI Flashcard Generation

#### POST /generations

**Description**: Generate flashcard candidates from input text using AI

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "source_text": "String containing learning material..."
}
```

**Response 201 Created**:

```json
{
  "generation_session_id": 12345,
  "input_length": 5420,
  "candidates_generated": 15,
  "generation_time_ms": 42300,
  "candidates": [
    {
      "temp_id": "cand_001",
      "front": "What is spaced repetition?",
      "back": "A learning technique that involves reviewing information at increasing intervals to improve long-term retention."
    },
    {
      "temp_id": "cand_002",
      "front": "Who developed the FSRS algorithm?",
      "back": "The Free Spaced Repetition Scheduler was developed as an open-source alternative to SuperMemo's SM-2 algorithm."
    }
  ],
  "created_at": "2025-10-08T19:05:30Z"
}
```

**Error Responses**:

- `400 Bad Request`: Text length outside 1000-10000 characters
- `401 Unauthorized`: Invalid or missing token
- `408 Request Timeout`: AI generation exceeded 60 seconds
- `422 Unprocessable Entity`: Invalid source_text format
- `500 Internal Server Error`: OpenRouter API failure
- `503 Service Unavailable`: AI service temporarily unavailable

***

### 2.3 Flashcard Sets

#### GET /flashcard-sets

**Description**: List all flashcard sets owned by authenticated user

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:

- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Items per page (max: 100)
- `search` (optional): Full-text search query for set titles and flashcard content
- `sort` (optional, default: "created_at"): "created_at" | "updated_at" | "title"
- `order` (optional, default: "desc"): "asc" | "desc"

**Response 200 OK**:

```json
{
  "flashcard_sets": [
    {
      "id": 1001,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Introduction to Psychology",
      "cards_count": 25,
      "due_cards_count": 8,
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-08T15:30:00Z"
    },
    {
      "id": 1002,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Spanish Vocabulary - Intermediate",
      "cards_count": 42,
      "due_cards_count": 0,
      "created_at": "2025-09-28T14:20:00Z",
      "updated_at": "2025-10-07T18:45:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 56,
    "items_per_page": 20
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `422 Unprocessable Entity`: Invalid query parameters

***

#### GET /flashcard-sets/:id

**Description**: Get detailed information about specific flashcard set including all flashcards

**Headers**: `Authorization: Bearer {access_token}`

**Response 200 OK**:

```json
{
  "id": 1001,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Introduction to Psychology",
  "cards_count": 25,
  "due_cards_count": 8,
  "created_at": "2025-10-01T10:00:00Z",
  "updated_at": "2025-10-08T15:30:00Z",
  "flashcards": [
    {
      "id": 5001,
      "flashcard_set_id": 1001,
      "front": "What is cognitive dissonance?",
      "back": "The mental discomfort experienced when holding contradictory beliefs or values simultaneously.",
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-01T10:00:00Z",
      "progress": {
        "state": "Review",
        "due": "2025-10-09T10:00:00Z",
        "reps": 3,
        "lapses": 0
      }
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this set
- `404 Not Found`: Flashcard set does not exist

***

#### POST /flashcard-sets

**Description**: Create new flashcard set (from AI generation or manually)

**Headers**: `Authorization: Bearer {access_token}`

**Request Body** (from AI generation):

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

**Request Body** (manual creation - empty set):

```json
{
  "title": "My Custom Flashcard Set"
}
```

**Response 201 Created**:

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

**Error Responses**:

- `400 Bad Request`: Empty title, no flashcards provided, or invalid generation_session_id
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Generation session not found
- `422 Unprocessable Entity`: Validation errors (flashcard length, format)

***

#### PATCH /flashcard-sets/:id

**Description**: Update flashcard set metadata (title only)

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "title": "Updated Psychology Notes"
}
```

**Response 200 OK**:

```json
{
  "id": 1001,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Psychology Notes",
  "cards_count": 25,
  "due_cards_count": 8,
  "created_at": "2025-10-01T10:00:00Z",
  "updated_at": "2025-10-08T19:15:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Empty title
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this set
- `404 Not Found`: Flashcard set does not exist

***

#### DELETE /flashcard-sets/:id

**Description**: Delete flashcard set and all associated flashcards (cascading)

**Headers**: `Authorization: Bearer {access_token}`

**Response 204 No Content**

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this set
- `404 Not Found`: Flashcard set does not exist

***

#### GET /flashcard-sets/:id/due

**Description**: Get flashcards due for review today in specific set

**Headers**: `Authorization: Bearer {access_token}`

**Response 200 OK**:

```json
{
  "flashcard_set_id": 1001,
  "due_cards_count": 8,
  "flashcards": [
    {
      "id": 5001,
      "front": "What is cognitive dissonance?",
      "back": "The mental discomfort experienced when holding contradictory beliefs.",
      "progress": {
        "state": "Review",
        "due": "2025-10-08T10:00:00Z",
        "stability": 12.5,
        "difficulty": 5.8,
        "reps": 3,
        "lapses": 0
      }
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this set
- `404 Not Found`: Flashcard set does not exist

***

### 2.4 Flashcards

#### POST /flashcard-sets/:setId/flashcards

**Description**: Add new flashcard to existing set (manual creation)

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "front": "What is neuroplasticity?",
  "back": "The brain's ability to reorganize itself by forming new neural connections throughout life."
}
```

**Response 201 Created**:

```json
{
  "id": 5026,
  "flashcard_set_id": 1001,
  "front": "What is neuroplasticity?",
  "back": "The brain's ability to reorganize itself by forming new neural connections throughout life.",
  "created_at": "2025-10-08T19:20:00Z",
  "updated_at": "2025-10-08T19:20:00Z",
  "progress": {
    "id": 9026,
    "flashcard_id": 5026,
    "state": "New",
    "due": "2025-10-08T19:20:00Z",
    "reps": 0,
    "lapses": 0
  }
}
```

**Error Responses**:

- `400 Bad Request`: Front or back empty, exceeds length limits (200/500 chars)
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this set
- `404 Not Found`: Flashcard set does not exist
- `422 Unprocessable Entity`: Validation errors

***

#### PATCH /flashcards/:id

**Description**: Update existing flashcard content

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "front": "What is neuroplasticity? (Updated)",
  "back": "The brain's ability to reorganize itself by forming new neural connections throughout life, especially after injury or learning."
}
```

**Response 200 OK**:

```json
{
  "id": 5026,
  "flashcard_set_id": 1001,
  "front": "What is neuroplasticity? (Updated)",
  "back": "The brain's ability to reorganize itself by forming new neural connections throughout life, especially after injury or learning.",
  "created_at": "2025-10-08T19:20:00Z",
  "updated_at": "2025-10-08T19:25:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Front or back empty, exceeds length limits
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this flashcard's set
- `404 Not Found`: Flashcard does not exist
- `422 Unprocessable Entity`: Validation errors

***

#### DELETE /flashcards/:id

**Description**: Delete individual flashcard (preserves set)

**Headers**: `Authorization: Bearer {access_token}`

**Response 204 No Content**

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this flashcard's set
- `404 Not Found`: Flashcard does not exist

***

### 2.5 Study Sessions

#### POST /study-sessions

**Description**: Start new study session for specific flashcard set

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "flashcard_set_id": 1001
}
```

**Response 201 Created**:

```json
{
  "id": 3001,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "flashcard_set_id": 1001,
  "cards_reviewed": 0,
  "average_rating": null,
  "duration_seconds": null,
  "started_at": "2025-10-08T19:30:00Z",
  "completed_at": null,
  "due_flashcards": [
    {
      "id": 5001,
      "front": "What is cognitive dissonance?",
      "back": "The mental discomfort experienced when holding contradictory beliefs.",
      "progress": {
        "state": "Review",
        "due": "2025-10-08T10:00:00Z"
      }
    }
  ]
}
```

**Error Responses**:

- `400 Bad Request`: No flashcards due for review in this set
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this set
- `404 Not Found`: Flashcard set does not exist

***

#### POST /study-sessions/:id/reviews

**Description**: Submit rating for individual flashcard during study session

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "flashcard_id": 5001,
  "rating": 4,
  "response_time_ms": 3200
}
```

**Response 201 Created**:

```json
{
  "id": 7001,
  "study_session_id": 3001,
  "flashcard_id": 5001,
  "rating": 4,
  "response_time_ms": 3200,
  "reviewed_at": "2025-10-08T19:31:15Z",
  "updated_progress": {
    "flashcard_id": 5001,
    "state": "Review",
    "due": "2025-10-12T19:31:15Z",
    "stability": 15.2,
    "difficulty": 5.3,
    "reps": 4,
    "lapses": 0
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid rating (must be 1-5), flashcard not due in this session
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this session or session already completed
- `404 Not Found`: Study session or flashcard does not exist
- `422 Unprocessable Entity`: Validation errors

***

#### PATCH /study-sessions/:id

**Description**: Update study session (primarily to mark as completed)

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "completed_at": "2025-10-08T19:45:30Z"
}
```

**Response 200 OK**:

```json
{
  "id": 3001,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "flashcard_set_id": 1001,
  "cards_reviewed": 8,
  "average_rating": 3.75,
  "duration_seconds": 930,
  "started_at": "2025-10-08T19:30:00Z",
  "completed_at": "2025-10-08T19:45:30Z"
}
```

**Error Responses**:

- `400 Bad Request`: Session already completed
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this session
- `404 Not Found`: Study session does not exist

***

#### GET /study-sessions/:id

**Description**: Get detailed study session information including all reviews

**Headers**: `Authorization: Bearer {access_token}`

**Response 200 OK**:

```json
{
  "id": 3001,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "flashcard_set_id": 1001,
  "flashcard_set_title": "Introduction to Psychology",
  "cards_reviewed": 8,
  "average_rating": 3.75,
  "duration_seconds": 930,
  "started_at": "2025-10-08T19:30:00Z",
  "completed_at": "2025-10-08T19:45:30Z",
  "reviews": [
    {
      "id": 7001,
      "flashcard_id": 5001,
      "flashcard_front": "What is cognitive dissonance?",
      "rating": 4,
      "response_time_ms": 3200,
      "reviewed_at": "2025-10-08T19:31:15Z"
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User does not own this session
- `404 Not Found`: Study session does not exist

***

#### GET /study-sessions

**Description**: List study sessions for authenticated user

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:

- `flashcard_set_id` (optional): Filter by specific set
- `completed` (optional): "true" | "false" | "all" (default: "all")
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response 200 OK**:

```json
{
  "study_sessions": [
    {
      "id": 3001,
      "flashcard_set_id": 1001,
      "flashcard_set_title": "Introduction to Psychology",
      "cards_reviewed": 8,
      "average_rating": 3.75,
      "duration_seconds": 930,
      "started_at": "2025-10-08T19:30:00Z",
      "completed_at": "2025-10-08T19:45:30Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 94,
    "items_per_page": 20
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `422 Unprocessable Entity`: Invalid query parameters

***

### 2.6 Admin Operations

#### GET /admin/users

**Description**: List all user accounts (admin only)

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:

- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `role` (optional): Filter by "user" | "admin"
- `search` (optional): Search by email

**Response 200 OK**:

```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2025-09-15T10:00:00Z",
      "flashcard_sets_count": 12,
      "total_flashcards": 324
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 8,
    "total_items": 152,
    "items_per_page": 20
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not admin

***

#### PATCH /admin/users/:id/password

**Description**: Reset password for specific user (admin only)

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:

```json
{
  "new_password": "temporaryPassword123"
}
```

**Response 200 OK**:

```json
{
  "message": "Password reset successfully",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "temporary_password": "temporaryPassword123"
}
```

**Error Responses**:

- `400 Bad Request`: Weak password
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not admin
- `404 Not Found`: User does not exist

***

#### DELETE /admin/users/:id

**Description**: Delete user account and all associated data (admin only)

**Headers**: `Authorization: Bearer {access_token}`

**Response 200 OK**:

```json
{
  "message": "User account deleted successfully",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "deleted_data": {
    "flashcard_sets": 12,
    "flashcards": 324,
    "study_sessions": 58,
    "generation_sessions": 15
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not admin or attempting to delete own account
- `404 Not Found`: User does not exist

***

#### GET /admin/metrics/generation-sessions

**Description**: Aggregate analytics on AI generation performance (admin only)

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:

- `start_date` (optional): ISO 8601 date (default: 30 days ago)
- `end_date` (optional): ISO 8601 date (default: today)
- `user_id` (optional): Filter by specific user

**Response 200 OK**:

```json
{
  "date_range": {
    "start": "2025-09-08T00:00:00Z",
    "end": "2025-10-08T23:59:59Z"
  },
  "total_sessions": 1243,
  "metrics": {
    "average_input_length": 5842,
    "average_candidates_generated": 14.2,
    "average_generation_time_ms": 38420,
    "average_acceptance_rate": 76.5,
    "total_candidates_generated": 17652,
    "total_candidates_accepted": 10234,
    "total_candidates_rejected": 4018,
    "total_candidates_edited": 3400
  },
  "performance_breakdown": {
    "under_30s": 420,
    "30s_to_45s": 612,
    "45s_to_60s": 189,
    "timeout_errors": 22
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not admin
- `422 Unprocessable Entity`: Invalid date range

***

#### GET /admin/logs

**Description**: View system logs (admin only)

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:

- `log_level` (optional): "INFO" | "WARNING" | "ERROR"
- `event_type` (optional): Filter by specific event type
- `user_id` (optional): Filter by specific user
- `start_date` (optional): ISO 8601 date
- `end_date` (optional): ISO 8601 date
- `search` (optional): Full-text search in message
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page (max: 200)

**Response 200 OK**:

```json
{
  "logs": [
    {
      "id": 98765,
      "log_level": "ERROR",
      "event_type": "ai_generation_failed",
      "message": "OpenRouter API timeout after 60 seconds",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "metadata": {
        "input_length": 8420,
        "model": "gpt-4o",
        "error_code": "TIMEOUT"
      },
      "created_at": "2025-10-08T14:22:35Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 42,
    "total_items": 2087,
    "items_per_page": 50
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not admin
- `422 Unprocessable Entity`: Invalid query parameters

***

## 3. Authentication and Authorization

### Authentication Mechanism

The API uses **JWT (JSON Web Token)** authentication provided by **Supabase Auth**. All protected endpoints require a valid access token in the Authorization header.

**Token Format**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```


### Token Lifecycle

- **Access Token Expiration**: 3600 seconds (1 hour)
- **Refresh Token**: Provided by Supabase Auth (handled client-side)
- **Session Management**: Tokens are stateless; sessions invalidated on logout


### Authorization Levels

1. **Unauthenticated**: Access to `/auth/register` and `/auth/login` only
2. **Authenticated User** (role: "user"):
    - Full CRUD on own flashcard_sets, flashcards, study_sessions
    - Read-only access to own generation_sessions
    - Can update own password via `/auth/password`
3. **Administrator** (role: "admin"):
    - All user permissions
    - Access to `/admin/*` endpoints
    - Can view all users' data (filtered by RLS policies)
    - Can reset passwords and delete user accounts
    - Read-only access to system_logs

### Row Level Security (RLS)

All database operations are automatically filtered by **Supabase RLS policies**:

- Users can only access resources where `user_id = auth.uid()`
- Administrators bypass restrictions via `is_admin()` function
- Cascading deletes ensure data integrity (deleting set removes flashcards, progress, etc.)


### Security Headers

All responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```


***

## 4. Validation and Business Logic

### Validation Rules

#### Flashcard Content

- **front**: Required, max 200 characters (enforced by DB CHECK constraint)
- **back**: Required, max 500 characters (enforced by DB CHECK constraint)
- Validated on: `POST /generations`, `POST /flashcard-sets`, `POST /flashcard-sets/:id/flashcards`, `PATCH /flashcards/:id`


#### AI Generation Input

- **source_text**: Required, 1000-10000 characters
- **ai_model**: Optional, must be "gpt-4o" or "claude-3.5-sonnet"
- **Timeout**: API calls to OpenRouter must return within 60 seconds or fail with 408
- Validated on: `POST /generations`


#### Study Session Ratings

- **rating**: Required integer, 1-5 inclusive (enforced by DB CHECK constraint)
- **response_time_ms**: Optional positive integer
- Validated on: `POST /study-sessions/:id/reviews`


#### User Registration

- **email**: Required, valid RFC 5322 format, unique (enforced by Supabase Auth and DB UNIQUE constraint)
- **password**: Required, minimum 8 characters (Supabase Auth default)
- **password_confirmation**: Must match password
- Validated on: `POST /auth/register`


#### Pagination

- **page**: Positive integer (default: 1)
- **limit**: Positive integer, max 100 for most endpoints, max 200 for admin logs (default: 20)
- Validated on: All list endpoints
