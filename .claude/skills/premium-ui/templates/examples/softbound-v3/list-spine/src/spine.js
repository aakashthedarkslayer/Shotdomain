/* Softbound v3: SPINE VIEW, the list mode.
   Tap the stack button: the books turn on the turntable, lift off, topple onto their backs and pile up spines-out in the middle of the
   clay plinth, each landing with a clack. The pile is a hydraulic lift: scrolling raises it out of the clay (older books emerge from the
   plinth, the top ones leave the frame) or lowers it back in; it coasts with friction and rubber-bands at the ends, and every spine tips
   with the scroll speed and settles on its own spring. Each row is the real SBBook lying flat; an ink-stamped label is printed on its
   spine (title, date · words, the tag pill with its glyph, gold rules). Tap a row: the book slides out of the pile toward you and opens
   with SBOpen; closing slides it back into its slot. Swipe a spine left: it is thrown into the clay pot (binDelete), with the usual undo.
   Search and the tag chips push non-matching spines back into the shadow; sort by newest or by tag reshuffles the pile.
   Loaded after scene.js; builds on the scene kernel SB._k and hooks in with setList. */
(function () {
'use strict';
const SB = window.SB, K = SB && SB._k; if (!K) return;
const T3 = K.T3, {camera, cv, screenEl, homeEl, chipsEl, hdEl, floorPlane, items, RM, CLOTH, INK, TAGS, BINP, BINV, CZ, S, sstep, eio, snd, hap} = K;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, seg = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
const eic = t => t * t * t, frac = x => x - Math.floor(x);
const V3 = T3.Vector3, Q = T3.Quaternion, AX = new V3(1, 0, 0), AY = new V3(0, 1, 0);
const lin = h => new T3.Color(h).convertSRGBToLinear();
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join(''); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const words = s => window.SB_WORDS ? SB_WORDS(s) : (String(s || '').trim().match(/\S+/g) || []).length;

/* ---------- the pile ---------- */
const RH = .3;                 // row pitch: one book's thickness (the pillowed boards make it ~.3)
const ZS = CZ + .5;            // the spines' plane: the pile stands in the middle of the turntable, fore-edges toward the wall
const PITCH = .34, DIST = 6.7;  // list camera: a dolly in, looking slightly down so the top cover peeks
const TOPY = 186, BOTY = 702;  // phone px: where the top of the pile and the clay line sit
const PULL = .62, SWD = .5, PUSH = -.3;  // slide-out for reading, swipe distance, search push-back (world units)
const NPROX = 40;
// a book lying on its back cover, spine to the camera, head to the left (book x→-z, y→-x, z→+y)
const QF = new Q().setFromRotationMatrix(new T3.Matrix4().makeBasis(new V3(0, 0, -1), new V3(-1, 0, 0), new V3(0, 1, 0)));
const QM = new Q().setFromAxisAngle(AY, Math.PI / 2);   // standing, turned so its spine faces the camera

// fit the list camera: the clay line at BOTY, then where the top band and the screen top fall on the spines' plane
const LC = camera.clone(), RC = new T3.Raycaster(), _n = new T3.Vector2(), _v = new V3(), _v2 = new V3(), _v3 = new V3();
function listCam(sh, outP, outL) { outL.set(0, LY + sh, ZS); outP.set(0, LY + sh + Math.sin(PITCH) * DIST, ZS + Math.cos(PITCH) * DIST); }
function aimLC(sh) { listCam(sh, LC.position, _v3); LC.lookAt(_v3); LC.updateMatrixWorld(); }
function yAt(sy, cam) { _n.set(0, 1 - 2 * sy / 844); RC.setFromCamera(_n, cam); const r = RC.ray; return r.origin.y + r.direction.y * (ZS - r.origin.z) / r.direction.z; }
let LY = 1;
{ let lo = -3, hi = 6; for (let i = 0; i < 40; i++) { LY = (lo + hi) / 2; aimLC(0); _v.set(0, 0, ZS).project(LC); ((1 - _v.y) / 2 * 844 < BOTY) ? (lo = LY) : (hi = LY); } }
aimLC(0);
const HTOP = yAt(TOPY, LC), YSCR = yAt(0, LC), UPP = (YSCR - yAt(844, LC)) / 844 * .92;  // world units per phone px on the spines

/* ---------- state ---------- */
let fading = false, P = 'off', camK = 0, camT = 0, sort = 'new', tagF = null, query = '', rows = [], known = [], budget = 0, opening = false, potK = 0, onDone = null;
const sh = S(0, 60, 1);                                   // camera drop for a short pile (keeps its top at TOPY)
const sc = {base: 0, vel: 0, mode: 'rest', tgt: 0, lastRow: 0, lastTick: 0};
const POT0 = {x: BINP.x, z: BINP.z, vx: BINV.x, vz: BINV.z}, POTR = Math.hypot(BINP.x, BINP.z - CZ), POTA0 = Math.atan2(BINP.x, BINP.z - CZ), POTA1 = -.24;
const n = () => items.length;
const lo = () => Math.min(0, HTOP - n() * RH);
const shiftFor = () => Math.min(0, n() * RH - HTOP);
const yVis = () => YSCR + sh.x + RH * 1.2;
const hash = (k, s) => frac(Math.sin((+k || 7) * 12.9898 + s * 78.233) * 43758.5453);

function newL(it) {
  const id = it.note.id;
  return {row: 0, ry: Object.assign(S(0, 150, .78), {g: false}), z: S(0, 120, .8), tilt: S(0, 70 + 60 * hash(id, 3), .3), sx: S(0, 170, .72), sq: S(0, 260, .32),
    lab: 0, F: null, lb: null, pull: 0, gone: false, jx: (hash(id, 1) - .5) * .07, jy: (hash(id, 2) - .5) * .05, shuffle: false, cx: 0};
}
const MON = {jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12};
function dateKey(note) { const d = String(note.date || 'Today'); if (/today|now/i.test(d)) return 1e5 + (+note.id || 0) / 1e13;
  const m = /^([a-z]{3})\w*\s+(\d+)/i.exec(d); return m ? (MON[m[1].toLowerCase()] || 0) * 100 + +m[2] : 0; }
function order() {
  const byNew = (a, b) => dateKey(b.note) - dateKey(a.note) || (+b.note.id || 0) - (+a.note.id || 0);
  rows = items.slice().sort(sort === 'tag' ? (a, b) => (TAGS.indexOf(a.note.tag) - TAGS.indexOf(b.note.tag)) || byNew(a, b) : byNew);
  const N = rows.length; rows.forEach((it, r) => { const L = it.L || (it.L = newL(it)); L.row = r; L.ry.t = (N - 1 - r) * RH; });
}

/* ---------- the spine label: a decal that follows the spine's pillow, printed on a pooled canvas ---------- */
const LW = 1024, LH = 166, Y0 = .08, Y1 = 1.32, ZH = .1;
const pill = (u, p) => Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(u)), p));
const LGEO = (function () {
  const NY = 24, NZ = 4, pos = [], uv = [], idx = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NY; i++) {
    const y = Y1 - (Y1 - Y0) * i / NY, z = -ZH + 2 * ZH * j / NZ;
    pos.push(.004 - .016 * pill(z / .118, 2) * pill((y - .7) / .678, 12) - .0018, y, z); uv.push(i / NY, j / NZ); }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NY; i++) { const a = j * (NY + 1) + i, c = a + NY + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
})();
const pool = []; let nLabels = 0;
const glyphs = {};
const glyph = t => glyphs[t] || (glyphs[t] = new Path2D((window.SB_GLYPH || {})[t] || 'M12 2.5 21.5 12 12 21.5 2.5 12z'));
function takeLabel() {
  let o = pool.pop();
  if (!o) { const c = document.createElement('canvas'); c.width = LW; c.height = LH; const t = new T3.CanvasTexture(c); t.encoding = T3.sRGBEncoding; t.anisotropy = 8;
    const m = new T3.MeshStandardMaterial({map: t, transparent: true, roughness: .74, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, clippingPlanes: [floorPlane]});
    const mesh = new T3.Mesh(LGEO, m); mesh.matrixAutoUpdate = false; mesh.renderOrder = 3; mesh.receiveShadow = true; mesh.frustumCulled = false; K.scene.add(mesh);
    o = {c, x: c.getContext('2d'), t, m, mesh, key: ''}; nLabels++; }
  o.mesh.visible = true; return o;
}
function dropLabel(it) {
  const L = it.L; if (!L || !L.lb) return; L.lb.mesh.visible = false; pool.push(L.lb); L.lb = null;
  if (it.book && it.book.spineFoil) it.book.spineFoil.material.opacity = 1;
}
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function fit(x, s, w) { if (x.measureText(s).width <= w) return s; while (s.length > 1 && x.measureText(s + '…').width > w) s = s.slice(0, -1); return s.trimEnd() + '…'; }
function paintLabel(o, note) {
  const tag = note.tag || 'Ideas', wc = words(note.body), key = [note.title, tag, note.date, wc].join('|');
  if (o.key === key) return; o.key = key;
  const x = o.x, ink = INK[tag] || '#2B2A4A', cloth = CLOTH[tag] || '#CDBDF2';
  x.clearRect(0, 0, LW, LH); x.textBaseline = 'alphabetic';
  // gold rules at the head and tail, as on a real cloth spine
  const g = x.createLinearGradient(0, 18, 0, LH - 18); g.addColorStop(0, '#F6E3A6'); g.addColorStop(.45, '#C99A45'); g.addColorStop(.62, '#EBCB82'); g.addColorStop(1, '#B98935');
  x.fillStyle = g; [[10, 7], [24, 3], [LW - 17, 7], [LW - 27, 3]].forEach(([a, w]) => x.fillRect(a, 16, w, LH - 32));
  // the tag pill (right), with its glyph
  x.font = '700 36px "Bricolage Grotesque", system-ui, sans-serif'; const tw = x.measureText(tag).width, pw = tw + 98, px = LW - 52 - pw, py = (LH - 66) / 2;
  x.save(); x.shadowColor = 'rgba(40,20,20,.22)'; x.shadowBlur = 6; x.shadowOffsetY = 2; rr(x, px, py, pw, 66, 33); x.fillStyle = mixHex(cloth, '#FFFFFF', .62); x.fill(); x.restore();
  rr(x, px + 1.5, py + 1.5, pw - 3, 63, 31.5); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.stroke();
  x.save(); x.translate(px + 18, py + 13); x.scale(40 / 24, 40 / 24); x.fillStyle = ink; x.fill(glyph(tag), 'evenodd'); x.restore();
  x.fillStyle = ink; x.fillText(tag, px + 68, py + 46);
  // title + date · words, stamped into the cloth: a light lip under each letter, ink on top
  const tx = 62, maxW = px - tx - 26;
  x.font = '600 62px Newsreader, Georgia, serif'; const t = fit(x, note.title || 'Untitled', maxW);
  x.fillStyle = 'rgba(255,250,240,.42)'; x.fillText(t, tx, 81); x.fillStyle = ink; x.fillText(t, tx, 79);
  x.font = '700 33px "Bricolage Grotesque", system-ui, sans-serif'; if ('letterSpacing' in x) x.letterSpacing = '2.5px';
  const meta = fit(x, `${String(note.date || 'Today').toUpperCase()}  ·  ${wc} WORD${wc === 1 ? '' : 'S'}`, maxW);
  x.globalAlpha = .72; x.fillText(meta, tx + 2, 129); x.globalAlpha = 1; if ('letterSpacing' in x) x.letterSpacing = '0px';
  o.t.needsUpdate = true;
}

