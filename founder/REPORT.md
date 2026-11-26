# ShotDomain: Founder Analysis Report, second run

Second pass of the founder pack after the first report's changes and the UI rebuild, run on 2026-11-19. Same method, same 20 simulated buyers (seed 172409), same competitor research and cost inputs. The first run is kept unchanged in `run-1/`.

## 1. The verdict

**Not yet** (computed by `founder-plan/compile.py`, not written by hand).

| check | run 1 | run 2 |
|---|---|---|
| Each subscriber-month earns money before fixed costs | ✓ $7.40 (82%) | ✓ $7.40 (82%) |
| Year 1 operating profit (illustrative ramp) | ✓ $304 | ✓ $304 |
| Simulated buyers who buy (bar 25%) | ✗ 0 of 20 (0%) | ✗ 2 of 20 (10%) |
| Board average | 4.3 / 10 | 4.7 / 10 |
| Board vote | 2 fund-if, 1 pass | 2 fund-if, 1 pass |

The changes moved every number that desk work can move. The rest needs strangers: proof on real client sites, and a first channel. Read the 10% with care. **Both buyers are in-house staff who hunt lifetime deals; the target customer (agencies and freelancers) is still 0 of 15.**

## 2. What changed between the runs

Run 1's recommendations that were built into the app:

- **Positioning.** Agency-first, "Every client site. Every page, on record."
- **Free tier.** Now includes iPhone as well as desktop.
- **Agency.** Branded share links with the agency's own logo and name, and before/after compare links for clients.
- **Lifetime.** Cut from $99 to $79 and capped at the first 100 buyers.
- **Guarantee and legal.** A 14-day money-back guarantee and legal pages, completed except for the founder's details.
- **Login sessions.** A clear line on how they are encrypted and deleted with the schedule.
- **UI.** Rebuilt on the Vercel-style design system.

Not done, because they can't be done at a desk: a public domain, outside users, reviews, a tested channel.

## 3. Board of directors (`board.md`, `board/`)

