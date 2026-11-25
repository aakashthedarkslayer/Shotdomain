## Overview

ShotDomain photographs a website: every page, on every device. What it hands
back is a contact sheet, the photographer's proof sheet where every frame of a
roll sits side by side so you can pick the good ones. The interface borrows
that object and nothing else from photography.

- **The page is proof paper.** A cool, slightly grey white. Not cream, not
  pure white.
- **Screenshots sit in film.** Real captures are held in black film strips
  with sprocket holes along the edges and frame numbers printed on the film
  in edge amber. Film is the one bold object; it appears where frames really
  are (the hero strip, the results sheet, the share page), never as
  decoration.
- **Red china marker means picked.** Photographers circle the frames they
  want in red. Here red marks what you picked, the step you are on, and
  keyboard focus. Errors use the same red family with an icon and words, so
  colour is never the only signal.
- **Everything else is quiet.** Black type on paper, hairline rules, flat
  prints. No gradients, no glass, no soft card shadows.

## Colours

Light ("proof paper") is the default. Dark mode is the darkroom: the same
structure on black, with the marker turned up to a safelight red.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | Proof paper `#f2f3ef` | `#000000` | The page. |
| `--surface` | Print `#fbfbf9` | `#141513` | Cards, dialogs, inputs: prints lying on the sheet. |
| `--subtle` | Tray `#e7e9e3` | `#1e1f1c` | Hover, inset regions, chips. |
| `--line` | Rule `#d6d8d1` | `#2a2b28` | Hairlines. |
| `--line-strong` | `#a3a79f` | `#4a4c47` | Print edges, secondary button borders. |
| `--field-edge` | `#858981` | `#6f726b` | Input borders, 3:1 against paper and print. |
| `--fg` | Film `#000000` | `#ecede8` | Type, the primary action. |
| `--muted` | Fixer `#5c605b` | `#a2a59e` | Secondary text, 5.7:1 on paper. |
| `--faint` | `#6a6e68` | `#8c8f88` | Tertiary text and placeholders, 4.7:1 on paper. |
| `--accent` | Marker `#d4241b` | Safelight `#ff5b4f` | Picked, current step, focus ring. |
| `--accent-text` | `#b11d15` | `#ff7a70` | Marker red as text (6.2:1 on paper). |
| `--accent-soft` | `#fbe3e1` | `#3a1412` | A picked row's tint. |
| `--edge-print` | Amber `#f0a830` | Amber `#f0a830` | Frame numbers. Only ever on film. |
| `--warning` | `#8a5300` | `#f0a830` | Caution text. |
| `--danger` | `#b11d15` | `#ff7a70` | Error text, always with an icon. |

- **Done is black.** A finished capture is developed, not green. The success
  token is ink.
- **Film in any mode.** `.band-dark` is a piece of film: black with paper type
  in light and dark mode. `.band-flip` (the featured price) is film on paper
  and turns to paper in the darkroom.
- **Never a sixth colour.** Paper, print, film, fixer grey, edge amber and
  marker red carry the whole site. The drawn DevTools in the login guide keep
  Chrome's own greys because they depict Chrome.

## Typography

One family, **Archivo** (variable, width 62 to 125, weight 100 to 900). Its
width axis carries the voice:

| Role | Width | Weight | Size / leading | Tracking | Use |
|---|---|---|---|---|---|
| Display | 125% (`display`) | 800 | 76 px / 0.98 at desktop, 44 px on phones | -0.03em | The hero head. |
| Section | 125% (`type-wide`) | 800 | 36 px / 40 | -0.025em | Section heads. |
| Title | 125% (`type-wide`) | 800 | 17 to 20 px | -0.01em | Card and dialog titles, step titles. |
| Body | 100% | 400 | 16 to 18 px / 1.5 | 0 | Paragraphs, at most about 70 characters a line. |
| Caption | 75% (`type-narrow`) | 400, or 800 for frame numbers | 13 to 15 px, tabular figures | 0 | Frame captions, file names, URLs, counts. |
| Code | Geist Mono | 400 | 12 to 13 px | 0 | Pasted cURL, cookie values, custom CSS. Nothing else. |

- Three weights in the whole system: 400 for reading, 600 for labels,
  buttons and emphasis, 800 for headings and frame numbers.
