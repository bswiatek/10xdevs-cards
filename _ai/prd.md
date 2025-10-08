# Dokument wymagań produktu (PRD) - Generator Fiszek AI

## 1. Przegląd produktu

### 1.1 Nazwa produktu
Generator Fiszek AI

### 1.2 Cel produktu
Aplikacja webowa umożliwiająca automatyczne generowanie fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji.

### 1.3 Grupa docelowa
Osoby uczące się, studenci, profesjonaliści i wszyscy, którzy chcą efektywnie zapamiętywać wiedzę z artykułów, notatek i innych materiałów tekstowych.

### 1.4 Kluczowe korzyści
- Automatyzacja czasochłonnego procesu tworzenia fiszek
- Redukcja czasu przygotowania materiałów edukacyjnych z godzin do minut
- Możliwość pełnej kontroli nad wygenerowanymi fiszkami przed ich zapisem

### 1.5 Stack technologiczny
- Frontend: Astro + React + TypeScript + Tailwind CSS
- Język interfejsu: Polski z przygotowaną architekturą i18n
- AI: GPT-4o lub Claude 3.5 Sonnet
- Baza danych: Relacyjna (do przechowywania kont, fiszek, postępów i logów)

### 1.6 Model biznesowy
Aplikacja bezpłatna bez limitów użytkowania

## 2. Problem użytkownika

### 2.1 Opis problemu
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest procesem niezwykle czasochłonnym, co stanowi główną barierę w adopcji spaced repetition - metody nauki potwierdzonej naukowo jako jedna z najbardziej efektywnych. Użytkownicy muszą:
- Przeczytać i zrozumieć materiał
- Zidentyfikować kluczowe koncepcje
- Sformułować pytania i odpowiedzi
- Zapewnić odpowiednią jakość i strukturę fiszek

Proces ten może zajmować kilka godzin dla standardowego artykułu czy rozdziału książki, co skutkuje zniechęceniem i rezygnacją z metody.

### 2.2 Istniejące rozwiązania i ich ograniczenia
- Anki, SuperMemo: wymagają manualnego tworzenia wszystkich fiszek
- Quizlet: brak zaawansowanego algorytmu spaced repetition

### 2.3 Nasza propozycja wartości
Generator Fiszek AI automatyzuje proces tworzenia fiszek przy zachowaniu pełnej kontroli użytkownika nad jakością końcową. System prezentuje kandydatów na fiszki do akceptacji, edycji lub odrzucenia, co zapewnia wysoką jakość przy minimalnym nakładzie czasu.

## 3. Wymagania funkcjonalne

### 3.1 Generowanie fiszek AI

#### 3.1.1 Import tekstu
- Użytkownik wkleja tekst przez mechanizm kopiuj-wklej
- Akceptowany zakres długości: 1000-10000 znaków
- Walidacja długości po stronie klienta i serwera
- Informacja zwrotna o liczbie znaków w czasie rzeczywistym

#### 3.1.2 Proces generowania
- Wykorzystanie GPT-4o lub Claude 3.5 Sonnet
- Automatyczne określenie optymalnej liczby fiszek
- Automatyczna kategoryzacja bez ingerencji użytkownika
- Uniwersalny prompt dla wszystkich typów treści
- Maksymalny czas generowania: 60 sekund

#### 3.1.3 Formaty fiszek
- Przód fiszki: maksymalnie 200 znaków
- Tył fiszki: maksymalnie 500 znaków
- Format tekstowy (bez obrazów, formatowania)

#### 3.1.4 Obsługa błędów
- Komunikat o błędzie przy timeout (>60s)
- Możliwość ponowienia próby
- Logowanie błędów w bazie danych
- Graceful degradation przy niedostępności API

### 3.2 System recenzji kandydatów

#### 3.2.1 Interfejs recenzji
- Prezentacja wszystkich kandydatów w formie listy
- Wyświetlanie przodu i tyłu każdego kandydata
- Trzystopniowy system akcji dla każdego kandydata:
  - Akceptuj: zapisuje fiszkę bez zmian
  - Edytuj: umożliwia modyfikację przed zapisem
  - Odrzuć: usuwa kandydata z listy

#### 3.2.2 Edycja kandydatów
- Możliwość edycji przodu i tyłu fiszki
- Walidacja długości podczas edycji
- Podgląd zmian przed zatwierdzeniem

