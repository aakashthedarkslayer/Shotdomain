import * as fs from 'fs/promises';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

/** Skip comparing absurdly tall pages (memory): ~60 megapixels per image. */
const MAX_PIXELS = 60_000_000;

interface Bitmap {
  width: number;
  height: number;
  data: Uint8Array;
}

async function decode(file: string): Promise<Bitmap> {
  const buf = await fs.readFile(file);
  if (path.extname(file).toLowerCase() === '.png') {
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height, data: png.data };
  }
  const img = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 1024 });
  return { width: img.width, height: img.height, data: img.data };
}

/**
 * Percentage of the page that changed between two screenshots (0–100).
 * Pixels are compared over the overlapping height; extra height on either
 * side (content added or removed at the bottom) counts as changed.
 * A different width means a different layout: 100%.
 * Returns null when the images can't be compared.
 */
export async function percentChanged(fileA: string, fileB: string): Promise<number | null> {
  try {
    const [a, b] = await Promise.all([decode(fileA), decode(fileB)]);
    if (a.width !== b.width) return 100;
    const maxH = Math.max(a.height, b.height);
    if (a.width * maxH > MAX_PIXELS) return null;
    const minH = Math.min(a.height, b.height);
    const len = a.width * minH * 4;
    const diffPixels = pixelmatch(a.data.subarray(0, len), b.data.subarray(0, len), null, a.width, minH, { threshold: 0.1 });
    const changed = diffPixels + a.width * (maxH - minH);
    return Math.round((changed / (a.width * maxH)) * 10000) / 100; // 2 decimals
  } catch {
    return null;
  }
}
