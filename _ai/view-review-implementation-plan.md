# Plan implementacji widoku Recenzja kandydatów[1]

Poniżej znajduje się kompletny plan implementacji widoku Recenzja kandydatów, zgodny z PRD, user stories oraz aktualnymi typami i endpointami w repozytorium projektu.

## 1. Przegląd

Widok Recenzja kandydatów służy do akceptacji, edycji lub odrzucenia kandydatów wygenerowanych przez AI, z podsumowaniem liczników i możliwością zapisania zaakceptowanych/zaedytowanych pozycji jako nowy zestaw fiszek po nadaniu tytułu.
Interfejs ma prezentować listę kandydatów (przód/tył), wspierać walidację 200/500 znaków podczas edycji, zapewniać cofnięcie akcji oraz sygnalizować stany wizualne dla zaakceptowanych i odrzuconych pozycji zgodnie z kryteriami z PRD.

## 2. Routing widoku

Ścieżka: /review/:generationSessionId, gdzie parametr reprezentuje identyfikator sesji generowania zwrócony przez API POST /api/generations, a sam widok zakłada, że dane kandydatów są dostępne po przekierowaniu z kroku generowania zgodnie z PRD US-009.
Jeśli sesja nie jest dostępna w pamięci klienta dla przekazanego :generationSessionId, należy komunikatem poinformować o braku danych i zaoferować powrót do kroku generowania, ponieważ PRD nie przewiduje w MVP powrotu do porzuconej recenzji ani dedykowanego endpointu GET dla sesji.

## 3. Struktura komponentów

- ReviewViewPage: kontener widoku ładowany przez router, pobiera generationSessionId i inicjalizuje stan recenzji.
- ReviewHeader: pasek nagłówka z licznikami zaakceptowanych, odrzuconych i pozostałych oraz przyciskiem Zapisz zestaw.
- CandidateList: przewijalna lista kart kandydata z przodem/tyłem i akcjami Akceptuj, Edytuj, Odrzuć.
- CandidateCard: pojedyncza karta z wizualnymi stanami zaakceptowany/odrzucony, możliwością cofnięcia oraz wywołaniem modala edycji.
- EditCandidateModal: formularz edycji z walidacją 200/500 znaków w czasie rzeczywistym oraz potwierdzeniem edycji.
- SaveSetTitleModal: modal nadania tytułu zestawu przed wysłaniem POST /api/flashcard-sets.
- Toast/Alert: wyświetlanie komunikatów sukcesu i błędów zgodnie z kryteriami akceptacji i obsługą błędów endpointu.

## 4. Szczegóły komponentów

### ReviewViewPage

- Opis: Główny kontener widoku, inicjalizuje stan recenzji na podstawie GenerationSessionDTO i renderuje sekcje listy oraz nagłówek.
- Główne elementy: wrapper layoutu, ReviewHeader, CandidateList, SaveSetTitleModal (kontrolowany), EditCandidateModal (kontrolowany), Toast.
- Obsługiwane interakcje:
  - Inicjalizacja stanu z GenerationSessionDTO po wejściu na widok.
  - Próba zapisu zestawu (otwiera modal tytułu, waliduje warunki i wywołuje API).
  - Obsługa błędów 400/404/422/500 z POST /api/flashcard-sets.
- Obsługiwana walidacja:
  - Blokada zapisu gdy 0 zaakceptowanych/zaedytowanych (UI i weryfikacja przez zod refine po stronie API).
  - Tytuł zestawu 1–200 znaków (UI zgodny ze schematem CreateFlashcardSetSchema).
- Typy:
  - GenerationSessionDTO (wejście), FlashcardCandidateWithActionDTO (do POST), CreateFlashcardSetCommand (payload), CreateFlashcardSetResponseDTO (odpowiedź).
- Propsy:
  - Router param generationSessionId, opcjonalny initialSession (np. z nawigacji po POST /api/generations).

### ReviewHeader

- Opis: Pasek z licznikami zaakceptowanych/odrzuconych/pozostałych oraz przyciskiem Zapisz zestaw (disabled gdy 0 zaakceptowanych).
- Główne elementy: wartości liczników, przycisk Zapisz zestaw, pomocnicze etykiety.
- Obsługiwane interakcje:
  - Klik Zapisz zestaw otwiera SaveSetTitleModal.
- Obsługiwana walidacja:
  - Disabled gdy brak zaakceptowanych/zaedytowanych.
- Typy:
  - CountersVM: accepted, rejected, remaining (pochodne z ReviewState).
- Propsy:
  - counters, onRequestSave().

### CandidateList

- Opis: Lista przewijalna kart kandydatów, prezentująca przód/tył, status i dostępne akcje.
- Główne elementy: kolekcja CandidateCard, pusta lista z komunikatem gdy 0 kandydatów pozostało do decyzji.
- Obsługiwane interakcje:
  - Przekazanie handlerów accept/reject/edit/undo do kart.
