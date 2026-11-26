# Unit economics: ShotDomain (online SaaS). Unit = one paying Studio subscriber for one month; 'per day' fields are per month here (days_per_month = 1).

Every number below comes from the input file. Nothing is looked up or guessed.

## CFO's note, second run (read this first)

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

## One subscriber-month

| line | per subscriber-month |
| --- | ---: |
| Price | $9.00 |
| Paddle fee, ~5% + $0.50 (founder's understanding; confirm on Paddle's pricing page) | -$0.95 |
| Screenshot storage, ~3 GB per subscriber at ~$0.15/GB-month on a disk volume (ESTIMATE) | -$0.45 |
| Bandwidth for downloads/share links (ESTIMATE) | -$0.20 |
| **Contribution** (what each subscriber-month leaves to pay the fixed costs) | **$7.40** (82%) |

## The margin that matters

Fixed costs: $41 a month (Always-on server running Chrome (founder estimate $10-40; upper end used) $40, Domain (~$15/year, ESTIMATE) $1, Transactional email (free tier at this volume, ESTIMATE) $0, Marketing budget (not stated by founder; set to 0) $0).

- **Break-even: 6 subscriber-months a day.** Below that you lose money every month.
- **Profit margin at your plan** (25 a day): **64%** of every sale, after every cost.

## Year 1, month by month

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

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 64% | 6 | $304 |
| Price -10% | 60% | 7 | $207 |
| Volume -20% | 59% | 6 | $144 |
| Unit costs +15% | 61% | 6 | $278 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
