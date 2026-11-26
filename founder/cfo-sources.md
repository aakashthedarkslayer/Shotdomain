# CFO sources

| input | value | source |
|---|---|---|
| Price | $9/month | Founder's pricing (lib/plans.ts, homepage) |
| Paddle fee | ~5% + $0.50 per transaction | Founder's understanding from earlier research; **confirm on Paddle's pricing page** |
| Storage | ~3 GB per subscriber x ~$0.15/GB-month | **Estimate.** Full-page PNGs 1-5 MB (founder figure), previews ~10 KB; disk volumes ~$0.10-0.25/GB-month, Cloudflare R2 ~$0.015/GB (earlier estimate in this project) |
| Bandwidth | $0.20 per subscriber-month | **Estimate**; many hosts include bandwidth |
| Server | $40/month | Founder estimate range $10-40; upper end used |
| Domain | ~$15/year | **Estimate** |
| Email | $0 | **Estimate**: free tiers cover low volume |
| Marketing | $0 | Not stated by founder |
| Plan (25 subscribers) and ramp | | **Illustrative assumption**, not a forecast. Panel buy rate was 0/20 |

## Second run additions

| input | value | source |
|---|---|---|
| Object storage | $0.015/GB-month, egress free | [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing) (via search summary; check the page) |
| Full-page PNG size | 1.5 MB mean | **Estimate** (real sites, high-DPI phones; 0.5-3 MB). Local test pages averaged 0.11 MB but are not representative |
| Plan limits for the maxed account | sites, pages, runs kept, history kept, pages per capture | `lib/plans.ts` |
| Scheduled runs stored twice | run folder + copy in history | `lib/scheduler.ts` (step 7), `lib/userData.ts` (`fs.cp`) |
