# Plan implementacji widoku Generowanie fiszek AI

## 1. Przegląd

Widok Generowanie fiszek AI umożliwia wklejenie tekstu źródłowego, walidację długości 1000–10000 znaków oraz uruchomienie procesu generowania kandydatów na fiszki z limitem czasu oczekiwania do 60 sekund zgodnie z PRD i historyjkami US-008/US-009.
Po udanej generacji interfejs przekierowuje do widoku recenzji kandydatów, natomiast w przypadku timeoutu lub niedostępności usługi AI wyświetla jasne, dostępne komunikaty błędów oraz pozwala spróbować ponownie bez utraty wklejonego tekstu (US-009/US-010).

## 2. Routing widoku

Ścieżka widoku: /generate jako część aplikacji dostępna z kontekstu tworzenia nowego zestawu przez wklejenie tekstu, spełniająca wymagania US-008.
Routing realizowany w obrębie Astro + React + TypeScript zgodnie ze stackiem i wzorcami nawigacji aplikacji, z możliwym przekierowaniem do recenzji po sukcesie generacji.

## 3. Struktura komponentów

- GenerateView (/generate) - SourceTextArea - CharCounter - GenerateButton - LoadingOverlay/Spinner - ErrorToast/Banner z Retry - InfoHelper (wskazówki dot. zakresu i sanitizacji)
  .

## 4. Szczegóły komponentów

### GenerateView

- Opis komponentu: Kontener widoku odpowiedzialny za orkiestrację formularza tekstu, walidację, inicjację wywołania POST /api/generations, obsługę stanów ładowania i błędów oraz przekierowanie do recenzji po sukcesie.
- Główne elementy: Sekcja z nagłówkiem, SourceTextArea, CharCounter, GenerateButton, LoadingOverlay oraz ErrorToast/Banner z akcją Spróbuj ponownie.
- Obsługiwane interakcje: onPaste/onInput (aktualizacja licznika), onSubmit (start generacji), onCancelRetry/onDismiss (zamykanie błędu), onSuccess (nawigacja do recenzji).
- Obsługiwana walidacja: Długość tekstu 1000–10000 znaków po sanitizacji, blokada submit poza zakresem, klientowy timeout 60 s w ścisłej zgodności z PRD.
- Typy: GenerateFormVM, GenerateFlashcardsCommand, GenerationSessionDTO, GenerationErrorViewModel.
- Propsy: Brak w MVP; opcjonalnie initialText lub returnPath, jeśli wejście następuje z innego przepływu.

### SourceTextArea

- Opis komponentu: Kontrolowany textarea do wklejenia i edycji tekstu źródłowego z natychmiastową sanitacją i wsparciem dostępności.
- Główne elementy: label, textarea, aria-describedby dla komunikatów, atrybuty a11y i wskazówki o zakresie 1000–10000 znaków.
- Obsługiwane interakcje: onChange/onPaste (sanityzacja → aktualizacja stanu i licznika), onBlur (opcjonalna walidacja).
- Obsługiwana walidacja: Długość po sanitizacji, informacja o błędzie przy zbyt krótkim lub zbyt długim tekście zgodnie z US-008.
- Typy: część GenerateFormVM (sourceText, charCount, isValidLength).
- Propsy: value, onChange, errorMessage?, required.

### CharCounter

- Opis komponentu: Licznik znaków w czasie rzeczywistym wskazujący bieżącą długość i status walidacji.
- Główne elementy: licznik z podpowiedzią zakresu, formatowanie kolorem dla stanów: poniżej minimum, ok, powyżej maksimum.
- Obsługiwane interakcje: Brak bezpośrednich, reaguje na zmiany wartości z rodzica.
- Obsługiwana walidacja: Wskaźnik tylko-prezentacyjny zgodny z limitem 1000–10000.
- Typy: count: number, isValid: boolean (pochodne GenerateFormVM).
- Propsy: count, min=1000, max=10000, isValid.

### GenerateButton

