## Overview

ShotDomain prints a proof of a website for your client: every page, on every
device. The interface is that proof, made the way small studios print theirs:
on a risograph, in two spot inks on paper.

- **Two inks on paper.** Riso blue carries the type, the frames and the
  buttons. Fluorescent pink is the second drum: it marks what you pick, where
  you are and keyboard focus, and it is the off-register plate in the prints.
  There is no black anywhere; the darkest thing on the page is deep blue ink.
- **One printed proof.** The hero shows a white proof sheet of real
  ShotDomain frames, printed in the two inks a few pixels off-register, with
  registration marks at its corners. It is the one loud thing on the site.
- **Real colour where it matters.** Everywhere a person judges their own
  output (results, share pages, the worked example), screenshots stay in full
  colour, framed with a blue keyline.
- **Shape says what a thing is.** Printed things (sheets, cards, frames,
  dialogs) are square-cut. Things you press (buttons, inputs, chips, device
  toggles) have a 6 px radius.

## Colours

Light is blue and pink on cool paper. Dark mode prints the same inks on navy
stock.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | Paper `#eef0f3` | Navy `#0e1630` | The page. |
| `--surface` | Sheet `#f8f9fb` | `#141e3e` | Cards, dialogs, inputs. |
| `--subtle` | Tray `#e2e6ee` | `#1f2b57` | Hover, inset regions. |
| `--line` | Rule `#cdd3e0` | `#2a3766` | Hairlines. |
| `--line-strong` | `#93a0bd` | `#44538a` | Stronger rules. |
| `--field-edge` | `#7a88a8` | `#6676ae` | Input borders, 3:1 against paper and sheet. |
| `--fg` | Deep blue `#1c2f63` | `#eef0f7` | Headings and type, 11:1 on paper. |
| `--muted` | `#50648f` | `#a9b4d3` | Secondary type, 5.1:1 on paper. |
| `--faint` | `#566a93` | `#8d99be` | Tertiary type and placeholders, 4.7:1 on paper. |
| `--primary` | Riso blue `#3255a4` | `#8fa9f0` | Buttons, links, keylines. |
| `--accent` | Pink mark `#d61c82` | `#ff5cb8` | Picked, current step, focus ring (4.2:1 on paper). |
| `--accent-text` | `#c4126f` | `#ff8ac9` | Pink as text, 5:1 on paper. |
| `--accent-soft` | `#ffe1f1` | `#3a1840` | A picked row's tint. |
| `--print-pink` | Fluorescent `#ff48b0` | `#ff5cb8` | The second ink as printed: prints, registration marks. Never text. |
| `--frame-no` | `#c4126f` | `#ff8ac9` | Frame numbers. |
| `--warning` | `#7a5b00` on yellow tint | `#ffe24d` | Caution, with riso yellow `#ffe800` as its fill. |
| `--danger` | `#b3203a` | `#ff8a9a` | Errors, always with an icon and words. |

- **Done is blue.** A finished capture is printed, so success uses riso blue,
  not green.