#### 3.2.3 Zapisywanie zestawu
- Zapis tylko zaakceptowanych i zaedytowanych fiszek
- Brak możliwości powrotu do porzuconej sesji recenzji
- Wymagane nadanie tytułu zestawowi przed zapisem

### 3.3 Manualne tworzenie fiszek

#### 3.3.1 Edytor fiszek
- Formularz z polami: przód, tył
- Walidacja długości (200/500 znaków)
- Podgląd fiszki przed zapisem
- Dodawanie do istniejącego zestawu lub tworzenie nowego

### 3.4 Zarządzanie fiszkami

#### 3.4.1 Lista zestawów
- Wyświetlanie wszystkich zestawów użytkownika
- Paginacja (domyślnie 20 zestawów na stronę)
- Informacje o zestawie:
  - Tytuł
  - Data utworzenia
  - Liczba fiszek
  - Postęp nauki

#### 3.4.2 Wyszukiwanie
- Wyszukiwanie pełnotekstowe
- Zakres: tytuły zestawów i treść fiszek (przód + tył)
- Podświetlanie wyników
- Filtrowanie w czasie rzeczywistym

#### 3.4.3 Operacje CRUD
- Przeglądanie szczegółów zestawu
- Edycja fiszek (przód, tył)
- Usuwanie pojedynczych fiszek
- Usuwanie całych zestawów
- Potwierdzenie przed usunięciem

### 3.5 System nauki

#### 3.5.1 Algorytm FSRS
- Integracja z Free Spaced Repetition Scheduler
- Brak możliwości wyboru innego algorytmu przez użytkownika
- Automatyczne obliczanie następnej daty powtórki
- Uwzględnianie jakości odpowiedzi (1-5)

#### 3.5.2 Interfejs nauki
- Prezentacja fiszki (najpierw przód)
- Przycisk "Pokaż odpowiedź" odkrywa tył
- Ocena jakości odpowiedzi (1-5):
  - 1: Kompletnie nie pamiętam
  - 2: Trudno przypomnieć
  - 3: Z wysiłkiem
  - 4: Łatwo
  - 5: Bardzo łatwo
- Automatyczne przejście do kolejnej fiszki

#### 3.5.3 Śledzenie postępów
- Zapisywanie wszystkich sesji nauki w bazie danych
- Statystyki:
  - Liczba przejrzanych fiszek
  - Średnia ocena
  - Czas nauki
  - Liczba fiszek do powtórzenia dzisiaj

#### 3.5.4 Przypomnienia
- Wyświetlanie liczby fiszek do powtórzenia w aplikacji
- Brak powiadomień email/push

### 3.6 Zarządzanie kontami

#### 3.6.1 Rejestracja
- Wymagane pola: email, hasło
- Walidacja formatu email
- Potwierdzenie hasła
- Brak weryfikacji email

#### 3.6.2 Logowanie
- Email + hasło
- Sesja utrzymywana przez token
- Brak opcji "Zapamiętaj mnie"

#### 3.6.3 Role użytkowników
- Zwykły użytkownik: pełny dostęp do własnych zasobów
- Administrator:
  - Wszystkie uprawnienia użytkownika
  - Edycja haseł innych użytkowników
  - Usuwanie kont użytkowników

### 3.7 Metryki i analityka

#### 3.7.1 Zbierane dane
- Długość tekstu wejściowego (w znakach)
- Liczba wygenerowanych kandydatów na fiszki
- Czas generowania
- Liczba zaakceptowanych/odrzuconych/zaedytowanych kandydatów
- Procent akceptacji
- Podstawowe logi błędów

#### 3.7.2 Przechowywanie
- Dane zapisywane w bazie danych
- Brak zewnętrznych narzędzi analitycznych
- Dostęp tylko dla administratorów

## 4. Granice produktu

### 4.1 Co NIE jest w zakresie MVP

#### 4.1.1 Funkcjonalności
- Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
- Import plików (PDF, DOCX, itp.)
- Współdzielenie zestawów fiszek między użytkownikami
- Integracje z innymi platformami edukacyjnymi (Notion, Evernote)
- Aplikacje mobilne (iOS, Android)
- Tryb offline
- Eksport fiszek do innych formatów
- System osiągnięć i gamifikacji
- Oceny i komentarze od użytkowników
- Tagowanie i zaawansowana kategoryzacja
- Możliwość powrotu do porzuconej sesji recenzji
- Powiadomienia email/push
- Weryfikacja email przy rejestracji
- Logowanie przez media społecznościowe