/* ---------- spine-only proxies: rows on screen whose real book isn't built yet (fast flings, 100+ notes) ---------- */
const PGEO = new T3.BoxGeometry(.97, 1.38, .3, 1, 1, 1).translate(.5, .7, 0);
const prox = {}, _m = new T3.Matrix4(), _one = new V3(1, 1, 1), _col = new T3.Color();
TAGS.forEach(tag => {
  const edge = new T3.MeshStandardMaterial({color: lin('#EDE4D4'), roughness: .95, clippingPlanes: [floorPlane]});
  const cl = new T3.MeshStandardMaterial({color: lin(CLOTH[tag]), roughness: .86, clippingPlanes: [floorPlane]});
  const m = new T3.InstancedMesh(PGEO, [edge, cl, edge, edge, cl, cl], NPROX); m.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(NPROX * 3).fill(1), 3);
  m.count = 0; m.visible = false; m.castShadow = m.receiveShadow = true; m.frustumCulled = false; K.scene.add(m); prox[tag] = {m, k: 0};
});

/* ---------- placement ---------- */
const _c = new V3(), _q = new Q(), _qa = new Q(), _o = new V3();
function rowPose(it, outC, outQ) {
  const L = it.L, y = sc.base + L.ry.x + (it.falling ? it.yo : 0) - (it.sink || 0) * 3.4;
  outC.set(L.jx + L.sx.x, y + RH / 2, ZS + L.z.x);
  outQ.copy(QF).premultiply(_qa.setFromAxisAngle(AY, L.jy + L.sx.x * .35)).premultiply(_qa.setFromAxisAngle(AX, L.tilt.x));
  return y;
}
const spineC = (g, out) => out.set(0, .7 * g.scale.x, 0).applyQuaternion(g.quaternion).add(g.position);
function originOf(c, q, s, out) { return out.set(0, .7 * s, 0).applyQuaternion(q).negate().add(c); }
function flightPose(it, F, u, outC, outQ) { // F.c1/F.q1 = where it's going (live), F.c0/F.q0 = where it started
  if (F.kind === 'in') {
    const turn = eio(seg(u, 0, .34)), mv = eio(seg(u, .2, 1)), top = eio(seg(u, .3, .92));
    outC.lerpVectors(F.c0, F.c1, mv); outC.y += Math.sin(Math.PI * mv) * F.lift + Math.sin(Math.PI * seg(u, 0, .34)) * .07;
    outQ.copy(F.q0).slerp(QM, turn).slerp(F.q1, top); return lerp(F.s0, 1, mv);
  }
  if (F.kind === 'drop') { outC.copy(F.c1); outC.y += (1 - u * u) * F.h; outQ.copy(F.q1).premultiply(_qa.setFromAxisAngle(AY, (1 - u) * F.w)); return 1; }
  if (F.kind === 'sink') { outC.copy(F.c0); outC.y -= 3.4 * eic(u); outQ.copy(F.q0); return 1; }
  // out: stand up while lifting, fly home, then turn to face out on the shelf
  const mv = eio(u); outC.lerpVectors(F.c0, F.c1, mv); outC.y += Math.sin(Math.PI * mv) * F.lift;
  outQ.copy(F.q0).slerp(QM, eio(seg(u, 0, .45))).slerp(F.q1, eio(seg(u, .5, 1))); return lerp(1, F.s1, mv);
}
function clack(it, imp, onClay) {
  const L = it.L; L.sq.v -= Math.min(2.4, .6 + imp * .35);
  snd('tick', {pitch: 1.05 + Math.random() * .3, gain: .62}); snd('thup', {pitch: 1.25 + Math.random() * .2, gain: .32}); hap('selection');
  if (onClay) { const c = rowPose(it, _c, _q); K.spawnPuff(c.x || 0, ZS - .5, 16, .5); K.ripple(0, ZS - .5, .012); }
}
function stepRY(it, dt) {
  const L = it.L, r = L.ry;
  if (!L.shuffle && (r.x - r.t > 1e-3 || r.g)) { // a gap opened below: it falls onto the book underneath and bounces a little
    r.g = true; r.v -= 15 * dt; r.x += r.v * dt;
    if (r.x <= r.t) { const imp = -r.v; r.x = r.t; if (imp > .5) { r.v = imp * .16; clack(it, imp, r.t < 1e-3 && sc.base > -1e-3); } else { r.v = 0; r.g = false; } }
    return true;
  }
  const was = Math.abs(r.t - r.x) > .02, m = sstep(r, dt);
  if (L.shuffle && was && Math.abs(r.t - r.x) < .02) { const now = performance.now(); if (now - sc.lastTick > 45) { sc.lastTick = now; snd('tick', {pitch: 1.2 + Math.random() * .3, gain: .3}); } }
  if (!m) L.shuffle = false;
  return m;
}
const flight = it => it.L && it.L.F;
function placeIt(it, dt) {
  const L = it.L; let busy = false;
  busy = stepRY(it, dt) | sstep(L.sx, dt) | sstep(L.sq, dt) | sstep(L.tilt, dt) | sstep(it.dim, dt);
  // z: pulled out to read, pushed back by search, and popped forward while shuffling past its neighbours
  if (L.pull !== 1 && L.pull !== 2) L.z.t = (L.match === false ? PUSH : 0) + (L.shuffle ? Math.min(.5, Math.abs(L.ry.t - L.ry.x) * .45) : 0);
  busy |= sstep(L.z, dt);
  if (L.pull === 4 && K.openIt !== it) { L.pull = 0; L.seated = false; }
  if (L.pull === 2 && K.openIt !== it && K.openState === 'none') { L.pull = 3; L.z.t = L.match === false ? PUSH : 0; }
  if (L.pull === 3 && Math.abs(L.z.x - L.z.t) < .03) { L.pull = 0; L.seated = false; snd('tick', {pitch: 1.15, gain: .55}); snd('thup', {pitch: 1.4, gain: .25}); hap('light'); L.sq.v -= .8; }
  if (it.falling) { busy = true; it.vy -= 22 * dt; it.yo += it.vy * dt; if (it.yo <= 0) { const imp = -it.vy; it.yo = 0; it.vy = 0; it.falling = false; clack(it, imp * .4, false); } }
  it.blend = null; it.pre = false;
  if (L.homed && it.book) { // flown home: hold it in its shelf slot until the camera is back
    const g = it.book.group, p = SB.slotPose(it.book); if (p) { g.position.copy(p.position); g.quaternion.copy(p.quaternion); g.scale.setScalar(Math.max(.001, p.scale)); }
    sstep(it.sq, dt); it.book.squash(1 - it.sq.x * .5, 1 + it.sq.x); g.visible = true; if (L.lb) dropLabel(it); return true; }
  const F = L.F;
  let c = _c, q = _q, s = 1, y = rowPose(it, c, q);
  const inView = y + RH > -.04 && y < yVis();
  if (F) { busy = true; F.t += dt; F.c1.copy(c); F.q1.copy(q); if (F.kind === 'out' && it.book) { const p = SB.slotPose(it.book); if (p) { F.s1 = p.scale; F.q1.copy(p.quaternion); originOf(p.position, p.quaternion, -p.scale, F.c1); } } }
  const need = inView || F || it.fly || L.pull;
  let b = it.book;
  if (need && !b && !it.fly && (n() <= 14 || (budget > 0 && Math.abs(sc.vel) < 2.5 && !(F && F.kind === 'drop')))) { K.ensureBook(it); budget--; b = it.book; }
  if (!need) {
    if (b) { b.group.visible = false; if (it.ribbon) it.ribbon.visible = false; if (it.blob) it.blob.visible = false;
      if (n() > 14 && Math.abs(y - (yVis() + 1) / 2) > 4.5 && !it.fly) { dropLabel(it); K.dropBook(it); } }
    if (L.lb) dropLabel(it);
    return busy;
  }
  if (it.fly) { c = it.fly.c; q = it.fly.q; s = it.fly.s; } // binDelete / undo: fly.c is the book's centre
  else if (F) { const u = clamp(F.t / F.dur, 0, 1); if (F.t < 0) { c = F.c0; q = F.q0; s = F.s0; } else s = flightPose(it, F, u, _v2.copy(c), _q.copy(q)), c = _v2;
    if (F.t >= F.dur) landed(it, F); }
  // put the book (or its proxy) there
  if (it.fly) _o.set(.5 * s, .7 * s, 0).applyQuaternion(q).negate().add(c); else originOf(c, q, s, _o);
  if (b) {
    const g = b.group; g.visible = !it.hidden; g.position.copy(_o); g.quaternion.copy(q); g.scale.setScalar(Math.max(.001, s));
    const sq = L.sq.x; b.squash(1 + sq * .55, 1 - sq * .4);
    g.updateMatrixWorld(true);
    if (it.ribbon) it.ribbon.visible = false; if (it.blob) it.blob.visible = false;
    if (it.lastDim !== it.dim.x) { K.applyDim(it, it.dim.x); it.lastDim = it.dim.x; }
  } else if (!it.fly) {
    const pr = prox[it.note.tag] || prox.Ideas; if (pr.k < NPROX) { _m.compose(_o, q, _one); pr.m.setMatrixAt(pr.k, _m); _col.setScalar(1 - .45 * it.dim.x); pr.m.setColorAt(pr.k, _col); pr.k++; }
  }
  // the label: fades in as the book lands, out while it flies home or lies open
  const showLab = !it.hidden && (!F || F.kind === 'drop' || (F.kind === 'in' && F.t >= F.dur)) && P !== 'out' && (inView || it.fly || L.pull);
  if (showLab && !L.lb && P === 'on' && !F && !it.fly && !L.pull) L.lab = 1; // rows scrolling into view: printed already, no crossfade
  const tl = showLab ? 1 : 0; if (L.lab !== tl) { L.lab = RM ? tl : clamp(L.lab + (tl ? dt / .35 : -dt / .2), 0, 1); busy = true; }
  if (L.lab > .002 || showLab) {
    if (!L.lb) L.lb = takeLabel(); paintLabel(L.lb, it.note);
    const m = L.lb.mesh; if (b) m.matrix.copy(b.group.matrixWorld); else m.matrix.compose(_o, q, _one.set(s, s, s)), _one.set(1, 1, 1);
    m.matrixWorldNeedsUpdate = true; L.lb.m.opacity = L.lab; L.lb.m.color.setScalar(1 - .5 * it.dim.x);
    if (b && b.spineFoil) b.spineFoil.material.opacity = 1 - L.lab;
  } else if (L.lb) dropLabel(it);
  return busy;
}
function landed(it, F) {
  const L = it.L; L.F = null;
  if (F.kind === 'in' || F.kind === 'drop') { if (F.inView) clack(it, F.kind === 'drop' ? 1.8 : 1.2, L.ry.t < 1e-3 && sc.base > -1e-3); }
  else if (F.kind === 'out') { // home on the shelf: a soft thup, dust in the beam, the ribbon hangs again
    L.homed = true; it.sq.x = it.sq.t = 0; it.sq.v = -3; if (it.rope) it.rope.init = false;
    if (F.inView) { snd('thup', {pitch: .9 + Math.random() * .25, gain: .8}); hap('light'); const p = it.book.group.position; K.spawnPuff(p.x, p.z, 14, .5); K.ripple(p.x, p.z, .01); }
  } else if (it.book) it.book.group.visible = false;
}

