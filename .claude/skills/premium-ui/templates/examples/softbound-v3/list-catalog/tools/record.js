// Record real motion for judging (each run is its own headless Chrome, so it's safe in parallel).
// Usage: node record.js <page.html> <steps.json> <outdir> [--clip "css selector"]
// Steps are the same as shot.js, plus {"rec":"start"} and {"rec":"stop","name":"open"}.
// For each recording it writes:
//   <name>.mp4        - 30fps video (for the user)
//   <name>-sheet[-N].png - contact sheets, one frame every 100ms, 6 per row, 3s per sheet (sheet N starts at (N-1)×3s); read left→right, top→bottom (for the critic)
//   <name>-fps.txt    - how many frames Chrome delivered (a rough smoothness signal)
// --clip crops everything to one element (e.g. the phone screen).
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const args = process.argv.slice(2);
const clipSel = args.includes('--clip') ? args[args.indexOf('--clip') + 1] : null;
const [page, stepsFile, outdir] = args;
const steps = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
fs.mkdirSync(outdir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
    args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

  // Never leave a headless Chrome behind: an orphan makes macOS think Chrome is already running, so the user's Chrome won't open.
  const killChrome = () => { try { b.process() && b.process().kill('SIGKILL'); } catch (e) {} process.exit(3); };
  ['SIGALRM', 'SIGTERM', 'SIGINT', 'SIGHUP'].forEach(sig => process.on(sig, killChrome));
  const p = await b.newPage(); let bad = false;
  await p.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  p.on('pageerror', e => { bad = true; console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  const [file, hash] = page.split('#');
  await p.goto('file://' + path.resolve(file) + (hash ? '#' + hash : ''), { waitUntil: 'networkidle0', timeout: 30000 });
  const cdp = await p.target().createCDPSession();
  let frames = null;
  cdp.on('Page.screencastFrame', async f => {
    if (frames) frames.push({ t: f.metadata.timestamp, data: f.data });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {}
  });
  let clip = null;
  async function getClip() {
    if (!clipSel) return null;
    return p.evaluate(s => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, clipSel);
  }
  for (const s of steps) {
    if (s.viewport) await p.setViewport({ width: s.viewport[0], height: s.viewport[1], deviceScaleFactor: 1 });
    if (s.wait) await sleep(s.wait);
    if (s.move) await p.mouse.move(s.move[0], s.move[1], { steps: 8 });
    if (s.click) { if (typeof s.click === 'string') await p.click(s.click); else await p.mouse.click(s.click[0], s.click[1]); }
    if (s.drag) { const [[x1, y1], [x2, y2]] = s.drag; const n = Math.max(6, Math.round((s.ms || 400) / 16));
      await p.mouse.move(x1, y1); await p.mouse.down();
      for (let i = 1; i <= n; i++) { await p.mouse.move(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n); await sleep((s.ms || 400) / n); }
      await p.mouse.up(); }
    if (s.type) await p.keyboard.type(s.type, { delay: s.delay || 60 });
    if (s.key) await p.keyboard.press(s.key);
    if (s.eval) console.log('EVAL', JSON.stringify(await p.evaluate(s.eval)));
    if (s.shot) await p.screenshot({ path: path.join(outdir, s.shot + '.png') });
    if (s.rec === 'start') { clip = await getClip(); frames = []; await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 }); }
    if (s.rec === 'stop') {
      await cdp.send('Page.stopScreencast'); const got = frames; frames = null;
      const name = s.name || 'rec'; const tmp = path.join(outdir, name + '-frames'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp);
      if (!got.length) { console.log('NOFRAMES', name); continue; }
      const t0 = got[0].t, dur = got[got.length - 1].t - t0;
      fs.writeFileSync(path.join(outdir, name + '-fps.txt'), `${got.length} frames in ${dur.toFixed(2)}s = ${(got.length / Math.max(dur, 0.001)).toFixed(1)} fps delivered (headless; the real device is the true test)\n`);
      // Resample to a constant 30fps (hold the latest frame) for the video; take every 100ms for the sheet.
      const crop = clip ? ['-vf', `crop=${clip.w}:${clip.h}:${clip.x}:${clip.y}`] : [];
      got.forEach((f, i) => fs.writeFileSync(path.join(tmp, `raw-${String(i).padStart(5, '0')}.png`), Buffer.from(f.data, 'base64')));
      const pick = (fps) => { const out = []; for (let k = 0, j = 0; k * (1 / fps) <= dur + 1e-6; k++) { const tt = t0 + k / fps; while (j + 1 < got.length && got[j + 1].t <= tt) j++; out.push(j); } return out; };
      const writeSeq = (idx, prefix) => idx.forEach((j, k) => fs.copyFileSync(path.join(tmp, `raw-${String(j).padStart(5, '0')}.png`), path.join(tmp, `${prefix}-${String(k).padStart(5, '0')}.png`)));
      writeSeq(pick(30), 'v'); const sheetIdx = pick(10); writeSeq(sheetIdx, 's');
      const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
      ff(['-framerate', '30', '-i', path.join(tmp, 'v-%05d.png'), ...(clip ? ['-vf', `crop=${clip.w}:${clip.h}:${clip.x}:${clip.y},scale=trunc(iw/2)*2:trunc(ih/2)*2`] : ['-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2']), '-pix_fmt', 'yuv420p', path.join(outdir, name + '.mp4')]);
      const scale = clip ? `crop=${clip.w}:${clip.h}:${clip.x}:${clip.y},scale=240:-2` : 'scale=480:-2';
      // Sheets are split into chunks of 3s (30 frames, 6×5), so a reviewer sees them near full size instead of shrunk 5×.
      const cols = 6, per = 30, chunks = Math.ceil(sheetIdx.length / per);
      for (let c = 0; c < chunks; c++) {
        const n = Math.min(per, sheetIdx.length - c * per), rows = Math.ceil(n / cols);
        ff(['-framerate', '10', '-start_number', String(c * per), '-i', path.join(tmp, 's-%05d.png'), '-frames:v', '1', '-vf', `${scale},tile=${cols}x${rows}:padding=4:color=white`, path.join(outdir, chunks > 1 ? `${name}-sheet-${c + 1}.png` : `${name}-sheet.png`)]);
      }
      fs.rmSync(tmp, { recursive: true, force: true });
      console.log('REC', name, got.length, 'frames', dur.toFixed(2) + 's');
    }
  }
  await b.close(); process.exit(bad ? 2 : 0);
})().catch(e => { console.log('FAIL', e.message); try { require('child_process').execSync("pkill -f puppeteer_dev_chrome_profile"); } catch (_) {} process.exit(1); });
