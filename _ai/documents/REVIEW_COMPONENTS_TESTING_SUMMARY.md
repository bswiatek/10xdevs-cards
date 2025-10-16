# Dokumentacja testów jednostkowych - CandidateCard & CandidateList

**Data utworzenia:** 2025-01-15  
**Autor:** AI Assistant  
**Pliki testowe:**

- `src/components/review/CandidateCard.test.tsx`
- `src/components/review/CandidateList.test.tsx`

---

## 📊 Statystyki pokrycia testami

### CandidateCard.test.tsx

- **53 testy** - wszystkie ✅ PASSED
- **Kategorie testów:** 9
- **Czas wykonania:** ~1.7s

### CandidateList.test.tsx

- **40 testów** - wszystkie ✅ PASSED
- **Kategorie testów:** 9
- **Czas wykonania:** ~2.2s

### Łącznie

- **93 testy jednostkowe**
- **100% przejścia**
- **Całkowity czas:** ~3.9s

---

## 🎯 Zakres testów - CandidateCard

### 1. Basic Rendering (8 testów)

**Co testujemy:**

- ✅ Renderowanie tekstu front/back
- ✅ Renderowanie etykiet "Przód" i "Tył"
- ✅ Zachowanie białych znaków (whitespace-pre-wrap)
- ✅ Obsługa bardzo długich tekstów (500+ znaków)
- ✅ Obsługa pustych stringów
- ✅ Obsługa znaków specjalnych i HTML entities

**Dlaczego ważne:**

- Zapewnia poprawne wyświetlanie treści użytkownika
- Zabezpiecza przed XSS
- Testuje edge cases (puste wartości, długie teksty)

---

### 2. State-Based Rendering (19 testów)

#### PENDING State (4 testy)

- ✅ Wyświetlanie 3 przycisków akcji (Akceptuj, Edytuj, Odrzuć)
- ✅ Brak przycisku Cofnij
- ✅ Brak wskaźnika statusu
- ✅ Domyślny border styling

#### ACCEPTED State (4 testy)

- ✅ Wyświetlanie tylko przycisku Cofnij
- ✅ Wskaźnik "Zaakceptowano" z checkmarkiem
- ✅ Zielony border i tło (border-green-500, bg-green-50)
- ✅ Brak wskaźnika "Odrzucono"

#### EDITED State (4 testy)

- ✅ Wyświetlanie tylko przycisku Cofnij
- ✅ Wskaźnik "Zaakceptowano" (traktowane jak accepted)
- ✅ Zielony styling
- ✅ Kalkulacja isAccepted = true dla edited

#### REJECTED State (4 testy)

- ✅ Wyświetlanie tylko przycisku Cofnij
- ✅ Wskaźnik "Odrzucono" z ikoną X
- ✅ Czerwony border, tło + opacity-60
- ✅ Brak wskaźnika "Zaakceptowano"

**Kluczowa logika biznesowa:**

```typescript
const isAccepted = candidate.action === "accepted" || candidate.action === "edited";
const isRejected = candidate.action === "rejected";
const isPending = candidate.action === "pending";
```

---

### 3. 'Edytowano' Badge (4 testy)

- ✅ Wyświetlanie badge gdy `wasEdited = true`
- ✅ Ukrywanie badge gdy `wasEdited = false`
- ✅ Badge widoczny dla wszystkich stanów akcji
- ✅ Poprawny styling (rounded-full, bg-blue-100)

**Regułą biznesową:**
Badge "Edytowano" sygnalizuje użytkownikowi, że treść fiszki została przez niego zmodyfikowana względem oryginalnej propozycji AI.

---

### 4. Callback Invocations (13 testów)

#### onAccept (3 testy)

- ✅ Wywołanie z poprawnym `id`
- ✅ Nie wywołuje innych callbacks
- ✅ Można wywołać wielokrotnie

#### onReject (2 testy)

- ✅ Wywołanie z poprawnym `id`
- ✅ Izolacja od innych callbacks

#### onEditStart (3 testy)

- ✅ Wywołanie z **pełnym obiektem candidate**
- ✅ Przekazywanie wszystkich properties (w tym errors)
- ✅ Izolacja od innych callbacks

#### onUndo (4 testy)

- ✅ Wywołanie dla accepted state
- ✅ Wywołanie dla rejected state
- ✅ Wywołanie dla edited state
- ✅ **NIE** wywoływalne dla pending state

**Krytyczny kontrakt:**

- Accept/Reject/Undo otrzymują tylko `id: string`
- EditStart otrzymuje **cały obiekt** `candidate: ReviewCandidateVM`

