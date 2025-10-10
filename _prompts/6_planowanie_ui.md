## UI Architecture Planning Summary

### Kluczowe Widoki, Ekrany i Przepływy Użytkownika

#### Struktura Routing

**Publiczne ścieżki**:

- `/login` - Formularz logowania (email + hasło)
- `/register` - Formularz rejestracji (email + hasło + potwierdzenie)

**Chronione ścieżki (wymagają autentykacji)**:

- `/` lub `/dashboard` - Lista zestawów fiszek (główny widok po zalogowaniu)
- `/generate` - Formularz generowania fiszek (textarea na tekst źródłowy, 1000-10000 znaków)
- `/review/:generationSessionId` - Recenzja kandydatów na fiszki (lista z akcjami: Akceptuj/Edytuj/Odrzuć)
- `/sets/:id` - Szczegóły zestawu (lista fiszek z paginacją kliencką 20-30 na stronę)
- `/study/:setId` - Sesja nauki (prezentacja fiszek z oceną 1-5)
- `/settings` - Ustawienia konta (zmiana hasła)


#### Przepływy Użytkownika

**Przepływ 1: Generowanie fiszek AI**

1. Użytkownik klika "Nowy zestaw fiszek" → przekierowanie do `/generate`
2. Wkleja tekst (1000-10000 znaków) → licznik znaków w czasie rzeczywistym
3. Klika "Generuj fiszki" → POST do `/generations` → spinner bez progresu
4. Po wygenerowaniu (max 60s) → automatyczne przekierowanie do `/review/:generationSessionId`
5. Recenzja kandydatów w formie listy → Akceptuj/Edytuj/Odrzuć każdego kandydata
6. Edycja przez modal overlay (walidacja 200/500 znaków)
7. Klika "Zapisz zestaw" → modal z polem tytułu → POST do `/flashcard-sets`
8. Przekierowanie do `/` (lista zestawów)

**Obsługa błędów generowania**: timeout >60s lub błąd API → komunikat + przycisk "Spróbuj ponownie" z zachowanym tekstem źródłowym

**Przepływ 2: Manualne tworzenie fiszki**

1. Użytkownik klika "Dodaj fiszkę ręcznie" → modal overlay
2. Formularz: przód (max 200), tył (max 500), dropdown wyboru zestawu (+ opcja "Utwórz nowy")
3. Walidacja długości w czasie rzeczywistym
4. Klika "Zapisz" → POST do `/flashcard-sets/:setId/flashcards`
5. Modal zamyka się, lista zestawów odświeża się

**Przepływ 3: Sesja nauki**

1. Użytkownik klika "Rozpocznij naukę" w widoku zestawu → POST do `/study-sessions`
2. Jeśli `due_cards_count > 0` → przekierowanie do `/study/:setId`
3. Jeśli `due_cards_count = 0` → komunikat "Brak fiszek do powtórzenia dzisiaj"
4. Prezentacja fiszki: przód → przycisk "Pokaż odpowiedź" → tył + 5 przycisków oceny (kolorów 1:czerwony → 5:ciemnozielony)
5. Po ocenie → POST do `/study-sessions/:id/reviews` → automatyczne przejście do kolejnej fiszki
6. Wskaźnik postępu: "Fiszka X z Y" na górze ekranu
7. Opcja "Przerwij sesję" → dialog potwierdzenia → PATCH do `/study-sessions/:id` → przekierowanie do `/`
8. Po ostatniej fiszce → podsumowanie sesji (liczba fiszek, średnia ocena, czas)

**Przepływ 4: Wyszukiwanie i zarządzanie**

1. Lista zestawów na `/` z polem wyszukiwania in-place (min. 3 znaki)
2. GET do `/flashcard-sets?search=...` → filtrowanie w czasie rzeczywistym
3. Zakres: tytuły zestawów + treść fiszek (przód + tył) → podświetlenie wyników
4. Kliknięcie zestawu → przekierowanie do `/sets/:id`
5. Widok szczegółów: tytuł, data utworzenia, liczba fiszek, lista fiszek (paginacja kliencka "Załaduj więcej")
6. Operacje CRUD: Edytuj fiszkę (inline lub modal), Usuń fiszkę (simple confirm dialog)
7. Usuń zestaw (simple confirm dialog) → DELETE do `/flashcard-sets/:id` → przekierowanie do `/`

### Strategia Integracji z API i Zarządzania Stanem

#### Integracja z API (Supabase REST)

**Autentykacja**: JWT tokens via Supabase Auth

- Access token w header: `Authorization: Bearer {token}`
- Expiration: 3600s (1h)
- Refresh token zarządzany przez Supabase client-side

**Row Level Security (RLS)**: Automatyczne filtrowanie zasobów przez `user_id = auth.uid()` na poziomie bazy danych

**Kluczowe endpointy**:

