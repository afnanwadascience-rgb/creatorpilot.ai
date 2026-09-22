# CreatorPilot AI

CreatorPilot AI is an AI-powered YouTube script analyzer, built as a native **Whop app**.
Users sign in with their Whop account, paste a script, and get a structured breakdown of
its hook, structure, retention, and clarity — with 10 free analyses per user before an
upgrade to Pro (sold as a Whop product) is required.

This is a real, working application — not a demo. Authentication is real Whop OAuth,
the free-plan limit is enforced in the database with a transaction, and the AI analysis
is a real call to Groq.

---

## 1. Architecture

```
app/
  page.tsx                     Public landing page
  layout.tsx                   Root layout
  oauth/error/page.tsx         OAuth failure page
  api/auth/login/route.ts      Starts Whop OAuth
  api/auth/callback/route.ts   Exchanges code, creates session + user
  api/auth/logout/route.ts     Destroys session
  api/analysis/route.ts        POST — the gated, server-enforced analysis endpoint
  api/analysis/[id]/route.ts   GET — fetch one analysis (ownership enforced)
  dashboard/layout.tsx         Auth-gated layout + nav
  dashboard/page.tsx           Dashboard home
  dashboard/analyze/           Script editor + results
  dashboard/history/           Analysis history list + detail
  dashboard/account/           Profile, plan, upgrade CTA
  experiences/[experienceId]/  Whop "Experience View" entry point (iframe token)
components/                    Shared UI (Navbar, UsageCard, AnalysisResults)
lib/
  whop-sdk.ts                  Server-side Whop SDK singleton
  session.ts                   Encrypted iron-session cookie
  current-user.ts              Session -> DB user resolution
  entitlement.ts                Free-limit / Pro-access logic (single source of truth)
  prisma.ts                    Prisma client singleton
services/
  analysis.service.ts          The only file that talks to the AI provider (Groq)
prisma/schema.prisma           User / Usage / Analysis models
types/analysis.ts              Zod schemas for AI output + API input validation
middleware.ts                  Fast redirect-if-no-cookie shortcut for /dashboard/*
```

**Security model, in one sentence:** every request that matters (analysis creation,
history access, usage limits) re-derives identity from the encrypted session cookie and
re-derives plan/usage from the database and Whop — nothing about `userId`, `plan`, or
`usage` is ever trusted from the client.

---

## 2. Local setup

### 2.1 Prerequisites

- Node.js 18.18+
- A PostgreSQL database (local, or a free tier from Neon/Supabase/Railway)
- A Whop account with developer access
- A Groq API key

### 2.2 Install

```bash
npm install
```

### 2.3 Configure environment variables

```bash
cp .env.example .env
```

Fill in every variable — see the comments in `.env.example` for where each one comes
from. In short:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Your Postgres provider's connection string |
| `NEXT_PUBLIC_WHOP_APP_ID` | Whop Developer Dashboard → your app |
| `WHOP_API_KEY` | Whop Developer Dashboard → your app → API keys (secret) |
| `NEXT_PUBLIC_WHOP_COMPANY_ID` | Whop Developer Dashboard → your company (`biz_...`) |
| `WHOP_OAUTH_REDIRECT_URI` | Must exactly match a redirect URI registered on the app |
| `WHOP_PRODUCT_ID` | Leave blank until you create the Pro product (see §6) |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_MODEL` | Check [console.groq.com/docs/models](https://console.groq.com/docs/models) for the current list before deploying |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |

### 2.4 Set up the database

```bash
npx prisma migrate dev --name init
```

This creates the `User`, `Usage`, and `Analysis` tables.

### 2.5 Configure the Whop app for OAuth

1. Go to the [Whop Developer Dashboard](https://whop.com/dashboard/developer) → create
   or select your app.
2. Under **OAuth settings**, add this redirect URI:
   ```
   http://localhost:3000/api/auth/callback
   ```
3. Copy the **App ID** and **API key** into `.env`.

### 2.6 Run it

```bash
npm run dev
```

Open `http://localhost:3000`. Click **Start Analyzing Free** to sign in with Whop.

