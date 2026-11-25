/* Softbound v3: CARD CATALOGUE, the list mode. A clay card-catalogue drawer is thrown up out of the plinth and slides toward you;
   every book leaps in and turns into an index card standing on the drawer's brass rod (a tab in its cloth colour, a painted stamp of
   its cover, title, tag, date · words, first line). Flick through like a real drawer: the cards behind fan back so their title strips
   read like a list, the card you pass falls toward you; momentum, friction and a detent per card. Tap a card: it slides out, turns into
   its book and opens with SBOpen; closing files it back. Throw a card sideways: it becomes its book and leaps into the clay bin.
   Loaded after scene.js; talks through window.SB (+ SB._k internals and SB.hooks). */
(function () {
'use strict';
const SB = window.SB, T3 = window.THREE;
if (!SB || !SB._k || !T3 || !SB.screenEl) return;
const K = SB._k, screenEl = SB.screenEl, scene = SB.scene, camera = SB.camera;
const RM = !!K.RM;
const CLOTH = window.SB_CLOTH || {Travel: '#A9C8EE', Recipes: '#F5B98A', Personal: '#EFB3C2', Work: '#A8DCC4', Reading: '#F3DB8C', Ideas: '#CDBDF2'};
const INK = window.SB_INK || {Travel: '#2C4E78', Recipes: '#7A3F1C', Personal: '#80344B', Work: '#1E5A43', Reading: '#6A4C07', Ideas: '#4B3D8A'};
const TAGS = ['Travel', 'Recipes', 'Personal', 'Work', 'Reading', 'Ideas'];
const snd = (n, o) => { try { window.SBSound && SBSound.play(n, o || {}); } catch (e) {} };
const hap = k => { try { window.SBHaptics && SBHaptics[k] && SBHaptics[k](); } catch (e) {} };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, eoc = t => 1 - Math.pow(1 - t, 3), eic = t => t * t * t;
const eob = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const sm = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }, seg = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
const S = (x, k, z) => ({x, v: 0, t: x, k, z});
function sstep(s, dt) { const c = 2 * Math.sqrt(s.k) * s.z, a = s.k * (s.t - s.x) - c * s.v; s.v += a * dt; s.x += s.v * dt;
  if (Math.abs(s.t - s.x) < 1e-4 && Math.abs(s.v) < 1e-3) { s.x = s.t; s.v = 0; return false; } return true; }
const lin = h => new T3.Color(h).convertSRGBToLinear();
function hexMix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join(''); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const nWords = s => (String(s || '').trim().match(/\S+/g) || []).length;
const D2R = Math.PI / 180;

/* ---------- dimensions (world units) ---------- */
const CW = 1.5, CH = .9, TAB = .1, TABW = .44, CT = .007, HOLE_Y = .075, HOLE_R = .024;   // index card 5×3, a tab, the rod hole
const TABX = [-.47, 0, .47];
const tabOf = tag => Math.max(0, TAGS.indexOf(tag)) % 3;
const DW = 1.68, DL = 3.1, WT = .075, WH = .34, FH = .52, FT = .11;                          // the drawer
const DPOS = new T3.Vector3(0, .06, K.CZ + .02);                                            // seated on the plinth
// the fan: cards ahead lean back (so their title strips read like a list), the card you pass falls toward you
const TH0 = 11 * D2R, THM = 68 * D2R, TAU = 3.2, G = .2, ZA = .85, ZP = .3, ZB = 4.5, SP2 = .006, WA = 11, WB = 5, FAR = 20, FARP = 8;
const PASS = [30, 40, 47, 52, 55, 57].map(a => a * D2R);
const passA = a => { a = Math.max(0, a); const i = Math.min(PASS.length - 2, Math.floor(a)); return a >= PASS.length - 1 ? PASS[PASS.length - 1] : lerp(PASS[i], PASS[i + 1], a - i); };
function lay(u, o) { // o.th: lean (+ back), o.z: pivot z relative to the finger gap
  if (u >= 0) { o.th = TH0 + (THM - TH0) * (1 - Math.exp(-u / TAU)); o.z = -G - ZA * (1 - Math.exp(-u / ZB)) - Math.min(u, FAR) * SP2; }
  else if (u <= -1) { const a = -u - 1; o.th = -passA(a); o.z = G + ZP * (1 - Math.exp(-a / ZB)) + Math.min(a, FARP) * SP2; }
  else { const e = sm(-u); o.th = lerp(TH0, -PASS[0], e); o.z = lerp(-G, G, e); }
  return o;
}
function gapZ(p, n) { // keep the whole stack centred in the drawer as the gap travels
  const np = clamp(p, 0, Math.max(0, n - 1)), na = Math.max(0, n - 1 - np);
  const front = G * Math.min(np, 1) + ZP * (1 - Math.exp(-Math.max(np - 1, 0) / ZB)) + Math.min(Math.max(np - 1, 0), FARP) * SP2 + .76 * Math.min(np, 1);
  const back = G + ZA * (1 - Math.exp(-na / ZB)) + Math.min(na, FAR) * SP2 + .62 * Math.min(na, 1);
  return (back - front) / 2 + .1;
}

/* ---------- state ---------- */
const L = {on: false, busy: false, x: 0, cam: S(0, 16, 1), aside: S(0, 14, 1), dr: S(0, 85, .6), drawer: 0, p: 0, v: 0, mode: 'rest', target: 0, lastF: -1, lastRiffle: 0,
  order: [], idx: new Map(), sort: 'newest', q: '', flag: null, gz: 0, gzS: S(0, 40, 1), drag: null, envK: 1, time: SB.time};
const SBList = window.SBList = {get on() { return L.on; }, toggle: () => setList(!L.on), set: setList, get state() { return {on: L.on, busy: L.busy, p: L.p, n: L.order.length, sort: L.sort}; }};
const cs = it => it.cat || (it.cat = {th: S(0, 240, .5), lift: S(0, 120, .55), sw: S(0, 160, .7), dim: S(0, 60, 1), fly: null, hide: false, drive: false, init: false});

/* ---------- clipping: everything in the drawer is clipped at the clay surface (it is thrown up out of the plinth) ---------- */
const clipY = new T3.Plane(new T3.Vector3(0, 1, 0), 0);
const ENV = {morning: .42, golden: .3, night: .12};
function prepMat(m) { m.clippingPlanes = [clipY]; m.userData.env0 = 1; m.envMapIntensity = ENV[SB.time] || .3; return m; }
const WRAP = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', T3.ShaderChunk.lights_physical_pars_fragment.replace(
  'vec3 irradiance = dotNL * directLight.color;', 'vec3 irradiance = (saturate((dot(geometry.normal, directLight.direction) + 0.45) / 1.45) * vec3(1.0, 0.94, 0.9) + vec3(0.06, 0.02, 0.0) * (1.0 - dotNL)) * directLight.color;')); };

/* ---------- geometry helpers ---------- */
function rbox(w, h, d, r, k) { // rounded box (soft clay edges)
  k = k || 6; const g = new T3.BoxGeometry(1, 1, 1, k, k, k), P = g.attributes.position, N = g.attributes.normal, v = new T3.Vector3();
  const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const sx = Math.sign(v.x), sy = Math.sign(v.y), sz = Math.sign(v.z); v.normalize(); N.setXYZ(i, v.x, v.y, v.z);
    P.setXYZ(i, sx * hw + v.x * r, sy * hh + v.y * r, sz * hd + v.z * r); }
  return g;
}
function cardGeo(k) { // the card outline with its tab and the punched rod hole; groups: 0 face, 1 back, 2 edge
  const s = new T3.Shape(), w = CW / 2, h = CH, r = .035, tx = TABX[k], a = tx - TABW / 2, b = tx + TABW / 2, f = .022, tr = .028;
  s.moveTo(-w + r, 0); s.lineTo(w - r, 0); s.quadraticCurveTo(w, 0, w, r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
  if (b + f < w - r) s.lineTo(b + f, h); s.quadraticCurveTo(b, h, b, h + f); s.lineTo(b, h + TAB - tr); s.quadraticCurveTo(b, h + TAB, b - tr, h + TAB);
  s.lineTo(a + tr, h + TAB); s.quadraticCurveTo(a, h + TAB, a, h + TAB - tr); s.lineTo(a, h + f); s.quadraticCurveTo(a, h, a - f, h);
  s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, r); s.quadraticCurveTo(-w, 0, -w + r, 0);
  const hole = new T3.Path(); hole.absarc(0, HOLE_Y, HOLE_R, 0, Math.PI * 2, true); s.holes.push(hole);
  const g0 = new T3.ExtrudeGeometry(s, {depth: CT, bevelEnabled: false, curveSegments: 6}), g = g0.index ? g0.toNonIndexed() : g0;
  const P = g.attributes.position.array, Nn = g.attributes.normal.array, nt = P.length / 9, bk = [[], [], []];
  for (let t = 0; t < nt; t++) { const nz = (Nn[t * 9 + 2] + Nn[t * 9 + 5] + Nn[t * 9 + 8]) / 3; bk[nz > .5 ? 0 : nz < -.5 ? 1 : 2].push(t); }
  const pos = [], nor = [], uv = [], out = new T3.BufferGeometry(); let start = 0;
  bk.forEach((list, gi) => { list.forEach(t => { for (let j = 0; j < 3; j++) { const v = (t * 3 + j) * 3; pos.push(P[v], P[v + 1], P[v + 2] - CT / 2); nor.push(Nn[v], Nn[v + 1], Nn[v + 2]); uv.push((P[v] + w) / CW, P[v + 1] / (CH + TAB)); } });
    out.addGroup(start, list.length * 3, gi); start += list.length * 3; });
  out.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); out.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2));
  g0.dispose(); if (g !== g0) g.dispose(); return out;
}
let GEO = null;