---

### 5. Edge Cases (6 testów)

- ✅ Undefined errors field
- ✅ Candidate z zdefiniowanym errors object
- ✅ Minimalny candidate object
- ✅ Szybkie przejścia stanów (rapid state transitions)
- ✅ Zachowanie referencji callbacks przez re-renders

---

### 6. Accessibility (4 testy)

- ✅ Przyciski z poprawnym role="button"
- ✅ Accessible names dla wszystkich przycisków
- ✅ Semantyczna struktura HTML
- ✅ Undo button accessible name

---

### 7. Integration Scenarios (4 testy)

- ✅ Pełny workflow akceptacji (pending → accepted)
- ✅ Pełny workflow odrzucenia (pending → rejected)
- ✅ Pełny workflow edycji (pending → edited z wasEdited badge)
- ✅ Workflow cofnięcia (accepted → pending)

**Symulacja rzeczywistego użycia:**
Testy integration scenarios weryfikują całe ścieżki użytkownika, sprawdzając zmiany stanu i UI.

---

## 🎯 Zakres testów - CandidateList

### 1. Empty State (5 testów)

- ✅ Renderowanie komunikatu gdy `candidates.length === 0`
- ✅ Styling kontenera (min-h-[400px], border-dashed)
- ✅ Brak grid gdy pusta lista
- ✅ Brak wywołań callbacks
- ✅ Przejście do empty state po usunięciu wszystkich

**Komunikat użytkownikowi:**

```
"Brak kandydatów do recenzji"
"Wszystkie fiszki zostały już przetworzone"
```

---

### 2. List Rendering (7 testów)

- ✅ Renderowanie grid container
- ✅ Responsive grid classes (1/2/3/4 kolumny)
- ✅ Poprawna liczba CandidateCard
- ✅ Single candidate
- ✅ Multiple candidates z różnymi stanami
- ✅ Duża liczba kandidatów (50+)
- ✅ Brak empty state gdy istnieją candidates

**Responsywność:**

```css
grid-cols-1           /* mobile */
md:grid-cols-2        /* tablet */
lg:grid-cols-3        /* desktop */
xl:grid-cols-4        /* large desktop */
```

---

### 3. Props Forwarding (6 testów)

- ✅ Forward onAccept do wszystkich dzieci
- ✅ Forward onReject do wszystkich dzieci
- ✅ Forward onEditStart z pełnym obiektem
- ✅ Forward onUndo do accepted/rejected cards
- ✅ Przekazywanie pełnych candidate objects

**Kluczowe:**
CandidateList jest "dumb component" - tylko przekazuje props bez modyfikacji.

---

### 4. Key Prop & List Updates (6 testów)

- ✅ Użycie `candidate.id` jako key
- ✅ Dodawanie candidates do listy
- ✅ Usuwanie candidates z listy
- ✅ Zmiany stanu pojedynczych candidates
- ✅ Pełna wymiana listy
- ✅ React reconciliation działa poprawnie

**Pattern:**

```tsx
{
  candidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} {...callbacks} />);
}
```

---

### 5. Callback Isolation (3 testy)

- ✅ Kliknięcie jednej karty nie wpływa na inne
- ✅ Multiple callbacks na różnych kartach
- ✅ Prawidłowe przekazywanie candidate objects

**Zasada:**
Każda karta ma własną instancję callbacks z closure na swój `candidate.id`.

---

### 6. Edge Cases (7 testów)

- ✅ Przejście z empty do populated list
- ✅ Duplikaty contentu, unikalne ID
- ✅ Znaki specjalne w ID
- ✅ Wszystkie candidates non-pending
- ✅ Obronna obsługa undefined/null
- ✅ Zachowanie referencji callbacks
- ✅ Performance z dużą ilością danych

---

### 7. Integration Scenarios (4 testy)

- ✅ Symulacja pełnej recenzji (accept/reject wszystkich)
- ✅ Workflow edycji w kontekście listy
- ✅ Mieszane stany wielu candidates
- ✅ Szybkie zmiany stanu bez błędów

**Real-world test:**
Test "reviewing all candidates to completion" symuluje rzeczywisty przepływ użytkownika przeglądającego wszystkie fiszki.

---

### 8. Accessibility (3 testy)

- ✅ Dostępna struktura grid layout
- ✅ Accessible empty state message
- ✅ Keyboard navigation (wszystkie przyciski focusable)

---

### 9. Performance (2 testy)

- ✅ Renderowanie 100 items < 1000ms
- ✅ Re-render z update < 100ms

---

## 🔍 Kluczowe reguły biznesowe przetestowane