/* ---------- scroll: drag, fling with friction, rubber-band at the ends ---------- */
function stepScroll(dt) {
  const L0 = lo(), H0 = 0, ex = () => sc.base < L0 ? sc.base - L0 : sc.base > H0 ? sc.base - H0 : 0;
  if (sc.mode === 'rest' && Math.abs(ex()) > 1e-4) sc.mode = 'free';
  if (sc.mode === 'rest' || sc.mode === 'drag') return sc.mode === 'drag';
  if (sc.mode === 'target') { sc.tgt = clamp(sc.tgt, L0, H0); const k = 120, a = k * (sc.tgt - sc.base) - 2 * Math.sqrt(k) * sc.vel; sc.vel += a * dt; sc.base += sc.vel * dt;
    if (Math.abs(sc.tgt - sc.base) < 1e-4 && Math.abs(sc.vel) < 1e-3) { sc.base = sc.tgt; sc.vel = 0; sc.mode = 'rest'; } }
  else { const e = ex();
    if (e) { const k = 170, a = -k * e - 2 * Math.sqrt(k) * sc.vel; sc.vel += a * dt; sc.base += sc.vel * dt; if (Math.abs(ex()) < 1e-4 && Math.abs(sc.vel) < .01) { sc.base = clamp(sc.base, L0, H0); sc.vel = 0; sc.mode = 'rest'; }
      if (e && !ex()) { snd('thup', {pitch: 1.5, gain: .14}); } }
    else { sc.base += sc.vel * dt; sc.vel *= Math.exp(-2.1 * dt); if (Math.abs(sc.vel) < .015) { sc.vel = 0; sc.mode = 'rest'; } } }
  return true;
}
function rowTicks() { // a soft ratchet as rows pass the clay line
  const r = Math.floor(sc.base / RH); if (r === sc.lastRow) return; sc.lastRow = r;
  const now = performance.now(); if (Math.abs(sc.vel) > .25 && now - sc.lastTick > 60) { sc.lastTick = now; snd('tick', {pitch: 1.5 + Math.random() * .2, gain: .14}); }
}
function reveal(it, instant) {
  if (!it || !it.L) return; const y = it.L.ry.t, a = RH * .4 - y, b = HTOP - RH * 1.2 - y;  // keep the row between the clay and the top band
  const t = clamp(clamp(sc.base, a, b), lo(), 0); if (Math.abs(t - sc.base) < 1e-3) return;
  if (instant || RM) { sc.base = t; sc.vel = 0; sc.mode = 'rest'; } else { sc.tgt = t; sc.mode = 'target'; } K.wake(800);
}

