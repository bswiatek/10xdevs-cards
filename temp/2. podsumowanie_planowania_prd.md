# Podsumowanie planowania PRD - Generator Fiszek AI

## Decyzje podjęte przez użytkownika

1. **Materiały wejściowe**: Artykuły, notatki i teksty o długości 1000-10000 znaków
2. **Generowanie fiszek**: System automatycznie decyduje o liczbie i kategorii bez kontroli użytkownika
3. **Role użytkowników**: Zwykły użytkownik + admin (edycja hasła, usuwanie kont)
4. **Workflow recenzji**: Kandydaci na fiszki prezentowani do akceptacji/edycji/odrzucenia przed zapisem
5. **Organizacja fiszek**: Brak tagowania, tylko lista z wyszukiwarką i paginacją
6. **Ścieżka użytkownika**: Login → Nowy zestaw → Wklej tekst → Generuj → Recenzja → Zapis → Nauka
7. **Dane analityczne**: Tylko podstawowe logi w bazie danych
8. **Compliance**: Bez dodatkowych ostrzeżeń czy disclaimerów
9. **Limity techniczne**: Max 10000 znaków tekstu, 200 znaków przód fiszki, 500 znaków tył
10. **Realizacja**: Projekt jednoosobowy bez ograniczeń terminowych
11. **Analiza tekstu**: Cały tekst analizowany naraz
12. **Interfejs recenzji**: Lista kandydatów z opcjami akceptuj/edytuj/odrzuć
13. **Algorytm powtórek**: FSRS bez wyboru przez użytkownika
14. **Przypomnienia**: Tylko w aplikacji
15. **Metryki**: Długość tekstu, liczba fiszek, czas generowania, procent akceptacji
16. **Eksport**: Brak możliwości eksportu
17. **Wyszukiwanie**: Tytuły zestawów i treść fiszek
18. **Wydajność**: <60s generowanie, <5s interfejs, 99% dostępność
19. **Połączenie**: Wymagane stałe połączenie internetowe
20. **Model biznesowy**: Aplikacja bezpłatna
21. **Limity użytkowania**: Bez limitów
22. **Sesje recenzji**: Brak możliwości powrotu do porzuconej sesji
23. **Rejestracja**: Tylko login i hasło
24. **Gamifikacja**: Bez systemu osiągnięć na tym etapie
25. **Obsługa błędów**: Komunikaty z możliwością ponownej próby
26. **Stack technologiczny**: Astro + React + TypeScript + Tailwind CSS
27. **Język**: Polski z architekturą i18n
28. **Prompty AI**: Jeden uniwersalny prompt
29. **Feedback użytkowników**: Bez systemu ocen i komentarzy

## Dopasowane zalecenia

1. **Interfejs recenzji**: Lista kandydatów z przyciskami akcji umożliwi szybką i intuicyjną ocenę
2. **Algorytm FSRS**: Nowoczesny algorytm spaced repetition zapewni lepsze rezultaty nauki
3. **Podstawowe metryki**: Śledzenie kluczowych wskaźników bez zbędnej złożoności
4. **Graceful degradation**: Obsługa błędów AI z fallbackiem zwiększy niezawodność
5. **Architektura i18n**: Przygotowanie na przyszłą wielojęzyczność bez refaktoringu
6. **Uniwersalny prompt**: Prostsze zarządzanie przy zachowaniu elastyczności
7. **Wyszukiwanie pełnotekstowe**: Znacznie zwiększy użyteczność dla większych kolekcji fiszek

## Szczegółowe podsumowanie planowania PRD

### Główne wymagania funkcjonalne

**Generowanie fiszek AI**:
- Import tekstu 1000-10000 znaków przez kopiuj-wklej
- Automatyczne generowanie kandydatów na fiszki (maks 200/500 znaków)
- Wykorzystanie GPT-4o lub Claude 3.5 Sonnet
- Analiza całego tekstu jednocześnie
- Czas generowania <60 sekund

**System recenzji**:
- Prezentacja kandydatów w formie listy
- Opcje: akceptuj/edytuj/odrzuć dla każdego kandydata
- Zapis tylko zaakceptowanych fiszek do bazy
- Brak możliwości powrotu do porzuconej sesji

**Zarządzanie fiszkami**:
- Lista zestawów fiszek z paginacją
- Wyszukiwanie pełnotekstowe (tytuły + treść)
- Operacje CRUD na fiszkach
- Format tekstowy bez tagowania/kategoryzacji

**System nauki**:
- Integracja z algorytmem FSRS
- Śledzenie postępów w bazie danych
- Przypomnienia tylko w aplikacji
- Wymagane stałe połączenie internetowe

**Zarządzanie kontami**:
- Rejestracja: email + hasło
- Role: użytkownik + admin
- Admin: edycja haseł, usuwanie kont

### Kluczowe historie użytkownika

**Historia 1: Tworzenie fiszek z AI**
- Użytkownik loguje się i klika "Nowy zestaw fiszek"
- Wkleja tekst (1000-10000 znaków)
- Klika "Generuj fiszki" i czeka <60s
- System prezentuje listę kandydatów
- Użytkownik recenzuje każdego kandydata (akceptuj/edytuj/odrzuć)
- Zapisuje zestaw po zakończeniu recenzji

**Historia 2: Nauka z fiszkami**
- Użytkownik wybiera zestaw z listy
- Klika "Rozpocznij naukę"
- System prezentuje fiszki według algorytmu FSRS
- Aplikacja zapisuje postęp i wyniki

**Historia 3: Zarządzanie kolekcją**
- Użytkownik przegląda listę zestawów z paginacją
- Używa wyszukiwarki do znajdowania konkretnych fiszek
- Edytuje lub usuwa wybrane fiszki/zestawy

### Kryteria sukcesu i pomiar

**Główne metryki biznesowe**:
- 75% fiszek wygenerowanych przez AI akceptowanych przez użytkowników
- 75% użytkowników tworzy fiszki z wykorzystaniem AI (vs ręcznie)

**Metryki techniczne**:
- Czas generowania fiszek <60 sekund
- Czas odpowiedzi interfejsu <5 sekund  
- Dostępność systemu 99%

**Dane analityczne**:
- Długość tekstu wejściowego
- Liczba wygenerowanych fiszek na sesję
- Czas generowania
- Procent akceptacji kandydatów
- Podstawowe logi w bazie danych

### Ograniczenia i założenia techniczne

**Stack technologiczny**: Astro + React + TypeScript + Tailwind CSS
**Język interfejsu**: Polski z przygotowaną architekturą i18n
**Model biznesowy**: Aplikacja bezpłatna bez limitów użytkowania
**Hosting**: Wymaga rozwiązania chmurowego
**Baza danych**: Do przechowywania kont, fiszek, postępów i logów