### 1. Stan akcji (FlashcardActionType)

```typescript
type FlashcardActionType = "accepted" | "edited" | "rejected";
// plus "pending" w UI
```

**Logika:**

- `pending` → 3 przyciski akcji (Accept, Edit, Reject)
- `accepted` | `edited` → przycisk Undo + zielony wskaźnik
- `rejected` → przycisk Undo + czerwony wskaźnik

### 2. Flaga wasEdited

```typescript
wasEdited: boolean;
```

**Logika:**

- Wyświetla badge "Edytowano" niezależnie od stanu akcji
- Informuje o modyfikacji treści przez użytkownika

### 3. Callbacks contract

```typescript
onAccept: (id: string) => void
onReject: (id: string) => void
onUndo: (id: string) => void
onEditStart: (candidate: ReviewCandidateVM) => void  // ⚠️ cały obiekt!
```

### 4. Empty state boundary

```typescript
if (candidates.length === 0) {
  // Pokaż komunikat "Brak kandydatów"
} else {
  // Renderuj grid z kartami
}
```

### 5. Visual feedback

- **Green** (accepted/edited): `border-green-500`, `bg-green-50`
- **Red** (rejected): `border-red-500`, `bg-red-50`, `opacity-60`
- **Default** (pending): `border-border`

---

## 🛠️ Technologie i narzędzia

### Testing Stack

```json
{
  "vitest": "^3.2.4",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "@testing-library/jest-dom": "^6.9.1",
  "jsdom": "^27.0.0"
}
```

### Vitest Best Practices użyte

✅ `vi.fn()` dla function mocks  
✅ `vi.clearAllMocks()` w `beforeEach`  
✅ `userEvent.setup()` dla user interactions  
✅ Descriptive `describe` blocks  
✅ Arrange-Act-Assert pattern  
✅ Type-safe mocks  
✅ Performance.now() dla performance tests

### Testing Library Queries

- `screen.getByText()` - single match
- `screen.getAllByText()` - multiple matches
- `screen.getByRole()` - semantic queries
- `screen.queryByText()` - nullable queries
- `expect().toBeInTheDocument()` - visibility
- `expect().toHaveLength()` - count assertions

---

## 📈 Coverage areas

### ✅ Przetestowane

- [ ] Renderowanie UI
- [ ] Logika warunkowa stanów
- [ ] Wywołania callbacks
- [ ] Props forwarding
- [ ] Edge cases
- [ ] Accessibility basics
- [ ] Integration workflows
- [ ] Performance (basic)

### ❌ NIE przetestowane (celowo)

- Tailwind CSS styling (visual regression)
- Shadcn/ui components (external lib)
- Lucide icons (external lib)
- Responsywność grid (e2e test)
- Animacje transitions (visual test)

---

## 🚀 Uruchamianie testów

### Wszystkie testy review components

```bash
npm run test -- src/components/review/
```

### Pojedynczy plik

```bash
npm run test -- src/components/review/CandidateCard.test.tsx
```

### Watch mode (development)

```bash
npm run test:watch -- src/components/review/
```

### Coverage report

```bash
npm run test:coverage -- src/components/review/
```

### UI mode (debug)

```bash
npm run test:ui
```

---

## 🔧 Maintenance

### Kiedy aktualizować testy?

1. **Zmiana UI logic** - dodanie nowego stanu, przycisku, warunku
2. **Zmiana typu ReviewCandidateVM** - nowe pola, zmiana typów
3. **Zmiana callbacks signature** - inne parametry, nowe callbacki
4. **Nowe edge cases** - odkrycie bugów w produkcji

### Red flags 🚨

- Test suite > 5s - rozważ optymalizację
- Flaky tests - sprawdź async operations
- False positives - zbyt szeroki selector
- False negatives - zbyt wąski assertion

---

## 📚 Dalsza lektura

- [Vitest Guidelines](_ai/rules/vitest.mdc)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [Review View Implementation](_ai/documents/view-review-implementation-status.md)

---

## ✅ Checklist code review

Przed merge do main sprawdź:

- [ ] Wszystkie testy przechodzą (93/93 ✅)
- [ ] Brak warnings w konsoli
- [ ] Coverage thresholds spełnione (70%+)
- [ ] Testy są czytelne i maintainable
- [ ] Edge cases pokryte
- [ ] Integration scenarios działają
- [ ] Performance tests w granicach normy
- [ ] Dokumentacja zaktualizowana

---

**Status:** ✅ COMPLETE  
**Ostatnia weryfikacja:** 2025-01-15 15:19  
**Wynik:** 93/93 testy PASSED (100%)
