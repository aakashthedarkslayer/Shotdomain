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
