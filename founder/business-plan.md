# ShotDomain ("One Shot Every Domain") · Business plan

**Verdict: Not yet**

- ✓ Each subscriber-month earns $7.40 before fixed costs (82% contribution).
- ✓ Year 1 operating profit: $304.
- ✗ 0 of 20 simulated buyers buy (0%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $9.00 a subscriber-month |
| Profit margin at plan | 64% per subscriber-month |
| Break-even | 6 subscriber-months a day |
| Year 1 operating profit | $304 |
| Startup spend | $15 |
| Cash needed before it pays for itself | $147 |
| Startup money earned back | month 10 |
| Buyer panel | 0 buy · 20 pass |

## The idea

- What it is: a web app that finds every page of a website (sitemap + crawl) and screenshots them all, full page, on desktop, tablet and phone in one run, then keeps them, compares runs and shares them.
- Who it is for: freelancers, web designers, small web agencies and QA testers who need screenshots of whole client sites (before/after a redesign, client handover, audits, monitoring key pages over time).
- What it sells, at what price: a SaaS subscription. Free $0 (15 pages per capture, desktop only, last 10 captures); Studio $9/month or $90/year (150 pages per capture, all 4 devices, pages behind a login, 5 schedules of 25 pages, change alerts, 100 captures kept); Agency $29/month or $290/year (500 pages per capture, 25 schedules of 100 pages, 30 runs kept, 500 captures kept); Lifetime $99 one-time (Studio limits forever).
- Where and how: online, sold worldwide in USD. Self-serve: sign in with Google, checkout through Paddle (merchant of record, handles VAT/GST). Customers would find it through search and word of mouth (no channel tested yet).
- Budget and constraints: solo founder. Product is built and working locally; not yet hosted on a public domain, no paying customers yet, Paddle sandbox being set up. Marketing budget not stated. Must stay honest: no CAPTCHA solving or bot-detection evasion, honest User-Agent, respects robots.txt.

## Summary

**Verdict: Not yet** (computed by `compile.py`). The economics pass; demand does not. **0 of 20 simulated buyers bought** (bar: 25%).

**What has to change first:** let a stranger see the product work on *their own* site before paying. Then re-run the panel (`/founder-offer`, then `/founder-consumer`).

### The business

ShotDomain screenshots every page of a website on desktop, tablet and phone in one run, and can re-capture and compare pages on a schedule. It is for freelance web designers, small agencies and in-house web/QA staff. Studio $9/month, Agency $29/month, Lifetime $99.

### The three numbers

- **Contribution: $7.40 per $9 subscriber-month (82%).**
- **Break-even: 6 paying subscribers** (fixed costs ~$41/month).
- **Year 1: +$304** on an *illustrative* ramp to 25 subscribers. That ramp is an assumption, not a forecast; no channel or conversion exists yet.

### Where the board and the panel agree

- **The core job is episodic.** Every panelist said some version of "I only need this a few times a year" (board: "two products in one, the main one is episodic").
- **No proof, no trust.** 9 of 20 passed on trust: new, no reviews, "will it work on my clients' sites?" (board: no outside users yet).
- **Price is not the blocker.** Only 1 of 20 passed on price; $9 sits on the panel's indifference price ($9.04).

Where they disagree: the board's Offers lens says *raise* value and price for agencies; the panel's freelancers say even $9 is a subscription they will cancel. Both point to the same answer: sell the ongoing record to agencies, use one-off capture as the free trial.

### Biggest risk

The free tier hides the magic (desktop only, 15 pages). Over half the panel said the one thing that would flip them is **one free run on a real client site with phone screenshots included**. Fix: free tier includes one mobile device, or a one-time free "full run" per account.

### What the founder needs to start

~$147 cash on the CFO's ramp, plus a public deployment. The first real test (from the board): put it in front of 5-10 freelancers/agencies on their own client sites and record the clean-capture rate.

### The one thing to do this week

Deploy it on a real domain and get 5 real web designers to run it on one client site each, with mobile included, and watch.

*The panel is simulated buyers and the numbers are projections; real customers and real quotes confirm them. Not financial, legal or tax advice.*

## What the board said

**Vote: 2 FUND IF, 1 PASS. Average score 4.3 / 10** (Offers 5, Monopoly 3, Product 5).

The lenses are summaries of published frameworks (Offers, from *$100M Offers*; Monopoly, from *Zero to One*; Product, from Isaacson's *Steve Jobs*). They are not those people. Full memos: `board/offers.md`, `board/monopoly.md`, `board/product.md`.

### Risks more than one member raised

1. **Two products in one, and the main one is episodic** (all three). Whole-site capture is a per-project job (redesign, handover, audit). Only monitoring (schedules, diffs, history) gives a reason to keep paying. A buyer can subscribe for one month, capture, and cancel; Lifetime at $99 makes that cheaper still.
2. **No distribution and no proof** (all three). No public domain, no outside users, no tested channel, no marketing budget, customer-acquisition cost unknown.
3. **Commodity positioning** (Offers, Monopoly). The offer is a feature list with page counts, the open questions are all about pricing lower, and nothing is ten times better than the alternatives.
4. **Storage cost vs. price, worst with Lifetime** (all three). Founder's own figures: a full Studio capture can be 600 PNGs at 1–5 MB. Lifetime turns a growing monthly cost into one payment.

Disagreement worth keeping: Monopoly sees no durable advantage at all and passes; Offers and Product think the product is real and would fund it once it is focused and proven. Monopoly and Offers both see the "time machine" history as the only thing that could become sticky; Product warns it is the second product, not the first.

### Conditions (checklist for the rest of the pack)

- [ ] **One buyer, one outcome, one sentence.** Pick the buyer (e.g. agencies handing a redesign to a client) and lead the offer, name, landing page and free tier with that outcome. (Offers, Product) → consumer panel, offer
- [ ] **Know the competitors**: who serves this buyer, at what price, and where ShotDomain is ten times better. (Monopoly, Offers) → competitors
- [ ] **Decide capture vs. monitoring**: which one buyers would keep paying for. (all) → consumer panel
- [ ] **Do not cut price**: drop the $4–5 Starter; test Agency higher with client-facing extras before deciding $290/yr is too much. (Offers) → pricing
- [ ] **Cap or remove Lifetime** until storage cost per user is known. (all) → CFO
- [ ] **Storage and server cost per user at $9** modelled, including a heavy user. (all) → CFO
- [ ] **Free tier shows the magic**: a whole small site on at least two devices. (Product) → offer
- [ ] **At most three price choices** before launch. (Product) → pricing
- [ ] **Outside users before launch**: deploy publicly, watch 5–10 target users run it on their own client sites, record the clean-capture rate. (Product) → launch
- [ ] **One tested channel** that brings paying customers at a recoverable cost; ~10 paying users from the chosen group. (Monopoly, Offers) → marketing, launch

### The strongest version the board can see

Not "screenshots of every page". The strongest version is a **website history service for small web agencies**: point it at each client site once, and it keeps a dated, browsable record of every page on desktop and phone, flags what changed, and gives the client a branded link. The one-off whole-site capture becomes the free trial (it shows the magic in five minutes), and the paid plans sell the ongoing record, priced per client site rather than per page. That differs from the pitch as written, which leads with capture and treats monitoring as an add-on.

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

**0 buy · 20 pass** (0% buy) out of 20 simulated buyers. Seed 172409, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| In-house marketing, web or QA staff at a company | 5 | 0%  (thin) |
| Freelance web designer or developer | 8 | 0% |
| Small web agency owner or project manager (2-15 people) | 7 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Does it by hand today | 5 | 0%  (thin) |
| Would script it | 3 | 0%  (thin) |
| Lifetime-deal hunter | 3 | 0%  (thin) |
| Tight budget | 2 | 0%  (thin) |
| Already pays for a monitoring tool | 2 | 0%  (thin) |
| Client reporting focused | 2 | 0%  (thin) |
| Reads every review | 3 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $92,000 and up | 7 | 0%  (thin) |
| under $75,000 | 6 | 0%  (thin) |
| $75,000 to $92,000 | 7 | 0%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 9 | "I'd run the free tier on one of our sites, but it's desktop only, and mobile is the part I actually care about. I'm not paying for something with no reviews before I've seen it handle our cookie banner and bot protection. I only need full-site screenshots when a project comes up, and my extension gets me through that." (P001) · "I'd run the free 15-page tier on one client site and see what comes back, but I wouldn't pay this month. Full-site captures only come up a few times a quarter for me, and my extension does the job well enough." (P004) |
| habit | 6 | "I can write a Playwright script that crawls the sitemap and shoots every page at mobile and desktop sizes in an afternoon, and it runs on our own machines. Nine dollars a month isn't much, but I'd be paying for something I already have." (P002) · "I only need full-site screenshots now and then, and my browser extension plus the free 15-page tier covers most of my small client sites. I'd try the free plan, but I'm not adding another subscription on my income for something I do a few times a year." (P003) |
| need | 3 | "I hand over a site about once a month, and most of my client sites are well under 15 pages, so the free tier or my browser extension already covers it. If I ever need all devices in bulk, I'd write a quick Playwright script over the sitemap and be done." (P010) · "I only need full-site screenshots now and then, when a project calls for it, and my extension gets it done for free. I'd poke at the free tier, but it's desktop only, and mobile is the view I actually care about, so it wouldn't prove anything to me." (P011) |
| price | 1 | "The lifetime option is the only plan I'd even look at, but $99 for something I'd fire up three or four times a year is steep, and the free tier will probably cover a small client site when I actually need one. I've bought lots of lifetime deals in the $39-$69 range and I'd wait for this one to land there." (P005) |
| quality | 1 | "I already pay for a monitoring tool that watches the few pages I care about. The free tier lets me test it, but it says it never gets past bot protection and says nothing about cookie banners, so half my client sites would probably come back as challenge pages or with a banner over the hero, and that's useless for my portfolio folder." (P015) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |

### What would flip a no

- Letting me run one full mobile and desktop capture of my own site for free, so I can see whether the banner gets dismissed and the pages behind protection actually come out right.
- If my team needed scheduled visual diffs with email alerts across lots of sites and I had no time to maintain scripts, and it ran self-hosted or never touched session cookies, I might pay for it.
- Landing a big client site with 50+ pages where I need every page on mobile and desktop for a before/after. Then I'd pay $9 for one month and cancel.
- A free run on a real client site that comes back clean, with no cookie banner over the content and lazy-loaded images actually rendered, on more than desktop. Then the $99 lifetime would be an easy call.
- A launch lifetime deal around $49-$59 with real reviews from other agency people, or a client project landing that week where I need all devices on a 100-page site.
- A launch lifetime deal around $49-59 with real reviews from other agencies or QA people, plus a clear explanation of how session cookies are stored and deleted.
- Letting the free tier do one full run with iPhone and Android shots on a real client site, so I can see the mobile captures are accurate before paying.
- Seeing it handle cookie banners and lazy-loaded content cleanly on one of my real client sites on the free tier, plus a client asking me for ongoing visual change monitoring that I could bill them for.
- A few months of it running with real reviews from other freelancers, plus a free trial of Studio so I can run a full client site on all devices and compare it with what I use now.
- A client asking for ongoing visual change monitoring that I could bill them for, so the scheduled diff emails pay for themselves.
- A big redesign or audit project landing on my desk where I need every page on iPhone and Android at once. Letting the free tier capture one mobile device would also help, so I could see the quality before paying.
- If the scheduled change-detection emails actually caught a broken client page before the client did, that's something I wouldn't bother building myself, and I'd pay for it, probably the $99 lifetime.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

### What buyers said (20 simulated buyers, `--quick` panel)

Run on all 20 answers: acceptable range **$5.02-$29.20** (`pricing-curve.md`). But 3 lifetime-deal hunters (P005, P006, P020) answered in one-time dollars ($39-$49 "bargain", $99-$129 "expensive"), which mixes units. On the **17 monthly answers** (`pricing-curve-monthly.md`): acceptable range **$3.08-$19.94**, indifference price **$9.04**, median "bargain" $5, "getting expensive" $15, "too expensive" $30. The agency/client-reporting buyers (P014, P018) put "expensive" at $29 and "too expensive" at $49-50.

Lifetime hunters (3 of 3) named **$49-59** as the price they would pay; $99 read as "expensive but possible" to two of them.

### What competitors charge (`competitors.md`)

Stillio: $29/mo for 5 pages to $199/mo for 100 pages (~$3-6 per monitored page per month). CaptureDeck: $49/mo and up. Visualping: $14-35/mo personal, $140/mo business. ShotDomain Studio at $9 for up to 125 monitored pages is far below every dedicated tool found.

### What the business needs (`cfo.md`)

At $9: contribution $7.40, break-even 6 subscribers. At $19: contribution $17.40, break-even 3. Price is the biggest lever; costs are not the constraint.

### Decision

1. **Keep Studio at $9/month** for now. It sits on the panel's indifference price and inside the monthly range. Raising it is not the fix: no simulated buyer said no because of the $9 price; they said no because of trust, habit and need.
2. **Ladder (at most three paid choices, per the board):** Free → Studio $9 → Agency $29. Agency's $29 matches what the client-reporting buyers called "expensive but would buy", and is still at or below Stillio's entry price, but only if Agency gets **client-facing extras** (branded share pages / before-after reports), which two panelists named as the thing that would flip them.
3. **Lifetime:** do not sell it at $99 open-ended. If used at launch, make it a **capped founding batch** (e.g. first 100 buyers) at a price to test between **$59 and $79**, with storage limits.
4. **Opening offer:** instead of a discount, let the free tier **show the magic** (one full capture with a phone device included), which 10+ of 20 panelists named as what would flip them. No fake "was" prices.
5. **What to test with real buyers:** (a) Studio $9 vs $12 on two landing pages; (b) founding Lifetime at $59 vs $79, capped.

### Top price objections, in their words (for marketing)

- "Nine dollars a month isn't much, but I'd be paying for something I already have." (P002)
- "$99 for something I'd fire up three or four times a year is steep ... I'd wait for this one to land [at $39-69]." (P005)
- "I'm not adding another subscription on my income for something I do a few times a year." (P003)

Simulated buyers pick what to test; they are not proof.

## The numbers

Every number below comes from the input file. Nothing is looked up or guessed.

### CFO's note (read this first)

- **The margin:** each $9 Studio subscriber-month leaves **$7.40** (82%) after Paddle's fee, storage and bandwidth. Fixed costs are about **$41/month**, so **6 paying subscribers break even**. At 25 subscribers the margin is 64%.
- **The line to watch is volume, not cost.** The costs here are tiny; the panel's 0-of-20 buy rate is the problem. The 25-subscriber plan and the ramp below are an **illustrative assumption, not a forecast**: no channel, no customer and no conversion rate exist yet. Volume -20% still profits ($144 in year 1) because the base is so small; zero subscribers loses ~$41/month.
- **Cash:** about **$147** before it pays for itself on this ramp (server months before subscribers arrive). The real cash cost is the founder's time, which is not counted.
- **Three ways to improve the margin (each run through the tool):**
  1. Price $19 instead of $9: contribution $17.40, break-even 3 subscribers, year 1 $1,384 vs $304. (The monthly panel answers put "getting expensive" at $15 and the acceptable range up to ~$20.)
  2. Server at $10 instead of $40 (Hetzner-class): fixed costs ~$11/month, break-even 2 subscribers.
  3. Store changed-only screenshots as WebP/JPEG (the "time machine" idea): storage line falls from ~$0.45 toward ~$0.05 per subscriber; small in dollars, but it is what makes Lifetime and Agency safe for heavy users.
- **Lifetime ($99):** after the fee it nets ~$93.55 once. At the estimated $0.65/month storage+bandwidth it covers ~144 months of a *typical* user, but a heavy user (e.g. 150 pages x 4 devices x weekly schedules, full-page PNGs at 1-5 MB) could store tens of GB a year. Cap Lifetime storage or the number sold, as the board asked.
- **Board's money conditions:** storage cost per user is now modelled (estimate) and Lifetime's risk is quantified; "do not cut price" is supported (the tool shows price is the strongest lever). Not met: a tested channel and real conversion.
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
