# Plan implementacji widoku Logowanie

## 1. Przegląd

Widok Logowanie umożliwia uwierzytelnienie konta za pomocą adresu email i hasła, tworząc sesję opartą na tokenie w celu uzyskania dostępu do chronionych zasobów aplikacji po pomyślnym zalogowaniu.
Formularz obejmuje pola email/hasło, maskowanie hasła, walidację formatu email zgodnie z RFC 5322 oraz bezpieczne, ogólne komunikaty błędów bez ujawniania, który parametr jest niepoprawny, zgodnie z wymaganiami PRD i kryteriami akceptacji historyjki logowania.

## 2. Routing widoku

Ścieżka widoku: /login jako publicznie dostępny ekran wejściowy, z przekierowaniem do głównego widoku po udanym logowaniu oraz przekierowaniem z zasobów chronionych na /login w przypadku braku sesji.
Routing implementowany zgodnie z założonym stosunkiem Astro + React + TypeScript, z rozdzieleniem layoutu publicznego od części aplikacji wymagającej autentykacji użytkownika.

## 3. Struktura komponentów

- LoginView (/login) - LoginForm - EmailInput - PasswordInput - SubmitButton - AuthErrorToast/Banner - RegisterLink
  .

## 4. Szczegóły komponentów

### LoginView

- Opis komponentu: Kontener widoku odpowiedzialny za render formularza logowania oraz obsługę nawigacji po sukcesie i ekspozycję globalnych komunikatów o błędach w standardzie aplikacji.
- Główne elementy: Sekcja z nagłówkiem, komponent LoginForm, miejsce na bannery/toasty błędów, link do rejestracji oraz logika przekierowania po zalogowaniu (np. do listy zestawów fiszek).
- Obsługiwane interakcje: Odbiór zdarzenia onSuccess z LoginForm oraz wywołanie nawigacji do chronionego obszaru aplikacji, a także przechwycenie i prezentacja błędu wysokiego poziomu, jeśli zajdzie.
- Obsługiwana walidacja: Delegowana do LoginForm, ze standardem walidacji email oraz hasła, z zachowaniem bezpieczeństwa komunikatów.
- Typy: LoginResult, AuthErrorViewModel (VM) do transportu stanu błędu na poziomie widoku.
- Propsy: Brak zewnętrznych propów w MVP; ewentualnie initialRedirectPath do wsparcia scenariusza wejścia z zasobu chronionego (przechowywanego w query lub state).

### LoginForm

- Opis komponentu: Formularz kontrolowany z polami email i hasło, maskowaniem hasła, obsługą klawiatury i stanem ładowania, który wywołuje logikę autentykacji oraz emituje wyniki do rodzica.
- Główne elementy:
  - EmailInput typu email z walidacją zgodną z RFC 5322 oraz komunikatami inline.
  - PasswordInput typu password z maskowaniem oraz minimalnym warunkiem niepustości, bez ujawniania detali błędu.
  - SubmitButton z blokadą podczas wysyłki i wskaźnikiem ładowania.
  - AuthErrorToast/Banner z ogólnym komunikatem „Nieprawidłowe dane logowania” bez wskazywania konkretnego pola.
  - RegisterLink do ekranu rejestracji.
- Obsługiwane interakcje: onSubmit (kliknięcie lub Enter), onChange w polach, onDismiss dla toastu błędu oraz onSuccess do rodzica w razie pomyślnego logowania.
- Obsługiwana walidacja:
  - Email: format RFC 5322, spójny z wymogiem PRD dotyczącym walidacji email przy rejestracji i powielony standard na logowaniu.
  - Hasło: wymagane (niepuste), bez ujawniania szczegółów w komunikacie błędu przy nieudanym logowaniu.
  - Błąd autentykacji: prezentacja ogólnego komunikatu bez wskazania czy błąd dotyczy emaila czy hasła.
- Typy: LoginCommand DTO (email, password), LoginFormVM (pola, stany, błędy), AuthErrorCode (np. invalid_credentials, network_error).
- Propsy: onSuccess(result: LoginResult), onError(error: AuthErrorViewModel), disabled?: boolean do ewentualnej blokady zewnętrznej.

### EmailInput

