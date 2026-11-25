// Prints real ShotDomain frames as two-ink risograph proofs, for the homepage hero.
//
//   node scripts/riso-print.mjs
//
// Reads public/screens/frames/*.webp (real captures, see public/screens/README.md)
// and writes public/screens/riso/*.webp at the same size. Each frame is split
// into two plates: riso blue for the darks and fluorescent pink for the mid-tones
// and colour, the pink set a few pixels off-register as a real riso drum would,
// with ink grain, then both are multiplied onto the paper colour. The colours
// match the paper, riso blue and fluorescent pink tokens in app/globals.css.
import { mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IN = join(ROOT, 'public/screens/frames');
const OUT = join(ROOT, 'public/screens/riso');

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const PAPER = hex('#eef0f3');
const BLUE = hex('#3255a4');
const PINK = hex('#ff48b0');
const OFFSET = { x: 4, y: 3 }; // the pink drum's misregistration, in pixels

// A small, repeatable noise so every build prints the same grain.
function grain(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296 - 0.5;
  };
}

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

async function print(file) {
  const { data, info } = await sharp(join(IN, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const dark = new Float32Array(n);
  const tint = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 3] / 255;
    const g = data[i * 3 + 1] / 255;
    const b = data[i * 3 + 2] / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    dark[i] = 1 - lum;
    tint[i] = sat;
  }
  const noise = grain(w * 31 + h);
  const out = Buffer.alloc(n * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // Blue plate: the darks, pushed a little so type stays crisp.
      const blue = clamp(Math.pow(dark[i], 0.7) * 1.3 + noise() * 0.08);
      // Pink plate: mid-tones and colour, read from the off-register position.
      const sx = Math.min(w - 1, Math.max(0, x - OFFSET.x));
      const sy = Math.min(h - 1, Math.max(0, y - OFFSET.y));
      const j = sy * w + sx;
      const pink = clamp(dark[j] * 0.45 + tint[j] * 0.9 + noise() * 0.1);
      for (let c = 0; c < 3; c++) {
        const v = PAPER[c] * (1 - blue * (1 - BLUE[c])) * (1 - pink * 0.85 * (1 - PINK[c]));
        out[i * 3 + c] = Math.round(clamp(v) * 255);
      }
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 82 }).toFile(join(OUT, file));
  return `${file} ${w}x${h}`;
}

mkdirSync(OUT, { recursive: true });
const files = readdirSync(IN).filter((f) => f.endsWith('.webp'));
for (const f of files) console.log(await print(f));
