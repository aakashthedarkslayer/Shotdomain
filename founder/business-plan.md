# ShotDomain ("One Shot Every Domain") · Business plan

**Verdict: Not yet**

- ✓ Each subscriber-month earns $7.40 before fixed costs (82% contribution).
- ✓ Year 1 operating profit: $304.
- ✗ 2 of 20 simulated buyers buy (10%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $9.00 a subscriber-month |
| Profit margin at plan | 64% per subscriber-month |
| Break-even | 6 subscriber-months a day |
| Year 1 operating profit | $304 |
| Startup spend | $15 |
| Cash needed before it pays for itself | $147 |
| Startup money earned back | month 10 |
| Buyer panel | 2 buy · 18 pass |

## The idea

- What it is: a web service that keeps a dated, browsable record of every page of the websites an agency looks after, on desktop and phone: it captures them, flags what changed between runs, and gives the client a link they can open.
- Who it is for: small web agencies (2-15 people) and freelance web designers who look after client sites; secondarily in-house web/QA staff.
- What it sells, at what price: SaaS, USD. Free $0 (15 pages per capture, desktop + iPhone, last 10 captures). Studio $9/month or $90/year (5 client sites monitored x 25 key pages, daily/weekly/monthly runs kept, change alerts, all 4 devices, pages behind a login, 150 pages per one-off capture). Agency $29/month or $290/year (25 client sites x 100 pages, share links with the agency's own logo and name, before/after compare links for clients, 30 runs kept per site, 500 pages per one-off capture). Lifetime $79 one-time, founding batch capped at 100 buyers (Studio limits forever).
- Where and how: online, worldwide, self-serve. Sign in with Google; Paddle checkout (merchant of record). No acquisition channel tested yet.
- Budget and constraints: solo founder. Built and working on the founder's machine; not yet on a public domain; no outside users, customers or reviews yet. Marketing budget not stated. Never bypasses CAPTCHAs or bot protection; honest User-Agent; respects robots.txt.

## Summary

**Verdict: Not yet.** 2 of 20 simulated buyers buy (10%), against a bar of 25%. The money checks pass:

- Each $9 Studio subscriber-month leaves $7.40 (82%).
- 6 subscribers break even.
- Year 1 shows +$304 on an illustrative ramp to 25 subscribers, which is not a forecast.

First run: 0 of 20.

**What it is.** A web service that keeps a dated record of every page of a client's site on desktop and phone. It finds the pages, re-captures them on a schedule, flags what changed and gives the client a link. It is for small agencies and freelancers who look after client sites. Free covers 15 pages on two devices; Studio is $9, Agency $29, and Lifetime $79 once (first 100 buyers).

**What has to change, and which skill changes it:**

1. **Proof on real sites**, the top blocker for both the board and the panel.
   - Trust: 6 buyers passed on it, the same theme as run 1's 9.
   - Habit: 3 can script it themselves.
   - Every "what would flip me" answer asks to see clean captures and quiet alerts on their own hardest site first.
   - Fix: `/founder-launch`. Run 5-10 outside agencies over two scheduled runs and publish the clean-capture and false-alert rates.
2. **Need: 9 buyers only capture a few times a year**, up from 3 in run 1.
   - The agency-first pitch made the monitoring explicit, and occasional users now say outright that it's not for them.
   - Fix: `/founder-offer`. Either a one-off full-site capture they can pay for, or accept them as Free users and stop counting them as the market.
3. **Agency buyers can't see what they'd pay for.**
   - Both agency owners would pay for branded before/after links but can't see one before paying.
   - Fix: `/founder-offer`. Add a public sample link and a short Agency trial.
4. **Storage before Lifetime and Agency.**
   - A fully used Agency account on the current disk storage costs ~$112-292 a month against $27 net.
   - Lifetime $79 covers a maxed Studio account for 5 months.
   - Scheduled runs are stored twice.
   - Fix: `/founder-cfo` and code. Object storage, GB caps, store runs once.

**Board and panel agree** that nothing desk work can change remains: proof, and a first channel, need strangers. The board rose from 4.3 to 4.7 and every desk condition is met. **They disagree** on price: Offers calls $9 "cheap by accident", the panel's monthly range is $4 to $20, and no buyer passed on price.

**Biggest risk.** The only sales came from lifetime-deal hunters who said they would never take the monthly plan. A Lifetime launch could sell out the cap to people who never become recurring revenue, on the account type that costs most to store.

**What the founder needs to start.** About $147 of cash on the illustrative ramp, plus a public domain and the legal pages completed. The first test is an outside one: real agencies on their own client sites.

**This week:**
- Recruit 5 agencies or freelancers to put one real client site on a schedule.
- Fix the double storage of scheduled runs and add a storage cap before selling Lifetime.

These are simulated buyers and projected numbers; real customers confirm them. Not financial, legal or tax advice.

## What the board said

**Vote: 2 FUND IF, 1 PASS. Average score 4.7 / 10** (Offers 5, Monopoly 4, Product 5).
First meeting: 2 FUND IF, 1 PASS, average 4.3 (Offers 5, Monopoly 3, Product 5).

The lenses are summaries of published frameworks (Offers, from *$100M Offers*; Monopoly, from *Zero to One*; Product, from Isaacson's *Steve Jobs*). They are not those people. Memos: `board/offers.md`, `board/monopoly.md`, `board/product.md`; the first meeting is in `run-1/`.

### The board's read in one line

Every condition that could be met at a desk has been met; the two that need strangers (outside users, paying users) have not, and they are the only ones that create proof. The score moved only where desk work could move it.

### Risks more than one member raised

1. **No proof, no distribution** (all three). Still no public domain, no outside user, no channel, no customer. Trust was the top reason simulated buyers passed. Unchanged since the first meeting.
2. **The alert is the product and it is untested** (Product, Monopoly, Offers). Fewer false alerts than Visualping is the one claim that could become real know-how, but no clean-capture or false-alert rate has been measured on a single outside site.
3. **Retention caps undercut "on record"** (Monopoly, Product). Studio keeps 10 runs per site, Agency 30: on a daily schedule that is 10 or 30 days, so leaving costs little and "every page, on record" overpromises. Product also notes "runs" and "captures" are two units a buyer can't tell apart.
4. **The free tier shows one-off capture, not the paid moment** (Product, with Offers' "monitoring pays off weeks after signup"). Free never sees a second run, an alert or a before/after link.
5. **Storage of a maxed account is not priced** (Offers, Product). A full Studio/Lifetime account could hold ~5,000 full-page PNGs (5-25 GB); Agency far more. The CFO priced only a typical $9 subscriber.

Disagreements kept: Offers calls the $9 price "cheap by accident" (looks like a hobby next to Stillio's $29 for 5 pages) and would test Agency higher; Monopoly sees the price gap as no edge at all because an incumbent can close it by editing a page. Monopoly also wants a ShotDomain mark on Agency's branded links (the only built-in way new agencies discover it), which pulls against the white-label value Offers likes.

### Conditions (checklist)

- [ ] **Go live** on a public domain with the legal pages completed. (Product, Offers) → launch
- [ ] **5-10 outside agencies/freelancers** on their own client sites over at least two scheduled runs; record **clean-capture and false-alert rates**, ideally against Visualping on the same pages, against a bar set in advance. Fix what breaks before any channel spend. (all) → launch
- [ ] **Let Free reach the paid moment:** one site on a schedule, a second run, one before/after compare, at a size the CFO approves. (Product) → offer, CFO
- [ ] **Deeper history** that grows with tenure (e.g. a year per site) if the CFO shows it is affordable; count retention in one unit and make it match the headline. (Monopoly, Product) → CFO, offer
- [ ] **Price a maxed account** (Studio/Lifetime and Agency) and cap Lifetime storage before the first Lifetime sale, or pause Lifetime until the outside test is done. (Offers, Product) → CFO
- [ ] **An outcome guarantee** in the users' words ("if it can't capture your client's site cleanly, you pay nothing") that the CFO signs off. (Offers) → offer, CFO
- [ ] **One tested channel** to ~10 paying users with cost per customer recorded, before new features. (Offers, Monopoly) → marketing, launch
- [ ] Decide whether Agency's branded links carry a small ShotDomain mark. (Monopoly) → offer

### The strongest version the board can see

Unchanged in direction, sharper in what's missing: a **client-facing website history service for small agencies**, where the trial already shows the payoff (a site on a schedule, a second run, a before/after link the agency can forward to its client) and the paid plans sell depth of history that becomes harder to leave every month. What separates this from a desk exercise is a measured clean-capture and false-alert rate on real client sites. None of the three members will move further without it.

## The competition

Researched 2026-11-19 from public sources via web search. **Limit:** this session's network blocks direct visits to vendor sites (stillio.com, visualping.io, gofullpage.com, screenshotone.com could not be reached), so most prices come from search results and third-party listings, not the vendors' own pricing pages. Where sources disagree it says so. Re-check each vendor's pricing page before relying on a number.

### The table (most direct first)

| Competitor | Type | Comparable price | What it sells |
|---|---|---|---|
| [Stillio](https://startupstash.com/tools/stillio/) | Direct | $29/mo for 5 pages; $79/mo for 25; $199/mo for 100; from $299/mo unlimited | Scheduled screenshots of chosen URLs, daily/weekly/monthly ([Capterra](https://www.capterra.com/p/180739/Stillio/) lists a 14-day trial) |
| [CaptureDeck by Urlbox](https://urlbox.com/pricing/capturedeck) | Direct | $49/mo (100 pages at a time, 3,000 captures/mo); $99/mo; $299/mo. Another listing shows a $29 entry plan: conflicting | Bulk screenshots of all pages of a site, no code ([Urlbox guide](https://urlbox.com/docs/guides/bulk-website-screenshots)) |
| [Visualping](https://help.visualping.io/en/articles/14476033) | Indirect | Free (5 pages); $14/mo (10 pages); $35/mo (20 pages); $140/mo (200 pages) | Change monitoring with visual comparison and alerts |
| [PageCrawl.io](https://pagecrawl.io/pricing) | Indirect | Free; $13.33/mo ($160/yr); $83.25/mo ($999/yr) | Change monitoring with AI summaries |
| [Percy (BrowserStack)](https://browserstack.com/docs/percy/overview/plans-and-billing) | Indirect | Free 5,000 screenshots/mo; paid figures conflict ([Argos comparison](https://argos-ci.com/blog/visual-testing-pricing)) | Visual regression testing for developers, inside CI |
| [Microlink bulk tool](https://microlink.io/tools/website-screenshot/bulk) | Indirect | Free, up to 25 URLs at a time | Paste URLs, get a ZIP |
| [Apify screenshot actors](https://apify.com/factpipe/website-screenshot.md) | Indirect | ~$2 per 1,000 screenshots (one listing) | Pay-per-use scripts; you bring the URL list |
| [GoFullPage](https://gofullpage.com/) | Substitute | Free; paid tiers reported at $10–25/mo by [Toolradar](https://toolradar.com/tools/gofullpage/pricing) (unconfirmed) | One page at a time, in the browser |
| Manual / own script | Substitute | Free (hours) | Screenshot each page by hand, or a Playwright script |

### Price range for the comparable job

**Recurring screenshots of a set of pages (the monitoring job):** lowest $13.33/mo (PageCrawl, monitoring-first), median about $35–79/mo, highest $299+/mo (Stillio Top Shot). Per page, Stillio charges about **$3.16–5.80 per monitored page per month** ($29/5, $79/25, $199/100). ShotDomain Studio is $9/mo for up to 125 monitored pages (5 schedules × 25): far below every dedicated screenshot-archive tool found.

**One-off whole-site capture:** free (Microlink up to 25 URLs, GoFullPage page by page) to $49/mo (CaptureDeck Basic), or ~$2 per 1,000 shots on Apify.

### Positioning map

Axes: **one-off capture ↔ ongoing record** and **developer tool ↔ no-code for designers/agencies**.

```
                       no-code (designers, agencies, marketing)
                                     |
   Microlink (free, 25 URLs)         |        Stillio ($29-299/mo, per page)
   GoFullPage (1 page)               |        Visualping ($14-140/mo, alerts)
   CaptureDeck ($49+/mo, bulk)       |        PageCrawl ($13+/mo, alerts)
                 ShotDomain today ---+--- ShotDomain if "website history"
 one-off capture --------------------+-------------------- ongoing record
   Apify (~$2/1k shots)              |        Percy (CI visual testing)
   own Playwright script             |
                                     |
                             developer tools
```

ShotDomain today sits in the middle: it does both jobs, at a price lower than the no-code ongoing-record tools.

### What their customers complain about

Evidence is thin: review sites could only be read through search summaries.

1. **False alerts / noise in change monitoring** (Visualping; recurring on G2, "dozens" of reviews per the summary). Causes named: ads, cookie banners and floating elements triggering alerts. [G2](https://www.g2.com/products/visualping/reviews?page=2), [SpotSaaS](https://www.spotsaas.com/product/visualping/reviews)
2. **Price for frequent captures** (Stillio, Visualping). "the cost is expensive for the more frequent screen shots" (Stillio reviewer); "it gets a bit pricey if you run high-frequency checks on dozens of items" (Visualping reviewer). [Capterra Stillio](https://www.capterra.com/p/180739/Stillio/reviews/), [G2 Visualping](https://www.g2.com/products/visualping/reviews?page=3) — *thin: under three reviews each*
3. **No instant capture / missing integrations** (Stillio): "possibility to create a screenshot immediately", Zapier and Google Drive requests, no file-type choice. [Capterra](https://www.capterra.com/p/180739/Stillio/reviews/) — *thin*
4. **Setup friction with hosts / bot protection** (Stillio): one user had to whitelist Stillio with their hosting provider. [Capterra](https://www.capterra.com/p/180739/Stillio/reviews/) — *thin*
5. **Overall satisfaction is high**: Stillio reviewers often wrote "I have yet to see any cons"; Visualping about 4.6/5 on ~390 G2 reviews. The incumbents are not hated.

### The gap

What nobody found does well, tied to the evidence:

1. **Whole site, found automatically, on several devices, kept as a record, at a freelancer price.** Stillio and Visualping monitor URLs you type in, priced per page ($3–6 per page per month at Stillio). CaptureDeck and Microlink capture lists but do not keep a monitored history for a small buyer. ShotDomain's discovery + multi-device + history at $9 sits in an empty corner.
2. **Fewer false alerts.** ShotDomain already hides cookie banners and settles animations before comparing, which targets the top complaint against Visualping directly. Unproven on real sites.
3. **Pages behind a login without sharing a password** (cURL / cookie paste). No competitor found advertises this; evidence for demand is absent, not negative.
4. **Instant capture alongside schedules**, which a Stillio reviewer asked for. ShotDomain has it.

Honest caveat: the gap is mostly **price and bundling**, not a capability nobody else has. Stillio's customers are satisfied; the gap is buyers priced out of Stillio, not buyers unhappy with it.

### The threat

- **CaptureDeck (Urlbox)** could copy ShotDomain fastest: it already does bulk whole-site capture on its own screenshot API and would only need schedules and history.
- **Stillio** could add sitemap discovery and a cheap tier in a release; it already owns the "automated screenshot archive" position and has reviews.
- **Free tools** (Microlink, GoFullPage, an AI-written Playwright script) cap what one-off capture can charge.

## The buyer panel

**2 buy · 18 pass** (10% buy) out of 20 simulated buyers. Seed 172409, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| In-house marketing, web or QA staff at a company | 5 | 40%  (thin) |
| Freelance web designer or developer | 8 | 0% |
| Small web agency owner or project manager (2-15 people) | 7 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Lifetime-deal hunter | 3 | 67%  (thin) |
| Does it by hand today | 5 | 0%  (thin) |
| Would script it | 3 | 0%  (thin) |
| Tight budget | 2 | 0%  (thin) |
| Already pays for a monitoring tool | 2 | 0%  (thin) |
| Client reporting focused | 2 | 0%  (thin) |
| Reads every review | 3 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $92,000 and up | 7 | 14%  (thin) |
| $75,000 to $92,000 | 7 | 14%  (thin) |
| under $75,000 | 6 | 0%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 9 | "I mostly build a site, hand it off and grab before/after shots for my portfolio. The free plan's 15 pages on desktop and iPhone already covers that, so I'd sign up free and not pay. On $29k a year I'm not adding another monthly bill for monitoring I don't really do." (P003) · "What I actually do is grab a before set when a redesign starts and an after set at launch for the portfolio, and the free 15 pages covers that for one site. I don't need daily monitoring and change alerts badly enough to pay this month, so I'd sign up free, try it on a client site and see." (P004) |
| trust | 6 | "It literally says it never gets past bot protection, and half the sites I look after sit behind Cloudflare, so my first question isn't answered, it's confirmed. I'd throw one site at the free tier and see what comes back before I pay anything, and I only need full-site screenshots when a project comes up anyway." (P001) · "I'd sign up for the free tier and point it at one client site to see if the iPhone captures and change alerts are actually accurate, but I'm not paying a brand-new tool with zero reviews in month one. The free plan covers the test, so there's no reason to upgrade until it's proven itself." (P007) |
| habit | 3 | "I can write a Playwright script in an afternoon that crawls our sitemap, takes full-page shots at an iPhone viewport and diffs them, and I already have the CI box to run it on. For one company site I'd rather own that than add another subscription I have to justify." (P002) · "I'd sign up for the free tier and poke at it, but I'm not paying for this. I can write a Playwright script with a cron job in an afternoon, and my clients have never asked me for a dated archive of their pages, so it's not something I can bill them for." (P008) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| price | 1 | "I'd run the free 15-page plan on one site first, and if the captures come out clean I'd grab the $79 lifetime before the 100 spots go, because the 14-day refund covers me. I would never take the $9 a month plan; I'm not adding another subscription for something I only need now and then." (P006) |
| habit | 1 | "A $79 one-time lifetime deal with a 14-day refund is exactly how I buy tools, and the phone captures match how I check our site. I'd run the free 15 pages for a week first, and if the alerts aren't junk I'd grab the lifetime before the 100 spots go." (P020) |

### What would flip a no

- The free tier giving me clean desktop and iPhone captures of my actual sites, including the protected ones and a logged-in page, with the cookie banner really gone.
- A version that runs on my own machine or in our CI so the session cookies never leave our network, with the hosted part only for storing captures and sending the before/after links.
- Landing two or three maintenance retainers where clients want proof of what changed. Then $9 a month for Studio, or the $79 lifetime if it's still open, pays for itself, as long as the free plan shows me the alerts aren't junk.
- If the free run captures my hardest client site cleanly (the Cloudflare one with the logged-in area, no cookie banner in the shot) and before/after compare came with Studio, I'd grab the $79 lifetime.
- A lifetime deal around $49 that covers more client sites, with some real reviews or a public track record so I believe it'll still be running in two years.
- The free tier catching a real change on a client site that I'd have missed, plus some proof the company will stick around, like real users or an export of my capture history so I'm not locked in if it shuts down.
- Seeing it capture a real client site that's behind Cloudflare and a cookie banner on the free tier without me babysitting it, or a client asking for before/after reports I could charge for. If either happened, the $79 lifetime deal would be an easy yes.
- A couple of months of the free tier catching real changes on a client site without false alerts, plus a way to export or download all my captures so the archive survives even if they go under.
- If a client started paying me for an ongoing care plan where I have to prove nothing broke each month, the change alerts and a before/after link I can send them would earn the $9.
- If I took on a few maintenance retainers where clients expect a monthly record and change alerts, a link I can send them would earn its keep, and the $79 lifetime would get me to pay once the free tier had proved the phone captures are accurate.
- A client actually asking for monthly visual proof of their site, or getting burned by a change I missed, so the $79 lifetime Studio deal pays for itself on one job.
- A few weeks of free-tier alerts on a real client site that only flagged real changes, plus a branded before/after link a client actually found useful. That would make the Agency plan worth more than my script.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

### What buyers said (the same 20 simulated buyers, new pitch)

Two curves, because two buyers (P005, P020) answered in one-time lifetime prices rather than per month:

| curve | buyers | PMC | OPP | IPP | PME | acceptable range |
|---|---:|---:|---:|---:|---:|---|
| All answers (`pricing-curve.md`) | 20 | $4.35 | $15.07 | $11.96 | $20.13 | $4.35 to $20.13 |
| Monthly answers only (`pricing-curve-monthly.md`) | 18 | $4.02 | $5.08 | $9.14 | $20.01 | $4.02 to $20.01 |
| First run, monthly only | 17 | $3.08 | $3.08 | $9.04 | $19.94 | $3.08 to $19.94 |

The monthly range barely moved: buyers still put a monthly tool like this at about $4 to $20, with indifference near $9. Studio at $9 sits on the indifference price. Agency at $29 is above every buyer's "getting expensive" answer except the two agency owners' (P018 $35; P014 $25 and $49 too expensive).

The one-time answers: P005 $15 / $39 / $79 / $129 and P020 $19 / $49 / $129 / $199 (too cheap / bargain / expensive / too expensive). $79 is P005's "getting expensive" and P020's bargain-to-expensive midpoint.

### What competitors charge (`competitors.md`, unchanged)

- Stillio: $29/month for 5 pages, about $3 to $6 per monitored page.
- Visualping: $14 to $140/month.
- PageCrawl: from $13.33/month.
- Studio: $9 for up to 125 monitored pages, still far below all of them.

### What the business needs (`cfo.md`, `cfo-maxed.md`)

- At $9, a typical subscriber leaves $7.40, so 6 subscribers break even.
- At $12: $10.40, break-even 4.
- At $19: $17.40, break-even 3.
- The new finding is not about price: a fully used Agency or Lifetime account costs more to store on disk than it brings in. Fix storage before changing price.

### Decision

1. **Keep Studio at $9** until real buyers say otherwise. No simulated buyer passed on price; they passed on need (9), trust (6) and habit (3).
2. **Lifetime is the only thing that sold** (2 of 2 buyers, both lifetime-deal hunters). Keep it capped at 100 and $79, but:
   - Do not sell it until storage has a GB cap and lives in object storage (CFO).
   - Expect it to take buyers who would never pay monthly.
   - Track how many Lifetime buyers would otherwise have stayed free.
3. **Agency at $29 needs proof before it needs a new price.** Both agency owners named a real branded before/after link they can open as the thing that would flip them (P014, P018). The free tier can't show it. Add a public sample link and a short Agency trial on one site before testing a different price.
4. **A pay-per-site option** came up from three in-house and freelance buyers who need captures a few times a year (P016, P017, P019): "a few dollars per full-site capture". Test it as a one-off add-on (for example $5 for one full site on all devices), not a new plan, so the ladder stays at three paid choices.
5. **What to test with real buyers:**
   - Studio at $9 vs $12 on two landing pages.
   - Lifetime $79 with a 30 GB cap vs no Lifetime, measuring monthly sign-ups.
   - A $5 one-off full-site capture.

### Top price objections, in their words (for marketing)

- "I would never take the $9 a month plan; I'm not adding another subscription for something I only need now and then." (P006, who buys the lifetime)
- "On $29k a year I'm not adding another monthly bill for monitoring I don't really do." (P003)
- What would change their mind: "A pay-per-use option, like a few dollars for one full-site capture on desktop and phone." (P016)

Simulated buyers pick what to test; they are not proof.

## The numbers

Every number below comes from the input file. Nothing is looked up or guessed.

### CFO's note, second run (read this first)

- **Same typical subscriber as the first run.** The inputs did not change (`numbers.json`), so each $9 Studio subscriber-month still leaves **$7.40** (82%) after Paddle's fee, storage and bandwidth. Fixed costs are about **$41/month**, so **6 paying subscribers break even**. The 25-subscriber plan and the ramp are an **illustrative assumption, not a forecast**.
- **New: a fully used account, as the board asked** (`cfo-maxed.md`). The current disk storage cannot carry heavy accounts:
  - **Agency** with all 25 schedules running daily stores about 500,000 PNGs (~750 GB at an estimated 1.5 MB each). On disk at $0.15/GB that is **~$112/month against $27.05 net revenue**. With history filled by 500-page one-off captures it is ~1.95 TB, **~$292/month**.
  - **Studio** with its history filled by 150-page captures: ~98 GB, **~$14.62/month against $8.05 net**. Used normally (schedules only) it costs ~$3.38, which is fine.
  - **Lifetime ($79)** nets $74.55 once. That pays for only **5 months** of a fully used Studio account on disk, or about 51 months on object storage.
  - On object storage at Cloudflare R2's listed $0.015/GB-month, the same accounts cost about a tenth as much: Agency daily ~$11.25, Agency at its absolute limit ~$29.25 (still slightly above its net revenue), Studio at its limit ~$1.46.
- **Two things in the code make this worse:**
  1. Every scheduled run is stored **twice**, once in the schedule's run folder and again as a copy in capture history (`lib/scheduler.ts` step 7, `fs.cp` in `lib/userData.ts`).
  2. The history limit counts **captures, not pages**, so one capture can be 15 pages or 2,000 screenshots.
- **What makes heavy accounts safe, in order:**
  1. Store screenshots in object storage, not on the server's disk.
  2. Keep scheduled runs once (history points at the run instead of copying it).
  3. Cap storage per plan in GB or pages, for example Agency 250 GB and Studio 30 GB.
  4. Keep only pages that changed, or store them as WebP.
  Until 1 and 3 are done, the CFO would not sell Agency or Lifetime to a heavy user.
- **Compute.** A fully used Agency account makes 10,000 screenshots a day; Studio makes 500. At an estimated few seconds per full-page shot, one maxed Agency account could use a large part of the single always-on server's day. Measure real capture time on the outside test before selling Agency at volume.
- **Price levers (same tool):** at $12 a subscriber-month leaves $10.40 and break-even is 4; at $19 it leaves $17.40 and break-even is 3. The panel's acceptable range is about $4 to $20 a month.
- **Lifetime is a cash decision, not a margin one.** The cap of 100 limits it to $7,455 net, and the panel's two buyers were both lifetime-deal hunters who said they would *never* take the monthly plan. Every Lifetime sale is likely a buyer who will never pay monthly.
- Not financial or tax advice: have an accountant check the structure and tax before money moves. Revenue is before tax; Paddle adds VAT/GST at checkout.

### One subscriber-month

| line | per subscriber-month |
| --- | ---: |
| Price | $9.00 |
| Paddle fee, ~5% + $0.50 (founder's understanding; confirm on Paddle's pricing page) | -$0.95 |
| Screenshot storage, ~3 GB per subscriber at ~$0.15/GB-month on a disk volume (ESTIMATE) | -$0.45 |
| Bandwidth for downloads/share links (ESTIMATE) | -$0.20 |
| **Contribution** (what each subscriber-month leaves to pay the fixed costs) | **$7.40** (82%) |

### The margin that matters

Fixed costs: $41 a month (Always-on server running Chrome (founder estimate $10-40; upper end used) $40, Domain (~$15/year, ESTIMATE) $1, Transactional email (free tier at this volume, ESTIMATE) $0, Marketing budget (not stated by founder; set to 0) $0).

- **Break-even: 6 subscriber-months a day.** Below that you lose money every month.
- **Profit margin at your plan** (25 a day): **64%** of every sale, after every cost.

### Year 1, month by month

| month | subscriber-months a day | revenue | profit | cumulative (after $15 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$41 | -$56 |
| 2 | 1 | $9 | -$34 | -$90 |
| 3 | 2 | $18 | -$26 | -$117 |
| 4 | 3 | $27 | -$19 | -$136 |
| 5 | 4 | $36 | -$12 | -$147 |
| 6 | 6 | $54 | $3 | -$144 |
| 7 | 8 | $72 | $18 | -$126 |
| 8 | 10 | $90 | $33 | -$93 |
| 9 | 13 | $117 | $55 | -$38 |
| 10 | 16 | $144 | $77 | $39 |
| 11 | 20 | $180 | $107 | $145 |
| 12 | 25 | $225 | $144 | $289 |

- **Year 1 operating profit: $304** on $972 of revenue.
- After the $15 startup spend: $289.
- Startup money earned back: month 10.
- Cash you need before it pays for itself: **$147**.

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 64% | 6 | $304 |
| Price -10% | 60% | 7 | $207 |
| Volume -20% | 59% | 6 | $144 |
| Unit costs +15% | 61% | 6 | $278 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.

## Not done yet

- The offer: run /founder-offer
- Marketing: run /founder-marketing
- Brand: run /founder-brand
- Operations: run /founder-ops
- Launch plan: run /founder-launch

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
