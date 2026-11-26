/* Softbound v3: the light pull. A brass ball-chain hangs from a little ceiling rosette; on its end, a hand-blown glass globe holds a tiny
   landscape of the NEXT time of day on a turning sky-wheel (a clock's moon-phase window, as a pendant). Pull it past the click (or tap /
   Enter) → SB.cycleTime(). Beads ratchet out of the fitting, the globe flares, the chain zips back and swings.
   Canvas2D, redrawn only while something moves. Talks to the scene only through window.SB. Loaded after scene.js. */
(function () {
  'use strict';
  const SB = window.SB; if (!SB || !SB.screenEl) return;
  const screenEl = SB.screenEl, homeEl = screenEl.querySelector('.sb-home') || screenEl;
  const QS = new URLSearchParams(location.search);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || QS.has('rm');
  const hap = k => { try { window.SBHaptics && SBHaptics[k] && SBHaptics[k](); } catch (e) {} };
  const snd = (n, o) => { try { window.SBSound && SBSound.play(n, o || {}); } catch (e) {} };
  const TN = ['morning', 'golden', 'night'], NAME = ['morning', 'golden hour', 'night'];
  const tIdx = t => Math.max(0, TN.indexOf(t));

  /* ---------- geometry, in phone-screen px ---------- */
  const CX = 272, Y0 = 9, LT = 126, N = 18, SEG = LT / N;   // chain exits the fitting at (CX,Y0)
  const BR = 1.8, SP = 4.4;                                  // bead radius, bead pitch
  const RG = 16, CAP = 10;                                   // globe radius, ring-top → globe-top
  const PULL = 24, FMAX = 44;                                // detent and max travel of the switch spring
  const G = 2600, PAN = CX / 195 - 1;
  const OX = 112, W = 278, H = 350;                          // canvas covers x 112–390, y 0–350

  /* ---------- light per time of day (lerped while the scene changes) ---------- */
  const PAL = [
    {lx: .5, ly: -.86, hi: [255, 251, 236], mid: [208, 170, 100], lo: [92, 66, 32], sh: [62, 52, 66], shA: .2, shX: -6, shY: 10, glow: 0, day: 1, win: [255, 255, 255], acc: [236, 246, 255]},
    {lx: .9, ly: -.44, hi: [255, 236, 190], mid: [226, 162, 80], lo: [104, 56, 24], sh: [118, 52, 30], shA: .25, shX: -8, shY: 8, glow: 0, day: 1, win: [255, 228, 180], acc: [255, 196, 120]},
    {lx: -.45, ly: -.89, hi: [236, 204, 158], mid: [122, 94, 62], lo: [34, 24, 16], sh: [12, 6, 14], shA: .12, shX: 5, shY: 9, glow: 1, day: 0, win: [255, 214, 160], acc: [255, 214, 150]}
  ];
  /* the little world inside the globe, per time it shows */
  const SKY = [
    {top: [96, 164, 230], mid: [156, 204, 242], hor: [236, 246, 250], back: [170, 204, 152], front: [112, 156, 108]},
    {top: [116, 70, 140], mid: [238, 118, 96], hor: [255, 204, 124], back: [186, 98, 94], front: [118, 54, 72]},
    {top: [8, 12, 40], mid: [22, 30, 82], hor: [52, 62, 130], back: [40, 44, 88], front: [16, 18, 44]}
  ];
  const STARS = [[-.5, -.52, .9], [-.14, -.74, .7], [.3, -.62, .8], [.56, -.28, .6], [-.66, -.12, .6], [.12, -.36, .5], [-.3, -.26, .55], [.6, -.56, .45], [-.02, -.55, .4]];
  const mix = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a === undefined ? 1 : +a.toFixed(3)})`;
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function palMix(a, b, t) { const o = {}; for (const k in a) o[k] = Array.isArray(a[k]) ? mixc(a[k], b[k], t) : mix(a[k], b[k], t); return o; }

  /* ---------- DOM ---------- */
  const st = document.createElement('style');
  st.textContent = `#screen .sb-cord{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2;transition:opacity .4s}
