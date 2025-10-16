# Analiza złożoności komponentów - AI Detective Report

**Data analizy:** 2025-10-16  
**Zakres:** Komponenty w katalogu `src/components/`  
**Cel:** Identyfikacja plików o wysokiej złożoności i propozycje refaktoryzacji

---

## TOP 5 plików o największej liczbie LOC (pliki produkcyjne)

| #   | Ścieżka                                          | LOC | Potencjalna złożoność |
| --- | ------------------------------------------------ | --- | --------------------- |
| 1   | `src/components/dashboard/AddFlashcardModal.tsx` | 283 | ⚠️ Wysoka             |
| 2   | `src/components/hooks/useReviewSession.ts`       | 236 | ⚠️ Wysoka             |
| 3   | `src/components/account/ChangePasswordForm.tsx`  | 217 | ⚠️ Wysoka             |
| 4   | `src/components/SetDetailsView.tsx`              | 204 | ⚠️ Średnia            |
| 5   | `src/components/auth/RegisterForm.tsx`           | 198 | ⚠️ Wysoka             |

---

## 1. AddFlashcardModal.tsx (283 LOC)

### Identyfikowane problemy

- ❌ Komponent zawiera zbyt wiele odpowiedzialności (zarządzanie formularzem, walidację, logikę biznesową API)
- ❌ Duża liczba stanów lokalnych (7 useState)
- ❌ Długa funkcja `handleSubmit` z zagnieżdżoną logiką (linie 97-135)
- ❌ Powtarzalne wzorce w obsłudze pól formularza
- ❌ Brak separacji warstw (prezentacja + logika biznesowa w jednym komponencie)

### Proponowane kierunki refaktoryzacji

#### a) Extract Custom Hook - Compound Pattern

Wydziel logikę formularza do dedykowanego hooka `useAddFlashcardForm`:

```typescript
// src/components/hooks/useAddFlashcardForm.ts
const useAddFlashcardForm = (availableSets, onSuccess, onClose) => {
  // Zarządzanie stanem, walidacją i submitem
  return {
    state: { mode, selectedSetId, newSetTitle, front, back, isSaving },
    handlers: { handleSubmit, handleModeChange, handleTitleChange },
    validators: { flashcardValidation, titleValidation },
  };
};
```

#### b) Strategy Pattern dla trybów

Rozdziel logikę tworzenia zestawu od dodawania fiszki:

```typescript
const strategies = {
  existing: {
    validate: (selectedSetId) => !!selectedSetId,
    submit: async (setId, flashcard) => {
      /* ... */
    },
  },
  new: {
    validate: (title) => titleValidation.validate(title),
    submit: async (title, flashcard) => {
      /* ... */
    },
  },
};
```

#### c) Component Composition

Podziel na mniejsze komponenty:

- `ModeSelector` - wybór trybu (existing/new)
- `SetSelectionField` - dropdown wyboru zestawu
- `NewSetTitleField` - pole tytułu nowego zestawu
- `FlashcardInputFields` - pola front/back z walidacją
- `FlashcardPreview` - podgląd fiszki

#### d) Form Library Integration

Rozważ użycie **React Hook Form** dla uproszczenia zarządzania formularzem i walidacji z integracją Zod.

### Korzyści refaktoryzacji

- ✅ Zmniejszenie LOC o ~40%
- ✅ Lepsze testowanie (unit testy dla hooka, snapshot dla UI)
- ✅ Zwiększona reużywalność komponentów
- ✅ Separacja odpowiedzialności (SRP)
- ✅ Łatwiejsza konserwacja

---

## 2. useReviewSession.ts (236 LOC)

### Identyfikowane problemy

- ❌ Hook ma zbyt wiele odpowiedzialności (zarządzanie stanem, licznikami, modalami)
- ❌ 10+ funkcji zwracanych w API hooka (zbyt szeroki interfejs)
- ❌ Obliczanie liczników przy każdej zmianie (potencjalny problem wydajności)
- ❌ Mieszanie logiki biznesowej z zarządzaniem UI state (modals)

### Proponowane kierunki refaktoryzacji

#### a) Reducer Pattern zamiast useState

Użyj `useReducer` dla lepszego zarządzania złożonym stanem:

```typescript
type ReviewAction =
  | { type: "ACCEPT_CANDIDATE"; candidateId: string }
  | { type: "REJECT_CANDIDATE"; candidateId: string }
  | { type: "UNDO_CANDIDATE"; candidateId: string }
  | { type: "EDIT_CANDIDATE"; candidateId: string; front: string; back: string }
  | { type: "OPEN_EDIT_MODAL"; candidateId: string }
  | { type: "CLOSE_EDIT_MODAL" };

const reviewReducer = (state: ReviewState, action: ReviewAction): ReviewState => {
  switch (action.type) {
    case "ACCEPT_CANDIDATE":
      return {
        ...state,
        candidates: state.candidates.map((c) => (c.id === action.candidateId ? { ...c, action: "accepted" } : c)),
      };
    // ...
  }
};
```

#### b) Facade Pattern - rozbicie na mniejsze hooki

```typescript
// Separacja odpowiedzialności
const useReviewState = () => {
  /* zarządzanie kandydatami */
};
const useReviewCounters = (candidates) => {
  /* memoizowane liczniki */
};
const useReviewModals = () => {
  /* stan modali */
};

// Główny hook jako fasada
export const useReviewSession = (sessionId, initialSession) => {
  const state = useReviewState(initialSession);
  const counters = useReviewCounters(state.candidates);
  const modals = useReviewModals();

  return { state, counters, modals };
};
```

#### c) Memoization Optimization

Użyj `useMemo` dla liczników aby uniknąć przeliczania:

```typescript
const counters = useMemo(() => {
  let accepted = 0,
    rejected = 0,
    remaining = 0;
  for (const candidate of candidates) {
    if (candidate.action === "accepted" || candidate.action === "edited") accepted++;
    else if (candidate.action === "rejected") rejected++;
    else remaining++;
  }
  return { accepted, rejected, remaining };
}, [candidates]);
```

#### d) Selectors Pattern

Wydziel funkcje selekcji do osobnego modułu:

```typescript
// src/lib/selectors/review-selectors.ts
export const reviewSelectors = {
  getAcceptedCandidates: (candidates) => candidates.filter((c) => c.action === "accepted" || c.action === "edited"),
  getPendingCandidates: (candidates) => candidates.filter((c) => c.action === "pending"),
  getCandidateById: (candidates, id) => candidates.find((c) => c.id === id),
};
```

### Korzyści refaktoryzacji

- ✅ Lepsze performance (memoization)
- ✅ Łatwiejsze testowanie (małe, izolowane hooki)
- ✅ Modułowość i separacja logiki biznesowej
- ✅ Zgodność z React best practices (useReducer dla complex state)
- ✅ Przewidywalny przepływ danych

---

## 3. ChangePasswordForm.tsx (217 LOC)

### Identyfikowane problemy

- ❌ Mieszanie logiki walidacji, stanu formularza i prezentacji
- ❌ Powtarzalne wzorce w JSX (3x Input z podobną konfiguracją)
- ❌ Duża ilość boilerplate kodu (validation, error handling)
- ❌ Logika walidacji inline w komponencie (zamiast używać istniejących schematów Zod)
- ❌ Brak reużywalnych komponentów dla pól formularza

### Proponowane kierunki refaktoryzacji

#### a) Reużywalny komponent PasswordField

```typescript
// src/components/forms/PasswordField.tsx
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PasswordField = ({
  id, label, value, onChange, error, ...props
}: PasswordFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">
      {label} {props.required && <span className="text-destructive">*</span>}
    </label>
    <Input
      id={id}
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
    {error && (
      <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
        {error}
      </p>
    )}
  </div>
);
```

#### b) Wykorzystanie istniejącego Zod Schema

Projekt już ma schemat `changePasswordSchema` w `src/lib/validations/auth.ts`:

```typescript
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";

// Zamiast ręcznej walidacji, użyj Zod
const validateForm = (data: ChangePasswordInput) => {
  const result = changePasswordSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten().fieldErrors;
  }
  return null;
};
```

#### c) Custom Hook dla Form Logic

```typescript
// src/components/hooks/usePasswordChangeForm.ts
const usePasswordChangeForm = () => {
  const [values, setValues] = useState<ChangePasswordInput>({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(values);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }
    // Submit logic
  };

  return { values, errors, handleSubmit, isLoading, setValues };
};
```

#### d) Success State jako osobny komponent

```typescript
// src/components/forms/PasswordChangeSuccess.tsx
export const PasswordChangeSuccess = () => (
  <div className="rounded-md border border-green-500 bg-green-500/10 px-4 py-3">
    <p className="font-medium text-green-700 dark:text-green-400">
      Hasło zostało zmienione
    </p>
    <p className="mt-1 text-sm text-green-700 dark:text-green-400">
      Twoje hasło zostało pomyślnie zaktualizowane.
      Za chwilę zostaniesz przekierowany do strony logowania.
    </p>
  </div>
);
```

