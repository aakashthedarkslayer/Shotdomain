# Board brief: ShotDomain

This brief stands on its own. Everything below is what the founder has built or decided; nothing here is a forecast.

## The idea (from founder/idea.md)

- **What it is:** a web app that finds every page of a website (reads sitemap.xml, otherwise crawls links, also links rendered by JavaScript) and screenshots them all, full page, on desktop, tablet and phone in one run, then keeps the screenshots, compares runs over time and shares them.
- **Who it is for:** freelancers, web designers, small web agencies and QA testers who need screenshots of whole client sites: before/after a redesign, client handover, audits, archiving, and monitoring key pages over time.
- **Price (USD, self-serve, Paddle as merchant of record):**
  - Free $0: 15 pages per capture, desktop only, last 10 captures kept.
  - Studio $9/month or $90/year: 150 pages per capture, all 4 devices, pages behind a login, 5 schedules of up to 25 pages, daily/weekly/monthly runs, change alerts by email, last 100 captures kept.
  - Agency $29/month or $290/year: 500 pages per capture, 25 schedules of up to 100 pages, whole-site archives, last 30 runs per schedule, last 500 captures kept.
  - Lifetime $99 one-time: Studio limits forever (positioned as an early-supporter offer).
- **Where and how:** online, worldwide. Sign in with Google. No acquisition channel tested yet.
- **Budget and constraints:** solo founder. Product built and working on the founder's machine; not yet on a public domain; no paying customers; payment provider (Paddle) in sandbox setup. Marketing budget not stated. Hard rule: never bypass CAPTCHAs or bot protection, honest User-Agent, respects robots.txt.

## What the product does today (built and tested)

1. Discovery: sitemap.xml first, crawl fallback (depth 4, 500-page cap), JavaScript-rendered links for logged-in apps; can be limited to a path (e.g. one docs section).
2. Capture: one-click full-page screenshots on Desktop, Tablet, iPhone and Android profiles; lazy-loaded content loaded first; app-shell dashboards expanded to full height; animations settled so runs are comparable; cookie banners hidden; custom hide/click selectors and CSS; ad blocking.
3. Honest notes on each screenshot: HTTP errors, bot checks (shown, never bypassed), login forms, redirects.
4. Pages behind a login without sharing a password: paste a request copied from browser DevTools ("Copy as cURL") or session cookies; an animated guide shows how. Password login is also possible.
5. Schedules: re-capture a list of pages daily/weekly/monthly, pixel-diff each page against the previous run, email when pages change beyond a threshold.
6. Sharing: public links to a capture, one page's timeline, or all runs of a schedule (on/off at any time); ZIP downloads.
7. History per user, profile, Google sign-in, plan limits enforced server-side, Paddle checkout and customer portal, Terms/Privacy/Refund pages (14-day money-back guarantee).

## Cost facts the founder has

- Needs an always-on server running a real Chrome browser (cannot be serverless). Founder's rough estimate: $10–40/month for the server; storage grows with stored screenshots (full-page PNGs ~1–5 MB each; previews ~10 KB).
- Paddle fee is roughly 5% + $0.50 per transaction (founder's understanding; to confirm).

## Decisions and open questions the founder has raised

- Considered dropping history and schedules to price lower; decided against it for now.
- Considered a positioning angle: "your website's time machine — every change of every page, kept" (store only changed screenshots to keep costs low). Not built yet.
- Considered a cheaper "Starter" tier ($4–5) and India-specific local pricing. Not decided.
- Asked whether Agency at $290/year is too expensive.