/* ---------- the frame step (called by scene.js before its own book loop) ---------- */
function step(dt) {
  if (P === 'off') return false;
  let busy = false;
  if (camK !== camT) { camK = RM ? camT : clamp(camK + Math.sign(camT - camK) * dt / 1.15, 0, 1); busy = true; }
  const pk = eio(camK); if (Math.abs(pk - potK) > 1e-4) { potK = pk; potMove(pk); busy = true; }
  sh.t = shiftFor(); if (sstep(sh, dt)) busy = true;
  if (stepScroll(dt)) { busy = true; rowTicks(); }
  const tt = RM ? 0 : clamp(-sc.vel * .045, -.1, .1);
  budget = 1; for (const k in prox) prox[k].k = 0;
  let flying = false;
  for (let i = 0; i < items.length; i++) {
    const it = items[i]; if (!it.L) it.L = newL(it);
    if (it === K.openIt && K.openState !== 'none') { if (openHeld(it, dt)) busy = true; continue; }
    it.L.tilt.t = tt;
    if (placeIt(it, dt)) busy = true;
    if (it.L.F) flying = true;
  }
  for (const k in prox) { const p = prox[k]; if (p.m.count !== p.k || p.k) { p.m.count = p.k; p.m.visible = p.k > 0; p.m.instanceMatrix.needsUpdate = true; p.m.instanceColor.needsUpdate = true; } }
  if (ring.it) placeRing();
  if ((P === 'in' || P === 'out') && !flying && camK === camT && !fading) finishPhase();
  return busy || P === 'in' || P === 'out';
}
function openHeld(it, dt) { // SBOpen owns the book; as it closes and glides home, the label is printed back and the slot clacks
  const L = it.L, so = window.SBOpen, s = so && so._cur, g = it.book && it.book.group; if (L.pull === 1) L.pull = 2; reseat(it);
  const home = L.seated && s && s.phase === 'close' && g && g.position.distanceTo(s.home.pos) < .04;
  if (!home) { if (L.lb) dropLabel(it); L.lab = 0; return false; }
  if (L.pull === 2) { L.pull = 4; snd('tick', {pitch: 1.15, gain: .55}); snd('thup', {pitch: 1.4, gain: .25}); hap('light'); }
  if (!L.lb) L.lb = takeLabel(); paintLabel(L.lb, it.note); L.lab = Math.min(1, L.lab + dt / .3);
  g.updateMatrixWorld(true); L.lb.mesh.matrix.copy(g.matrixWorld); L.lb.mesh.matrixWorldNeedsUpdate = true; L.lb.m.opacity = L.lab; L.lb.m.color.setScalar(1 - .5 * it.dim.x);
  if (it.book.spineFoil) it.book.spineFoil.material.opacity = 1 - L.lab; return L.lab < 1;
}
function reseat(it) { // once the book is open, its way home is its slot in the pile (not the pulled-out spot), so closing glides it straight back in
  const so = window.SBOpen, s = so && so.isOpen && so._cur, L = it.L; if (!s || s.book !== it.book || L.seated || !s.home || !s.P0) return;
  L.seated = true; L.z.x = L.z.t = L.match === false ? PUSH : 0; L.z.v = 0; rowPose(it, _c, _q); originOf(_c, _q, 1, _o); s.P0.copy(_o); s.home.pos.copy(_o);
}
function potMove(e) { // the pot rides the rim round to the front-left, out of the pile's way
  const a = lerp(POTA0, POTA1, e); BINP.x = Math.sin(a) * POTR; BINP.z = CZ + Math.cos(a) * POTR; BINV.x = lerp(POT0.vx, -.8, e); BINV.z = POT0.vz;
  K.binRefresh();
}
function cameraHook(v1, v2) { if (camK <= 0) return; listCam(sh.x, _v, _v3); const e = eio(camK); v1.lerp(_v, e); v2.lerp(_v3, e); }