/* ---------- card art: painted on a canvas (front per pool slot; backs per tag) ---------- */
const PCW = 768, PTH = Math.round(PCW * TAB / CW), PBH = Math.round(PCW * CH / CW), PCH = PTH + PBH;
const FB = '"Bricolage Grotesque", system-ui, sans-serif', FN = 'Newsreader, Georgia, serif';
let PAPER = null; try { PAPER = K.paperTex(); } catch (e) {}
const cv2 = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const covers = {}, stamps = {};
function coverArt(tag, then) { const key = tag + SB.time; if (covers[key]) return covers[key];
  if (covers[key] === undefined) { covers[key] = null; K.coverFor(tag).then(c => { covers[key] = c || false; then && then(); }).catch(() => { covers[key] = false; }); }
  return null; }
function glyph(x, tag, cx, cy, size, col) { const d = window.SB_GLYPH && (SB_GLYPH[tag] || SB_GLYPH.Ideas); if (!d || !window.Path2D) return;
  x.save(); x.translate(cx - size / 2, cy - size / 2); x.scale(size / 24, size / 24); x.fillStyle = col; x.fill(new Path2D(d), 'evenodd'); x.restore(); }
function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function stampOf(tag) { // the cover art as a perforated postage stamp (cached per tag and time of day)
  const key = tag + SB.time; if (stamps[key]) return stamps[key];
  const art = coverArt(tag, () => { delete stamps[key]; repaintTag(tag); }); const W = 212, H = 248, c = cv2(W, H), x = c.getContext('2d'), pr = 7, pit = 17.5;
  x.fillStyle = '#FFFDF8'; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i <= Math.round(W / pit); i++) { const px = i * W / Math.round(W / pit); x.beginPath(); x.arc(px, 0, pr, 0, 7); x.arc(px, H, pr, 0, 7); x.fill(); }
  for (let i = 0; i <= Math.round(H / pit); i++) { const py = i * H / Math.round(H / pit); x.beginPath(); x.arc(0, py, pr, 0, 7); x.arc(W, py, pr, 0, 7); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  const ix = 17, iy = 17, iw = W - 34, ih = H - 34;
  if (art) { const s = Math.max(iw / art.width, ih / art.height), w = art.width * s, h = art.height * s; x.save(); x.beginPath(); x.rect(ix, iy, iw, ih); x.clip(); x.drawImage(art, ix + (iw - w) / 2, iy + (ih - h) * .45, w, h); x.restore(); }
  else { const g = x.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, hexMix(CLOTH[tag] || '#CDBDF2', '#FFFFFF', .6)); g.addColorStop(1, CLOTH[tag] || '#CDBDF2'); x.fillStyle = g; x.fillRect(ix, iy, iw, ih); }
  x.strokeStyle = 'rgba(60,40,30,.18)'; x.lineWidth = 1.5; x.strokeRect(ix + .75, iy + .75, iw - 1.5, ih - 1.5);
  if (art) stamps[key] = c; return c;
}
function paper(x, a, b, w, h) { x.fillStyle = '#FBF6EC'; x.fillRect(a, b, w, h);
  if (PAPER) { x.save(); x.globalAlpha = .6; x.globalCompositeOperation = 'multiply'; x.drawImage(PAPER, 0, 0, PAPER.width, PAPER.width * h / w, a, b, w, h); x.restore(); } }
function tabArea(x, tag, k, fill) { const tx = PCW / 2 + TABX[k] / CW * PCW, tw = TABW / CW * PCW; x.fillStyle = fill; x.fillRect(tx - tw / 2 - 16, 0, tw + 32, PTH + 4);
  const g = x.createLinearGradient(0, 0, 0, PTH); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(tx - tw / 2 - 16, 0, tw + 32, PTH); return tx; }
function holeShade(x) { const hx = PCW / 2, hy = PCH - HOLE_Y / CH * PBH, g = x.createRadialGradient(hx, hy, 16, hx, hy, 34); g.addColorStop(0, 'rgba(70,45,30,.28)'); g.addColorStop(1, 'rgba(70,45,30,0)'); x.fillStyle = g; x.fillRect(hx - 40, hy - 40, 80, 80); }
function ao(x) { const g = x.createLinearGradient(0, PCH - 110, 0, PCH); g.addColorStop(0, 'rgba(90,55,35,0)'); g.addColorStop(1, 'rgba(90,55,35,.16)'); x.fillStyle = g; x.fillRect(0, PCH - 110, PCW, 110); }
function fit(x, s, w) { s = String(s); if (x.measureText(s).width <= w) return s; while (s.length > 1 && x.measureText(s + '…').width > w) s = s.slice(0, -1); return s.trim() + '…'; }
function wrap2(x, txt, w, max) { const out = []; let line = ''; String(txt || '').replace(/\s+/g, ' ').trim().split(' ').forEach(word => { if (out.length >= max) return; const t = line ? line + ' ' + word : word;
  if (x.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; }); if (out.length < max && line) out.push(line);
  if (out.length === max && String(txt).length > out.join(' ').length + 1) out[max - 1] = fit(x, out[max - 1] + '…', w); return out; }
function paintFront(c, it) {
  const x = c.getContext('2d'), n = it.note, tag = n.tag, hex = CLOTH[tag] || '#CDBDF2', ink = INK[tag] || '#2B2A4A', k = tabOf(tag);
  x.clearRect(0, 0, PCW, PCH);
  const tx = tabArea(x, tag, k, hexMix(hex, '#FFFFFF', .06));
  x.font = `700 27px ${FB}`; x.textBaseline = 'alphabetic'; const tw = x.measureText(tag).width + 34;
  glyph(x, tag, tx - tw / 2 + 13, PTH * .58, 24, ink); x.fillStyle = ink; x.textAlign = 'left'; x.fillText(tag, tx - tw / 2 + 32, PTH * .58 + 10);
  paper(x, 0, PTH, PCW, PBH);
  const band = x.createLinearGradient(0, PTH, 0, PTH + 10); band.addColorStop(0, hexMix(hex, '#FFFFFF', .2)); band.addColorStop(1, hexMix(hex, '#FBF6EC', .7)); x.fillStyle = band; x.fillRect(0, PTH, PCW, 6);
  // title row (this is the strip you read when the card stands behind another)
  x.fillStyle = '#2B2A4A'; x.font = `700 42px ${FB}`; x.textAlign = 'left';
  x.fillText(fit(x, n.title || 'Untitled', PCW - 34 - 168), 32, PTH + 52);
  x.font = `600 23px ${FB}`; x.fillStyle = '#857C8E'; x.textAlign = 'right'; x.fillText(String(n.date || ''), PCW - 30, PTH + 49); x.textAlign = 'left';
  // the index-card rules: a red double head rule, then blue lines
  const r0 = PTH + 72; x.fillStyle = 'rgba(206,92,82,.72)'; x.fillRect(20, r0, PCW - 40, 2.6); x.fillRect(20, r0 + 6, PCW - 40, 1.3);
  x.fillStyle = 'rgba(92,124,196,.27)'; for (let y = r0 + 50; y < PCH - 26; y += 46) x.fillRect(20, y, PCW - 40, 1.6);
  // meta: tag disc + date · N words
  const my = r0 + 50 - 12; x.beginPath(); x.arc(46, my - 9, 15, 0, 7); x.fillStyle = hexMix(hex, '#FFFFFF', .25); x.fill(); glyph(x, tag, 46, my - 9, 17, ink);
  x.font = `600 23px ${FB}`; x.fillStyle = '#6E667A'; x.fillText(`${tag} · ${nWords(n.body)} words`, 72, my);
  // first line of the note, set on the rules
  x.font = `italic 400 31px ${FN}`; x.fillStyle = '#3B3550';
  const lines = wrap2(x, n.body || 'Empty for now.', PCW - 60 - 250, 3); lines.forEach((l, i) => x.fillText(l, 32, r0 + 50 + 46 * (i + 1) - 11));
  // the painted stamp, slightly askew
  const st = stampOf(tag); x.save(); x.translate(PCW - 142, PTH + 214); x.rotate(.035 * (((n.id || 1) * 7) % 5 - 2));
  x.shadowColor = 'rgba(70,40,25,.28)'; x.shadowBlur = 12; x.shadowOffsetY = 4; x.drawImage(st, -st.width / 2, -st.height / 2); x.restore();
  holeShade(x); ao(x);
}
const backs = {};
function backTex(tag) { if (backs[tag]) return backs[tag];
  const c = cv2(PCW, PCH), x = c.getContext('2d'), hex = CLOTH[tag] || '#CDBDF2';
  tabArea(x, tag, tabOf(tag), hexMix(hex, '#000000', .04)); paper(x, 0, PTH, PCW, PBH); x.fillStyle = hexMix(hex, '#FBF6EC', .6); x.fillRect(0, PTH, PCW, 5);
  x.fillStyle = 'rgba(92,124,196,.08)'; for (let y = PTH + 122; y < PCH - 26; y += 46) x.fillRect(20, y, PCW - 40, 1.4);
  holeShade(x); ao(x);
  const t = new T3.CanvasTexture(c); t.encoding = T3.sRGBEncoding; t.anisotropy = 8; return backs[tag] = t; }
function proxyTex() { // far cards: rules and a pencil title stroke; the tab is white so the instance colour tints it
  const c = cv2(512, Math.round(512 * PCH / PCW)), x = c.getContext('2d'), s = 512 / PCW; x.scale(s, s);
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, PCW, PTH + 2); paper(x, 0, PTH, PCW, PBH);
  x.fillStyle = 'rgba(60,55,80,.55)'; rrect(x, 32, PTH + 22, 330, 22, 11); x.fill();
  x.fillStyle = 'rgba(206,92,82,.7)'; x.fillRect(20, PTH + 72, PCW - 40, 2.6); x.fillStyle = 'rgba(92,124,196,.27)'; for (let y = PTH + 122; y < PCH - 26; y += 46) x.fillRect(20, y, PCW - 40, 1.6);
  ao(x); const t = new T3.CanvasTexture(c); t.encoding = T3.sRGBEncoding; t.anisotropy = 4; return t; }

