// Reads the demo captures, finds the pages that break their template, and prints the round 3 art.
//
//   node design/demo-site/print.mjs <capture dir> <site dir> <art out dir>
//
// Odd-page check (the real one the design proposes): each capture's top 1920 px is reduced to an
// ink-coverage map (where the page is not bare background), the pile's median map is the template,
// and a page's likeness is the weighted Jaccard overlap of its map with the median. Low likeness =
// an odd page; the area that differs most is its diff box.
// Prints, in ShotDomain's inks: each pile's overprint (all its pages' blue plates averaged, set as an
// AM halftone), each odd page's blue and pink plates (shown off register by how unlike it is), a
// sheet of every in-register blog page, and true-colour crops for the opened pile.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const [, , CAP, SITE, ART] = process.argv;
mkdirSync(ART, { recursive: true });
const paths = JSON.parse(readFileSync(join(SITE, 'pages.json'), 'utf8'));
const checks = JSON.parse(readFileSync(join(CAP, 'checks.json'), 'utf8'));
const nameFor = (p) => (p === '/' ? 'home' : p.slice(1).replace(/\//g, '__'));
const pileOf = (p) => (p.startsWith('/blog/') ? 'blog' : p.startsWith('/docs') ? 'docs' : p.startsWith('/product/') ? 'product' : p === '/' ? 'home' : p === '/pricing' ? 'pricing' : 'oneoff');
const BLUE = [0x32, 0x55, 0xa4], PINK = [0xff, 0x48, 0xb0];
const M = 96; // coverage map size

async function load(p, size = 480) {
  const { data, info } = await sharp(join(CAP, 'top', nameFor(p) + '.png')).resize(size, size).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height, dark = new Float32Array(n), tint = new Float32Array(n), ink = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 3] / 255, g = data[i * 3 + 1] / 255, b = data[i * 3 + 2] / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b, sat = Math.max(r, g, b) - Math.min(r, g, b);
    dark[i] = 1 - lum; tint[i] = sat; ink[i] = lum < 0.9 || sat > 0.1 ? 255 : 0;
  }
  return { w: info.width, h: info.height, dark, tint, ink };
}
async function coverage(p) {
  const pg = await load(p);
  const { data } = await sharp(Buffer.from(pg.ink), { raw: { width: pg.w, height: pg.h, channels: 1 } }).resize(M, M, { kernel: 'cubic' }).blur(0.8).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  return Float32Array.from(data, (v) => v / 255);
}
const median = (maps) => { const m = new Float32Array(M * M), col = new Float32Array(maps.length); for (let i = 0; i < M * M; i++) { maps.forEach((c, k) => (col[k] = c[i])); col.sort(); m[i] = col[col.length >> 1]; } return m; };
const likeness = (c, m) => { let mn = 0, mx = 0; for (let i = 0; i < c.length; i++) { mn += Math.min(c[i], m[i]); mx += Math.max(c[i], m[i]); } return mx ? mn / mx : 1; };
function diffBox(c, m) { // bounding box of cells that differ strongly, as fractions of the top square
  let x0 = M, y0 = M, x1 = -1, y1 = -1;
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) if (Math.abs(c[y * M + x] - m[y * M + x]) > 0.55) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { x: x0 / M, y: y0 / M, w: (x1 - x0 + 1) / M, h: (y1 - y0 + 1) / M };
}

