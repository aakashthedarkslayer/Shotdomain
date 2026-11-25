// Export the code-generated art (covers ×3 times, linen per cloth, paper) to PNGs for the Flutter app.
// Usage: node tools/export_assets.js <outdir>
const puppeteer = require('puppeteer-core'), path = require('path'), fs = require('fs');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const kill = () => { try { b.process().kill('SIGKILL'); } catch (e) {} process.exit(3); }; ['SIGALRM', 'SIGTERM', 'SIGINT'].forEach(s => process.on(s, kill));
  const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'export.html'), { waitUntil: 'load' });
  const files = await p.evaluate(async () => {
    await SBArt.ready; const o = {}, tags = ['Travel', 'Recipes', 'Personal', 'Work', 'Reading', 'Ideas'];
    for (const t of tags) for (const time of ['morning', 'golden', 'night']) o[`covers/${t.toLowerCase()}_${time}.png`] = (await SBArt.cover(t, { time })).toDataURL('image/png');
    for (const [t, hex] of Object.entries(window.SB_CLOTH)) { const l = SBArt.linen(hex, 512); o[`linen/${t.toLowerCase()}_albedo.png`] = l.albedo.toDataURL('image/png'); o[`linen/${t.toLowerCase()}_normal.png`] = l.normal.toDataURL('image/png'); }
    o['paper/paper.png'] = SBArt.paper(1024).toDataURL('image/png');
    return o;
  });
  for (const [f, d] of Object.entries(files)) { const fp = path.join(out, f); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, Buffer.from(d.split(',')[1], 'base64')); }
  console.log('wrote', Object.keys(files).length, 'files'); await b.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
