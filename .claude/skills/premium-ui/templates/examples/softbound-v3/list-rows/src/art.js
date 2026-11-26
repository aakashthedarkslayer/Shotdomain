/* Softbound v3 — window.SBArt: picture-book covers painted entirely by code.
   1. Composition: a layered scene per tag drawn in Canvas2D with hand-wobbled shapes and brush dabs,
      lit by a tiny light model (albedo × (ambient + key·lit), atmospheric haze by depth, emissive windows/lamps).
   2. Painterly pass (one shared WebGL2 context): domain-warp wobble → anisotropic Kuwahara (brush regions)
      → edge pooling, wet bleed + backruns, pigment granulation, turbulence, paper fibre → per-time grade.
   3. linen()/paper(): seamless tileable textures (JS, periodic noise).                                       */
(function () {
'use strict';
const W = 768, H = 1024, S = W / 300;           // covers are authored in a 300×400 design space
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const mix = (a, b, t) => a + (b - a) * t;
function mb(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const HEX = {};
function lin(h) { if (HEX[h]) return HEX[h]; const n = parseInt(h.slice(1), 16); return (HEX[h] = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.pow(v / 255, 2.2))); }
function css(c, a) { const r = c.map(v => Math.round(255 * Math.pow(clamp(v), 1 / 2.2))); return a == null || a >= 1 ? `rgb(${r})` : `rgba(${r},${Math.max(0, a).toFixed(3)})`; }
function n1(x) { const i = Math.floor(x), f = x - i, h = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; const u = f * f * (3 - 2 * f); return mix(h(i), h(i + 1), u) * 2 - 1; }

/* ---------- time of day: real light, not a tint ---------- */
const TIMES = {
  morning: { id: 'morning', key: [1.05, 1.02, .96], amb: [.5, .58, .72], haze: '#D6E2EE', hz: .7, glow: 0, star: 0,
    sky: ['#86ACD8', '#B7CFE6', '#E4E0E6', '#F8E3CF'], sunC: '#FFF3DA',
    grade: { lift: [.03, .04, .06], gain: [1.0, 1.01, 1.04], sat: 1.02, vig: .22 } },
  golden: { id: 'golden', key: [1.22, .86, .58], amb: [.5, .41, .55], haze: '#F0C0A4', hz: .62, glow: .6, star: 0,
    sky: ['#7774B8', '#B98EBB', '#EDA99A', '#FCCB92'], sunC: '#FFE4B0',
    grade: { lift: [.045, .02, .05], gain: [1.05, .99, .9], sat: 1.12, vig: .28 } },
  night: { id: 'night', key: [.2, .26, .5], amb: [.11, .14, .29], haze: '#26305E', hz: .62, glow: 1, star: 1,
    sky: ['#090E2C', '#141D52', '#25306E', '#3E4886'], sunC: '#EEF0FF',
    grade: { lift: [.02, .03, .07], gain: [.97, .98, 1.05], sat: .92, vig: .34 } },
};

/* ---------- the painter: wobbly shapes, brush dabs, lit colours ---------- */
function painter(ctx, R, T, top, wet) {
  const g = { ctx, R, T, A: 1, W: 0, sx: 150, sy: -50 };
  // wetness control map: regions painted wet-in-wet get soft, bled edges instead of pooled ones
  const wpath = (P, k, stroke, w, dry) => { if (!wet || ctx === top || k <= 0) return; const m = ctx.getTransform(), q = wet.canvas.width / W; wet.setTransform(m.a * q, m.b * q, m.c * q, m.d * q, m.e * q, m.f * q); wet.globalAlpha = k; wet.beginPath(); wet.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) wet.lineTo(P[i][0], P[i][1]); if (dry) { wet.fillStyle = '#000'; wet.fill(); } else if (stroke) { wet.strokeStyle = '#fff'; wet.lineWidth = w; wet.lineCap = 'round'; wet.stroke(); } else { wet.fillStyle = '#fff'; wet.fill(); } wet.globalAlpha = 1; };
  g.wet = (k, fn) => { const o = g.W; g.W = k; try { fn(); } finally { g.W = o; } };
  g.wetRect = (x, y, w, h, k = 1) => wpath(g.rect(x, y, w, h), k);
  // g.top(fn): draw fn on the line layer (survives the Kuwahara pass), with the paint layer's current transform
  g.top = fn => { if (!top) return fn(); const o = ctx; top.setTransform(o.getTransform()); ctx = g.ctx = top; try { fn(); } finally { ctx = g.ctx = o; } };
  const hz = lin(T.haze);
  const sh = (hex, lit = .6, dep = 0) => { const a = lin(hex); return a.map((v, i) => mix(v * (T.amb[i] + T.key[i] * lit), hz[i], clamp(dep * T.hz))); };
  g.rnd = (a, b) => a + (b - a) * R();
  g.c = (hex, lit, dep, a) => css(sh(hex, lit, dep), a);
  g.cj = (hex, lit, dep, j = .08, a) => { const c = sh(hex, lit, dep), f = 1 + (R() - .5) * 2 * j, t = (R() - .5) * j * 1.4; return css([c[0] * f * (1 + t), c[1] * f, c[2] * f * (1 - t)], a); };
  g.raw = (hex, a) => css(lin(hex), a);
  g.e = (on, off, k = 1, lit = .6) => { const a = sh(off, lit, 0), b = lin(on), t = clamp(T.glow * k); return css(a.map((v, i) => mix(v, b[i], t))); };
  g.N = T.id === 'night'; g.G = T.id === 'golden'; g.M = T.id === 'morning';
  g.pick = (m, gd, n) => g.N ? n : g.G ? gd : m;
  // geometry
  g.rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  g.ell = (cx, cy, rx, ry, rot = 0, n = 32) => { const o = [], c = Math.cos(rot), s = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; };
  g.P = (d, seg = 8) => { // tiny absolute SVG path → points (M L C Q Z)
    const t = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/g), o = []; let i = 0, cmd = 'M', cx = 0, cy = 0; const num = () => +t[i++];
    while (i < t.length) {
      if (/[MLCQZ]/.test(t[i])) cmd = t[i++]; if (cmd === 'Z') continue;
      if (cmd === 'M' || cmd === 'L') { cx = num(); cy = num(); o.push([cx, cy]); }
      else if (cmd === 'Q') { const x1 = num(), y1 = num(), x = num(), y = num(); for (let k = 1; k <= seg; k++) { const u = k / seg, v = 1 - u; o.push([v * v * cx + 2 * v * u * x1 + u * u * x, v * v * cy + 2 * v * u * y1 + u * u * y]); } cx = x; cy = y; }
      else if (cmd === 'C') { const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num(); for (let k = 1; k <= seg; k++) { const u = k / seg, v = 1 - u; o.push([v * v * v * cx + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x, v * v * v * cy + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y]); } cx = x; cy = y; }
    }
    return o;
  };
  g.wob = (pts, amp = 1, step = 3, closed = true) => { // hand wobble: resample, push along the normal with smooth noise
    const o = [], n = pts.length, ph = R() * 999; let s = 0;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-6, k = Math.max(1, Math.ceil(L / step)), nx = -dy / L, ny = dx / L;
      for (let j = 0; j < k; j++) { const u = j / k, d = amp * (n1(ph + (s + u * L) * .09) + (R() - .5) * .3); o.push([a[0] + dx * u + nx * d, a[1] + dy * u + ny * d]); }
      s += L;
    }
    if (!closed) o.push(pts[n - 1]);
    return o;
  };
  g.trace = (P, closed = true) => { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); if (closed) ctx.closePath(); };
  g.bbox = P => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of P) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; } return [a, b, c - a, d - b]; };
  g.lg = (x0, y0, x1, y1, st) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  g.rg = (x, y, r, st, r0 = 0) => { const gr = ctx.createRadialGradient(x, y, r0, x, y, r); st.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  // fill a shape; o.dabs = brush texture laid inside the shape (clipped)
  g.fill = (pts, fill, o = {}) => {
    const P = o.wob === 0 ? pts : g.wob(pts, o.wob == null ? .9 : o.wob, o.step || 3);
    g.trace(P); ctx.globalAlpha = (o.a == null ? 1 : o.a) * g.A; ctx.fillStyle = fill; ctx.fill();
    const opaque = g.A >= 1 && (o.a == null || o.a >= .85) && !(typeof fill === 'string' && fill.startsWith('rgba'));
    if (g.W > 0) wpath(P, g.W); else if (opaque) wpath(P, 1, false, 0, true);
    if (top && ctx !== top && opaque) { // z-order: nearer paint hides farther ink
      top.setTransform(ctx.getTransform()); top.globalCompositeOperation = 'destination-out'; top.globalAlpha = 1; top.beginPath(); top.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) top.lineTo(P[i][0], P[i][1]); top.fill(); top.globalCompositeOperation = 'source-over'; }
    if (o.dabs) { ctx.save(); ctx.clip(); g.dabs(Object.assign({ box: g.bbox(P) }, o.dabs)); ctx.restore(); }
    if (o.ink) g.top(() => { for (let k = 0; k < 2; k++) { g.trace(g.wob(P, .3, 3)); ctx.globalAlpha = (o.inkA || .45) * g.A * (k ? .45 : 1); ctx.strokeStyle = o.ink; ctx.lineWidth = (o.inkW || .55) * (k ? 1.6 : 1); ctx.lineJoin = 'round'; ctx.stroke(); } });
    ctx.globalAlpha = 1; return P;
  };
  g.dabs = ({ n = 40, box, cols, len = 6, wid = 2, ang = 0, angJ = .5, a = .3, lenJ = .6, shape }) => {
    const [x, y, w, h] = box; if (n === 'auto') n = Math.min(900, Math.round(w * h / (len * wid * 2.2)));
    for (let i = 0; i < n; i++) {
      const cx = x + R() * w, cy = y + R() * h, L = len * (1 - lenJ / 2 + R() * lenJ);
      ctx.globalAlpha = a * (.55 + R() * .45) * g.A;
      ctx.fillStyle = typeof cols === 'function' ? cols(cx, cy, i) : cols[(R() * cols.length) | 0];
      ctx.beginPath(); ctx.ellipse(cx, cy, L, wid * (.6 + R() * .6), (typeof ang === 'function' ? ang(cx, cy) : ang) + (R() - .5) * angJ, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  // tapered brush line along points
  g.line = (pts, w, col, o = {}) => {
    const P = o.wob === 0 ? pts : g.wob(pts, o.wob == null ? .5 : o.wob, 3, false), n = P.length;
    ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = (o.a == null ? 1 : o.a) * g.A;
    wpath(P, g.W, true, w * 1.2);
    for (let i = 1; i < n; i++) { const t = i / n, ww = w * (o.taper ? mix(1, o.taper, t) : 1); ctx.lineWidth = Math.max(.2, ww); ctx.beginPath(); ctx.moveTo(P[i - 1][0], P[i - 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.stroke(); }
    ctx.globalAlpha = 1;
  };
  g.glow = (x, y, r, hex, a = 1, op = 'screen') => {
    if (a <= 0.003) return; const c = lin(hex); ctx.save(); ctx.globalCompositeOperation = op;
    ctx.fillStyle = g.rg(x, y, r, [[0, css(c, a)], [.25, css(c, a * .55)], [.6, css(c, a * .16)], [1, css(c, 0)]]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
  };
  g.skyAt = (st, t) => { const k = clamp(t) * (st.length - 1), i = Math.min(st.length - 2, Math.floor(k)), f = k - i, a = lin(st[i]), b = lin(st[i + 1]); return a.map((v, j) => mix(v, b[j], f)); };
  g.sky = (y0, y1, st) => { st = st || T.sky;
    ctx.fillStyle = g.lg(0, y0, 0, y1, st.map((s, i) => [i / (st.length - 1), g.raw(s)])); ctx.fillRect(-5, y0 - 5, 310, y1 - y0 + 5);
    for (let i = 0; i < 110; i++) { // broad wet wash strokes
      const y = y0 + R() * (y1 - y0), c = g.skyAt(st, (y - y0) / (y1 - y0) + (R() - .5) * .08), f = 1 + (R() - .5) * .1;
      ctx.globalAlpha = .22 * g.A; ctx.fillStyle = css([c[0] * f, c[1] * f, c[2] * f * (1 + (R() - .5) * .08)]);
      ctx.beginPath(); ctx.ellipse(R() * 320 - 10, y, 20 + R() * 60, 2 + R() * 5, (R() - .5) * .08, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  g.sun = (x, y, r) => {
    g.sx = x; g.sy = y;
    if (g.N) {
      g.glow(x, y, r * 9, '#6E7FC4', .35); g.glow(x, y, r * 3.2, '#B9C6F2', .35);
      g.fill(g.ell(x, y, r, r), g.raw('#F6F2E2'), { wob: .25, dabs: { n: 18, cols: [g.raw('#D9D6CC'), g.raw('#E8E4D6')], len: r * .35, wid: r * .22, a: .5 } });
    } else {
      g.glow(x, y, r * 11, T.sunC, g.G ? .55 : .42); g.glow(x, y, r * 3.4, T.sunC, .6);
      g.fill(g.ell(x, y, r, r), g.raw(g.G ? '#FFF1D2' : '#FFFBF0'), { wob: .3 });
    }
  };
  g.stars = (n, box, k = 1) => { g.top(() => stars(n, box, k)); };
  const stars = (n, [x, y, w, h], k = 1) => {
    const s = T.star * k; if (s <= 0) return;
    for (let i = 0; i < n; i++) {
      const px = x + R() * w, py = y + R() * h * (R() < .6 ? R() : 1), r = .25 + R() * R() * 1.1, a = s * (.45 + R() * .55);
      ctx.globalAlpha = a; ctx.fillStyle = g.raw(R() < .3 ? '#FFE9C4' : '#EEF2FF'); ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
      if (r > .95) { g.glow(px, py, r * 7, '#C8D4FF', .25 * a); ctx.globalAlpha = a * .7; ctx.fillRect(px - r * 3.5, py - .15, r * 7, .3); ctx.fillRect(px - .15, py - r * 3.5, .3, r * 7); }
    }
    ctx.globalAlpha = 1;
  };
  g.mdp = (a, b, rough, lv = 5) => { if (!lv) return [b]; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (R() - .5) * Math.abs(b[0] - a[0]) * rough]; return g.mdp(a, m, rough, lv - 1).concat(g.mdp(m, b, rough, lv - 1)); };
  g.ridge = (keys, rough, base = 410) => { let p = [keys[0]]; for (let i = 1; i < keys.length; i++) p = p.concat(g.mdp(keys[i - 1], keys[i], rough, 4)); p.push([keys[keys.length - 1][0], base], [keys[0][0], base]); return p; };
  // a painted landmass: vertical value gradient + diagonal brush dabs
  g.mount = (pts, hex, dep, lit = .55, o = {}) => {
    const [, top, , hh] = g.bbox(pts), bot = Math.min(top + hh, top + (o.fade || 70));
    const P = g.fill(pts, g.lg(0, top, 0, bot, [[0, g.c(hex, lit + .12, dep)], [1, g.c(hex, lit - .12, dep + (o.mist || .18))]]), { wob: o.wob == null ? .6 : o.wob });
    ctx.save(); g.trace(P); ctx.clip();
    const lx = g.sx < 150 ? -1 : 1;
    g.dabs({ n: o.n || 160, box: g.bbox(P), cols: () => g.cj(hex, lit + (R() - .5) * .45, dep + R() * .12, .05), len: o.len || 9, wid: 1.8, ang: (x) => (lx * .55) * (R() < .5 ? 1 : -1), angJ: .5, a: o.da || .28 });
    ctx.restore(); return P;
  };
  g.mist = (y, h, a, hex = T.haze) => {
    g.wetRect(-5, y - h, 310, 2 * h, .8);
    const c = lin(hex); ctx.fillStyle = g.lg(0, y - h, 0, y + h, [[0, css(c, 0)], [.5, css(c, a)], [1, css(c, 0)]]); ctx.fillRect(-5, y - h, 310, 2 * h);
    for (let i = 0; i < 26; i++) { ctx.globalAlpha = a * .35; ctx.fillStyle = css(c); ctx.beginPath(); ctx.ellipse(R() * 310, y + (R() - .5) * h, 20 + R() * 50, 1.5 + R() * 3, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // painted foliage: shade → mid → light dabs, light comes from (lx,ly)
  // painted foliage: a few sub-clumps, each laid shade → mid → light with leaf-sized dabs; light comes from the sun
  g.foliage = (cx, cy, rx, ry, hex, o = {}) => {
    const s = o.s || 3.2, dep = o.dep || 0, lo = o.lo == null ? .16 : o.lo, hi = o.hi == null ? 1.05 : o.hi, k = o.k || Math.max(2, Math.round(rx / 7));
    let lx = g.sx - cx, ly = g.sy - cy; const l = Math.hypot(lx, ly) || 1; lx /= l; ly /= l;
    const subs = []; for (let i = 0; i < k; i++) { const a = R() * TAU, r = Math.sqrt(R()) * .55; subs.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, rx * (.4 + R() * .3), ry * (.45 + R() * .3)]); }
    subs.sort((a, b) => a[1] - b[1]);
    const col = () => o.hexes ? o.hexes[(R() * o.hexes.length) | 0] : hex;
    for (const [x0, y0, ax, ay] of subs) {
      const n = o.n ? o.n / k : Math.max(8, ax * ay / (s * s * .35));
      const passes = [[lo, 1.1, .3, 1], [(lo + hi) / 2, .7, -.05, .9], [hi, .4, -.45, .9]];
      for (const [lit, frac, off, al] of passes) for (let i = 0; i < n * frac; i++) {
        const a = R() * TAU, r = Math.sqrt(R()), dx = Math.cos(a) * r, dy = Math.sin(a) * r;
        if (off < 0 && dx * lx + dy * ly < -.1) continue;
        const x = x0 + dx * ax - off * lx * ax * .45, y = y0 + dy * ay - off * ly * ay * .45, sz = s * (.55 + R() * .8);
        ctx.globalAlpha = al * g.A; ctx.fillStyle = g.cj(col(), lit + (R() - .5) * .15, dep, .12);
        ctx.beginPath(); ctx.ellipse(x, y, sz, sz * (.5 + R() * .4), R() * TAU, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };
  g.tree = (x, b, h, hex, o = {}) => { g.line([[x, b], [x + (R() - .5) * 3, b - h * .5]], Math.max(1, h * .07), g.c('#5A4040', .4, o.dep || 0), { taper: .5 }); g.foliage(x, b - h * .62, h * .36, h * .4, hex, o); };
  // cumulus: many overlapping glazes in a dome envelope, shade first, then sun-lit glazes and a few bright dabs
  g.cloud = (x, y, w, h, o = {}) => g.wet(.9, () => cloud(x, y, w, h, o));
  const cloud = (x, y, w, h, o = {}) => {
    const dep = o.dep == null ? .3 : o.dep, k = (o.k || 7) * 3, lx = g.sx > x ? 1 : -1, below = g.sy > y, shade = o.hex || '#C9C6DE', puffs = [];
    for (let i = 0; i < k; i++) { const t = R(), r = h * (.18 + R() * .3) * (1 - Math.abs(t - .5) * .8); puffs.push([x + (t - .5) * w * .9, y - r * .6 - Math.sin(t * Math.PI) * h * .5 * R(), r]); }
    for (const [px, py, r] of puffs) g.fill(g.ell(px, py + r * .15, r * 1.25, r * 1.05), g.c(shade, .3, dep), { wob: 1.2, a: .55 });
    g.fill(g.ell(x, y - h * .1, w * .5, h * .14), g.c(shade, .28, dep), { wob: 1.2, a: .7 });
    for (const [px, py, r] of puffs) if (R() < .75) g.fill(g.ell(px + lx * r * .25, py - r * (below ? -.1 : .3), r * .8, r * .66), g.c('#FFFFFF', o.lit || .95, dep), { wob: 1.1, a: .5 });
    for (const [px, py, r] of puffs) if (R() < .4) g.fill(g.ell(px + lx * r * .4, py - r * .45, r * .4, r * .3), g.c('#FFFFFF', 1.2, dep * .6), { wob: .8, a: .6 });
    if (below || g.G) g.line([[x - w * .4, y - h * .08], [x + w * .4, y - h * .08]], h * .1, g.c('#FFE0C0', 1.1, dep), { wob: .8, a: g.G ? .7 : .3, taper: .5 });
  };
  // stratus: long soft glazes, lit along the edge that faces the sun
  g.stratus = (x, y, w, h, o = {}) => g.wet(1, () => stratus(x, y, w, h, o));
  const stratus = (x, y, w, h, o = {}) => {
    const dep = o.dep == null ? .35 : o.dep, sdy = g.sy > y ? 1 : -1;
    for (let i = 0; i < (o.k || 6) * 2; i++) { const px = x + (R() - .5) * w * .8, py = y + (R() - .5) * h * 1.6, pw = w * (.15 + R() * .3), ph = h * (.3 + R() * .5);
      g.fill(g.ell(px, py, pw, ph), g.c(o.hex || '#B9B4D6', .35, dep, .75), { wob: 1, a: .45 });
      if (R() < .7) g.fill(g.ell(px + (R() - .5) * pw * .3, py + sdy * ph * .4, pw * .75, ph * .4), g.c('#FFF6EC', 1.1, dep * .8), { wob: .9, a: .55 }); }
  };
  g.shadow = (pts, a = .25, hex = '#3A2A4A') => g.fill(pts, g.raw(hex, a * (g.N ? .6 : 1)), { wob: .8 });
  return g;
}

/* ---------- reusable picture-book props ---------- */
function pagoda(g, x, b, s, dep) {
  const ctx = g.ctx, lit = g.sx < x ? [.95, .35] : [.35, .75], rim = g.G || g.N;
  g.fill(g.rect(x - 24 * s, b - 6 * s, 48 * s, 7 * s), g.c('#A59CA8', .5, dep), { wob: .4 });
  let y = b - 6 * s;
  for (let i = 0; i < 5; i++) {
    const w = (34 - i * 4.6) * s, bh = (i ? 9 : 12) * s;
    g.fill(g.rect(x - w / 2, y - bh, w, bh), g.lg(x - w / 2, 0, x + w / 2, 0, [[0, g.c('#C25A45', lit[0], dep)], [.5, g.c('#B04C3E', (lit[0] + lit[1]) / 2, dep)], [1, g.c('#9A3E36', lit[1], dep)]]), { wob: .35 });
    for (let k = -1; k <= 1; k += 2) g.fill(g.rect(x + k * w * .28 - w * .07, y - bh + 2.5 * s, w * .14, bh - 4 * s), g.e('#FFD08A', '#E9DCC4', 1, lit[k < 0 ? 0 : 1]), { wob: .2 });
    g.fill(g.rect(x - w * .08, y - bh + 2 * s, w * .16, bh - 2.4 * s), g.e('#FFC070', '#4A3040', .9, .4), { wob: .2 });
    y -= bh;
    const rw = w / 2 + 9 * s, rh = 6.5 * s;
    const roof = g.P(`M${x - rw - 4 * s},${y + 1.4 * s} Q${x - rw * .55},${y - .5 * s} ${x - rw * .42},${y - rh} L${x + rw * .42},${y - rh} Q${x + rw * .55},${y - .5 * s} ${x + rw + 4 * s},${y + 1.4 * s} Q${x},${y - 1.2 * s} ${x - rw - 4 * s},${y + 1.4 * s}Z`, 6);
    g.fill(roof, g.lg(x - rw, 0, x + rw, 0, [[0, g.c('#4A4466', lit[0] * .8, dep)], [1, g.c('#3A3454', lit[1] * .8, dep)]]), { wob: .35 });
    if (rim) g.line([[x - rw - 3 * s, y + 1 * s], [x, y - .8 * s], [x + rw + 3 * s, y + 1 * s]], .9 * s, g.N ? g.raw('#8F9BD0', .5) : g.raw('#FFD3A0', .85), { wob: .2 });
    y -= rh - .5 * s;
  }
  g.line([[x, y], [x, y - 26 * s]], 1.6 * s, g.c('#6B5A3A', .7, dep), { wob: 0 });
  for (let k = 0; k < 6; k++) g.fill(g.ell(x, y - 6 * s - k * 3.1 * s, 3 * s, .8 * s), g.c('#8A7448', .7, dep), { wob: 0 });
}
function torii(g, x, b, h, s, dep = 0) {
  const red = '#D6503E', lit = g.sx < x ? [.95, .4] : [.45, .8];
  for (const k of [-1, 1]) g.fill(g.P(`M${x + k * 15 * s - 2.4 * s},${b} L${x + k * 14 * s - 1.8 * s},${b - h} L${x + k * 14 * s + 1.8 * s},${b - h} L${x + k * 15 * s + 2.4 * s},${b}Z`), g.lg(x + k * 15 * s - 3 * s, 0, x + k * 15 * s + 3 * s, 0, [[0, g.c(red, lit[0], dep)], [1, g.c(red, lit[1] * .7, dep)]]), { wob: .3 });
  for (const k of [-1, 1]) g.fill(g.rect(x + k * 15 * s - 3.4 * s, b - 4 * s, 6.8 * s, 4 * s), g.c('#2D2A3A', .5, dep), { wob: .2 });
  g.fill(g.rect(x - 20 * s, b - h + 8 * s, 40 * s, 3 * s), g.c(red, .6, dep), { wob: .25 });
  g.fill(g.rect(x - 1.5 * s, b - h + 2 * s, 3 * s, 6 * s), g.c(red, .5, dep), { wob: .15 });
  g.fill(g.P(`M${x - 25 * s},${b - h + 1 * s} Q${x},${b - h + 3.2 * s} ${x + 25 * s},${b - h + 1 * s} L${x + 22 * s},${b - h - 2 * s} Q${x},${b - h} ${x - 22 * s},${b - h - 2 * s}Z`, 8), g.c(red, .75, dep), { wob: .25 });
  g.fill(g.P(`M${x - 30 * s},${b - h - 3 * s} Q${x},${b - h + 1 * s} ${x + 30 * s},${b - h - 3 * s} L${x + 28 * s},${b - h - 6.5 * s} Q${x},${b - h - 3 * s} ${x - 28 * s},${b - h - 6.5 * s}Z`, 8), g.c('#2C2638', .55, dep), { wob: .25 });
}
function lantern(g, x, b, s, dep = 0) { // stone tōrō
  const st = '#9A96A0';
  g.fill(g.rect(x - 7 * s, b - 4 * s, 14 * s, 4 * s), g.c(st, .5, dep));
  g.fill(g.rect(x - 2.5 * s, b - 18 * s, 5 * s, 14 * s), g.c(st, .55, dep));
  g.fill(g.rect(x - 6 * s, b - 21 * s, 12 * s, 3 * s), g.c(st, .55, dep));
  g.fill(g.rect(x - 5 * s, b - 30 * s, 10 * s, 9 * s), g.c(st, .5, dep));
  g.fill(g.rect(x - 3 * s, b - 28.5 * s, 6 * s, 6 * s), g.e('#FFC877', '#3A3444', 1, .3), { wob: .2 });
  g.fill(g.P(`M${x - 11 * s},${b - 29 * s} Q${x},${b - 33 * s} ${x + 11 * s},${b - 29 * s} L${x + 2 * s},${b - 38 * s} L${x - 2 * s},${b - 38 * s}Z`), g.c(st, .6, dep));
  g.fill(g.ell(x, b - 39 * s, 2 * s, 2 * s), g.c(st, .6, dep));
  g.glow(x, b - 25 * s, 30 * s, '#FFB25A', .55 * g.T.glow);
}
function petals(g, n, box, hex = '#F7B7C9') {
  const R = g.R; for (let i = 0; i < n; i++) { const x = box[0] + R() * box[2], y = box[1] + R() * box[3]; g.ctx.globalAlpha = .55 + R() * .45; g.ctx.fillStyle = g.cj(hex, .85, 0, .1); g.ctx.beginPath(); g.ctx.ellipse(x, y, 1.6 + R(), .9 + R() * .5, R() * 3, 0, TAU); g.ctx.fill(); }
  g.ctx.globalAlpha = 1;
}
function birds(g, list, col) { g.top(() => { for (const [x, y, s] of list) g.line(g.P(`M${x - 4 * s},${y - 1.5 * s} Q${x - 2 * s},${y - 3 * s} ${x},${y} Q${x + 2 * s},${y - 3 * s} ${x + 4 * s},${y - 1.8 * s}`, 4), .8 * s, col, { wob: .1, taper: .4 }); }); }
function leafShape(g, cx, cy, L, rot, slits = 0) { // monstera-ish: heart outline with edge notches
  const o = [], c = Math.cos(rot), s = Math.sin(rot), R = g.R, cuts = [];
  for (let k = 0; k < slits; k++) cuts.push(mix(.12, .44, k / Math.max(1, slits - 1)) * TAU + (R() - .5) * .08, TAU - mix(.12, .44, k / Math.max(1, slits - 1)) * TAU + (R() - .5) * .08);
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * TAU; // a=0 → tip (up)
    let r = L * (.62 + .38 * Math.cos(a)) * (1 - .25 * Math.pow(Math.abs(Math.sin(a)), 3));
    if (Math.abs(a - Math.PI) < .35) r *= mix(.55, 1, Math.abs(a - Math.PI) / .35);
    for (const q of cuts) { const d = Math.abs(a - q); if (d < .07) r *= mix(.3, 1, d / .07); }
    const x = Math.sin(a) * r * .78, y = -Math.cos(a) * r;
    o.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return o;
}

/* ---------- the six scenes ---------- */
const yAt = (P, x) => { for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; if ((a[0] <= x && b[0] >= x) || (a[0] >= x && b[0] <= x)) return a[1] + (b[1] - a[1]) * ((x - a[0]) / ((b[0] - a[0]) || 1)); } return P[0][1]; };
function grass(g, x0, x1, yf, n, hex, o = {}) { // tufts with sun-lit tips
  const { R } = g;
  for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = yf(x) + R() * (o.drop || 4), h = (o.h || 10) * (.5 + R()), lean = (R() - .5) * h * .6;
    g.line(g.P(`M${x},${y} Q${x + lean * .3},${y - h * .6} ${x + lean},${y - h}`, 5), (o.w || 1.1) * (.7 + R() * .6), g.cj(hex, .25 + R() * .3, o.dep || 0, .1), { wob: .2, taper: .2 });
    if (R() < .5) g.line([[x + lean * .7, y - h * .8], [x + lean, y - h]], .8, g.c(hex, 1.1, o.dep || 0), { wob: 0, a: .8 }); }
}
function hall(g, x, b, w, dep) { // low temple hall with a sweeping roof
  g.fill(g.rect(x - w / 2, b - w * .28, w, w * .28), g.c('#E6D8C0', .6, dep), { wob: .3 });
  for (let k = -1; k <= 1; k++) g.fill(g.rect(x + k * w * .26 - w * .07, b - w * .22, w * .14, w * .16), g.e('#FFC877', '#8A4A3A', 1, .5), { wob: .2 });
  g.fill(g.P(`M${x - w * .7},${b - w * .26} Q${x - w * .4},${b - w * .3} ${x - w * .32},${b - w * .52} L${x + w * .32},${b - w * .52} Q${x + w * .4},${b - w * .3} ${x + w * .7},${b - w * .26}Z`, 6), g.c('#4A4466', .5, dep), { wob: .3 });
}
const SCENES = {
Travel(g) {
  const { ctx, R } = g, HZ = 252, ink = g.c('#2A1E3A', .5);
  g.sky(0, HZ + 2, g.pick(['#8FB3DD', '#BED3EA', '#EDDCE0', '#FBE1CB'], null, null));
  if (g.M) g.sun(84, 180, 14); else if (g.G) g.sun(172, 176, 24); else g.sun(232, 66, 11);
  g.stars(110, [0, 0, 300, 200]);
  g.stratus(70, 110, 120, 9, { dep: .4 }); g.stratus(236, 76, 110, 7, { dep: .45 }); g.stratus(140, 154, 140, 5, { dep: .6 });
  birds(g, [[108, 132, 1], [120, 124, .8], [96, 140, .7]], g.c('#4A4466', .4, .3));
  const far = g.ridge([[-10, 204], [30, 182], [80, 196], [124, 156], [164, 186], [214, 172], [260, 190], [310, 176]], .22, HZ + 4);
  g.mount(far, '#9290C4', .78, .6, { mist: .25 });
  g.mist(HZ - 38, 16, .65);
  const mid = g.ridge([[-10, 232], [22, 214], [70, 224], [112, 208], [150, 228], [196, 222], [240, 232], [310, 224]], .16, HZ + 4);
  g.mount(mid, '#6E6EA6', .5, .5);
  for (let x = -6; x < 306; x += 7 + R() * 9) { const y = yAt(mid, x) + 3; if (R() < .35) g.fill(g.wob(g.P(`M${x},${y - 12 - R() * 8} L${x + 4},${y + 3} L${x - 4},${y + 3}Z`), .6), g.c('#5A5A92', .4, .48), { wob: 0 }); else g.foliage(x, y - 2, 5 + R() * 4, 4 + R() * 2, '#5E6496', { dep: .5, s: 2, k: 2 }); }
  g.mist(HZ - 8, 9, .55);
  const land = () => {
    const hill = g.ridge([[132, HZ + 1], [156, 238], [200, 228], [246, 230], [310, 238]], .1, HZ + 1);
    g.mount(hill, '#55608A', .4, .35, { n: 80 });
    hall(g, 166, 242, 26, .25);
    g.foliage(146, 244, 14, 6, '#4B6A6A', { dep: .25, s: 2.4 });
    pagoda(g, 214, 232, 1.14, .18);
    g.foliage(250, 230, 18, 10, '#E8A6BE', { dep: .15, s: 2.6, hexes: ['#E8A6BE', '#F2BCCD', '#D98AA8'] });
    g.foliage(186, 238, 12, 7, '#E8A6BE', { dep: .2, s: 2.4, hexes: ['#E8A6BE', '#F2BCCD'] });
    g.foliage(286, 236, 22, 10, '#4A6A64', { dep: .2, s: 3 });
  };
  land();
  // the lake mirrors everything above it, in rippled strips
  const cv = ctx.canvas;
  for (let y = 0; y < 100; y += 2) {
    const sy = HZ - y - 2, dx = Math.sin(y * .9 + R()) * (.4 + y * .035);
    ctx.save(); ctx.setTransform(1, 0, 0, -1, dx * S, 2 * HZ * S); ctx.drawImage(cv, 0, sy * S, W, 2 * S + 1, 0, sy * S, W, 2 * S + 1); ctx.restore();
  }
  const wc = g.skyAt(g.T.sky, .3);
  ctx.fillStyle = g.lg(0, HZ, 0, 352, [[0, css(wc, .1)], [.4, css(wc, .3)], [1, css(wc.map(v => v * .5), .8)]]); ctx.fillRect(-5, HZ, 310, 100);
  for (let i = 0; i < 160; i++) { const y = HZ + 2 + R() * 98, k = (y - HZ) / 100; ctx.globalAlpha = .35 + k * .3; ctx.fillStyle = R() < .5 ? g.raw(g.T.sky[3]) : css(wc.map(v => v * .6)); ctx.fillRect(R() * 310 - 5, y, 4 + R() * 24 * (.4 + k), .5 + k * .9); }
  for (let i = 0; i < 80; i++) { const y = HZ + 2 + R() * R() * 90, w = 1.5 + R() * 9 * (1 - (y - HZ) / 120); ctx.globalAlpha = .85; ctx.fillStyle = g.raw(g.N ? '#F2EEDC' : '#FFF4DC'); ctx.fillRect(g.sx + (R() - .5) * (6 + (y - HZ) * .4) - w / 2, y, w, .8); }
  ctx.globalAlpha = 1;
  g.line([[-5, HZ + .5], [305, HZ + .5]], .8, g.raw(g.T.sky[3], .7), { wob: .2 });
  // torii standing in the water, with its broken reflection
  ctx.save(); ctx.beginPath(); ctx.rect(-5, 306, 310, 60); ctx.clip(); ctx.translate(0, 612); ctx.scale(1, -1); g.A = .4; torii(g, 72, 306, 66, 1.2, .1); g.A = 1; ctx.restore();
  for (let i = 0; i < 40; i++) { ctx.fillStyle = css(wc.map(v => v * .75)); ctx.globalAlpha = .7; ctx.fillRect(30 + R() * 90, 308 + R() * 50, 6 + R() * 14, .8); } ctx.globalAlpha = 1;
  torii(g, 72, 306, 66, 1.2, .08);
  // near bank: grasses with lit tips, rocks, a stone lantern
  const bank = g.ridge([[-10, 350], [60, 344], [120, 352], [190, 348], [250, 338], [310, 344]], .08, 410);
  g.fill(bank, g.lg(0, 338, 0, 400, [[0, g.c('#56664E', .6)], [1, g.c('#2C3048', .3)]]), { dabs: { n: 320, cols: () => g.cj(R() < .5 ? '#5C7A56' : '#3E4A5E', .25 + R() * .5, 0, .1), len: 5, wid: 1.2, ang: Math.PI / 2, angJ: .6, a: .5 } });
  for (const [x, y, r] of [[150, 360, 9], [168, 364, 6], [214, 352, 7]]) g.fill(g.ell(x, y, r * 1.3, r * .8), g.lg(0, y - r, 0, y + r, [[0, g.c('#9A9AA8', 1)], [1, g.c('#4A4A5E', .3)]]), { wob: .8, ink, inkA: .3 });
  grass(g, -5, 305, x => yAt(bank, x) + 4, 120, '#5E8A52', { h: 12 });
  for (let i = 0; i < 18; i++) { const x = 4 + R() * 120, h = 22 + R() * 34, b = -2 - R() * 6; g.line(g.P(`M${x},404 Q${x + b * .4},${360 - h * .3} ${x + b},${354 - h}`, 6), 1.1 + R() * .8, g.c('#3B5A48', .3 + R() * .3), { wob: .3, taper: .3 }); if (R() < .4) g.fill(g.ell(x + b, 356 - h, 1.6, 4.5, .1), g.c('#6A4A3A', .5), { wob: 0 }); }
  lantern(g, 252, 346, 1.25, .02);
  // cherry branch overhanging from the top-left: the frame
  const br = g.c('#3A2434', .45), brs = [
    [[[-10, 20], [30, 30], [70, 46], [110, 54], [150, 70], [172, 74]], 7.5], [[[60, 42], [78, 24], [100, 14]], 3.4], [[[110, 54], [126, 72], [138, 94]], 3], [[[-10, 62], [18, 68], [44, 84]], 3.4],
    [[[312, 10], [284, 22], [258, 42], [246, 50]], 6], [[[284, 22], [270, 6]], 2.4]];
  for (const [p, w] of brs) g.line(p, w, br, { wob: .9, taper: .3 });
  const clumps = [[6, 26, 20], [40, 40, 22], [78, 50, 24], [104, 30, 16], [128, 64, 18], [158, 74, 14], [138, 94, 11], [34, 78, 14], [300, 16, 20], [268, 34, 20], [248, 52, 12]];
  for (const [x, y, r] of clumps) g.foliage(x, y, r * 1.15, r * .8, '#EFAFC6', { s: 3.4, lo: .3, hi: 1.15, hexes: ['#F3B8CD', '#E596B3', '#FBD3E0', '#F7C6D6'] });
  for (const [p, w] of brs.slice(0, 2)) g.line(p.slice(1, 3), w * .6, br, { wob: .9, a: .8 });
  for (const [x, y, r] of clumps) petals(g, r * .9, [x - r, y - r * .7, 2 * r, 1.4 * r], '#FFEFF4');
  petals(g, 30, [0, 96, 300, 250]);
},

Recipes(g) {
  const { ctx, R } = g, wall = '#EED6BA', ink = g.c('#3A2418', .45);
  g.sx = g.pick(300, 330, 86); g.sy = g.pick(20, 110, 40);
  g.fill(g.rect(-5, -5, 310, 270), g.lg(0, 0, 0, 260, [[0, g.c(wall, .42)], [1, g.c(wall, .62)]]), { wob: 0, dabs: { n: 650, cols: () => g.cj(wall, .35 + R() * .35, 0, .06), len: 9, wid: 3.5, ang: 0, angJ: 3, a: .25 } });
  const wx = 168, wy = 24, ww = 116, wh = 136;
  ctx.save(); g.trace(g.rect(wx, wy, ww, wh)); ctx.clip();
  g.sky(wy, wy + wh, g.pick(['#9DC0E2', '#CDE0EE', '#F6E8DA'], ['#9C84C0', '#EFA69A', '#FFD69C'], ['#0D143A', '#1F2B66', '#34407E']));
  if (g.G) { g.glow(246, 128, 110, '#FFD08A', .75); g.fill(g.ell(246, 128, 14, 14), g.raw('#FFF3D8')); }
  if (g.N) { g.stars(30, [wx, wy, ww, 80]); g.fill(g.ell(256, 50, 7, 7), g.raw('#F3EBD2')); g.glow(256, 50, 40, '#8FA0E0', .3); }
  if (g.M) g.cloud(222, 74, 70, 16, { k: 5, dep: .3 });
  for (let x = wx - 6, i = 0; x < wx + ww; i++) { const w = 18 + R() * 12, h = 18 + R() * 20, b = 162, roof = R() < .6; const hx = ['#D9A08A', '#C9B0A0', '#E2C29A', '#B98C8C'][i % 4];
    g.fill(g.rect(x, b - h, w, h + 4), g.lg(x, 0, x + w, 0, [[0, g.c(hx, .8, .35)], [1, g.c(hx, .45, .35)]]), { wob: .3 });
    if (roof) g.fill(g.P(`M${x - 2},${b - h} L${x + w / 2},${b - h - 9} L${x + w + 2},${b - h}Z`), g.c('#8A5A5A', .6, .35), { wob: .3 });
    for (let k = 0; k < 2; k++) g.fill(g.rect(x + 4 + k * (w - 12), b - h + 6, 4, 6), g.e('#FFCF86', '#A8BCD0', 1, .6), { wob: .2 });
    x += w + 2; }
  g.tree(190, 162, 46, '#6E9A6E', { dep: .3, s: 3.4 });
  ctx.restore();
  const fr = g.c('#F6EEE2', .75);
  for (const r of [g.rect(wx - 6, wy - 6, ww + 12, 7), g.rect(wx - 6, wy - 6, 7, wh + 10), g.rect(wx + ww - 1, wy - 6, 7, wh + 10), g.rect(wx + ww / 2 - 2.5, wy, 5, wh), g.rect(wx, wy + wh * .46, ww, 4.5)]) g.fill(r, fr, { wob: .3, ink, inkA: .2 });
  g.fill(g.rect(wx - 12, wy + wh, ww + 24, 8), g.c('#F3E8D8', .8), { wob: .4, ink, inkA: .25 });
  g.fill(g.P(`M196,${wy + wh} L193,${wy + wh - 16} L213,${wy + wh - 16} L210,${wy + wh}Z`), g.c('#C46A4A', .6), { ink });
  g.foliage(203, wy + wh - 26, 13, 11, '#5E9A58', { s: 2.6 });
  g.fill(g.P(`M262,${wy + wh} L262,${wy + wh - 18} Q262,${wy + wh - 24} 266,${wy + wh - 26} L266,${wy + wh - 32} L270,${wy + wh - 32} L270,${wy + wh - 26} Q274,${wy + wh - 24} 274,${wy + wh - 18} L274,${wy + wh}Z`), g.c('#7FB0A0', .7, 0), { ink, a: .85 });
  if (!g.N) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const k = g.G ? 1 : .45, lc = g.G ? '#FFC98A' : '#FFFFFF';
    ctx.fillStyle = g.lg(wx, wy + wh, wx - 90 * k, 330, [[0, g.raw(lc, g.G ? .45 : .3)], [1, g.raw(lc, .05)]]);
    g.trace(g.wob([[wx - 4, wy + wh + 8], [wx + ww + 4, wy + wh + 8], [wx + ww - 70 * k, 340], [wx - 100 * k, 340]], 1.5)); ctx.fill(); ctx.restore(); }
  g.fill(g.rect(14, 92, 136, 7), g.c('#A86E46', .7), { wob: .4, ink }); g.fill(g.rect(16, 99, 132, 4), g.raw('#5A3624', .25), { wob: .4 });
  const jar = (x, w, h, hex, lid) => { g.fill(g.rect(x, 92 - h, w, h), g.c('#F7EFE4', .7, 0, .5), { wob: .5, ink, inkA: .3 }); g.fill(g.rect(x + 2, 92 - h * .74, w - 4, h * .72), g.c(hex, .65), { wob: .4, dabs: { n: 40, cols: () => g.cj(hex, .4 + R() * .5, 0, .2), len: 1.4, wid: 1.1, a: .8 } }); g.fill(g.rect(x - 1.5, 92 - h - 5, w + 3, 6), g.c(lid, .6), { wob: .3, ink }); g.line([[x + 4, 92 - h * .75], [x + 4, 89]], 1.6, g.raw('#FFFFFF', .55), { wob: .2 }); };
  jar(22, 26, 30, '#E6A23A', '#7A4A2E'); jar(54, 22, 40, '#F2E3BC', '#3F6E6A'); jar(82, 26, 26, '#B84A32', '#C2853F'); jar(114, 24, 34, '#8FA35A', '#7A4A2E');
  for (const [x, l] of [[34, 34], [50, 46], [66, 28]]) { g.line([[x, 104], [x, 106 + l]], 1.6, g.c('#7C5A3C', .6), { wob: .2 }); g.fill(g.ell(x, 110 + l, 5, 7), g.c(x === 50 ? '#C98A52' : '#9FA2AE', .75), { wob: .3, ink, inkA: .3 }); }
  const ty = 186; g.fill(g.rect(-5, ty, 310, 76), g.c('#F4EEE6', .62), { wob: 0 });
  for (let y = ty, r = 0; y < 262; y += 15, r++) for (let x = -5 + (r % 2) * 7; x < 305; x += 15) { g.fill(g.rect(x + .7, y + .7, 13.6, 13.6), g.c(R() < .5 ? '#F7F1E8' : '#ECE4D8', .6), { wob: .35 }); const c = g.cj('#4F79B0', .6, 0, .12); ctx.globalAlpha = .6; ctx.strokeStyle = c; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(x + 7.5, y + 7.5, 3.2, 0, TAU); ctx.moveTo(x + 7.5, y + 1.8); ctx.lineTo(x + 7.5, y + 13.2); ctx.moveTo(x + 1.8, y + 7.5); ctx.lineTo(x + 13.2, y + 7.5); ctx.stroke(); ctx.globalAlpha = 1; }
  g.line([[86, -5], [86, 40]], 1, g.c('#3B302A', .5), { wob: .1 });
  g.fill(g.P('M68,58 Q70,40 86,38 Q102,40 104,58Z'), g.lg(68, 0, 104, 0, [[0, g.c('#2F6E66', .9)], [1, g.c('#2F5D58', .35)]]), { wob: .3, ink });
  g.fill(g.ell(86, 58, 17, 3.2), g.e('#FFE6B0', '#2A4A46', 1), { wob: .2 });
  if (g.T.glow > 0) { g.glow(86, 64, 150, '#FFB866', .45 * g.T.glow); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g.lg(0, 58, 0, 300, [[0, g.raw('#FFD69A', .4 * g.T.glow)], [1, g.raw('#FFD69A', 0)]]); g.trace([[70, 58], [102, 58], [196, 300], [-20, 300]]); ctx.fill(); ctx.restore(); }
  g.fill(g.rect(-5, 258, 310, 150), g.lg(0, 258, 0, 400, [[0, g.c('#C68B5C', .75)], [1, g.c('#8E5A38', .45)]]), { wob: 0, dabs: { n: 420, cols: () => g.cj(R() < .5 ? '#B97A4E' : '#D49A68', .35 + R() * .45, 0, .08), len: 24, wid: 1.3, ang: 0, angJ: .04, a: .38 } });
  g.fill(g.rect(-5, 255, 310, 6), g.c('#E2AD7C', .95), { wob: .3 });
  const cx = 146, L = g.sx > cx ? 1 : -1;
  if (!g.N) g.shadow(g.P(`M${cx + 60},${316} L${cx - 70 - (g.G ? 110 : 30)},${g.G ? 326 : 320} L${cx - 60 - (g.G ? 110 : 30)},${g.G ? 350 : 336} L${cx + 40},334Z`), g.G ? .34 : .2, '#5A3020');
  g.fill(g.ell(cx, 321, 76, 8), g.raw('#2A160C', .45), { wob: .5 });
  const pot = g.P(`M${cx - 58},222 C${cx - 62},236 ${cx - 84},248 ${cx - 82},274 C${cx - 80},304 ${cx - 50},322 ${cx},322 C${cx + 50},322 ${cx + 80},304 ${cx + 82},274 C${cx + 84},248 ${cx + 62},236 ${cx + 58},222Z`);
  const te = '#2E7D82';
  g.fill(pot, g.lg(cx - 84, 0, cx + 84, 0, L > 0 ? [[0, g.c(te, .15)], [.45, g.c(te, .45)], [.72, g.c(te, 1.1)], [.84, g.c(te, .8)], [1, g.c(te, .3)]] : [[0, g.c(te, .3)], [.16, g.c(te, .8)], [.28, g.c(te, 1.1)], [.55, g.c(te, .45)], [1, g.c(te, .15)]]), { ink, inkW: .8,
    dabs: { n: 300, cols: (x) => g.cj(te, clamp(.2 + .9 * (L > 0 ? (x - cx + 84) / 168 : (cx + 84 - x) / 168)) + (R() - .5) * .3, 0, .1), len: 9, wid: 2.2, ang: (x, y) => Math.atan2(y - 268, x - cx) + Math.PI / 2, angJ: .3, a: .35 } });
  g.line(g.P(`M${cx - 80},258 Q${cx},272 ${cx + 80},258`, 10), 2.4, g.c('#163E42', .5), { wob: .3, a: .7 });
  g.line(g.P(`M${cx - 74},300 Q${cx},326 ${cx + 74},300`, 10), 2, g.c('#E8A060', .9), { wob: .4, a: .5 });
  g.line(g.P(`M${cx + L * 46},236 Q${cx + L * 70},262 ${cx + L * 60},300`, 8), 5, g.raw('#FFF4E0', .55), { wob: .6, taper: .3 });
  g.fill(g.ell(cx, 222, 60, 11), g.c('#4FA3A6', .9), { wob: .4, ink });
  g.fill(g.ell(cx, 223.6, 53, 8), g.rg(cx - 8, 221, 56, [[0, g.c('#F6BC52', 1.05)], [.7, g.c('#DD8E2C', .9)], [1, g.c('#A85C1E', .7)]]), { wob: .4, dabs: { n: 110, cols: () => g.cj('#EAA23E', .7 + R() * .5, 0, .12), len: 4, wid: 1.4, ang: 0, a: .5 } });
  for (let i = 0; i < 30; i++) { const a = R() * TAU, r = Math.sqrt(R()), x = cx + Math.cos(a) * r * 46, y = 223.6 + Math.sin(a) * r * 6; ctx.fillStyle = R() < .35 ? g.c('#B8321E', .9) : R() < .6 ? g.c('#4E8A3A', .85) : g.c('#5A3218', .7); ctx.beginPath(); ctx.ellipse(x, y, 1.7 + R() * 1.6, .8 + R() * .6, R() * 3, 0, TAU); ctx.fill(); }
  g.line(g.P(`M${cx - 30},222 Q${cx - 10},218 ${cx + 6},223 Q${cx + 20},227 ${cx + 34},221`, 8), 1.8, g.raw('#FFF1C8', .85), { wob: .3 });
  for (const k of [-1, 1]) g.line(g.P(`M${cx + k * 70},236 Q${cx + k * 94},236 ${cx + k * 84},254`, 6), 5, g.c('#1F5458', .5), { wob: .3 });
  const stc = g.N ? '#FFE8C8' : '#FFFFFF';
  for (const [x0, ph, w] of [[cx - 22, 0, 12], [cx + 8, 2, 15], [cx + 32, 4, 10]]) {
    const pts = []; for (let k = 0; k <= 24; k++) { const t = k / 24; pts.push([x0 + Math.sin(t * 7 + ph) * (4 + t * 14) + t * 14, 216 - t * 160]); }
    g.line(pts, w, g.raw(stc, .09), { wob: 1.6, taper: 2.4 }); g.line(pts, w * .45, g.raw(stc, .22), { wob: 1.2, taper: 1.4 }); g.line(pts.slice(0, 16), w * .15, g.raw(stc, .4), { wob: .8, taper: .3 });
  }
  const bowl = (x, y, r, outer, mound) => { g.fill(g.ell(x + 3, y + r * .62, r * 1.05, r * .26), g.raw('#3A2014', .35)); g.fill(g.P(`M${x - r},${y} Q${x - r},${y + r * .78} ${x},${y + r * .78} Q${x + r},${y + r * .78} ${x + r},${y}Z`), g.lg(x - r, 0, x + r, 0, [[0, g.c(outer, .45)], [.65, g.c(outer, 1)], [1, g.c(outer, .55)]]), { ink }); g.fill(g.ell(x, y, r, r * .28), g.c('#F4EBDD', .85), { ink, inkA: .3 }); g.fill(g.P(`M${x - r * .85},${y + 1} Q${x},${y - r * .62} ${x + r * .85},${y + 1}Z`), g.c(mound, .85), { dabs: { n: 90, cols: () => g.cj(mound, .45 + R() * .7, 0, .15), len: 1.3, wid: 1, a: .85 } }); };
  bowl(44, 334, 26, '#3F6FA8', '#F0B12A'); bowl(252, 340, 24, '#F4EEE6', '#C8392A'); bowl(100, 376, 18, '#2F6E6A', '#7A4A24');
  g.line(g.P('M150,392 Q190,372 236,382', 6), 4.5, g.c('#C08A56', .8), { wob: .3 }); g.fill(g.ell(146, 393, 10, 6, -.3), g.c('#C08A56', .8), { ink, inkA: .3 }); g.fill(g.ell(146, 392, 6, 3.6, -.3), g.c('#F0B12A', .9), { wob: .2 });
  for (const [x, y] of [[196, 356], [214, 362]]) { g.fill(g.P(`M${x},${y} Q${x + 10},${y - 6} ${x + 26},${y - 2} Q${x + 12},${y + 3.4} ${x},${y + 2}Z`), g.c('#C42A1C', .95), { wob: .3, ink, inkA: .3 }); g.line([[x + 25, y - 2], [x + 30, y - 5]], 1.5, g.c('#4E7A2A', .7)); }
  g.fill(g.ell(284, 382, 14, 12), g.c('#F6EEE2', .95), { ink, inkA: .3, dabs: { n: 20, cols: [g.c('#D9C9B4', .6)], len: 8, wid: .7, ang: Math.PI / 2, a: .7 } });
  g.foliage(274, 300, 16, 8, '#5E9A4E', { s: 2.6 });
},

Personal(g) {
  const { ctx, R } = g, wall = '#EEC1A8', ink = g.c('#4A2A2A', .45);
  g.sx = g.pick(120, 150, 240); g.sy = g.pick(140, 196, 60);
  g.fill(g.rect(-5, -5, 310, 410), g.lg(0, 0, 300, 0, [[0, g.c(wall, .36)], [.5, g.c(wall, .6)], [1, g.c(wall, .4)]]), { wob: 0, dabs: { n: 800, cols: () => g.cj(wall, .32 + R() * .38, 0, .06), len: 9, wid: 3.5, ang: 0, angJ: 3, a: .22 } });
  const ax = 150, top = 40, bot = 258, hw = 76, win = g.P(`M${ax - hw},${bot} L${ax - hw},${top + hw} Q${ax - hw},${top} ${ax},${top} Q${ax + hw},${top} ${ax + hw},${top + hw} L${ax + hw},${bot}Z`, 12);
  ctx.save(); g.trace(win); ctx.clip();
  g.sky(top, bot, g.pick(['#8FB8E2', '#C3DAEE', '#F2E6E0'], ['#8E80C4', '#E6A2A6', '#FFC78E', '#FFE1A8'], ['#0A1036', '#18225A', '#2C3878']));
  if (g.G) g.sun(150, 192, 22); else if (g.M) g.sun(112, 116, 13); else g.sun(196, 88, 9);
  g.stars(40, [ax - hw, top, 2 * hw, 140]);
  g.stratus(110, 120, 80, 7, { dep: .45 }); g.stratus(200, 96, 70, 6, { dep: .5 });
  g.mount(g.ridge([[ax - hw, 196], [110, 184], [150, 194], [196, 178], [ax + hw, 190]], .18, 270), '#9C86B4', .7, .58, { n: 60 });
  g.mist(206, 10, .6);
  for (let x = ax - hw - 4, i = 0; x < ax + hw; i++) { const h = 14 + R() * 18, w = 15 + R() * 10, y = 232 - h; const hx = ['#D99A8A', '#C8A6BC', '#E8B88E'][i % 3];
    g.fill(g.rect(x, y, w, 40), g.c(hx, .6, .35), { wob: .3 }); g.fill(g.P(`M${x - 2},${y} L${x + w / 2},${y - 9} L${x + w + 2},${y}Z`), g.c('#9A6070', .55, .35), { wob: .3 });
    if (R() < .8) g.fill(g.rect(x + w * .35, y + 5, 4, 5), g.e('#FFCF86', '#E8D9D0', 1, .5), { wob: .2 }); x += w + 1; }
  g.tree(212, 232, 44, '#6A8A6A', { dep: .3, s: 3 }); g.tree(88, 236, 36, '#7A9A70', { dep: .32, s: 3 });
  ctx.restore();
  const fr = g.c('#FBF2E6', .75);
  g.line(win.concat([win[0]]), 9, fr, { wob: .4 }); g.line([[ax, top], [ax, bot]], 5, fr, { wob: .3 }); g.line([[ax - hw, 150], [ax + hw, 150]], 4.5, fr, { wob: .3 });
  g.line(win.concat([win[0]]).map(([x, y]) => [x + (x - ax) * .07, y + (y < top + 10 ? -4 : 0)]), .8, ink, { wob: .4, a: .4 });
  if (!g.N) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g.lg(150, 160, 230, 400, [[0, g.raw(g.T.sunC, g.G ? .34 : .2)], [1, g.raw(g.T.sunC, 0)]]); g.trace([[ax - 50, 170], [ax + 70, 150], [310, 410], [110, 410]]); ctx.fill(); ctx.restore(); }
  const cur = '#F4E4D2';
  g.fill(g.P('M228,26 C238,120 232,240 250,330 L296,330 C282,240 292,120 288,26Z', 10), g.lg(228, 0, 296, 0, [[0, g.c(cur, .75)], [.45, g.c(cur, 1)], [1, g.c(cur, .45)]]), { a: .94, ink, inkA: .25, dabs: { n: 140, cols: () => g.cj('#E8CDB6', .35 + R() * .45, 0, .05), len: 28, wid: 1.6, ang: Math.PI / 2, angJ: .1, a: .32 } });
  g.line([[214, 24], [304, 24]], 3, g.c('#A07850', .6), { wob: .2 });
  g.fill(g.rect(56, 258, 188, 12), g.c('#F7EADB', .85), { wob: .3, ink, inkA: .3 });
  g.fill(g.rect(60, 270, 180, 140), g.lg(0, 270, 0, 400, [[0, g.c('#D79E86', .55)], [1, g.c('#B87E6C', .38)]]), { wob: .4, dabs: { n: 220, cols: () => g.cj('#C98E78', .3 + R() * .35, 0, .06), len: 14, wid: 2, ang: 0, angJ: .1, a: .32 } });
  for (const x of [80, 160]) g.line(g.rect(x, 290, 62, 100).concat([[x, 290]]), 1.6, g.c('#A86E5C', .45), { wob: .4, a: .7 });
  if (!g.N) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const sk = g.G ? 1.4 : .7, lc = g.G ? '#FFC98A' : '#FFFFFF'; for (const [x0, x1] of [[96, 146], [154, 204]]) for (const [y0, y1] of [[290, 330], [336, 380]]) g.fill([[x0 + (y0 - 290) * sk * .3, y0], [x1 + (y0 - 290) * sk * .3, y0], [x1 + (y1 - 290) * sk * .3, y1], [x0 + (y1 - 290) * sk * .3, y1]], g.raw(lc, g.G ? .42 : .25), { wob: 1.2 }); ctx.restore(); }
  g.fill(g.P('M80,266 Q82,244 116,244 L190,244 Q220,244 222,266Z', 10), g.lg(0, 244, 0, 266, [[0, g.c('#E79AA6', .9)], [1, g.c('#C87484', .45)]]), { ink, dabs: { n: 80, cols: () => g.cj('#E28E9C', .4 + R() * .5, 0, .06), len: 7, wid: 2, a: .3 } });
  const cat = '#E39A58', cy = 232;
  g.fill(g.ell(158, cy, 46, 18), g.lg(0, cy - 18, 0, cy + 18, [[0, g.c(cat, 1)], [1, g.c(cat, .4)]]), { ink, dabs: { n: 22, cols: () => g.c('#B9662E', .55), len: 9, wid: 2.4, ang: (x) => (x - 158) * .02 + Math.PI / 2, angJ: .2, a: .6 } });
  g.line(g.P('M200,238 C214,244 204,258 172,254 L118,252', 10), 7.5, g.c(cat, .6), { wob: .4, taper: .7 });
  g.line(g.P('M200,238 C214,244 204,258 172,254', 10), 2.2, g.c('#B9662E', .55), { wob: .4, a: .7 });
  g.fill(g.ell(118, 236, 16, 14), g.lg(0, 222, 0, 250, [[0, g.c(cat, .95)], [1, g.c(cat, .55)]]), { ink });
  g.fill(g.P('M105,230 L107,215 L117,225Z'), g.c(cat, .85), { ink }); g.fill(g.P('M121,224 L130,212 L133,229Z'), g.c(cat, .7), { ink }); g.fill(g.P('M108,227 L109,220 L114,225Z'), g.c('#F2A9A0', .8));
  g.fill(g.ell(116, 245, 10, 5.5), g.c('#FBE6CC', .9));
  for (const x of [110, 123]) g.line(g.P(`M${x - 3.4},237 Q${x},240 ${x + 3.4},237`, 4), 1.3, g.raw('#5A2E1E'), { wob: 0 });
  g.fill(g.ell(116.5, 242, 1.4, 1), g.raw('#C8606A'), { wob: 0 });
  g.line(g.P('M108,220 C130,208 184,208 202,228', 10), 2, g.raw(g.N ? '#9AA6D8' : '#FFE3B0', .9), { wob: .4, taper: .3 });
  g.fill(g.P('M4,404 L12,336 L88,336 L96,404Z'), g.lg(4, 0, 96, 0, [[0, g.c('#C76E4E', .35)], [1, g.c('#D9845E', .85)]]), { ink, dabs: { n: 70, cols: () => g.cj('#C2683F', .45 + R() * .35), len: 6, wid: 2, a: .3 } });
  g.fill(g.rect(6, 329, 86, 10), g.c('#D98A62', .85), { ink });
  const leaves = [[24, 262, 34, -.6, 4], [74, 226, 40, .2, 5], [20, 196, 34, -.35, 4], [100, 286, 30, .95, 3], [56, 164, 34, -.05, 4], [-2, 244, 30, -1.1, 3], [92, 182, 30, .5, 4], [44, 300, 28, -.2, 3]];
  for (const [x, y, s] of leaves) g.line(g.P(`M50,334 Q${(50 + x) / 2 + (x - 50) * .2},${(334 + y) / 2 + 30} ${x},${y + s * .2}`, 8), 2.4, g.c('#3F6E48', .45), { wob: .4, taper: .6 });
  for (const [x, y, s, r, k] of leaves) {
    const P = g.fill(leafShape(g, x, y, s, r, k), g.lg(x - s, y - s, x + s, y + s, [[0, g.c('#4E8A5A', .6)], [1, g.c('#24503A', .3)]]), { wob: .5, ink: g.c('#1E3A28', .4), inkA: .35 });
    ctx.save(); g.trace(P); ctx.clip(); g.dabs({ n: 50, box: g.bbox(P), cols: () => g.cj('#5E9A68', .3 + R() * .6, 0, .1), len: 8, wid: 2.2, ang: r + Math.PI / 2, a: .38 }); ctx.restore();
    g.line([[x - Math.sin(r) * -s * .2, y + Math.cos(r) * s * .2], [x + Math.sin(r) * s * .9, y - Math.cos(r) * s * .95]], 1.1, g.c('#A8D4A0', .7), { wob: .2, a: .7 });
    if (!g.N) g.line(P.slice(2, 22), 1.4, g.raw(g.G ? '#FFD9A0' : '#E9F6DA', .6), { wob: .2 });
  }
  g.fill(g.rect(222, 242, 14, 16), g.c('#E8DCCB', .7), { ink }); g.fill(g.P('M213,244 L245,244 L238,222 L220,222Z'), g.e('#FFE2A8', '#F2E6D4', 1, .6), { ink });
  g.glow(229, 236, 130, '#FFB866', .55 * g.T.glow);
  if (!g.N) for (let i = 0; i < 30; i++) { ctx.globalAlpha = .4 + R() * .5; ctx.fillStyle = g.raw('#FFF6E0'); ctx.beginPath(); ctx.arc(150 + R() * 120, 170 + R() * 200, .5 + R(), 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
},

Work(g) {
  const { ctx, R } = g, HZ = 250, ink = g.c('#2A2A4A', .45);
  g.sky(0, HZ + 4);
  if (g.G) g.sun(70, 214, 24); else if (g.M) g.sun(236, 176, 15); else g.sun(240, 62, 11);
  g.stars(110, [0, 0, 300, 220]);
  g.stratus(210, 52, 130, 7, { dep: .5 });
  g.cloud(78, 128, 120, 34, { k: 7, dep: .35 }); g.cloud(238, 222, 150, 40, { k: 8, dep: .5 }); g.cloud(150, 196, 70, 16, { k: 5, dep: .55 });
  let x = -6; while (x < 306) { const w = 7 + R() * 12, h = 8 + R() * 22 + (Math.abs(x - 150) < 40 ? 22 * R() : 0); g.fill(g.rect(x, HZ - h, w, h + 6), g.c('#8C9CC0', .55, .85), { wob: .3 }); if (g.N) for (let yy = HZ - h + 3; yy < HZ - 2; yy += 4) if (R() < .3) g.fill(g.rect(x + 1 + R() * (w - 3), yy, 1.3, 1.6), g.raw('#FFD08A', .8), { wob: 0 }); x += w + R() * 2; }
  g.mist(HZ - 4, 10, .7);
  g.fill(g.rect(-5, HZ, 310, 160), g.lg(0, HZ, 0, 400, [[0, g.c('#A8AEC8', .6, .7)], [.3, g.c('#8AA08E', .55, .35)], [1, g.c('#5E7E62', .45, 0)]]), { wob: 0, dabs: { n: 300, cols: () => g.cj(R() < .5 ? '#7E9A80' : '#A8A4BE', .4 + R() * .4, .3, .08), len: 12, wid: 1.4, ang: 0, angJ: .08, a: .3 } });
  const rc = y => 150 + Math.sin((y - HZ) / 34) * (y - HZ) * .42, rw = y => 1.5 + (y - HZ) * .4;
  const rb = []; for (let y = HZ; y <= 410; y += 4) rb.push([rc(y) - rw(y), y]); for (let y = 410; y >= HZ; y -= 4) rb.push([rc(y) + rw(y), y]);
  const wc = g.skyAt(g.T.sky, .6);
  const river = g.fill(rb, g.lg(0, HZ, 0, 400, [[0, g.raw(g.T.sky[3])], [.35, css(wc)], [1, css(g.skyAt(g.T.sky, .1))]]), { wob: .4, ink, inkA: .25 });
  ctx.save(); g.trace(river); ctx.clip();
  for (let i = 0; i < 120; i++) { const y = HZ + 2 + R() * R() * 150, w = 1.5 + R() * 10; ctx.globalAlpha = .8; ctx.fillStyle = g.raw(g.N ? '#F2EEDC' : '#FFF4DC'); ctx.fillRect(rc(y) + (g.sx - 150) * .2 + (R() - .5) * rw(y) * 1.4 - w / 2, y, w, .8); }
  if (g.N) for (let i = 0; i < 50; i++) { const y = 296 + R() * 100; ctx.globalAlpha = .6; ctx.fillStyle = g.raw('#FFC877'); ctx.fillRect(rc(y) + (R() - .5) * rw(y) * 1.6, y, .9, 3 + R() * 9); }
  g.dabs({ n: 220, box: [0, HZ, 300, 160], cols: () => R() < .5 ? g.raw('#FFFFFF', .6) : css(wc.map(v => v * .55)), len: 7, wid: .55, ang: 0, angJ: .03, a: .35 });
  ctx.restore();
  for (const y of [258, 264, 272, 282, 296, 314, 336]) {
    const s = .3 + (y - HZ) / 55, dep = clamp(.75 - (y - HZ) / 110);
    let x = -8 - R() * 10; while (x < 308) {
      const w = (9 + R() * 12) * s, h = (6 + R() * 18) * s * (Math.abs(x - 150) < 60 ? 1.5 : 1);
      if (x + w > rc(y) - rw(y) - 2 && x < rc(y) + rw(y) + 2) { x = rc(y) + rw(y) + 3; continue; }
      if (R() < .22) { g.foliage(x + w / 2, y - 3 * s, w * .6, 4 * s, '#5E8A68', { dep, s: 1.6 * s, k: 2 }); x += w; continue; }
      const side = w * .3, lit = g.sx < x ? 1 : 0;
      g.fill(g.rect(x, y - h, w, h), g.c(['#E8D8CC', '#D8C2C8', '#F0DCC0', '#C8C8DC'][(R() * 4) | 0], lit ? .55 : .9, dep), { wob: .25, ink, inkA: .15 * (1 - dep) });
      g.fill([[x + (lit ? 0 : w), y - h], [x + (lit ? -side : w + side), y - h + side * .4], [x + (lit ? -side : w + side), y], [x + (lit ? 0 : w), y]], g.c('#B8A8C0', lit ? 1 : .4, dep), { wob: .2 });
      g.fill(g.rect(x - 1, y - h - 1.6 * s, w + 2, 2 * s), g.c(R() < .5 ? '#B8665A' : '#7A7898', .7, dep), { wob: .2 });
      for (let yy = y - h + 3 * s; yy < y - 2 * s; yy += 4 * s) for (let xx = x + 2 * s; xx < x + w - 2 * s; xx += 3.4 * s) if (R() < (g.N ? .5 : .35)) g.fill(g.rect(xx, yy, 1.4 * s, 1.8 * s), g.e('#FFD08A', '#9AA8C8', 1, .6), { wob: 0 });
      x += w + (R() < .4 ? 2 * s : .5);
    }
  }
  const by = 304, b0 = rc(by) - rw(by) - 10, b1 = rc(by) + rw(by) + 10;
  g.fill(g.rect(b0, by - 5, b1 - b0, 5), g.c('#D9C6B8', .8, .15), { wob: .3, ink, inkA: .35 });
  const nA = 3, aw = (b1 - b0) / nA; for (let i = 0; i < nA; i++) { const x0 = b0 + i * aw; g.fill(g.P(`M${x0},${by} L${x0 + aw},${by} L${x0 + aw},${by + 12} Q${x0 + aw / 2},${by - 2} ${x0},${by + 12}Z`), g.c('#C9B4A6', .6, .15), { wob: .3, ink, inkA: .3 }); }
  for (let i = 0; i <= 6; i++) { const xx = b0 + i * (b1 - b0) / 6; g.line([[xx, by - 5], [xx, by - 12]], .8, g.c('#6A5A60', .5, .15), { wob: 0 }); g.fill(g.ell(xx, by - 13, 1.6, 1.6), g.e('#FFE0A0', '#E9E2D6', 1), { wob: 0 }); g.glow(xx, by - 13, 10, '#FFC877', .7 * g.T.glow); }
  g.foliage(14, 372, 46, 36, '#4A7A5E', { s: 5 }); g.foliage(290, 366, 44, 40, '#4A7A5E', { s: 5 }); g.foliage(60, 396, 40, 16, '#3E6A52', { s: 5 });
  const trail = []; for (let k = 0; k <= 100; k++) { const t = k / 100, a = t * TAU; trail.push([22 + t * 150 + Math.sin(a) * 30, 236 - t * 108 - (1 - Math.cos(a)) * 22]); }
  for (let k = 0; k < trail.length - 1; k += 3) g.line([trail[k], trail[k + 1]], 1.4, g.raw(g.N ? '#DCE4FF' : '#FFFFFF', .95), { wob: 0 });
  const N0 = [258, 80], A0 = [146, 108], T0 = [176, 126], B0 = [192, 150], K0 = [184, 138];
  g.fill([N0, A0, T0], g.lg(A0[0], A0[1], N0[0], N0[1], [[0, g.c('#FFFFFF', g.sx < 150 ? 1.15 : .85)], [1, g.c('#F4F2FA', 1)]]), { wob: .3, ink, inkA: .5, inkW: .7 });
  g.fill([N0, T0, K0], g.c('#9AA4C2', .55), { wob: .2, ink, inkA: .5 });
  g.fill([N0, K0, B0], g.lg(B0[0], B0[1], N0[0], N0[1], [[0, g.c('#D6DCEC', .6)], [1, g.c('#EEF0F8', .9)]]), { wob: .3, ink, inkA: .5, inkW: .7 });
  g.line([N0, T0], .7, g.raw('#FFFFFF', .9), { wob: .1 });
  if (!g.N) g.line([N0, A0], 1.1, g.raw(g.G ? '#FFE0B8' : '#FFFFFF', .9), { wob: .1 });
  birds(g, [[112, 64, 1.1], [126, 54, .8], [98, 74, .7]], g.c('#4A4466', .35, .3));
},

Reading(g) {
  const { ctx, R } = g, wall = '#6F8C93', ink = g.c('#1E2A30', .45);
  g.sx = 270; g.sy = 120;
  g.fill(g.rect(-5, -5, 310, 280), g.lg(0, 0, 300, 0, [[0, g.c(wall, .42)], [1, g.c(wall, .62)]]), { wob: 0, dabs: { n: 650, cols: () => g.cj(wall, .32 + R() * .38, 0, .06), len: 9, wid: 3.5, ang: 0, angJ: 3, a: .24 } });
  const wx = 24, wy = 26, ww = 178, wh = 206;
  ctx.save(); g.trace(g.rect(wx, wy, ww, wh)); ctx.clip();
  g.sky(wy, wy + wh, g.pick(['#8A9EB0', '#AEBFCA', '#CBD6D8'], ['#8E8EB0', '#C4A2AE', '#EDB898'], ['#0C1434', '#1A2552', '#2A3566']));
  if (g.G) g.glow(150, 128, 100, '#FFC888', .6);
  g.stratus(70, 70, 150, 12, { k: 8, dep: .55, hex: '#8E98B0' }); g.stratus(170, 110, 130, 9, { k: 7, dep: .6, hex: '#9AA2B8' });
  g.fill(g.P(`M${wx},170 L60,150 L60,140 L74,134 L88,140 L88,150 L120,160 L${wx + ww},150 L${wx + ww},${wy + wh} L${wx},${wy + wh}Z`), g.c('#7A8696', .5, .6), { wob: .5 });
  g.foliage(60, 176, 60, 30, '#5E8A72', { dep: .5, s: 5 }); g.foliage(160, 164, 56, 40, '#4E7A64', { dep: .45, s: 5 }); g.foliage(110, 200, 70, 22, '#6A9480', { dep: .4, s: 5 });
  g.mist(200, 26, .55);
  if (g.N) { g.fill(g.rect(150, 168, 2, 50), g.c('#333A4A', .5)); g.glow(151, 166, 46, '#FFC877', .7); g.fill(g.ell(151, 166, 3, 3), g.raw('#FFE6B0')); }
  ctx.strokeStyle = g.raw(g.N ? '#9AA8D0' : '#F2F6F8'); ctx.lineWidth = .6; ctx.globalAlpha = .45;
  ctx.beginPath(); for (let i = 0; i < 280; i++) { const x = wx + R() * ww, y = wy + R() * wh, l = 6 + R() * 12; ctx.moveTo(x, y); ctx.lineTo(x - l * .18, y + l); } ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = g.raw('#FFFFFF', .06); ctx.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 80; i++) { const x = wx + R() * ww, y = wy + R() * wh, r = .8 + R() * R() * 3; g.fill(g.ell(x, y, r, r * 1.1), g.raw(g.N ? '#3A4670' : '#DDE6EA', .6), { wob: 0 }); g.fill(g.ell(x - r * .25, y - r * .3, r * .38, r * .38), g.raw('#FFFFFF', .9), { wob: 0 }); if (R() < .3) g.line([[x, y + r], [x + (R() - .5) * 2, y + r + 6 + R() * 16]], r * .6, g.raw('#E4ECEE', .4), { wob: .3 }); }
  ctx.restore();
  const fr = g.c('#EFE8DC', .65);
  for (const r of [g.rect(wx - 6, wy - 6, ww + 12, 7), g.rect(wx - 6, wy - 6, 7, wh + 12), g.rect(wx + ww - 1, wy - 6, 7, wh + 12), g.rect(wx + ww / 2 - 2.5, wy, 5, wh), g.rect(wx, wy + wh * .45, ww, 4.5)]) g.fill(r, fr, { wob: .3, ink, inkA: .2 });
  g.fill(g.rect(wx - 12, wy + wh + 2, ww + 24, 8), g.c('#E9E0D2', .7), { wob: .4, ink, inkA: .3 });
  g.fill(g.P(`M40,${wy + wh + 2} L37,${wy + wh - 12} L55,${wy + wh - 12} L52,${wy + wh + 2}Z`), g.c('#E7DED2', .7), { ink }); g.foliage(46, wy + wh - 22, 12, 11, '#6D9E7D', { s: 2.6 });
  const L = .55 + .45 * g.T.glow;
  g.glow(262, 128, 170, '#FFB866', .4 * L);
  g.fill(g.rect(-5, 266, 310, 150), g.lg(0, 266, 0, 400, [[0, g.c('#9C6848', .7)], [1, g.c('#5E3A26', .42)]]), { wob: 0, dabs: { n: 420, cols: () => g.cj(R() < .5 ? '#8A5A3E' : '#A8714E', .35 + R() * .45, 0, .08), len: 24, wid: 1.3, ang: 0, angJ: .04, a: .38 } });
  g.fill(g.rect(-5, 262, 310, 6), g.c('#C08B63', .85), { wob: .3 });
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = g.rg(262, 290, 130, [[0, g.raw('#FFD08A', .6 * L)], [1, g.raw('#FFD08A', 0)]]); ctx.fillRect(120, 200, 190, 210);
  ctx.fillStyle = g.lg(0, 144, 0, 266, [[0, g.raw('#FFE2A8', .42 * L)], [1, g.raw('#FFE2A8', .04)]]); g.trace([[234, 144], [290, 144], [326, 266], [196, 266]]); ctx.fill(); ctx.restore();
  g.shadow([[150, 264], [246, 264], [236, 270], [120, 272]], .3, '#2A1810');
  const book = (x, y, w, h, hex, band) => { g.fill(g.rect(x, y, w, h), g.lg(x, 0, x + w, 0, [[0, g.c(hex, .5)], [1, g.c(hex, 1)]]), { wob: .35, ink }); g.fill(g.rect(x + w - 6, y + 1.5, 4, h - 3), g.c('#F6EEDD', .95), { wob: .2 }); g.fill(g.rect(x + 8, y + h / 2 - 1.2, w * .3, 2.4), g.c(band, .9), { wob: .2 }); };
  book(150, 248, 98, 15, '#3F5A8A', '#E8C77A'); book(158, 234, 86, 14, '#D98E88', '#FFF2E4'); book(152, 221, 92, 13, '#E7B55B', '#8A5A1E'); book(162, 207, 78, 14, '#7FAA8F', '#F7F0E2');
  g.shadow(g.ell(94, 294, 26, 5), .3, '#2A1810');
  g.fill(g.ell(100, 292, 22, 5), g.c('#F4EEE6', .75), { ink }); g.fill(g.P('M84,268 L116,268 Q116,290 100,290 Q84,290 84,268Z'), g.lg(84, 0, 116, 0, [[0, g.c('#F6EFE6', .5)], [1, g.c('#F6EFE6', 1)]]), { ink });
  g.line(g.P('M116,272 Q127,274 116,285', 4), 2.6, g.c('#F6EFE6', .85)); g.fill(g.ell(100, 268, 16, 3.2), g.c('#8A5634', .7));
  for (const [x0, ph, w] of [[94, 0, 8], [106, 2, 6]]) { const p = []; for (let k = 0; k <= 16; k++) { const t = k / 16; p.push([x0 + Math.sin(t * 6 + ph) * (2 + t * 7), 262 - t * 60]); } g.line(p, w, g.raw('#FFFFFF', .12), { wob: .8, taper: 2 }); g.line(p.slice(0, 11), w * .3, g.raw('#FFFFFF', .35), { wob: .4, taper: .3 }); }
  g.fill(g.ell(262, 264, 20, 4.5), g.c('#B58A45', .7), { ink }); g.line([[262, 262], [262, 146]], 4, g.c('#C49A52', .8), { wob: .1 });
  g.fill(g.P('M232,146 L292,146 L280,100 L244,100Z'), g.lg(232, 0, 292, 0, [[0, g.e('#FFEFC4', '#F3D49A', .85)], [1, g.e('#FFD27E', '#E4B460', .85)]]), { wob: .4, ink, inkA: .3 });
  g.glow(262, 146, 30, '#FFF0C8', .75 * L);
  let lines = []; for (let i = 0; i < 7; i++) lines.push([[34 + i, 330 + i * 7.5], [86 + i * .5, 326 + i * 7.5]], [[100 + i * .6, 326 + i * 7.5], [150 + i, 330 + i * 7.5]]);
  g.shadow(g.P('M24,330 L172,330 L178,402 L18,404Z'), .25, '#2A1810');
  g.fill(g.P('M20,322 Q56,310 93,318 L93,392 Q56,384 14,394Z', 8), g.lg(14, 0, 93, 0, [[0, g.c('#FBF6EE', .6)], [1, g.c('#FBF6EE', .85)]]), { ink }); g.fill(g.P('M93,318 Q130,310 166,322 L172,394 Q130,384 93,392Z', 8), g.lg(93, 0, 172, 0, [[0, g.c('#F3EDE3', .7)], [1, g.c('#F3EDE3', 1)]]), { ink });
  for (const l of lines) g.line(l, .7, g.c('#8E96B8', .6), { wob: .2, a: .7 });
  g.line([[93, 318], [93, 392]], 1.2, g.c('#C9BFB0', .6));
  g.fill(g.P('M150,360 L218,338 L220,343 L152,365Z'), g.c('#2A3060', .6), { ink }); g.fill(g.P('M218,338 L228,338 L220,343Z'), g.c('#C9A35B', .9));
},

Ideas(g) {
  const { ctx, R } = g, ink = g.c('#1A1630', .5);
  g.sky(0, 304, g.pick(['#1A2560', '#3B4C8C', '#8E8AB6', '#E8B9B0'], ['#2A2F6E', '#5E4E92', '#C98AA4', '#F6B38E'], ['#060A26', '#0E1748', '#1C2A66', '#2E3C7E']));
  g.sx = 178; g.sy = 128;
  const st = g.T.star; g.T.star = g.pick(.55, .4, 1);
  ctx.save(); ctx.translate(150, 120); ctx.rotate(-.55);
  g.dabs({ n: 300, box: [-230, -28, 460, 56], cols: () => g.raw(R() < .5 ? '#B8B4E8' : '#E8D8F0', .5), len: 18, wid: 5, ang: 0, angJ: .3, a: .07 * (g.N ? 1.7 : .8) });
  g.dabs({ n: 300, box: [-230, -18, 460, 36], cols: [g.raw('#FFFFFF')], len: .5, wid: .5, a: .7 * g.T.star });
  ctx.restore();
  g.stars(220, [0, 0, 300, 270]);
  g.T.star = st;
  g.glow(62, 66, 60, '#8FA0E0', .3);
  g.fill(g.ell(62, 66, 11, 11), g.raw('#F3EBD2'), { wob: .3 }); g.fill(g.ell(67.5, 61.5, 9.6, 9.6), css(g.skyAt(g.T.sky, .2)), { wob: .3 });
  for (const [x, y, s] of [[58, 150, .3], [96, 182, .22], [240, 90, .32], [262, 170, .24], [214, 206, .18], [122, 216, .15], [30, 206, .16], [282, 232, .13], [152, 238, .12], [196, 240, .1], [80, 240, .1]]) { g.glow(x, y, 110 * s, '#FFB25A', .5); g.fill(g.P(`M${x - 6 * s},${y - 8 * s} L${x + 6 * s},${y - 8 * s} L${x + 5 * s},${y + 8 * s} L${x - 5 * s},${y + 8 * s}Z`), g.raw('#FFD58A'), { wob: .1 }); }
  g.mount(g.ridge([[-10, 262], [60, 248], [130, 262], [200, 244], [310, 258]], .12, 320), '#5A6496', .5, .7, { n: 80 });
  g.mist(268, 10, .35);
  g.mount(g.ridge([[-10, 286], [80, 272], [160, 286], [230, 276], [310, 286]], .1, 320), '#34406E', .4, .35, { n: 80 });
  g.fill(g.rect(226, 262, 22, 16), g.c('#6A6080', .5, .2), { ink }); g.fill(g.P('M222,264 L237,251 L252,264Z'), g.c('#3A3050', .5, .2), { ink }); g.fill(g.rect(234, 267, 6, 6), g.raw('#FFCB80')); g.glow(237, 270, 30, '#FFB866', .6);
  for (const [x, h] of [[200, 24], [212, 18], [262, 26], [272, 18], [40, 20], [52, 28]]) g.fill(g.wob(g.P(`M${x},${284} L${x + 5},${284 - h} L${x + 10},284Z`), .6), g.c('#24305A', .4, .2), { wob: 0 });
  const lx = 178, ly = 128;
  g.glow(lx, ly, 160, '#FF9F4A', .42); g.glow(lx, ly, 64, '#FFC47A', .55);
  const body = g.P(`M${lx - 25},${ly - 36} Q${lx},${ly - 42} ${lx + 25},${ly - 36} Q${lx + 32},${ly} ${lx + 22},${ly + 34} Q${lx},${ly + 38} ${lx - 22},${ly + 34} Q${lx - 32},${ly} ${lx - 25},${ly - 36}Z`, 10);
  g.fill(body, g.rg(lx + 2, ly + 14, 46, [[0, g.raw('#FFF1C2')], [.45, g.raw('#FFC66E')], [1, g.raw('#E0703A')]]), { wob: .5, ink: g.raw('#A0461E'), inkA: .5, inkW: .8, dabs: { n: 110, cols: () => g.raw(R() < .5 ? '#FFE0A0' : '#F3A050', .5), len: 6, wid: 2, ang: Math.PI / 2, angJ: .4, a: .25 } });
  for (let k = -2; k <= 2; k++) g.line(g.P(`M${lx + k * 9},${ly - 38} Q${lx + k * 13},${ly} ${lx + k * 8.5},${ly + 36}`, 8), .8, g.raw('#C8642E', .45), { wob: .3 });
  g.fill(g.ell(lx, ly + 34, 22, 3.5), g.raw('#9A4A24', .8), { wob: .3 }); g.fill(g.ell(lx, ly + 30, 5, 6), g.raw('#FFFBEA'), { wob: .3 }); g.glow(lx, ly + 28, 22, '#FFFFFF', .6);
  g.fill(g.rect(-5, 304, 310, 110), g.lg(0, 304, 0, 400, [[0, g.c('#8A6A5A', .75)], [1, g.c('#4A3440', .4)]]), { wob: 0, dabs: { n: 300, cols: () => g.cj('#7A5A4E', .3 + R() * .45, 0, .08), len: 24, wid: 1.3, ang: 0, angJ: .04, a: .38 } });
  g.fill(g.rect(-5, 300, 310, 6), g.c('#A88470', .85), { wob: .3, ink, inkA: .3 });
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g.rg(lx, 336, 170, [[0, g.raw('#FFB866', .42)], [1, g.raw('#FFB866', 0)]]); ctx.fillRect(-5, 300, 310, 110); ctx.restore();
  g.fill(g.rect(254, 262, 26, 40), g.c('#A8C8D8', .6, 0, .7), { ink, inkA: .35 });
  for (const [x, h, c] of [[258, 34, '#E9B04C'], [264, 40, '#7FA8C9'], [270, 30, '#E78E9E'], [275, 36, '#8FBF8A']]) { g.line([[x, 300], [x + (x - 266) * .2, 300 - h]], 3, g.c(c, .8), { wob: .2 }); }
  g.fill(g.rect(254, 278, 26, 24), g.raw('#FFFFFF', .12), { wob: .2 });
  const pg = g.c('#F6EEDF', 1.1), pg2 = g.c('#EFE6D6', .95);
  g.fill(g.P('M40,402 L60,330 Q100,322 150,332 L150,410Z', 8), g.raw('#1A1430', .35), { wob: .5 });
  g.fill(g.P('M44,396 L66,326 Q104,316 150,326 L150,398 Q100,390 44,396Z', 8), pg, { wob: .4, ink });
  g.fill(g.P('M150,326 Q196,316 236,326 L256,396 Q200,390 150,398Z', 8), pg2, { wob: .4, ink });
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g.rg(lx, 300, 120, [[0, g.raw('#FFB060', .35)], [1, g.raw('#FFB060', 0)]]); g.trace([[44, 396], [66, 326], [150, 320], [236, 326], [256, 396]]); ctx.fill(); ctx.restore();
  g.line([[150, 326], [150, 398]], 1.2, g.c('#B8A890', .6));
  const gph = g.c('#4A4660', .65);
  g.line(g.P('M88,346 Q100,342 112,346 Q118,362 110,378 Q100,381 90,378 Q82,362 88,346Z', 8), .9, gph, { wob: .4, a: .8 });
  for (const k of [-1, 0, 1]) g.line([[100 + k * 7, 345], [100 + k * 7, 379]], .5, gph, { wob: .4, a: .6 });
  for (let i = 0; i < 14; i++) g.line([[84 + R() * 8, 350 + i * 2], [90 + R() * 8, 348 + i * 2]], .4, gph, { wob: .2, a: .35 });
  for (const [x, y] of [[176, 344], [196, 350], [214, 340], [204, 366], [184, 372]]) { g.line([[x - 3, y], [x + 3, y]], .6, gph, { wob: 0 }); g.line([[x, y - 3], [x, y + 3]], .6, gph, { wob: 0 }); }
  g.line([[176, 344], [196, 350], [214, 340]], .4, gph, { wob: .2, a: .5 }); g.line([[196, 350], [204, 366], [184, 372]], .4, gph, { wob: .2, a: .5 });
  g.fill(g.P('M206,388 L268,360 L271,365 L209,393Z'), g.c('#E9B04C', .85), { ink }); g.fill(g.P('M206,388 L198,394 L209,393Z'), g.c('#F0D6B0', .8)); g.fill(g.P('M268,360 L276,357 L278,362 L271,365Z'), g.c('#E78E9E', .8));
},
};

/* ---------- WebGL2 painterly pass ---------- */
const VS = `#version 300 es
out vec2 uv; void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); uv=p; gl_Position=vec4(p*2.-1.,0.,1.); }`;
const HEAD = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform float seed;
float h21(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return s/.97; }
float lum(vec3 c){ return dot(c,vec3(.299,.587,.114)); }
`;
const FS = {
  warp: HEAD + `uniform sampler2D T; uniform float amp;
  void main(){ vec2 px=uv*R; vec2 w=vec2(fbm(px/42.+seed),fbm(px/42.+seed+31.7))-.5, w2=vec2(vn(px/6.+seed),vn(px/6.+seed+9.))-.5;
    o=texture(T, uv+(w*amp*2.2+w2*amp*.5)/R); }`,
  tensor: HEAD + `uniform sampler2D T;
  void main(){ vec2 d=1./R;
    vec3 a=texture(T,uv+d*vec2(-1,-1)).rgb, b=texture(T,uv+d*vec2(0,-1)).rgb, c=texture(T,uv+d*vec2(1,-1)).rgb,
         e=texture(T,uv+d*vec2(-1,0)).rgb, f=texture(T,uv+d*vec2(1,0)).rgb,
         g=texture(T,uv+d*vec2(-1,1)).rgb, h=texture(T,uv+d*vec2(0,1)).rgb, i=texture(T,uv+d*vec2(1,1)).rgb;
    vec3 gx=(c+2.*f+i-a-2.*e-g)*.25, gy=(g+2.*h+i-a-2.*b-c)*.25;
    o=vec4(dot(gx,gx),dot(gx,gy),dot(gy,gy),1.); }`,
  blur: HEAD + `uniform sampler2D T; uniform vec2 dir; uniform float sig;
  void main(){ vec4 s=vec4(0.); float ws=0.; for(int i=-18;i<=18;i++){ float x=float(i); float w=exp(-x*x/(2.*sig*sig)); s+=texture(T,uv+dir*x)*w; ws+=w; } o=s/ws; }`,
  // anisotropic Kuwahara, polynomial sector weights (Kyprianidis et al.)
  akf: HEAD + `uniform sampler2D T; uniform sampler2D ST; uniform float radius, q, alpha, aniso;
  const float PI=3.14159265;
  void main(){
    vec3 t=texture(ST,uv).xyz; float E=t.x,F=t.y,G=t.z;
    float l1=.5*(E+G+sqrt(max(0.,(E-G)*(E-G)+4.*F*F))), l2=.5*(E+G-sqrt(max(0.,(E-G)*(E-G)+4.*F*F)));
    vec2 v0=vec2(l1-E,-F); vec2 dv=length(v0)>0.?normalize(v0):vec2(0.,1.);
    float phi=atan(dv.y,dv.x); float A=(l1+l2>0.)?(l1-l2)/(l1+l2):0.; A*=aniso;
    vec4 m[8]; vec3 s[8]; for(int k=0;k<8;k++){ m[k]=vec4(0.); s[k]=vec3(0.); }
    float zeta=2./radius, eta=(zeta+cos(PI/8.))/pow(sin(PI/8.),2.);
    float a=radius*clamp((alpha+A)/alpha,.1,2.), b=radius*clamp(alpha/(alpha+A),.1,2.);
    float cp=cos(phi), sp=sin(phi);
    mat2 SR=mat2(.5/a,0.,0.,.5/b)*mat2(cp,-sp,sp,cp);
    int mx=int(sqrt(a*a*cp*cp+b*b*sp*sp)), my=int(sqrt(a*a*sp*sp+b*b*cp*cp));
    for(int j=-my;j<=my;j++) for(int i=-mx;i<=mx;i++){
      vec2 v=SR*vec2(float(i),float(j));
      if(dot(v,v)<=.25){
        vec3 c=texture(T,uv+vec2(float(i),float(j))/R).rgb; float w[8]; float sum=0.,z,vxx,vyy;
        vxx=zeta-eta*v.x*v.x; vyy=zeta-eta*v.y*v.y;
        z=max(0.,v.y+vxx); w[0]=z*z; sum+=w[0]; z=max(0.,-v.x+vyy); w[2]=z*z; sum+=w[2];
        z=max(0.,-v.y+vxx); w[4]=z*z; sum+=w[4]; z=max(0.,v.x+vyy); w[6]=z*z; sum+=w[6];
        v=.70710678*vec2(v.x-v.y,v.x+v.y); vxx=zeta-eta*v.x*v.x; vyy=zeta-eta*v.y*v.y;
        z=max(0.,v.y+vxx); w[1]=z*z; sum+=w[1]; z=max(0.,-v.x+vyy); w[3]=z*z; sum+=w[3];
        z=max(0.,-v.y+vxx); w[5]=z*z; sum+=w[5]; z=max(0.,v.x+vyy); w[7]=z*z; sum+=w[7];
        float gg=exp(-3.125*dot(v,v))/sum;
        for(int k=0;k<8;k++){ float wk=w[k]*gg; m[k]+=vec4(c*wk,wk); s[k]+=c*c*wk; }
      }
    }
    vec4 acc=vec4(0.);
    for(int k=0;k<8;k++){ vec3 mu=m[k].rgb/m[k].w; vec3 sv=abs(s[k]/m[k].w-mu*mu); float s2=sv.r+sv.g+sv.b; float w=1./(1.+pow(255.*s2,.5*q)); acc+=vec4(mu*w,w); }
    o=vec4(acc.rgb/acc.w,1.);
  }`,
  final: HEAD + `uniform sampler2D K; uniform sampler2D BS; uniform sampler2D BL; uniform sampler2D OV; uniform sampler2D WM;
  uniform vec3 lift, gain; uniform float sat, vig, edge, bleed, gran;
  vec3 dens(vec3 c,float d){ return c-(c-c*c)*(d-1.); }
  float paperH(vec2 p){ // cold-press tooth: soft pits and bumps, a hint of fibre, no streaks
    float t=fbm(p/4.2), b=fbm(p/26.+7.), gr=vn(p/1.25);
    float fib=smoothstep(.62,.9,vn(mat2(.8,.6,-.6,.8)*p*vec2(1./9.,1./1.6)))*.12;
    return clamp(t*.62+b*.22+gr*.16+fib-.05,0.,1.);
  }
  void main(){
    vec2 px=uv*R;
    vec3 k=texture(K,uv).rgb, bs=texture(BS,uv).rgb, bl=texture(BL,uv).rgb;
    // wet-in-wet bleed in patches near edges, with a darker backrun rim where the bleed stops
    float n=fbm(px/150.+seed*1.7+3.);
    float nearE=clamp(length(k-bl)*3.5,0.,1.);
    float wm=0.; for(int i=-2;i<=2;i++) for(int j=-2;j<=2;j++) wm+=texture(WM,uv+vec2(float(i),float(j))*5./R).r; wm/=25.;
    float m=max(smoothstep(.55,.6,n)*nearE, wm);
    vec3 c=mix(k,bl,m*bleed);
    float br=smoothstep(.535,.55,n)*(1.-smoothstep(.55,.575,n))*nearE;
    // edge darkening: pigment pools inside every shape border, more on the darker side
    float e=clamp(length(k-bs)*5.,0.,1.)*(1.-m*.85);
    float dk=clamp((lum(bs)-lum(k))*7.,0.,1.)*(1.-m*.7);
    float d=1.+edge*(e*.7+dk*1.3)+br*.8;
    // turbulence: uneven pigment density across flat washes
    d+=.22*(fbm(px/80.+seed*3.1)-.5)+.1*(fbm(px/18.+seed)-.5);
    // granulation: pigment settles into paper valleys, stronger in darks and blues
    float ph=paperH(px+seed*97.);
    float L=lum(c);
    float ga=gran*(.35+.65*(1.-L))*(1.+.8*smoothstep(0.,.25,c.b-c.r));
    d+=ga*((.55-ph)*.9+(vn(px/1.2+seed*5.)-.5)*.5);
    vec3 dd=vec3(d)+.07*vec3(fbm(px/110.+seed+7.)-.5,0.,fbm(px/110.+seed+19.)-.5); // warm/cool pigment drift
    c=clamp(c,0.,1.); c=c-(c-c*c)*(dd-1.);
    // pencil and ink layer: skips over the paper tooth
    vec2 wv=vec2(fbm(px/42.+seed),fbm(px/42.+seed+31.7))-.5;
    vec4 ov=texture(OV,uv+wv*2.2/R);
    float tk=clamp(.45+ph*.9,0.,1.);
    c=c*(1.-ov.a*tk)+ov.rgb*tk;
    // paper: warm fibre showing through, embossed by a top-left light
    float ph2=paperH(px+vec2(1.,1.)+seed*97.);
    c*=.965+.05*ph+(ph-ph2)*.22;
    c=mix(c,c*vec3(1.,.985,.95),.6);
    // grade
    c=lift+c*(gain-lift);
    c=mix(vec3(lum(c)),c,sat);
    vec2 q=uv-.5; c*=1.-vig*dot(q,q)*1.6;
    o=vec4(clamp(c,0.,1.),1.);
  }`,
};
function makeGL() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false, depth: false, stencil: false });
  if (!gl) return null;
  const flt = !!gl.getExtension('EXT_color_buffer_float');
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error('SBArt shader: ' + gl.getShaderInfoLog(o)); return o; };
  const vs = sh(gl.VERTEX_SHADER, VS), P = {};
  for (const k in FS) { const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS[k])); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('SBArt link: ' + gl.getProgramInfoLog(p)); P[k] = { p, u: {} }; }
  const tex = (w, h, f) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, f ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, f ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    if (w === 0) return { t }; const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, fb, w, h }; };
  const src = tex(0, 0), ovl = tex(0, 0), wtx = tex(0, 0), Wt = tex(W, H), K = tex(W, H), T1 = tex(W, H, flt), T2 = tex(W, H, flt), S1 = tex(W, H), S2 = tex(W, H), L1 = tex(W / 2, H / 2), L2 = tex(W / 2, H / 2);
  const pass = (k, tgt, tx, un = {}) => {
    const p = P[k], U = n => (n in p.u ? p.u[n] : (p.u[n] = gl.getUniformLocation(p.p, n)));
    gl.useProgram(p.p); gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.fb : null); gl.viewport(0, 0, tgt ? tgt.w : W, tgt ? tgt.h : H);
    let i = 0; for (const n in tx) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx[n].t); gl.uniform1i(U(n), i++); }
    gl.uniform2f(U('R'), tgt ? tgt.w : W, tgt ? tgt.h : H);
    for (const n in un) { const v = un[n]; if (typeof v === 'number') gl.uniform1f(U(n), v); else gl['uniform' + v.length + 'fv'](U(n), v); }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const px = new Uint8Array(4);
  return {
    cv, aniso: flt,
    run(canvas, top, wm, T, seed, opt) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, src.t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.bindTexture(gl.TEXTURE_2D, ovl.t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, top);
      gl.bindTexture(gl.TEXTURE_2D, wtx.t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, wm);
      pass('warp', Wt, { T: src }, { seed, amp: opt.warp });
      if (flt) { pass('tensor', T1, { T: Wt }, { seed }); pass('blur', T2, { T: T1 }, { seed, dir: [1 / W, 0], sig: 2.5 }); pass('blur', T1, { T: T2 }, { seed, dir: [0, 1 / H], sig: 2.5 }); }
      pass('akf', K, { T: Wt, ST: T1 }, { seed, radius: opt.radius, q: 8, alpha: 1, aniso: flt ? 1 : 0 });
      pass('blur', S1, { T: K }, { seed, dir: [1 / W, 0], sig: 2.2 }); pass('blur', S2, { T: S1 }, { seed, dir: [0, 1 / H], sig: 2.2 });
      pass('blur', L1, { T: K }, { seed, dir: [2 / W, 0], sig: 8 }); pass('blur', L2, { T: L1 }, { seed, dir: [0, 2 / H], sig: 8 });
      const gr = T.grade;
      pass('final', null, { K, BS: S2, BL: L2, OV: ovl, WM: wtx }, { seed, lift: gr.lift, gain: gr.gain, sat: gr.sat, vig: gr.vig, edge: opt.edge, bleed: opt.bleed, gran: opt.gran });
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // sync, so timings are honest
      return cv;
    },
  };
}

/* ---------- tileable textures ---------- */
function pnoise(period, R) { // periodic 2D value noise on an integer lattice
  const v = new Float32Array(period * period); for (let i = 0; i < v.length; i++) v[i] = R();
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = ((xi % period) + period) % period, b = ((yi % period) + period) % period, a1 = (a + 1) % period, b1 = (b + 1) % period;
    return mix(mix(v[b * period + a], v[b * period + a1], ux), mix(v[b1 * period + a], v[b1 * period + a1], ux), uy); };
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function linen(hex = '#A9C8EE', size = 512) {
  size = Math.max(64, size | 0);
  const R = mb(parseInt(hex.slice(1), 16) ^ size), base = lin(hex), p = 4, nT = Math.round(size / p);
  const hgt = new Float32Array(size * size), alb = new Float32Array(size * size);
  const slubW = pnoise(16, R), slubF = pnoise(16, R), fib = pnoise(size / 2, R), mott = pnoise(8, R);
  const thW = Array.from({ length: nT }, () => .85 + R() * .3), thF = Array.from({ length: nT }, () => .85 + R() * .3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / p, v = y / p, i = Math.floor(u) % nT, j = Math.floor(v) % nT, fu = u - Math.floor(u), fv = v - Math.floor(v);
    const warpTop = (i + j) % 2 === 0;
    const sw = thW[i] * (.85 + .3 * slubW(i * 16 / nT, y * 16 / size)), sf = thF[j] * (.85 + .3 * slubF(x * 16 / size, j * 16 / nT));
    const pw = Math.max(0, Math.cos((fu - .5) * Math.PI * (1.15 / sw))) * (.75 + .25 * Math.sin(fv * Math.PI));
    const pf = Math.max(0, Math.cos((fv - .5) * Math.PI * (1.15 / sf))) * (.75 + .25 * Math.sin(fu * Math.PI));
    const top = warpTop ? pw : pf, under = warpTop ? pf : pw, h = Math.max(top, under * .55);
    const f = fib(x / 2 + y * .3 / 2, y / 2) * .5 + fib(x / 2, y / 2 + x * .3 / 2) * .5;
    hgt[y * size + x] = h + (f - .5) * .12;
    alb[y * size + x] = (.8 + .22 * h) * (.94 + .1 * f) * (.96 + .08 * mott(x * 8 / size, y * 8 / size)) * (warpTop ? sw : sf) ** .3;
  }
  const A = canvas(size, size), N = canvas(size, size), ai = A.getContext('2d').createImageData(size, size), ni = N.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const k = y * size + x, o = k * 4, a = alb[k];
    for (let c = 0; c < 3; c++) ai.data[o + c] = 255 * Math.pow(clamp(base[c] * a), 1 / 2.2); ai.data[o + 3] = 255;
    const hx = hgt[y * size + (x + 1) % size] - hgt[y * size + (x - 1 + size) % size], hy = hgt[((y + 1) % size) * size + x] - hgt[((y - 1 + size) % size) * size + x];
    const s = 2.2, nx = -hx * s, ny = -hy * s, l = Math.hypot(nx, ny, 1);
    ni.data[o] = 128 + 127 * nx / l; ni.data[o + 1] = 128 - 127 * ny / l; ni.data[o + 2] = 128 + 127 / l; ni.data[o + 3] = 255;
  }
  A.getContext('2d').putImageData(ai, 0, 0); N.getContext('2d').putImageData(ni, 0, 0);
  return { albedo: A, normal: N };
}
function paper(size = 1024) {
  size = Math.max(64, size | 0);
  const R = mb(1234 + size), c = canvas(size, size), x2 = c.getContext('2d'), id = x2.createImageData(size, size);
  const n1p = pnoise(8, R), n2p = pnoise(32, R), n3p = pnoise(128, R), base = [244, 236, 222];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, f = n1p(u * 8, v * 8) * .45 + n2p(u * 32, v * 32) * .35 + n3p(u * 128, v * 128) * .2, gr = (R() - .5) * 5;
    const k = (y * size + x) * 4, m = .975 + (f - .5) * .07;
    id.data[k] = base[0] * m + gr; id.data[k + 1] = base[1] * m + gr; id.data[k + 2] = base[2] * m + gr * 1.1; id.data[k + 3] = 255;
  }
  x2.putImageData(id, 0, 0);
  // fibres, drawn wrapped so the tile stays seamless
  for (let i = 0; i < size * .9; i++) {
    const x = R() * size, y = R() * size, a = R() * TAU, l = 6 + R() * 26 * size / 1024 * 2, cv = (R() - .5) * l * .6, light = R() < .55;
    x2.strokeStyle = light ? 'rgba(255,252,244,.55)' : 'rgba(170,150,120,.22)'; x2.lineWidth = .5 + R() * .7;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const sx = x + ox, sy = y + oy; if (sx < -40 || sy < -40 || sx > size + 40 || sy > size + 40) continue;
      x2.beginPath(); x2.moveTo(sx, sy); x2.quadraticCurveTo(sx + Math.cos(a) * l / 2 - Math.sin(a) * cv, sy + Math.sin(a) * l / 2 + Math.cos(a) * cv, sx + Math.cos(a) * l, sy + Math.sin(a) * l); x2.stroke();
    }
  }
  return c;
}

/* ---------- API ---------- */
const OPT = { radius: 6.5, warp: 2.6, edge: 1.25, bleed: .8, gran: .6 };
const SEEDS = { Travel: 7, Recipes: 11, Personal: 23, Work: 5, Reading: 31, Ideas: 43 };
let GL = null, work = null, lines = null, wetc = null;
const timings = [];
function paint(tag, time) {
  const t0 = performance.now(), T = Object.assign({}, TIMES[time] || TIMES.golden);
  if (!SCENES[tag]) tag = 'Ideas';
  if (!work) { work = canvas(W, H); lines = canvas(W, H); wetc = canvas(W / 2, H / 2); }
  const wc2 = wetc.getContext('2d'); wc2.setTransform(1, 0, 0, 1, 0, 0); wc2.fillStyle = '#000'; wc2.fillRect(0, 0, W / 2, H / 2);
  const lc = lines.getContext('2d'); lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, W, H); lc.globalAlpha = 1;
  const ctx = work.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#F4ECDE'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  SCENES[tag](painter(ctx, mb(SEEDS[tag] * 7919 + 13), T, lc, wc2));
  const t1 = performance.now(), out = canvas(W, H), o = out.getContext('2d');
  if (GL) o.drawImage(GL.run(work, lines, wetc, T, SEEDS[tag] * 1.37 + (time === 'night' ? 3 : time === 'morning' ? 1 : 2), OPT), 0, 0);
  else { o.drawImage(work, 0, 0); o.drawImage(lines, 0, 0); o.globalCompositeOperation = 'multiply'; o.drawImage(SBArt.paper(1024), 0, 0, W, H); }
  const t2 = performance.now(); timings.push({ tag, time, compose: t1 - t0, paint: t2 - t1 });
  return out;
}
const cache = {}, lcache = {};
let pcache = {};
const SBArt = {
  ready: new Promise(r => setTimeout(r, 0)).then(() => { try { GL = makeGL(); GL.run(canvas(8, 8), canvas(8, 8), canvas(8, 8), TIMES.golden, 1, OPT); } catch (e) { console.warn(e.message); GL = null; } return true; }), // warm-up compiles every program now, not on the first cover
  cover(tag, { time = 'golden' } = {}) { const k = tag + '|' + time; return cache[k] || (cache[k] = SBArt.ready.then(() => paint(tag, time))); },
  linen(hex = '#A9C8EE', size = 512) { const k = hex + size; return lcache[k] || (lcache[k] = linen(hex, size)); },
  paper(size = 1024) { return pcache[size] || (pcache[size] = paper(size)); },
  timeNow() { const h = new Date().getHours(); return h >= 20 || h < 6 ? 'night' : h >= 16 ? 'golden' : 'morning'; },
  // lab hooks
  _paint: paint, _timings: timings, _opt: OPT, get _gl() { return GL ? (GL.aniso ? 'webgl2+aniso' : 'webgl2') : '2d-fallback'; },
};
window.SBArt = SBArt;
})();
