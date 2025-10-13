# auth-spec.md

## Cel i zakres

Celem jest wdrożenie pełnego modułu rejestracji, logowania, wylogowania oraz odzyskiwania hasła w aplikacji Generator Fiszek AI z PRD, bez dodawania weryfikacji email ani powiadomień i z utrzymaniem sesji tokenowej oraz ról użytkownik/administrator, zgodnie z zakresem MVP oraz ograniczeniami bezpieczeństwa i kosztów wskazanymi w dokumentach projektowych i stacku. 
Rozwiązanie musi współdziałać z istniejącymi funkcjami generowania, recenzji kandydatów, tworzenia zestawów i systemem nauki FSRS, zachowując prosty, responsywny interfejs oraz nie zaburzając przepływów użytkownika i admina przewidzianych w PRD, przy SSR Astro i integracji React Islands. 

## Założenia wyjściowe

- Stack: Astro 5 + React + TypeScript + Tailwind CSS, z Supabase jako backendem auth i bazy, oraz Node adapterem w trybie standalone (SSR), zgodnie z tech-stack i astro.config.mjs . 
- PRD określa: rejestracja (email, hasło, brak weryfikacji email), logowanie (email + hasło), brak „Zapamiętaj mnie”, sesja przez token, role użytkownik i administrator, oraz operacje admina na kontach (reset hasła i usuwanie kont) . 

---

## 1. Architektura interfejsu użytkownika

### 1.1 Layouty i nawigacja

- Non-auth layout: układ główny aplikacji dla zalogowanych, obejmujący nawigację do listy zestawów, nauki i zarządzania, z widocznym przyciskiem „Wyloguj” na wszystkich widokach, aby spełnić US-003 oraz wymóg stałej dostępności akcji wylogowania . 
- Auth layout: uproszczony układ dla stron rejestracji/logowania/odzyskiwania hasła, bez elementów aplikacji zależnych od sesji, aby uniknąć przecieków stanu i zapewnić jednoznaczne CTA do logowania/rejestracji . 

### 1.2 Strony Astro i odpowiedzialności

- /login (Astro page + React component LoginForm): formularz email/hasło, walidacja i komunikaty, po sukcesie przekierowanie do głównego widoku (lista zestawów), z błędami ogólnymi przy niepoprawnych danych bez ujawniania, który element jest błędny, zgodnie z PRD . 
- /register (Astro page + React component RegisterForm): email, hasło, potwierdzenie hasła, walidacja email (RFC 5322) i zgodności haseł, po sukcesie auto-logowanie i komunikat sukcesu, bez weryfikacji email, zgodnie z PRD . 
- /forgot-password (Astro page + React component ForgotPasswordRequestForm): w związku z brakiem e-mail/powiadomień w MVP, strona przyjmuje email i składa „prośbę o reset” do panelu admina zamiast wysyłki linku, z komunikatem o trybie ręcznym przez administratora, spójnie z US-005 . 
- /account/password (Astro page + React component ChangePasswordForm): zmiana hasła dla zalogowanego użytkownika z wymaganiem podania starego hasła, nowego i potwierdzenia, z unieważnieniem wszystkich sesji po zmianie, zgodnie z US-004 . 
- /admin/users (Astro page + React table + actions): lista użytkowników dla administratora z akcjami „Resetuj hasło” i „Usuń konto”, z dialogami potwierdzenia i logowaniem operacji zgodnie z US-005 i US-006 . 

### 1.3 Komponenty React (client-side)

- LoginForm.tsx: kontrolowany formularz z polami email/hasło, walidacja i obsługa submit, stany: idle/loading/success/error, komunikaty w standardzie „niepoprawne dane logowania” bez precyzowania, co jest błędne . 
- RegisterForm.tsx: kontrolowany formularz z email/hasło/potwierdzenie, walidacja RFC 5322/zgodność haseł/min. 8 znaków, po sukcesie automatyczny sign-in zgodnie z PRD i feedback . 
- ForgotPasswordRequestForm.tsx: pojedyncze pole email i submit do utworzenia „prośby o reset” do obsługi admina, z informacją o ręcznym procesie z powodu braku e-mail/powiadomień w MVP . 
- ChangePasswordForm.tsx: pola stare hasło/nowe/confirm, walidacja i re-auth sprawdzeniem starego hasła przed aktualizacją, po sukcesie komunikat i wymuszenie ponownego logowania (invalidation) . 
- AdminUsersTable.tsx i AdminUserRow.tsx: tabela z danymi użytkowników, akcje „Resetuj hasło” (generuje tymczasowe hasło i wyświetla do przekazania) i „Usuń konto” z potwierdzeniem i konsekwencjami kaskadowymi dla danych . 