- Opis komponentu: Pola wejściowe email z walidacją natychmiastową i atrybutami ułatwiającymi dostępność oraz wprowadzanie danych.
- Główne elementy: input type="email", label, aria-invalid, aria-describedby, komunikat błędu, podpowiedzi a11y.
- Obsługiwane interakcje: onChange, onBlur, obsługa Enter (delegowana do formularza).
- Obsługiwana walidacja: RFC 5322 format email w pre-submit i/lub onBlur, komunikat inline.
- Typy: FieldError VM (message, field), część LoginFormVM.
- Propsy: value, onChange, error, required.

### PasswordInput

- Opis komponentu: Pole hasła z maskowaniem i atrybutami bezpieczeństwa i dostępności.
- Główne elementy: input type="password", label, aria-\* i ewentualny komunikat błędu przy walidacji wstępnej (np. puste pole).
- Obsługiwane interakcje: onChange, onBlur, Enter (delegowane do formularza).
- Obsługiwana walidacja: wymagane (niepuste), z komunikatem ogólnym przy niepowodzeniu logowania bez wskazywania, który parametr był błędny.
- Typy: FieldError VM, część LoginFormVM.
- Propsy: value, onChange, error, required.

### SubmitButton

- Opis komponentu: Przycisk „Zaloguj” z blokadą i wskaźnikiem ładowania podczas procesu autentykacji.
- Główne elementy: button type="submit", spinner/loader w treści przy stanie isSubmitting.
- Obsługiwane interakcje: onClick (submit), disabled przy isSubmitting lub błędach krytycznych.
- Obsługiwana walidacja: brak własnej, zależny od stanu formularza.
- Typy: część LoginFormVM (isSubmitting).
- Propsy: loading?: boolean, disabled?: boolean.

### AuthErrorToast/Banner

- Opis komponentu: Prezentuje ogólny, bezpieczny komunikat o błędzie logowania lub błędach sieciowych, z możliwością zamknięcia.
- Główne elementy: rola alert, treść komunikatu ogólnego, przycisk zamknięcia, automatyczne focusowanie dla czytników ekranu.
- Obsługiwane interakcje: onDismiss, autoFocus po renderze, zamknięcie klawiszem Escape.
- Obsługiwana walidacja: brak, wyłącznie prezentacja stanu błędu.
- Typy: AuthErrorViewModel (code, message, timestamp).
- Propsy: error?: AuthErrorViewModel, onDismiss?: () => void.

### RegisterLink

- Opis komponentu: Link do rejestracji (np. /register), zgodny z przepływem konta w PRD.
- Główne elementy: element link, atrybuty dostępności, opis słowny.
- Obsługiwane interakcje: kliknięcie i nawigacja klientowa.
- Obsługiwana walidacja: brak.
- Typy: brak dodatkowych.
- Propsy: href?: string (domyślnie /register).

## 5. Typy

- LoginCommand DTO - email: string - password: string
  Używany do wywołania autentykacji po stronie klienta w oparciu o Supabase Auth i tokenową sesję z PRD.
- LoginResult - access_token: string - user_id: string - expires_at: string
  Wartości wykorzystywane do utrzymania sesji i przekierowań po zalogowaniu, zgodnie z „Sesja utrzymywana przez token”.
- LoginFormVM - email: string - password: string - errors: { email?: string; password?: string } - apiError?: AuthErrorViewModel - isSubmitting: boolean - canSubmit: boolean
  Model stanu formularza dla kontrolowanej obsługi walidacji i wysyłki.
- AuthErrorViewModel - code: 'invalid_credentials' | 'network_error' | 'unknown' - message: string - timestamp: string
  Do jednolitej prezentacji bezpiecznych komunikatów o błędzie.
- FieldError - field: 'email' | 'password' - message: string
  Stosowane w komponentach pól dla komunikatów inline.
- Zgodność ze stylem DTO: Projekt typów utrzymany w duchu istniejących DTO z pliku types.ts dla spójności warstw i nazewnictwa.

## 6. Zarządzanie stanem

Stan formularza utrzymywany lokalnie w LoginForm jako kontrolowane pola z useState/useReducer, obejmujący pola, błędy, stan ładowania i błąd API.
Dodatkowy stan sesji użytkownika zarządzany na poziomie aplikacji przez klienta Supabase/Auth i/lub prosty context z dostępem w obszarze chronionym, zgodnie z przyjętym stosem i tokenową sesją z PRD.
Opcjonalny custom hook useLoginForm łączący walidację, integrację z Auth SDK i wygodne API dla komponentu (submit, setField, reset), co upraszcza testy i reużywalność.

## 7. Integracja API

