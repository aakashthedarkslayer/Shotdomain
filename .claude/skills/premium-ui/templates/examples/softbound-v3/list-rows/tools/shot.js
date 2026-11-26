// Scripted screenshots with the installed Chrome (each run is its own browser, safe in parallel).
// Setup once: npm i puppeteer-core@22.15.0 (uses the installed Google Chrome; edit executablePath for Linux/Windows).
// Usage: node shot.js <page.html> <hash e.g. a> <steps.json | -> <outdir>
// steps: [{"wait":ms}, {"shot":"name"} (full viewport), {"shotEl":"css","name":"n"},
//         {"click":"css"} | {"click":[x,y]}, {"drag":[[x1,y1],[x2,y2]],"ms":400}, {"move":[x,y]},
//         {"type":"text"}, {"key":"Enter"}, {"eval":"js expr"}, {"viewport":[w,h]}, {"dark":true}]
// Console errors are printed; exit code 2 if any page error happened.
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const [,, page, hash, stepsArg, outdir] = process.argv;
const steps = stepsArg && stepsArg !== '-' ? JSON.parse(fs.readFileSync(stepsArg, 'utf8')) : [{wait:2500},{shot:'rest'}];
fs.mkdirSync(outdir, {recursive:true});
(async () => {
  const b = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--use-angle=metal','--enable-webgl','--ignore-gpu-blocklist']});

  // Never leave a headless Chrome behind: an orphan makes macOS think Chrome is already running, so the user's Chrome won't open.
  const killChrome = () => { try { b.process() && b.process().kill('SIGKILL'); } catch (e) {} process.exit(3); };
  ['SIGALRM', 'SIGTERM', 'SIGINT', 'SIGHUP'].forEach(sig => process.on(sig, killChrome));
  const p = await b.newPage(); let bad = false;
  await p.setViewport({width:1440, height:1000, deviceScaleFactor:1});
  p.on('pageerror', e => { bad = true; console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type()==='error') { console.log('CONSOLE', m.text()); } });
  await p.goto('file://' + path.resolve(page) + '#' + hash, {waitUntil:'networkidle0', timeout:30000});
  for (const s of steps) {
    if (s.viewport) await p.setViewport({width:s.viewport[0], height:s.viewport[1], deviceScaleFactor:1});
    if (s.dark) await p.emulateMediaFeatures([{name:'prefers-color-scheme', value:'dark'}]);
    if (s.wait) await new Promise(r => setTimeout(r, s.wait));
    if (s.move) await p.mouse.move(s.move[0], s.move[1], {steps:8});
    if (s.click) { if (typeof s.click === 'string') await p.click(s.click); else await p.mouse.click(s.click[0], s.click[1]); }
    if (s.drag) { const [[x1,y1],[x2,y2]] = s.drag; const n = Math.max(6, Math.round((s.ms||400)/16));
      await p.mouse.move(x1,y1); await p.mouse.down();
      for (let i=1;i<=n;i++){ await p.mouse.move(x1+(x2-x1)*i/n, y1+(y2-y1)*i/n); await new Promise(r=>setTimeout(r,(s.ms||400)/n)); }
      await p.mouse.up(); }
    if (s.type) await p.keyboard.type(s.type, {delay:20});
    if (s.key) await p.keyboard.press(s.key);
    if (s.eval) console.log('EVAL', JSON.stringify(await p.evaluate(s.eval)));
    if (s.shot) await p.screenshot({path: path.join(outdir, s.shot + '.png')});
    if (s.shotEl) { const el = await p.$(s.shotEl); if (el) await el.screenshot({path: path.join(outdir, (s.name||'el') + '.png')}); else console.log('MISSING', s.shotEl); }
  }
  await b.close(); process.exit(bad ? 2 : 0);
})().catch(e => { console.log('FAIL', e.message); try { require('child_process').execSync("pkill -f puppeteer_dev_chrome_profile"); } catch (_) {} process.exit(1); });