- Obsługiwana walidacja:
  - Brak własnej – delegacja do CandidateCard/EditCandidateModal.
- Typy:
  - ReviewCandidateVM[] (opis poniżej), FlashcardActionType.
- Propsy:
  - candidates: ReviewCandidateVM[], onAccept(id), onReject(id), onEditStart(vm), onUndo(id).

### CandidateCard

- Opis: Pojedyncza karta kandydata, pokazuje front/back, statusy wizualne (zielony dla zaakceptowanych, czerwony dla odrzuconych), akcje i cofnięcie.
- Główne elementy: front, back, przyciski Akceptuj/Edytuj/Odrzuć, przycisk Cofnij (gdy zaakceptowany/odrzucony), ramka/status.
- Obsługiwane interakcje:
  - Akceptuj: ustawia action=accepted i zwiększa licznik.
  - Odrzuć: ustawia action=rejected i zwiększa licznik.
  - Edytuj: otwiera EditCandidateModal dla danego kandydata.
  - Cofnij: powrót do stanu pending i aktualizacja liczników.
- Obsługiwana walidacja:
  - Brak własnej – decyzje nie wymagają walidacji treści.
- Typy:
  - ReviewCandidateVM, FlashcardActionType.
- Propsy:
  - candidate: ReviewCandidateVM, onAccept(id), onReject(id), onEditStart(vm), onUndo(id).

### EditCandidateModal

- Opis: Modal edycji treści, zawiera pola front/back, walidację 200/500 znaków w czasie rzeczywistym, po zapisie oznacza kandydata jako edited i wyświetla komunikat.
- Główne elementy: pole textarea front, pole textarea back, liczniki znaków, komunikaty walidacji, przyciski Zapisz/Anuluj.
- Obsługiwane interakcje:
  - Zapis: jeśli walidacja pozytywna, stosuje zmiany, action=edited, was_edited=true, zamyka modal i aktualizuje liczniki.
  - Anuluj: bez zmian stanu kandydata.
- Obsługiwana walidacja:
  - front: 1–200 znaków, back: 1–500 znaków (lokalna walidacja zsynchronizowana ze schematem API).
- Typy:
  - FlashcardCandidateWithActionDTO (mapowanie przy zapisie), ReviewCandidateVM.
- Propsy:
  - isOpen, candidate: ReviewCandidateVM, onSave(updated), onClose().

### SaveSetTitleModal

- Opis: Modal wymagający tytułu zestawu przed wysyłką do POST /api/flashcard-sets, waliduje 1–200 znaków.
- Główne elementy: input tytułu, komunikaty walidacji, przyciski Zapisz/Anuluj.
- Obsługiwane interakcje:
  - Zapis: tworzy CreateFlashcardSetCommand z zaakceptowanych/zaedytowanych kandydatów i wywołuje API.
  - Anuluj: zamyka modal bez akcji.
- Obsługiwana walidacja:
  - Tytuł: 1–200 znaków (zgodnie z CreateFlashcardSetSchema).
- Typy:
  - CreateFlashcardSetCommand, CreateFlashcardSetResponseDTO.
- Propsy:
  - isOpen, acceptedEdited: ReviewCandidateVM[], onSubmitSuccess(resp), onClose().

### Toast/Alert

- Opis: Warstwa powiadomień dla sukcesów i błędów, w tym komunikat sukcesu po zapisie i obsługa błędów 400/404/422/500.
- Główne elementy: kontener toasta, elementy alertów.
- Obsługiwane interakcje:
  - Automatyczne zamykanie po czasie lub manualne zamknięcie.
- Obsługiwana walidacja:
  - Brak – prezentacja wyników walidacji i błędów API.
- Typy:
  - Brak szczególnych poza tekstowymi treściami i kodami błędów.

## 5. Typy

- GenerationSessionDTO: zawiera generation_session_id, candidates i metadane, używany do inicjalizacji stanu widoku.
- CandidateFlashcardDTO: struktura pojedynczego kandydata z temp_id, front, back.
- FlashcardActionType: accepted | edited | rejected, używany do oznaczania decyzji .
- FlashcardCandidateWithActionDTO: temp_id, front, back, action, was_edited?, mapowanie ReviewCandidateVM do payloadu API.
- CreateFlashcardSetCommand: title, generation_session_id, flashcards (wymagane w trybie AI).
- CreateFlashcardSetResponseDTO: zwraca metadane zestawu i generation_metadata (m.in. acceptance_rate).

Nowe ViewModel/DTO dla UI:

- ReviewCandidateVM: { id: string; front: string; back: string; action: 'pending' | FlashcardActionType; wasEdited: boolean; errors?: { front?: string; back?: string } } – bazuje na CandidateFlashcardDTO i FlashcardActionType dla stanu UI .
- ReviewState: { sessionId: number; candidates: ReviewCandidateVM[]; counters: { accepted: number; rejected: number; remaining: number }; isSaving: boolean; titleModalOpen: boolean; editModal: { open: boolean; candidateId?: string } }.
- CreateSetPayloadVM: { title: string; generation_session_id: number; flashcards: FlashcardCandidateWithActionDTO[] } – format pochodny do POST.

## 6. Zarządzanie stanem

Stan lokalny w ReviewViewPage przechowuje ReviewState z inicjalizacją z GenerationSessionDTO, a aktualizacje wynikają z akcji użytkownika (accept/reject/edit/undo) i przeliczają liczniki w O(1) dla wydajności.
Proponowane custom hooki: useReviewSession(sessionId, initialSession?), useCounters(candidates), useEditModal() – izolują logikę transformacji DTO→VM i synchronizacji walidacji z limitem 200/500, co upraszcza komponenty prezentacyjne.

## 7. Integracja API

- Pobranie kandydatów: wynik POST /api/generations zwraca GenerationSessionDTO, z którego pochodzi generation_session_id oraz candidates; widok zakłada dostęp do tych danych po przekierowaniu (brak GET dla sesji w MVP).
- Zapis zestawu: POST /api/flashcard-sets z CreateFlashcardSetCommand wymagającym title, generation_session_id i flashcards z akcją accepted/edited; walidacja zod po stronie serwera egzekwuje min. 1 zaakceptowaną/zaedytowaną fiszkę.
- Obsługa błędów: 400 (walidacja JSON/schemat), 404 (nieistniejąca sesja), 422 (sesja już użyta), 500 (błąd bazy); odpowiadają odpowiednim komunikatom w UI i logice retry tam gdzie ma to sens.

## 8. Interakcje użytkownika

- Akceptuj: karta zmienia status na accepted, ramka zielona, licznik accepted++, remaining--, dostępne Cofnij.
- Odrzuć: karta zmienia status na rejected, ramka czerwona lub ukrycie, licznik rejected++, remaining--, dostępne Cofnij.
- Cofnij: przywraca pending, aktualizuje liczniki zależnie od poprzedniego stanu.
- Edytuj: otwiera modal, waliduje front/back 200/500, po Zapisz ustawia edited + wasEdited=true, licznik edited traktowany jako accepted dla warunków zapisu.
- Zapisz zestaw: dostępne tylko gdy accepted+edited > 0, wymaga tytułu 1–200, po sukcesie toast z liczbą zapisanych i przekierowanie na listę zestawów zgodnie z PRD.

## 9. Warunki i walidacja

- Limity treści: front ≤ 200, back ≤ 500, walidowane w czasie rzeczywistym i spójne z CreateFlashcardSetSchema.
- Minimalny zakres do zapisu: co najmniej jedna fiszka accepted lub edited, egzekwowane w UI i przez zod refine.
- Tytuł zestawu: 1–200 znaków, wymagany przed zapisem.
- Zachowanie sesji: PRD nie przewiduje powrotu do porzuconej recenzji, więc nie zakłada się persystencji decyzji bez finalnego zapisu.

## 10. Obsługa błędów

- 400 Bad Request: pokaż szczegóły walidacji pól (tytuł, front/back) na bazie zwróconych details z API i podświetl odpowiednie kontrolki.
- 404 Not Found: „Sesja generowania nie istnieje” – zaproponuj powrót do ekranu generowania.
- 422 Unprocessable Entity: „Sesja została już użyta” – zaproponuj rozpoczęcie nowej sesji generowania.
- 500 Internal Server Error: ogólny komunikat o błędzie i opcja ponowienia próby zapisu, logi po stronie serwera są już wykonywane.

## 11. Kroki implementacji

