### Opis usługi

Usługa OpenRouter zapewnia jednolity interfejs do wysyłania zapytań czatowych do różnych modeli LLM przez jedno API, wystawiając proste metody do budowy wiadomości, konfiguracji modelu/parametrów oraz egzekwowania schematów JSON w odpowiedziach, a także stosując zabezpieczenia i obsługę błędów zgodnie z wymaganiami projektu.
Implementacja jest osadzona w strukturze Astro 5 + TypeScript 5 + React 19, z kodem serwisu w ./src/lib, publicznym API w ./src/pages/api, typami współdzielonymi w ./src/types.ts i integracją w komponentach klienckich, co odpowiada przyjętej organizacji katalogów i stosowi technologicznemu projektu.

### Opis konstruktora

Konstruktor klasy OpenRouterService przyjmuje konfigurację domyślną: klucz API z bezpiecznego źródła środowiskowego, bazowy adres końcówki czatów, nazwę domyślnego modelu oraz domyślne parametry próbkowania (np. temperature, top_p, max_tokens), zgodne z parametrami OpenRouter.
Zalecane umiejscowienie: ./src/lib/openrouter.ts (kod serwisowy), z inicjalizacją konfiguracji w oparciu o pliki .env i mechanizmy serwerowe Astro, przy ekspozycji funkcji HTTP w ./src/pages/api/openrouter/*.ts zgodnie z konwencją katalogową.

Przykładowa sygnatura konstruktora (TypeScript):

```ts
type OpenRouterConfig = {
  apiKey: string;
  baseUrl?: string; // default: "https://openrouter.ai/api/v1"
  defaultModel?: string; // np. "openai/gpt-4o-mini" lub inny wspierany
  defaultParams?: Partial<OpenRouterParams>;
};

class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private defaultParams: Partial<OpenRouterParams>;

  constructor(cfg: OpenRouterConfig) {
    if (!cfg.apiKey) throw new Error("Missing OpenRouter API key");
    this.apiKey = cfg.apiKey;
    this.baseUrl = cfg.baseUrl ?? "https://openrouter.ai/api/v1";
    this.defaultModel = cfg.defaultModel ?? "openai/gpt-4o-mini";
    this.defaultParams = cfg.defaultParams ?? {};
  }
}
```


### Publiczne metody i pola

- OpenRouterService.chat(options): Wysyła żądanie chat-completion z tablicą messages, opcjonalnym response_format dla JSON i parametrami próbkowania (temperature, top_p, max_tokens itd.), zwracając treść asystenta i metryki użycia.
- OpenRouterService.withDefaults(partialCfg): Zwraca nową instancję z nadpisanymi domyślnymi parametrami (np. innym modelem lub innymi limitami tokenów) do użycia dla specyficznych scenariuszy.
- Pola konfiguracyjne (readonly): apiKey, baseUrl, defaultModel, defaultParams, wykorzystywane przez metody publiczne do budowania żądań i walidacji wejścia.

Przykładowa sygnatura metody:

```ts
type Message = { role: "system" | "user" | "assistant"; content: string };

type JsonSchemaFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
};

type ResponseFormat =
  | { type: "json_object" }
  | JsonSchemaFormat;

type OpenRouterParams = {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  min_p?: number;
  top_a?: number;
  seed?: number;
  max_tokens?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  stop?: string[];
  structured_outputs?: boolean;
  response_format?: ResponseFormat;
};

type ChatOptions = {
  messages: Message[];
  model?: string;
  params?: OpenRouterParams;
};

class OpenRouterService {
  // ...
  async chat(opts: ChatOptions): Promise<{
    content: string;
    raw: unknown;
  }> {
    // implementacja patrz sekcja „Prywatne metody”
    return { content: "", raw: null };
  }
}
```


### Prywatne metody i pola

- buildRequestBody(messages, model, params): Składa body żądania zgodne z OpenRouter Chat Completions, w tym messages, model i parametry, oraz opcjonalnie response_format dla wymuszenia formatu JSON lub schematu JSON.
- validateStructuredOutputIfNeeded(response, response_format): Przy włączonym structured_outputs/json_schema próbuje zweryfikować, czy asystent zwrócił poprawny JSON spełniający schemat; w przypadku niezgodności stosuje retry/backoff lub zwraca kontrolowany błąd.
- sanitizeAndMapError(e): Normalizuje błędy HTTP/transportowe/provider-specific, mapując je na spójne kody/komunikaty z uwzględnieniem scenariuszy braku wsparcia response_format lub niepoprawnych danych wyjściowych.
- maybeAugmentPromptForJsonMode(messages, response_format): Jeżeli używany jest JSON mode lub schema, dokleja minimalną wskazówkę do system/user, aby zwiększyć szanse poprawnej serializacji zgodnie z zaleceniem „także poinstruuj model o formacie”.

Szkic implementacji metody chat:

```ts
private async request(path: string, body: unknown) {
  const url = `${this.baseUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async chat(opts: ChatOptions) {
  const model = opts.model ?? this.defaultModel;
  const params = { ...this.defaultParams, ...opts.params };

  const body = {
    model,
    messages: opts.messages,
    ...params,
  };

  const json = await this.request("/chat/completions", body);
  const choice = json?.choices?.?.message?.content ?? "";
  return { content: choice, raw: json };
}
```


### Obsługa błędów

- Brak klucza API lub zły format nagłówków autoryzacji: zwracaj 401 z komunikatem diagnostycznym oraz logowaniem serwerowym bez wypisywania tajnych wartości.
- Nieobsługiwany model lub zła nazwa modelu: 400 z komunikatem o nieprawidłowej konfiguracji i linkiem do listy modeli w warstwie UI, ponieważ nazwy modeli są zależne od dostawcy w OpenRouter.
- Parametry spoza zakresu (np. temperature > 2, top_p > 1): walidacja wejścia i 400, zgodnie z dopuszczalnymi zakresami parametrów OpenRouter.
- Brak wsparcia JSON mode/structured outputs przez dany model: wykrycie po błędzie provider-a lub braku zgodności i fallback do zwykłego trybu z ostrzeżeniem oraz opcjonalny retry z doprecyzowaniem promptu.
- Model nie przestrzega schematu (niepoprawny JSON lub błędne klucze): walidacja po stronie serwisu, retry z krótkim backoff i dopisaniem wskazówki, a finalnie błąd 422 z treścią do debugowania bez ujawniania danych wrażliwych.
- 429 rate limit lub 503/504 timeout provider-a: strategia retry z jitterem, ograniczenie równoległości żądań oraz komunikat o przekroczeniu limitów po wyczerpaniu prób.
- Błędy sieciowe/transportowe: mapowanie do 502/503 z prośbą o ponowienie, log z korelacją request-id jeżeli dostępne.
- Niezgodność rozmiaru odpowiedzi z oczekiwaniami (max_tokens, stop): wymuszenie limitów i egzekwowanie sekwencji stop w parametrach żądania.


### Kwestie bezpieczeństwa

- Przechowywanie klucza OpenRouter wyłącznie po stronie serwera i nienarażanie go w kliencie, z wdrożonym rate limitingiem i kontrolą kosztów po stronie API, co było wskazane jako krytyczna rekomendacja w kontekście nadużyć kosztowych.
- Walidacja i ograniczanie wejścia/wyjścia API, twarde definicje schematów oraz bezpieczne komunikaty błędów bez stack trace, zgodnie z zaleceniami OWASP dla API Security.
- Stosowanie Supabase RLS oraz mechanizmów auth/verification, a także CAPTCHA i per-user throttling przy akcjach kosztownych, aby zapobiec botom i nadużyciom.
- Ograniczenie rozmiaru żądań i odpowiedzi, sanityzacja logów oraz regularne aktualizacje i twardnienie konfiguracji jako element powtarzalnych procesów bezpieczeństwa.


### Plan wdrożenia krok po kroku

- Utworzenie typów współdzielonych: w ./src/types.ts dodać definicje Message, OpenRouterParams, ResponseFormat, aby spójnie typować backend i frontend.
- Implementacja serwisu: w ./src/lib/openrouter.ts zaimplementować klasę OpenRouterService z konstruktorem, metodą chat, oraz prywatnymi pomocnikami buildRequestBody, sanitizeAndMapError, validateStructuredOutputIfNeeded.
- Endpoint API: w ./src/pages/api/openrouter/chat.ts utworzyć handler POST, który waliduje wejście, instancjuje serwis z kluczem API i zwraca wynik lub kontrolowane błędy, stosując wczesne zwroty i guard clauses.
- Konfiguracja środowiskowa: OPENROUTER_API_KEY jest dostępny w pliku .env, stamtąd można go odczytywać
- Wybór modelu: zdefiniować białą listę modeli obsługiwanych przez usługę, przechowywaną po stronie serwera, z walidacją nazwy i ewentualnym fallbackiem, aby uniknąć błędów provider-specific.
- Structured outputs: wdrożyć response_format typu json_schema, ustawiając structured_outputs: true oraz schema z nazwą i strict: true, a także dopisać krótką instrukcję w system/user o zwracaniu wyłącznie JSON.


### Elementy OpenRouter i przykłady użycia

1) Komunikat systemowy: Pierwszy element tablicy messages z role: "system" definiujący kontekst i reguły odpowiedzi modelu, co zwiększa przewidywalność zachowania.
Przykład:

```ts
const system: Message = { role: "system", content: "Jesteś asystentem tworzącym zwięzłe JSON-y." };
```

2) Komunikat użytkownika: Wiadomość z role: "user", która niesie treść zadania lub pytania, często uzupełniona precyzyjną instrukcją formatowania, zwłaszcza przy JSON mode.
Przykład:

```ts
const user: Message = { role: "user", content: "Wygeneruj obiekt JSON z polami title (string) i tags (string[])." };
```

3) Ustrukturyzowane odpowiedzi via response_format: Włączenie JSON mode lub json_schema, np. { type: 'json_schema', json_schema: { name, strict: true, schema } }, wymusza format i pozwala walidować odpowiedzi.
Przykład:

```ts
const response_format: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcard_schema",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title", "tags"],
      additionalProperties: false
    }
  }
};
```

4) Nazwa modelu: Wskazanie pola model, np. "openai/gpt-4o-mini" lub innego z listy wspieranych modeli, determinujące możliwości, koszty i wsparcie structured outputs.
Przykład:

```ts
const model = "openai/gpt-4o-mini";
```

5) Parametry modelu: Użycie temperature, top_p, top_k, max_tokens, stop i innych pozwala kontrolować styl i długość wypowiedzi, co należy dobierać do profilu zadania.
Przykład:

```ts
const params: OpenRouterParams = {
  temperature: 0.2,
  top_p: 0.9,
  max_tokens: 512,
  stop: ["\n\nEND"]
};
```


### Przykładowy endpoint API (Astro)

Endpoint HTTP, który przyjmuje body z messages/model/params i odsyła zawartość odpowiedzi, stosując walidację wejścia, ograniczenia oraz obsługę błędów.

```ts
// ./src/pages/api/openrouter/chat.ts
import type { APIRoute } from "astro";
import { OpenRouterService } from "../../lib/openrouter";
import type { Message, OpenRouterParams } from "../../types";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages, model, params } = await request.json() as {
      messages: Message[];
      model?: string;
      params?: OpenRouterParams;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), { status: 400 });
    }

    const svc = new OpenRouterService({
      apiKey: process.env.OPENROUTER_API_KEY!,
      defaultModel: model ?? "openai/gpt-4o-mini",
      defaultParams: params ?? {},
    });

    const res = await svc.chat({ messages, model, params });
    return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    const status = typeof e?.message === "string" && e.message.includes("OpenRouter 429") ? 429 : 500;
    return new Response(JSON.stringify({ error: "OpenRouter error", detail: e?.message ?? "unknown" }), { status });
  }
};
```


### Wskazówki integracyjne z UI

- Logika UI w React powinna komunikować się wyłącznie z endpointem serwerowym, nigdy bezpośrednio z OpenRouter, aby nie ujawniać kluczy i móc centralnie egzekwować limity i schematy.
- W warstwie UI warto oferować predefiniowane presety parametrów i modeli oraz informację o wymaganym formacie JSON, aby ułatwić użytkownikowi przewidywalność wyników.
- Elementy shadcn/ui i Tailwind mogą obsługiwać stany ładowania, błędy walidacji oraz prezentację ustrukturyzowanych wyników zgodnie z praktykami UX aplikacji fiszek.


### Uwagi implementacyjne dla response_format

- JSON mode: Ustaw { type: "json_object" } oraz dopisz w system/user, że odpowiedź ma być jedynie poprawnym JSON bez markdown, zgodnie z notą, że model powinien być dodatkowo poinstruowany.
- JSON schema: Użyj { type: "json_schema", json_schema: { name, strict: true, schema } } i włącz structured_outputs, pamiętając o walidacji po stronie serwera i ewentualnym retry przy niepełnym dopasowaniu.
- Wsparcie modeli: Nie wszystkie modele jednakowo egzekwują schemat, więc warto przewidzieć fallback do JSON mode lub plain text z parserem i komunikatem diagnostycznym.


### Minimalny przepływ wywołania

- Zbuduj messages: [system, user, opcjonalnie kontekst], dopisz jasne instrukcje formatowania dla JSON, zwłaszcza przy JSON mode.
- Wyślij żądanie z modelem i parametrami oraz response_format, odbierz choices.message.content i zweryfikuj JSON/schemat jeśli wymagany.
- W przypadku niezgodności zastosuj retry z doprecyzowaniem promptu i finalnie zwróć 422, jeśli struktura pozostaje niepoprawna po limitach prób.


### Dostosowanie do struktury projektu

- Katalogi: ./src/lib na usługę, ./src/pages/api na endpoint, ./src/types.ts na typy, ./src/components na UI, zgodnie z przyjętym układem repozytorium.
- Ochrona kosztów i limitowanie: wdrożenie limitów per użytkownik i operację generowania, zgodnie z wcześniejszymi rekomendacjami dot. zapobiegania nadużyciom kosztowym.
- Rozszerzalność: możliwość dodawania kolejnych modeli lub presetów parametrów bez ingerencji w warstwę UI, dzięki spójnym interfejsom serwisowym i białej liście modeli.


### Załącznik: przykładowe wywołanie serwisu

- Użycie system i user z json_schema, parametrami i wybranym modelem pokazuje pełny przepływ zgodny z wymaganiami.

```ts
const svc = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultModel: "openai/gpt-4o-mini",
  defaultParams: { temperature: 0.2, top_p: 0.9, max_tokens: 512 }
});

const messages: Message[] = [
  { role: "system", content: "Zwracaj wyłącznie poprawny JSON zgodny ze schematem." },
  { role: "user", content: "Wygeneruj tytuł i listę tagów dla fiszki o algorytmie Dijkstry." }
];

const response_format: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcard_schema",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title", "tags"],
      additionalProperties: false
    }
  }
};

const { content } = await svc.chat({
  messages,
  params: { response_format, structured_outputs: true }
});

// JSON.parse(content) -> walidacja i użycie
```


---