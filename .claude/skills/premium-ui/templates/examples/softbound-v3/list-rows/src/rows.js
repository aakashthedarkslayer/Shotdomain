/* Softbound v3: LIST ROWS, the scannable list mode. A sheet of warm paper slides up into the studio; every book on the turntable
   leaps off and shrinks into its row's cover thumbnail (shared element). Rows are real DOM: cover, title, 2-line excerpt, tag pill,
   date · words, under sticky "Today / This week / March" headers (or By tag). Tap: the thumbnail grows back into the book, which opens
   with SBOpen and files itself back on close. Swipe left: the clay bin. Swipe right: pin. Hold: peek (slide up to open).
   The paper is a plane in the WebGL scene (so the flying books pass in front of it); the rows are DOM on top of it, so the canvas sleeps
   while you scroll. Loaded after scene.js; talks through window.SB, SB._k and SB.hooks. */
(function () {
'use strict';
const SB = window.SB, T3 = window.THREE;
if (!SB || !SB._k || !T3 || !SB.screenEl) return;
const K = SB._k, screenEl = SB.screenEl, scene = SB.scene, camera = SB.camera, RM = !!K.RM;
const SW = K.SW || 390, SH = K.SH || 844;
const CLOTH = window.SB_CLOTH || {Travel: '#A9C8EE', Recipes: '#F5B98A', Personal: '#EFB3C2', Work: '#A8DCC4', Reading: '#F3DB8C', Ideas: '#CDBDF2'};
const INK = window.SB_INK || {Travel: '#2C4E78', Recipes: '#7A3F1C', Personal: '#80344B', Work: '#1E5A43', Reading: '#6A4C07', Ideas: '#4B3D8A'};
const TAGS = ['Travel', 'Recipes', 'Personal', 'Work', 'Reading', 'Ideas'];
const snd = (n, o) => { try { window.SBSound && SBSound.play(n, o || {}); } catch (e) {} };
const hap = k => { try { window.SBHaptics && SBHaptics[k] && SBHaptics[k](); } catch (e) {} };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, seg = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, eoc = t => 1 - Math.pow(1 - t, 3);
const eob = t => { const c = 1.3; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const S = (x, k, z) => ({x, v: 0, t: x, k, z});
function sstep(s, dt) { const c = 2 * Math.sqrt(s.k) * s.z, a = s.k * (s.t - s.x) - c * s.v; s.v += a * dt; s.x += s.v * dt;
  if (Math.abs(s.t - s.x) < .05 && Math.abs(s.v) < .5) { s.x = s.t; s.v = 0; return false; } return true; }
function hexMix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join(''); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const nWords = s => window.SB_WORDS ? SB_WORDS(s) : (String(s || '').trim().match(/\S+/g) || []).length;
const gsvg = (t, z) => window.SB_GLYPH_SVG ? SB_GLYPH_SVG(t, z) : '';
const later = (ms, fn) => setTimeout(fn, RM ? 0 : ms);
const cv2 = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

/* ---------- layout (phone px) ---------- */
const TOP = 136, BAR = 52, DOWN = SH + 40;       // sheet top when up; the sort/filter bar; parked below the screen
const TW = 50, TH = 70, PADL = 20, PADT = 13;    // thumbnail in its row
const DB = 3.0, DP = 3.25;                       // depth of a book sitting in a thumbnail, depth of the paper
const PAPER = {morning: '#F8F6F1', golden: '#FBF1E2', night: '#E4D2B6'};

/* ---------- state ---------- */
const L = {on: false, busy: false, sort: 'newest', q: '', tag: null, sy: S(DOWN, 170, .8), sheetTick: null, secTops: [], secIdx: -1, peek: null, g: null, focusId: null};
const SBList = window.SBList = {get on() { return L.on; }, toggle: () => (L.on ? exitList() : enterList()), enter: enterList, exit: exitList,
  get state() { return {on: L.on, busy: L.busy, sort: L.sort, q: L.q, tag: L.tag, sheet: Math.round(L.sy.x), rows: rowsAll().length, shown: rowsShown().length, scroll: sc ? sc.scrollTop : 0}; }};

/* ---------- dates → sections ---------- */
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const tCache = new WeakMap();
function when(n) {
  if (tCache.has(n) && n.date === tCache.get(n).d) return tCache.get(n).t;
  const now = new Date(), d = String(n.date || ''); let t;
  const m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})/.exec(d);
  if (/^today$/i.test(d) || !d) t = now.getTime();
  else if (/^yesterday$/i.test(d)) t = now.getTime() - 864e5;
  else if (m && MON.indexOf(m[1].toLowerCase()) >= 0) { let y = now.getFullYear(); const mk = y2 => new Date(y2, MON.indexOf(m[1].toLowerCase()), +m[2], 12).getTime(); t = mk(y); if (t > now.getTime() + 864e5) t = mk(y - 1); }
  else t = now.getTime() - 1e12;
  tCache.set(n, {d: n.date, t}); return t;
}
function sectionOf(n) {
  const t = when(n), now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), dt = new Date(t), d1 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  const days = Math.round((d0 - d1) / 864e5);
  if (days <= 0) return 'Today'; if (days === 1) return 'Yesterday'; if (days < 7) return 'This week';
  return MONL[dt.getMonth()] + (dt.getFullYear() !== now.getFullYear() ? ' ' + dt.getFullYear() : '');
}
function ordered() { // [{name, glyph, list:[it]}]
  const its = K.items.slice().sort((a, b) => when(b.note) - when(a.note) || (b.note.id || 0) - (a.note.id || 0));
  const out = [], by = new Map(), add = (name, it, tag) => { let s = by.get(name); if (!s) { s = {name, tag, list: []}; by.set(name, s); out.push(s); } s.list.push(it); };
  its.filter(it => it.note.pinned).forEach(it => add('Pinned', it));
  const rest = its.filter(it => !it.note.pinned);
  if (L.sort === 'tag') TAGS.forEach(tag => rest.forEach(it => { if (it.note.tag === tag) add(tag, it, tag); }));
  else rest.forEach(it => add(sectionOf(it.note), it));
  return out;
}

/* ---------- painted thumbnails: the note's own SBArt cover, bound in its cloth (cached per tag + time of day as blob URLs) ---------- */
const thumbs = {}, pending = {};
function placeholder(tag) {
  const k = 'ph' + tag; if (thumbs[k]) return thumbs[k];
  const c = cv2(100, 140), x = c.getContext('2d'), h = CLOTH[tag] || '#CDBDF2';
  x.fillStyle = h; x.fillRect(0, 0, 100, 140); x.fillStyle = hexMix(h, '#FFFFFF', .55); rr(x, 16, 12, 74, 82, 5); x.fill();
  return (thumbs[k] = c.toDataURL());
}
function paintThumb(tag, art) {
  const c = cv2(100, 140), x = c.getContext('2d'), h = CLOTH[tag] || '#CDBDF2';
  let lin = null; try { lin = window.SBArt && SBArt.linen ? SBArt.linen(h, 256).albedo : null; } catch (e) {}
  x.fillStyle = lin ? x.createPattern(lin, 'repeat') : h; x.fillRect(0, 0, 100, 140);
  let g = x.createLinearGradient(0, 0, 100, 140); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,30,20,.12)'); x.fillStyle = g; x.fillRect(0, 0, 100, 140);
  x.fillStyle = 'rgba(40,20,10,.13)'; x.fillRect(0, 0, 8, 140); x.fillStyle = 'rgba(255,255,255,.28)'; x.fillRect(8, 0, 1.5, 140); // the hinge
  x.save(); x.shadowColor = 'rgba(70,35,30,.3)'; x.shadowBlur = 4; x.shadowOffsetY = 1.5; x.fillStyle = '#FFF8EC'; rr(x, 17, 11, 74, 84, 4); x.fill(); x.restore();
  x.save(); rr(x, 20, 14, 68, 78, 2.5); x.clip();
  if (art) { const s = Math.max(68 / art.width, 78 / art.height), w = art.width * s, hh = art.height * s; x.drawImage(art, 20 + (68 - w) / 2, 14 + (78 - hh) / 2, w, hh); }
  else { x.fillStyle = hexMix(h, '#FFFFFF', .5); x.fillRect(20, 14, 68, 78); }
  x.restore();
  x.fillStyle = '#D9B66E'; rr(x, 31, 106, 46, 4, 2); x.fill(); rr(x, 39, 115, 30, 3, 1.5); x.fill(); x.fillRect(49, 125, 10, 1.5); // foil title
  return new Promise(res => c.toBlob(b => res(b ? URL.createObjectURL(b) : c.toDataURL()), 'image/png'));
}
function thumbURL(tag) {
  const time = SB.time, k = tag + '|' + time; if (thumbs[k]) return thumbs[k];
  if (!pending[k]) pending[k] = Promise.resolve(K.coverFor ? K.coverFor(tag) : null).catch(() => null).then(art => paintThumb(tag, art)).then(u => {
    thumbs[k] = u; if (SB.time === time && sc) sc.querySelectorAll(`img[data-t="${tag}"]`).forEach(i => { i.src = u; }); if (pk) pk.querySelectorAll(`img[data-t="${tag}"]`).forEach(i => { i.src = u; }); });
  return placeholder(tag);
}