#### 4.1.2 Ograniczenia techniczne
- Brak wsparcia dla materiałów multimedialnych (obrazy, audio, wideo)
- Brak formatowania tekstu (bold, italic, kod)
- Tylko język polski w MVP
- Bez możliwości wyboru algorytmu powtórek
- Brak trybu ciemnego (można dodać w przyszłości)

#### 4.1.3 Ograniczenia biznesowe
- Brak płatnych planów i limitów
- Brak modelu freemium
- Bez systemu subskrypcji

### 4.2 Założenia

#### 4.2.1 Założenia użytkownika
- Użytkownicy mają stałe połączenie internetowe
- Użytkownicy posiadają podstawową znajomość obsługi aplikacji webowych
- Użytkownicy rozumieją zasady spaced repetition

#### 4.2.2 Założenia techniczne
- Hosting zapewnia 99% uptime
- Baza danych skaluje się wraz z liczbą użytkowników

#### 4.2.3 Założenia biznesowe
- Projekt realizowany przez jedną osobę
- Brak ograniczeń czasowych
- Brak budżetu marketingowego w MVP

## 5. Historyjki użytkowników

### 5.1 Zarządzanie kontem

#### US-001: Rejestracja nowego konta

Opis: Jako nowy użytkownik chcę utworzyć konto, aby móc korzystać z aplikacji i zapisywać swoje fiszki.

Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, hasło, potwierdzenie hasła
- System waliduje format email (RFC 5322)
- System sprawdza, czy hasło i jego potwierdzenie są identyczne
- System informuje o błędach walidacji w czasie rzeczywistym
- Po poprawnej rejestracji użytkownik jest automatycznie zalogowany
- System wyświetla komunikat o sukcesie rejestracji
- Email musi być unikalny w systemie

#### US-002: Logowanie do aplikacji

Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich fiszek.

Kryteria akceptacji:
- Formularz logowania zawiera pola: email, hasło
- System waliduje poprawność danych logowania
- Po poprawnym logowaniu użytkownik jest przekierowywany na główny widok aplikacji
- System wyświetla komunikat o błędzie przy niepoprawnych danych
- Niepoprawne dane nie ujawniają, który element jest błędny (bezpieczeństwo)
- Sesja użytkownika jest zapisywana w ciasteczku/tokenie

#### US-003: Wylogowanie z aplikacji

Opis: Jako zalogowany użytkownik chcę się wylogować, aby zabezpieczyć swoje konto na współdzielonym urządzeniu.

Kryteria akceptacji:
- Przycisk wylogowania jest widoczny w każdym widoku aplikacji
- Po kliknięciu wylogowania sesja użytkownika jest usuwana
- Użytkownik jest przekierowywany na stronę logowania
- System wyświetla komunikat potwierdzający wylogowanie
- Po wylogowaniu próba dostępu do chronionych zasobów przekierowuje na logowanie

#### US-004: Edycja hasła własnego konta

Opis: Jako użytkownik chcę zmienić swoje hasło, aby zwiększyć bezpieczeństwo konta.

Kryteria akceptacji:
- Formularz zmiany hasła zawiera pola: stare hasło, nowe hasło, potwierdzenie nowego hasła
- System waliduje poprawność starego hasła
- System wymaga nowego hasła o minimalnej długości 8 znaków
- System sprawdza, czy nowe hasło i jego potwierdzenie są identyczne
- Po pomyślnej zmianie użytkownik otrzymuje komunikat o sukcesie
- Po zmianie hasła wszystkie sesje użytkownika są unieważniane (wymaga ponownego logowania)

### 5.2 Administracja (tylko administrator)

#### US-005: Edycja hasła innego użytkownika

Opis: Jako administrator chcę zresetować hasło użytkownika, aby pomóc w przypadku jego utraty.

Kryteria akceptacji:
- Administrator ma dostęp do listy wszystkich użytkowników
- Administrator może wybrać użytkownika i kliknąć "Resetuj hasło"
- System generuje nowe tymczasowe hasło
- Nowe hasło jest wyświetlane administratorowi (do przekazania użytkownikowi)
- Wszystkie sesje tego użytkownika są unieważniane
- System loguje operację resetowania hasła

#### US-006: Usuwanie konta użytkownika

Opis: Jako administrator chcę usunąć konto użytkownika, aby zarządzać bazą użytkowników (np. spam, naruszenia).