- `POST /generations` - generowanie kandydatów (timeout 60s, error handling 408/500/503)
- `GET /flashcard-sets` - lista zestawów (paginacja, search, sort)
- `GET /flashcard-sets/:id` - szczegóły zestawu + wszystkie fiszki
- `POST /flashcard-sets` - zapis zestawu z kandydatami (validation: min 1 fiszka, tytuł required)
- `GET /flashcard-sets/:id/due` - fiszki do powtórzenia dzisiaj
- `POST /study-sessions` - start sesji nauki
- `POST /study-sessions/:id/reviews` - zapis oceny fiszki (rating 1-5, FSRS update)


#### Zarządzanie Stanem

**State Management**: React Context API + hooks (dla MVP, bez Redux/Zustand)

**Konteksty**:

- `AuthContext` - user session, login/logout, token refresh
- `FlashcardSetsContext` - lista zestawów, cache, search state
- `StudySessionContext` - aktywna sesja, current card index, progress

**Data Fetching**:

- Native `fetch` API z custom hooks (`useFlashcardSets`, `useStudySession`)
- Optymistyczny update dla akcji Akceptuj/Odrzuć podczas recenzji
- Debouncing dla wyszukiwania (300ms delay)

**Error Handling**:

- Global error boundary dla React errors
- API errors: toast notifications z retry button
- Network errors: offline indicator + retry logic
- Validation errors: inline form feedback


### Responsywność, Dostępność i Bezpieczeństwo

#### Responsywność (Mobile-Responsive)

**Breakpointy Tailwind**:

- Mobile (<640px): Single column, hamburger menu, full-width cards
- Tablet (640-1024px): 2-column grid dla list zestawów
- Desktop (>1024px): Sidebar navigation, multi-column layouts

**Kluczowe adaptacje**:

- Textarea generowania: auto-resize na mobile
- Lista kandydatów: vertical stacking przycisków Akceptuj/Edytuj/Odrzuć
- Interfejs nauki: duże przyciski oceny (min 44x44px) dla touch
- Paginacja: "Załaduj więcej" zamiast numerowanych stron na mobile


#### Dostępność

**Wymagania WCAG 2.1 AA**:

```
- Semantic HTML5 (`<nav>`, `<main>`, `<section>`)
```

- ARIA labels dla interaktywnych elementów
- Kontrast kolorów minimum 4.5:1 (oceny nauki: sprawdzić kontrast czerwony/zielony)
- Focus indicators dla keyboard navigation
- Screen reader support dla spinnerów i toast notifications

**Keyboard Navigation**:

- Tab order: logiczny przepływ przez formularze
- Enter/Space dla przycisków
- Escape dla zamykania modali
- Arrow keys dla nawigacji między fiszkami (opcjonalnie)


#### Bezpieczeństwo

**Frontend Security**:

- XSS protection: sanityzacja user input (escape HTML w treści fiszek)
- CSRF: Supabase automatycznie zabezpiecza tokeny
- Secure storage: JWT w httpOnly cookies lub localStorage z encryption
- Input validation: client-side + server-side (długości 200/500, email format)

**Authentication Flow**:

- Brak weryfikacji email w MVP (potencjalne ryzyko spam)
- Password requirements: min 8 znaków (Supabase default)
- Session timeout: 1h access token
- Logout: invalidacja tokenu + redirect do `/login`

**RLS Policies**: Automatyczne zabezpieczenie na poziomie bazy danych - użytkownicy widzą tylko własne zasoby

### Komponenty UI i Wzorce Interakcji

#### Biblioteki UI

**Stack**: Tailwind CSS 4 (utility-first), bez Shadcn/ui w MVP dla uproszczenia

**Custom Components**:

- `Button` - primary/secondary/danger variants, loading state
- `Input` / `Textarea` - z licznikiem znaków, inline validation
- `Modal` - reusable overlay dla edycji kandydata, dodawania fiszki, potwierdzenia usunięcia
- `Card` - dla zestawów fiszek, kandydatów
- `Spinner` - loading indicator (bez progresu w MVP)
- `Toast` - notyfikacje sukcesu/błędu
- `ConfirmDialog` - simple dialog dla usuwania (native confirm lub custom)


#### Wzorce Interakcji

**Generowanie fiszek**:

- Real-time character counter (1000-10000 znaków)
- Disabled state przycisku "Generuj" przy niepoprawnej długości
- Spinner centered na ekranie podczas generowania (max 60s)
- Error state z przyciskiem "Spróbuj ponownie" + zachowany tekst źródłowy

**Recenzja kandydatów**:

- Scrollable lista z kartami kandydatów
- Visual feedback: zielona ramka (zaakceptowany), czerwona ramka (odrzucony)
- Modal edycji: overlay z formularzem, Anuluj/Zapisz
- Liczniki: "X zaakceptowanych, Y odrzuconych, Z pozostało"
- Disabled "Zapisz zestaw" gdy 0 zaakceptowanych + komunikat "Musisz zaakceptować co najmniej jedną fiszkę"
- Przycisk "Rozpocznij ponownie" → powrót do `/generate` z zachowanym tekstem

**Sesja nauki**:

- Centered flashcard z przód/tył transition
- Wskaźnik "Fiszka X z Y" na górze
- 5 przycisków oceny: gradient kolorów (czerwony 1 → zielony 5)
- Przycisk "Przerwij sesję" w rogu → dialog potwierdzenia
- Auto-advance do kolejnej fiszki po ocenie (smooth transition)

**Lista zestawów**:

- Grid layout (responsive: 1/2/3 kolumny)
- Search bar sticky na górze
- In-place filtering z podświetleniem wyników
- Każda karta zestawu: tytuł, data, liczba fiszek, liczba do powtórzenia (badge)
- Hover state: shadow + pointer cursor

**Szczegóły zestawu**:

- Header: tytuł (editable), data, statystyki
- Lista fiszek: paginacja kliencka "Załaduj więcej" (20-30 na raz)
- Każda fiszka: accordion (expand/collapse) lub karty z przód/tył widoczne
- Inline actions: Edytuj (ikona), Usuń (ikona) z confirm dialog


### Obsługa Stanów Błędów i Wyjątków

**Typy błędów z API**:

- `400 Bad Request` - walidacja (długość tekstu, puste pola) → inline error messages
- `401 Unauthorized` - wygasła sesja → redirect do `/login` z komunikatem
- `403 Forbidden` - próba dostępu do cudzego zasobu → error page 403
- `404 Not Found` - nieistniejący zestaw/fiszka → error page 404 lub redirect do `/`
- `408 Request Timeout` - generowanie >60s → komunikat + retry
- `422 Unprocessable Entity` - błąd walidacji → show detailed errors
- `500 Internal Server Error` - problem serwera → generic error message + retry
- `503 Service Unavailable` - OpenRouter down → komunikat o niedostępności AI

**Error UI Patterns**:

- Toast notifications (auto-dismiss 5s) dla success/info
- Persistent error banners dla kritycznych błędów (API down)
- Inline errors dla walidacji formularzy (pod polem)
- Error pages (404, 403, 500) z przyciskiem "Powrót" lub "Spróbuj ponownie"
- Network offline indicator (sticky banner na górze)

**Logging**:

- Błędy zapisywane w bazie danych (tabela `logs`)
- Format: timestamp, log_level (ERROR/WARNING), event_type, message, user_id, metadata
- Dostęp dla administratorów: bezpośrednio z bazy danych (brak panelu admina w MVP)


### Strategie Buforowania i Optymalizacji Wydajności

**Lazy Loading**:

- Paginacja kliencka dla listy fiszek (20-30 na load)
- Intersection Observer dla "Załaduj więcej"
- Code splitting (Astro Islands) dla komponentów React na heavy pages

**Optymalizacja Assets**:

- Tailwind CSS purge unused classes (production build)
- Minifikacja JS/CSS (Astro built-in)
- Font optimization (preload, font-display: swap)
- No images w MVP (tylko tekst)

**Bundle Size Optimization**:

- Astro partial hydration (tylko interaktywne komponenty w React)
- Tree-shaking unused dependencies
- Dynamic imports dla modali i heavy components

</conversation_summary>

## Unresolved Issues

1. **Shadcn/ui Integration** - PRD wspomina o Shadcn/ui w stacku, ale tech-stack.md rekomenduje rezygnację dla uproszczenia MVP. Wymaga ostatecznej decyzji: używać Shadcn/ui components czy custom Tailwind components? 
- Używać Shadcn/ui, tech-stack.md został zaktualizowany
2. **Email Verification** - PRD wyraźnie stwierdza "Brak weryfikacji email" w MVP, ale tech-stack.md ostrzega o krytycznym ryzyku bezpieczeństwa (spam, nadużycia). Czy warto dodać weryfikację pomimo wydłużenia czasu rozwoju o ~1 tydzień?
- Nie dodajemy
3. **Error Recovery dla Generacji** - Co się dzieje z `generation_session_id` po błędzie? Czy można retry z tym samym ID czy trzeba utworzyć nowy? API plan nie definiuje tego scenariusza.
- można retry z tym samym id
4. **Breadcrumb Navigation** - Nie zdefiniowano czy aplikacja powinna mieć breadcrumbs dla nawigacji (szczególnie w flow: lista → szczegóły zestawu → sesja nauki). Czy dodać dla UX?
- tak, powinna mieć
5. **Dark Mode** - PRD wspomina "Brak trybu ciemnego (można dodać w przyszłości)", ale nowoczesne aplikacje edukacyjne często tego wymagają. Czy warto dodać do MVP jeśli nie wydłuży to znacząco rozwoju (Tailwind dark: prefix)?
- na tym etapie nie dodajemy
6. **Pagination Strategy Long-term** - Paginacja kliencka (20-30 fiszek) działa dla MVP, ale GET `/flashcard-sets/:id` zwraca wszystkie fiszki zestawu. Dla zestawów >100 fiszek może być problem wydajnościowy. Czy modyfikować API o server-side pagination dla fiszek?
- obecnie zostawmy paginację tylko na froncie
