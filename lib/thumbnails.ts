import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

/**
 * Small JPEG previews next to each screenshot ("home.png.thumb.jpg"), so
 * grids and lists don't download multi-megabyte full-page PNGs. Made right
 * after a capture, and on demand for older files. Never included in ZIPs.
 */

export const THUMB_SUFFIX = '.thumb.jpg';
export const THUMB_WIDTH = 480;
/** Tall full-page images are cropped to this height (top of the page). */
export const THUMB_MAX_HEIGHT = 720;

export function isThumbFile(name: string): boolean {
  return name.endsWith(THUMB_SUFFIX);
}

const inFlight = new Map<string, Promise<string | null>>();

/**
 * Path of the thumbnail for `imagePath`, creating it if needed. Returns null
 * when the image can't be read or decoded (callers then serve the original).
 */
export function thumbnailFor(imagePath: string): Promise<string | null> {
  const existing = inFlight.get(imagePath);
  if (existing) return existing;
  const job = makeThumbnail(imagePath).finally(() => inFlight.delete(imagePath));
  inFlight.set(imagePath, job);
  return job;
}

async function makeThumbnail(imagePath: string): Promise<string | null> {
  const thumb = `${imagePath}${THUMB_SUFFIX}`;
  try {
    await fs.access(thumb);
    return thumb;
  } catch {
    // not made yet
  }
  try {
    const meta = await sharp(imagePath).metadata();
    if (!meta.width || !meta.height) return null;
    const width = Math.min(THUMB_WIDTH, meta.width);
    const height = Math.min(Math.round((meta.height * width) / meta.width), THUMB_MAX_HEIGHT);
    const tmp = `${thumb}.${process.pid}.tmp`;
    await sharp(imagePath)
      .resize({ width })
      .extract({ left: 0, top: 0, width, height })
      .jpeg({ quality: 74, mozjpeg: true })
      .toFile(tmp);
    await fs.rename(tmp, thumb);
    return thumb;
  } catch (err) {
    console.warn(`[thumbnails] could not make a preview for ${path.basename(imagePath)}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Serve `imagePath` or, when `wantThumb`, its preview (falling back to the original). */
export async function imageResponse(imagePath: string, wantThumb: boolean, headers: Record<string, string>): Promise<Response> {
  let file = imagePath;
  let type = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
  if (wantThumb) {
    const thumb = await thumbnailFor(imagePath);
    if (thumb) {
      file = thumb;
      type = 'image/jpeg';
    }
  }
  const data = await fs.readFile(file);
  return new Response(new Uint8Array(data), { headers: { 'Content-Type': type, ...headers } });
}
