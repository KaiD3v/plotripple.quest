# PlotRipple

Free, system-agnostic tools for tabletop RPG game masters. The first product is a narrative consequence generator: describe a player decision, choose tone, intensity, and timeframe, and receive immediate, next-session, and/or long-term outcomes. Mixed spreads those periods; a specific timeframe returns only that period.

This is an organic-traffic experiment, not a SaaS. There is no account, database, or campaign storage.

Production: [https://plotripple.vercel.app](https://plotripple.vercel.app)

Planned domain: [plotripple.quest](https://plotripple.quest)

## Stack

- Next.js 16 (App Router, TypeScript, `src/`)
- Tailwind CSS 4
- Zod
- `@google/genai` on the server
- Vitest
- Vercel for hosting
- Upstash Redis REST for rate limiting (`@upstash/redis` + `@upstash/ratelimit`)

## Install

```bash
npm install
```

## Configure `.env.local`

Copy the example file and fill in the values you have:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Minimum for local generation:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (suggested: `gemini-3.5-flash`)
- `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` for local work)

Do not prefix Gemini secrets with `NEXT_PUBLIC_`.

## Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey).
2. Create an API key.
3. Put it in `.env.local` as `GEMINI_API_KEY`.
4. Set `GEMINI_MODEL` to a current Gemini model you have access to, for example `gemini-3.5-flash`.

The key is read only in the `POST /api/generate` and `POST /api/expand` route handlers. It is never sent to the browser.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/` redirects to `/en`. Portuguese lives at `/pt-br`.

Local development does **not** require Upstash or analytics. Missing Upstash logs a console warning and the generator still runs.

## Tests

```bash
npm test
npm run test:watch
```

Tests cover input validation, structured output validation, local history, rate limiting, and prompt construction. They do not call Gemini or Upstash.

## Rate limiting (Upstash Redis)

`/api/generate` and `/api/expand` share one bucket: **20 AI operations per hashed IP per 24 hours** (fixed window via `@upstash/ratelimit`).

1. Create a Redis database in the [Upstash Console](https://console.upstash.com/).
2. Copy the REST URL and token into:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Set `RATE_LIMIT_SECRET` to a long random string. Identifiers are `SHA-256(secret + IP)`. The raw IP is not stored.

Until Upstash and `RATE_LIMIT_SECRET` exist:

- Development: rate limiting is skipped with a warning.
- Production: generate and expand return a controlled 503. Do not publish without these variables.

## Deploy on Vercel

1. Import the GitHub repo into [Vercel](https://vercel.com/).
2. Framework preset: Next.js. Build command: `npm run build`.
3. Set the environment variables listed below for Production (and Preview if you want generation there).
4. Deploy. Confirm [https://plotripple.vercel.app](https://plotripple.vercel.app) serves `/en` and `/pt-br`.

### Production checklist

- [ ] `GEMINI_API_KEY` and `GEMINI_MODEL` set on Vercel
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set on Vercel
- [ ] `RATE_LIMIT_SECRET` set on Vercel
- [ ] `NEXT_PUBLIC_SITE_URL=https://plotripple.vercel.app` (or your custom domain)
- [ ] Smoke-test generate and expand; confirm the 21st AI call returns `RATE_LIMITED`
- [ ] Optional: `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_ADSENSE_CLIENT_ID` on Vercel, then redeploy

## Google AdSense and certified CMP

The app can load the AdSense script and Google Consent Mode defaults. **That code does not publish a consent message by itself.** The Google-certified CMP only appears after you create and publish it in AdSense.

1. Create or activate the AdSense account.
2. Add the site under **Sites**.
3. Copy the Publisher ID (`ca-pub-...`).
4. Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` in the Vercel project (Production, and Preview if you want ads there).
5. Redeploy.
6. In AdSense, open **Privacy & messaging**.
7. Create a **European regulations** message.
8. Select this site.
9. Publish English and Portuguese when the panel supports those languages.
10. Enable:
    - Consent mode for advertising purposes
    - Consent mode for analytics purposes
11. Keep the choices **Consent**, **Do not consent**, and **Manage options**.
12. Confirm the automatic **Privacy and cookie settings** link.
13. Validate Consent Mode with [Google Tag Assistant](https://tagassistant.google.com/).

Until that message is published, tags stay on the Consent Mode defaults below. Do not expect a banner just because `NEXT_PUBLIC_ADSENSE_CLIENT_ID` exists.

`/en/privacy` and `/pt-br/privacy` do not load GA, AdSense, or Funding Choices. The exclusion is applied in `src/proxy.ts` before render. Links that enter or leave those pages use a native `<a href>` so the root layout reloads; switching language while already on Privacy can stay client-side.

### Consent Mode defaults

- EEA, United Kingdom, and Switzerland: `analytics_storage`, `ad_storage`, `ad_user_data`, and `ad_personalization` start as `denied`, with `wait_for_update: 500`.
- Everywhere else: the same four signals use `NEXT_PUBLIC_CONSENT_DEFAULT_UNREGULATED`, which accepts only `granted` or `denied` and defaults to `denied`.
- Setting that fallback to `granted` is a legal/product decision, not a technical requirement of this codebase.
- Only Google’s CMP issues `consent` `update` commands.

### ads.txt

`/ads.txt` is generated from a valid `ca-pub-` + 16-digit Publisher ID:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

If the ID is missing or invalid, the route returns 404 and does not publish an example record.

### Auto Ads

The app loads `adsbygoogle.js` once when the Publisher ID is valid. That prepares Auto Ads. The labeled slots in the UI are placeholders, not ad units. Enable Auto Ads in the AdSense panel. This codebase does not render manual ad units or call `(adsbygoogle).push()`.

### Content Security Policy

There is no `Content-Security-Policy` allowlist. Google does not support a static origin allowlist for AdSense. Other security headers stay in `next.config.ts`. A strict nonce-based CSP is a future improvement, not part of this cut.

### Checking Consent Mode in Tag Assistant

1. Open Tag Assistant and connect the production (or preview) URL.
2. Confirm the Consent Mode default fires **before** the Google tags. In EEA/UK/CH the four signals start `denied`. Outside those regions they follow `NEXT_PUBLIC_CONSENT_DEFAULT_UNREGULATED` (default `denied`).
3. After the published CMP updates consent, confirm an `update` (not a first-party helper) changes those signals.
4. Confirm there is a single `gtag.js` load and a single `adsbygoogle.js` load.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | For canonical URLs | Use `https://plotripple.vercel.app` in production until the custom domain is live. Defaults to `http://localhost:3000` in development. |
| `GEMINI_API_KEY` | To generate | Server only. Validated when `/api/generate` or `/api/expand` runs, not during static builds. |
| `GEMINI_MODEL` | Recommended | Falls back to `gemini-3.5-flash` if empty. |
| `RATE_LIMIT_SECRET` | Production | Used to hash rate-limit identifiers. |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis REST token. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Loads gtag after Consent Mode defaults. The Google AdSense CMP updates these signals when published. Not loaded on privacy pages. |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Optional | Public AdSense Publisher ID (`ca-pub-` + exactly 16 digits). Loads `adsbygoogle.js` once from the root layout and feeds `/ads.txt`. Invalid or empty values are ignored. Not a secret. |
| `NEXT_PUBLIC_CONSENT_DEFAULT_UNREGULATED` | Optional | Consent Mode default outside the EEA, UK, and Switzerland. Only `granted` or `denied`. Default is `denied`. Using `granted` is a legal/product decision. |

Configure the same names in the Vercel project settings. Never commit real secrets.

## Current limits

- No accounts, database, or saved campaigns.
- History is the last 5 generations in `localStorage` on this device.
- Without Upstash + `RATE_LIMIT_SECRET`, local development skips rate limiting with a warning; production returns a controlled 503 and must not ship that way.
- Ad slots are labeled placeholders, not live ad units. Auto Ads must be turned on in the AdSense panel; this repo does not render manual units.
- The AdSense script loads only when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is `ca-pub-` plus exactly 16 digits. Build and GA do not depend on it.
- `/ads.txt` is emitted only for a valid Publisher ID; otherwise it 404s.
- Analytics events are prepared; gtag loads only when a measurement ID exists. Privacy pages load neither GA nor AdSense.
- Consent Mode starts denied in the EEA, UK, and Switzerland. The unregulated fallback is denied unless `NEXT_PUBLIC_CONSENT_DEFAULT_UNREGULATED=granted`.
- The Google CMP does not appear until a Privacy & messaging message is created and published in AdSense.
- Generated text is a draft for the GM, not rules text for any published system.

## Out of this MVP

- Authentication
- Prisma, Supabase, Firebase, or any database
- Separate backend
- LangChain / Vercel AI SDK
- CMS, Redux, Zustand, React Hook Form, shadcn/ui
- Manual ad units or a first-party cookie banner / homemade CMP
- A nonce-based Content-Security-Policy
- Extra generators (rumor, complication, quest) — cards only, no indexable empty pages
- Automatic locale detection by IP or `Accept-Language`
- Hosting adapters for non-Vercel runtimes

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js local server |
| `npm run build` | Next.js production build |
| `npm start` | Serve the Next.js build |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest watch |
