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
