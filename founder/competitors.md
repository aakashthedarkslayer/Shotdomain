# Competitors: ShotDomain

Researched 2026-11-19 from public sources via web search. **Limit:** this session's network blocks direct visits to vendor sites (stillio.com, visualping.io, gofullpage.com, screenshotone.com could not be reached), so most prices come from search results and third-party listings, not the vendors' own pricing pages. Where sources disagree it says so. Re-check each vendor's pricing page before relying on a number.

## The table (most direct first)

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

## Price range for the comparable job

**Recurring screenshots of a set of pages (the monitoring job):** lowest $13.33/mo (PageCrawl, monitoring-first), median about $35–79/mo, highest $299+/mo (Stillio Top Shot). Per page, Stillio charges about **$3.16–5.80 per monitored page per month** ($29/5, $79/25, $199/100). ShotDomain Studio is $9/mo for up to 125 monitored pages (5 schedules × 25): far below every dedicated screenshot-archive tool found.

**One-off whole-site capture:** free (Microlink up to 25 URLs, GoFullPage page by page) to $49/mo (CaptureDeck Basic), or ~$2 per 1,000 shots on Apify.

## Positioning map

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

## What their customers complain about

Evidence is thin: review sites could only be read through search summaries.

1. **False alerts / noise in change monitoring** (Visualping; recurring on G2, "dozens" of reviews per the summary). Causes named: ads, cookie banners and floating elements triggering alerts. [G2](https://www.g2.com/products/visualping/reviews?page=2), [SpotSaaS](https://www.spotsaas.com/product/visualping/reviews)
2. **Price for frequent captures** (Stillio, Visualping). "the cost is expensive for the more frequent screen shots" (Stillio reviewer); "it gets a bit pricey if you run high-frequency checks on dozens of items" (Visualping reviewer). [Capterra Stillio](https://www.capterra.com/p/180739/Stillio/reviews/), [G2 Visualping](https://www.g2.com/products/visualping/reviews?page=3) — *thin: under three reviews each*
3. **No instant capture / missing integrations** (Stillio): "possibility to create a screenshot immediately", Zapier and Google Drive requests, no file-type choice. [Capterra](https://www.capterra.com/p/180739/Stillio/reviews/) — *thin*
4. **Setup friction with hosts / bot protection** (Stillio): one user had to whitelist Stillio with their hosting provider. [Capterra](https://www.capterra.com/p/180739/Stillio/reviews/) — *thin*
5. **Overall satisfaction is high**: Stillio reviewers often wrote "I have yet to see any cons"; Visualping about 4.6/5 on ~390 G2 reviews. The incumbents are not hated.

## The gap

What nobody found does well, tied to the evidence:

1. **Whole site, found automatically, on several devices, kept as a record, at a freelancer price.** Stillio and Visualping monitor URLs you type in, priced per page ($3–6 per page per month at Stillio). CaptureDeck and Microlink capture lists but do not keep a monitored history for a small buyer. ShotDomain's discovery + multi-device + history at $9 sits in an empty corner.
2. **Fewer false alerts.** ShotDomain already hides cookie banners and settles animations before comparing, which targets the top complaint against Visualping directly. Unproven on real sites.
3. **Pages behind a login without sharing a password** (cURL / cookie paste). No competitor found advertises this; evidence for demand is absent, not negative.
4. **Instant capture alongside schedules**, which a Stillio reviewer asked for. ShotDomain has it.

Honest caveat: the gap is mostly **price and bundling**, not a capability nobody else has. Stillio's customers are satisfied; the gap is buyers priced out of Stillio, not buyers unhappy with it.

## The threat

- **CaptureDeck (Urlbox)** could copy ShotDomain fastest: it already does bulk whole-site capture on its own screenshot API and would only need schedules and history.
- **Stillio** could add sitemap discovery and a cheap tier in a release; it already owns the "automated screenshot archive" position and has reviews.
- **Free tools** (Microlink, GoFullPage, an AI-written Playwright script) cap what one-off capture can charge.