| lens | run 1 | run 2 |
|---|---|---|
| Offers (from *$100M Offers*) | 5, fund if | 5, fund if |
| Monopoly (from *Zero to One*) | 3, pass | 4, pass |
| Product (from Isaacson's *Steve Jobs*) | 5, fund if | 5, fund if |

The board checked run 1's conditions: 7 done or partly done, 2 not done (outside users; one tested channel to ~10 paying users). New risks it raised:

1. **The alert is the product and it is untested.** No clean-capture or false-alert rate has been measured on a single outside site.
2. **Retention undercuts "on record".** Studio keeps 10 runs per site and Agency 30, which on a daily schedule is 10 or 30 days. "Runs" and "captures" are two units a buyer can't tell apart.
3. **Free never reaches the paid moment.** It shows a one-off capture, never a second run, an alert or a before/after link.
4. **Storage of a maxed account was not priced.** It now is (section 6), and it is a problem.

**Where they disagreed.**
- Offers calls $9 "cheap by accident" and would test Agency higher. Monopoly says the price gap is no edge at all.
- Monopoly wants a small ShotDomain mark on Agency's branded links, the only built-in way new agencies find the product. That pulls against the white-label value Offers likes.

## 4. Competitors (`competitors.md`)

Unchanged from run 1: same research, same date, no new vendors re-checked.
- The gap is still **price and bundling**: whole-site discovery + multi-device + history at $9, against Stillio's $29 for 5 pages.
- The threat is still CaptureDeck (Urlbox) or Stillio closing that gap in one release.

## 5. Consumer panel (`panel/results.md`)

### Headline: 2 buy, 18 pass (run 1: 0 buy, 20 pass)

| reason | run 1 | run 2 | typical words (run 2) |
|---|:---:|:---:|---|
| Need | 3 | **9** | *"I don't need daily monitoring and change alerts badly enough to pay this month, so I'd sign up free, try it on a client site and see."* (P004) |
| Trust | 9 | 6 | *"It literally says it never gets past bot protection, and half the sites I look after sit behind Cloudflare."* (P001) |
| Habit | 6 | 3 | *"I can write a Playwright script with a cron job in an afternoon, and my clients have never asked me for a dated archive of their pages."* (P008) |
| Price | 1 | 0 | |
| Quality | 1 | 0 | |

**Who bought:** P006 and P020, both in-house web/QA staff who hunt lifetime deals, and both for the $79 Lifetime.
- *"I would never take the $9 a month plan."* (P006)
- *"A $79 one-time lifetime deal with a 14-day refund is exactly how I buy tools."* (P020)

| segment | buyers | run 1 | run 2 |
|---|---:|---:|---:|
| Small agency owner / PM | 7 | 0% | 0% |
| Freelance designer / developer | 8 | 0% | 0% |
| In-house web / QA staff | 5 | 0% | 40% |

**What moved.**
- **Trust objections fell** (9 to 6), as did habit (6 to 3). The guarantee, the free phone captures and the session-storage line answered part of them.
- **Need rose** (3 to 9). The agency-first pitch made clear this is ongoing monitoring, and buyers who capture a few times a year now say so instead of citing trust. That is honest signal, not a regression: they were never going to pay monthly.

### What would flip a no (most repeated)

1. **Clean captures and quiet alerts on their own hardest site**: the Cloudflare one, a logged-in page, the cookie banner really gone, for a few weeks on the free tier. Nearly every buyer said this in some form.
2. **A real branded before/after link they can click before paying**, opened on a phone the way a client would. Both agency owners (P014, P018) named it; the free tier can't show it.
3. **Pay per site.** *"A few dollars per full-site capture, no subscription"* (P016, P017, P019: occasional users).
4. **Reviews** from other freelancers and agencies (19 of 20 answers mention reviews or the lack of them).
5. **An export of all captures**, so the archive outlives the company (P007, P009).
6. **A client paying for a care plan or retainer**, which makes the alerts billable (P003, P010, P011).

> Simulated buyers lean agreeable, so the 10% is an upper bound. A "no" with a reason is the useful output.

## 6. Pricing and unit economics (`pricing.md`, `cfo.md`, `cfo-maxed.md`)

### Price range

| curve | acceptable range | indifference (IPP) |
|---|---|---:|
| Run 1, monthly answers | $3.08 to $19.94 | $9.04 |
| Run 2, monthly answers (18) | $4.02 to $20.01 | $9.14 |
| Run 2, all answers (20) | $4.35 to $20.13 | $11.96 |

$9 is on the indifference price, and no buyer passed on price. **Keep $9.** Test $12 on a second landing page.

### Typical subscriber (unchanged inputs)

- $7.40 contribution (82%), fixed costs ~$41/month, break-even 6 subscribers.
- Year 1: +$304 on an illustrative ramp. Cash needed: ~$147.

### New: a fully used account (the board's request)

Storage only, at an estimated 1.5 MB per full-page PNG:

| account | PNGs kept | on disk ($0.15/GB) | on R2 ($0.015/GB) | net revenue |
|---|---:|---:|---:|---:|
| Studio/Lifetime, schedules daily | 15,000 | $3.38/mo | $0.34/mo | $8.05/mo |
| Studio/Lifetime, at its limits | 65,000 | **$14.62/mo** | $1.46/mo | $8.05/mo |
| Agency, schedules daily | 500,000 | **$112.50/mo** | $11.25/mo | $27.05/mo |
| Agency, at its limits | 1,300,000 | **$292.50/mo** | **$29.25/mo** | $27.05/mo |

- **Lifetime ($79, nets $74.55)** covers a fully used Studio account for **5 months** on disk, 51 months on object storage.
- **The two lifetime buyers said they'd never pay monthly,** so Lifetime trades recurring revenue for cash, on the account type that costs most to store.

## 7. Found in the code during this run

1. **The Studio pricing card overpromises.** It says *"Daily, weekly or monthly runs, every one kept"* (`lib/plans.ts`), but Studio keeps 10 runs per schedule (`runsKept: 10`). The board raised the retention gap. This line makes it a false claim on the pricing page.
2. **Scheduled runs are stored twice.** Each one stays in the schedule's run folder and is copied in full into capture history (`lib/scheduler.ts` step 7, `fs.cp` in `lib/userData.ts`). This adds a third to 40% to schedule storage.
3. **Scheduled runs push one-off captures out of history.** History keeps 100 captures on Studio, shared by one-off captures and scheduled runs. Five daily schedules fill it in 20 days, after which every one-off capture older than that is deleted.
4. **History is counted in captures, not pages or GB.** So one "capture" can be 15 screenshots or 2,000, and the worst case can't be known from the plan.

## 8. Recommendations, in priority order

1. **Run the outside test.** 5-10 agencies or freelancers each put one real client site on a schedule for at least two runs. Measure clean-capture and false-alert rates against a bar set in advance, and publish them. This is the condition every board member and nearly every buyer named. (`/founder-launch`)
2. **Fix storage before selling Lifetime or Agency at volume.**
   - Move screenshots to object storage.
   - Store scheduled runs once.
   - Cap storage per plan in GB, for example Studio/Lifetime 30 GB and Agency 250 GB.
   - Give scheduled runs and one-off captures separate history.
3. **Make the pricing page honest about retention.**
   - Replace "every one kept" with the real number, in one unit.
   - Ideally deepen history with tenure if the storage fix makes it cheap. At R2 prices a full 30 GB costs about $0.45 a month.
4. **Let buyers see the paid moment before paying.**
   - A public sample of a branded before/after link.
   - A short Agency trial on one client site.
   - On Free: one site on a schedule with a second run.
5. **Decide what occasional users are.** Either a one-off paid full-site capture (for example $5), or accept them as Free users and stop counting them as the market. (`/founder-offer`)
6. **Add a full export of captures.** It answers the "what if you shut down" objection, which matters most for Lifetime.
7. **Keep Studio at $9**; test $12. Keep Lifetime capped at 100, and only open it after item 2.
8. **One tested channel to ~10 paying users**, with cost per customer recorded, before any new features. (`/founder-marketing`)

## 9. Limits of this analysis

- **Simulated buyers.** They surface objections and wording; they don't predict real conversion and lean agreeable. Don't use their quotes as testimonials.
- **Board lenses** are summaries of published frameworks, not the people.
- **Competitor prices** come from search results and third-party listings. Vendor sites were blocked from this session, and the research was not re-checked for run 2.
- **Cost estimates.** The PNG size, the disk price and Paddle's fee are estimates or the founder's understanding; confirm them. The 25-subscriber ramp is illustrative, not a forecast.
- Not financial, legal or tax advice.

## 10. Files

| file | what it is |
|---|---|
| `REPORT.md` | this report |
| `summary.md`, `one-pager.md`, `business-plan.md` | the plan (verdict computed by `compile.py`) |
| `idea.md`, `pitch.md`, `customer.json` | what was tested, and on whom |
| `board.md`, `board/` | the board's second meeting, with each memo |
| `panel/` | the 20 buyer cards, briefs, answers and results |
| `pricing.md`, `pricing-curve.md`, `pricing-curve-monthly.md` | price range and decision |
| `cfo.md`, `cfo-maxed.md`, `cfo-maxed.py`, `numbers.json`, `cfo-sources.md` | unit economics, maxed-account storage and their inputs |
| `competitors.md`, `competitors.csv` | competitor map (from run 1) |
| `run-1/` | the first run, unchanged |