Kryteria akceptacji:
- Administrator ma dostęp do listy wszystkich użytkowników
- Administrator może wybrać użytkownika i kliknąć "Usuń konto"
- System wyświetla dialog potwierdzenia z ostrzeżeniem o nieodwracalności
- Po potwierdzeniu konto użytkownika jest trwale usuwane
- Wszystkie fiszki, zestawy i dane użytkownika są kasowane
- System loguje operację usunięcia konta

#### US-007: Dostęp do logów systemowych

Opis: Jako administrator chcę przeglądać logi systemowe, aby monitorować błędy i aktywność.

Kryteria akceptacji:
- Administrator ma dostęp do widoku logów systemowych
- Logi zawierają: timestamp, typ zdarzenia, opis, ID użytkownika (jeśli dotyczy)
- Możliwość filtrowania logów według typu (błąd, info, ostrzeżenie)
- Możliwość wyszukiwania w logach
- Paginacja logów (50 wpisów na stronę)

### 5.3 Generowanie fiszek AI

#### US-008: Tworzenie nowego zestawu przez wklejenie tekstu

Opis: Jako użytkownik chcę wkleić tekst i wygenerować z niego fiszki, aby zaoszczędzić czas na manualnym tworzeniu.

Kryteria akceptacji:
- Użytkownik klika "Nowy zestaw fiszek"
- System wyświetla formularz z polem tekstowym na tekst źródłowy
- System wyświetla licznik znaków w czasie rzeczywistym
- System waliduje długość tekstu (1000-10000 znaków)
- System wyświetla komunikat o błędzie, jeśli tekst jest za krótki lub za długi
- Po wklejeniu poprawnej długości tekstu przycisk "Generuj fiszki" jest aktywny

#### US-009: Generowanie kandydatów na fiszki

Opis: Jako użytkownik chcę, aby AI wygenerowało kandydatów na fiszki z mojego tekstu, aby uzyskać propozycje do recenzji.

Kryteria akceptacji:
- Po kliknięciu "Generuj fiszki" system wyświetla wskaźnik postępu
- System wysyła tekst do API AI (GPT-4o lub Claude 3.5 Sonnet)
- System analizuje cały tekst jednocześnie
- Maksymalny czas oczekiwania to 60 sekund
- System automatycznie określa liczbę fiszek (bez ingerencji użytkownika)
- Każdy kandydat ma przód (max 200 znaków) i tył (max 500 znaków)
- Po wygenerowaniu system przekierowuje do widoku recenzji

#### US-010: Obsługa błędu generowania

Opis: Jako użytkownik chcę otrzymać jasny komunikat o błędzie, jeśli generowanie nie powiedzie się, i móc spróbować ponownie.

Kryteria akceptacji:
- Jeśli generowanie przekroczy 60 sekund, system wyświetla komunikat o timeout
- Jeśli API AI jest niedostępne, system wyświetla odpowiedni komunikat
- System oferuje przycisk "Spróbuj ponownie"
- Tekst źródłowy jest zachowany po błędzie (nie trzeba wklejać ponownie)
- Błąd jest logowany w bazie danych z timestampem i szczegółami

### 5.4 Recenzja kandydatów

#### US-011: Przeglądanie listy kandydatów

Opis: Jako użytkownik chcę zobaczyć wszystkich wygenerowanych kandydatów na fiszki, aby móc je ocenić.

Kryteria akceptacji:
- System wyświetla listę wszystkich kandydatów po generowaniu
- Każdy kandydat pokazuje przód i tył fiszki
- Każdy kandydat ma trzy przyciski: Akceptuj, Edytuj, Odrzuć
- System wyświetla licznik: ile kandydatów zostało, ile zaakceptowano, ile odrzucono
- Lista jest przewijalna

#### US-012: Akceptowanie kandydata

Opis: Jako użytkownik chcę zaakceptować dobrego kandydata, aby został zapisany jako fiszka bez zmian.

Kryteria akceptacji:
- Po kliknięciu "Akceptuj" kandydat jest oznaczony jako zaakceptowany
- Zaakceptowany kandydat jest wizualnie wyróżniony (np. zielona ramka)
- Licznik zaakceptowanych zwiększa się o 1
- Kandydat pozostaje na liście (możliwość cofnięcia)

#### US-013: Odrzucanie kandydata

Opis: Jako użytkownik chcę odrzucić słabego kandydata, aby nie został zapisany jako fiszka.