/* ---------- the drawer ---------- */
const drawer = new T3.Group(); drawer.visible = false; scene.add(drawer);
const cards = new T3.Group(); drawer.add(cards);
let clayMat, brassMat, edgeMat, labelTex, labelC;
const TINT = new T3.Color(.9, .8, .76);
function buildDrawer() {
  clayMat = prepMat(new T3.MeshStandardMaterial({color: lin('#D99B70'), roughness: .86, map: K.TX && K.TX.grain, emissive: lin('#8A4A2E'), emissiveIntensity: .07}));
  clayMat.onBeforeCompile = WRAP;
  brassMat = prepMat(new T3.MeshStandardMaterial({color: lin('#D7B06A'), metalness: 1, roughness: .3}));
  edgeMat = prepMat(new T3.MeshStandardMaterial({color: lin('#EFE5D3'), roughness: .9}));
  const add = (g, m, x, y, z) => { const o = new T3.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; drawer.add(o); return o; };
  add(rbox(DW, .07, DL, .03), clayMat, 0, -.035, 0);                                         // floor
  [-1, 1].forEach(s => add(rbox(WT, WH + .07, DL, .035), clayMat, s * (DW / 2 - WT / 2), (WH - .07) / 2, 0)); // sides
  add(rbox(DW, .3, WT, .035), clayMat, 0, .08, -DL / 2 + WT / 2);                          // back
  add(rbox(DW + .05, FH, FT, .045), clayMat, 0, FH / 2 - .07, DL / 2 - FT / 2 + .02);       // front panel
  // brass label holder with a hand-lettered label, a cup pull, and the rod's knurled end
  const fz = DL / 2 + .02 + .004, ly = FH * .58 - .07;
  add(rbox(.6, .23, .02, .008, 3), brassMat, 0, ly, fz);
  labelC = cv2(512, 176); labelTex = new T3.CanvasTexture(labelC); labelTex.encoding = T3.sRGBEncoding; labelTex.anisotropy = 8;
  const lab = add(new T3.PlaneGeometry(.54, .175), prepMat(new T3.MeshStandardMaterial({map: labelTex, roughness: .9})), 0, ly, fz + .0115); lab.castShadow = false;
  const pull = add(new T3.TorusGeometry(.1, .02, 10, 28, Math.PI), brassMat, 0, FH * .2 - .07, fz + .02); pull.rotation.z = Math.PI; pull.rotation.x = -.5;
  add(new T3.CylinderGeometry(.034, .034, .04, 20), brassMat, 0, HOLE_Y, fz + .01).rotation.x = Math.PI / 2;
  const rod = add(new T3.CylinderGeometry(.011, .011, DL - .12, 10), brassMat, 0, HOLE_Y, 0); rod.rotation.x = Math.PI / 2;
  // contact shadow on the clay
  const ao = new T3.Mesh(new T3.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({map: K.TX && K.TX.blob, color: lin('#4A2A20'), transparent: true, opacity: .4, depthWrite: false}));
  ao.scale.set(DW * 1.5, 1, DL * 1.35); ao.position.y = -.058; ao.renderOrder = 1; drawer.add(ao); drawer.userData.ao = ao;
  paintLabel();
}
function paintLabel() {
  if (!labelC) return; const x = labelC.getContext('2d'), n = L.order.length || K.items.length;
  paper(x, 0, 0, 512, 176); x.strokeStyle = 'rgba(206,92,82,.55)'; x.lineWidth = 2; x.strokeRect(10, 10, 492, 156);
  x.fillStyle = '#2B2A4A'; x.textAlign = 'center'; x.font = `italic 500 60px ${FN}`; x.fillText(L.sort === 'tag' ? 'By tag' : 'Notebooks', 256, 92);
  x.font = `700 26px ${FB}`; x.fillStyle = '#7E7890'; x.fillText(`${n} card${n === 1 ? '' : 's'}  ·  ${L.sort === 'tag' ? 'Travel – Ideas' : 'newest first'}`, 256, 140);
  labelTex.needsUpdate = true;
}

/* ---------- card pool (near cards: full detail) + instanced proxies (far cards) ---------- */
const pool = [], assigned = new Map();
function newSlot() {
  const c = cv2(PCW, PCH), t = new T3.CanvasTexture(c); t.encoding = T3.sRGBEncoding; t.anisotropy = 8;
  const front = prepMat(new T3.MeshStandardMaterial({map: t, roughness: .88})), back = prepMat(new T3.MeshStandardMaterial({map: backTex('Travel'), roughness: .9, emissive: lin('#FFF1DC'), emissiveIntensity: .16}));
  const mesh = new T3.Mesh(GEO[0], [front, back, edgeMat]); mesh.castShadow = mesh.receiveShadow = true; mesh.visible = false; mesh.rotation.order = 'XYZ';
  cards.add(mesh); const s = {mesh, front, back, c, t, it: null, key: ''}; mesh.userData.slot = s; pool.push(s); return s;
}
function paintSlot(s) { const it = s.it; if (!it) return; s.key = key(it); paintFront(s.c, it); s.t.needsUpdate = true; }
const key = it => [it.note.title, it.note.body, it.note.tag, it.note.date, SB.time].join('|');
function slotFor(it) {
  let s = assigned.get(it); if (s) { if (s.key !== key(it)) { paintSlot(s); s.mesh.geometry = GEO[tabOf(it.note.tag)]; s.back.map = backTex(it.note.tag); } return s; }
  s = pool.find(x => !x.it) || newSlot(); s.it = it; assigned.set(it, s);
  s.mesh.geometry = GEO[tabOf(it.note.tag)]; s.back.map = backTex(it.note.tag); s.back.needsUpdate = true; paintSlot(s); return s;
}
function freeSlot(s) { assigned.delete(s.it); s.it = null; s.mesh.visible = false; }
function repaintTag(tag) { assigned.forEach(s => { if (s.it && s.it.note.tag === tag) paintSlot(s); }); wake(); }
let prox = null, proxCap = 0;
function buildProxies(n) {
  if (prox && proxCap >= n) return; if (prox) prox.forEach(m => { cards.remove(m); m.dispose && m.dispose(); });
  proxCap = Math.max(16, n); const pt = proxyTex();
  const pm = prepMat(new T3.MeshStandardMaterial({map: pt, roughness: .9}));
  pm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#if defined( USE_INSTANCING_COLOR ) || defined( USE_COLOR )
  diffuseColor.rgb *= mix(vec3(1.0), vColor, step(${(CH / (CH + TAB)).toFixed(4)}, vUv.y));
#endif`); };
  const bm = prepMat(new T3.MeshStandardMaterial({map: backTex('Ideas'), roughness: .9, emissive: lin('#FFF1DC'), emissiveIntensity: .16})); bm.onBeforeCompile = pm.onBeforeCompile;
  prox = GEO.map(g => { const m = new T3.InstancedMesh(g, [pm, bm, edgeMat], proxCap); m.count = 0; m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
    m.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(proxCap * 3).fill(1), 3); cards.add(m); return m; });
}

