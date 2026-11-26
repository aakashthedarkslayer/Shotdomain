# Softbound v3: storyboard

**Goal:** beat the v2 benchmark (Softbound B, First glance 8, Wow 7).
**Win conditions**, all four required:
1. The blind critic prefers v3 over v2, and v3 holds its own against award references, in at least 2 of 3 runs.
2. Wow ≥9, judged from **recordings**.
3. ≥60fps on the user's Android phone in a release build.
4. The user says so.

## The world
A sunlit studio shelf. Each note is a **soft-touch clay hardcover**:
- linen cloth with an **illustrated label painted by code**;
- foil title, ribbon bookmark, visible page block.

**Light** comes from a window at the top-right. A **window-frame shadow (gobo)** falls across the clay plinth, and dust motes drift in the beam. The light follows the real clock:
- cool morning;
- warm golden hour, after 16:00;
- lamp-lit night, after 20:00, with the gobo off and a warm desk-lamp pool.

## The 10-second "fall in love" sequence (the first-run autoplay, and the critic's recording)
| t (s) | What you see | Sound | Haptic |
|-|-|-|-|
| 0.0–1.2 | The books drop onto the plinth one by one from above, 90ms apart. Each squashes 6% on landing and springs back, and dust puffs up into the light beam. | a soft *thup* per book, pitch slightly varied | light per landing |
| 1.2–2.4 | Settle. The front book breathes (±0.6° sway, 3.2s period). Ribbons hang still. The gobo drifts slowly. | room tone, very low | — |
| 2.4–4.0 | A ghost finger flicks. The shelf spins with momentum. Each book **leans outward with angular velocity** (centrifugal tilt, up to 7°), ribbons swing (Verlet rope), and the spin snaps into **detents** as each book passes the front. | soft wooden *tick* per detent | selection per detent |
| 4.0–6.6 | Tap the front book. Anticipation: a 3px dip. **Lift arc**, a turn to face you, then the **cover opens on a hinge spring** with a 4° overshoot. The page block **fans** (3–4 pages curl and splay). The camera dollies into the right page as the left page's illustration slides past in parallax. | a cloth *whoosh*, then a page riffle | selection on lift, light on open |
| 6.6–8.4 | Typing: letters press into the paper (debossed ink, wet sheen that dries over 1.2s). The ribbon settles across the page. | a soft pen *scratch* per word | — |
| 8.4–10.0 | Close: the page settles, and the cover claps shut with a small air puff that ruffles the neighbouring ribbons. The book glides back to its slot, and the shelf exhales (1% scale settle). | a soft *clap* | medium on clap |

The demo then rests on the **shelf**, the most beautiful frame.

## CRUD and overview, all physical
| Action | Ritual |
|-|-|
| Create | + drops a fresh blank book from above. It squashes on landing, the label paints itself in (a watercolour bleed reveal of the chosen tag's art), then it opens into the editor. |
| Read | The lift, hinge and dolly sequence above. |
| Update | Type on the page: debossed ink, wet then dry. Tag chips **re-bind** the book: its cloth colour flows across the cover from the spine. |
| Delete | Drag the book down: it sinks into the clay plinth like jelly, and the plinth surface ripples. Undo (5s) pops it back up. The open note's delete button does the same. |
| Search | Matching books rise 8px and catch the light; the others sink 4px and desaturate. |
| Overview (100+ notes) | Pinch out: the camera rises and the shelf becomes a **helix library**, a spiral of books you scroll vertically. Tap one to fly down to it. |
| Theme | The real clock decides. A long-press on the window light cycles morning, golden and night as a preview. |

## Art direction
- **Covers:** painted by our own code (layered SVG scenes run through a painterly WebGL pass: Kuwahara smoothing, edge darkening, pigment granulation, paper grain, wet bleed), all in one style: *soft gouache and watercolour picture-book illustration, pastel, matte, gentle grain, Japanese-inspired calm, no text*.
- **Palette:**
  - cloths: sky #A9C8EE, apricot #F5B98A, blush #EFB3C2, mint #A8DCC4, butter #F3DB8C, lavender #CDBDF2;
  - plinth: clay #E9B98F;
  - wall: #F3ECE3;
  - ink: #2B2A4A.
- **Type:** Bricolage Grotesque for the UI, Newsreader for the page body (15/26, set on the rules).
- **Materials:**
  - linen: sheen 0.6, a weave normal map;
  - label: clearcoat 0.3;
  - foil: metallic 0.9, roughness 0.35;
  - plinth: subsurface-ish wrap lighting.

## Performance budget
- Web: one WebGL renderer, DPR ≤ 2, shadows updated only while something moves, the loop stops when idle.
- Target: 60fps on a mid-range Android device in the Flutter port.
- Sound: WebAudio synthesis (filtered noise and envelopes), no audio files. It starts only after the first gesture, and there is a mute toggle.

## How it's judged
- `record.js` captures each scripted sequence at the highest frame rate available and makes contact sheets every 100ms.
- The critic grades the contact sheets plus key frames, in 3 independent runs, blind A/B against v2.
- The phone check is done by the user.