- Opis komponentu: Przycisk „Generuj fiszki” aktywny tylko przy poprawnej długości i braku trwającej operacji.
- Główne elementy: button type="submit" z disabled przy niepoprawnej długości lub isSubmitting oraz z etykietą dostępną dla czytników.
- Obsługiwane interakcje: onClick → submit generacji, focus/keyboard (Enter/Space).
- Obsługiwana walidacja: Blokada oparte na isValidLength oraz stanie ładowania.
- Typy: część GenerateFormVM (canSubmit, isSubmitting).
- Propsy: disabled, loading.

### LoadingOverlay/Spinner

- Opis komponentu: Pełnoekranowy lub sekcyjny wskaźnik ładowania bez progresu na czas generacji do 60 s.
- Główne elementy: aria-busy, role="status", tekst dla a11y, blokada interakcji z formularzem.
- Obsługiwane interakcje: Brak, sterowany stanem isSubmitting.
- Obsługiwana walidacja: Brak, wyłącznie prezentacja stanu.
- Typy: część GenerateFormVM (isSubmitting).
- Propsy: visible: boolean.

### ErrorToast/Banner

- Opis komponentu: Prezentuje komunikaty o błędach wejścia, timeout i niedostępności usługi AI z możliwością ponowienia.
- Główne elementy: rola alert, treść komunikatu, przycisk „Spróbuj ponownie”, zachowanie tekstu źródłowego po błędzie.
- Obsługiwane interakcje: onDismiss, onRetry (ponowienie żądania bez utraty stanu).
- Obsługiwana walidacja: Brak, pokazuje stan błędu powstały po walidacji lub odpowiedzi/timeout.
- Typy: GenerationErrorViewModel (code, message, timestamp).
- Propsy: error?: GenerationErrorViewModel, onRetry?: () => void.

### InfoHelper

- Opis komponentu: Niewielki blok wskazówek o zakresie długości, braku formatowania i zaleceniach sanitizacji przed wysyłką.
- Główne elementy: tekst informacyjny o limicie 1000–10000 i czasie do 60 s, przypomnienie o tekście czystym.
- Obsługiwane interakcje: Brak.
- Obsługiwana walidacja: Brak.
- Typy: Brak.
- Propsy: Brak.

## 5. Typy

- GenerateFlashcardsCommand - source_text: string
  Komenda żądania POST /api/generations, z walidacją 1000–10000 znaków po stronie API.
- CandidateFlashcardDTO - tempid: string - front: string - back: string
  Pojedynczy kandydat wygenerowany przez AI, używany w ekranie recenzji po udanym procesie.
- GenerationSessionDTO - generationsessionid: number - inputlength: number - candidatesgenerated: number - generationtimems: number - candidates: CandidateFlashcardDTO[] - createdat: string
  Odpowiedź z backendu po sukcesie, przekazywana do widoku recenzji w oparciu o sesję generacji.
- GenerateFormVM - sourceText: string - charCount: number - isValidLength: boolean - isSubmitting: boolean - apiError?: GenerationErrorViewModel - canSubmit: boolean
  Model stanu formularza i interakcji użytkownika w widoku.
- GenerationErrorViewModel - code: 'validation_400' | 'timeout_60s' | 'service_unavailable' | 'network' | 'server_500' | 'unknown' - message: string - timestamp: string
  Ujednolicone odwzorowanie błędów i komunikatów zgodnych z PRD, w tym timeout 60 s i niedostępność usługi.

## 6. Zarządzanie stanem

Stan formularza utrzymywany lokalnie w GenerateView przy użyciu React useState/useReducer dla pól sourceText, charCount, isValidLength, isSubmitting i apiError.
Tekst źródłowy zachowywany w pamięci komponentu oraz opcjonalnie w localStorage podczas błędu, aby spełnić wymaganie „tekst zachowany po błędzie” z US-010.
Custom hook useGenerateForm zapewnia API: setSourceText, submit, resetError, oraz implementuje sanitizację, walidację długości i klientowy timeout 60 s.

## 7. Integracja API