#screen .sb-cord canvas{position:absolute;left:${OX}px;top:0;width:${W}px;height:${H}px;pointer-events:none}
#screen .sb-cord-glow{position:absolute;left:0;top:0;width:190px;height:190px;margin:-95px 0 0 -95px;pointer-events:none;opacity:0;transition:opacity 1.4s}
#screen .sb-cord-glow::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(closest-side,rgba(255,222,150,.5),rgba(255,196,116,.2) 38%,rgba(255,170,90,.07) 66%,rgba(255,160,80,0))}
#screen[data-time="night"] .sb-cord-glow{opacity:1}
#screen[data-time="night"] .sb-cord-glow::after{animation:sbCordBreath 3.6s ease-in-out infinite alternate}
@keyframes sbCordBreath{from{opacity:.72;transform:scale(.93)}to{opacity:1;transform:scale(1.04)}}
@media (prefers-reduced-motion:reduce){#screen .sb-cord-glow::after{animation:none!important}}
#screen .sb-cord-hit{all:unset;box-sizing:border-box;position:absolute;left:0;top:0;width:48px;height:48px;margin:-24px 0 0 -24px;pointer-events:auto;cursor:grab;touch-action:none;border-radius:50%;-webkit-tap-highlight-color:transparent}
#screen .sb-cord-hit:active{cursor:grabbing}
#screen .sb-cord-hit:focus-visible{outline:2px solid var(--ink);outline-offset:1px}
#screen.overview .sb-cord{opacity:0}
#screen.overview .sb-cord-hit{pointer-events:none}`;
  document.head.appendChild(st);
  const wrap = document.createElement('div'); wrap.className = 'sb-cord';
  wrap.innerHTML = `<div class="sb-cord-glow" aria-hidden="true"></div><canvas aria-hidden="true"></canvas><button class="sb-cord-hit"></button>`;
  homeEl.appendChild(wrap);
  const glowEl = wrap.querySelector('.sb-cord-glow'), cv = wrap.querySelector('canvas'), hit = wrap.querySelector('.sb-cord-hit');
  const ctx = cv.getContext('2d');
  let dpr = 1;
  function size() {
    const r = screenEl.getBoundingClientRect(), k = r.width / 390 || 1;
    dpr = Math.min(3, Math.max(1, (window.devicePixelRatio || 1) * k));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); beadFor = null; draw();
  }

  /* ---------- state ---------- */
  const P = Array.from({length: N + 1}, (_, i) => ({x: CX, y: Y0 + i * SEG, px: CX, py: Y0 + i * SEG}));
  let feed = 0, fv = 0, kick = 0, clicked = false, drag = null, auto = null, ang = 0, angV = 0;
  let shown = tIdx(SB.time), base = shown, w = base + .75, wv = 0, wHoldUntil = 0, pullK = 0;
  let pal = PAL[shown], palFrom = pal, palTo = shown, palT = 1;
  let flare = 0, flareC = PAL[shown].acc, sparks = [], clock = 0, lastFeedBead = 0, lastTick = 0, lastSwingSign = 0, lastGlint = 0;
  let windUntil = 0, wind = 0, un = null, still = 0, touched = false;
  const nextIdx = () => (shown + 1) % 3;
  function label() { hit.setAttribute('aria-label', `Light pull: pull for ${NAME[nextIdx()]}. Changes the light: morning, golden hour, night.`); }
  label();

  /* ---------- sprites (cached; the bead sprite re-renders only while the light itself is changing) ---------- */
  let beadFor = null, beadCv = null, underCv = null;
  function sprite(r, paint) { const c = document.createElement('canvas'), s = Math.ceil((r * 2 + 2) * dpr); c.width = c.height = s; const g = c.getContext('2d'); g.scale(dpr, dpr); g.translate(r + 1, r + 1); paint(g, r); return c; }
  function beadSprite() {
    if (beadFor === pal && beadCv) return beadCv; beadFor = pal;
    beadCv = sprite(BR, (g, r) => {
      const gr = g.createRadialGradient(pal.lx * r * .42, pal.ly * r * .42, 0, 0, 0, r);
      gr.addColorStop(0, rgba(pal.hi)); gr.addColorStop(.3, rgba(mixc(pal.hi, pal.mid, .6))); gr.addColorStop(.62, rgba(pal.mid)); gr.addColorStop(1, rgba(pal.lo));
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    });
    underCv = underCv || sprite(BR, (g, r) => { // lit from below by the glowing globe (night)
      const gr = g.createRadialGradient(0, r * .55, 0, 0, r * .3, r); gr.addColorStop(0, 'rgba(255,230,170,.95)'); gr.addColorStop(.5, 'rgba(255,186,100,.45)'); gr.addColorStop(1, 'rgba(255,170,90,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    });
    return beadCv;
  }

  /* ---------- drawing ---------- */
  const pts = []; // chain polyline: inside the fitting → exit → simulated nodes
  function chainPoly() {
    pts.length = 0; pts.push(CX, Y0 - 12, CX, Y0);
    for (let i = 0; i <= N; i++) pts.push(P[i].x, P[i].y);
    return pts;
  }
  function beadsAlong(cb) { // walk from the pendant end upward, one bead every SP px (beads ride with the chain material)
    let j = pts.length - 2, s = 2.6, segS = 0;
    while (j >= 2) {
      const ax = pts[j], ay = pts[j + 1], bx = pts[j - 2], by = pts[j - 1], L = Math.hypot(bx - ax, by - ay) || 1e-6;
      while (s - segS <= L) { const t = (s - segS) / L; cb(ax + (bx - ax) * t, ay + (by - ay) * t); s += SP; }
      segS += L; j -= 2;
    }
  }
  function globeCenter() { const H_ = P[N], d = CAP + RG; return [H_.x - Math.sin(ang) * d, H_.y + Math.cos(ang) * d]; }

  function drawShadows(gx, gy) {
    const sx = pal.shX, sy = pal.shY, a = pal.shA;
    ctx.save(); ctx.translate(sx, sy);
    ctx.lineJoin = ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pts[2], pts[3] + 4); for (let i = 4; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.strokeStyle = rgba(pal.sh, a * .22); ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = rgba(pal.sh, a * .3); ctx.lineWidth = 1.6; ctx.stroke();
    let g = ctx.createRadialGradient(gx, gy, RG * .3, gx, gy, RG * 1.45);
    g.addColorStop(0, rgba(pal.sh, a * 1.25)); g.addColorStop(.62, rgba(pal.sh, a * .7)); g.addColorStop(1, rgba(pal.sh, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, RG * 1.45, 0, 7); ctx.fill();
    if (pal.day > .02) { // glass focuses the sun: a bright caustic inside its own shadow, tinted by the world in the globe
      const sk = skyNow(), cc = mixc(sk.hor, [255, 242, 206], .82), cx = gx + sx * .18, cy = gy + sy * .25;
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, RG * .62);
      g.addColorStop(0, rgba(cc, .62 * pal.day)); g.addColorStop(.35, rgba(cc, .26 * pal.day)); g.addColorStop(1, rgba(cc, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, RG * .62, 0, 7); ctx.fill();
    }
    // the rosette's shadow on the wall
    g = ctx.createRadialGradient(CX, 1, 2, CX, 1, 16); g.addColorStop(0, rgba(pal.sh, a)); g.addColorStop(1, rgba(pal.sh, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(CX, 1, 16, 11, 0, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawChain(gx, gy) {
    ctx.strokeStyle = rgba(pal.lo, .9); ctx.lineWidth = .7; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke();
    const bs = beadSprite(), d = BR * 2 + 2, gl = pal.glow * (1 + pullK * .6 + flare);
    beadsAlong((x, y) => {
      if (y < Y0 - 1) return;
      ctx.drawImage(bs, x - BR - 1, y - BR - 1, d, d);
      if (gl > .02) { const k = Math.max(0, 1 - Math.hypot(x - gx, y - gy) / 75); if (k > 0) { ctx.globalAlpha = Math.min(1, gl * k * k); ctx.drawImage(underCv, x - BR - 1, y - BR - 1, d, d); ctx.globalAlpha = 1; } }
    });
  }

  function brass(x0, y0, x1, y1) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(pal.lo)); g.addColorStop(.45, rgba(pal.mid)); g.addColorStop(.72, rgba(pal.hi)); g.addColorStop(1, rgba(pal.mid)); return g; }
  function drawFitting() {
    const jolt = kick * .25;
    ctx.save(); ctx.translate(0, jolt);
    // collar the chain runs through
    ctx.fillStyle = brass(CX - 3.4, 0, CX + 3.4, 0); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(CX - 3.4, 3, 6.8, Y0 - 1.6, 1.4) : ctx.rect(CX - 3.4, 3, 6.8, Y0 - 1.6); ctx.fill();
    ctx.fillStyle = rgba(pal.lo, .8); ctx.fillRect(CX - 3.4, Y0 - 1.2, 6.8, .8);
    ctx.fillStyle = rgba(pal.lo); ctx.beginPath(); ctx.ellipse(CX, Y0 + .6, 1.6, .7, 0, 0, 7); ctx.fill();
    // the rosette: a turned brass dome peeking from the ceiling
    const g = ctx.createRadialGradient(CX + pal.lx * 6, -2 + pal.ly * 4, .5, CX, -2, 14);
    g.addColorStop(0, rgba(pal.hi)); g.addColorStop(.35, rgba(pal.mid)); g.addColorStop(1, rgba(pal.lo));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(CX, -1.5, 12.5, 7.5, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = rgba(pal.lo, .55); ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(CX, -1.5, 9, 5, 0, .15, Math.PI - .15); ctx.stroke();
    ctx.strokeStyle = rgba(pal.hi, .55 * (.4 + .6 * pal.day)); ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(CX, -1.5, 12, 7, 0, .25, 1.1); ctx.stroke();
    ctx.restore();
  }

  function skyNow() { const f = w - Math.floor(w), i0 = ((Math.floor(w) % 3) + 3) % 3, t = sstep(.15, .7, f), a = SKY[i0], b = SKY[(i0 + 1) % 3];
    return {top: mixc(a.top, b.top, t), mid: mixc(a.mid, b.mid, t), hor: mixc(a.hor, b.hor, t), back: mixc(a.back, b.back, t), front: mixc(a.front, b.front, t), night: (i0 === 2 ? 1 - t : 0) + (i0 === 1 ? t : 0)}; }

  function drawWorld(sk, r) { // in the globe's rotating frame, already clipped to the glass
    const g = ctx.createLinearGradient(0, -r, 0, r * .4); g.addColorStop(0, rgba(sk.top)); g.addColorStop(.55, rgba(sk.mid)); g.addColorStop(1, rgba(sk.hor));
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
    if (sk.night > .02) { ctx.fillStyle = '#FFF6E0'; for (const [x, y, s] of STARS) { ctx.globalAlpha = sk.night * (.55 + .45 * Math.sin(clock * 3 + x * 9)); ctx.beginPath(); ctx.arc(x * r, y * r, .32 + s * .38, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
    for (let k = 0; k < 3; k++) { // the sky-wheel: morning sun, golden sun, moon
      let phi = ((w - k) / 3 % 1 + 1) % 1; if (phi > .5) phi -= 1; phi *= Math.PI * 2;
      if (Math.abs(phi) > 1.75) continue;
      const peak = [-.4, -.04, -.34][k], x = Math.sin(phi) * r * 1.05, y = (peak + (1 - Math.cos(phi)) * 1.3) * r;
      if (k === 0) {
        let gg = ctx.createRadialGradient(x, y, 0, x, y, r * .7); gg.addColorStop(0, 'rgba(255,250,220,.95)'); gg.addColorStop(.3, 'rgba(255,240,180,.4)'); gg.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r * .7, 0, 7); ctx.fill();
        ctx.fillStyle = '#FFFCEE'; ctx.beginPath(); ctx.arc(x, y, r * .19, 0, 7); ctx.fill();
      } else if (k === 1) {
        let gg = ctx.createRadialGradient(x, y, 0, x, y, r * .95); gg.addColorStop(0, 'rgba(255,214,140,.9)'); gg.addColorStop(.4, 'rgba(255,160,90,.35)'); gg.addColorStop(1, 'rgba(255,140,80,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r * .95, 0, 7); ctx.fill();
        gg = ctx.createLinearGradient(x, y - r * .36, x, y + r * .36); gg.addColorStop(0, '#FFF0B8'); gg.addColorStop(1, '#FF9C5C');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r * .36, 0, 7); ctx.fill();
        ctx.fillStyle = rgba(sk.mid, .35); for (let b = 0; b < 2; b++) ctx.fillRect(x - r * .4, y + r * (.06 + b * .13), r * .8, r * .045); // heat bands across the low sun
      } else {
        let gg = ctx.createRadialGradient(x, y, 0, x, y, r * .7); gg.addColorStop(0, 'rgba(220,226,255,.45)'); gg.addColorStop(1, 'rgba(200,210,255,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r * .7, 0, 7); ctx.fill();
        ctx.fillStyle = '#FFF4D8'; ctx.beginPath(); ctx.arc(x, y, r * .22, 0, 7); ctx.fill();
        const cg = ctx.createLinearGradient(0, -r, 0, r * .4); cg.addColorStop(0, rgba(sk.top)); cg.addColorStop(.55, rgba(sk.mid)); cg.addColorStop(1, rgba(sk.hor));
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(x + r * .11, y - r * .07, r * .2, 0, 7); ctx.fill(); // bite the crescent with the sky itself
      }
    }
    // rolling hills, and a cottage whose window lights up at night
    ctx.fillStyle = rgba(sk.back); ctx.beginPath(); ctx.moveTo(-r, r * .3); ctx.quadraticCurveTo(-r * .45, -r * .02, r * .1, r * .26); ctx.quadraticCurveTo(r * .55, r * .12, r, r * .2); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.fill();
    ctx.fillStyle = rgba(sk.front); ctx.beginPath(); ctx.moveTo(-r, r * .52); ctx.quadraticCurveTo(-r * .1, r * .26, r * .5, r * .4); ctx.quadraticCurveTo(r * .8, r * .46, r, r * .5); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.fill();
    const hx = r * .3, hy = r * .37;
    ctx.beginPath(); ctx.moveTo(hx - r * .13, hy); ctx.lineTo(hx - r * .13, hy - r * .12); ctx.lineTo(hx, hy - r * .24); ctx.lineTo(hx + r * .13, hy - r * .12); ctx.lineTo(hx + r * .13, hy); ctx.fill();
    if (sk.night > .05) { ctx.fillStyle = `rgba(255,206,120,${(sk.night * .95).toFixed(2)})`; ctx.fillRect(hx - r * .045, hy - r * .1, r * .09, r * .08); }
  }

  function drawGlobe(gx, gy) {
    const r = RG, sk = skyNow();
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(ang);
    // brass cap with flutes and the ring the chain hooks into
    const capY = -r - CAP;
    ctx.strokeStyle = brass(-3, 0, 3, 0); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0, capY + 2.6, 2.2, 0, 7); ctx.stroke();
    ctx.fillStyle = brass(-5.5, 0, 5.5, 0); ctx.beginPath(); ctx.moveTo(-3, capY + 4.6); ctx.lineTo(3, capY + 4.6); ctx.quadraticCurveTo(5.8, -r - 1, 6.2, -r + 2.4); ctx.quadraticCurveTo(0, -r + .4, -6.2, -r + 2.4); ctx.quadraticCurveTo(-5.8, -r - 1, -3, capY + 4.6); ctx.fill();
    ctx.strokeStyle = rgba(pal.lo, .5); ctx.lineWidth = .5; ctx.beginPath(); for (const fx of [-2.6, 0, 2.6]) { ctx.moveTo(fx * .55, capY + 5.2); ctx.lineTo(fx, -r + 1.2); } ctx.stroke();
    // the hand-blown nub at the bottom
    ctx.fillStyle = `rgba(255,252,244,${(.5 + .3 * pal.day).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(0, r + .4, 1.5, 1.3, 0, 0, 7); ctx.fill();
    // the world inside
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - .4, 0, 7); ctx.clip();
    drawWorld(sk, r);
    if (pullK > 0 || flare > 0) { ctx.fillStyle = `rgba(255,248,228,${Math.min(.5, pullK * .16 + flare * .42).toFixed(3)})`; ctx.fillRect(-r, -r, r * 2, r * 2); }
    // glass: refraction darkens the edge; the light falls through and gathers on the far inner wall
    let g = ctx.createRadialGradient(0, 0, r * .55, 0, 0, r); g.addColorStop(0, 'rgba(20,12,30,0)'); g.addColorStop(1, `rgba(20,12,30,${(.34 - .14 * pal.glow).toFixed(2)})`);
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.rotate(-ang); // highlights stay with the light, not with the swing
    const la = Math.atan2(pal.ly, pal.lx);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(255,252,240,${(.42 * (.35 + .65 * pal.day) + pal.glow * .1).toFixed(3)})`; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(0, 0, r * .8, la + Math.PI - .75, la + Math.PI + .75); ctx.stroke();
    ctx.strokeStyle = rgba(pal.lo, .42); ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(0, 0, r + .1, 0, 7); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${(.75 * (.4 + .6 * pal.day)).toFixed(3)})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(0, 0, r - .5, la - .85, la + .85); ctx.stroke();
    // the studio window, reflected in the glass (the lamp, at night)
    const wx = pal.lx * r * .56, wy = pal.ly * r * .56;
    if (pal.day > .02) {
      ctx.save(); ctx.translate(wx, wy); ctx.rotate((la + Math.PI / 2) * .3); ctx.fillStyle = rgba(pal.win, .5 * pal.day);
      const pw = r * .11, ph = r * .14, gp = r * .04;
      for (const [ix, iy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { ctx.beginPath(); ctx.rect(ix * (pw + gp) + gp / 2, iy * (ph + gp) + gp / 2, pw, ph); ctx.fill(); }
      ctx.restore();
    }
    if (pal.glow > .02) { g = ctx.createRadialGradient(wx, wy, 0, wx, wy, r * .2); g.addColorStop(0, `rgba(255,236,200,${(.85 * pal.glow).toFixed(2)})`); g.addColorStop(1, 'rgba(255,220,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(wx, wy, r * .2, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(pal.lx * r * .7, pal.ly * r * .7, .9, 0, 7); ctx.fill();
    ctx.restore();
  }

  function star4(x, y, s, a, c) {
    if (a <= .01 || s <= .1) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, s * 1.1); g.addColorStop(0, rgba(c, a * .7)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 1.1, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.beginPath();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (dx + dy) * s * .09, y + (dy - dx) * s * .09, x + dx * s, y + dy * s); ctx.quadraticCurveTo(x + (dx - dy) * s * .09, y + (dy + dx) * s * .09, x, y); }
    ctx.fill();
  }

  function drawFlare(gx, gy) {
    if (flare <= .005) return;
    const f = flare, u = 1 - f, c = flareC;
    let g = ctx.createRadialGradient(gx, gy, RG * .6, gx, gy, RG * (2.2 + 1.6 * u));
    g.addColorStop(0, rgba(c, .55 * f)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, RG * (2.2 + 1.6 * u), 0, 7); ctx.fill();
    const rr = RG + 118 * Math.pow(u, .55); // the light leaves the globe and sweeps into the room
    ctx.strokeStyle = rgba(c, .36 * f * f); ctx.lineWidth = .8 + 4 * f; ctx.beginPath(); ctx.arc(gx, gy, rr, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(u * .6); ctx.strokeStyle = rgba(c, .45 * f); ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, l0 = RG * 1.25, l1 = RG * (1.6 + (i % 2 ? .6 : 1.4) * (.4 + u * 1.6)); ctx.moveTo(Math.cos(a) * l0, Math.sin(a) * l0); ctx.lineTo(Math.cos(a) * l1, Math.sin(a) * l1); }
    ctx.stroke(); ctx.restore();
  }

  function draw() {
    if (!cv.width) return;
    ctx.setTransform(dpr, 0, 0, dpr, -OX * dpr, 0); ctx.clearRect(OX, 0, W, H);
    chainPoly();
    const [gx, gy] = globeCenter();
    drawShadows(gx, gy);
    drawChain(gx, gy);
    drawFitting();
    drawGlobe(gx, gy);
    drawFlare(gx, gy);
    for (const s of sparks) { const e = Math.sin(Math.PI * Math.min(1, s.t)); star4(gx + s.x, gy + s.y, s.s * e, e, s.c); }
    glowEl.style.transform = `translate(${gx.toFixed(1)}px,${gy.toFixed(1)}px) scale(${(1 + pullK * .35 + flare * .7).toFixed(3)})`;
    hit.style.transform = `translate(${gx.toFixed(1)}px,${gy.toFixed(1)}px)`;
  }

  /* ---------- physics: Verlet chain, a heavy pendant, the switch spring in the fitting, a sky-wheel spring ---------- */
  const rub = e => FMAX * (1 - Math.exp(-e / FMAX));
  function sub(h) {
    const ax = wind, gy_ = G * h * h, damp = Math.exp(-h * .85);
    if (drag) {
      const dx = drag.x - CX, dy = drag.y - Y0, d = Math.hypot(dx, dy) || 1, e = d - LT;
      const nf = e > 0 ? rub(e) : 0; fv = (nf - feed) / h; feed = nf;
      const crossed = feed + kick > PULL;
      if (crossed !== clicked) { clicked = crossed; if (clicked) { kick = 3.2; hap('selection'); snd('tick', {pitch: 1.18, gain: 1, pan: PAN}); sparkAt(-.45, -.55, 7, .9); flare = Math.max(flare, .28); flareC = PAL[nextIdx()].acc; } else snd('tick', {pitch: .85, gain: .4, pan: PAN}); }
      const axx = CX, ayy = Y0 + feed + kick, ddx = drag.x - axx, ddy = drag.y - ayy, dd = Math.hypot(ddx, ddy) || 1, L = Math.min(dd, LT);
      const tx = axx + ddx / dd * L, ty = ayy + ddy / dd * L, p = P[N];
      p.px = p.x; p.py = p.y; p.x = tx; p.y = ty;
    } else {
      fv += (-700 * feed - 40 * fv) * h; feed += fv * h; // a firm, damped switch spring: a little hop, not a launch
      if (feed < 0) { if (fv < -120) clink(Math.min(1, -fv / 900)); feed = 0; fv = 0; }
    }
    kick *= Math.exp(-h * 14);
    const A = P[0]; A.x = A.px = CX; A.y = A.py = Y0 + feed + (drag ? kick : 0);
    for (let i = 1; i <= N; i++) {
      if (drag && i === N) continue;
      const p = P[i], vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
      p.px = p.x; p.py = p.y; p.x += vx + ax * (i / N) * h * h; p.y += vy + gy_;
    }
    for (let it = 0; it < 28; it++) for (let jj = 0; jj < N; jj++) {
      const i = it & 1 ? N - 1 - jj : jj, a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
      if (d <= SEG && i < N - 1) continue; // a chain can go slack, it just can't stretch
      const wa = i === 0 ? 0 : 1, wb = i + 1 === N ? (drag ? 0 : .3) : 1, s = wa + wb; if (!s) continue;
      const f = (d - SEG) / d / s; a.x += dx * f * wa; a.y += dy * f * wa; b.x -= dx * f * wb; b.y -= dy * f * wb;
    }
    if (drag) { const A2 = P[0], p2 = P[N], dl = Math.hypot(p2.x - A2.x, p2.y - A2.y); if (dl > LT * .97) { const k = Math.min(1, (dl / LT - .97) / .03) * .6; // held taut: pull the links into line
      for (let i = 1; i < N; i++) { const q2 = P[i], tx = A2.x + (p2.x - A2.x) * i / N, ty = A2.y + (p2.y - A2.y) * i / N; q2.x += (tx - q2.x) * k; q2.y += (ty - q2.y) * k; } } }
    // the globe hangs from its ring and lags the chain a little (a second, smaller pendulum)
    const q = drag ? P[0] : P[N - 1], p = P[N], target = Math.atan2(-(p.x - q.x), p.y - q.y);
    angV += ((target - ang) * 300 - angV * 9) * h; ang += angV * h;
    // the sky-wheel
    const wt = clock < wHoldUntil ? w : base + .75 + .25 * Math.min(1, pullK);
    if (drag || auto) { wv += ((wt - w) * 420 - wv * 34) * h; } else wv += ((wt - w) * 70 - wv * 11) * h;
    w += wv * h;
  }
  function energy() { let e = 0; for (let i = 1; i <= N; i++) { const p = P[i]; e += (p.x - p.px) ** 2 + (p.y - p.py) ** 2; } return e; }
  function clink(k) { const now = performance.now(); if (now - lastTick < 22) return; lastTick = now; snd('tick', {pitch: 2.3 + Math.random() * .7, gain: .1 + .25 * k, pan: PAN}); }
  function sparkAt(ux, uy, s, a) { sparks.push({x: ux * RG, y: uy * RG, s, t: 0, c: [255, 246, 220], a}); }

  function step(dt) {
    dt = Math.min(dt, 1 / 30); clock += dt;
    if (palT < 1) { palT = Math.min(1, palT + dt / 1.4); const e = palT * palT * (3 - 2 * palT); pal = palMix(palFrom, PAL[palTo], e); if (palT >= 1) pal = PAL[palTo]; }
    if (clock < windUntil) { const v = (SB.state && SB.state.vel) || 0; wind += (-v * 75 - wind) * Math.min(1, dt * 6); if (Math.abs(v) > .05) windUntil = Math.max(windUntil, clock + .4); } else wind *= .9;
    if (auto) autoStep(dt);
    pullK = Math.max(0, Math.min(1.15, (feed + kick) / PULL));
    if (RM && !drag && !auto) { settleRM(); draw(); stop(); return; }
    const h = dt / 2; sub(h); sub(h);
    // ratchet: a bead leaves (or re-enters) the fitting
    const fb = Math.floor(feed / SP); if (fb !== lastFeedBead) { if (drag || auto) snd('tick', {pitch: 2.6 + Math.random() * .4, gain: .12, pan: PAN}); else clink(.25); lastFeedBead = fb; }
    // swing clinks at the turn, and a glint when the glass swings into the light
    const vx = P[N].x - P[N].px, sg = Math.sign(vx); if (sg && sg !== lastSwingSign) { if (Math.abs(P[N].x - CX) > 5 && !drag) clink(Math.min(1, Math.abs(P[N].x - CX) / 40)); lastSwingSign = sg; }
    if (pal.day > .5 && !drag && Math.abs(vx) > .35 && ang < -.02 && clock - lastGlint > .9) { lastGlint = clock; sparkAt(pal.lx * .55, pal.ly * .55, 6.5, 1); }
    flare = Math.max(0, flare - dt * (flare > .3 ? 1.25 : 1.8));
    for (const s of sparks) s.t += dt / .55; sparks = sparks.filter(s => s.t < 1);
    draw();
    const busy = drag || auto || palT < 1 || flare > 0 || sparks.length || clock < windUntil || clock < wHoldUntil + .05 || Math.abs(wind) > .5;
    still = !busy && energy() < .0004 && Math.abs(feed) < .02 && Math.abs(angV) < .01 && Math.abs(w - (base + .75)) < .002 && Math.abs(wv) < .01 ? still + 1 : 0;
    if (still > 20) stop();
  }
  function settleRM() { // reduced motion: no swing, no recoil; just the right state, at once
    feed = fv = kick = 0; clicked = false; pullK = 0; flare = 0; sparks = []; wind = 0; ang = angV = 0; w = base + .75; wv = 0; pal = PAL[palTo]; palT = 1;
    for (let i = 0; i <= N; i++) { P[i].x = P[i].px = CX; P[i].y = P[i].py = Y0 + i * SEG; }
  }
  function stop() { if (un) { un(); un = null; } still = 0; }
  function run() { still = 0; if (!un) un = SB.onTick(step); SB.requestFrame(); }

  /* ---------- the pull ---------- */
  function fire() {
    touched = true; clicked = false;
    flare = 1; flareC = PAL[nextIdx()].acc; wHoldUntil = clock + .6;
    SB.cycleTime(); // the scene plays its own detent tick + selection haptic
    hap('medium'); snd('pop', {pitch: 1.55, gain: .3, pan: PAN});
    for (let i = 0; i < 3; i++) sparks.push({x: (Math.random() - .5) * RG * 1.2, y: (Math.random() - .7) * RG, s: 5 + Math.random() * 4, t: -i * .18, c: flareC});
    sparkAt(pal.lx * .55, pal.ly * .55, 9, 1);
  }
  function release(velX) {
    const was = clicked; drag = null;
    if (velX) { P[N].px -= velX; }
    if (was) { fire(); const side = velX ? Math.sign(velX) : (P[N].x < CX ? -1 : 1); nudge(-side * .5, 0); } else clicked = false;
    run();
  }
  function autoStep(dt) { // tap / Enter: a scripted tug — down to the click, a beat, let go
    auto.t += dt; const t = auto.t, down = .16, hold = .07;
    const want = t < down ? (PULL + 6) * (1 - Math.pow(1 - t / down, 3)) : PULL + 6;
    const e = -FMAX * Math.log(1 - Math.min(.97, want / FMAX));
    drag = {x: CX + (P[N].x - CX) * .5, y: Y0 + LT + e};
    if (t > down + hold) { auto = null; release(0); }
  }
  function startAuto() { if (auto || drag) return; touched = true; if (RM) { SB.cycleTime(); hap('medium'); return; } auto = {t: 0}; hap('selection'); run(); }

  const local = e => { const r = screenEl.getBoundingClientRect(), k = r.width / 390; return {x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k}; };
  let down0 = null, grab = null, hist = [];
  hit.addEventListener('pointerdown', e => {
    if (auto) return; e.preventDefault(); e.stopPropagation(); try { hit.setPointerCapture(e.pointerId); } catch (er) {}
    const m = local(e); down0 = {x: m.x, y: m.y, t: performance.now(), moved: 0}; grab = {x: m.x - P[N].x, y: m.y - P[N].y}; hist = [];
    drag = {x: P[N].x, y: P[N].y}; touched = true; clicked = false; hap('selection'); snd('tick', {pitch: 2.1, gain: .14, pan: PAN}); run();
  });
  hit.addEventListener('pointermove', e => {
    if (!drag || !down0 || auto) return; const m = local(e);
    down0.moved = Math.max(down0.moved, Math.hypot(m.x - down0.x, m.y - down0.y));
    drag = {x: m.x - grab.x, y: m.y - grab.y}; hist.push({x: m.x, t: performance.now()}); if (hist.length > 5) hist.shift(); run();
  });
  const end = e => {
    if (!down0 || auto) return; const d = down0; down0 = null;
    if (e.type === 'pointerup' && d.moved < 6 && performance.now() - d.t < 450) { drag = null; startAuto(); return; }
    let vx = 0; if (hist.length > 1) { const a = hist[0], b = hist[hist.length - 1]; vx = (b.x - a.x) / Math.max(16, b.t - a.t) * 8; } // px per substep
    if (e.type === 'pointercancel') clicked = false;
    release(Math.max(-4, Math.min(4, vx)));
  };
  hit.addEventListener('pointerup', end); hit.addEventListener('pointercancel', end);
  hit.addEventListener('click', e => { if (e.detail === 0) startAuto(); }); // keyboard (Enter / Space)

  /* ---------- the world answers: time changes (from here or anywhere), shelf spins, taps nearby ---------- */
  new MutationObserver(() => {
    const ni = tIdx(screenEl.dataset.time); if (ni === shown) return;
    base += (ni - shown + 3) % 3; shown = ni; label();
    palFrom = pal; palTo = ni; palT = RM ? 1 : 0; if (RM) pal = PAL[ni];
    run();
  }).observe(screenEl, {attributes: true, attributeFilter: ['data-time']});
  const nudge = (vx, vy) => { if (RM) return; for (let i = 1; i <= N; i++) { const k = i / N; P[i].px -= vx * k; P[i].py -= vy * k; } run(); };
  screenEl.addEventListener('pointerdown', e => {
    if (e.target === hit) return;
    windUntil = Math.max(windUntil, clock + 1.6); if (!RM) run();
    const m = local(e), [gx, gy] = globeCenter(), dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy);
    if (d < 85 && d > 1) { const k = (1 - d / 85) * 1.6; nudge(dx / d * k, dy / d * k * .4); }
  }, {capture: true, passive: true});
  ['pointerup', 'wheel', 'keydown'].forEach(ev => screenEl.addEventListener(ev, () => { if (RM) return; windUntil = Math.max(windUntil, clock + 1.6); run(); }, {capture: true, passive: true}));

  // one gentle invitation after the opening demo: a swing, a glint, the next sky peeks up. Never again.
  if (!RM) {
    let sawAP = false, polls = 0;
    const iv = setInterval(() => {
      const ap = !!(SB.state && SB.state.autoplaying); polls++;
      if (ap && !sawAP) { sawAP = true; windUntil = clock + 9; run(); }
      if ((sawAP && !ap) || polls > 60) {
        clearInterval(iv); if (!sawAP || touched) return;
        setTimeout(() => { if (touched) return; nudge(-.55, 0); wv += 1.1; sparkAt(pal.lx * .55, pal.ly * .55, 8, 1); setTimeout(() => clink(.3), 380); }, 900);
      }
    }, 500);
  }

  addEventListener('resize', size);
  size();
})();