- **`.ink-panel`** is a solid block of deep blue ink in any mode (the ZIP
  listing, the login guide's ShotDomain panels). **`.ink-flip`** is the
  featured price: ink on paper, and a paper sheet on navy stock.
  **`.paper-sheet`** keeps light-mode inks in any mode (the hero proof).
- **No sixth colour.** Paper, the two blues and the pinks carry the site;
  yellow and red appear only for warnings and errors. The login guide's drawn
  DevTools keep Chrome's own greys because they depict Chrome.

## Typography

**Anybody** (variable, width 50 to 150, weight 100 to 900) for everything
people read; **IBM Plex Mono** only for pasted code.

| Role | Width | Weight | Size / leading | Use |
|---|---|---|---|---|
| Poster (`display`) | 62% | 900 | 112 px / 0.88 desktop, 64 px phones | The hero head. |
| Section (`display`) | 62% | 900 | 52 px / 0.88 (40 px phones) | Section heads. |
| Title (`type-head`) | 75% | 900 | 17 to 24 px | Card, dialog and step titles, plan names, prices. |
| Body | 100% | 400 | 16 to 20 px / 1.5 | Paragraphs, at most about 70 characters a line. |
| Caption (`type-cond`) | 75% | 400, 900 for numbers | 12 to 15 px, tabular figures | Frame captions, file names, URLs, counts. |
| Code | IBM Plex Mono | 400 | 12 to 13 px | Pasted cURL, cookie values, custom CSS. |

- Three weights in the whole system: 400 to read, 600 for labels, buttons and
  emphasis, 900 for heads and frame numbers.
- Headlines are sentence case and end with a full stop. No single accented
  word, no italics in a heading, no all-caps labels, no eyebrows.
- Numbers that line up (frame numbers, counts, prices, sizes) use tabular
  figures.

## Layout

- **Left-aligned,** like a poster. The hero is two columns at desktop: the
  head and the form on the left, the proof sheet on the right. Sections align
  to the left edge of a 72 rem (1152 px) container; the stepper and dialogs
  centre.
- **Spacing** on a 4 px base: 8, 12, 16, 24, 32, 48, 64, 96. Sections part by
  96 to 112 px and a hairline; inside a section, head to body 16 px, body to
  the object below 40 to 48 px.
- **Gutters** 16 px on phones, 24 px from 640 px up.

## Shapes and elevation

| Radius | Use |
|---|---|
| none | Sheets, cards, frames, alerts, dialogs, menus: printed things. |
| 6 px (`rounded-md`) | Buttons, inputs, chips, device toggles: things you press. |
| full | Avatars and switches only. |

Flat. Sheets lie on the paper, held by a hairline (`card`) or a blue keyline
(`card-strong`). Only things that float (menus, dialogs, and the hero's proof
sheet lifting off the page) cast a soft, blue-tinted shadow (`card-raised`).
No hard offset shadows.

## Components

- **Proof sheet** (hero): a white sheet, registration marks printed in both
  inks at its corners, two rows of real frames printed by
  `scripts/riso-print.mjs`, each with its frame number in pink and its file
  name in condensed type. Caption: the pages are printed in two inks; real
  screenshots stay in full colour.
- **Buttons:** primary is riso blue with white type, deepening to deep blue
  on hover and taking the pink ink while pressed. Secondary is a sheet with a
  1.5 px blue keyline. Ghost is text that gains a tray on hover. Danger is red
  type with a red keyline. 600 weight; heights 32, 40, 48, and 56 to 64 for
  the hero call.
- **Inputs:** sheet fill, `--field-edge` border, 6 px; focus is the pink
  outline.
- **Picked items:** pink. Checkboxes, a picked page's left rule, a picked
  device, the current step.
- **Stepper:** five square step boxes joined by hairlines; done is solid blue
  with a tick, current is outlined in pink.
- **Results and share pages:** a proof of true-colour prints, each keylined in
  blue, numbered in pink in capture order.
- **Nav:** a paper bar with a hairline under it; links underline on hover;
  the current app section is underlined in pink.

## Motion

- One orchestrated moment: on load, the proof's frames ink in, in order
  (opacity only, about a second in all). With reduced motion they are simply
  there.
- Motion that answers an action is welcome: a dialog opening, a frame inking
  in when its capture finishes, the button taking the pink ink as it is
  pressed.
- Transform and opacity only, never `transition: all`; every animation has a
  reduced-motion fallback.

## Copy

Plain, concrete, from the user's side. Sentence case, active verbs, no filler,
no dashes, no arrows glued to labels. A button says what it does ("Capture
site", "Download ZIP") and the flow keeps that name. Errors say what happened
and how to fix it.

## Do and don't

- **Do** show real ShotDomain output. The hero's prints are real captures
  printed in two inks; everything else is true colour.
- **Do** keep pink for what is picked, current or focused, and for the second
  ink in prints. Never as body text at the fluorescent value.
- **Don't** use black, gradients, glass, glows, soft card shadows or hard
  offset shadows.
- **Don't** use pills, eyebrows, mono labels, middle-dot meta lines or tracked
  capitals.
- **Don't** number things that are not a sequence. Frames in a capture, the
  five capture steps and the four "how it works" steps are sequences; feature
  lists are not.