/* ---------- order, sort, search flags ---------- */
const MON = {Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12};
const dateKey = n => { const d = String(n.date || ''); if (/today/i.test(d)) return 1e9 + (n.id || 0) / 1e13; const m = d.match(/([A-Za-z]{3})\w*\s+(\d+)/); return m ? (MON[m[1]] || 0) * 40 + +m[2] + (n.id || 0) / 1e13 : 0; };
function rebuildOrder(keepIt) {
  const cur = keepIt || L.order[clamp(Math.round(L.p), 0, L.order.length - 1)];
  const arr = K.items.slice();
  arr.sort((a, b) => L.sort === 'tag' ? (TAGS.indexOf(a.note.tag) - TAGS.indexOf(b.note.tag)) || (dateKey(b.note) - dateKey(a.note)) : dateKey(b.note) - dateKey(a.note));
  L.order = arr; L.idx.clear(); arr.forEach((it, i) => L.idx.set(it, i));
  const n = arr.length, ci = cur && L.idx.has(cur) ? L.idx.get(cur) : clamp(Math.round(L.p), 0, Math.max(0, n - 1));
  if (cur && L.idx.has(cur) && Math.round(L.p) !== ci) { const d = ci - Math.round(L.p); L.p += d; L.target += d; }
  L.p = clamp(L.p, 0, Math.max(0, n - 1)); L.target = clamp(Math.round(L.target), 0, Math.max(0, n - 1));
  buildProxies(n); paintLabel(); flags();
}
function flags() { const act = !!(L.q || L.flag);
  L.order.forEach(it => { const c = cs(it), m = (!L.q || it.rise.t > 0) && (!L.flag || it.note.tag === L.flag); c.lift.t = act && m ? .11 : 0; c.dim.t = act && !m ? 1 : 0; }); wake(); }

/* ---------- per-frame layout ---------- */
const _o = {th: 0, z: 0}, _q = new T3.Quaternion(), _q2 = new T3.Quaternion(), _v = new T3.Vector3(), _v2 = new T3.Vector3(), _m = new T3.Matrix4(), _s = new T3.Vector3(), _c = new T3.Color();
const AX = new T3.Vector3(1, 0, 0), AY = new T3.Vector3(0, 1, 0), AZ = new T3.Vector3(0, 0, 1);
function slotPose(it, u, outP, outQ) { // drawer-local layout pose of a card at offset u from the gap (no springs)
  lay(u, _o); outQ.setFromAxisAngle(AX, -_o.th); outP.set(0, 0, _o.z + L.gz); return _o.th; }
function poseCard(s, it, dt) {
  const c = cs(it), i = L.idx.has(it) ? L.idx.get(it) : -1, u = i < 0 ? 0 : i - L.p; let busy = false;
  lay(u, _o); c.th.t = _o.th; if (!c.init) { c.th.x = _o.th; c.th.v = 0; c.init = true; }
  busy = sstep(c.th, dt) | sstep(c.lift, dt) | sstep(c.sw, dt) | sstep(c.dim, dt);
  const m = s.mesh;
  _q.setFromAxisAngle(AX, -c.th.x).multiply(_q2.setFromAxisAngle(AZ, -c.sw.x * .16));
  _v.set(0, c.lift.x + Math.abs(c.sw.x) * .06, 0).applyQuaternion(_q); m.position.set(c.sw.x, 0, _o.z + L.gz).add(_v); m.quaternion.copy(_q); m.scale.set(1, 1, 1);
  if (c.fly) { const F = c.fly, w = F.w; m.position.lerp(F.p, w); m.quaternion.slerp(F.q, w); m.scale.set(lerp(1, F.sx, w), 1, 1); }
  m.visible = !c.hide && u <= FAR + 1 && u >= -FARP - 1;
  const d = c.dim.x; m.material[0].color.setScalar(1 - .32 * d); m.material[1].color.setScalar(1 - .32 * d);
  if (d > 0) { m.material[0].color.lerp(_c.setRGB(.82, .8, .86), d * .2); }
  return busy;
}
function updateProxies() {
  if (!prox) return; const n = L.order.length, cnt = [0, 0, 0];
  const lo = Math.max(0, Math.floor(L.p) - FARP), hi = Math.min(n - 1, Math.ceil(L.p) + FAR);
  for (let i = lo; i <= hi; i++) { const it = L.order[i]; if (assigned.has(it)) continue;
    const k = tabOf(it.note.tag), m = prox[k], j = cnt[k]++; if (j >= proxCap) continue;
    slotPose(it, i - L.p, _v, _q); _m.compose(_v, _q, _s.set(1, 1, 1)); m.setMatrixAt(j, _m);
    _c.set(CLOTH[it.note.tag] || '#CDBDF2').convertSRGBToLinear(); const dm = cs(it).dim.t ? .7 : 1; m.instanceColor.setXYZ(j, _c.r * dm, _c.g * dm, _c.b * dm); }
  prox.forEach((m, k) => { m.count = cnt[k]; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; });
}
let lastProxP = null;
function layout(dt) {
  let busy = false; const n = L.order.length, want = new Set();
  const lo = Math.max(0, Math.floor(L.p) - WB - 1), hi = Math.min(n - 1, Math.ceil(L.p) + WA);
  for (let i = lo; i <= hi; i++) want.add(L.order[i]);
  L.order.forEach(it => { if (it.cat && (it.cat.fly || it.cat.drive) && L.idx.has(it)) want.add(it); });
  assigned.forEach((s, it) => { if (!want.has(it)) freeSlot(s); });
  want.forEach(it => { if (poseCard(slotFor(it), it, dt)) busy = true; });
  const pk = Math.round(L.p * 200) + ':' + n + ':' + assigned.size;
  if (pk !== lastProxP) { lastProxP = pk; updateProxies(); }
  return busy;
}

/* ---------- scroll physics: momentum, friction and a magnetic detent on every card ---------- */
function stepScroll(dt) {
  const n = L.order.length; if (!n) { L.p = L.v = 0; L.mode = 'rest'; return false; }
  const m = n - 1;
  if (L.mode === 'drag' || L.mode === 'rest') return L.mode === 'drag';
  if (L.mode === 'target') {
    const k = 90, c = 2 * Math.sqrt(k) * .85; L.v += (k * (L.target - L.p) - c * L.v) * dt; L.p += L.v * dt;
    if (Math.abs(L.target - L.p) < 1e-4 && Math.abs(L.v) < 1e-3) { L.p = L.target; L.v = 0; L.mode = 'rest'; } return true;
  }
  const sp = Math.abs(L.v), cap = 1 - sm((sp - 1.2) / 3.6), near = Math.round(clamp(L.p, 0, m)), d = L.p - near;
  let acc = -150 * Math.sin(2 * Math.PI * d) / (2 * Math.PI) * (.25 + .75 * cap) - (1.9 + 10 * cap) * L.v;
  if (L.p < 0 || L.p > m) acc = -160 * (L.p - clamp(L.p, 0, m)) - 16 * L.v;
  L.v += acc * dt; L.p += L.v * dt;
  if (Math.abs(L.p - near) < 5e-4 && Math.abs(L.v) < 4e-3) { L.p = near; L.v = 0; L.mode = 'rest'; }
  return true;
}
function passed() { // a card goes by: wooden tick, a paper flick, a selection haptic, the next card shivers
  const n = L.order.length; if (!n) return; const f = clamp(Math.round(L.p), 0, n - 1); if (f === L.lastF) return; const dir = Math.sign(f - L.lastF); L.lastF = f;
  if (!L.on || L.x < 1) return;
  const fast = Math.abs(L.v) > 5, now = performance.now();
  snd('tick', {pitch: 1.25 + Math.random() * .2, gain: fast ? .35 : .55}); hap('selection');
  if (now - L.lastRiffle > (fast ? 240 : 420)) { L.lastRiffle = now; snd('riffle', {pitch: 1.5 + Math.random() * .3, gain: fast ? .32 : .2}); }
  [f, f + dir].forEach((i, k) => { const it = L.order[i]; if (it) cs(it).th.v += (k ? -1.6 : 1.1) * dir; });
  announce();
}

/* ---------- camera ---------- */
const camP = new T3.Vector3(), camL = new T3.Vector3();
function listCam() { const z = DPOS.z + L.gzS.x, a = eio(clamp(L.aside.x, 0, 1)); // aside: step back to show the clay bin on the rim
  camL.set(.42 * a, DPOS.y + .5 - .1 * a, z - .05 + .25 * a); camP.set(.75 * a, DPOS.y + .5 + 5.5 + .9 * a, z + 4.8 + 1.7 * a); }
SB.hooks = SB.hooks || {};
SB.hooks.cam = (p, l) => { const e = eio(clamp(L.cam.x, 0, 1)); if (e <= 0) return; listCam(); p.lerp(camP, e); l.lerp(camL, e); };