### Korzyści refaktoryzacji

- ✅ Redukcja kodu o ~30%
- ✅ Reużywalność komponentów PasswordField
- ✅ Zgodność z wzorcami projektu (Zod validation)
- ✅ Lepsza konserwacja i testowanie
- ✅ Eliminacja duplikacji kodu

---

## 4. SetDetailsView.tsx (204 LOC)

### Identyfikowane problemy

- ❌ Komponent "container" z zbyt dużą ilością logiki orkiestracyjnej
- ❌ 4 stany modalne zarządzane lokalnie (editing, deleting, isDeletingSet, isAddModalOpen)
- ❌ Duża ilość prop drilling do komponentów potomnych
- ❌ Mieszanie logiki API z prezentacją

### Proponowane kierunki refaktoryzacji

#### a) Presenter Pattern

Rozdziel logikę biznesową od prezentacji:

```typescript
// src/components/hooks/useSetDetailsPresenter.ts
const useSetDetailsPresenter = (setId: number) => {
  const { setDetails, isLoading, error, refetch } = useSetDetails(setId);
  const [modals, setModals] = useState({ /* ... */ });

  const handlers = {
    handleDeleteSet: async () => { /* API call */ },
    handleDeleteFlashcard: async (id) => { /* API call */ },
    // ...
  };

  return {
    viewModel: { setDetails, isLoading, error, modals },
    handlers
  };
};

// Component tylko prezentacja
export function SetDetailsView({ setId }: SetDetailsViewProps) {
  const { viewModel, handlers } = useSetDetailsPresenter(setId);
  return <SetDetailsUI {...viewModel} {...handlers} />;
}
```

#### b) Context API dla Modal State

```typescript
// src/components/set-details/SetDetailsContext.tsx
const SetDetailsContext = createContext<SetDetailsContextValue | null>(null);

export const SetDetailsProvider = ({ children, setId }) => {
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState(null);
  // ... centralny stan modali

  return (
    <SetDetailsContext.Provider value={{ /* ... */ }}>
      {children}
    </SetDetailsContext.Provider>
  );
};
```

#### c) Extract Service Layer

Przenieś API calls do serwisu:

