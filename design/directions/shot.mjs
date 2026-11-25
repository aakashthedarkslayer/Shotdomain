// Screenshots of the directions page with this machine's Playwright Chromium (each run is its own browser, parallel-safe).
// Usage: node design/directions/shot.mjs <page.html> <hash e.g. a> <steps.json | -> <outdir>
// steps: [{"wait":ms}, {"shot":"name"} (viewport), {"full":"name"} (full page), {"shotEl":"css","name":"n"},
//         {"click":"css"} | {"click":[x,y]}, {"drag":[[x1,y1],[x2,y2]],"ms":400}, {"move":[x,y]},
//         {"type":"text"}, {"key":"Enter"}, {"eval":"js expr"}, {"viewport":[w,h]}, {"dark":true}, {"reduced":true}]
// Console errors are printed; exit 2 if any page error happened.
import { chromium } from '/home/user/Shotdomain/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const [, , page, hash, stepsArg, outdir] = process.argv;
const steps = stepsArg && stepsArg !== '-' ? JSON.parse(readFileSync(stepsArg, 'utf8')) : [{ wait: 2500 }, { shot: 'rest' }];
mkdirSync(outdir, { recursive: true });
const b = await chromium.launch();
let bad = false;
try {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { bad = true; console.log('PAGEERROR', e.message); });
  p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  if (steps.some((s) => s.reduced)) await p.emulateMedia({ reducedMotion: 'reduce' });
  if (steps.some((s) => s.dark)) await p.emulateMedia({ colorScheme: 'dark' });
  await p.goto('file://' + resolve(page) + '#' + hash, { waitUntil: 'load', timeout: 30000 });
  for (const s of steps) {
    if (s.viewport) await p.setViewportSize({ width: s.viewport[0], height: s.viewport[1] });
    if (s.wait) await p.waitForTimeout(s.wait);
    if (s.move) await p.mouse.move(s.move[0], s.move[1], { steps: 8 });
    if (s.click) { if (typeof s.click === 'string') await p.click(s.click); else await p.mouse.click(s.click[0], s.click[1]); }
    if (s.drag) { const [[x1, y1], [x2, y2]] = s.drag; await p.mouse.move(x1, y1); await p.mouse.down(); await p.mouse.move(x2, y2, { steps: Math.max(6, Math.round((s.ms || 400) / 16)) }); await p.mouse.up(); }
    if (s.type) await p.keyboard.type(s.type, { delay: 20 });
    if (s.key) await p.keyboard.press(s.key);
    if (s.eval) console.log('EVAL', JSON.stringify(await p.evaluate(s.eval)));
    if (s.shot) await p.screenshot({ path: join(outdir, s.shot + '.png') });
    if (s.full) await p.screenshot({ path: join(outdir, s.full + '.png'), fullPage: true });
    if (s.shotEl) { const el = await p.$(s.shotEl); if (el) await el.screenshot({ path: join(outdir, (s.name || 'el') + '.png') }); else console.log('MISSING', s.shotEl); }
  }
} catch (e) { console.log('FAIL', e.message); bad = true; }
await b.close();
process.exit(bad ? 2 : 0);