// 1. Coverage maps and likeness per pile.
const piles = {};
for (const p of paths) (piles[pileOf(p)] ||= []).push(p);
const DOCS_DONE = 96; // the live screen shows docs mid-capture: the first 96 pages have landed
const data = { piles: {}, note: 'Likeness = weighted Jaccard overlap of a page\'s ink map with its pile\'s median map (top 1920 px of the Desktop capture).' };
const maps = {};
for (const [id, list] of Object.entries(piles)) {
  for (const p of list) maps[p] = await coverage(p);
  if (list.length < 3) { data.piles[id] = { count: list.length, pages: list }; continue; }
  const med = median(list.map((p) => maps[p]));
  const L = list.map((p) => ({ path: p, likeness: likeness(maps[p], med), box: diffBox(maps[p], med) }));
  for (const x of L) x.likeness = Math.min(x.likeness, 1);
  const sorted = L.map((x) => x.likeness).sort((a, b) => a - b), mid = sorted[sorted.length >> 1];
  const mad = L.map((x) => Math.abs(x.likeness - mid)).sort((a, b) => a - b)[L.length >> 1];
  const cut = Math.min(mid - 6 * mad, mid - 0.15); // far below the pile, and at least 15 points below its median
  // What most of the pile shares, so a page's facts can be compared with it.
  const most = (f) => { const n = {}; for (const p of list) { const v = JSON.stringify(f(checks[p])); n[v] = (n[v] || 0) + 1; } return JSON.parse(Object.entries(n).sort((a, b) => b[1] - a[1])[0][0]); };
  const usual = { font: most((c) => c.h1Font), header: most((c) => c.header), sidebar: most((c) => c.sidebar) };
  for (const x of L) {
    const c = checks[x.path], why = [];
    if (c.broken.length) why.push(c.firstImageBroken ? 'Main image missing' : 'Image missing');
    if (c.overflow) why.push(`${{ table: 'Table', pre: 'Code block', img: 'Image' }[c.overflow.tag] || 'Content'} runs off the page`);
    const hd = JSON.stringify(c.header) !== JSON.stringify(usual.header), sb = JSON.stringify(c.sidebar) !== JSON.stringify(usual.sidebar), ft = c.h1Font !== usual.font;
    if (hd || sb || ft) why.push(`Different ${[hd && 'header', sb && 'sidebar', ft && 'fonts'].filter(Boolean).join(' and ')}`.replace(/^Different (\w+) and (\w+) and/, 'Different $1, $2 and'));
    if (!why.length && x.likeness < cut) why.push('Layout differs');
    x.why = why;
    // Box the element behind the first reason (page pixels / 1920, the top square), else the layout diff.
    const R = c.rects || {}, el = c.broken.length ? R.broken : c.overflow ? R.overflow : hd ? R.header : sb ? R.sidebar : ft ? R.h1 : null;
    if (el) x.box = { x: el.x / 1920, y: el.y / 1920, w: el.w / 1920, h: Math.max(el.h, el === R.broken ? 72 : 0) / 1920 }; // a missing image collapses, so box the gap it left
  }
  const odd = L.filter((x) => x.why.length).sort((a, b) => a.likeness - b.likeness);
  // How far the pink plate drifts: by how unlike the pile the page is, at least 4 px for any odd page.
  for (const x of odd) x.drift = Math.max(4, Math.round(Math.min(1, Math.max(0, (mid - x.likeness) / mid)) * 26));
  data.piles[id] = { count: list.length, median: +mid.toFixed(3), cutoff: +cut.toFixed(3), lowestNormal: +Math.min(...L.filter((x) => x.likeness >= cut).map((x) => x.likeness)).toFixed(3),
    odd: odd.map((x) => ({ path: x.path, why: x.why, drift: x.drift, likeness: +x.likeness.toFixed(3), box: x.box && Object.fromEntries(Object.entries(x.box).map(([k, v]) => [k, +v.toFixed(3)])) })),
    pages: list };
  console.log(id, list.length, 'median', mid.toFixed(3), 'cut', cut.toFixed(3), 'odd', odd.map((x) => `${x.path} ${x.likeness.toFixed(3)} ${x.drift}px [${x.why}]`).join(', '), '| lowest normal', data.piles[id].lowestNormal);
}