/* ---------- enter / leave ---------- */
const canToggle = () => K.mode === 'shelf' && K.openState === 'none' && !K.ovActive() && !K.bvOn && !opening;
function setChrome(on) {
  screenEl.classList.toggle('sb-listing', on);
  chipsEl.classList.add('sb-swap'); clearTimeout(setChrome.t); // the chips fade out, move (to the top in the stack), and fade back in
  setChrome.t = setTimeout(() => { screenEl.classList.toggle('sb-lchips', on); requestAnimationFrame(() => chipsEl.classList.remove('sb-swap')); }, RM ? 0 : 240); btn.setAttribute('aria-pressed', String(on)); btn.innerHTML = on ? K.ICONS.shelf : ICON_STACK;
  btn.setAttribute('aria-label', on ? 'Back to the shelf' : 'Spine list');
  const t = hdEl.querySelector('.sb-ttl'); if (t) t.textContent = on ? 'Your stack' : 'Your shelf';
  sr.hidden = !on; sortEl.inert = !on;
}
function enter() {
  if (P !== 'off') return; if (!canToggle()) { if (K.openState !== 'none') K.settleOpen().then(() => setTimeout(enter, 60)); return; }
  K.stopAuto(); P = 'in'; K.mode = 'listing'; tagF = null; query = (K.qEl.value || '').trim().toLowerCase();
  order(); known = items.slice(); sc.base = lo(); sc.vel = 0; sc.mode = 'rest'; sc.lastRow = Math.floor(sc.base / RH); sh.x = sh.t = shiftFor();
  items.forEach(it => { const L = it.L; L.ry.x = L.ry.t; L.ry.v = 0; L.ry.g = false; L.z.x = L.z.t = 0; L.sx.x = L.sx.t = 0; L.pull = 0; L.lab = 0; L.F = null; L.shuffle = false; it.falling = false; it.pre = false; });
  applyFilter(true); setChrome(true); buildSR(); syncChips();
  if (RM) { return crossfade(() => { camK = camT = 1; finishPhase(); }); }
  camT = 1;
  const yv = yVis(), list = [];
  items.forEach((it, i) => {
    const L = it.L, g = it.book && it.book.group, y = sc.base + L.ry.t, inView = y + RH > -.04 && y < yv;
    const onShelf = g && g.visible && Math.abs(K.slotOf(i)) < 2.9;
    if (onShelf) { if (it.ribbon) it.ribbon.visible = false; if (it.blob) it.blob.visible = false;
      L.F = {kind: 'in', t: 0, dur: .8, c0: spineC(g, new V3()), q0: g.quaternion.clone(), s0: g.scale.x, c1: new V3(), q1: new Q(), lift: .55 + .25 * Math.random(), inView}; list.push(it); }
    else if (inView) { L.F = {kind: 'drop', t: 0, dur: .5, c0: new V3(), q0: new Q(), s0: 1, c1: new V3(), q1: new Q(), h: yv - y + .8, w: (Math.random() - .5) * .5, inView}; list.push(it); }
  });
  // bottom first, so each lands on the one below: a clack, a clack, a clack
  list.sort((a, b) => a.L.ry.t - b.L.ry.t);
  let k = 0; list.forEach(it => { const F = it.L.F; if (!F.inView) { F.t = -.05; return; } const land = .78 + k++ * .085; F.t = -(land - F.dur); });
  list.forEach(it => { const F = it.L.F; if (F.kind === 'drop') { rowPose(it, F.c0, F.q0); F.c0.y += F.h; } });
  snd('whoosh', {pitch: .8, gain: .6}); K.later(120, () => snd('riffle', {pitch: .8, gain: .35})); hap('selection');
  K.wake(2500);
}
function exit(then) {
  if (P !== 'on' || !canToggle()) return;
  P = 'out'; K.mode = 'listing'; onDone = then || null; tagF = null; syncChips(); setChrome(false);
  if (RM) return crossfade(() => { camK = camT = 0; finishPhase(); });
  camT = 0;
  const yv = yVis(), list = [];
  items.forEach((it, i) => {
    const L = it.L, y = sc.base + L.ry.x, inView = y + RH > -.04 && y < yv, onShelf = Math.abs(K.slotOf(i)) < 2.9;
    if (onShelf) { K.ensureBook(it); const g = it.book.group; if (!inView) { L.drop = true; g.visible = false; return; }
      placeIt(it, 0); L.F = {kind: 'out', t: 0, dur: .78, c0: spineC(g, new V3()), q0: g.quaternion.clone(), s0: 1, s1: 1, c1: new V3(), q1: new Q(), lift: .7 + .2 * Math.random(), inView}; list.push(it); }
    else if (inView) { const F = L.F = {kind: 'sink', t: 0, dur: .55, c0: new V3(), q0: new Q(), s0: 1, c1: new V3(), q1: new Q(), inView}; if (it.book) { spineC(it.book.group, F.c0); F.q0.copy(it.book.group.quaternion); } else rowPose(it, F.c0, F.q0); list.push(it); }
  });
  list.sort((a, b) => b.L.ry.t - a.L.ry.t); list.forEach((it, k) => { it.L.F.t = -(.04 + k * .07); });
  snd('whoosh', {pitch: 1.05, gain: .55}); hap('selection'); K.wake(2500);
}
function finishPhase() {
  if (P === 'in') { P = 'on'; K.mode = 'shelf'; K.wake(1200); return; }
  if (P === 'out') { teardown(); K.mode = 'shelf';
    // shelf books whose rows were off screen drop back in from above, like the first drop
    let k = 0; items.forEach(it => { if (it.L && it.L.drop) { it.L.drop = false; if (!it.book) return; it.pre = true; K.later(k++ * 90, () => { it.pre = false; if (RM) return; it.falling = true; it.yo = 2.7; it.vy = -.6; if (it.rope) it.rope.init = false; K.wake(); }); } });
    K.search(K.qEl.value); K.syncLists(); const f = onDone; onDone = null; f && setTimeout(f, 30); K.wake(1500);
  }
}
function teardown() {
  P = 'off'; camK = camT = 0; potK = 0; BINP.x = POT0.x; BINP.z = POT0.z; BINV.x = POT0.vx; BINV.z = POT0.vz; K.binRefresh();
  items.forEach(it => { dropLabel(it); if (it.L) { it.L.F = null; it.L.lab = 0; it.L.pull = 0; it.L.homed = false; } if (it.book) { it.book.squash(1, 1); it.book.group.visible = true; } if (it.rope) it.rope.init = false; it.sq.x = it.sq.t = 0; });
  for (const k in prox) { prox[k].m.count = 0; prox[k].m.visible = false; }
  ring.it = null; ringEl.classList.remove('on');
}
function reset() { if (P === 'off') return; setChrome(false); teardown(); if (K.mode === 'listing') K.mode = 'shelf'; tagF = null; syncChips(); }
function crossfade(mid) { // reduced motion: no flights, the canvas dips and the other mode is there
  cv.style.transition = 'opacity .2s'; cv.style.opacity = '0'; fading = true;
  setTimeout(() => { fading = false; mid(); items.forEach(it => { if (it.L) { it.L.F = null; it.L.lab = P === 'off' ? 0 : 1; } }); K.wake(600); requestAnimationFrame(() => { cv.style.opacity = '1'; }); }, 210);
}