/* ---------- the frame tick (runs only while something moves) ---------- */
let un = null;
function wake() { if (!un) un = SB.onTick(tick); SB.requestFrame(); }
function tick(dt) {
  if (!drawer.visible && !L.on && L.cam.x === 0) { un(); un = null; return; }
  let busy = sstep(L.cam, dt) | sstep(L.dr, dt) | sstep(L.aside, dt);
  if (stepScroll(dt)) busy = true; passed();
  const n = L.order.length; L.gz = gapZ(L.p, n); L.gzS.t = L.gz; if (sstep(L.gzS, dt)) busy = true;
  // the drawer: thrown up out of the clay while it slides toward you
  const d = L.dr.x; drawer.position.set(DPOS.x, DPOS.y - (1 - Math.min(d, 1.05)) * (FH + .12), DPOS.z - (1 - d) * .75);
  drawer.visible = d > .002; clipY.constant = 0;
  if (drawer.userData.ao) drawer.userData.ao.material.opacity = .4 * sm(d * 1.4);
  if (K.plMat) { clayMat.color.copy(K.plMat.color).multiply(TINT); }
  if (L.time !== SB.time) { L.time = SB.time; const e = ENV[SB.time] || .3; [clayMat, brassMat, edgeMat].concat(pool.map(s => s.front), pool.map(s => s.back)).forEach(m => m.envMapIntensity = e);
    if (prox) prox.forEach(m => m.material.forEach(mm => mm.envMapIntensity = e)); }
  if (drawer.visible && layout(dt)) busy = true;
  if (L.busy) busy = true;
  if (busy) SB.requestFrame();
  else if (!L.on && L.cam.x === 0 && !drawer.visible) { un(); un = null; }
  else { un(); un = null; }
}

/* ---------- book <-> card morphs ---------- */
function tween(dur, fn, done) { if (RM) dur = .01; let t = 0; const u = SB.onTick(dt => { t = Math.min(1, t + dt / dur); fn(t); SB.requestFrame(); if (t >= 1) { u(); done && done(); } }); return u; }
const later = (ms, fn) => setTimeout(fn, RM ? 0 : ms);
const isProv = b => { const c = b.group.children[0]; return !!(c && c.position.x > .01); };
function bookCenter(it, out) { new T3.Box3().setFromObject(it.book.group).getCenter(out); return out; }
function poseBook(it, c, q, s, sx) { // place a book by its centre; sx narrows it (squash keeps the base)
  const b = it.book, g = b.group, ox = isProv(b) ? K.BW / 2 : sx * K.BW / 2;
  g.quaternion.copy(q); g.scale.setScalar(Math.max(.001, s)); g.position.copy(c).sub(_v2.set(ox * s, K.BH / 2 * s, 0).applyQuaternion(q));
  b.squash(Math.max(.02, sx), 1); g.visible = true; g.updateMatrixWorld(true);
}
function hideBits(it) { if (it.blob) it.blob.visible = false; if (it.ribbon) it.ribbon.visible = false; }
const qY = (a, out) => (out || new T3.Quaternion()).setFromAxisAngle(AY, a);
function cardWorld(it, outC, outQ) { // where a card would stand right now (world centre + orientation)
  const i = L.idx.get(it), u = (i == null ? 0 : i) - L.p; slotPose(it, u, outC, outQ);
  outC.add(_v.set(0, CH / 2, 0).applyQuaternion(outQ)).add(drawer.position); return outC;
}
function flyState(it) { const c = cs(it); if (!c.fly) c.fly = {p: new T3.Vector3(), q: new T3.Quaternion(), sx: 1, w: 0}; return c.fly; }
function setFly(it, cWorld, q, sx, w) { const F = flyState(it); F.q.copy(q); F.p.copy(cWorld).sub(drawer.position).sub(_v.set(0, CH / 2, 0).applyQuaternion(q)); F.sx = sx; F.w = w; }
const HOVER = .62, QI = new T3.Quaternion(), SQ = .2;

// shelf book → index card, dropping into its slot
function gather(it, delay, done) {
  const c = cs(it), b = it.book; it.ext = true; c.drive = true; c.hide = true; c.init = false; hideBits(it);
  const c0 = bookCenter(it, new T3.Vector3()), q0 = b.group.quaternion.clone(), s0 = b.group.scale.x;
  setFly(it, c0, QI, SQ, 1);
  later(delay, () => {
    tween(.14, t => { const e = Math.sin(t * Math.PI); b.squash(1 + .05 * e, 1 - .09 * e); b.group.updateMatrixWorld(true); }, () => {
      snd('whoosh', {pitch: 1.2 + Math.random() * .2, gain: .35}); hap('selection');
      const tgt = new T3.Vector3(), qs = new T3.Quaternion(), mid = new T3.Vector3(), cc = new T3.Vector3(), q = new T3.Quaternion(); let swapped = false;
      tween(.82, t => {
        cardWorld(it, tgt, qs); tgt.y += HOVER; mid.lerpVectors(c0, tgt, .5); mid.y = Math.max(c0.y, tgt.y) + .75;
        const e = eio(t), u1 = 1 - e; cc.set(u1 * u1 * c0.x + 2 * u1 * e * mid.x + e * e * tgt.x, u1 * u1 * c0.y + 2 * u1 * e * mid.y + e * e * tgt.y, u1 * u1 * c0.z + 2 * u1 * e * mid.z + e * e * tgt.z);
        if (t < .55) { const a = seg(t, 0, .55), ea = eio(a); q.copy(q0).slerp(QI, eoc(a)).premultiply(qY(Math.PI / 2 * ea, _q2)); poseBook(it, cc, q, lerp(s0, .72, ea), lerp(1, SQ, eic(a))); }
        else { if (!swapped) { swapped = true; b.group.visible = false; c.hide = false; snd('tick', {pitch: 1.7, gain: .3}); }
          const a = seg(t, .55, 1), ea = eoc(a); q.copy(QI).slerp(qs, ea).premultiply(qY(Math.PI / 2 * (1 - ea), _q2)); setFly(it, cc, q, lerp(SQ, 1, ea), 1); }
      }, () => drop(it, done));
    });
  });
}
function drop(it, done) { // hover → slot, accelerating like a dropped card, then a tick and a shiver through its neighbours
  const c = cs(it), F = flyState(it); const p0 = F.p.clone(), q0 = F.q.clone(), P = new T3.Vector3(), Q = new T3.Quaternion();
  c.hide = false; c.drive = true;
  tween(.24, t => { slotPose(it, (L.idx.get(it) || 0) - L.p, P, Q); const e = eic(t); F.p.lerpVectors(p0, P, e); F.q.copy(q0).slerp(Q, e); F.sx = 1; F.w = 1; }, () => {
    c.fly = null; c.drive = false; c.th.v -= 2.2; c.lift.v = -.6;
    const i = L.idx.get(it); [-1, 1].forEach(k => { const o = L.order[i + k]; if (o && o.cat) o.cat.th.v += k * .9; });
    snd('tick', {pitch: .9 + Math.random() * .2, gain: .7}); snd('thup', {pitch: 1.9, gain: .25}); hap('light'); wake(); done && done();
  });
}
// index card → book (lifted out of the drawer, spun round into its book); resolves with the book at centre `to`
function lift(it, to, toQ, toS, done) {
  const c = cs(it); c.drive = true; c.hide = false; it.ext = true;
  const b = K.ensureBook(it); hideBits(it); b.group.visible = false;
  const c0 = cardWorld(it, new T3.Vector3(), new T3.Quaternion()), q0 = new T3.Quaternion(); cardWorld(it, _v, q0);
  const up = c0.clone(); up.y += HOVER;
  snd('riffle', {pitch: 1.6, gain: .3}); hap('selection');
  const cc = new T3.Vector3(), q = new T3.Quaternion(), mid = new T3.Vector3(); let swapped = false;
  tween(.26, t => { const e = eoc(t); cc.lerpVectors(c0, up, e); setFly(it, cc, q0, 1, 1); }, () => {
    snd('whoosh', {pitch: 1.15, gain: .4});
    tween(.6, t => {
      mid.lerpVectors(up, to, .5); mid.y = Math.max(up.y, to.y) + .35; const e = eio(t), u1 = 1 - e;
      cc.set(u1 * u1 * up.x + 2 * u1 * e * mid.x + e * e * to.x, u1 * u1 * up.y + 2 * u1 * e * mid.y + e * e * to.y, u1 * u1 * up.z + 2 * u1 * e * mid.z + e * e * to.z);
      if (t < .42) { const a = seg(t, 0, .42); q.copy(q0).slerp(QI, eoc(a)).premultiply(qY(-Math.PI / 2 * eic(a), _q2)); setFly(it, cc, q, lerp(1, SQ, eic(a)), 1); }
      else { if (!swapped) { swapped = true; c.hide = true; snd('pop', {pitch: 1.3, gain: .35}); }
        const a = seg(t, .42, 1), ea = eoc(a); q.copy(QI).slerp(toQ, ea).premultiply(qY(-Math.PI / 2 * (1 - ea), _q2)); poseBook(it, cc, q, lerp(.72, toS, ea), lerp(SQ, 1, eob(a))); }
    }, () => { c.fly = null; done && done(); });
  });
}
// book (at its current pose) → card back in its slot
function file(it, done) {
  const c = cs(it), b = it.book; c.drive = true; c.hide = true; hideBits(it);
  const c0 = bookCenter(it, new T3.Vector3()), q0 = b.group.quaternion.clone(), s0 = b.group.scale.x;
  const tgt = new T3.Vector3(), qs = new T3.Quaternion(), cc = new T3.Vector3(), q = new T3.Quaternion(); let swapped = false;
  setFly(it, c0, QI, SQ, 1);
  tween(.62, t => {
    cardWorld(it, tgt, qs); tgt.y += HOVER; const e = eio(t); cc.lerpVectors(c0, tgt, e); cc.y += Math.sin(Math.PI * e) * .25;
    if (t < .5) { const a = seg(t, 0, .5); q.copy(q0).slerp(QI, eoc(a)).premultiply(qY(Math.PI / 2 * eic(a), _q2)); poseBook(it, cc, q, lerp(s0, .72, a), lerp(1, SQ, eic(a))); }
    else { if (!swapped) { swapped = true; b.group.visible = false; c.hide = false; }
      const a = seg(t, .5, 1), ea = eoc(a); q.copy(QI).slerp(qs, ea).premultiply(qY(Math.PI / 2 * (1 - ea), _q2)); setFly(it, cc, q, lerp(SQ, 1, ea), 1); }
  }, () => drop(it, done));
}