- Headlines are sentence case and end with a full stop. No single accented
  word, no italics in a heading.
- No eyebrows, no all-caps labels, no tracked capitals. A section opens on its
  heading.
- Numbers that line up (frame numbers, counts, prices, sizes) use tabular
  figures.

## Layout

- **Left-aligned.** A contact sheet is read left to right, top to bottom. The
  hero, the sections and the app screens align to the left edge of a 72 rem
  (1152 px) container; only the stepper and dialogs centre.
- **Spacing** on a 4 px base: 8, 12, 16, 24, 32, 48, 64, 96. Sections part by
  96 to 112 px; inside a section, heading to body 16 px, body to the object
  below 40 to 48 px.
- **The sheet grid.** Frames sit in a grid with 16 px gutters (24 px at
  desktop), 3 across at desktop, 2 on tablets, 1 on phones; every frame keeps
  its capture's aspect, cropped from the top.
- **Gutters** 16 px on phones, 24 px from 640 px up.

## Shapes

| Radius | Value | Use |
|---|---|---|
| `rounded-xs` | 2 px | Frames (screenshots in film), step boxes, checkboxes. |
| `rounded-sm` | 4 px | Prints: cards, badges, alerts. |
| `rounded-md` | 6 px | Controls: buttons, inputs, menus, dialogs. |
| `rounded-full` | | Avatars and switches only. |

There is one button shape. The `pill` prop on `Button` is the marketing call:
the same 6 px shape, set a step heavier.

## Elevation

Flat. Prints lie on the sheet and are held by a hairline (`card`) or a
stronger edge (`card-float`). Only things that float over the page (menus,
dialogs) cast a shadow (`card-elevated`). The film strip has no shadow; its
blackness is the depth.

## Components

- **Film strip** (`film-strip`, `sprockets`): the black base, a row of
  sprocket holes cut along the top and bottom edges (the holes show the page
  through), frames 2 px round, and under each frame its number in edge amber
  and its file name in narrow paper-coloured type. One strip in the hero; the
  results sheet and the share page use the same frame treatment.
- **Buttons:** primary is film black with paper type (paper with black type
  in the darkroom); secondary is print with a strong edge that turns black on
  hover; ghost is text that gains a tray on hover; danger is marker text on
  print. 600 weight. Heights 32, 40, 48; the hero call is 64 to 72.
- **Inputs:** print fill, `--field-edge` border, 6 px; hover darkens the edge;
  focus is the marker-red outline.
- **Checkboxes and picked items:** marker red. A picked page, device or frame
  is marked red; nothing else is.
- **Switch:** film black when on.
- **Segmented control:** the active option is a black chip.
- **Stepper:** five square step boxes joined by hairlines. Done is black with
  a tick, current is outlined in marker red, the rest are outlines.
- **Nav:** paper bar with a hairline under it. Links are plain text that
  underlines on hover; the current app section is underlined in marker red.
- **Badges:** 4 px, a step smaller than body, sentence case.

## Motion

- One orchestrated moment: on load, the hero strip's frames develop in order
  (opacity only, about 1.2 s in all). With reduced motion they are simply
  there.
- Motion that answers an action is welcome: a dialog opening, a picked frame
  getting its mark, a frame developing when its capture finishes.
- Transform and opacity only, never `transition: all`. Every animation has a
  reduced-motion fallback.

## Copy

Plain, concrete, from the user's side: what happens, in their words. Sentence
case, active verbs, no filler, no dashes, no arrows glued to labels. A button
says what it does ("Capture site", "Download ZIP") and the flow keeps that
name. Errors say what happened and how to fix it.

## Do and don't

- **Do** show real ShotDomain output. Every frame on the marketing pages is a
  real capture from `public/screens/`.
- **Do** keep film for frames. A black panel that holds no screenshots is a
  code or file listing (the ZIP tree), never decoration.
- **Do** use red only for what is picked, current or focused, and for errors
  with their icon.
- **Don't** add gradients, glass, glows or soft card shadows.
- **Don't** use pills, eyebrows, mono labels, middle-dot meta lines or
  tracked capitals.
- **Don't** number things that are not a sequence. Frames in a capture and the
  five capture steps are sequences; feature lists are not.