/* ---------- rows: open, delete ---------- */
function canAct() { return P === 'on' && K.mode === 'shelf' && K.openState === 'none' && !K.bvOn && !opening; }
function openRow(it) {
  if (!it || !canAct()) return;
  K.ensureBook(it); placeIt(it, 0); it.L.lab = 1; ring.it = null; ringEl.classList.remove('on');
  const rib = () => { if (it.ribbon) { it.ribbon.visible = true; if (it.rope) it.rope.init = false; } };
  if (RM) { it.L.pull = 2; rib(); K.openItem(it); return; }
  it.L.pull = 1; it.L.z.t = PULL; opening = true; snd('whoosh', {pitch: 1.45, gain: .32}); snd('tick', {pitch: .95, gain: .35}); hap('selection');
  K.later(300, () => { opening = false; if (P !== 'on') { it.L.pull = 0; return; } it.L.pull = 2; rib(); K.openItem(it); });
  K.wake(1500);
}
function deleteRow(it) {
  if (!it || !canAct()) return;
  K.ensureBook(it); placeIt(it, 0); ring.it = null; ringEl.classList.remove('on');
  K.deleteItem(it);
}

/* ---------- search, chips, sort ---------- */
function applyFilter(quiet) {
  const q = query, f = tagF; let first = null, changed = false;
  rows.forEach(it => { const m = (!q || (it.note.title + ' ' + it.note.body + ' ' + it.note.tag).toLowerCase().includes(q)) && (!f || it.note.tag === f);
    const on = !!(q || f); if (it.L.match !== (on ? m : undefined)) changed = true; it.L.match = on ? m : undefined;
    it.dim.t = on && !m ? 1 : 0; it.rise.t = 0; if (m && on && !first) first = it; });
  if (first) reveal(first);
  if (changed && !quiet && !RM) { snd('whoosh', {pitch: 1.3, gain: .22}); hap('selection'); }
  K.wake(1500);
}
function syncChips() { chipsEl.querySelectorAll('.sb-chip').forEach(c => c.setAttribute('aria-pressed', String(P !== 'off' && P !== 'out' && c.dataset.tag === tagF))); }
function setSort(s) {
  if (s === sort || P !== 'on') return; sort = s; sortEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.s === s)));
  items.forEach(it => { if (it.L) it.L.shuffle = !RM; }); order(); if (RM) items.forEach(it => { it.L.ry.x = it.L.ry.t; });
  snd('riffle', {pitch: .9, gain: .6}); hap('selection'); buildSR(); K.wake(2000);
}

/* ---------- sync with the scene's list (create, delete, undo, save) ---------- */
function sync() {
  if (P === 'off') return;
  const now = new Set(items);
  known.forEach(it => { if (!now.has(it)) { dropLabel(it); if (it.L) { it.L.gone = true; it.L.F = null; } if (ring.it === it) ring.it = null; } });
  const fresh = items.filter(it => !it.L || it.L.gone || known.indexOf(it) < 0);
  order(); known = items.slice();
  fresh.forEach(it => { const L = it.L; L.gone = false; L.ry.x = L.ry.t; L.ry.v = 0; L.ry.g = false; L.sx.x = L.sx.t = 0; L.z.x = L.z.t = 0; L.pull = 0; L.lab = 0; L.F = null; });
  if (fresh.length === 1 && P === 'on') reveal(fresh[0]);
  applyFilter(true); buildSR(); setTimeout(syncChips, 170); K.wake(1200);
}
function home(it, to, q) { // where an undone book flies back to: its slot in the pile (fly.c is the book's centre)
  if (P !== 'on' || !it.L) return false; rowPose(it, to, q); to.add(_v.set(.5, 0, 0).applyQuaternion(q)); return true;
}
function topItem() { const it = rows[0]; return P === 'on' && it && it.book && it.book.group.visible && sc.base <= lo() + .05 && !it.L.F ? it : null; }

