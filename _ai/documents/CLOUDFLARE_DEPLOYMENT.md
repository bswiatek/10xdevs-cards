# Cloudflare Pages Deployment Guide

## Przegląd

Projekt został skonfigurowany do automatycznego deploymentu na Cloudflare Pages przy każdym pushu na branch `master`.

## Wymagane kroki konfiguracyjne

### 1. Utworzenie projektu w Cloudflare Pages

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do sekcji **Workers & Pages**
3. Kliknij **Create application** → **Pages** → **Connect to Git**
4. Połącz swoje repozytorium GitHub
5. Skonfiguruj build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (domyślnie)

### 2. Konfiguracja GitHub Secrets

W repozytorium GitHub ustaw następujące secrets (Settings → Secrets and variables → Actions):

#### Wymagane dla Cloudflare deployment:

```
CLOUDFLARE_API_TOKEN       - API token z uprawnieniami do Cloudflare Pages
CLOUDFLARE_ACCOUNT_ID      - Account ID z Cloudflare Dashboard
CLOUDFLARE_PROJECT_NAME    - Nazwa projektu Cloudflare Pages
```

#### Wymagane dla aplikacji:

```
SUPABASE_URL              - URL do instancji Supabase
SUPABASE_KEY              - Anon/Public key z Supabase
OPENROUTER_API_KEY        - API key dla OpenRouter
```

### 3. Uzyskanie Cloudflare API Token

1. Przejdź do [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Kliknij **Create Token**
3. Użyj template **Edit Cloudflare Workers** lub utwórz custom token z uprawnieniami:
   - **Account** → **Cloudflare Pages** → **Edit**
4. Skopiuj wygenerowany token i dodaj jako secret `CLOUDFLARE_API_TOKEN`

### 4. Znajdowanie Account ID

1. Otwórz [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. W prawym sidebar znajdziesz **Account ID**
3. Skopiuj i dodaj jako secret `CLOUDFLARE_ACCOUNT_ID`

### 5. Nazwa projektu

Nazwa projektu to nazwa utworzona w kroku 1. Dodaj ją jako secret `CLOUDFLARE_PROJECT_NAME`.

## Environment Variables w Cloudflare Pages

Dodatkowo skonfiguruj zmienne środowiskowe bezpośrednio w Cloudflare Pages:

1. Przejdź do swojego projektu w Cloudflare Dashboard
2. **Settings** → **Environment variables**
3. Dodaj następujące zmienne:

```
SUPABASE_URL              - URL do instancji Supabase
SUPABASE_KEY              - Anon/Public key z Supabase
OPENROUTER_API_KEY        - API key dla OpenRouter
```

⚠️ **Uwaga**: Zmienne w Cloudflare Pages są potrzebne w runtime, a GitHub Secrets są używane podczas build time.

## Workflow CI/CD

### Master Branch (`.github/workflows/master.yml`)

Pipeline składa się z następujących kroków:

1. **Lint** - Sprawdzenie kodu z ESLint i Prettier
2. **Unit Tests** - Testy jednostkowe z coverage
3. **Build** - Kompilacja aplikacji dla Cloudflare
4. **Deploy** - Automatyczny deployment na Cloudflare Pages
5. **Status Summary** - Podsumowanie deploymentu

### Pull Request (`.github/workflows/pull-request.yml`)

Pipeline dla PR:

1. **Lint** - Sprawdzenie kodu
2. **Unit Tests** - Testy jednostkowe
3. **E2E Tests** - Testy end-to-end (tylko w PR)
4. **Status Comment** - Komentarz ze statusem na PR

## Zmiany w konfiguracji

### Astro Config

Projekt używa `@astrojs/cloudflare` adapter zamiast `@astrojs/node`:

```javascript
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
```

### Package.json

Zainstalowano dodatkową zależność:

```bash
npm install @astrojs/cloudflare --save-dev
```

## Weryfikacja deploymentu

Po każdym pushu na `master`:

1. Sprawdź zakładkę **Actions** w GitHub
2. Poczekaj na zakończenie wszystkich kroków
3. Sprawdź deployment URL w Cloudflare Dashboard
4. Aplikacja powinna być dostępna pod: `https://<project-name>.pages.dev`

## Troubleshooting

### Build fails na Cloudflare

- Sprawdź logi w GitHub Actions
- Zweryfikuj zmienne środowiskowe w Cloudflare Pages
- Upewnij się, że `dist/` folder jest poprawnie generowany

### Deployment fails

- Sprawdź czy API Token ma odpowiednie uprawnienia
- Zweryfikuj Account ID i Project Name
- Sprawdź logi w Cloudflare Dashboard → Workers & Pages → projekt → Deployments

### Runtime errors

- Sprawdź zmienne środowiskowe w Cloudflare Pages Settings
- Upewnij się, że Supabase URL i Key są poprawne
- Sprawdź logi w Cloudflare Dashboard → projekt → Logs

## Dodatkowe zasoby

- [Astro Cloudflare Adapter Docs](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler Action Docs](https://github.com/cloudflare/wrangler-action)