### 1.4 Rozdzielenie odpowiedzialności: Astro vs React

- Strony Astro odpowiadają za SSR, ochronę dostępu (redirecty), dostarczanie layoutów i wstępnych danych minimalnych (np. status sesji), a React obsługuje interakcje formularzy, walidacje i wywołania akcji do API/Supabase, zgodnie z charakterem Astro + React Islands . 
- SSR wykorzystuje Node adapter i output: "server" z astro.config.mjs dla wczesnych redirectów przy braku sesji lub przy próbie wejścia na /login już zalogowanym, co upraszcza UX i bezpieczeństwo ścieżek . 

### 1.5 Walidacje i komunikaty

- Email: RFC 5322 po stronie klienta i serwera, z komunikatem „Nieprawidłowy format email” i blokadą submit do czasu poprawy, zgodnie z kryteriami akceptacji rejestracji . 
- Hasło: minimalnie 8 znaków przy zmianie hasła, z potwierdzeniem zgodności w rejestracji i zmianie hasła; ogólne komunikaty przy błędach logowania bez rozróżniania email/hasło z powodów bezpieczeństwa . 
- Timeout i utrata połączenia: standardowy spinner i komunikaty z PRD („Utracono połączenie...” podczas krytycznych żądań), zachowanie danych formularza przy błędach . 

### 1.6 Kluczowe scenariusze UI

- Rejestracja: wypełnienie email/hasło/potwierdzenie → walidacja w locie → submit → auto-logowanie → przekierowanie na widok główny i komunikat sukcesu, bez weryfikacji email . 
- Logowanie: wypełnienie email/hasło → submit → przekierowanie do listy zestawów → przy błędzie neutralny komunikat i pozostanie na stronie logowania . 
- Wylogowanie: kliknięcie „Wyloguj” obecne w każdym widoku → usunięcie sesji → redirect na /login i komunikat potwierdzający . 
- Zmiana hasła: formularz z weryfikacją starego hasła → aktualizacja → unieważnienie sesji → wymuszenie ponownego logowania . 
- Zapomniane hasło: prośba na /forgot-password → pojawia się zadanie w panelu admina → admin generuje hasło tymczasowe i przekazuje je offline → użytkownik loguje się i zmienia hasło . 

---

## 2. Logika backendowa

### 2.1 Modele danych

- auth.users: wbudowany model Supabase Auth dla kont, wykorzystywany do logowania/zarządzania sesją zgodnie z wymaganiami tokenowej sesji bez „Zapamiętaj mnie” .
- password_reset_requests: id, email, status (pending/fulfilled/canceled), created_at, processed_by, processed_at; wykorzystywana do manualnego procesu odzyskiwania zgodnie z brakiem e-mail/powiadomień . 

### 2.2 Endpointy API

- POST /api/auth/register: walidacja email/hasło/confirm → Supabase signUp → w PRD brak weryfikacji email, więc w konfiguracji projektu Supabase confirm email wyłączony, co umożliwia natychmiastowe logowanie po rejestracji . 
- POST /api/auth/login: walidacja email/hasło → Supabase signInWithPassword → ustawienie sesji w cookies zgodnie z mechaniką tokenową i SSR . 
- POST /api/auth/logout: zakończenie sesji i czyszczenie cookies, z idempotencją na wypadek braku bieżącej sesji, zgodnie z US-003 . 
- POST /api/auth/change-password: re-auth poprzez signInWithPassword ze starym hasłem → jeśli OK, update password → unieważnienie wszystkich sesji, co PRD wymaga po zmianie hasła . 
- POST /api/auth/forgot-password: przyjęcie email → utworzenie rekordu password_reset_requests (pending) → powrót komunikatu o ręcznej obsłudze, bez wysyłek email . 
- GET /api/admin/users: wymaga roli admin, zwraca listę użytkowników z minimalnymi polami do UI, dla US-005/006 . 
- POST /api/admin/users/:id/reset-password: wymaga admin, generuje losowe tymczasowe hasło, aktualizuje je przez Admin API Supabase (service role) i unieważnia sesje tego użytkownika, zwracając tymczasowe hasło do wyświetlenia administratorowi, zgodnie z PRD . 
- DELETE /api/admin/users/:id: wymaga admin, usuwa konto przez Admin API i kaskadowo usuwa dane domenowe (zestawy, fiszki, postępy), zgodnie z US-006 . 