/* ---------- DOM: the toggle, the sort control, the header fade, the focus ring, a screen-reader list ---------- */
const IC = d => `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON_STACK = IC('<rect x="3.5" y="4.5" width="16" height="4.2" rx="1.4"/><rect x="5" y="10" width="16" height="4.2" rx="1.4"/><rect x="3" y="15.5" width="16" height="4.2" rx="1.4"/><path d="M7 6.6h4M8.5 12.1h4M6.5 17.6h4"/>');
const ICON_NEW = IC('<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'), ICON_TAG = IC('<path d="M4 12.6V5.5A1.5 1.5 0 0 1 5.5 4h7.1l7.4 7.4a1.5 1.5 0 0 1 0 2.1l-6 6a1.5 1.5 0 0 1-2.1 0z"/><circle cx="8.5" cy="8.5" r="1.4"/>');
const st = document.createElement('style');
st.textContent = `
#screen .sb-lstb[aria-pressed="true"]{background:var(--ink);color:var(--paper,#FFFCF7)}
#screen[data-time="night"] .sb-lstb[aria-pressed="true"]{color:#2B2A4A}
#screen .sb-hd .sb-lstb{margin-right:-2px}
#screen .sb-lfade{position:absolute;left:0;right:0;top:0;height:200px;pointer-events:none;opacity:0;transition:opacity .6s;background:linear-gradient(var(--lf) 0,var(--lf) 46%,rgba(0,0,0,0));--lf:rgba(244,214,180,.94)}
#screen[data-time="morning"] .sb-lfade{--lf:rgba(236,232,228,.95)}
#screen[data-time="night"] .sb-lfade{--lf:rgba(44,33,40,.94)}
#screen.sb-listing .sb-lfade{opacity:1}
#screen .sb-sort{position:absolute;left:24px;top:128px;height:34px;display:flex;padding:3px;gap:2px;border-radius:99px;background:var(--pill);box-shadow:0 10px 22px -14px rgba(80,50,40,.55);opacity:0;transform:translateY(8px);pointer-events:none;
  transition:opacity .35s,transform .5s cubic-bezier(.3,1.4,.5,1),background 1s;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
