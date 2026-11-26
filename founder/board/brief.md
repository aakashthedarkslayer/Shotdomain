# Board brief: ShotDomain (second meeting)

This brief stands on its own. It describes what the founder has built and decided. Nothing in it is a forecast.

## The business (from founder/idea.md)

- **What it is:** a web service that keeps a dated, browsable record of every page of the websites an agency looks after, on desktop and phone. It captures them, flags what changed between runs, and gives the client a link they can open.
- **Who it is for:** small web agencies (2-15 people) and freelance web designers who look after client sites; secondarily in-house web/QA staff.
- **Homepage headline:** "Every client site. Every page, on record."
- **Prices (USD, self-serve, Paddle as merchant of record):**
  - Free $0: up to 15 pages per capture, desktop and iPhone screenshots, last 10 captures kept.
  - Studio $9/month or $90/year: 5 client sites monitored, 25 key pages each; daily/weekly/monthly runs, every run kept (last 10 per site); change alerts that hide cookie banners and settle animations before comparing; all 4 devices; pages behind a login; up to 150 pages per one-off capture; 100 captures kept.
  - Agency $29/month or $290/year: 25 client sites, 100 pages each; share links with the agency's own name and logo; before/after compare links clients can open (pick any two dates); last 30 runs per site; 500 captures kept; up to 500 pages per one-off capture.
  - Lifetime $79 one-time: Studio limits forever. A founding batch capped at 100 buyers; the number left is shown on the pricing page; sold out means no more sales.
  - 14-day money-back guarantee on any payment.
- **Where and how:** online, worldwide. Sign in with Google. No acquisition channel tested.
- **Constraints:** solo founder. Built and working on the founder's machine; not on a public domain yet; no outside users, no customers, no reviews. Marketing budget not stated. Never bypasses CAPTCHAs or bot protection; honest User-Agent; respects robots.txt.

## What the product does today

1. Finds every page of a site (sitemap, crawl, JavaScript-built links), or a path within it; "Key pages" picks the home page and top-level sections for schedules.
2. Full-page screenshots on Desktop, Tablet, iPhone and Android profiles in one run; waits for fonts, settles animations, loads lazy content, expands dashboards that scroll inside a panel, hides cookie banners.
3. Honest notes on each screenshot (HTTP errors, bot checks shown not bypassed, login forms, redirects).
4. Pages behind a login without a password: paste a request copied from browser DevTools ("Copy as cURL") or session cookies; an animated guide shows how. A plain-language section explains what happens to a pasted session (only login cookies/headers kept; one-off sessions held in memory about an hour; schedule sessions encrypted AES-256-GCM and deleted with the schedule; never logged or shared).
5. Schedules re-capture pages daily/weekly/monthly, pixel-compare each page with the last run and email when change exceeds a threshold.
6. Sharing: links to a capture, one page's timeline (with before/after compare) or all runs of a schedule; Agency links carry the agency's branding; ZIP downloads.
7. Google sign-in, per-user history, plan limits enforced on the server, Paddle checkout and customer portal, Terms/Privacy/Refund pages (business details still to be filled in).
8. The interface was redesigned on a published design system (near-white, black-ink buttons, hairline cards, monospace labels), in light and dark mode.

## Cost facts the founder has

- An always-on server running Chrome: founder's estimate $10-40/month. Storage grows with stored screenshots (full-page PNGs ~1-5 MB; previews ~10 KB).
- Paddle fee roughly 5% + $0.50 per transaction (founder's understanding).
- A first CFO pass (estimates) found: each $9 subscriber-month leaves about $7.40 after fees, storage and bandwidth; fixed costs about $41/month; break-even about 6 paying subscribers.

## History: the first board meeting and what changed

The first meeting voted 2 FUND IF, 1 PASS (average 4.3/10). Its conditions, and the status of each, as facts:

| First-meeting condition | Status |
|---|---|
| One buyer, one outcome, one sentence; lead the landing page and free tier with it | Done: agency-first positioning and headline above |
| Know the competitors | Done in research: Stillio $29/mo for 5 pages to $199/mo for 100 pages; CaptureDeck from $49/mo; Visualping $14-140/mo (change monitoring; main complaint is false alerts); free tools (Microlink up to 25 URLs, GoFullPage extension) for one-off capture |
| Decide capture vs monitoring | Done: paid plans now lead with monitoring and history; one-off capture is positioned as the free trial |
| Do not cut price; give Agency client-facing extras | Done: prices kept; Agency got branded share links and before/after compare |
| Cap or remove Lifetime until storage cost is known | Done: Lifetime is now $79, capped at 100 buyers |
| Model storage/server cost per user | Done (estimates): see cost facts |
| Free tier shows the magic (whole small site on at least two devices) | Done: Free includes desktop + iPhone |
| At most three price choices | Partly: Free, Studio, Agency, plus the capped Lifetime batch |
| Outside users before launch: 5-10 target users on their own client sites, clean-capture rate recorded | Not done |
| One tested channel; ~10 paying users | Not done |

A simulated buyer panel (20 AI-simulated buyers drawn from the target customer) was run on the earlier pitch: 0 of 20 bought. Reasons: trust (9: "new, no reviews, will it work on my clients' sites?"), habit (6: "my extension or own script does this"), need (3: "only a few times a year"), price (1), quality (1). The most repeated thing that would change their mind was a free run on their own client site including phone screenshots. Simulated buyers are not customers.