### 2.3 Walidacja danych wejściowych

- Po stronie API stosowana jest spójna walidacja schematów (np. RFC 5322 dla email, min. długości haseł, wymagane pola), identyczna logicznie jak na froncie w celu uniknięcia rozbieżności i spełnienia kryteriów akceptacji . 
- Błędy walidacji zwracają kod 400 i komunikaty nadające się do wyświetlenia, bez ujawniania wrażliwych szczegółów przy próbach logowania lub enumeracji kont . 

### 2.4 Obsługa wyjątków i błędów

- Czasowe błędy sieci i utrata połączenia skutkują komunikatami zgodnymi z PRD oraz możliwością ponowienia akcji bez utraty danych formularza, co minimalizuje frustrację użytkownika . 
- Operacje admina są logowane (czas, admin, użytkownik, wynik), aby spełnić wymagania audytu działań administracyjnych w US-005/006 . 

### 2.5 SSR i renderowanie po stronie serwera

- Dzięki astro.config.mjs (output: "server", adapter node standalone) strony chronione wykonują kontrolę sesji na serwerze i wykonują szybkie redirecty 302 do /login, jeśli brak sesji, co utrzymuje spójny UX i bezpieczeństwo . 
- Strony auth (login/register/forgot-password) wykonują redirect na widok główny, jeżeli sesja już istnieje, aby uniknąć zbędnych ekranów dla zalogowanych, co jest zgodne z charakterem SSR w tym projekcie . 

---

## 3. System autentykacji (Supabase Auth + Astro)

### 3.1 Rejestracja

- Wymagane pola: email, hasło, potwierdzenie hasła; system waliduje RFC 5322 i zgodność haseł, a następnie tworzy konto i automatycznie loguje użytkownika bez weryfikacji email, co jest wprost wymagane w PRD . 
- Po sukcesie wyświetlany jest komunikat o powodzeniu i przekierowanie na główny widok (lista zestawów), zgodnie z kryteriami akceptacji . 

### 3.2 Logowanie i sesje

- Logowanie: email + hasło, po sukcesie tokenowa sesja utrzymywana w cookies, bez opcji „Zapamiętaj mnie”, z neutralnym komunikatem przy błędzie, zgodnie z PRD . 
- Sesja: przechowywana jako token (Supabase) i używana do SSR guardów oraz do nadawania uprawnień dla stron i API, co jest spójne ze stackiem i konfiguracją . 

### 3.3 Wylogowanie

- Przycisk „Wyloguj” jest obecny na wszystkich widokach, a akcja usuwa sesję i przekierowuje na /login z komunikatem potwierdzającym, zgodnie z US-003 . 
- Po wylogowaniu dostęp do zasobów chronionych skutkuje redirectem na /login, co jest wymagane w kryteriach akceptacji . 

### 3.4 Zmiana hasła (własne konto)

- Formularz: stare hasło, nowe hasło (min. 8 znaków), potwierdzenie; walidacja zgodności i re-auth sprawdzający poprawność starego hasła, zgodnie z US-004 . 
- Po sukcesie unieważniane są wszystkie sesje i wymagane jest ponowne logowanie, co jest wyraźnym wymaganiem PRD . 

### 3.5 Odzyskiwanie hasła (brak e-mail/powiadomień)

- Dla niezalogowanego: strona „Zapomniałem hasła” zapisuje prośbę dla admina, zgodnie z ograniczeniami PRD (brak powiadomień email/push) i procesem ręcznym z US-005 . 
- Dla admina: akcja „Resetuj hasło” generuje tymczasowe hasło, unieważnia wszystkie sesje i prezentuje hasło do przekazania użytkownikowi innym kanałem, co spełnia wymagania US-005 . 

### 3.6 Role i uprawnienia

