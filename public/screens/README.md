# Homepage screenshots

Real ShotDomain output, used by the homepage's proof sheet
(`components/marketing/ProofSheet.tsx`) and worked example
(`components/marketing/Sections.tsx`). Nothing here is a mockup.

They come from one capture: ShotDomain run on its own pages (/, /terms,
/privacy, /refunds, /login, /signup) on Desktop, Tablet and Mobile (iOS),
full-page.

- `frames/<device>-<page>.webp`: the top of each capture, as ShotDomain wrote
  it into `<device>/<page>.png`. Desktop frames are cut at 1920 x 1200 and saved
  at 768 x 480, tablet at 834 x 1112 (saved 360 x 480), iPhone at 393 x 850
  (saved 222 x 480).
- `riso/<device>-<page>.webp`: the same frames printed in the two inks (riso
  blue and fluorescent pink, a few pixels off-register, with grain) by
  `node scripts/riso-print.mjs`. The hero's proof sheet shows these and says
  they are printed; real screenshots stay in full colour everywhere else.
- `share-desktop.webp`: the share page made from that capture, captured at
  1440 x 900 (2x) with Hallmark's `capture.mjs`.
- `share-phone.webp`: the same share page at 390 x 844 (2x), its top 600 px.
  Phones get this one, since the desktop capture is unreadable at 375 px.

To retake them after a visual change: build, start the app in local mode on
port 3000, capture those six pages on Desktop, Tablet and Mobile (iOS) with
full-page on, share the capture, then capture `/share/<token>` at 1440 x 900
and 390 x 844, cut the files as above and run `node scripts/riso-print.mjs`.
Capture twice: the second pass shows
the first pass's frames inside the homepage. Stop sharing the link afterwards,
and check every file for personal data before committing.