/* ---------- entering and leaving the catalogue ---------- */
const titleEl = screenEl.querySelector('.sb-ttl');
let titleWas = titleEl ? titleEl.textContent : '';
function canToggle() { return !L.busy && K.mode === 'shelf' && K.openState === 'none' && !K.ov && !K.bvOn; }
function setList(on, then) {
  on = !!on; if (on === L.on) { then && then(); return; }
  if (!canToggle()) return;
  if (on) enter(then); else leave(then);
}
function fadeSwap(fn) { const cv = screenEl.querySelector('canvas.sb-gl'); cv.style.transition = 'opacity .18s'; cv.style.opacity = 0; setTimeout(() => { fn(); SB.requestFrame(); setTimeout(() => { cv.style.opacity = 1; }, 40); }, 190); }
function enter(then) {
  if (!GEO) { GEO = [0, 1, 2].map(cardGeo); buildDrawer(); }
  L.on = true; L.busy = true; L.flag = null; screenEl.classList.add('listing'); syncChrome();
  const front = K.items[SB.state.front];
  rebuildOrder(front); L.p = L.target = front ? L.idx.get(front) : 0; L.v = 0; L.mode = 'rest'; L.lastF = Math.round(L.p);
  L.gz = L.gzS.x = L.gzS.t = gapZ(L.p, L.order.length); flags();
  const flyers = K.items.filter(it => it.book && it.book.group.visible && !it.ext);
  K.items.forEach(it => { const c = cs(it); c.init = false; c.fly = null; c.hide = false; c.drive = false; it.ext = true; if (it.book && flyers.indexOf(it) < 0) { it.book.group.visible = false; hideBits(it); } });
  if (RM) { fadeSwap(() => { flyers.forEach(it => { it.book.group.visible = false; hideBits(it); }); L.dr.x = L.dr.t = 1; L.cam.x = L.cam.t = 1; L.x = 1; L.busy = false; wake(); announce(); then && then(); }); wake(); return; }
  // the clay heaves, the drawer is thrown up and slides toward you; the books leap in and become cards
  L.dr.x = 0; L.dr.t = 1; L.dr.v = 0; later(260, () => { L.cam.t = 1; wake(); }); drawer.visible = true;
  K.ripple(0, DPOS.z, .03); snd('scratch', {pitch: .5, gain: .8}); later(120, () => snd('sink', {pitch: .7, gain: .45})); hap('medium');
  later(520, () => { K.spawnPuff(0, DPOS.z + DL / 2 - .1, 18, .7, null, 0, 1.3); K.ripple(0, DPOS.z + DL / 2, .02); snd('thup', {pitch: .7, gain: .7}); hap('light'); });
  const fiS = SB.state.front, NS = K.items.length, sl = it => { const d = ((K.items.indexOf(it) - fiS) % NS + NS) % NS; return Math.min(d, NS - d); };
  flyers.sort((a, b) => sl(a) - sl(b)); // the nearest book leaves first, so the drawer is never hidden
  let left = flyers.length; const fin = () => { L.x = 1; L.busy = false; announce(); wake(); then && then(); };
  if (!left) later(700, fin);
  flyers.forEach((it, k) => gather(it, 110 + k * 105, () => { if (--left === 0) fin(); }));
  wake();
}
function leave(then) {
  L.busy = true; L.flag = null; screenEl.classList.remove('listing'); syncChrome(false);
  const n = L.order.length, cur = L.order[clamp(Math.round(L.p), 0, n - 1)];
  if (cur) K.front(K.items.indexOf(cur));
  const items = K.items, N = items.length, fi = cur ? items.indexOf(cur) : 0;
  const slot = i => { const s = ((i - fi) % N + N) % N; return s > N / 2 ? s - N : s; };
  const flyers = N ? items.filter((it, i) => Math.abs(slot(i)) < 2.9) : [];
  items.forEach(it => { if (it.rope) it.rope.init = false; if (flyers.indexOf(it) < 0) { it.ext = false; if (it.cat) { it.cat.fly = null; it.cat.drive = false; } } });
  const finish = () => { L.on = false; L.x = 0; L.busy = false; K.items.forEach(it => { if (it.cat) { it.cat.hide = false; it.cat.fly = null; it.cat.drive = false; } });
    assigned.forEach(s => freeSlot(s)); if (prox) prox.forEach(m => m.count = 0); K.wake(1500); wake(); then && then(); };
  if (RM) { fadeSwap(() => { flyers.forEach(it => { it.ext = false; if (it.book) it.book.group.visible = true; }); L.dr.x = L.dr.t = 0; L.cam.x = L.cam.t = 0; drawer.visible = false; finish(); }); return; }
  flyers.sort((a, b) => Math.abs(slot(items.indexOf(a))) - Math.abs(slot(items.indexOf(b))));
  let left = flyers.length; const done1 = () => { if (--left > 0) return;
    L.dr.t = 0; L.cam.t = 0; snd('sink', {pitch: .8, gain: .6}); K.ripple(0, DPOS.z, .025);
    later(900, finish); };
  if (!left) done1();
  later(60, () => { L.cam.t = .45; });
  flyers.forEach((it, k) => later(k * 110, () => {
    const b = K.ensureBook(it); const sp = SB.slotPose(b); if (!sp) { it.ext = false; done1(); return; }
    const s = sp.scale, to = sp.position.clone().add(_v.set(K.BW / 2 * s, K.BH / 2 * s, 0).applyQuaternion(sp.quaternion));
    lift(it, to, sp.quaternion, s, () => {
      const g = b.group; it.ext = false; if (it.cat) { it.cat.hide = true; it.cat.drive = false; } if (it.rope) it.rope.init = false;
      it.blend = {t: 0, p: g.position.clone().add(_v.set(K.BW / 2 * g.scale.x, 0, 0).applyQuaternion(g.quaternion)), q: g.quaternion.clone()};
      it.sq.v = -5; snd('thup', {pitch: .9 + Math.random() * .25, gain: .8}); hap('light'); K.spawnPuff(to.x, to.z, 12, .55); K.ripple(to.x, to.z, .012); K.wake(1500);
      done1();
    });
  }));
  wake();
}

/* ---------- open a card (lift → book → SBOpen), and file it back on close ---------- */
function openCard(it) {
  if (!L.on || L.busy || !it || K.openState !== 'none' || K.mode !== 'shelf') return;
  const i = L.idx.get(it); if (i == null) return;
  L.busy = true; L.target = i; L.mode = 'target'; wake();
  later(i === Math.round(L.p) ? 0 : 160, () => {
    const to = cardWorld(it, new T3.Vector3(), new T3.Quaternion()); to.y += .42; to.z += .12;
    lift(it, to, QI, 1, () => { L.busy = false; if (it.ribbon) { it.ribbon.visible = true; if (it.rope) it.rope.init = false; } K.openItem(it); hurryClose(); });
  });
}
// once the cover has clapped and the book is home, the pages still ring inside the shut book (invisible): settle them so the card can be filed at once
function hurryClose() { const u = SB.onTick(() => { const c = window.SBOpen && SBOpen._cur; if (!c) { if (K.openState === 'none') u(); return; }
  if (c.phase !== 'close' || !c.falling) return; const sp = c.sp; if (sp.cover.x > .03 || Math.abs(sp.lift.x) > .07 || Math.abs(sp.turn.x) > .07 || Math.abs(sp.cam2.x) > .1) return;
  [sp.lift, sp.turn, sp.yoff, sp.sq, sp.cover, sp.cam1, sp.cam2].concat(c.pages).forEach(x => { x.x = x.t; x.v = 0; }); }); }