- Role: user i admin, gdzie admin posiada dodatkowe uprawnienia do resetu haseł i usuwania kont, zgodnie z PRD . 
- RLS i ochrony aplikacyjne: ograniczenie dostępu do panelu admina i endpointów admina wyłącznie dla roli admin, a operacje na zasobach użytkownika tylko dla właściciela . 

---

## 4. Kontrakty, komponenty i moduły

### 4.1 Moduły frontend

- components/auth/LoginForm.tsx: props: onSuccess, onError; zdarzenia: submit(email, password) . 
- components/auth/RegisterForm.tsx: props: onSuccess, onError; zdarzenia: submit(email, password, confirm) . 
- components/auth/ForgotPasswordRequestForm.tsx: props: onSuccess, onError; zdarzenia: submit(email) . 
- components/account/ChangePasswordForm.tsx: props: onSuccess, onError; zdarzenia: submit(oldPassword, newPassword, confirm) . 
- components/admin/AdminUsersTable.tsx: props: users, onResetPassword(userId), onDeleteUser(userId); zdarzenia: reset, delete . 

### 4.2 Moduły backend (API)

- POST /api/auth/register: body { email, password, confirm } → 201 { userId } lub 400/409 . 
- POST /api/auth/login: body { email, password } → 200 { session } lub 401 . 
- POST /api/auth/logout: body {} → 204 . 
- POST /api/auth/change-password: body { oldPassword, newPassword, confirm } → 204 lub 400/401 . 
- POST /api/auth/forgot-password: body { email } → 202 { requestId } . 
- GET /api/admin/users: query { page, q? } → 200 { users[] } . 
- POST /api/admin/users/:id/reset-password: body {} → 200 { tempPassword } . 
- DELETE /api/admin/users/:id: body {} → 204 . 

### 4.3 Walidacja i błędy

- Walidatory wspólne (shared): emailRFC5322, passwordMin8, confirmEquals, z mapowaniem błędów na kody i komunikaty bezpieczne w UI, zgodnie z kryteriami PRD . 
- Błędy logowania zawsze komunikowane ogólnie, bez wskazania, który składnik danych jest błędny, aby nie ułatwiać enumeracji . 

---

## 5. SSR, middleware i ochrona tras

### 5.1 Middleware

- src/middleware.ts: dla tras chronionych sprawdza sesję Supabase w cookie (SSR) i jeśli brak, redirect 302 do /login, co jest możliwe dzięki output: "server" i node adapterowi . 
- Dla tras auth, jeśli sesja istnieje, redirect 302 do głównego widoku, aby nie pokazywać formularzy auth zalogowanym . 

### 5.2 Integracja Supabase z SSR

- Wykorzystanie klientów SSR Supabase do odczytu/zapisu sesji w kontekście serwera Astro i do podpisywania ciasteczek zgodnie z mechaniką tokenów sesji, co wspiera spójne redirecty i ochronę . 
- API admin używa service role klucza po stronie serwera (nigdy w kliencie) dla resetów haseł i usuwania kont, zgodnie ze scenariuszami administracyjnymi . 

---

## 6. Scenariusze końcowe i edge cases

- Rejestracja: duplikat email → 409 i komunikat o istniejącym koncie, bez ujawniania szczegółów technicznych, pozostając w ramach wymagań walidacji . 
- Logowanie: błędne dane → 401 z ogólnym komunikatem, zgodnie z kryteriami bezpieczeństwa PRD . 
- Zmiana hasła: błędne stare hasło → 401, brak aktualizacji i komunikat „Nieprawidłowe stare hasło” oraz brak wycieku dodatkowych informacji . 
- Offline/timeout: zachowanie danych formularza i możliwość „Spróbuj ponownie”, spójnie z polityką UX błędów w PRD . 

---

## 7. Zgodność z PRD i stackiem

- Brak weryfikacji email, brak powiadomień email/push i brak „Zapamiętaj mnie” są zachowane, a odzyskiwanie hasła jest zrealizowane przez ścieżkę admina i stronę „prośby o reset” bez wysyłek, zgodnie z zakresem MVP . 
- System ról user/admin, akcje resetu hasła i usuwania konta oraz logowanie tych operacji są zaplanowane zgodnie z US-005/006, łącznie z unieważnianiem sesji . 
- Wykorzystanie Astro + React + Tailwind z Supabase i Node adapterem SSR jest spójne z tech-stack i astro.config.mjs, zapewniając szybkie MVP i server-side redirecty . 

---
