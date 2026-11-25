# Homepage screenshots

Real ShotDomain output, used by the worked example on the homepage
(`components/marketing/Sections.tsx`). Nothing here is a mockup.

- `share-desktop.webp`: a ShotDomain share page, captured at 1440 x 900 (2x)
  with Hallmark's `capture.mjs`. The capture it shows is ShotDomain run on its
  own pages (/, /terms, /privacy, /refunds, /login, /signup) on Desktop and
  Mobile (iOS).
- `share-phone.webp`: the same share page at 390 x 844 (2x), its top 600 px.
  Phones get this one, since the desktop capture is unreadable at 375 px.
- `home-mobile-ios.webp`: the top 640 px of `mobile-ios/home.png` from that
  capture (393 px wide at 3x), as ShotDomain wrote it.

To retake them after a visual change: build, start the app in local mode on
port 3000, capture those six pages on Desktop and Mobile (iOS) with full-page
on, share the capture, then capture `/share/<token>` at 1440 x 900 and 390 x 844 and
crop the phone files. Capture twice: the second pass shows the first pass's
images inside the homepage thumbnail. Stop sharing the link afterwards. Check both for personal data before committing.