// 2. Plates. Alpha PNGs in one ink each, so the page can move the pink plate off register.
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 - 0.5); }
async function plate(alpha, w, h, ink, file) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { out[i * 4] = ink[0]; out[i * 4 + 1] = ink[1]; out[i * 4 + 2] = ink[2]; out[i * 4 + 3] = Math.round(clamp(alpha[i]) * 255); }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(join(ART, file));
}
async function pagePlates(p, size, prefix) {
  const pg = await load(p, size), n = pg.w * pg.h, noise = rng(size * 7 + p.length);
  const blue = new Float32Array(n), pink = new Float32Array(n);
  for (let i = 0; i < n; i++) { blue[i] = clamp(Math.pow(pg.dark[i], 0.7) * 1.3 * (1 + noise() * 0.45)); pink[i] = clamp((pg.dark[i] * 0.6 + pg.tint[i] * 1.1) * (1 + noise() * 0.45)) * 0.9; } // grain sits in the ink, never on bare paper
  await plate(blue, pg.w, pg.h, BLUE, prefix + '.blue.webp');
  await plate(pink, pg.w, pg.h, PINK, prefix + '.pink.webp');
}
// Overprint: average blue darkness of the pile's pages, set as a 45 degree AM halftone with ink mottling.
async function overprint(list, size, file) {
  const acc = new Float32Array(size * size);
  for (const p of list) { const pg = await load(p, size); for (let i = 0; i < acc.length; i++) acc[i] += clamp(Math.pow(pg.dark[i], 0.7) * 1.3); }
  const cell = 4.2, k = (2 * Math.PI) / cell, out = new Float32Array(size * size);
  const lowNoise = (x, y) => 0.5 * Math.sin(x * 0.021 + Math.sin(y * 0.017) * 2) * Math.cos(y * 0.013 + x * 0.004);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, v = clamp(Math.pow(acc[i] / list.length, 0.72) * (1 + 0.12 * lowNoise(x, y))); // lift the mid-tones so shared text reads
    const u = (x + y) * Math.SQRT1_2 * k, w = (x - y) * Math.SQRT1_2 * k;
    const t = (Math.cos(u) + Math.cos(w)) / 4 + 0.5; // 0..1 threshold, dots grow into a checker
    out[i] = v > 0.97 ? 0.96 : clamp((v - (1 - t)) / 0.12 + 0.5) * 0.92;
  }
  await plate(out, size, size, BLUE, file);
}

const pick = (id) => data.piles[id];
await overprint(piles.blog, 480, 'f-pile-blog.webp');
await overprint(piles.docs.slice(0, DOCS_DONE), 480, 'f-pile-docs.webp');
await overprint(piles.product, 480, 'f-pile-product.webp');
for (const id of ['home', 'pricing']) await pagePlates(piles[id][0], 240, `f-${id}`);
const oddAll = ['blog', 'docs', 'product'].flatMap((id) => pick(id).odd.map((o) => o.path));
for (const p of oddAll) await pagePlates(p, 400, 'f-odd-' + nameFor(p));
// a few normal pages as single sheets, for landing on the docs pile and for the start screen
for (const p of [...piles.docs.slice(DOCS_DONE, DOCS_DONE + 6), piles.blog[0], piles.product[0]]) await pagePlates(p, 400, 'f-page-' + nameFor(p));

// 3. Every in-register blog page, as one sheet of small blue prints (15 across, 72 px cells).
{
  const normal = piles.blog.filter((p) => !pick('blog').odd.some((o) => o.path === p));
  const C = 72, cols = 15, rows = Math.ceil(normal.length / cols), W = cols * C, H = rows * C, out = new Float32Array(W * H);
  for (const [k, p] of normal.entries()) {
    const pg = await load(p, C), ox = (k % cols) * C, oy = Math.floor(k / cols) * C;
    for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) out[(oy + y) * W + ox + x] = clamp(Math.pow(pg.dark[y * C + x], 0.7) * 1.4);
  }
  await plate(out, W, H, BLUE, 'f-blog-sheet.webp');
  data.blogSheet = { cell: C, cols, rows, count: normal.length, paths: normal };
}

// 4. True colour for the opened pile: Desktop (top 1600 px) and iPhone (top 1500 px at 2x).
for (const p of oddAll) {
  const n = nameFor(p);
  try {
    const d = sharp(join(CAP, 'full', n + '.desktop.webp')); const dm = await d.metadata();
    await d.extract({ left: 0, top: 0, width: dm.width, height: Math.min(dm.height, 1600) }).resize(720).webp({ quality: 84 }).toFile(join(ART, `f-true-${n}.desktop.webp`));
    const ph = sharp(join(CAP, 'full', n + '.iphone.webp')); const pm = await ph.metadata();
    await ph.extract({ left: 0, top: 0, width: Math.min(pm.width, 786), height: Math.min(pm.height, 1500) }) // what the phone shows: 393 px at 2x, even when the page is wider.resize(240).webp({ quality: 84 }).toFile(join(ART, `f-true-${n}.iphone.webp`));
  } catch (e) { console.log('no full capture for', p); }
}
data.paths = paths.length;
writeFileSync(join(ART, 'f-data.json'), JSON.stringify(data, null, 1));
console.log('art written to', ART);
