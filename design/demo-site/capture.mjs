// Captures the demo site the way ShotDomain does: the Desktop and iPhone 14 Pro presets from
// lib/devices.ts and the honest User-Agent, never a browser's.
//
//   node design/demo-site/capture.mjs <site dir> <out dir> [path ...]
//
// Every page: the top 1920 x 1920 of the Desktop capture, scaled to 480 px (for the piles and the
// odd-page check). The paths named after the out dir (the odd pages and a few normal ones) also get
// full-page Desktop and iPhone captures in true colour.
import { chromium, devices } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const [, , SITE, OUT, ...FULL] = process.argv;
const UA = 'SiteScreenshotTool/1.0 (+local dev tool)';
const paths = JSON.parse(readFileSync(join(SITE, 'pages.json'), 'utf8'));
const fileFor = (p) => 'file://' + join(SITE, p === '/' ? 'index.html' : p.slice(1) + '/index.html');
const nameFor = (p) => (p === '/' ? 'home' : p.slice(1).replace(/\//g, '__'));
mkdirSync(join(OUT, 'top'), { recursive: true });
mkdirSync(join(OUT, 'full'), { recursive: true });

const b = await chromium.launch();
const desk = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, userAgent: UA });
const phone = await b.newContext({ ...devices['iPhone 14 Pro'], deviceScaleFactor: 2, userAgent: `${UA} Mobile` });

async function worker(list) {
  const p = await desk.newPage();
  for (const path of list) {
    await p.goto(fileFor(path), { waitUntil: 'load' });
    checks[path] = await p.evaluate(() => {
      // Cheap facts a capture can record about any page, used to say why a page is odd.
      const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.alt || i.getAttribute('src'));
      const vw = document.documentElement.clientWidth;
      // Content that runs off the page: a box past the right edge, or text spilling out of its box.
      let overflow = null;
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        const spill = cs.overflowX === 'visible' && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 8 && !el.firstElementChild;
        if (r.right > vw + 8 || spill) { const at = el.closest('table, pre, img, figure') || el; overflow = { tag: at.tagName.toLowerCase(), by: Math.round(Math.max(r.right - vw, el.scrollWidth - el.clientWidth)) }; break; }
      }
      const widest = overflow;
      const aside = document.querySelector('aside');
      const h1 = document.querySelector('h1'), hd = document.querySelector('header');
      return { broken, overflow: widest, h1Font: h1 ? getComputedStyle(h1).fontFamily.split(',')[0].replace(/["']/g, '') : null,
        header: hd ? { h: Math.round(hd.getBoundingClientRect().height), bg: getComputedStyle(hd).backgroundColor } : null,
        sidebar: aside ? getComputedStyle(aside).backgroundColor : null,
        firstImageBroken: !!document.images[0] && document.images[0].complete && document.images[0].naturalWidth === 0 };
    });
    const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 1920, height: 1920 }, fullPage: true });
    await sharp(buf).resize(480, 480).png().toFile(join(OUT, 'top', nameFor(path) + '.png'));
  }
  await p.close();
}
const checks = {};
const lanes = 6;
await Promise.all(Array.from({ length: lanes }, (_, k) => worker(paths.filter((_, i) => i % lanes === k))));
writeFileSync(join(OUT, 'checks.json'), JSON.stringify(checks));
console.log(`top captures: ${paths.length}`);

for (const path of FULL) {
  const pd = await desk.newPage();
  await pd.goto(fileFor(path), { waitUntil: 'load' });
  await sharp(await pd.screenshot({ fullPage: true })).webp({ quality: 86 }).toFile(join(OUT, 'full', nameFor(path) + '.desktop.webp'));
  await pd.close();
  const pp = await phone.newPage();
  await pp.goto(fileFor(path), { waitUntil: 'load' });
  await sharp(await pp.screenshot({ fullPage: true })).webp({ quality: 86 }).toFile(join(OUT, 'full', nameFor(path) + '.iphone.webp'));
  await pp.close();
}
console.log(`full captures: ${FULL.length}`);
await b.close();