SB.hooks.closed = (it, removing) => {
  if (!L.on) return; const c = cs(it);
  if (removing) { c.hide = true; c.drive = true; return; } // the note page's trash: the book goes straight to the bin
  K.front(K.items.indexOf(it)); L.busy = true; file(it, () => { L.busy = false; }); wake();
};

/* ---------- throw a card into the clay bin ---------- */
function toss(it, dir) {
  if (L.busy) return; L.busy = true; const c = cs(it);
  if (RM) { L.busy = false; SB.remove(it.note); return; }
  K.ensureBook(it); hideBits(it); it.book.group.visible = false; c.drive = true;
  const c0 = cardWorld(it, new T3.Vector3(), new T3.Quaternion()); c0.x += c.sw.x; c0.y += .08;
  const to = new T3.Vector3(clamp(c0.x + dir * .3, -.4, .9), c0.y + .75, c0.z + .45), cc = new T3.Vector3(), q = new T3.Quaternion(); let swapped = false;
  L.aside.t = 1; snd('whoosh', {pitch: 1.3, gain: .5}); hap('selection');
  const q0 = new T3.Quaternion(); cardWorld(it, _v, q0); q0.multiply(_q2.setFromAxisAngle(AZ, -c.sw.x * .16));
  tween(.5, t => { const e = eoc(t); cc.lerpVectors(c0, to, e); cc.y += Math.sin(Math.PI * t) * .2;
    if (t < .45) { const a = seg(t, 0, .45); q.copy(q0).slerp(QI, eoc(a)).premultiply(qY(dir * Math.PI / 2 * eic(a), _q2)); setFly(it, cc, q, lerp(1, SQ, eic(a)), 1); }
    else { if (!swapped) { swapped = true; c.hide = true; } const a = seg(t, .45, 1), ea = eoc(a); q.copy(QI).premultiply(qY(dir * (Math.PI / 2 * (1 - ea) - .25 * ea), _q2)); poseBook(it, cc, q, lerp(.72, .9, ea), lerp(SQ, 1, eob(a))); }
  }, () => { c.fly = null; c.sw.x = c.sw.t = 0; L.busy = false; SB.remove(it.note); later(2700, () => { L.aside.t = 0; wake(); }); });
}
SB.hooks.undoTo = it => { if (!L.on) return null; rebuildOrder(); const i = L.idx.get(it); if (i == null) return null;
  L.target = i; L.mode = 'target'; const c = cs(it); c.hide = true; c.drive = true; c.init = false; wake();
  const P = new T3.Vector3(), Q = new T3.Quaternion(); slotPose(it, 0, P, Q); P.add(_v.set(0, CH / 2 + HOVER + .1, 0)).add(drawer.position); return {p: P, q: QI.clone()}; };
SB.hooks.undoLanded = it => { if (!L.on) return; it.ext = true; L.busy = true; file(it, () => { L.busy = false; later(500, () => { L.aside.t = 0; wake(); }); }); };
const undoAside = () => { if (L.on && SB.state.bin) { L.aside.t = 1; wake(); } };
const ub = screenEl.querySelector('.sb-undo .u-u'); ub && ub.addEventListener('click', undoAside, true);
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) undoAside(); }, true);
SB.hooks.sync = () => { if (!L.on) return; K.items.forEach(it => { if (!it.ext) { it.ext = true; const c = cs(it); if (it.book && !it.fly && !c.drive) { it.book.group.visible = false; hideBits(it); } } });
  rebuildOrder(); wake(); };
SB.hooks.search = q => { L.q = q || ''; if (!L.on) return; flags(); const first = L.order.findIndex(it => (!L.q || it.rise.t > 0) && (!L.flag || it.note.tag === L.flag));
  if (L.q && first >= 0) { L.target = first; L.mode = 'target'; } wake(); };
if (SB.bin) { const prev = SB.bin.onchange; let pv = prev; Object.defineProperty(SB.bin, 'onchange', {configurable: true, get: () => mine, set: f => { pv = f; }});
  function mine(type) { try { pv && pv(type); } catch (e) {} if (!L.on) return; if (type === 'open') { L.dr.t = 0; snd('sink', {pitch: .9, gain: .3}); wake(); } else if (type === 'close') { L.dr.t = 1; wake(); } } }