---

## 3. Free plan enforcement

Every new Whop user gets a `Usage` row with `analysisCount = 0` created atomically with
their `User` row on first sign-in. `POST /api/analysis`:

1. Resolves identity from the encrypted session cookie (never the client).
2. Re-checks `getEntitlement()` (DB usage count + live Whop product-access check).
3. Runs the Groq analysis.
4. Inside a single Prisma transaction: re-reads the usage count, aborts if a concurrent
   request already hit the limit, increments it, and saves the analysis row — so
   concurrent requests can't race past 10.

Refreshing, clearing local storage, logging out/in, or opening another browser has no
effect — the limit lives in Postgres, keyed by the Whop user ID.

---

## 4. Paid plan (future)

`lib/entitlement.ts` exports `getEntitlement()` / `hasProAccess()`. Today, `hasProAccess`
checks whether the signed-in Whop user has access to the product at `WHOP_PRODUCT_ID`
(via `whopApi.users.checkAccess`). Until you create that product, `WHOP_PRODUCT_ID` is
blank and every user is on the free plan.

To turn on Pro:

1. Create a product/plan for CreatorPilot Pro in the Whop dashboard.
2. Set `WHOP_PRODUCT_ID=prod_xxxxxxxx` in your environment.
3. Redeploy. Any user who owns that product immediately gets `hasProAccess: true` and
   unlimited analyses — no code changes needed.

---

## 5. AI provider

`services/analysis.service.ts` is the only file that calls Groq. It:

- Sends a structured system prompt requesting a single JSON object.
- Requests `response_format: { type: "json_object" }`.
- Parses and validates the response with the `AnalysisResultSchema` Zod schema.
- Throws a typed `AnalysisServiceError` on any failure (network, bad JSON, schema
  mismatch), which the API route turns into a friendly `502` — it never crashes the
  request.

`GROQ_API_KEY` is read only in this server-only file and is never sent to the client.

---

## 6. Production build

```bash
npm run build
npm run start
```

`npm run build` runs `prisma generate` first (via the `build` script), then `next build`.
Fix any TypeScript/ESLint errors it reports before deploying — do not ship with
`// TODO` stubs.

---

## 7. Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add every variable from `.env.example` in **Project → Settings → Environment
   Variables**. Set `NEXT_PUBLIC_APP_URL` and `WHOP_OAUTH_REDIRECT_URI` to your real
   production domain, e.g.:
   ```
   NEXT_PUBLIC_APP_URL=https://creatorpilot.yourdomain.com
   WHOP_OAUTH_REDIRECT_URI=https://creatorpilot.yourdomain.com/api/auth/callback
   ```
4. Run migrations against the production database:
   ```bash
   npx prisma migrate deploy
   ```
5. In the Whop Developer Dashboard, add the **production** redirect URI to the app's
   OAuth settings (in addition to the localhost one, if you still want to develop
   locally):
   ```
   https://creatorpilot.yourdomain.com/api/auth/callback
   ```
6. Deploy.

---

## 8. Whop app configuration (views, base URL)

In the Whop Developer Dashboard → your app → **Hosting**:

- **Base URL**: `https://creatorpilot.yourdomain.com`
- **Dashboard/Experience path** (if you want CreatorPilot embedded directly in a
  community's Whop sidebar as an installed Experience): `/experiences/[experienceId]`
  — implemented in `app/experiences/[experienceId]/page.tsx`, which verifies the
  `x-whop-user-token` header via `whopApi.verifyUserToken`.
- Only declare the views you've actually implemented. This project implements a
  standalone OAuth-authenticated web app (`/`, `/dashboard/*`) plus a starting point
  for the Experience view — it does not implement a Discover view.

---

## 9. Creating the Whop web build artifact

Whop's web build is your production build output, packaged for submission.

```bash
npm run build
zip -r build.zip .next public package.json next.config.mjs prisma
```

Adjust the file list to whatever Whop's current submission requirements specify at
[docs.whop.com](https://docs.whop.com) — check before submitting, since build packaging
requirements can change.

### Generate the SHA-256 checksum

Generate the checksum from the **exact final** `build.zip` — do this last, after the
zip is final, not before.

**macOS / Linux:**
```bash
shasum -a 256 build.zip
```

**Windows (PowerShell):**
```powershell
Get-FileHash .\build.zip -Algorithm SHA256
```

---

## 10. Whop submission workflow

1. Create the PostgreSQL database (production).
2. Configure all environment variables in your host (Vercel, etc).
3. Run `npx prisma migrate deploy`.
4. Deploy to Vercel (or your host of choice).
5. Add the production OAuth redirect URI in the Whop app's OAuth settings:
   `https://YOUR_PRODUCTION_DOMAIN/api/auth/callback`
6. Configure the app's Base URL and views in the Whop Developer Dashboard (§8).
7. Build the web artifact (§9).
8. Generate the SHA-256 checksum from the final `build.zip` (§9).
9. Upload the build to Whop per the current submission flow in the developer dashboard.
10. Submit for review.

---

## 11. Pre-submission review checklist

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds
- [ ] Whop login (`/api/auth/login`) works
- [ ] OAuth callback (`/api/auth/callback`) works
- [ ] Logout (`/api/auth/logout`) works
- [ ] `/dashboard/*` requires authentication (middleware + per-page check)
- [ ] User identity always comes from the Whop session, never the client
- [ ] The 10-analysis limit is enforced server-side, inside a DB transaction
- [ ] Usage survives refresh, logout/login, and a different browser
- [ ] Every successful analysis is saved with its full result
- [ ] History list and detail pages work
- [ ] `/api/analysis/[id]` returns 404 for another user's analysis id
- [ ] `GROQ_API_KEY` / `WHOP_API_KEY` never appear in client bundles
- [ ] Empty/too-short/too-long scripts are rejected with a clear message
- [ ] AI failures show a friendly error, not a stack trace
- [ ] Loading and error states work on the Analyze page
- [ ] Mobile and desktop layouts both work
- [ ] No fake stats, testimonials, or user counts anywhere in the UI
- [ ] `.env.example` documents every variable actually used
- [ ] No secrets committed to git
- [ ] No obsolete Whop SDK method names — confirm against current
      [docs.whop.com](https://docs.whop.com) before submitting

---

## 12. Environment variables reference

See `.env.example` for the full list with inline documentation. Summary:

- `DATABASE_URL` — Postgres connection string
- `NEXT_PUBLIC_WHOP_APP_ID` — public app id
- `WHOP_API_KEY` — secret, server-only
- `NEXT_PUBLIC_WHOP_COMPANY_ID` — your Whop company id
- `WHOP_OAUTH_REDIRECT_URI` — must match Whop app OAuth settings exactly
- `WHOP_PRODUCT_ID` — Pro product id (blank until created)
- `GROQ_API_KEY` — secret, server-only
- `GROQ_MODEL` — Groq model name, check console.groq.com/docs/models
- `SESSION_SECRET` — random 32+ char string for cookie encryption
- `NEXT_PUBLIC_APP_URL` — this deployment's public base URL

## 13. Whop app settings to configure

- OAuth redirect URI(s) — localhost + production
- App Base URL (production)
- Experience/Dashboard view path, if using `/experiences/[experienceId]`
- The Pro product (once created), referenced by `WHOP_PRODUCT_ID`

---

## Notes on Whop API currency

Whop's SDK and documented patterns can change. This project was built against the
current `@whop/api` OAuth guide and `x-whop-user-token` iframe-auth pattern documented
at docs.whop.com at the time of writing. Before deploying, diff your `lib/whop-sdk.ts`,
the two OAuth routes, and `app/experiences/[experienceId]/page.tsx` against the current
docs — package.json intentionally pins `@whop/api` and `groq-sdk` to `latest` so
`npm install` resolves the real current release rather than a version guessed in
advance.