Kryteria akceptacji:
- Po kliknięciu "Odrzuć" kandydat jest oznaczony jako odrzucony
- Odrzucony kandydat jest wizualnie wyróżniony (np. czerwona ramka) lub ukryty
- Licznik odrzuconych zwiększa się o 1
- Możliwość cofnięcia odrzucenia

#### US-014: Edycja kandydata

Opis: Jako użytkownik chcę edytować kandydata, który jest prawie dobry, ale wymaga poprawek.

Kryteria akceptacji:
- Po kliknięciu "Edytuj" system wyświetla formularz edycji
- Formularz zawiera pola: przód fiszki, tył fiszki
- System waliduje długość (200/500 znaków) w czasie rzeczywistym
- Po zapisaniu edycji kandydat jest automatycznie oznaczony jako zaakceptowany
- System wyświetla komunikat potwierdzający edycję
- Licznik zaedytowanych zwiększa się o 1

#### US-015: Zapisywanie zestawu po recenzji

Opis: Jako użytkownik chcę zapisać zestaw fiszek po zakończeniu recenzji, aby móc z nich korzystać w nauce.

Kryteria akceptacji:
- System wymaga nadania tytułu zestawowi przed zapisem
- Przycisk "Zapisz zestaw" jest aktywny tylko gdy zaakceptowano co najmniej jedną fiszkę
- Po kliknięciu zapisania system tworzy nowy zestaw w bazie danych
- Tylko zaakceptowane i zaedytowane fiszki są zapisywane
- Odrzucone kandydaci są pomijane
- System wyświetla komunikat o sukcesie z liczbą zapisanych fiszek
- Użytkownik jest przekierowywany na listę zestawów

### 5.5 Manualne tworzenie fiszek

#### US-017: Tworzenie fiszki ręcznie

Opis: Jako użytkownik chcę utworzyć fiszkę ręcznie, aby dodać własną wiedzę niezależnie od AI.

Kryteria akceptacji:
- Użytkownik klika "Dodaj fiszkę ręcznie"
- System wyświetla formularz z polami: przód, tył
- System waliduje długość (200/500 znaków) w czasie rzeczywistym
- System wyświetla podgląd fiszki przed zapisem
- Użytkownik może wybrać istniejący zestaw lub utworzyć nowy
- Po zapisaniu fiszka jest dodawana do wybranego zestawu
- System wyświetla komunikat o sukcesie

#### US-018: Tworzenie nowego zestawu podczas dodawania ręcznej fiszki

Opis: Jako użytkownik chcę utworzyć nowy zestaw podczas dodawania ręcznej fiszki, aby uporządkować wiedzę.

Kryteria akceptacji:
- W formularzu dodawania fiszki jest opcja "Utwórz nowy zestaw"
- Po wybraniu opcji pojawia się pole na tytuł zestawu
- System waliduje, czy tytuł nie jest pusty
- Po zapisaniu system tworzy nowy zestaw i dodaje do niego fiszkę
- System wyświetla komunikat o sukcesie

### 5.6 Zarządzanie zestawami i fiszkami

#### US-019: Przeglądanie listy zestawów

Opis: Jako użytkownik chcę zobaczyć wszystkie moje zestawy fiszek, aby móc wybrać, czego chcę się uczyć.

Kryteria akceptacji:
- System wyświetla listę wszystkich zestawów użytkownika
- Każdy zestaw pokazuje: tytuł, datę utworzenia, liczbę fiszek, postęp nauki
- Lista jest paginowana (20 zestawów na stronę)
- Możliwość nawigacji między stronami
- Zestawy są sortowane według daty utworzenia (najnowsze najpierw)

#### US-020: Wyszukiwanie zestawów i fiszek

Opis: Jako użytkownik chcę wyszukać konkretny zestaw lub fiszkę, aby szybko znaleźć potrzebną informację.

Kryteria akceptacji:
- System udostępnia pole wyszukiwania w widoku listy zestawów
- Wyszukiwanie działa w czasie rzeczywistym (po wpisaniu 3+ znaków)
- System przeszukuje: tytuły zestawów, przód i tył fiszek
- Wyniki są podświetlane
- System pokazuje, w którym zestawie znaleziono fiszkę
- Brak wyników wyświetla odpowiedni komunikat

#### US-021: Przeglądanie szczegółów zestawu

Opis: Jako użytkownik chcę zobaczyć wszystkie fiszki w zestawie, aby móc je przeglądać i zarządzać nimi.

