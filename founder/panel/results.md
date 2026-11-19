# Buyer panel: ShotDomain, a web app that screenshots every page of a website on desktop, tablet and phone, and can re-capture and compare them on a schedule

**2 buy · 18 pass** (10% buy) out of 20 simulated buyers. Seed 172409, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| In-house marketing, web or QA staff at a company | 5 | 40%  (thin) |
| Freelance web designer or developer | 8 | 0% |
| Small web agency owner or project manager (2-15 people) | 7 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Lifetime-deal hunter | 3 | 67%  (thin) |
| Does it by hand today | 5 | 0%  (thin) |
| Would script it | 3 | 0%  (thin) |
| Tight budget | 2 | 0%  (thin) |
| Already pays for a monitoring tool | 2 | 0%  (thin) |
| Client reporting focused | 2 | 0%  (thin) |
| Reads every review | 3 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $92,000 and up | 7 | 14%  (thin) |
| $75,000 to $92,000 | 7 | 14%  (thin) |
| under $75,000 | 6 | 0%  (thin) |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 9 | "I mostly build a site, hand it off and grab before/after shots for my portfolio. The free plan's 15 pages on desktop and iPhone already covers that, so I'd sign up free and not pay. On $29k a year I'm not adding another monthly bill for monitoring I don't really do." (P003) · "What I actually do is grab a before set when a redesign starts and an after set at launch for the portfolio, and the free 15 pages covers that for one site. I don't need daily monitoring and change alerts badly enough to pay this month, so I'd sign up free, try it on a client site and see." (P004) |
| trust | 6 | "It literally says it never gets past bot protection, and half the sites I look after sit behind Cloudflare, so my first question isn't answered, it's confirmed. I'd throw one site at the free tier and see what comes back before I pay anything, and I only need full-site screenshots when a project comes up anyway." (P001) · "I'd sign up for the free tier and point it at one client site to see if the iPhone captures and change alerts are actually accurate, but I'm not paying a brand-new tool with zero reviews in month one. The free plan covers the test, so there's no reason to upgrade until it's proven itself." (P007) |
| habit | 3 | "I can write a Playwright script in an afternoon that crawls our sitemap, takes full-page shots at an iPhone viewport and diffs them, and I already have the CI box to run it on. For one company site I'd rather own that than add another subscription I have to justify." (P002) · "I'd sign up for the free tier and poke at it, but I'm not paying for this. I can write a Playwright script with a cron job in an afternoon, and my clients have never asked me for a dated archive of their pages, so it's not something I can bill them for." (P008) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| price | 1 | "I'd run the free 15-page plan on one site first, and if the captures come out clean I'd grab the $79 lifetime before the 100 spots go, because the 14-day refund covers me. I would never take the $9 a month plan; I'm not adding another subscription for something I only need now and then." (P006) |
| habit | 1 | "A $79 one-time lifetime deal with a 14-day refund is exactly how I buy tools, and the phone captures match how I check our site. I'd run the free 15 pages for a week first, and if the alerts aren't junk I'd grab the lifetime before the 100 spots go." (P020) |

## What would flip a no

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
