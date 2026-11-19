# Unit economics: ShotDomain (online SaaS). Unit = one paying Studio subscriber for one month; 'per day' fields are per month here (days_per_month = 1).

Every number below comes from the input file. Nothing is looked up or guessed.

## CFO's note (read this first)

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
