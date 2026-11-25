# Paradigm sweep, round 1: ui-critic report (sweep mode)

Sketches: design/paradigms/1-survey-map.png to 6-bound-book.png. Report as returned by the ui-critic agent.

Five of the six mechanics have been seen before somewhere a designer would know.

**1 Survey map: never-seen: NO** (VisualSitemaps already draws a crawled site as a tree of screenshots; picking by lasso and plots filling in during capture are new)
- Art away: a node graph, not the form and grid. Skeleton: new.
- Real app: devices, full page, cookie banners, login session and custom CSS have no place. Picking single pages by lasso is imprecise. There is no place for the ZIP.
- Scale: 400 pages in a radial tree is a tangle unless each district collapses to a block with a page count and opens on zoom.
- Trade-off: you see the shape of the whole site and pick a section in one gesture, but picking three stray pages is slower than ticking a list.

**2 Light table: never-seen: NO** (Aperture's light table and loupe)
- Art away: a 5-column thumbnail grid with captions. Skeleton: standard.
- Real app: setup has no place (domain, picking pages and devices, options, progress, retry). A round loupe previews a 12,000 px page worse than a scrolling viewer. No ZIP.
- Scale: 1,600 frames (400 pages x 4 devices) means drawing every ring by hand, with no select all.
- Trade-off: inspecting is charming, but it is your current results grid with a magnifier on top.

**3 One sentence: never-seen: NO** (Luke Wroblewski's mad-libs forms)
- Art away: the settings form written inline, then the same grid. Skeleton: standard.
- Real app: options read naturally. Picking 40 of 400 pages inside a word's popover is cramped. Progress, retry and results are unchanged.
- Scale: "every page" scales; the page picker behind it does not.
- Trade-off: the clearest, fastest setup and a strong hero, but it is a front door, not an app.

**4 Synced tapes: never-seen: NO** (Polypane and Responsively App sync scrolling across device panes; syncing different pages as hung tapes is new)
- Art away: a sideways strip of tall columns. Skeleton: new.
- Real app: setup has no place. Scissors cropping is a function the product doesn't have. ZIP and share link need a place.
- Scale: 1,600 tapes in one strip can't be used without filtering by section and device.
- Trade-off: the best way to spot a broken footer on every page at once, but it only shows results.

**5 Device dial: never-seen: NO** (the device line-up in "Am I Responsive?" plus the iPod wheel)
- Art away: one page at a time across four device mockups. Skeleton: standard for responsive preview tools.
- Real app: it shows viewports, not the full pages the product sells. Pages are picked one at a time. Options, ZIP and share are missing.
- Scale: 400 stops on one dial is under one degree each, so it needs search.
- Trade-off: the spin is the most screen-recordable moment of the six, and the worst way to move around.

**6 Bound book: never-seen: YES** for this category (flipbooks like Issuu and client galleries like Pixieset exist elsewhere)
- Art away: a page-by-page viewer with device tabs. Skeleton: new.
- Real app: covers the share link and adds client feedback (dog-ears are new scope). Setup, progress and retry are missing. A tall full page doesn't fit a landscape spread.
- Scale: 400 spreads needs a contents index, and flipping only goes one way.
- Trade-off: the most moving thing to send a client, but it is only the output, and a page curl can look like 2011 skeuomorphism.

**Ranking** (client falls in love and it works as a tool): 1 Survey map, 4 Synced tapes, 6 Bound book, 3 One sentence, 5 Device dial, 2 Light table.

**Pick: 1 Survey map.** The only sketch where picking pages, live progress and the share link sit in one place: plots fill in during capture and a failed plot retries on tap; picking by section is how people really choose from 400 pages. Conditions: districts collapse to counted blocks, and a searchable list drawer for exact picks.

**Hybrid worth considering:** the map to pick and capture; opening a district hangs its pages as synced tapes for review; the one sentence becomes the map's caption and rewrites itself as you lasso, giving devices and options their place. The book stays a possible later client view of the share link.

Every sketch, the pick included, is still a direction, not a design. None of this is near the bar yet.

## Orchestrator action

2 Light table, 3 One sentence and 5 Device dial are "Skeleton: standard" (skins, not paradigms), so they are replaced by three new mechanics (sketches 7 to 9) and judged in round 2 below.

# Round 2: ui-critic report on the replacement sketches

**7 Template piles: never-seen: YES** for this category (stacks exist in macOS and Photos, but grouping a site by template and pulling out the pages that break it is new here)
- Art away: group cards above a thumbnail strip. Skeleton: new in structure, because you pick templates, not rows. On screen it is still cards over a row, so it needs a stronger form.
- Real app: devices, options, progress and retry have no place yet. The app can only spot the odd pages after capture, or from the HTML during the crawl. So at picking time the piles are really URL patterns.
- Scale: the best of the nine. 412 pages become 6 decisions.
- Trade-off: you check 3 odd posts instead of 214. But if the detection misses a broken page, the client sees it before you do.

**8 Culling deck: never-seen: NO** (the pick and reject keys in Photo Mechanic and Lightroom)
- Art away: one page in four frames, three buttons and a progress strip, which is a review queue. Skeleton: new for this category, standard for review tools.
- Real app: it covers the ZIP and the link, and adds a fix list (new scope). Setup and capture progress are missing. The frames show viewports, not the full pages the product sells.
- Scale: 400 keystrokes is a chore unless you can keep a whole pile at once.
- Trade-off: the most honest checking tool here, but it turns a 10-second download into a 20-minute review. "Keep all" must stay one press away.

**9 Endless roll: never-seen: NO** (a PDF reader in continuous scroll with a bookmark sidebar; tearing at the perforations is the new part)
- Art away: a sidebar list and one long viewer. Skeleton: standard.
- Real app: it shows one device at a time, so the other three are hidden. Setup, progress and the ZIP have no place.
- Scale: 400 full pages is millions of pixels of scroll; it needs lazy loading and a folding section rail.
- Trade-off: you read the site the way a visitor would, but finding one page or comparing devices is slower than in any other sketch.

**Ranking of the nine** (2, 3 and 5 dropped): 7 Template piles, 1 Survey map, 4 Synced tapes, 8 Culling deck, 6 Bound book, 9 Endless roll.

**Pick: 7 Template piles.** The only mechanic that makes the tool better at 400 pages, not just prettier; "3 posts look different", pulled out for you, is the moment people would screen-record. Condition: the detection must be real (comparing page layouts or the screenshots themselves) and right, or the mechanic lies to the user.

**Best hybrid: piles on the map, reviewed as tapes.** Template piles laid out as the survey map's districts, filling in where they lie during capture; opening a pile hangs its pages as synced tapes across devices, odd pages first; the culling deck's K and F keys work on any tape (kept pages become the link and ZIP, flagged pages a fix list); devices and options live in a one-sentence caption that rewrites itself as you pick. The piles solve scale, the map carries the love and the live progress, the tapes and keys make review fast.

These are grey sketches of mechanics; every direction stays below the bar until it is designed.
