# ShotDomain

Enter one URL; ShotDomain discovers every page on the domain, screenshots each one
on desktop, tablet and mobile, and returns a ZIP.

## Run locally

```bash
npm install
npx playwright install chromium   # first time only
npm run dev
```

Open http://localhost:3000. With no `.env.local`, the app runs in **local mode**: no sign-in.

## Google sign-in (optional locally, required before hosting)

Sign-in is enforced only when Google credentials are set. Once they are, `/app`,
`/schedules` and all API routes require a signed-in Google account.

1. Google Cloud Console → **APIs & Services → OAuth consent screen**: set it up (External).
2. **Credentials → Create credentials → OAuth client ID** → type *Web application*.
   - Authorized JavaScript origins: `http://localhost:3000` (and your live URL)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
     (and `https://YOUR-DOMAIN/api/auth/callback/google`)
3. `cp .env.example .env.local` and fill in:
   - `AUTH_SECRET` — a long random string. Generate one with
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — from step 2
   - `AUTH_ALLOWED_EMAILS` — optional allowlist, e.g. `you@gmail.com,@yourcompany.com`
4. Restart `npm run dev`.

When hosting (Railway, Render, Fly, a VPS), set the same variables in the host's
dashboard plus `AUTH_TRUST_HOST=true`. Never commit `.env.local`.

## How captures work

For every page the engine:

1. navigates once, waiting for the DOM, then (bounded) for the load event and
   for the network to go quiet — sites with chat widgets or analytics never go
   fully idle, so that wait is capped rather than failing;
2. lets the page settle: web fonts, and CSS animations/transitions jumped to
   their end state, so screenshots are stable and comparable between runs;
3. hides consent banners and applies your cleanup selectors/CSS (injected in
   a way a site's Content-Security-Policy can't block);
4. for full-page shots, makes lazy content load, lets app shells that scroll
   inside a container grow to their full height, scrolls through the page and
   back to the top; very tall pages are clipped at 16,000 px;
5. screenshots, and makes a small JPEG preview for grids and lists;
6. attaches honest notes to the result: HTTP errors, bot checks (never
   bypassed), login forms, off-site redirects, plain-HTTP fallbacks.

Phone and tablet captures use real device screen metrics but keep the honest
`SiteScreenshotTool/1.0` User-Agent with a `Mobile`/`Tablet` hint. With sign-in
enabled, private-network addresses are refused before a job starts and again
on every browser request (so redirects can't reach them either); see
`ALLOW_PRIVATE_TARGETS` in `.env.example`.

## Payments (Paddle)

Plans, prices and limits live in one file: `lib/plans.ts`. The homepage, the
**Plan & billing** page (`/billing`) and every limit check read it.

| Plan | Price | Pages / capture | Devices | Login pages | Schedules | History |
|---|---|---|---|---|---|---|
| Free | $0 | 15 | Desktop | — | — | 10 captures |
| Studio | $9/mo or $90/yr | 150 | All 4 | ✓ | 5 × 25 pages | 100 captures, 10 runs/schedule |
| Agency | $29/mo or $290/yr | 500 | All 4 | ✓ | 25 × 100 pages | 500 captures, 30 runs/schedule |
| Lifetime | $99 once | Studio limits, forever | | | | |

Paddle is the *merchant of record*: it sells to your customers on your behalf
and handles VAT/GST, invoices, refunds and chargebacks worldwide, so you
don't register for sales tax anywhere. Billing stays **off** until all the
Paddle variables are set — then limits apply. Without them every feature is
available (local / self-hosted use).

### Set up (sandbox first)

1. Create a sandbox account at <https://sandbox-vendors.paddle.com/signup>.
2. **Catalog → Products**: create *Studio* (prices: $9 monthly, $90 yearly),
   *Agency* ($29 monthly, $290 yearly) and *Lifetime* ($99 one-time). Copy each
   price ID (`pri_…`) into `PADDLE_PRICE_*`.
3. **Developer tools → Authentication**: create an API key → `PADDLE_API_KEY`,
   and a client-side token → `PADDLE_CLIENT_TOKEN`.
4. **Developer tools → Notifications → New destination**:
   - URL: `https://YOUR-DOMAIN/api/billing/webhook` (for local testing, expose
     port 3000 with a tunnel such as `ngrok http 3000` or `cloudflared`).
   - Events: `subscription.created`, `subscription.updated`,
     `subscription.activated`, `subscription.canceled`, `subscription.past_due`,
     `subscription.paused`, `subscription.resumed`, `transaction.completed`,
     `adjustment.created`, `adjustment.updated`.
   - Copy its secret key → `PADDLE_WEBHOOK_SECRET`.
5. **Checkout → Checkout settings**: set the default payment link to
   `https://YOUR-DOMAIN/billing`. In production, Paddle also asks you to
   verify your website domain.
6. `PADDLE_ENV=sandbox`, restart, and buy a plan from `/billing` with a Paddle
   test card (`4242 4242 4242 4242`, any future date, CVC `100`).

To go live, repeat steps 2–5 in the live dashboard (vendors.paddle.com), set
`PADDLE_ENV=production`, and use the live keys and price IDs. Paddle reviews
new accounts before payouts: have the homepage, pricing, terms of service,
privacy policy and refund policy published on your domain.

### How it works

- Checkout opens Paddle's overlay on `/billing`, with the user's ID attached.
- Paddle calls `/api/billing/webhook` (signature-checked with
  `PADDLE_WEBHOOK_SECRET`); that's the only thing that changes a plan. Records
  are kept in `data/billing.json`.
- Plan changes (Studio ↔ Agency, monthly ↔ yearly) are prorated through
  Paddle's API. Cancelling, invoices and card updates happen in Paddle's
  customer portal ("Invoices & payment method" on `/billing`).
- A cancelled subscription keeps its plan until the paid period ends. A failed
  renewal (`past_due`) keeps access while Paddle retries the card.
- Limits are checked by the API routes (`lib/entitlements.ts`), and scheduled
  runs re-check the owner's plan every time, so a downgrade takes effect on
  the next run.