/* ---------- the paper in the room: a plane in the scene (books fly in front of it), unlit so the DOM matches it exactly ---------- */
let plane = null, shade = null, paperC = null, paperT = null;
function paintPaper() {
  const c = paperC || (paperC = cv2(512, 1024)), x = c.getContext('2d'), base = PAPER[SB.time] || PAPER.golden;
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = base; x.fillRect(0, 0, 512, 1024);
  let fib = null; try { fib = window.SBArt && SBArt.paper ? SBArt.paper(1024) : null; } catch (e) {}
  if (fib) { x.globalAlpha = .32; x.globalCompositeOperation = 'multiply'; x.drawImage(fib, 0, 0, 512, 512); x.drawImage(fib, 0, 512, 512, 512); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
  const g = x.createLinearGradient(0, 0, 0, 8); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 8); // the edge catches the light
  if (paperT) paperT.needsUpdate = true;
}
function buildPlane() {
  const w = SW, h = SH + 300, r = 26, s = new T3.Shape();
  s.moveTo(-w / 2, -h); s.lineTo(w / 2, -h); s.lineTo(w / 2, -r); s.quadraticCurveTo(w / 2, 0, w / 2 - r, 0); s.lineTo(-w / 2 + r, 0); s.quadraticCurveTo(-w / 2, 0, -w / 2, -r); s.closePath();
  const geo = new T3.ShapeGeometry(s, 10), P = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < P.count; i++) uv.setXY(i, (P.getX(i) + w / 2) / w, 1 + P.getY(i) / 1024 * .5);
  paintPaper(); paperT = new T3.CanvasTexture(paperC); paperT.encoding = T3.sRGBEncoding; paperT.wrapT = T3.RepeatWrapping; paperT.anisotropy = 4;
  // drawn after the room's transparent bits (dust, beam, puffs) and over everything, without writing depth; flying books draw after it (see airborne)
  plane = new T3.Mesh(geo, new T3.MeshBasicMaterial({map: paperT, toneMapped: false, transparent: true, depthTest: false, depthWrite: false}));
  plane.renderOrder = 9; plane.frustumCulled = false; plane.visible = false; scene.add(plane);
  // a soft ambient shadow around the top edge, on the room behind
  const c = cv2(256, 64), x = c.getContext('2d'); x.filter = 'blur(9px)'; x.fillStyle = 'rgba(70,40,25,.55)'; rr(x, 14, 30, 228, 60, 16); x.fill();
  const st = new T3.CanvasTexture(c);
  shade = new T3.Mesh(new T3.PlaneGeometry(w + 30, 64), new T3.MeshBasicMaterial({map: st, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: .5}));
  shade.renderOrder = 8; shade.frustumCulled = false; shade.visible = false; scene.add(shade);
}
const _d = new T3.Vector3(), _f = new T3.Vector3(), _v = new T3.Vector3(), _q = new T3.Quaternion(), _ax = new T3.Vector3();
const upp = d => 2 * d * Math.tan(camera.fov * Math.PI / 360) / SH;
function screenToWorld(px, py, depth, out) {
  camera.updateMatrixWorld(); _d.set(px / SW * 2 - 1, 1 - py / SH * 2, .5).unproject(camera).sub(camera.position).normalize();
  _f.set(0, 0, -1).applyQuaternion(camera.quaternion); return out.copy(camera.position).addScaledVector(_d, depth / _d.dot(_f));
}
function placePaper() {
  if (!plane) return; const y = L.sy.x, on = y < SH - 1; plane.visible = shade.visible = on; if (!on) return;
  screenToWorld(SW / 2, y, DP, plane.position); plane.quaternion.copy(camera.quaternion); plane.scale.setScalar(upp(DP));
  screenToWorld(SW / 2, y - 4, DP + .02, shade.position); shade.quaternion.copy(camera.quaternion); shade.scale.setScalar(upp(DP + .02));
}