Kryteria akceptacji:
- Po kliknięciu zestawu system wyświetla jego szczegóły
- Widok zawiera: tytuł, datę utworzenia, liczbę fiszek
- System wyświetla listę wszystkich fiszek (przód + tył)
- Każda fiszka ma przyciski: Edytuj, Usuń
- Przycisk "Rozpocznij naukę" jest widoczny

#### US-022: Edycja fiszki

Opis: Jako użytkownik chcę edytować fiszkę, aby poprawić błędy lub zaktualizować treść.

Kryteria akceptacji:
- Po kliknięciu "Edytuj" system wyświetla formularz edycji
- Formularz zawiera aktualne wartości przodu i tyłu fiszki
- System waliduje długość (200/500 znaków) w czasie rzeczywistym
- Po zapisaniu zmiany są natychmiast widoczne
- System wyświetla komunikat o sukcesie
- Historia nauki fiszki jest zachowana

#### US-023: Usuwanie fiszki

Opis: Jako użytkownik chcę usunąć fiszkę, aby pozbyć się niepotrzebnych lub błędnych informacji.

Kryteria akceptacji:
- Po kliknięciu "Usuń" system wyświetla dialog potwierdzenia
- Dialog zawiera treść fiszki do potwierdzenia
- Po potwierdzeniu fiszka jest trwale usuwana
- Liczba fiszek w zestawie jest aktualizowana
- System wyświetla komunikat o sukcesie
- Historia nauki fiszki jest usuwana

#### US-024: Usuwanie zestawu

Opis: Jako użytkownik chcę usunąć cały zestaw, aby oczyścić nieużywane materiały.

Kryteria akceptacji:
- W widoku szczegółów zestawu jest przycisk "Usuń zestaw"
- Po kliknięciu system wyświetla dialog potwierdzenia
- Dialog informuje o liczbie fiszek, które zostaną usunięte
- Dialog ostrzega o nieodwracalności operacji
- Po potwierdzeniu zestaw i wszystkie jego fiszki są trwale usuwane
- System wyświetla komunikat o sukcesie
- Użytkownik jest przekierowywany na listę zestawów

### 5.7 System nauki

#### US-025: Rozpoczęcie sesji nauki

Opis: Jako użytkownik chcę rozpocząć naukę z zestawu, aby przejrzeć fiszki według algorytmu powtórek.

Kryteria akceptacji:
- W widoku szczegółów zestawu użytkownik klika "Rozpocznij naukę"
- System sprawdza, czy są fiszki do powtórzenia dzisiaj
- Jeśli są, system rozpoczyna sesję nauki
- Jeśli nie ma, system wyświetla komunikat "Brak fiszek do powtórzenia dzisiaj"
- System wyświetla licznik: ile fiszek zostało w sesji

#### US-026: Prezentacja fiszki

Opis: Jako użytkownik chcę zobaczyć pytanie, pomyśleć o odpowiedzi, a następnie ją sprawdzić.

Kryteria akceptacji:
- System prezentuje przód fiszki na całym ekranie
- Przycisk "Pokaż odpowiedź" jest widoczny
- Po kliknięciu system pokazuje tył fiszki
- Przycisk "Pokaż odpowiedź" jest zastępowany przyciskami oceny (1-5)

#### US-027: Ocena jakości odpowiedzi

Opis: Jako użytkownik chcę ocenić, jak dobrze pamiętam odpowiedź, aby algorytm dostosował harmonogram powtórek.

Kryteria akceptacji:
- System wyświetla 5 przycisków oceny:
  - 1: Kompletnie nie pamiętam
  - 2: Trudno przypomnieć
  - 3: Z wysiłkiem
  - 4: Łatwo
  - 5: Bardzo łatwo
- Po kliknięciu oceny system zapisuje wynik
- System automatycznie przechodzi do kolejnej fiszki
- Jeśli to była ostatnia fiszka, system pokazuje podsumowanie sesji

#### US-028: Zakończenie sesji nauki

Opis: Jako użytkownik chcę zobaczyć podsumowanie po zakończeniu sesji, aby poznać swój postęp.

Kryteria akceptacji:
- Po przejrzeniu wszystkich fiszek system wyświetla podsumowanie
- Podsumowanie zawiera:
  - Liczba przejrzanych fiszek
  - Średnia ocena
  - Czas trwania sesji
  - Data następnej sesji