Wywołanie POST /api/generations z body typu GenerateFlashcardsCommand { source_text } i walidacją po stronie API 1000–10000 znaków (Zod schema).
Po sukcesie interfejs otrzymuje GenerationSessionDTO i przekierowuje do widoku recenzji, przekazując generationsessionid i dane kandydatów do dalszego przepływu zapisu zestawu zgodnego z PRD.
MVP endpoint nie wymaga jeszcze autentykacji i zwraca 400 przy błędach walidacji oraz 500 dla błędów wewnętrznych, co należy odwzorować w komunikatach UI oraz przygotować się na dodanie auth później.

## 8. Interakcje użytkownika

- Wklejenie/ wpisanie tekstu w textarea → natychmiastowa sanitizacja i aktualizacja licznika znaków oraz statusu walidacji.
- Przycisk „Generuj fiszki” aktywuje się wyłącznie dla zakresu 1000–10000 znaków i rozpoczyna proces wraz ze wskaźnikiem ładowania bez progresu.
- Po sukcesie następuje przekierowanie do widoku recenzji kandydatów; po błędzie (timeout, niedostępność, 400, 500) wyświetlany jest banner/ toast z możliwością Spróbuj ponownie oraz zachowanym tekstem.

## 9. Warunki i walidacja

- Długość tekstu: 1000–10000 znaków walidowana po stronie klienta i serwera, z informacją o błędzie, gdy tekst jest za krótki lub za długi (US-008).
- Limit czasu: klientowy timeout 60 s, po którym wyświetlany jest komunikat o przekroczeniu czasu (US-009/US-010).
- Sanitizacja: usuwanie potencjalnych znaczników HTML/formatowania, normalizacja białych znaków i kontrola wyliczania długości po sanitizacji zgodnie z ograniczeniami PRD.

## 10. Obsługa błędów

- 400 Bad Request (walidacja): mapowany na komunikat o nieprawidłowej długości lub formacie wejścia, bez potrzeby ponownego wklejania tekstu.
- Timeout 60 s: komunikat o przekroczeniu czasu oczekiwania z przyciskiem Spróbuj ponownie i zachowanym tekstem (US-010).
- Niedostępność usługi AI: komunikat o chwilowej niedostępności oraz wskazanie możliwości ponowienia, z degradacją łagodną zgodnie z PRD.
- 500 Internal Server Error: komunikat o błędzie technicznym i możliwość ponowienia po chwili, z rejestrowaniem błędu w warstwie backendowej zgodnie ze standardem logowania.

## 11. Kroki implementacji

1. Utworzyć trasę /generate i szablon widoku GenerateView zawierający layout, nagłówek oraz placeholdery dla komponentów formularza i błędów.
2. Zaimplementować sanitizację wejścia (np. striptags, normalizacja whitespace) oraz licznik znaków wyliczany po sanitizacji, aktualizowany onInput/onPaste.
3. Dodać walidację klientową zakresu 1000–10000 znaków oraz blokadę przycisku „Generuj fiszki” poza zakresem, z komunikatami inline.
4. Zaimplementować custom hook useGenerateForm zarządzający stanem: sourceText, charCount, isValidLength, isSubmitting, apiError oraz expose: submit, resetError.
5. Dodać wywołanie POST /api/generations z body { source_text }, obsługę stanów ładowania oraz mapowanie odpowiedzi GenerationSessionDTO.
6. Wprowadzić klientowy timeout 60 s otaczający wywołanie API i prezentację komunikatu timeout w ErrorToast/Banner.
7. Zaimplementować ErrorToast/Banner z akcją Spróbuj ponownie oraz logiką zachowania tekstu po błędach, w tym dla 400 i 500.
8. Po sukcesie przekierować do widoku recenzji kandydatów, przekazując generationsessionid i dane do dalszego etapu akceptacji/edycji/odrzucania zgodnie z PRD.
9. Dodać testy: walidacja długości, sanitizacja, aktywacja przycisku, obsługa timeoutu i błędów 400/500, a11y (rola alert, aria-busy, focus management).
10. Zweryfikować zgodność ze stackiem i docelowymi przepływami zapisu zestawu po recenzji (CreateFlashcardSetCommand z generationsessionid + flashcards) dla pełnego end-to-end po generacji.