/* ---------- DOM ---------- */
const IC = (d, s, sw) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I_LIST = IC('<rect x="3.5" y="4" width="5.5" height="7" rx="1.3"/><path d="M12 6h8.5M12 9.2h5.5"/><rect x="3.5" y="13" width="5.5" height="7" rx="1.3"/><path d="M12 15h8.5M12 18.2h5.5"/>', 21, 1.9);
const I_PIN = IC('<path d="M9.2 3.8h5.6l-.9 4.6 3.3 3.5H6.8l3.3-3.5z" fill="currentColor"/><path d="M12 12v8.2"/>', 15, 1.8);
const I_POT = IC('<path d="M4.8 6.5h14.4"/><path d="M6.6 6.5s-1.7 4.6.4 9c1.3 2.8 3 4 5 4s3.7-1.2 5-4c2.1-4.4.4-9 .4-9"/><path d="M9 10.7c1.9.8 4.1.8 6 0"/>', 22, 1.9);
const I_UP = IC('<path d="M7 14l5-5 5 5"/>', 18, 2.2);
const css = `
#screen .lr{--lp:#FBF1E2;--lpa:rgba(251,241,226,.92);--li:#2B2A4A;--lm:#5A5368;--lh:#7A5A44;--lr:rgba(90,60,40,.12);--lk:rgba(43,42,74,.07);
  position:absolute;left:0;right:0;top:${TOP}px;height:${SH - TOP}px;z-index:2;visibility:hidden;will-change:transform;color:var(--li);transition:opacity .3s}
#screen[data-time="morning"] .lr{--lp:#F8F6F1;--lpa:rgba(248,246,241,.92);--lh:#5C6170}
#screen[data-time="night"] .lr{--lp:#E4D2B6;--lpa:rgba(228,210,182,.92);--lh:#6B4E38;--lr:rgba(80,50,30,.16);--lk:rgba(60,35,20,.09)}
#screen .lr.on{visibility:visible}
#screen .lr.dim{opacity:0;pointer-events:none}
#screen .lr.busy .lr-sc{pointer-events:none}
#screen .lr-lt{position:absolute;left:-30px;top:-40px;width:450px;height:${SH - TOP + 80}px;pointer-events:none;will-change:transform}
#screen .lr-bar{position:absolute;left:0;right:0;top:0;height:${BAR}px;display:flex;align-items:center;gap:10px;padding:6px 0 0 18px}
#screen .lr-seg{flex:none;display:flex;height:34px;padding:3px;border-radius:99px;background:var(--lk)}
#screen .lr-seg button{all:unset;box-sizing:border-box;cursor:pointer;height:28px;padding:0 12px;border-radius:99px;font:650 13px var(--fd);color:var(--lm);transition:background .3s,color .3s,box-shadow .3s}
#screen .lr-seg button[aria-pressed="true"]{background:var(--lp);color:var(--li);box-shadow:0 1px 2px rgba(60,35,20,.18),0 4px 10px -6px rgba(60,35,20,.4)}
#screen .lr-seg button:focus-visible,#screen .lr-chips button:focus-visible,#screen .lr-bin:focus-visible{outline:2px solid var(--li);outline-offset:2px}
#screen .lr-chips{flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 18px 2px 2px;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent)}
#screen .lr-chips::-webkit-scrollbar{display:none}
#screen .lr-chips .sb-chip{height:32px;background:transparent;box-shadow:inset 0 0 0 1px rgba(60,40,30,.16);color:var(--li)}
#screen .lr-chips .sb-chip.all{padding:0 13px}
#screen .lr-chips .sb-chip[aria-pressed="true"]{background:var(--li);color:var(--lp);box-shadow:none}
#screen .lr-sc{position:absolute;left:0;right:0;top:${BAR}px;bottom:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:none;outline:none;-webkit-tap-highlight-color:transparent}
#screen .lr-sc::-webkit-scrollbar{display:none}
#screen .lr-body{padding-bottom:128px}
#screen .lr-ft{position:absolute;left:0;right:0;bottom:0;height:118px;pointer-events:none;background:linear-gradient(rgba(0,0,0,0),var(--lp) 62%)}
#screen .lr.fly .lr-h{opacity:0}
#screen .lr-sec{position:relative}
#screen .lr-h{position:sticky;top:0;z-index:2;margin:0;height:30px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 20px;background:var(--lp);box-shadow:0 1px 0 var(--lr);
  font:750 11.5px var(--fd);letter-spacing:.13em;text-transform:uppercase;color:var(--lh);transition:height .3s,opacity .25s;overflow:hidden}
#screen .lr-h i{font-style:normal;display:inline-flex;align-items:center;gap:6px}
#screen .lr-h i svg{color:var(--d)}
#screen .lr-h b{font-weight:650;letter-spacing:.04em}
#screen .lr-sec.gone .lr-h{height:0;opacity:0}
#screen .lr ul{list-style:none;margin:0;padding:0}
#screen .rw{display:grid;grid-template-rows:1fr;transition:grid-template-rows .36s cubic-bezier(.2,0,0,1),opacity .28s}
#screen .rw.gone{grid-template-rows:0fr;opacity:0}
#screen .rw-g{min-height:0;overflow:hidden;position:relative}
#screen .rw-in{position:relative;display:flex;gap:14px;padding:${PADT}px 18px ${PADT}px ${PADL}px;cursor:pointer;touch-action:pan-y;outline:none;scroll-margin-top:34px;
  transition:transform .42s cubic-bezier(.3,1.35,.5,1),background .2s}
#screen .rw-in::after{content:"";position:absolute;left:${PADL + TW + 14}px;right:18px;bottom:0;height:1px;background:var(--lr)}
#screen li.rw:last-child .rw-in::after{display:none}
#screen .rw-in:focus-visible{box-shadow:inset 0 0 0 2px var(--li);border-radius:14px}
#screen .rw-in.drag{transition:none}
#screen .rw.sw .rw-in{background:var(--lp)}
#screen .rw-in.prs{background:var(--lk)}
#screen .rw-th{flex:none;width:${TW}px;height:${TH}px;border-radius:3px 6px 6px 3px;overflow:hidden;transform-origin:50% 70%;
  box-shadow:0 1px 1px rgba(60,30,20,.22),0 7px 12px -7px rgba(60,30,20,.55),inset 0 0 0 .5px rgba(0,0,0,.08)}
#screen .rw-th img{display:block;width:100%;height:100%}
#screen .rw.pend .rw-th{opacity:0}
#screen .rw-th.pop{animation:lr-pop .55s cubic-bezier(.3,1.7,.5,1)}
@keyframes lr-pop{0%{transform:scale(1.14) rotate(-3deg)}100%{transform:none}}
#screen .rw-tx{flex:1;min-width:0;display:flex;flex-direction:column}
#screen .rw-t{display:block;font:680 16.5px/21px var(--fd);letter-spacing:-.018em;color:var(--li);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#screen .rw.pin .rw-t{padding-right:20px}
#screen .rw-x{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px;font:400 14.5px/19px Newsreader,Georgia,serif;color:var(--lm)}
#screen .rw-x.e{font-style:italic}
#screen .rw-m{display:flex;align-items:center;gap:7px;margin-top:7px;font:600 12px var(--fd);color:var(--lm);white-space:nowrap}
#screen .rw-m .sb-tg{height:21px;font-size:11.5px}
#screen .lr mark{background:rgba(243,205,105,.62);color:inherit;border-radius:3px;box-shadow:0 0 0 1.5px rgba(243,205,105,.62)}
#screen .rw-pn{position:absolute;right:16px;top:14px;color:#B0802E;display:none;transform:rotate(18deg)}
#screen .rw.pin .rw-pn{display:block}
#screen .rw-a{position:absolute;inset:0;display:flex;align-items:center;gap:8px;padding:0 26px;font:700 13.5px var(--fd);opacity:0}
#screen .rw-a.l{background:#F3D98A;color:#4F3A05;justify-content:flex-start}
#screen .rw-a.r{background:#A84E2E;color:#FFF5EA;justify-content:flex-end}
#screen .rw.sw-l .rw-a.r,#screen .rw.sw-r .rw-a.l{opacity:1}
#screen .rw-a svg{transition:transform .3s cubic-bezier(.3,1.8,.5,1)}
#screen .rw.arm .rw-a svg{transform:scale(1.3)}
#screen .rw.peeked .rw-in{opacity:.35}
#screen .lr .rw.pend .rw-tx,#screen .lr.enter .rw-tx,#screen .lr.enter .lr-h,#screen .lr.enter .lr-bar{opacity:0;transform:translateY(10px)}
#screen .lr .rw-tx,#screen .lr .lr-h,#screen .lr .lr-bar{transition:opacity .4s var(--dl,0s),transform .5s cubic-bezier(.2,.9,.3,1) var(--dl,0s)}
#screen .lr-empty{margin:40px 24px 0;text-align:center;font:500 15px/1.4 var(--fd);color:var(--lm)}
#screen .lr-bin{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;margin:22px 20px 0;padding:0 16px;height:48px;border-radius:16px;
  box-shadow:inset 0 0 0 1px rgba(60,40,30,.15);font:600 14px var(--fd);color:var(--lm)}
#screen .lr-bin svg{color:#B65A31}
#screen .lr-bin span{flex:1}
#screen.rowsx .sb-info,#screen.rowsx .sb-chips,#screen.rowsx .sb-binb{opacity:0!important;pointer-events:none!important;visibility:hidden}
#screen.rows .sb-dock{background:rgba(255,252,246,.94);-webkit-backdrop-filter:none;backdrop-filter:none}
#screen.rows[data-time="night"] .sb-dock{background:rgba(52,42,56,.95)}
#screen .sb-cord{transition:opacity .4s,transform .6s cubic-bezier(.3,1.3,.5,1)}
#screen.rows .sb-cord{transform:translate(-16px,-42px)}
#screen.rows .sb-hd.searching~.sb-cord{opacity:0;pointer-events:none}
#screen .sb-hd>.lr-hb{display:flex;gap:6px;flex:none;pointer-events:auto}
#screen .lr-tg[aria-pressed="true"]{background:var(--ink);color:var(--paper,#FFFCF7)}
#screen[data-time="night"] .lr-tg[aria-pressed="true"]{color:#2B2A4A}
#screen .lr-tg svg{transition:transform .5s cubic-bezier(.3,1.6,.5,1)}
#screen .lr-tg[aria-pressed="true"] svg{transform:scale(1.06)}
#screen .sb-ttl{transition:color 1s,opacity .12s}
#screen .sb-ttl.swap{opacity:0}
#screen .lr-pk{position:absolute;inset:0;z-index:9;pointer-events:none;visibility:hidden}
#screen .lr-pk.on{visibility:visible}
#screen .pk-dim{position:absolute;inset:0;background:rgba(36,24,16,.34);opacity:0;transition:opacity .3s}
#screen[data-time="night"] .pk-dim{background:rgba(12,8,14,.5)}
#screen .lr-pk.show .pk-dim{opacity:1}
#screen .pk-c{position:absolute;left:16px;right:16px;border-radius:22px;padding:20px 22px 0;background:#FFFBF3;color:#2B2A4A;opacity:0;transform-origin:50% 0;
  box-shadow:0 2px 4px rgba(60,30,20,.12),0 40px 70px -24px rgba(50,25,10,.65);transition:opacity .2s,transform .42s cubic-bezier(.3,1.35,.5,1)}
#screen .lr-pk.show .pk-c{opacity:1}
#screen .pk-c.drag{transition:opacity .2s}
#screen .pk-hd{display:flex;gap:14px;align-items:flex-start}
#screen .pk-hd .rw-th{width:60px;height:84px}
#screen .pk-hd .rw-m{margin:0 0 6px}
#screen .pk-t{margin:0;font:720 22px/1.12 var(--fd);letter-spacing:-.025em}
#screen .pk-b{margin:14px 0 0;max-height:300px;overflow:hidden;font:400 15.5px/26px Newsreader,Georgia,serif;color:#3D3750;white-space:pre-wrap;
  background:repeating-linear-gradient(180deg,transparent 0 25px,rgba(90,110,170,.16) 25px 26px);-webkit-mask-image:linear-gradient(#000 80%,transparent);mask-image:linear-gradient(#000 80%,transparent)}
#screen .pk-ft{display:flex;align-items:center;justify-content:center;gap:4px;height:46px;font:650 12.5px var(--fd);color:#5A5368}
#screen .pk-ft .bar{position:relative;width:36px;height:4px;border-radius:2px;background:rgba(43,42,74,.14);overflow:hidden;margin-left:6px}
#screen .pk-ft .bar i{position:absolute;inset:0;background:#2B2A4A;transform-origin:left;transform:scaleX(var(--p,0))}
#screen .pk-c.arm .pk-ft{color:#2B2A4A}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const homeEl = screenEl.querySelector('.sb-home'), hd = screenEl.querySelector('.sb-hd'), srch = screenEl.querySelector('.sb-srch'), titleEl = screenEl.querySelector('.sb-ttl');
const cvEl = screenEl.querySelector('canvas.sb-gl'), srEl = screenEl.querySelector('.sb-sr[role="list"]');
const tg = document.createElement('button'); tg.className = 'sb-ib lr-tg'; tg.setAttribute('aria-pressed', 'false'); tg.setAttribute('aria-label', 'List view'); tg.innerHTML = I_LIST;
if (hd && srch) { const grp = document.createElement('div'); grp.className = 'lr-hb'; srch.parentNode.insertBefore(grp, srch); grp.appendChild(tg); grp.appendChild(srch); }
const wrap = document.createElement('div'); wrap.className = 'lr'; wrap.inert = true;
wrap.innerHTML = `<canvas class="lr-lt" width="225" height="${Math.round((SH - TOP + 80) / 2)}" aria-hidden="true"></canvas>
  <div class="lr-bar"><div class="lr-seg" role="group" aria-label="Order"><button data-s="newest" aria-pressed="true">Newest</button><button data-s="tag" aria-pressed="false">By tag</button></div><div class="lr-chips" role="group" aria-label="Filter by tag"></div></div>
  <div class="lr-sc" aria-label="Notes"><div class="lr-body"></div></div><div class="lr-ft" aria-hidden="true"></div>`;
screenEl.insertBefore(wrap, homeEl);
const sc = wrap.querySelector('.lr-sc'), body = wrap.querySelector('.lr-body'), chipsEl = wrap.querySelector('.lr-chips'), ltC = wrap.querySelector('.lr-lt'), segEl = wrap.querySelector('.lr-seg');
const pk = document.createElement('div'); pk.className = 'lr-pk'; pk.setAttribute('aria-hidden', 'true'); pk.innerHTML = '<div class="pk-dim"></div><div class="pk-c"></div>'; screenEl.appendChild(pk);
const pkCard = pk.querySelector('.pk-c');
const live = document.createElement('div'); live.className = 'sb-sr'; live.setAttribute('aria-live', 'polite'); screenEl.appendChild(live);
const kscale = () => (screenEl.getBoundingClientRect().width / SW) || 1;

/* ---------- window light on the paper: painted once per time of day, drifts as you scroll (a transform, so it is free) ---------- */
function paintLight() {
  const x = ltC.getContext('2d'), w = ltC.width, h = ltC.height, t = SB.time; x.clearRect(0, 0, w, h); x.save(); x.scale(.5, .5);
  if (t === 'night') { // the desk lamp's pool from the left; the far corner falls off
    let g = x.createRadialGradient(40, 10, 10, 40, 10, 520); g.addColorStop(0, 'rgba(255,196,120,.42)'); g.addColorStop(.5, 'rgba(255,190,120,.12)'); g.addColorStop(1, 'rgba(255,190,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 450, h * 2);
    g = x.createLinearGradient(0, h * 2 - 380, 0, h * 2); g.addColorStop(0, 'rgba(60,32,18,0)'); g.addColorStop(1, 'rgba(60,32,18,.14)'); x.fillStyle = g; x.fillRect(0, 0, 450, h * 2);
  } else { // two window panes of light falling from the top-right, the mullion between them
    const warm = t === 'golden', col = warm ? '255,214,160' : '255,255,255', a = warm ? .26 : .42;
    x.filter = 'blur(7px)'; x.translate(250, -60); x.rotate(.42); x.transform(1, 0, -.18, 1, 0, 0);
    x.fillStyle = `rgba(${col},${a})`; x.fillRect(-40, 0, 128, 300); x.fillRect(104, 0, 120, 300); x.fillRect(-40, 318, 128, 250); x.fillRect(104, 318, 120, 250);
    x.filter = 'none'; x.setTransform(1, 0, 0, 1, 0, 0); x.scale(.5, .5);
    if (warm) { const g = x.createLinearGradient(0, 0, 0, h * 2); g.addColorStop(0, 'rgba(120,64,24,0)'); g.addColorStop(1, 'rgba(120,64,24,.06)'); x.fillStyle = g; x.fillRect(0, 0, 450, h * 2); }
  }
  x.restore();
}
let lightRaf = 0;
function driftLight() { lightRaf = 0; const s = sc.scrollTop; ltC.style.transform = `translate3d(${Math.sin(s / 1300) * 22}px,${Math.sin(s / 900 + .6) * 36 - 10}px,0)`; }

/* ---------- rows ---------- */
const byId = id => K.items.find(it => String(it.note.id) === String(id));
const rowsAll = () => [...body.querySelectorAll('.rw')], rowsShown = () => rowsAll().filter(r => !r.classList.contains('gone'));
const rowOf = it => body.querySelector(`.rw[data-id="${CSS.escape(String(it.note.id))}"]`);
function matches(it) { const n = it.note; return (!L.tag || n.tag === L.tag) && (!L.q || (n.title + ' ' + n.body + ' ' + n.tag).toLowerCase().includes(L.q)); }
function hl(text, q) { text = String(text || ''); if (!q) return esc(text); const lo = text.toLowerCase(); let out = '', i = 0, j;
  while ((j = lo.indexOf(q, i)) >= 0) { out += esc(text.slice(i, j)) + '<mark>' + esc(text.slice(j, j + q.length)) + '</mark>'; i = j + q.length; } return out + esc(text.slice(i)); }
function snippet(b, q) { b = String(b || '').replace(/\s+/g, ' '); if (!q) return b; const j = b.toLowerCase().indexOf(q); if (j < 64) return b; const s = b.lastIndexOf(' ', j - 22); return '…' + b.slice(s > 0 ? s + 1 : j - 22); }
function textHTML(n) {
  const b = String(n.body || '').trim();
  return `<span class="rw-t">${hl(n.title || 'Untitled', L.q)}</span><span class="rw-x${b ? '' : ' e'}">${b ? hl(snippet(b, L.q), L.q) : 'Empty for now.'}</span>`;
}
function rowHTML(it, k) {
  const n = it.note, c = hexMix(CLOTH[n.tag] || '#CDBDF2', '#FFFFFF', .35), w = nWords(n.body), id = esc(String(n.id));
  const lab = `${n.title || 'Untitled'}. ${n.tag}, ${n.date}, ${w} words.${n.pinned ? ' Pinned.' : ''} ${String(n.body || '').slice(0, 90)}`;
  return `<li class="rw${it.inRow ? '' : ' pend'}${n.pinned ? ' pin' : ''}${matches(it) ? '' : ' gone'}" data-id="${id}" role="listitem" style="--dl:${Math.min(k, 9) * 35}ms"><div class="rw-g">
    <div class="rw-a l" aria-hidden="true">${I_PIN}<span>${n.pinned ? 'Unpin' : 'Pin'}</span></div><div class="rw-a r" aria-hidden="true"><span>Clay bin</span>${I_POT}</div>
    <div class="rw-in" tabindex="-1" role="button" aria-label="${esc(lab)}"><span class="rw-th"><img alt="" draggable="false" data-t="${n.tag}" src="${thumbURL(n.tag)}"></span>
    <span class="rw-tx">${textHTML(n)}<span class="rw-m"><span class="sb-tg" style="--c:${c};--d:${INK[n.tag] || '#2B2A4A'}">${gsvg(n.tag, 11)}${esc(n.tag)}</span><span>${esc(n.date)} · ${w} word${w === 1 ? '' : 's'}</span></span></span>
    <span class="rw-pn" aria-hidden="true">${I_PIN}</span></div></div></li>`;
}
function rebuild() {
  const secs = ordered(); let k = 0;
  body.innerHTML = secs.map(s => `<section class="lr-sec" aria-label="${esc(s.name)}"><h3 class="lr-h" style="--dl:${Math.min(k, 9) * 35}ms"><i${s.tag ? ` style="--d:${INK[s.tag]}"` : ''}>${s.tag ? gsvg(s.tag, 12) : s.name === 'Pinned' ? I_PIN : ''}${esc(s.name)}</i><b>${s.list.length}</b></h3><ul role="list">${s.list.map(it => rowHTML(it, k++)).join('')}</ul></section>`).join('') +
    `<p class="lr-empty" hidden></p>` + binRowHTML();
  chips(); applyFilter(true); roving();
}
function binRowHTML() { const n = SB.bin ? SB.bin.list.length : 0; return n ? `<button class="lr-bin">${I_POT}<span>In the clay bin</span><b>${n}</b></button>` : ''; }
function chips() {
  const present = TAGS.filter(t => K.items.some(it => it.note.tag === t)); if (L.tag && present.indexOf(L.tag) < 0) L.tag = null;
  chipsEl.innerHTML = `<button class="sb-chip all" aria-pressed="${!L.tag}">All</button>` + present.map(t => `<button class="sb-chip" data-tag="${t}" aria-pressed="${L.tag === t}" style="--c:${CLOTH[t]};--d:${INK[t]}"><i>${gsvg(t, 12)}</i>${t}</button>`).join('');
}
function applyFilter(quiet) {
  let shown = 0;
  body.querySelectorAll('.lr-sec').forEach(sec => { let any = false;
    sec.querySelectorAll('.rw').forEach(r => { const it = byId(r.dataset.id); if (!it) return; const m = matches(it); r.classList.toggle('gone', !m); if (m) { any = true; shown++; }
      if (!quiet || L.q) { const tx = r.querySelector('.rw-tx'), h = textHTML(it.note), old = tx.querySelector('.rw-t'); if (old && tx.dataset.q !== L.q) { tx.dataset.q = L.q; old.outerHTML = h.slice(0, h.indexOf('</span>') + 7); tx.querySelector('.rw-x').outerHTML = h.slice(h.indexOf('</span>') + 7); } } });
    sec.classList.toggle('gone', !any); const c = sec.querySelector('.lr-h b'); if (c) c.textContent = sec.querySelectorAll('.rw:not(.gone)').length || ''; });
  const em = body.querySelector('.lr-empty'); if (em) { em.hidden = shown > 0; em.textContent = L.q ? `Nothing matches “${L.q}”.` : 'No notes here yet.'; }
  if (!quiet) live.textContent = `${shown} note${shown === 1 ? '' : 's'}${L.q ? ` matching ${L.q}` : ''}${L.tag ? ` in ${L.tag}` : ''}.`;
  later(400, measure);
}
function roving() { const r = rowsShown(); r.forEach(el => el.querySelector('.rw-in').tabIndex = -1); const f = (L.focusId && r.find(el => el.dataset.id === L.focusId)) || r[0]; if (f) f.querySelector('.rw-in').tabIndex = 0; }
function measure() { L.secTops = [...body.querySelectorAll('.lr-sec:not(.gone)')].map(s => s.offsetTop); L.secIdx = secAt(sc.scrollTop); }
const secAt = y => { let i = -1; L.secTops.forEach((t, k) => { if (t <= y + 2) i = k; }); return i; };
// FLIP: rows that stay on screen glide to their new place; newcomers fade in
function flip(fn) {
  const k = kscale(), before = new Map(); rowsShown().forEach(r => { const b = r.getBoundingClientRect(); if (b.bottom > 0 && b.top < innerHeight) before.set(r.dataset.id, b.top); });
  fn();
  const moved = [];
  rowsShown().forEach(r => { const b = r.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) return; const was = before.get(r.dataset.id); // the li moves (its .rw-g clips for folding)
    r.style.transition = 'none'; if (was == null) { r.style.opacity = 0; r.style.transform = 'translateY(14px)'; } else if (Math.abs(was - b.top) > 1) r.style.transform = `translateY(${(was - b.top) / k}px)`; else return; moved.push(r); });
  void body.offsetWidth; moved.forEach(r => { r.style.transition = 'transform .52s cubic-bezier(.3,1.15,.5,1),opacity .35s,grid-template-rows .36s cubic-bezier(.2,0,0,1)'; r.style.transform = ''; r.style.opacity = ''; setTimeout(() => { r.style.transition = ''; }, 540); });
}

/* ---------- the sheet: one spring drives the DOM and the paper plane together ---------- */
function setSheet(y, instant) {
  L.sy.t = y; if (instant || RM) { L.sy.x = y; L.sy.v = 0; }
  if (!L.sheetTick) L.sheetTick = SB.onTick(dt => { const m = sstep(L.sy, dt); applySheet(); SB.requestFrame(); if (!m) { L.sheetTick(); L.sheetTick = null; } });
  applySheet(); SB.requestFrame();
}
function applySheet() { wrap.style.transform = `translate3d(0,${(L.sy.x - TOP).toFixed(2)}px,0)`; wrap.classList.toggle('on', L.sy.x < SH - 1 || L.on); placePaper(); }
function binY() { _v.set(K.BINP ? K.BINP.x : 1.1, .45, K.BINP ? K.BINP.z : -.34).project(camera); return clamp((1 - _v.y) / 2 * SH + 70, 560, 700); }
// where a row's thumbnail is (screen px, centre), if the sheet were at sheetY
function thumbAt(it, sheetY) {
  const r = rowOf(it); if (!r) return null; const b = r.querySelector('.rw-in').getBoundingClientRect(), S0 = screenEl.getBoundingClientRect(), k = kscale();
  const x = (b.left - S0.left) / k + PADL + TW / 2, y = (b.top - S0.top) / k - (L.sy.x - TOP) + (sheetY - TOP) + PADT + TH / 2;
  const top = sheetY + BAR + 26, bot = SH - 10;
  return {x, y, vis: y > top && y < bot, cy: clamp(y, top - 60, bot + 90)};
}
const pose = () => ({c: new T3.Vector3(), q: new T3.Quaternion(), s: 1});
function thumbPose(r, out) { out = out || pose(); screenToWorld(r.x, r.vis === false ? r.cy : r.y, DB, out.c); out.q.copy(camera.quaternion); out.s = (r.vis === false ? TH * .6 : TH) * upp(DB) / K.BH; return out; }
function slotPose(it, out) { out = out || pose(); const sp = SB.slotPose(it.book); if (!sp) return bookPose(it, out); const s = sp.scale;
  out.c.copy(sp.position).add(_v.set(K.BW / 2 * s, K.BH / 2 * s, 0).applyQuaternion(sp.quaternion)); out.q.copy(sp.quaternion); out.s = s; return out; }
function bookPose(it, out) { out = out || pose(); const g = it.book.group; g.updateMatrixWorld(true); out.c.copy(g.localToWorld(_v.set(K.BW / 2, K.BH / 2, 0))); out.q.copy(g.quaternion); out.s = g.scale.x; return out; }

/* ---------- a book's flight between the shelf and a row (a parabola in world space; the scene poses it through it.fly) ---------- */
const flights = new Set();
// a book in the air is drawn after the paper (moved to the transparent pass, keeping its own decal order), so it is never hidden by the sheet
function airborne(it, on) {
  if (!it.book || !!it.air === on) return; it.air = on;
  it.book.group.traverse(o => { if (!o.isMesh) return;
    if (on) { o.userData.ro0 = o.renderOrder; o.renderOrder = 10 + o.renderOrder; } else if (o.userData.ro0 !== undefined) o.renderOrder = o.userData.ro0;
    [].concat(o.material).forEach(m => { if (on && !m.transparent) { m.transparent = true; m.userData.tr0 = 1; } else if (!on && m.userData.tr0) { m.transparent = false; m.userData.tr0 = 0; } }); });
}
function fly(it, A, Bfn, o, done) {
  K.ensureBook(it); it.hidden = false; it.pre = false; it.sink = 0; it.lr = true; it.fly = {c: A.c.clone(), q: A.q.clone(), s: A.s}; airborne(it, true);
  const mid = new T3.Vector3(), B = pose(); let t = 0;
  const f = {it, un: null}; flights.add(f);
  f.un = SB.onTick(dt => {
    t = Math.min(1, t + dt / (RM ? .001 : o.dur)); Bfn(B); const e = o.ease ? o.ease(t) : eio(t), u = 1 - e;
    mid.lerpVectors(A.c, B.c, .5); mid.y = Math.max(A.c.y, B.c.y) + o.lift;
    it.fly.c.set(u * u * A.c.x + 2 * u * e * mid.x + e * e * B.c.x, u * u * A.c.y + 2 * u * e * mid.y + e * e * B.c.y, u * u * A.c.z + 2 * u * e * mid.z + e * e * B.c.z);
    it.fly.q.copy(A.q).slerp(B.q, clamp(eob(seg(t, .05, .9)), 0, 1.08));
    if (o.roll) it.fly.q.premultiply(_q.setFromAxisAngle(_ax.set(0, 0, 1).applyQuaternion(camera.quaternion), Math.sin(Math.PI * t) * o.roll));
    it.fly.s = lerp(A.s, B.s, o.sEase ? o.sEase(t) : eio(t)); SB.requestFrame();
    if (t >= 1) { f.un(); flights.delete(f); airborne(it, false); done && done(B); }
  });
  return f;
}
function cancelFlights() { flights.forEach(f => { f.un(); f.it.fly = null; f.it.lr = false; airborne(f.it, false); }); flights.clear(); }
// a book lands in its row: the 3D book goes, the painted thumbnail takes over with a little bounce
function land(it, k) {
  it.fly = null; it.lr = false; it.inRow = true; it.hidden = true; if (it.rope) it.rope.init = false;
  const r = rowOf(it); if (r) { r.classList.remove('pend'); const th = r.querySelector('.rw-th'); th.classList.remove('pop'); void th.offsetWidth; th.classList.add('pop'); }
  snd('tick', {pitch: 1.25 + (k || 0) * .05, gain: .55}); hap('selection'); SB.requestFrame();
}

/* ---------- enter / leave ---------- */
const canToggle = () => !L.busy && K.mode === 'shelf' && K.openState === 'none' && !K.ov && !K.bvOn;
function chrome(on) {
  screenEl.classList.toggle('rows', on); if (on) screenEl.classList.add('rowsx'); tg.setAttribute('aria-pressed', String(on)); tg.setAttribute('aria-label', on ? 'Back to the shelf' : 'List view');
  if (titleEl) { titleEl.classList.add('swap'); setTimeout(() => { titleEl.textContent = on ? 'Your notes' : 'Your shelf'; titleEl.classList.remove('swap'); }, 120); }
  wrap.inert = !on; if (srEl) srEl.inert = on;
}
function enterList(then) {
  if (L.on || !canToggle()) return; if (!plane) buildPlane();
  L.on = true; L.busy = true; K.untilt(); closePeek(true);
  const fi = SB.state.front, N = K.items.length, slot = it => { const d = ((K.items.indexOf(it) - fi) % N + N) % N; return Math.min(d, N - d); };
  const flyers = RM ? [] : K.items.filter(it => it.book && it.book.group.visible).sort((a, b) => slot(a) - slot(b));
  K.items.forEach(it => { it.inRow = flyers.indexOf(it) < 0; if (it.inRow) it.hidden = true; });
  rebuild(); sc.scrollTop = 0; driftLight(); chrome(true); wrap.classList.add('busy');
  live.textContent = `List view. ${K.items.length} notes, newest first.`;
  if (RM) { wrap.style.opacity = 0; setSheet(TOP, true); SB.requestFrame(); requestAnimationFrame(() => { wrap.style.transition = 'opacity .3s'; wrap.style.opacity = ''; }); L.busy = false; wrap.classList.remove('busy'); measure(); then && then(); return; }
  wrap.classList.add('enter', 'fly'); setSheet(DOWN, true); snd('riffle', {pitch: .8, gain: .55}); hap('selection');
  later(40, () => { setSheet(TOP); snd('whoosh', {pitch: .7, gain: .35}); });
  later(220, () => wrap.classList.remove('enter'));
  let left = flyers.length; const fin = () => { L.busy = false; wrap.classList.remove('busy', 'fly'); measure(); then && then(); };
  if (!left) later(500, fin);
  flyers.forEach((it, k) => later(k * 60, () => {
    it.sq.t = -.2; // crouch…
    later(70, () => { it.sq.t = 0; it.sq.v = 5; snd('whoosh', {pitch: 1.25 + k * .06, gain: .25});
      fly(it, bookPose(it), B => thumbPose(thumbAt(it, TOP) || {x: SW / 2, y: SH + 80, vis: false, cy: SH + 80}, B), {dur: .62, lift: .8, roll: (k % 2 ? -.35 : .35), sEase: t => eio(Math.pow(t, .8))},
        () => { land(it, k); if (--left === 0) fin(); }); });
  }));
}
function exitList(then) {
  if (!L.on || L.busy || K.mode !== 'shelf' || K.openState !== 'none' || K.bvOn) return; closePeek(true);
  const vis = rowsShown().map(r => ({r, b: r.getBoundingClientRect()})), S0 = screenEl.getBoundingClientRect(), k = kscale(), scTop = S0.top + (TOP + BAR + 20) * k;
  const inView = o => o.b.bottom > scTop && o.b.top < S0.top + (SH - 90) * k, was = K.items[SB.state.front], keep = was && vis.find(o => o.r.dataset.id === String(was.note.id) && inView(o));
  const top = keep || vis.find(o => o.b.bottom > scTop), topIt = top && byId(top.r.dataset.id);
  if (topIt) K.front(K.items.indexOf(topIt));
  L.busy = true; wrap.classList.add('busy'); chrome(false); hap('selection');
  const fi = SB.state.front, N = K.items.length, slot = i => { const s = ((i - fi) % N + N) % N; return s > N / 2 ? s - N : s; };
  const flyers = RM ? [] : K.items.filter((it, i) => Math.abs(slot(i)) < 2.9).sort((a, b) => Math.abs(slot(K.items.indexOf(a))) - Math.abs(slot(K.items.indexOf(b))));
  const finish = () => { L.on = false; L.busy = false; screenEl.classList.remove('rowsx'); wrap.classList.remove('busy', 'dim'); K.items.forEach(it => { if (!it.fly) { it.hidden = false; it.inRow = false; } }); setSheet(DOWN, true); wrap.style.opacity = '';
    try { SB.search(L.q); } catch (e) {} K.wake(1500); then && then(); };
  if (RM) { wrap.style.opacity = 0; setTimeout(finish, 200); return; }
  snd('riffle', {pitch: 1.05, gain: .45});
  later(90, () => { setSheet(DOWN); wrap.classList.add('dim'); });
  let left = flyers.length; const done1 = () => { if (--left <= 0) later(120, finish); };
  if (!left) later(500, finish);
  flyers.forEach((it, j) => later(j * 55, () => {
    K.ensureBook(it); const r = thumbAt(it, L.sy.x), A = thumbPose(r || {x: SW / 2, y: SH + 80, vis: false, cy: SH + 80});
    const row = rowOf(it); if (row) row.classList.add('pend'); it.inRow = false;
    fly(it, A, B => slotPose(it, B), {dur: .66, lift: .7, roll: (j % 2 ? .3 : -.3), sEase: t => eio(Math.pow(t, 1.25))}, B => {
      it.fly = null; it.lr = false; if (it.rope) it.rope.init = false; it.sq.v = -5;
      snd('thup', {pitch: .9 + Math.random() * .25, gain: .8}); hap('light'); K.spawnPuff(B.c.x, B.c.z, 12, .55); K.ripple(B.c.x, B.c.z, .012); K.wake(1500); done1(); });
  }));
}

/* ---------- open a row: the thumbnail grows back into the book, which settles on the turntable and opens (SBOpen) ---------- */
function openRow(it) {
  if (!L.on || L.busy || !it || K.openState !== 'none' || K.mode !== 'shelf') return;
  L.busy = true; L.focusId = String(it.note.id); wrap.classList.add('busy'); closePeek(true);
  const r = thumbAt(it, L.sy.x); K.front(K.items.indexOf(it)); K.ensureBook(it);
  const A = thumbPose(r || {x: SW / 2, y: SH / 2, vis: true}), row = rowOf(it); if (row) row.classList.add('pend'); it.inRow = false;
  snd('whoosh', {pitch: 1.15, gain: .4}); hap('selection');
  later(40, () => { setSheet(DOWN); wrap.classList.add('dim'); });
  fly(it, A, B => slotPose(it, B), {dur: .62, lift: .45, sEase: t => eio(Math.pow(t, 1.3))}, () => {
    it.fly = null; it.lr = false; if (it.rope) it.rope.init = false; it.sq.v = -3; snd('thup', {pitch: 1.1, gain: .5});
    L.busy = false; K.openItem(it); hurryClose();
  });
}
// once the cover has clapped and the book is nearly home, the springs only ring invisibly: settle them so it can be filed at once (as in the catalogue)
function hurryClose() { let seen = false, t = 0; const u = SB.onTick(dt => { const c = window.SBOpen && SBOpen._cur; t += dt; if (!c) { if (K.openState === 'none' && (seen || t > 8)) u(); return; } seen = true;
  if (c.phase !== 'close' || !c.falling || !c.sp) return; const sp = c.sp; if (sp.cover.x > .03 || Math.abs(sp.lift.x) > .07 || Math.abs(sp.turn.x) > .07 || Math.abs(sp.cam2.x) > .1) return;
  [sp.lift, sp.turn, sp.yoff, sp.sq, sp.cover, sp.cam1, sp.cam2].concat(c.pages || []).forEach(x => { x.x = x.t; x.v = 0; }); }); }
SB.hooks = SB.hooks || {};
SB.hooks.closed = (it, removing) => {
  if (!L.on) return false;
  if (removing) { setSheet(binY()); wrap.classList.remove('dim'); watchBin(); return true; } // the note page's trash: the bin is on the plinth, the list makes way
  L.busy = true; const row = rowOf(it);
  if (row) { const b = row.getBoundingClientRect(), S0 = screenEl.getBoundingClientRect(), k = kscale(), y = (b.top - S0.top) / k - (L.sy.x - TOP);
    if (y < TOP + BAR + 30 || y > SH - 220) sc.scrollTop += (y - (TOP + BAR + 140)); }
  wrap.classList.remove('dim'); setSheet(TOP);
  fly(it, bookPose(it), B => thumbPose(thumbAt(it, TOP) || {x: SW / 2, y: SH + 80, vis: false, cy: SH + 80}, B), {dur: .66, lift: .6, roll: .25, sEase: t => eio(Math.pow(t, .8))}, () => {
    land(it); L.busy = false; wrap.classList.remove('busy'); const r = rowOf(it); r && r.querySelector('.rw-in').focus({preventScroll: true}); });
  return true;
};

/* ---------- the clay bin: swipe left; the book hops onto the plinth and leaps into the pot (scene's binDelete) ---------- */
function binRow(it) {
  if (!L.on || L.busy || !it || K.mode !== 'shelf' || K.openState !== 'none') return;
  L.busy = true; wrap.classList.add('busy');
  const r = thumbAt(it, L.sy.x), row = rowOf(it); K.front(K.items.indexOf(it)); K.ensureBook(it);
  const A = thumbPose(r || {x: SW / 2, y: SH / 2, vis: true}); it.inRow = false;
  if (row) { row.classList.add('pend', 'gone'); }
  setSheet(binY());
  fly(it, A, B => slotPose(it, B), {dur: RM ? .001 : .4, lift: .35, sEase: t => eio(Math.pow(t, 1.3))}, () => {
    it.fly = null; it.lr = false; if (it.rope) it.rope.init = false; L.busy = false;
    SB.remove(it.note); watchBin();
  });
}
let binWatch = null;
function watchBin() { // once the pot has swallowed (or spat), the list comes back up
  if (binWatch) binWatch(); let t = 0;
  binWatch = SB.onTick(dt => { t += dt; if (t < .35 || K.mode !== 'shelf' || K.binBusy || K.bvOn || K.openState !== 'none') return; binWatch(); binWatch = null;
    if (L.on) { setSheet(TOP); wrap.classList.remove('busy', 'dim'); later(500, measure); } });
}
SB.hooks.undoStart = it => { if (!L.on) return; L.busy = true; wrap.classList.add('busy'); wrap.classList.remove('dim'); setSheet(binY()); };
SB.hooks.undoTo = it => {
  if (!L.on) return null; it.inRow = false; const row = rowOf(it); if (row) row.classList.add('pend');
  if (row) { const sec = row.closest('.lr-sec'), first = sec && sec.querySelector('.rw:not(.gone)') === row; sc.scrollTop = sec ? (first ? sec.offsetTop : sec.offsetTop + row.offsetTop - 30) : 0; }
  const r = thumbAt(it, L.sy.t), P = thumbPose(r || {x: SW / 2, y: SH - 120, vis: true}); return {p: P.c, q: P.q, s: P.s};
};
SB.hooks.undoLanded = it => { if (!L.on) return false; land(it); L.busy = false; watchBin(); return true; };
SB.hooks.sync = () => { if (!L.on) return; const s = sc.scrollTop; K.items.forEach(it => { if (it.inRow === undefined) it.inRow = false; }); rebuild(); sc.scrollTop = s; };
SB.hooks.search = q => { if (!L.on) return false; L.q = q || ''; flip(() => applyFilter()); if (L.q) sc.scrollTo({top: 0, behavior: RM ? 'auto' : 'smooth'}); return true; };
if (SB.bin) { const prev = SB.bin.onchange; SB.bin.onchange = type => { try { prev && prev(type); } catch (e) {}
  if (!L.on) return;
  if (type === 'open') { setSheet(DOWN); wrap.classList.add('dim'); }
  else if (type === 'close') setTimeout(() => { if (K.mode !== 'restoring') { setSheet(TOP); wrap.classList.remove('dim', 'busy'); } }, 0);
  else if (type === 'change' || type === 'emptied') { const b = body.querySelector('.lr-bin'), h = binRowHTML(); if (b) b.outerHTML = h || ''; else if (h) body.insertAdjacentHTML('beforeend', h); } }; }

/* ---------- pin: swipe right; the row glides up into "Pinned" ---------- */
function pinRow(it) {
  if (!it || L.busy) return; it.note.pinned = !it.note.pinned; L.focusId = String(it.note.id);
  flip(rebuild); if (it.note.pinned && sc.scrollTop > 0) sc.scrollTo({top: 0, behavior: RM ? 'auto' : 'smooth'}); snd('pop', {pitch: it.note.pinned ? 1.35 : 1.0, gain: .5}); hap('light');
  live.textContent = `${it.note.title || 'Untitled'} ${it.note.pinned ? 'pinned to the top' : 'unpinned'}.`; later(450, measure);
}

/* ---------- peek: hold a row; a lifted card with the whole note; release to put it back, slide up to open ---------- */
function openPeek(it, row) {
  const n = it.note, c = hexMix(CLOTH[n.tag] || '#CDBDF2', '#FFFFFF', .35), w = nWords(n.body);
  pkCard.innerHTML = `<div class="pk-hd"><span class="rw-th"><img alt="" data-t="${n.tag}" src="${thumbURL(n.tag)}"></span><div><div class="rw-m"><span class="sb-tg" style="--c:${c};--d:${INK[n.tag] || '#2B2A4A'}">${gsvg(n.tag, 11)}${esc(n.tag)}</span><span>${esc(n.date)} · ${w} words</span></div><p class="pk-t">${esc(n.title || 'Untitled')}</p></div></div>
    <p class="pk-b">${esc(n.body || 'Empty for now.')}</p><div class="pk-ft">${I_UP}<span>Slide up to open</span><span class="bar"><i></i></span></div>`;
  pk.classList.add('on'); pk.setAttribute('aria-hidden', 'false');
  const S0 = screenEl.getBoundingClientRect(), k = kscale(), rb = row.getBoundingClientRect(), ry = (rb.top - S0.top) / k, h = pkCard.offsetHeight;
  const top = clamp(ry - 30, 70, SH - h - 50); pkCard.style.top = top + 'px';
  pkCard.style.transition = 'none'; pkCard.style.transform = `translateY(${(ry - top) * .6}px) scale(.9)`; void pkCard.offsetWidth; pkCard.style.transition = '';
  pk.classList.add('show'); pkCard.style.transform = '';
  row.classList.add('peeked'); L.peek = {it, row, arm: false};
  snd('riffle', {pitch: 1.8, gain: .3}); hap('selection'); live.textContent = `${n.title}. ${n.body}`;
}
function movePeek(dy) { const P = L.peek; if (!P) return; const p = clamp(-dy / 90, 0, 1); pkCard.classList.add('drag');
  pkCard.style.transform = `translateY(${Math.min(0, dy) * .45 + Math.max(0, dy) * .15}px) scale(${1 + p * .02})`; pkCard.style.setProperty('--p', p);
  if ((p >= 1) !== P.arm) { P.arm = p >= 1; pkCard.classList.toggle('arm', P.arm); if (P.arm) { snd('tick', {pitch: 1.5, gain: .45}); hap('selection'); } } }
function closePeek(instant, open) {
  const P = L.peek; if (!P) return; L.peek = null; P.row.classList.remove('peeked'); pkCard.classList.remove('drag', 'arm');
  pk.classList.remove('show'); pk.setAttribute('aria-hidden', 'true'); pkCard.style.transform = open ? 'translateY(-30px) scale(.96)' : 'scale(.94)';
  setTimeout(() => { if (!L.peek) pk.classList.remove('on'); }, instant ? 0 : 300);
  if (open) openRow(P.it);
}

/* ---------- gestures on the rows: tap, swipe (pin / bin), hold (peek), and mouse drag-scroll with momentum ---------- */
const SWIPE = 92;
let inertia = 0;
function stopInertia() { if (inertia) cancelAnimationFrame(inertia); inertia = 0; }
sc.addEventListener('pointerdown', e => {
  if (e.button > 0 || L.busy || !L.on) return; stopInertia();
  const inn = e.target.closest('.rw-in'), row = inn && inn.closest('.rw');
  L.g = {id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0, axis: null, row, inn, it: row && byId(row.dataset.id), s0: sc.scrollTop, mouse: e.pointerType === 'mouse', armed: false,
    pt: inn ? setTimeout(() => inn.classList.add('prs'), 70) : 0,
    lp: row ? setTimeout(() => { const g = L.g; if (g && !g.axis && g.it) { g.axis = 'peek'; try { sc.setPointerCapture(g.id); } catch (er) {} openPeek(g.it, g.row); } }, 430) : 0};
});
sc.addEventListener('pointermove', e => {
  const g = L.g; if (!g || g.id !== e.pointerId) return; const k = kscale(), dx = (e.clientX - g.x0) / k, dy = (e.clientY - g.y0) / k, now = performance.now(), dtt = Math.max(1, now - g.lt) / 1000;
  if (!g.axis && Math.hypot(dx, dy) > 8) { clearTimeout(g.lp); clearTimeout(g.pt); g.inn && g.inn.classList.remove('prs');
    if (g.row && Math.abs(dx) > Math.abs(dy) * 1.25) { g.axis = 'swipe'; g.inn.classList.add('drag'); try { sc.setPointerCapture(g.id); } catch (er) {} }
    else if (g.mouse) { g.axis = 'scroll'; try { sc.setPointerCapture(g.id); } catch (er) {} } else g.axis = 'native'; }
  if (g.axis === 'peek') movePeek(dy);
  if (g.axis === 'swipe') { const lim = 150, d = Math.abs(dx) > lim ? Math.sign(dx) * (lim + (Math.abs(dx) - lim) * .3) : dx;
    g.inn.style.transform = `translateX(${d}px)`; g.row.classList.add('sw'); g.row.classList.toggle('sw-l', d < 0); g.row.classList.toggle('sw-r', d > 0);
    const arm = Math.abs(d) > SWIPE; if (arm !== g.armed) { g.armed = arm; g.row.classList.toggle('arm', arm); if (arm) { snd('tick', {pitch: d < 0 ? .8 : 1.4, gain: .5}); hap('selection'); } }
    g.vx = lerp(g.vx, (e.clientX - g.lx) / k / dtt, .4); }
  if (g.axis === 'scroll') { sc.scrollTop = g.s0 - dy; g.vy = lerp(g.vy, -(e.clientY - g.ly) / k / dtt, .45); }
  g.lx = e.clientX; g.ly = e.clientY; g.lt = now;
});
function gEnd(e) {
  const g = L.g; if (!g || g.id !== e.pointerId) return; L.g = null; clearTimeout(g.lp); clearTimeout(g.pt); g.inn && setTimeout(() => g.inn.classList.remove('prs'), 120);
  if (g.axis === 'peek') { const open = !!(L.peek && L.peek.arm) && e.type === 'pointerup'; closePeek(false, open); return; }
  if (g.axis === 'swipe') {
    const m = new DOMMatrixReadOnly(getComputedStyle(g.inn).transform).m41, fast = Math.abs(g.vx) > 700 && Math.abs(m) > 40;
    g.inn.classList.remove('drag'); g.row.classList.remove('arm');
    const commit = e.type === 'pointerup' && (Math.abs(m) > SWIPE || fast) ? Math.sign(m) : 0;
    if (commit < 0) { g.inn.style.transition = 'transform .24s cubic-bezier(.4,0,1,1)'; g.inn.style.transform = `translateX(-${SW}px)`; snd('whoosh', {pitch: 1.4, gain: .35}); binRow(g.it); }
    else { g.inn.style.transform = ''; setTimeout(() => g.row.classList.remove('sw', 'sw-l', 'sw-r'), 420); if (commit > 0) pinRow(g.it); else snd('tick', {pitch: 1.7, gain: .25}); }
    return; }
  if (g.axis === 'scroll') { if (performance.now() - g.lt > 80) g.vy = 0; let v = clamp(g.vy, -4200, 4200), last = performance.now();
    const step = t => { const dt = Math.min(.05, (t - last) / 1000); last = t; v *= Math.exp(-3.4 * dt); sc.scrollTop += v * dt; inertia = Math.abs(v) > 12 ? requestAnimationFrame(step) : 0; };
    if (Math.abs(v) > 60) inertia = requestAnimationFrame(step); return; }
  if (!g.axis && e.type === 'pointerup' && g.it) { const b = e.target.closest('.lr-bin'); if (!b) openRow(g.it); }
}
sc.addEventListener('pointerup', gEnd); sc.addEventListener('pointercancel', gEnd);
sc.addEventListener('touchmove', e => { const g = L.g; if (g && (g.axis === 'swipe' || g.axis === 'peek')) e.preventDefault(); }, {passive: false});
sc.addEventListener('contextmenu', e => e.preventDefault());
sc.addEventListener('wheel', () => stopInertia(), {passive: true});
sc.addEventListener('click', e => { const b = e.target.closest('.lr-bin'); if (b && L.on && !L.busy) { setSheet(DOWN); wrap.classList.add('dim'); later(220, () => { if (!SB.bin.open()) { setSheet(TOP); wrap.classList.remove('dim'); } }); } });
sc.addEventListener('scroll', () => {
  if (!lightRaf) lightRaf = requestAnimationFrame(driftLight);
  const i = secAt(sc.scrollTop); if (i !== L.secIdx) { if (L.on && !L.busy && i >= 0 && L.secIdx >= -1) { snd('tick', {pitch: 1.55 + (i % 3) * .08, gain: .3}); hap('selection'); } L.secIdx = i; }
}, {passive: true});
// keyboard: a single tab stop; arrows walk the rows
sc.addEventListener('keydown', e => {
  if (!L.on) return; const rows = rowsShown(), cur = e.target.closest && e.target.closest('.rw'), i = rows.indexOf(cur), it = cur && byId(cur.dataset.id);
  const go = j => { const r = rows[clamp(j, 0, rows.length - 1)]; if (!r) return; rows.forEach(x => x.querySelector('.rw-in').tabIndex = -1); const inn = r.querySelector('.rw-in'); inn.tabIndex = 0; L.focusId = r.dataset.id;
    inn.focus({preventScroll: true}); inn.scrollIntoView({block: 'nearest', behavior: RM ? 'auto' : 'smooth'}); e.preventDefault(); };
  if (e.key === 'ArrowDown') go(i + 1); else if (e.key === 'ArrowUp') go(i - 1); else if (e.key === 'Home') go(0); else if (e.key === 'End') go(rows.length - 1);
  else if ((e.key === 'Enter' || e.key === ' ') && it) { e.preventDefault(); openRow(it); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && it) { e.preventDefault(); binRow(it); }
  else if ((e.key === 'p' || e.key === 'P') && it) { e.preventDefault(); pinRow(it); later(30, () => { const r = rowOf(it); r && r.querySelector('.rw-in').focus({preventScroll: true}); }); }
  else if (e.key === 'Escape') { e.preventDefault(); exitList(() => tg.focus()); }
});

/* ---------- chrome wiring ---------- */
tg.addEventListener('click', () => { L.on ? exitList() : enterList(); });
segEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !L.on || L.sort === b.dataset.s) return; L.sort = b.dataset.s;
  segEl.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); snd('riffle', {pitch: 1.3, gain: .4}); hap('selection');
  flip(rebuild); sc.scrollTo({top: 0, behavior: RM ? 'auto' : 'smooth'}); later(500, measure); live.textContent = L.sort === 'tag' ? 'Grouped by tag.' : 'Newest first.'; });
chipsEl.addEventListener('click', e => { const b = e.target.closest('.sb-chip'); if (!b || !L.on) return; const t = b.dataset.tag || null; L.tag = L.tag === t ? null : t;
  chipsEl.querySelectorAll('.sb-chip').forEach(c => c.setAttribute('aria-pressed', String((c.dataset.tag || null) === L.tag))); snd('tick', {pitch: 1.35, gain: .45}); hap('selection');
  flip(() => applyFilter()); sc.scrollTo({top: 0, behavior: RM ? 'auto' : 'smooth'}); });
const capture = (sel, fn) => { const el = screenEl.querySelector(sel); el && el.addEventListener('click', e => { if (!L.on) return; e.stopImmediatePropagation(); e.preventDefault(); fn(); }, true); };
capture('.sb-fab', () => { if (L.busy || K.mode !== 'shelf' || K.openState !== 'none') return; L.busy = true; sc.scrollTop = 0; setSheet(DOWN); wrap.classList.add('dim'); hap('selection');
  later(260, () => { L.busy = false; const n = SB.create('Ideas'); if (!n) { setSheet(TOP); wrap.classList.remove('dim'); } else hurryClose(); }); });
capture('.sb-ovb', () => exitList(() => SB.setOverview(true)));
const rep = document.getElementById('replay');
rep && rep.addEventListener('click', () => { if (!L.on) return; cancelFlights(); closePeek(true); L.on = false; L.busy = false; chrome(false); screenEl.classList.remove('rowsx'); wrap.classList.remove('busy', 'dim', 'enter');
  K.items.forEach(it => { it.hidden = false; it.inRow = false; it.fly = null; it.lr = false; }); setSheet(DOWN, true); }, true);
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (L.peek) closePeek(); else if (L.on && K.openState === 'sbopen-open' && window.SBOpen && !e.defaultPrevented && !(e.target.closest && e.target.closest('.sbo-root, [class^="sbo"]'))) { e.preventDefault(); SBOpen.close(); } }, true);
// time of day: repaint the paper, the light and the covers (the DOM follows [data-time])
new MutationObserver(() => { if (plane) paintPaper(); paintLight(); if (L.on) { const s = sc.scrollTop; rebuild(); sc.scrollTop = s; } SB.requestFrame(); }).observe(screenEl, {attributes: true, attributeFilter: ['data-time']});
// warm up off the critical path: the covers, the paper and the light
const warm = () => { TAGS.forEach(t => thumbURL(t)); if (!plane) buildPlane(); paintLight(); };
(window.SBArt && SBArt.ready ? Promise.race([SBArt.ready, new Promise(r => setTimeout(r, 3000))]) : Promise.resolve()).then(() => setTimeout(warm, 600));
})();