- Przycisk "Powrót do zestawów" przekierowuje na listę
- Sesja jest zapisana w bazie danych

#### US-029: Przerwanie sesji nauki

Opis: Jako użytkownik chcę móc przerwać sesję nauki i zachować postęp dotychczasowych odpowiedzi.

Kryteria akceptacji:
- W każdym momencie sesji widoczny jest przycisk "Przerwij sesję"
- Po kliknięciu system wyświetla dialog potwierdzenia
- Po potwierdzeniu dotychczasowe oceny są zapisywane
- Nieprzejrzane fiszki pozostają w kolejce na następną sesję
- System przekierowuje użytkownika na listę zestawów

#### US-030: Wyświetlanie liczby fiszek do powtórzenia

Opis: Jako użytkownik chcę widzieć, ile fiszek mam do powtórzenia dzisiaj, aby zaplanować naukę.

Kryteria akceptacji:
- Na liście zestawów każdy zestaw pokazuje liczbę fiszek do powtórzenia dzisiaj
- Jeśli liczba wynosi 0, system wyświetla "Brak fiszek do powtórzenia"

### 5.8 Metryki i analityka (administrator)

#### US-031: Przeglądanie metryk generowania

Opis: Jako administrator chcę zobaczyć statystyki generowania fiszek, aby ocenić jakość AI.

Kryteria akceptacji:
- Administrator ma dostęp do widoku metryk
- Widok zawiera:
  - Średnia długość tekstu wejściowego
  - Średnia liczba wygenerowanych kandydatów
  - Średni czas generowania
  - Średni procent akceptacji kandydatów
  - Liczba sesji generowania (łącznie, dzisiaj, w tym tygodniu)
- Dane można filtrować według zakresu dat

### 5.9 Obsługa błędów i edge cases

#### US-033: Obsługa utraty połączenia podczas generowania

Opis: Jako użytkownik chcę być poinformowany o utracie połączenia i móc spróbować ponownie.

Kryteria akceptacji:
- System wykrywa utratę połączenia internetowego
- System wyświetla komunikat "Utracono połączenie. Sprawdź internet i spróbuj ponownie"
- Tekst źródłowy jest zachowany
- Po przywróceniu połączenia użytkownik może kliknąć "Spróbuj ponownie"

#### US-034: Walidacja długości tekstu podczas wklejania

Opis: Jako użytkownik chcę być od razu poinformowany, jeśli mój tekst jest za krótki lub za długi.

Kryteria akceptacji:
- Licznik znaków jest widoczny w czasie rzeczywistym
- Jeśli tekst < 1000 znaków, system wyświetla: "Tekst za krótki. Minimum 1000 znaków"
- Jeśli tekst > 10000 znaków, system wyświetla: "Tekst za długi. Maksimum 10000 znaków"
- Przycisk "Generuj fiszki" jest nieaktywny przy niepoprawnej długości
- Komunikaty są wyświetlane pod polem tekstowym

#### US-035: Próba zapisu pustego zestawu

Opis: Jako użytkownik chcę być poinformowany, że nie mogę zapisać zestawu bez żadnych zaakceptowanych fiszek.

Kryteria akceptacji:
- Jeśli użytkownik odrzuci wszystkich kandydatów, przycisk "Zapisz zestaw" jest nieaktywny
- System wyświetla komunikat: "Musisz zaakceptować co najmniej jedną fiszkę"
- Po zaakceptowaniu minimum jednej fiszki przycisk staje się aktywny

#### US-036: Duplikacja emaila przy rejestracji

Opis: Jako użytkownik chcę być poinformowany, że podany email jest już w użyciu.

Kryteria akceptacji:
- System sprawdza unikalność emaila podczas rejestracji
- Jeśli email już istnieje, system wyświetla: "Ten adres email jest już zarejestrowany"
- Użytkownik może spróbować innego emaila lub przejść do logowania

#### US-037: Sesja wygasła podczas pracy

Opis: Jako użytkownik chcę być poinformowany o wygaśnięciu sesji i móc się ponownie zalogować.

Kryteria akceptacji:
- System wykrywa wygaśnięcie sesji przy każdym żądaniu
- System wyświetla komunikat: "Twoja sesja wygasła. Zaloguj się ponownie"
- Użytkownik jest przekierowywany na stronę logowania
- Po ponownym zalogowaniu użytkownik wraca do poprzedniego widoku (jeśli możliwe)