1. Utwórz trasę /review/:generationSessionId i kontener ReviewViewPage, który przyjmuje initialSession opcjonalnie z nawigacji po POST /api/generations i w przeciwnym wypadku wyświetla komunikat braku danych.
2. Zaimplementuj mapowanie GenerationSessionDTO.candidates → ReviewCandidateVM[] z action='pending' i wasEdited=false.
3. Zaimplementuj ReviewHeader z licznikami (accepted, rejected, remaining) i przyciskiem Zapisz zestaw (disabled gdy accepted+edited == 0).
4. Zaimplementuj CandidateList oraz CandidateCard z akcjami Akceptuj/Odrzuć/Edytuj/Cofnij i wizualnymi stanami zgodnymi z PRD.
5. Zaimplementuj EditCandidateModal z walidacją front/back 200/500, licznikami znaków i zmianą statusu na edited + wasEdited po Zapisz.
6. Zaimplementuj SaveSetTitleModal z walidacją 1–200 znaków i przygotowaniem CreateFlashcardSetCommand z action accepted/edited oraz generation_session_id.
7. Podłącz wywołanie POST /api/flashcard-sets, obsłuż kody 400/404/422/500 i pokaż stosowne toasty/alerty, po 201 przekieruj na listę zestawów.
8. Dodaj testy jednostkowe logiki walidacji i przeliczania liczników oraz testy e2e dla głównych ścieżek US-011..US-015 (akceptacja, odrzucenie, edycja, zapis).
9. Zapewnij responsywność i zgodność z Tailwind oraz stackiem Astro + React + TypeScript zgodnie z PRD/Tech Stack.
10. Zweryfikuj brak zależności od autentykacji w MVP dla tych endpointów i przygotuj rozszerzenie pod tokeny w przyszłości.

## Drzewo komponentów

```
ReviewViewPage
├─ ReviewHeader
├─ CandidateList
│  ├─ CandidateCard (xN)
│  └─ EmptyState (opcjonalnie)
├─ EditCandidateModal
├─ SaveSetTitleModal
└─ Toast/AlertLayer
```

## 12. Mapowanie user stories

- US-009: Po 201 z POST /api/generations następuje przekierowanie do /review/:generationSessionId i inicjalizacja stanu z GenerationSessionDTO.
- US-011: CandidateList + CandidateCard prezentują pełną listę z przodem/tyłem i akcjami, ReviewHeader zapewnia liczniki.
- US-012: Akceptacja ustawia action=accepted i podbija licznik, karta wyróżniona na zielono, dostępne cofnięcie.
- US-013: Odrzucenie ustawia action=rejected i podbija licznik, karta wyróżniona na czerwono lub ukryta, dostępne cofnięcie.
- US-014: Edycja przez EditCandidateModal z walidacją 200/500, po Zapisz action=edited, komunikat potwierdzenia.
- US-015: SaveSetTitleModal wymaga tytułu, POST /api/flashcard-sets tworzy zestaw z wyłącznie accepted/edited, pokazuje komunikat sukcesu i przekierowuje na listę zestawów.

## 13. Wymagane wywołania API i akcje frontendowe

- POST /api/generations: utworzenie sesji generowania i przekierowanie z payloadem GenerationSessionDTO do widoku recenzji.
- POST /api/flashcard-sets: zapis nowego zestawu z CreateFlashcardSetCommand opartym o generation_session_id i filtered flashcards (accepted/edited).

## 14. Wyzwania i zalecenia

- Brak GET dla sesji generowania: konieczne przekazanie GenerationSessionDTO do widoku recenzji lub tymczasowa persistencja w kliencie; rekomendowane proste cache w pamięci z kluczem sessionId w MVP.
- Spójność walidacji: zsynchronizować limity front/back i tytułu z CreateFlashcardSetSchema, aby zminimalizować 400 po stronie serwera.
- Obsługa 422 (sesja użyta): należy jasno komunikować i proponować nową sesję, aby uniknąć blokady użytkownika.
- Bezpieczeństwo i stack: w MVP endpointy bez auth, ale zgodnie z rekomendacjami w Tech Stack przygotować miejsce na tokeny i ewentualne rate limiting w kolejnych iteracjach.

## 15. Tech Stack i wzorce

- Frontend: Astro + React + TypeScript + Tailwind zgodnie z PRD, z prostymi komponentami i stanem lokalnym dla tego widoku.
- Backend/Infra: Supabase w projekcie, a API serwowane przez Astro API routes (/api/generations, /api/flashcard-sets).
- Zalecenia skalowalności i bezpieczeństwa: rozważyć ograniczanie kosztów AI i rate limiting w kolejnych wersjach, choć nie jest to wymagane w tym widoku.

## 16. Specyfika walidacji zgodna z API

- Front: 1–200 znaków; Back: 1–500 znaków, z weryfikacją w czasie rzeczywistym i blokadą zapisu w modalu gdy niespełnione.
- Title: 1–200 znaków, wymagany przed POST /api/flashcard-sets.
- Zapis: min. jedna fiszka z action in {accepted, edited}, w innym przypadku API odrzuci żądanie (refine).

## 17. Format danych do zapisu

- Mapowanie ReviewCandidateVM → FlashcardCandidateWithActionDTO: { temp_id, front, back, action, was_edited }.
- CreateFlashcardSetCommand: { title, generation_session_id, flashcards: FlashcardCandidateWithActionDTO[] }.
- Odpowiedź 201: CreateFlashcardSetResponseDTO z generation_metadata (accepted/rejected/edited, acceptance_rate) do ewentualnego wyświetlenia w toascie.
