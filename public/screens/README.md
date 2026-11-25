# Homepage screenshots

Real ShotDomain output, used by the worked example on the homepage
(`components/marketing/Sections.tsx`). Nothing here is a mockup.

- `share-desktop.webp`: a ShotDomain share page, captured at 1440 x 900 (2x)
  with Hallmark's `capture.mjs`. The capture it shows is ShotDomain run on its
  own pages (/, /terms, /privacy, /refunds, /login, /signup) on Desktop and
  Mobile (iOS).
- `home-mobile-ios.webp`: the top 760 px of `mobile-ios/home.png` from that
  capture (393 px wide at 3x), as ShotDomain wrote it.

To retake them after a visual change: build, start the app in local mode on
port 3000, capture those six pages on Desktop and Mobile (iOS) with full-page
on, share the capture, then capture `/share/<token>` at 1440 x 900 and crop
the phone file. Check both for personal data before committing.