/* ---------- chrome: the toggle, the sort pill, chips as catalogue flags, a live region ---------- */
const css = `
#screen .sb-hd>.sb-hbt{display:flex;gap:4px;flex:none;pointer-events:auto}
#screen .sb-lst{width:42px}
#screen .sb-lst[aria-pressed="true"]{background:var(--ink);color:var(--paper,#FFFCF7)}
#screen[data-time="night"] .sb-lst[aria-pressed="true"]{color:#2B2A4A}
#screen .sb-lst svg{transition:transform .5s cubic-bezier(.3,1.6,.5,1)}
#screen .sb-lst[aria-pressed="true"] svg{transform:translateY(1px) scale(1.04)}
#screen .sb-sort{all:unset;box-sizing:border-box;position:absolute;left:24px;top:680px;height:34px;padding:0 12px 0 9px;border-radius:99px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;
  background:var(--ink);color:var(--paper,#FFFCF7);font:650 13px var(--fd);pointer-events:auto;opacity:0;transform:translateY(8px) scale(.94);visibility:hidden;
  transition:opacity .3s,transform .45s cubic-bezier(.3,1.5,.5,1),visibility 0s .3s;box-shadow:0 10px 22px -12px rgba(43,42,74,.7)}
#screen[data-time="night"] .sb-sort{color:#2B2A4A}
#screen .sb-sort:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
#screen .sb-sort:active{transform:scale(.93)}
#screen.listing .sb-sort{opacity:1;transform:none;visibility:visible;transition:opacity .3s .25s,transform .45s .25s cubic-bezier(.3,1.5,.5,1)}
#screen.listing .sb-chips{padding-left:136px;-webkit-mask-image:linear-gradient(90deg,transparent 128px,#000 150px);mask-image:linear-gradient(90deg,transparent 128px,#000 150px)}
#screen .sb-chips{transition:padding-left .45s cubic-bezier(.2,0,0,1)}
#screen.listing .sb-info{opacity:0;transform:translateY(10px);pointer-events:none}
#screen.listing .sb-chip[data-flag="true"]{background:var(--ink);color:var(--paper,#FFFCF7)}
#screen.listing .sb-chip[aria-pressed="true"]:not([data-flag="true"]){background:var(--pill);color:var(--ink)}
#screen[data-time="night"].listing .sb-chip[data-flag="true"]{color:#2B2A4A}
#screen .sb-ttl{transition:color 1s,opacity .25s}
#screen .sb-ttl.swap{opacity:0}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const hd = screenEl.querySelector('.sb-hd'), srch = screenEl.querySelector('.sb-srch'), homeEl = screenEl.querySelector('.sb-home'), chipsEl = screenEl.querySelector('.sb-chips');
const ICON_LIST = '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 10V5.8a1 1 0 0 1 1-1h3.2l1-1.3h5a1 1 0 0 1 1 1V10"/><path d="M9.2 8h5.6"/><rect x="3.5" y="10" width="17" height="10" rx="2.2"/><path d="M10 15.2h4"/></svg>';
const ICON_SORT = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M13 6h8M13 11h6M13 16h4"/></svg>';
const lstBtn = document.createElement('button'); lstBtn.className = 'sb-ib sb-lst'; lstBtn.setAttribute('aria-pressed', 'false'); lstBtn.setAttribute('aria-label', 'Card catalogue: list view'); lstBtn.innerHTML = ICON_LIST;
if (hd && srch) { const grp = document.createElement('div'); grp.className = 'sb-hbt'; srch.parentNode.insertBefore(grp, srch); grp.appendChild(lstBtn); grp.appendChild(srch); }
const sortBtn = document.createElement('button'); sortBtn.className = 'sb-sort'; homeEl.appendChild(sortBtn);
const live = document.createElement('div'); live.className = 'sb-sr'; live.setAttribute('aria-live', 'polite'); homeEl.appendChild(live);
function syncChrome(on) {
  on = on === undefined ? L.on : on; lstBtn.setAttribute('aria-pressed', String(on));
  sortBtn.innerHTML = `${ICON_SORT}<span>${L.sort === 'tag' ? 'By tag' : 'Newest'}</span>`; sortBtn.setAttribute('aria-label', `Sort cards: ${L.sort === 'tag' ? 'by tag' : 'newest first'}. Tap to change.`);
  sortBtn.tabIndex = on ? 0 : -1;
  if (titleEl) { titleEl.classList.add('swap'); setTimeout(() => { titleEl.textContent = on ? 'Catalogue' : titleWas; titleEl.classList.remove('swap'); }, 180); }
  const cv = screenEl.querySelector('canvas.sb-gl'); if (cv) { if (!cv.dataset.label0) cv.dataset.label0 = cv.getAttribute('aria-label');
    cv.setAttribute('aria-label', on ? 'Card catalogue. Up and down arrows flick through the cards, Enter opens the front card, Delete throws it in the clay bin, Escape goes back to the shelf.' : cv.dataset.label0); }
  chipsEl && chipsEl.querySelectorAll('.sb-chip').forEach(c => c.dataset.flag = String(!!on && c.dataset.tag === L.flag));
}
function announce() { const it = L.order[clamp(Math.round(L.p), 0, L.order.length - 1)]; if (!it || !L.on) return; const n = it.note;
  live.textContent = `${n.title || 'Untitled'}. ${n.tag}, ${n.date}. Card ${Math.round(L.p) + 1} of ${L.order.length}.`; }
lstBtn.addEventListener('click', () => { setList(!L.on); });
sortBtn.addEventListener('click', () => resort(L.sort === 'tag' ? 'newest' : 'tag'));
syncChrome();
function resort(mode) { // the cards jump up out of the drawer, re-file themselves, and drop back with a riffle
  if (!L.on || L.busy) return; L.busy = true; hap('selection');
  const cur = L.order[clamp(Math.round(L.p), 0, L.order.length - 1)];
  const up = [...assigned.keys()]; snd('riffle', {pitch: 1.1, gain: .55});
  up.forEach((it, k) => { const c = cs(it); later(k * 18, () => { c.lift.t = .55 + Math.random() * .25; c.lift.v = 3; }); });
  later(RM ? 0 : 300, () => {
    L.sort = mode; rebuildOrder(cur); L.lastF = Math.round(L.p); syncChrome();
    assigned.forEach((s, it) => { const c = cs(it); c.lift.x = .7 + Math.random() * .3; c.init = false; c.lift.v = 0; });
    later(30, () => { flags(); assigned.forEach((s, it) => { const c = cs(it); c.lift.v = -1.5; });
      [0, 90, 170, 240].forEach((ms, k) => later(ms, () => snd('tick', {pitch: 1.1 + k * .12, gain: .45})));
      later(260, () => { snd('thup', {pitch: 1.7, gain: .3}); hap('light'); L.busy = false; announce(); }); });
    wake();
  });
  wake();
}
chipsEl && chipsEl.addEventListener('click', e => { if (!L.on) return; const b = e.target.closest('.sb-chip'); if (!b) return; e.stopImmediatePropagation();
  L.flag = L.flag === b.dataset.tag ? null : b.dataset.tag; syncChrome(); flags(); hap('selection'); snd('tick', {pitch: 1.4, gain: .5});
  if (L.flag) { const i = L.order.findIndex(it => it.note.tag === L.flag); if (i >= 0) { L.target = i; L.mode = 'target'; } }
  if (L.flag) later(L.mode === 'target' ? 260 : 0, () => snd('riffle', {pitch: 1.7, gain: .25})); wake(); }, true);
// the dock and the page controls still work in the catalogue: they leave it first
const capture = (sel, fn) => { const el = typeof sel === 'string' ? screenEl.querySelector(sel) : sel; el && el.addEventListener('click', e => { if (!L.on) return; e.stopImmediatePropagation(); e.preventDefault(); fn(); }, true); };
capture('.sb-fab', () => setList(false, () => SB.create('Ideas')));
capture('.sb-ovb', () => setList(false, () => SB.setOverview(true)));
const srEl = screenEl.querySelector('.sb-sr[role="list"]');
srEl && srEl.addEventListener('click', e => { if (!L.on) return; const b = e.target.closest('button'); if (!b) return; e.stopImmediatePropagation(); openCard(K.items[+b.dataset.i]); }, true);
const rep = document.getElementById('replay');
rep && rep.addEventListener('click', () => { if (!L.on) return; // Replay: snap back to the shelf at once
  L.on = false; L.busy = false; L.x = 0; L.dr.x = L.dr.t = 0; L.cam.x = L.cam.t = 0; drawer.visible = false; screenEl.classList.remove('listing'); syncChrome();
  K.items.forEach(it => { it.ext = false; if (it.cat) { it.cat.fly = null; it.cat.drive = false; it.cat.hide = false; } }); assigned.forEach(s => freeSlot(s)); }, true);

/* ---------- input on the canvas ---------- */
const cvEl = screenEl.querySelector('canvas.sb-gl'), RC = new T3.Raycaster(), NDC = new T3.Vector2();
const PXC = 58;  // px of drag per card
const ks = () => (screenEl.getBoundingClientRect().width / 390) || 1;
function pick(e) { const r = cvEl.getBoundingClientRect(); NDC.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); RC.setFromCamera(NDC, camera);
  const objs = []; assigned.forEach(s => { if (s.mesh.visible) objs.push(s.mesh); }); const h = RC.intersectObjects(objs, false)[0]; return h ? h.object.userData.slot.it : null; }
const ready = () => L.on && L.x >= 1 && K.openState === 'none' && K.mode === 'shelf' && !K.bvOn;
cvEl.addEventListener('pointerdown', e => {
  if (!ready()) return; cvEl.setPointerCapture(e.pointerId);
  const caught = L.mode === 'free' || L.mode === 'target';
  L.drag = {id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: L.p, lx: e.clientX, ly: e.clientY, lt: performance.now(), v: 0, vx: 0, axis: null, hit: L.busy ? null : pick(e), caught};
  if (caught) { L.mode = 'drag'; L.drag.p0 = L.p; } wake();
});
cvEl.addEventListener('pointermove', e => {
  const d = L.drag; if (!d || d.id !== e.pointerId) return; const k = ks(), dx = (e.clientX - d.x0) / k, dy = (e.clientY - d.y0) / k;
  const cur = L.order[clamp(Math.round(L.p), 0, L.order.length - 1)];
  if (!d.axis && Math.hypot(dx, dy) > 7) { d.axis = (Math.abs(dx) > Math.abs(dy) * 1.2 && d.hit && d.hit === cur && !d.caught && !L.busy) ? 'swipe' : 'scroll'; if (d.axis === 'scroll') { L.mode = 'drag'; d.p0 = L.p - dy / PXC; } }
  const now = performance.now(), dtt = Math.max(1, now - d.lt) / 1000;
  if (d.axis === 'scroll') { const n = L.order.length, m = Math.max(0, n - 1); let p = d.p0 + dy / PXC; if (p < 0) p *= .35; else if (p > m) p = m + (p - m) * .35; L.p = p;
    d.v = lerp(d.v, ((e.clientY - d.ly) / k) / PXC / dtt, .45); wake(); }
  if (d.axis === 'swipe') { const c = cs(cur); c.sw.x = c.sw.t = dx / 215; d.vx = lerp(d.vx, ((e.clientX - d.lx) / k) / 215 / dtt, .45); wake(); }
  d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
});
function upH(e) {
  const d = L.drag; if (!d || d.id !== e.pointerId) return; L.drag = null;
  if (d.axis === 'scroll') { if (performance.now() - d.lt > 90) d.v = 0; L.v = clamp(d.v, -24, 24); L.mode = 'free'; }
  else if (d.axis === 'swipe') { const cur = L.order[clamp(Math.round(L.p), 0, L.order.length - 1)], c = cs(cur);
    if (e.type === 'pointerup' && (Math.abs(c.sw.x) > .55 || Math.abs(d.vx) > 2.2 && Math.abs(c.sw.x) > .12)) toss(cur, Math.sign(c.sw.x || d.vx));
    else { c.sw.t = 0; c.sw.v = d.vx * .5; snd('tick', {pitch: 1.6, gain: .3}); } }
  else if (e.type === 'pointerup') { if (d.caught) { L.mode = 'free'; L.v = 0; } else if (d.hit) openCard(d.hit); }
  wake();
}
cvEl.addEventListener('pointerup', upH); cvEl.addEventListener('pointercancel', upH);
cvEl.addEventListener('wheel', e => { if (!ready() || e.ctrlKey) return; const dd = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  L.p -= dd / 260; L.v = clamp(-dd / 260 / .016 * .45, -20, 20); L.mode = 'free'; wake(); }, {passive: true});
cvEl.addEventListener('keydown', e => {
  if (!L.on) return; if (K.openState !== 'none') return;
  const n = L.order.length, cur = L.order[clamp(Math.round(L.p), 0, n - 1)];
  const go = d => { L.target = clamp(Math.round(L.mode === 'target' ? L.target : L.p) + d, 0, Math.max(0, n - 1)); L.mode = 'target'; wake(); e.preventDefault(); };
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(1);
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'Home') go(-n); else if (e.key === 'End') go(n);
  else if ((e.key === 'Enter' || e.key === ' ') && cur) { openCard(cur); e.preventDefault(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && cur && ready() && !L.busy) { toss(cur, -1); e.preventDefault(); }
  else if (e.key === 'Escape') { setList(false); e.preventDefault(); }
});
SBList.toss = d => { const n = L.order.length; if (ready() && n) toss(L.order[clamp(Math.round(L.p), 0, n - 1)], d || -1); }; SBList.open = i => openCard(L.order[i]);
})();
