# ShotDomain: Founder Analysis Report

*Prepared 19 November 2026 with the [founder skill pack](https://github.com/Jakeschincariol/founder-skill). Working files are in this `founder/` folder.*

---

## 1. The verdict

**Not yet.** This verdict is computed by the pack's `compile.py`, not written by hand.

| Check | Result |
|---|---|
| Each subscriber earns money before fixed costs | ✅ $7.40 of every $9 (82%) |
| Year 1 makes an operating profit | ✅ +$304 (on an illustrative ramp) |
| Enough simulated buyers buy (bar: 25%) | ❌ **0 of 20 (0%)** |

**In one sentence:** the economics are healthy and cheap to run, but nobody yet has a reason to pay. Simulated buyers don't trust a new tool they can't see working on their own sites, and they only need whole-site screenshots a few times a year.

**The one thing to do this week:** deploy ShotDomain on a real domain and have 5 web designers each run it on one of their client sites, with mobile screenshots included. Watch what happens.

---

## 2. What was analysed

| | |
|---|---|
| **Product** | A web app that finds every page of a website and screenshots it on desktop, tablet and phone in one run. It can re-capture pages on a schedule, compare runs and email when pages change. It can also capture pages behind a login without a password. |
| **Target customer** | Freelance web designers and developers, small web agencies (2–15 people), in-house web/marketing/QA staff |
| **Pricing tested** | Free (15 pages, desktop only) · Studio $9/mo or $90/yr · Agency $29/mo or $290/yr · Lifetime $99 once |
| **Stage** | Built and working on the founder's machine. Not yet public, no customers, payments in sandbox setup |

**Steps run, in the pack's order:** board → competitors → consumer panel → pricing → CFO → plan. The remaining five skills (offer, marketing, brand, ops, launch) are for building a launch, so they come after the idea passes.

---

## 3. Board of directors

Three reviewers each applied one published framework. The lenses summarise those frameworks; they are not the authors.

| Lens | Based on | Score | Vote |
|---|---|:---:|---|
| Offers | *$100M Offers* | 5/10 | Fund if |
| Monopoly | *Zero to One* | 3/10 | **Pass** |
| Product | Isaacson's *Steve Jobs* | 5/10 | Fund if |
| **Overall** | | **4.3/10** | **2 fund if, 1 pass** |

### Risks all three raised
1. **Two products in one, and the main one is occasional.** Whole-site capture is a per-project job (redesign, handover, audit). Only monitoring gives people a reason to keep paying. Someone can subscribe for one month, capture what they need, and cancel.
2. **No proof and no route to customers.** There are no outside users, no tested channel and no marketing budget, and the cost of winning a customer is unknown.
3. **It is positioned as a commodity.** The offer is a feature list with page counts, and nothing is ten times better than the alternatives.
4. **Storage cost versus price**, worst for Lifetime: a single payment against a cost that keeps growing.

### Where they disagreed
- **Monopoly** sees no lasting advantage and passed.
- **Offers** and **Product** think the product is real and well made, and would fund it once it is focused and proven.
- **Offers** and **Monopoly** both see a growing page history as the only thing that could make customers stay. **Product** warns that history is the second product, not the first.

### The strongest version they could see
A **website history service for small web agencies**. Point it at each client site once, and it keeps a dated, browsable record of every page on desktop and phone, flags what changed, and gives the client a branded link. The one-off whole-site capture becomes the free trial. Paid plans sell the ongoing record, priced per client site rather than per page.

---

## 4. Competitors

*From public sources. This session's network settings blocked the vendors' own pricing pages, so most prices come from search results and review sites. Re-check before relying on them.*

| Competitor | Type | Comparable price | What it does |
|---|---|---|---|
| [Stillio](https://startupstash.com/tools/stillio/) | Direct | $29/mo for 5 pages, $79/mo for 25, $199/mo for 100, from $299/mo unlimited | Scheduled screenshots of URLs you choose |
| [CaptureDeck (Urlbox)](https://urlbox.com/pricing/capturedeck) | Direct | From $49/mo (sources conflict; a $29 plan is also listed) | Bulk screenshots of all pages of a site |
| [Visualping](https://help.visualping.io/en/articles/14476033) | Indirect | Free (5 pages), $14/mo (10 pages), $140/mo (200 pages) | Change monitoring with alerts |
| [PageCrawl.io](https://pagecrawl.io/pricing) | Indirect | Free, $13.33/mo, $83.25/mo | Change monitoring with AI summaries |
| [Percy (BrowserStack)](https://browserstack.com/docs/percy/overview/plans-and-billing) | Indirect | Free 5,000 screenshots/mo; paid figures conflict | Visual testing for developers |
| [Microlink](https://microlink.io/tools/website-screenshot/bulk) | Indirect | Free, up to 25 URLs | Bulk screenshots to a ZIP |
| [Apify actors](https://apify.com/factpipe/website-screenshot.md) | Indirect | ~$2 per 1,000 screenshots | Pay-per-use scripts |
| [GoFullPage](https://gofullpage.com/) | Substitute | Free (paid tiers unconfirmed) | One page at a time in the browser |
| Own Playwright script | Substitute | Free (time) | Do-it-yourself |

**Price context:** Stillio works out to about **$3–6 per monitored page per month**. ShotDomain Studio at $9 covers up to 125 monitored pages, far below every dedicated tool found.

### What their customers complain about
*Read through search summaries, so the evidence is thin.*
1. **False alerts** from ads, cookie banners and floating elements. This is the top complaint about Visualping ([G2](https://www.g2.com/products/visualping/reviews?page=2)). ShotDomain already hides banners and freezes animations before comparing, which is a strength to advertise once it's proven on real sites.
2. **Cost of frequent captures** (Stillio, Visualping).
3. **No instant capture, missing integrations** (Stillio, [Capterra](https://www.capterra.com/p/180739/Stillio/reviews/)).
4. Overall, customers are **satisfied**. The incumbents are not hated.

### The gap
Nothing found combines **automatic page discovery, multiple devices and a kept history at a freelancer price**. But the gap is mostly price and bundling, not a capability nobody else has. The opportunity is buyers priced out of Stillio, not buyers unhappy with it.

### The threat
- **CaptureDeck** could copy ShotDomain fastest: it would only need to add schedules and history.
- **Stillio** could add page discovery and a cheaper plan.
- **Free tools** limit what one-off capture can ever charge.

---

## 5. Consumer panel

20 simulated buyers (the pack's quick mode), each a sub-agent playing one person built from the target-customer profile. **The profile is my reading of your target buyer, not real customer data.**

### Headline: 0 buy, 20 pass

| Why they passed | Buyers | Typical words |
|---|:---:|---|
| **Trust** | 9 | *"I'm not paying for something with no reviews before I've seen it handle our cookie banner and bot protection."* |
| **Habit** | 6 | *"I can write a Playwright script that crawls the sitemap … in an afternoon."* |
| **Need** | 3 | *"I only need full-site screenshots now and then … my extension gets it done for free."* |
| **Price** | 1 | *"$99 for something I'd fire up three or four times a year is steep."* |
| **Quality** | 1 | *"Half my client sites would probably come back as challenge pages or with a banner over the hero."* |

Every segment (freelancers, agencies, in-house staff) and every buying style came back at 0%. With 20 buyers each group is small, but the pattern is consistent.

### What would flip a no
1. **One free run on their own client site, with phone screenshots included.** More than half the panel named this. The Free plan is desktop-only, so it hides the part they care about.
2. **Reviews from other freelancers and agencies.**
3. **A client paying them for ongoing monitoring**, so change alerts pay for themselves.
4. **A client-ready before/after report** with their own logo (agency buyers).
5. **A capped founding Lifetime deal at about $49–59** (lifetime-deal hunters).
6. **A clear explanation of how login sessions are stored and deleted.**

> Simulated buyers lean agreeable, so even a "yes" would be an upper bound. A unanimous "no" is a strong signal about the pitch, but it doesn't prove real people wouldn't buy. Confirm with real people.

---

## 6. Pricing

**Price sensitivity, from the panel's four price answers per buyer (Van Westendorp):**

| | All 20 answers | 17 monthly answers only* |
|---|---:|---:|
| Too cheap below | $5.02 | $3.08 |
| Bargain = expensive at | $12.13 | **$9.04** |
| Too expensive above | $29.20 | $19.94 |
| **Acceptable range** | $5–29 | **$3–20** |

\*Three lifetime-deal hunters answered in one-time dollars, which mixes units, so the monthly-only column is the reliable one.

### Recommendations
1. **Keep Studio at $9/month.** It sits almost exactly on the price where as many buyers call it a bargain as call it expensive. Price isn't the blocker: only 1 of 20 passed on price.
2. **Keep three paid choices at most:** Free, Studio $9, Agency $29. Agency at $29 holds up only if it gets **client-facing extras** (branded share pages, before/after reports).
3. **Lifetime:** stop selling it at $99 with no limit. If you use it at launch, sell a **capped founding batch** (for example the first 100 buyers) at **$59 vs $79**, with storage limits.
4. **Instead of a launch discount,** let the Free plan show what the product can really do: one full capture that includes a phone.
5. **Test with real buyers:** Studio at $9 vs $12 on two landing pages, and founding Lifetime at $59 vs $79.

---

## 7. Unit economics (CFO)

*Unit = one paying Studio subscriber for one month. The fee, storage and server costs are estimates; see `cfo-sources.md`.*

| Per subscriber-month | |
|---|---:|
| Price | $9.00 |
| Paddle fee (~5% + $0.50, to confirm) | −$0.95 |
| Storage (~3 GB at ~$0.15/GB, estimate) | −$0.45 |
| Bandwidth (estimate) | −$0.20 |
| **Contribution** | **$7.40 (82%)** |

| Key numbers | |
|---|---:|
| Fixed costs | ~$41/month (server $40, domain) |
| **Break-even** | **6 paying subscribers** |
| Margin at 25 subscribers | 64% |
| Year 1 operating profit* | +$304 |
| Cash needed before it pays for itself* | ~$147 |
| Startup money earned back* | month 10 |

\*On a ramp to 25 subscribers that is an **illustrative assumption, not a forecast**. No channel or conversion rate exists yet. Your own time is not counted.

### What-ifs (run through the tool)
| Change | Effect |
|---|---|
| Price $19 instead of $9 | Contribution $17.40, break-even 3 subscribers, year 1 +$1,384 |
| Server $10 instead of $40 | Break-even about 2 subscribers |
| Volume −20% | Year 1 still +$144 |
| Store only changed screenshots, compressed | Storage per subscriber falls from ~$0.45 to ~$0.05. Small in dollars, but it makes Lifetime and Agency safe for heavy users |

**CFO's conclusion:** costs aren't the constraint; demand is. At $9 a typical Lifetime buyer is covered for years, but a heavy user could store tens of GB a year, so cap Lifetime.

---

## 8. Recommendations, in priority order

1. **Pick one buyer and one sentence.** The board suggests small agencies: *"a dated record of every client site, on every device, with a link your client can open."*
2. **Let the Free plan show what the product does.** Allow one full run per account that includes a phone screenshot. This is the most-requested change in the panel.
3. **Lead paid plans with monitoring and history**, the reason to keep paying, and use one-off capture as the trial.
4. **Add client-facing value to Agency:** branded share pages and before/after reports.
5. **Cap or reprice Lifetime:** a numbered founding batch at $59–79 with storage limits.
6. **Build proof before marketing:** a public deployment, 5–10 real users on their own client sites, their clean-capture rate, and their quotes as your first reviews.
7. **Explain session security plainly** on the site: how login sessions are encrypted, used and deleted.
8. **Then re-run the panel** with the new pitch, and if it clears the bar, run the remaining skills: offer, marketing, brand, ops, launch.

---

## 9. Limits of this analysis

- **Simulated buyers are not customers.** They lean agreeable, so read any buy rate as an upper bound. The customer profile behind them is my reading, not real data.
- **Only 20 buyers.** Every segment and buying style had fewer than 10, so treat the breakdowns as directional. A 100-buyer run is possible on request.
- **Competitor prices** come from search results and review sites. The vendors' own pricing pages could not be reached from this session. Re-check them.
- **Cost figures are estimates**, and the year-1 ramp is illustrative.
- The board's lenses summarise published frameworks. They are not the authors' views and don't imply endorsement.
- **Not financial, legal or tax advice.**

---

## 10. Files

| File | Contents |
|---|---|
| `summary.md`, `one-pager.md` | Half-page summary and one-page version |
| `business-plan.md` | Everything compiled, with the computed verdict |
| `idea.md`, `board/`, `board.md` | Idea, board brief, three memos, chair's summary |
| `competitors.md`, `competitors.csv` | Competitor map with links |
| `customer.json`, `pitch.md`, `panel/` | Buyer profile, pitch, 20 answers, results |
| `pricing.md`, `pricing-curve*.md` | Price ranges and decision |
| `numbers.json`, `cfo.md`, `cfo-sources.md` | Unit economics and their sources |