#screen.sb-listing .sb-sort{opacity:1;transform:none;pointer-events:auto;transition-delay:.25s}
#screen .sb-sort button{all:unset;box-sizing:border-box;cursor:pointer;height:28px;padding:0 9px 0 7px;border-radius:99px;display:inline-flex;align-items:center;gap:4px;font:650 12px var(--fd);color:var(--ink);opacity:.7;transition:background .3s,color .3s,opacity .3s}
#screen .sb-sort button svg{width:16px;height:16px}
#screen .sb-sort button[aria-checked="true"]{background:var(--ink);color:var(--paper,#FFFCF7);opacity:1}
#screen[data-time="night"] .sb-sort button[aria-checked="true"]{color:#2B2A4A}
#screen .sb-sort button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
#screen .sb-chips{transition:opacity .35s}
#screen .sb-chips.sb-swap{opacity:0;pointer-events:none;transition:opacity .2s}
#screen.sb-lchips .sb-chips{transform:translateY(-552px);padding-left:200px;-webkit-mask-image:linear-gradient(90deg,transparent 186px,#000 204px);mask-image:linear-gradient(90deg,transparent 186px,#000 204px)}
#screen.sb-listing .sb-info{opacity:0;pointer-events:none}
#screen.sb-listing .sb-cord{opacity:0}
#screen.sb-listing .sb-cord-hit{pointer-events:none}
#screen .sb-lring{position:absolute;left:0;top:0;width:10px;height:10px;border-radius:12px;box-shadow:0 0 0 2.5px var(--ink),0 0 0 6px rgba(255,255,255,.35);opacity:0;pointer-events:none;z-index:4;transition:opacity .2s}
#screen .sb-lring.on{opacity:1}
`;
document.head.appendChild(st);
const fade = document.createElement('div'); fade.className = 'sb-lfade'; fade.setAttribute('aria-hidden', 'true'); homeEl.insertBefore(fade, homeEl.firstChild);
const btn = document.createElement('button'); btn.className = 'sb-ib sb-lstb'; btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Spine list'); btn.innerHTML = ICON_STACK;
const srchBtn = hdEl.querySelector('.sb-srch'); hdEl.insertBefore(btn, srchBtn);
const sortEl = document.createElement('div'); sortEl.className = 'sb-sort'; sortEl.setAttribute('role', 'radiogroup'); sortEl.setAttribute('aria-label', 'Sort the stack'); sortEl.inert = true;
sortEl.innerHTML = `<button role="radio" data-s="new" aria-checked="true">${ICON_NEW}Newest</button><button role="radio" data-s="tag" aria-checked="false">${ICON_TAG}By tag</button>`;
homeEl.appendChild(sortEl);
const ringEl = document.createElement('div'); ringEl.className = 'sb-lring'; ringEl.setAttribute('aria-hidden', 'true'); screenEl.appendChild(ringEl);
const sr = document.createElement('div'); sr.className = 'sb-sr'; sr.setAttribute('role', 'list'); sr.setAttribute('aria-label', 'Notebooks, as a stack of spines'); sr.hidden = true; homeEl.appendChild(sr);
const ring = {it: null};
function buildSR() {
  sr.innerHTML = rows.slice(0, 200).map(it => { const nt = it.note, w = words(nt.body);
    return `<div role="listitem"><button data-id="${esc(nt.id)}" aria-label="${esc(nt.title || 'Untitled')}. ${esc(nt.tag)}. ${esc(nt.date || 'Today')}, ${w} word${w === 1 ? '' : 's'}. Enter opens it, Delete moves it to the clay bin."></button></div>`; }).join('');
}
const rowById = id => rows.find(it => String(it.note.id) === String(id));
function placeRing() {
  const it = ring.it; if (!it || !it.L || P !== 'on') { ringEl.classList.remove('on'); return; }
  const y = sc.base + it.L.ry.x, cx = it.L.jx + it.L.sx.x, a = _v.set(cx - .72, y + RH, ZS + it.L.z.x).project(camera), b = _v2.set(cx + .72, y, ZS + it.L.z.x).project(camera);
  const x0 = (a.x + 1) / 2 * 390, y0 = (1 - a.y) / 2 * 844, x1 = (b.x + 1) / 2 * 390, y1 = (1 - b.y) / 2 * 844;
  ringEl.style.transform = `translate(${x0 - 3}px,${y0 - 3}px)`; ringEl.style.width = (x1 - x0 + 6) + 'px'; ringEl.style.height = (y1 - y0 + 6) + 'px';
}
sr.addEventListener('focusin', e => { const it = rowById(e.target.dataset.id); if (!it) return; ring.it = it; reveal(it); ringEl.classList.add('on'); K.wake(900); });
sr.addEventListener('focusout', () => { ring.it = null; ringEl.classList.remove('on'); });
sr.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openRow(rowById(b.dataset.id)); });
sr.addEventListener('keydown', e => {
  const b = e.target.closest('button'); if (!b) return; const it = rowById(b.dataset.id), i = rows.indexOf(it);
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteRow(it); }
  else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const nb = sr.querySelectorAll('button')[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, rows.length - 1)]; nb && nb.focus(); }
  else if (e.key === 'Escape') { e.preventDefault(); exit(); cv.focus(); }
});
btn.addEventListener('click', () => { K.stopAuto(); P === 'off' ? enter() : exit(); });
sortEl.addEventListener('click', e => { const b = e.target.closest('button[data-s]'); if (b) setSort(b.dataset.s); });
// the helix overview from the list: the books fly home first, then the shelf rises into the helix
homeEl.addEventListener('click', e => { if (P === 'off' || !e.target.closest('.sb-ovb')) return; e.stopPropagation(); exit(() => K.setOverview(true)); }, true);

/* ---------- input on the canvas while the stack is up (captured before the shelf's own handlers) ---------- */
let pd = null;
const phoneK = () => screenEl.getBoundingClientRect().width / 390 || 1;
function hitRow(e) {
  const r = cv.getBoundingClientRect(); _n.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); RC.setFromCamera(_n, camera);
  const o = RC.ray.origin, d = RC.ray.direction, t = (ZS - o.z) / d.z, x = o.x + d.x * t, y = o.y + d.y * t;
  if (Math.abs(x) > .78) return null;
  let best = null; rows.forEach(it => { const yb = sc.base + it.L.ry.x; if (y >= yb - .01 && y < yb + RH + .01 && yb + RH > 0) best = it; }); return best;
}
screenEl.addEventListener('pointerdown', e => {
  if (P === 'off' || e.target !== cv) return; e.stopPropagation();
  if (!canAct()) return;
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  const caught = sc.mode !== 'rest' && Math.abs(sc.vel) > .35; sc.vel = caught ? sc.vel : 0; sc.mode = 'drag';
  pd = {id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), t0: performance.now(), base0: sc.base, axis: null, row: caught ? null : hitRow(e), v: 0, vx: 0, caught, armed: false};
  K.wake();
}, true);
screenEl.addEventListener('pointermove', e => {
  if (P === 'off' || (e.target !== cv && !pd)) return; if (!pd || e.pointerId !== pd.id) { if (e.target === cv) e.stopPropagation(); return; }
  e.stopPropagation();
  const k = phoneK(), dx = (e.clientX - pd.x0) / k, dy = (e.clientY - pd.y0) / k, now = performance.now(), dtt = Math.max(1, now - pd.lt) / 1000;
  if (!pd.axis && Math.hypot(dx, dy) > 7) pd.axis = pd.row && dx < 0 && Math.abs(dx) > Math.abs(dy) * 1.15 ? 'swipe' : 'scroll';
  if (pd.axis === 'scroll') {
    const raw = pd.base0 - dy * UPP, L0 = lo(); sc.base = raw < L0 ? L0 - (L0 - raw) * .35 : raw > 0 ? raw * .35 : raw;
    const v = -((e.clientY - pd.ly) / k) * UPP / dtt; pd.v = lerp(pd.v, v, .4); sc.vel = pd.v; K.wake();
  }
  if (pd.axis === 'swipe') {
    const L = pd.row.L, x = (dx < 0 ? dx : dx * .25) * UPP; L.sx.x = L.sx.t = x; L.sx.v = 0;
    pd.vx = lerp(pd.vx, ((e.clientX - pd.lx) / k) * UPP / dtt, .4);
    const p = clamp(-x / SWD, 0, 1.2); K.binAnticipate(p);
    if (p > .5 !== pd.armed) { pd.armed = p > .5; snd('tick', {pitch: pd.armed ? 1.35 : 1.1, gain: .5}); hap('selection'); }
    K.wake();
  }
  pd.lx = e.clientX; pd.ly = e.clientY; pd.lt = now;
}, true);
function up(e) {
  if (!pd || e.pointerId !== pd.id) return; e.stopPropagation(); const d = pd; pd = null;
  if (d.axis === 'scroll') { if (performance.now() - d.lt > 90) d.v = 0; sc.vel = clamp(d.v, -16, 16); sc.mode = 'free'; }
  else if (d.axis === 'swipe') { const L = d.row.L, p = -L.sx.x / SWD;
    if (e.type === 'pointerup' && (p > .5 || (d.vx < -1.4 && p > .14))) { sc.mode = 'free'; deleteRow(d.row); }
    else { L.sx.t = 0; K.binAnticipate(0, true); sc.mode = 'free'; } }
  else { sc.mode = 'free'; if (e.type === 'pointerup' && !d.caught && d.row && performance.now() - d.t0 < 600) openRow(d.row); }
  K.wake(1500);
}
screenEl.addEventListener('pointerup', up, true); screenEl.addEventListener('pointercancel', up, true);
screenEl.addEventListener('wheel', e => {
  if (P === 'off' || e.target !== cv) return; e.preventDefault(); e.stopPropagation(); if (!canAct() || e.ctrlKey) return;
  const d = (e.deltaMode === 1 ? 30 : 1) * e.deltaY; sc.tgt = clamp((sc.mode === 'target' ? sc.tgt : sc.base) + d * UPP, lo() - .3, .3); sc.mode = 'target'; K.wake();
}, {capture: true, passive: false});
screenEl.addEventListener('keydown', e => {
  if (P === 'off' || e.target !== cv) return;
  if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Delete', 'Backspace', 'o', 'O'].indexOf(e.key) >= 0) { e.preventDefault(); e.stopPropagation(); }
  if (!canAct()) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { const b = sr.querySelector('button'); b && b.focus(); }
  else if (e.key === 'Escape' || e.key === 'l' || e.key === 'L') exit();
}, true);
cv.addEventListener('keydown', e => { if (P === 'off' && (e.key === 'l' || e.key === 'L')) enter(); });

K.setList({
  active: () => P !== 'off', step, item: () => false, camera: cameraHook, sync, home, topItem, reset,
  search(q) { if (P === 'off' || P === 'out') return false; query = (q || '').trim().toLowerCase(); applyFilter(); return true; },
  chip(b) { if (P === 'off' || P === 'out') return false; if (P === 'on') { tagF = tagF === b.dataset.tag ? null : b.dataset.tag; syncChips(); applyFilter(); } return true; },
  state: () => ({phase: P, base: +sc.base.toFixed(3), lo: +lo().toFixed(3), vel: +sc.vel.toFixed(3), sort, tag: tagF, n: items.length, books: items.filter(i => i.book && i.book.group.visible).length,
    prox: Object.values(prox).reduce((a, p) => a + p.m.count, 0), labels: nLabels - pool.length, cam: camK, htop: +HTOP.toFixed(3)})
});
SB.list = {enter, exit, toggle: () => (P === 'off' ? enter() : exit()), setSort, get on() { return P !== 'off'; }, get phase() { return P; }};
})();
