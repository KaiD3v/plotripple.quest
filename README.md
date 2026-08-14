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

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | For canonical URLs | Use `https://plotripple.vercel.app` in production until the custom domain is live. Defaults to `http://localhost:3000` in development. |
| `GEMINI_API_KEY` | To generate | Server only. Validated when `/api/generate` or `/api/expand` runs, not during static builds. |
| `GEMINI_MODEL` | Recommended | Falls back to `gemini-3.5-flash` if empty. |
| `RATE_LIMIT_SECRET` | Production | Used to hash rate-limit identifiers. |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis REST token. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Loads gtag with Consent Mode defaults denied. No CMP is included. |

Configure the same names in the Vercel project settings. Never commit real secrets.

## Current limits

- No accounts, database, or saved campaigns.
- History is the last 5 generations in `localStorage` on this device.
- Without Upstash + `RATE_LIMIT_SECRET`, local development skips rate limiting with a warning; production returns a controlled 503 and must not ship that way.
- Ad slots are labeled placeholders. AdSense is not wired.
- Analytics events are prepared; the script loads only when a measurement ID exists, with analytics storage denied until a future consent tool grants it.
- Generated text is a draft for the GM, not rules text for any published system.

## Out of this MVP

- Authentication
- Prisma, Supabase, Firebase, or any database
- Separate backend
- LangChain / Vercel AI SDK
- CMS, Redux, Zustand, React Hook Form, shadcn/ui
- Real AdSense or a cookie CMP
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
