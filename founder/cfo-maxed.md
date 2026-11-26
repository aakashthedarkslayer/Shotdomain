# CFO: a fully used account (second run)

The board asked to price a maxed account before the first Lifetime sale. This is storage only: the screenshots a plan lets one account keep at once, at its limits in `lib/plans.ts`.

## How it is counted

- Every device is captured: 4 devices on Studio, Lifetime and Agency.
- **Scheduled runs are stored twice.** Each one stays in the schedule's run folder (`runsKept` runs per schedule) and is also copied into capture history (`lib/scheduler.ts` step 7, `fs.cp` in `lib/userData.ts`).
- History keeps `historyKept` **captures**, and one-off captures and scheduled runs share that count. A capture can hold up to `pagesPerRun` pages.
- Size per full-page PNG: **1.5 MB, an estimate** (real sites, high-DPI phones; range about 0.5 to 3 MB). The local test pages averaged 0.11 MB, but they are tiny and not representative. Cost scales in a straight line with this number.
- Prices:
  - Disk volume at $0.15/GB-month, the estimate in `numbers.json`.
  - Object storage at $0.015/GB-month, [Cloudflare R2 Standard](https://developers.cloudflare.com/r2/pricing), with free egress.
- Net revenue is after Paddle's fee (5% + $0.50, founder's understanding: confirm on Paddle's pricing page).

| plan | case | schedule-run PNGs | history PNGs | total PNGs | GB at 1.5 MB | $/mo on disk ($0.15/GB) | $/mo on R2 ($0.015/GB) | net revenue $/mo |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Studio / Lifetime | schedules used daily | 5,000 | 10,000 | 15,000 | 22 | $3.38 | $0.34 | $8.05 |
| Studio / Lifetime | history filled with largest one-off captures | 5,000 | 60,000 | 65,000 | 98 | $14.62 | $1.46 | $8.05 |
| Agency | schedules used daily | 300,000 | 200,000 | 500,000 | 750 | $112.50 | $11.25 | $27.05 |
| Agency | history filled with largest one-off captures | 300,000 | 1,000,000 | 1,300,000 | 1,950 | $292.50 | $29.25 | $27.05 |

**Lifetime** nets $74.55 once. That covers a Studio account used daily for 22 months on disk (221 on R2). At its full limit, it covers 5 months on disk (51 on R2). Storage only; server and bandwidth are extra.

**Daily screenshots with every schedule running daily:** Studio 500 a day, Agency 10,000 a day.

## Reading it

1. **Disk storage cannot carry Agency or a heavy Studio/Lifetime account.** Every heavy case except "Studio used daily" costs more than the plan brings in.
2. **On object storage, every case except Agency at its absolute limit is covered.** Agency at that limit ($29.25 against $27.05) needs a storage cap.
3. **Storing scheduled runs once** (history points at the run instead of copying it) cuts the "schedules used daily" rows by a third for Studio (15,000 to 10,000 PNGs) and 40% for Agency (500,000 to 300,000).
4. **A cap in GB or pages, not captures,** makes the worst case knowable. For example: Studio/Lifetime 30 GB, Agency 250 GB. At R2 prices, a full 30 GB costs $0.45/month and a full 250 GB costs $3.75/month.

Script: `python3 founder/cfo-maxed.py` prints this table; the inputs are the constants at its top. Re-run it with a measured PNG size after the outside test.
