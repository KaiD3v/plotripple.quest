# PlotRipple

Free, system-agnostic tools for tabletop RPG game masters. The first product is a narrative consequence generator: describe a player decision, choose tone, intensity, and timeframe, and receive immediate, next-session, and/or long-term outcomes. Mixed spreads those periods; a specific timeframe returns only that period.

This is an organic-traffic experiment, not a SaaS. There is no account, database, or campaign storage.

Planned domain: [plotripple.quest](https://plotripple.quest)

## Stack

- Next.js 16 (App Router, TypeScript, `src/`)
- Tailwind CSS 4
- Zod
- `@google/genai` on the server
- Vitest
- Cloudflare Workers via `@opennextjs/cloudflare` and Wrangler

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

The key is read only in the `POST /api/generate` route handler. It is never sent to the browser.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/` redirects to `/en`. Portuguese lives at `/pt-br`.

Local development does **not** require Cloudflare, Turnstile, KV, or analytics. Missing Turnstile and KV log a console warning and the generator still runs.

## Tests

```bash
npm test
npm run test:watch
```

Tests cover input validation, structured output validation, local history, and prompt construction. They do not call Gemini.

## Cloudflare preview

Install Wrangler (already a dev dependency), copy env vars for the Workers runtime, then preview:

```bash
copy .dev.vars.example .dev.vars
```

Put the same secrets from `.env.local` into `.dev.vars` (Wrangler does not read `.env.local` by itself). Keep `NEXTJS_ENV=development` so OpenNext loads the Next.js development env files when appropriate.

```bash
npm run preview
```

This builds with `opennextjs-cloudflare` and serves the Worker locally. `npm run dev` remains the everyday workflow.

## Create the KV namespace

Rate limiting uses a KV binding named `RATE_LIMIT_KV` (5 generations per hashed identifier per 24 hours).

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
```

Copy the returned ID into `wrangler.jsonc`, replacing `REPLACE_WITH_RATE_LIMIT_KV_ID`, and uncomment the `kv_namespaces` block.

Also set `RATE_LIMIT_SECRET` to a long random string. Identifiers are `SHA-256(secret + IP)`. The raw IP is not stored.

Until KV and `RATE_LIMIT_SECRET` exist:

- Local `next dev`: rate limiting is skipped with a warning.
- Production: generation fails explicitly. Do not ship without the binding.

Refresh TypeScript bindings after wrangler changes:

```bash
npm run cf-typegen
```

## Configure Turnstile

1. Create a widget in the [Cloudflare Turnstile dashboard](https://developers.cloudflare.com/turnstile/).
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public) and `TURNSTILE_SECRET_KEY` (server only).
3. In development, missing keys skip verification with a console warning.
4. In production, missing or failed Turnstile verification rejects the request. There is no silent bypass.

## Deploy later

Do not deploy from this MVP task. When you are ready:

1. Set production secrets with `npx wrangler secret put GEMINI_API_KEY` (and the other server secrets).
2. Set public `NEXT_PUBLIC_*` values for the production build.
3. Attach `RATE_LIMIT_KV`.
4. Run `npm run deploy` (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`).

Placeholder resource IDs in `wrangler.jsonc` must be replaced first.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | For canonical URLs | Defaults to `http://localhost:3000` if unset so static pages can build. |
| `GEMINI_API_KEY` | To generate | Server only. Validated when `/api/generate` runs, not during static builds. |
| `GEMINI_MODEL` | Recommended | Falls back to `gemini-3.5-flash` if empty. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production | Shows the widget. |
| `TURNSTILE_SECRET_KEY` | Production | Server verification. |
| `RATE_LIMIT_SECRET` | Production | Used to hash rate-limit identifiers. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Loads gtag with Consent Mode defaults denied. No CMP is included. |

Cloudflare binding:

- `RATE_LIMIT_KV` — Workers KV for generation limits.

## Current limits

- No accounts, database, or saved campaigns.
- History is the last 5 generations in `localStorage` on this device.
- Rate limiting is inactive until KV + `RATE_LIMIT_SECRET` are configured.
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

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js local server |
| `npm run build` | Next.js production build |
| `npm start` | Serve the Next.js build |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest watch |
| `npm run preview` | OpenNext + Wrangler local Worker |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run cf-typegen` | Generate `cloudflare-env.d.ts` |