Autentykacja oparta o Supabase Auth SDK po stronie klienta (sign-in z email/hasłem) w ramach stosu technicznego zapewniającego gotową autentykację i sesje tokenowe bez konieczności tworzenia własnego endpointu logowania w MVP.
Obecne endpointy domenowe (np. /api/generations, /api/flashcard-sets) są oznaczone komentarzem, że MVP nie ma jeszcze autentykacji i zostanie dodana później, co wzmacnia decyzję o użyciu natywnego mechanizmu Supabase do logowania i przechowywania sesji.
Typy żądania/odpowiedzi: request LoginCommand { email, password }, odpowiedź LoginResult z tokenem i identyfikatorem użytkownika do zapisania sesji w pamięci klienta/ciasteczku zgodnie z PRD o sesji tokenowej.

## 8. Interakcje użytkownika

- Wprowadzenie email i hasła, z walidacją formatu email oraz wymaganiem niepustości hasła, a następnie zatwierdzenie Enterem lub przyciskiem „Zaloguj”.
- W trakcie wysyłki przycisk jest zablokowany, a formularz może pokazać wskaźnik ładowania zgodnie z UX spinners/toasty przyjętymi w aplikacji.
- Przy nieprawidłowych danych pojawia się ogólny komunikat błędu bez wskazania, który parametr jest niepoprawny, a przy sukcesie następuje przekierowanie do głównego widoku aplikacji.

## 9. Warunki i walidacja

- Email: weryfikacja zgodnie z RFC 5322, spójna z wymaganiami rejestracji w PRD i przyjęta także dla logowania dla jednolitości doświadczenia.
- Hasło: wymagane (niepuste), bez dodatkowej walidacji długości w PRD dla logowania, z komunikatem ogólnym w razie błędu autentykacji.
- Komunikaty: w przypadku błędnych danych logowania prezentowany jest tylko ogólny komunikat bez ujawniania, który element był błędny, zgodnie z kryteriami bezpieczeństwa.

## 10. Obsługa błędów

- Błąd walidacji klienta: komunikaty inline dla email (format) i hasła (wymagane), z blokadą submit do czasu spełnienia warunków.
- Błąd autentykacji: ogólny komunikat „Nieprawidłowe dane logowania”, brak wskazania pola, możliwość ponowienia próby bez czyszczenia pól.
- Błąd sieci/serwera: komunikat o problemach technicznych i zachęta do spróbowania ponownie, bez ujawniania szczegółów wewnętrznych.
- Logowanie błędów: wzorzec logowania stosowany w backendowych endpointach (logError) wskazuje na standard centralnego logowania, który należy rozważyć również dla błędów autentykacji, aby wspierać przeglądanie logów przez administratora zgodnie z PRD.

## 11. Kroki implementacji

1. Utworzyć trasę /login i publiczny layout, który renderuje LoginView oraz nie wymaga sesji użytkownika do wyświetlenia.
2. Zaimplementować LoginView z miejscem na globalny banner/toast, obsługą onSuccess do przekierowania po zalogowaniu oraz linkiem do rejestracji.
3. Zaimplementować LoginForm jako formularz kontrolowany: pola, walidacja (email RFC 5322, hasło wymagane), stan isSubmitting, ogólny błąd API i blokada przycisku podczas wysyłki.
4. Dodać komponenty pól EmailInput i PasswordInput z atrybutami dostępności, komunikatami inline i integracją z VM formularza.
5. Zintegrować z Supabase Auth SDK: zaimplementować funkcję login(email, password) tworzącą sesję tokenową i zwracającą LoginResult, obsługując kody błędów jako AuthErrorViewModel.
6. Dodać AuthErrorToast/Banner z rolą alert i fokusowaniem po błędzie, zgodnie z wymaganiami dostępności.
7. Zaimplementować przekierowanie po sukcesie do głównego widoku aplikacji oraz mechanizm przechwytywania prób wejścia na zasoby chronione bez sesji i odsyłania na /login z powrotem do żądanej ścieżki po zalogowaniu.
8. Przygotować testy jednostkowe walidacji formularza (format email, wymagane hasło), testy integracyjne dla scenariuszy sukcesu, błędnych danych i błędów sieciowych oraz testować dostępność (fokus, role, klawiatura).
9. Zweryfikować spójność z PRD i istniejącym stylem DTO/VM z types.ts oraz upewnić się, że chronione endpointy domenowe zostaną objęte autoryzacją po dodaniu warstwy auth do backendu zgodnie z notą MVP.
