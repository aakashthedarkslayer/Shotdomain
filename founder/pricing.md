# Pricing: ShotDomain (second run)

## What buyers said (the same 20 simulated buyers, new pitch)

Two curves, because two buyers (P005, P020) answered in one-time lifetime prices rather than per month:

| curve | buyers | PMC | OPP | IPP | PME | acceptable range |
|---|---:|---:|---:|---:|---:|---|
| All answers (`pricing-curve.md`) | 20 | $4.35 | $15.07 | $11.96 | $20.13 | $4.35 to $20.13 |
| Monthly answers only (`pricing-curve-monthly.md`) | 18 | $4.02 | $5.08 | $9.14 | $20.01 | $4.02 to $20.01 |
| First run, monthly only | 17 | $3.08 | $3.08 | $9.04 | $19.94 | $3.08 to $19.94 |

The monthly range barely moved: buyers still put a monthly tool like this at about $4 to $20, with indifference near $9. Studio at $9 sits on the indifference price. Agency at $29 is above every buyer's "getting expensive" answer except the two agency owners' (P018 $35; P014 $25 and $49 too expensive).

The one-time answers: P005 $15 / $39 / $79 / $129 and P020 $19 / $49 / $129 / $199 (too cheap / bargain / expensive / too expensive). $79 is P005's "getting expensive" and P020's bargain-to-expensive midpoint.

## What competitors charge (`competitors.md`, unchanged)

- Stillio: $29/month for 5 pages, about $3 to $6 per monitored page.
- Visualping: $14 to $140/month.
- PageCrawl: from $13.33/month.
- Studio: $9 for up to 125 monitored pages, still far below all of them.

## What the business needs (`cfo.md`, `cfo-maxed.md`)

- At $9, a typical subscriber leaves $7.40, so 6 subscribers break even.
- At $12: $10.40, break-even 4.
- At $19: $17.40, break-even 3.
- The new finding is not about price: a fully used Agency or Lifetime account costs more to store on disk than it brings in. Fix storage before changing price.

## Decision

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

## Top price objections, in their words (for marketing)

- "I would never take the $9 a month plan; I'm not adding another subscription for something I only need now and then." (P006, who buys the lifetime)
- "On $29k a year I'm not adding another monthly bill for monitoring I don't really do." (P003)
- What would change their mind: "A pay-per-use option, like a few dollars for one full-site capture on desktop and phone." (P016)

Simulated buyers pick what to test; they are not proof.