```typescript
// src/lib/services/flashcard-service.ts
export const flashcardService = {
  deleteSet: async (setId: number) => {
    const response = await fetch(`/api/flashcard-sets/${setId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete set");
    return response.json();
  },

  deleteFlashcard: async (flashcardId: number) => {
    const response = await fetch(`/api/flashcards/${flashcardId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete flashcard");
    return response.json();
  },
};
```

#### d) Loading/Error jako HOC

```typescript
// src/components/hoc/withLoadingState.tsx
const withLoadingState = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P & { isLoading?: boolean; error?: Error }) => {
    if (props.error) return <ErrorState error={props.error} />;
    if (props.isLoading) return <LoadingState />;
    return <Component {...props} />;
  };
};
```

### Korzyści refaktoryzacji

- ✅ Separacja odpowiedzialności (Presenter Pattern)
- ✅ Łatwiejsze testowanie (logika oddzielona od UI)
- ✅ Reużywalność logiki API (service layer)
- ✅ Lepsze zarządzanie stanem (Context API)
- ✅ Uproszczony main component

---

## 5. RegisterForm.tsx (198 LOC)

### Identyfikowane problemy

- ❌ Bardzo podobny do ChangePasswordForm (DRY violation ~80% podobieństwa)
- ❌ Powtarzalny boilerplate dla pól formularza
- ❌ Inline walidacja zamiast wykorzystania istniejącego Zod schema
- ❌ Brak reużywalności komponentów
- ❌ Duplikacja logiki obsługi błędów

### Proponowane kierunki refaktoryzacji

#### a) Shared Form Components

Utwórz bibliotekę reużywalnych komponentów:

```typescript
// src/components/forms/FormField.tsx
// src/components/forms/EmailField.tsx
// src/components/forms/PasswordField.tsx
// src/components/forms/FormError.tsx

<EmailField
  value={email}
  onChange={setEmail}
  error={validationErrors.email}
/>

<PasswordField
  label="Hasło"
  value={password}
  onChange={setPassword}
  error={validationErrors.password}
  autoComplete="new-password"
/>
```

#### b) Wykorzystanie istniejącego Zod Schema

Projekt już ma `registerSchema` w `src/lib/validations/auth.ts`:

```typescript
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

// Zastąp inline validation
const validateForm = (data: RegisterInput) => {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten().fieldErrors;
  }
  return null;
};
```

#### c) Generic Form Hook

```typescript
// src/components/hooks/useAuthForm.ts
const useAuthForm = <T extends ZodSchema>(schema: T, onSubmit: (data: z.infer<T>) => Promise<void>) => {
  const [values, setValues] = useState<z.infer<T>>({} as z.infer<T>);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(values);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      await onSubmit(result.data);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrors({ form: error.message });
    }
  };

  return { values, errors, status, handleSubmit, setValues };
};
```

#### d) Extract Constants

```typescript
// src/lib/constants/validation.ts
export const PASSWORD_MIN_LENGTH = 8;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: false,
  requireNumber: false,
  requireSpecial: false,
};
```

#### e) Unified Auth Form Component

```typescript
// src/components/forms/AuthForm.tsx
interface AuthFormProps<T> {
  fields: FormFieldConfig[];
  onSubmit: (data: T) => Promise<void>;
  submitLabel: string;
  schema: ZodSchema<T>;
}

export function AuthForm<T>({ fields, onSubmit, submitLabel, schema }: AuthFormProps<T>) {
  const { values, errors, status, handleSubmit, setValues } = useAuthForm(schema, onSubmit);

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(field => (
        <FormField key={field.name} {...field} value={values[field.name]} onChange={...} />
      ))}
      <Button type="submit" disabled={status === 'loading'}>
        {submitLabel}
      </Button>
    </form>
  );
}
```

### Korzyści refaktoryzacji

- ✅ Znacząca redukcja duplikacji kodu między formularzami auth
- ✅ Zgodność z architekturą projektu (Zod schemas w `src/lib/validations`)
- ✅ Lepsze typowanie TypeScript
- ✅ Łatwiejsze utrzymanie (zmiana w jednym miejscu)
- ✅ Reużywalność komponentów w całej aplikacji

---

## Podsumowanie wspólnych wzorców refaktoryzacji

Wszystkie analizowane pliki wymagają podobnych technik optymalizacji:

### 1. Extract Custom Hooks

- Separacja logiki biznesowej od warstwy prezentacji
- Zwiększenie testowalności
- Reużywalność logiki

### 2. Zod Validation

- Wykorzystanie istniejących schematów w `src/lib/validations/`
- Zgodność z tech stack projektu
- Jednolite podejście do walidacji

### 3. Component Composition

- Rozbicie dużych komponentów na mniejsze, reużywalne części
- Principle of Single Responsibility
- Łatwiejsza konserwacja

### 4. Service Layer

- Przeniesienie logiki API do `src/lib/services/`
- Separacja warstw aplikacji
- Łatwiejsze mockowanie w testach

### 5. Reducer Pattern

- Dla złożonego zarządzania stanem
- Przewidywalny przepływ danych
- Łatwiejsze debugowanie

### 6. Memoization

- Optymalizacja wydajności (useMemo, useCallback)
- Unikanie niepotrzebnych re-renderów
- Lepsze performance dla dużych list

---

## Priorytety wdrożenia

### Wysoki priorytet (Quick Wins)

1. ✅ **RegisterForm.tsx i ChangePasswordForm.tsx** - wykorzystanie istniejących Zod schemas, shared components
2. **useReviewSession.ts** - memoization liczników, useReducer

### Średni priorytet

3. **AddFlashcardModal.tsx** - extract custom hook, component composition
4. **SetDetailsView.tsx** - presenter pattern, service layer

### Niski priorytet (Long-term improvements)

5. Wprowadzenie React Hook Form dla wszystkich formularzy
6. Stworzenie Design System dla komponentów formularzy
7. Migracja do Zustand/Redux dla global state management

---

## Metryki sukcesu refaktoryzacji

- 📉 Redukcja LOC o średnio 25-40%
- 🧪 Test coverage zwiększony do >80%
- ⚡ Performance: Reduction w re-renders o ~30%
- 🔄 Reużywalność: Minimum 3 komponenty shared między formularzami
- 📦 Bundle size: Redukcja o ~5-10% dzięki tree-shaking

---

**Status implementacji:** 🟡 W trakcie  
**Ostatnia aktualizacja:** 2025-10-16
