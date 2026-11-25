/* Softbound v3: the book as an object. Exposes window.SBBook (see CONTRACT.md).
   Book space: origin at the bottom of the spine, centred in depth. The book stands upright,
   the front cover faces +z, the spine is at x=0 and the fore-edge at x=W. */
(function () {
  const T = window.THREE;
  if (!T) return;

  // ---- dimensions (world units) ----
  const W = 1.0, H = 1.4, D = 0.28, CT = 0.056, OV = 0.026; // board thickness, overhang
  const HX = 0.05, BX0 = 0.06, BW = W - BX0;                   // hinge x, board start, board width
  const SPW = 0.05;                                            // spine thickness (x)
  const PX0 = 0.066, PX1 = W - OV, PY0 = OV, PY1 = H - OV;     // page block
  const PZ0 = -D / 2 + CT + 0.002, PZ1 = D / 2 - CT - 0.002;
  const PW = PX1 - PX0, PH = PY1 - PY0, NP = 4;
  // The right page in CSS px. open.js maps its overlay 1:1 onto this rect, so the canvas page and the DOM agree.
  // The end frame fills ~78% of the screen height with the page, so the page is 444 px wide and its outer margin
  // runs off the right of a 390 px screen: the text column (padL..DW-padR) is what stays on screen.
  const DW = 444, DH = Math.round(DW * PH / PW);
  const PAGE = { DW, DH, padL: 34, padR: 138, metaY: 40, titleY: 54, titleSize: 22, titleLH: 30, bodyY: 104, size: 15, lh: 26, footY: DH - 58, S: 2 };
  PAGE.lines = Math.floor((PAGE.footY - 10 - PAGE.bodyY) / PAGE.lh);

  const TAGS = { Travel: '#A9C8EE', Recipes: '#F5B98A', Personal: '#EFB3C2', Work: '#A8DCC4', Reading: '#F3DB8C', Ideas: '#CDBDF2' };
  const INK = '#2B2A4A';
  const lin = h => new T.Color(h).convertSRGBToLinear();
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const mix = (a, b, t) => { const A = new T.Color(a), B = new T.Color(b); return '#' + A.lerp(B, t).getHexString(); };
  const tex = (c, srgb = true, rep) => {
    const t = new T.CanvasTexture(c); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; }
    return t;
  };
  const art = () => window.SBArt;

  // Fonts: canvases redraw once these are in.
  const fontsReady = (document.fonts && document.fonts.load)
    ? Promise.all(['600 40px Newsreader', '15px Newsreader', 'italic 500 40px Newsreader', '700 20px "Bricolage Grotesque"'].map(f => document.fonts.load(f).catch(() => 0))).then(() => 0)
    : Promise.resolve();

  // ---- fallbacks when SBArt is missing ----
  function fallbackLinen(hex) {
    const N = 256, p = 8, [c, x] = cv(N, N), [cn, xn] = cv(N, N), h = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let i = 0; i < N; i++) {
      const wa = Math.pow(Math.abs(Math.sin(Math.PI * i / p)), 0.7), we = Math.pow(Math.abs(Math.sin(Math.PI * y / p)), 0.7);
      const over = ((Math.floor(i / p) + Math.floor(y / p)) & 1);
      h[y * N + i] = (over ? wa * 0.9 + we * 0.3 : we * 0.9 + wa * 0.3) + Math.random() * 0.08;
    }
    const a = x.createImageData(N, N), n = xn.createImageData(N, N), base = new T.Color(hex);
    for (let y = 0; y < N; y++) for (let i = 0; i < N; i++) {
      const k = y * N + i, hv = h[k];
      const dx = h[y * N + ((i + 1) % N)] - h[y * N + ((i + N - 1) % N)], dy = h[((y + 1) % N) * N + i] - h[((y + N - 1) % N) * N + i];
      const v = new T.Vector3(-dx * 1.4, dy * 1.4, 1).normalize();
      n.data.set([(v.x * .5 + .5) * 255, (v.y * .5 + .5) * 255, (v.z * .5 + .5) * 255, 255], k * 4);
      const s = 0.86 + hv * 0.14;
      a.data.set([base.r * 255 * s, base.g * 255 * s, base.b * 255 * s, 255], k * 4);
    }
    x.putImageData(a, 0, 0); xn.putImageData(n, 0, 0);
    return { albedo: c, normal: cn };
  }
  function fallbackPaper(size = 512) {
    const [c, x] = cv(size, size); x.fillStyle = '#F6EFE2'; x.fillRect(0, 0, size, size);
    const d = x.getImageData(0, 0, size, size);
    for (let i = 0; i < d.data.length; i += 4) { const r = (Math.random() - .5) * 7; d.data[i] += r; d.data[i + 1] += r; d.data[i + 2] += r; }
    x.putImageData(d, 0, 0);
    x.globalAlpha = .05; x.strokeStyle = '#8a7660';
    for (let i = 0; i < 160; i++) { const X = Math.random() * size, Y = Math.random() * size, a = Math.random() * 6.28, l = 4 + Math.random() * 14; x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + Math.cos(a + .6) * l * .5, Y + Math.sin(a + .6) * l * .5, X + Math.cos(a) * l, Y + Math.sin(a) * l); x.stroke(); }
    return c;
  }
  function fallbackLabel(hex) { // a soft placeholder picture: sky, sun, layered hills
    const [c, x] = cv(768, 1024), g = x.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, mix(hex, '#FFFFFF', .45)); g.addColorStop(.62, '#FBE9D6'); g.addColorStop(1, '#F6D9BE');
    x.fillStyle = g; x.fillRect(0, 0, 768, 1024);
    x.fillStyle = 'rgba(255,240,215,.9)'; x.beginPath(); x.arc(520, 360, 92, 0, 7); x.fill();
    const hill = (y, amp, col, seed) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, 1024);
      for (let i = 0; i <= 48; i++) { const X = i / 48 * 768; x.lineTo(X, y - amp * (Math.sin(i * .21 + seed) * .6 + Math.sin(i * .09 + seed * 2) * .4)); }
      x.lineTo(768, 1024); x.fill(); };
    x.filter = 'blur(1.5px)';
    hill(620, 70, mix(hex, '#B9A6D8', .55), 1); hill(720, 50, mix(hex, '#8FB7A8', .45), 3); hill(830, 40, mix(hex, '#6E9C8A', .35), 5);
    x.filter = 'none';
    return c;
  }

  // ---- geometry ----
  // Pillow height over a face: flat-ish centre, soft fall-off near the edges.
  const pill = (u, p) => Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(u)), p));
  // Rounded box with a real quarter-circle edge (m segments) and an optional pillow bulge on +z.
  function rbox(w, h, d, r, bz = 0, px = 2, py = 2, m = 4, nx = 12, ny = 16) {
    const kx = 2 * m + nx, ky = 2 * m + ny, kz = 2 * m + 1;
    const g = new T.BoxGeometry(1, 1, 1, kx, ky, kz);
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    const half = [w / 2, h / 2, d / 2], ks = [kx, ky, kz];
    const map = (c, a) => { // unit-box coord -> pre-rounding coord with a dense band near the edges
      const k = ks[a], i = Math.round((c + .5) * k), hh = half[a];
      if (i <= m) return -hh + r * (i / m);
      if (i >= k - m) return hh - r * ((k - i) / m);
      return -hh + r + (2 * hh - 2 * r) * ((i - m) / (k - 2 * m));
    };
    const p = new T.Vector3(), inn = new T.Vector3(), n = new T.Vector3();
    const ix = half[0] - r, iy = half[1] - r;
    for (let i = 0; i < P.count; i++) {
      p.set(map(P.getX(i), 0), map(P.getY(i), 1), map(P.getZ(i), 2));
      inn.set(Math.max(-ix, Math.min(ix, p.x)), Math.max(-iy, Math.min(iy, p.y)), Math.max(-(half[2] - r), Math.min(half[2] - r, p.z)));
      n.subVectors(p, inn); if (n.lengthSq() < 1e-12) n.set(0, 0, 1); n.normalize();
      p.copy(inn).addScaledVector(n, r);
      if (bz && n.z > 0) { // pillow on the front face
        const u = inn.x / ix, v = inn.y / iy, fx = pill(u, px), fy = pill(v, py), b = bz * fx * fy * n.z;
        p.z += b;
        const dfx = -px * Math.pow(Math.abs(u), px - 1) * Math.sign(u) / ix, dfy = -py * Math.pow(Math.abs(v), py - 1) * Math.sign(v) / iy;
        n.x -= bz * dfx * fy * n.z; n.y -= bz * fx * dfy * n.z; n.normalize();
      }
      P.setXYZ(i, p.x, p.y, p.z); N.setXYZ(i, n.x, n.y, n.z);
      // world-unit planar uvs (so the weave keeps its scale everywhere)
      const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      if (az >= ax && az >= ay) U.setXY(i, p.x, p.y); else if (ax >= ay) U.setXY(i, p.z, p.y); else U.setXY(i, p.x, p.z);
    }
    g.userData = { ix, iy, bz, px, py, d };
    return g;
  }
  // z of the pillowed front face at (x,y) in the box's own frame (for decals that must sit on it)
  const faceZ = (g, x, y) => { const u = g.userData; return u.d / 2 + u.bz * pill(x / u.ix, u.px) * pill(y / u.iy, u.py); };
  function decalGeo(g, w, h, cx, cy, lift, sx = 12, sy = 12) {
    const q = new T.PlaneGeometry(w, h, sx, sy), P = q.attributes.position;
    for (let i = 0; i < P.count; i++) P.setZ(i, faceZ(g, P.getX(i) + cx, P.getY(i) + cy) + lift);
    q.translate(cx, cy, 0); q.computeVertexNormals(); return q;
  }

  // ---- page-curl material: a cylinder-wrap bend (arc-length preserving) about the page's hinge ----
  const CURL_HEAD = `
uniform float uTheta; uniform float uKappa; uniform float uLead; uniform float uDip;
vec3 curlP(vec3 p, out vec3 nrm){
  float s = max(p.x, 0.0);
  float k = uKappa * (1.0 + uLead * p.y / ${(PH / 2).toFixed(4)});
  float ph = uTheta + k * s;
  vec3 q;
  if (abs(k) < 1e-4) q = vec3(s * cos(uTheta), p.y, s * sin(uTheta));
  else q = vec3((sin(ph) - sin(uTheta)) / k, p.y, (cos(uTheta) - cos(ph)) / k);
  // pages dip into the gutter when they lie flat
  float g = max(0.0, 1.0 - s / 0.085);
  float dip = uDip * (1.0 - smoothstep(0.0, 0.35, abs(uTheta)));
  q.z -= dip * g * g;
  nrm = normalize(vec3(-sin(ph) + dip * 2.0 * g / 0.085, 0.0, cos(ph)));
  return q;
}`;
  function curlMaterial(map, back, u) {
    const m = new T.MeshStandardMaterial({ map, roughness: .92, side: T.DoubleSide, color: 0xffffff, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0 });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u, { uBack: { value: back } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + CURL_HEAD)
        .replace('#include <beginnormal_vertex>', 'vec3 curlN; vec3 curlPos = curlP(position, curlN); vec3 objectNormal = curlN;')
        .replace('#include <begin_vertex>', 'vec3 transformed = curlPos;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uBack;')
        .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 texelColor = gl_FrontFacing ? texture2D(map, vUv) : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));
  texelColor = mapTexelToLinear(texelColor);
  diffuseColor *= texelColor;
#endif`).replace('#include <emissivemap_fragment>', `#ifdef USE_EMISSIVEMAP
  vec4 emissiveColor = texture2D(emissiveMap, vUv);
  emissiveColor.rgb = emissiveMapTexelToLinear(emissiveColor).rgb;
  totalEmissiveRadiance *= gl_FrontFacing ? emissiveColor.rgb : vec3(0.0); // the reading light falls on the page you read
#endif`);
    };
    return m;
  }
  function curlDepth(u) {
    const m = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, side: T.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + CURL_HEAD)
        .replace('#include <begin_vertex>', 'vec3 curlN; vec3 transformed = curlP(position, curlN);');
    };
    return m;
  }

  // ---- canvases ----
  function labelCanvas(src) { // debossed label: the art sits in a recess; the top/right wall shades it, the bottom/left lip catches light
    const w = 512, h = 512, m = 26, r = 30, [c, x] = cv(w + 2 * m, h + 2 * m);
    const rr = (X, Y, Wd, Ht, R) => { x.beginPath(); x.roundRect ? x.roundRect(X, Y, Wd, Ht, R) : x.rect(X, Y, Wd, Ht); };
    // pressed cloth halo around the recess
    x.save(); x.shadowColor = 'rgba(40,25,30,.35)'; x.shadowBlur = 14; x.shadowOffsetX = -3; x.shadowOffsetY = 5;
    rr(m, m, w, h, r); x.fillStyle = 'rgba(0,0,0,1)'; x.fill(); x.restore();
    x.globalCompositeOperation = 'destination-out'; rr(m, m, w, h, r); x.fill(); x.globalCompositeOperation = 'source-over';
    // the art (cover-cropped)
    x.save(); rr(m, m, w, h, r); x.clip();
    const s = Math.max(w / src.width, h / src.height), sw = src.width * s, sh = src.height * s;
    x.drawImage(src, m + (w - sw) / 2, m + (h - sh) * 0.42, sw, sh);
    c.map = { m, w, h, r, ox: m + (w - sw) / 2, oy: m + (h - sh) * 0.42, sw, sh }; // where the art sits, for living-cover effects
    // inner shadow on the lit-side walls
    x.shadowColor = 'rgba(30,20,40,.55)'; x.shadowBlur = 10; x.shadowOffsetX = -5; x.shadowOffsetY = 6;
    x.beginPath(); x.rect(-50, -50, w + 2 * m + 100, h + 2 * m + 100); x.roundRect ? x.roundRect(m, m, w, h, r) : x.rect(m, m, w, h);
    x.fillStyle = '#000'; x.fill('evenodd');
    x.shadowColor = 'rgba(255,248,235,.5)'; x.shadowBlur = 3; x.shadowOffsetX = 2; x.shadowOffsetY = -2; x.fill('evenodd');
    x.restore();
    return c;
  }
  function endpaperCanvas(src, paper) { // the illustration printed on paper, edge to edge
    const w = 720, h = Math.round(720 * (H - .07) / (BW - .07)), [c, x] = cv(w, h);
    x.drawImage(paper, 0, 0, w, h);
    x.globalCompositeOperation = 'multiply';
    const s = Math.max(w / src.width, h / src.height), sw = src.width * s, sh = src.height * s;
    x.drawImage(src, (w - sw) / 2, (h - sh) / 2, sw, sh);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = .18; x.drawImage(paper, 0, 0, w, h); x.globalAlpha = 1; // a little fibre over the print
    return c;
  }
  function foilCanvas(text, w, h, size, sub) { // white on black, used as an alphaMap
    const [c, x] = cv(w, h); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = size; x.font = `600 ${fs}px Newsreader, Georgia, serif`;
    while (x.measureText(text).width > w * .9 && fs > 12) { fs -= 2; x.font = `600 ${fs}px Newsreader, Georgia, serif`; }
    x.fillText(text, w / 2, sub ? h * .4 : h / 2);
    if (sub) { // a small foil ornament under the title
      const y = h * .78; x.fillRect(w / 2 - 70, y - 1.5, 52, 3); x.fillRect(w / 2 + 18, y - 1.5, 52, 3);
      x.save(); x.translate(w / 2, y); x.rotate(Math.PI / 4); x.fillRect(-7, -7, 14, 14); x.restore();
    }
    return c;
  }
  function spineCanvas(text) {
    const w = 128, h = 1024, [c, x] = cv(w, h); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff';
    x.fillRect(16, 40, w - 32, 4); x.fillRect(16, 52, w - 32, 2); x.fillRect(16, h - 44, w - 32, 4); x.fillRect(16, h - 54, w - 32, 2);
    x.save(); x.translate(w / 2, h / 2); x.rotate(Math.PI / 2); x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 54; x.font = `600 ${fs}px Newsreader, Georgia, serif`;
    while (x.measureText(text).width > h * .72 && fs > 14) { fs -= 2; x.font = `600 ${fs}px Newsreader, Georgia, serif`; }
    x.fillText(text, 0, 2); x.restore(); return c;
  }
  function stripes(horizontal, n) { // page-edge striations
    const [c, x] = cv(horizontal ? 8 : 512, horizontal ? 512 : 8);
    x.fillStyle = '#EFE7DA'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < n; i++) {
      const t = (i + Math.random() * .4) / n * 512, a = .05 + Math.random() * .16;
      x.fillStyle = `rgba(120,95,70,${a})`;
      horizontal ? x.fillRect(0, t, 8, .9 + Math.random() * .8) : x.fillRect(t, 0, .9 + Math.random() * .8, 8);
    }
    return c;
  }
  function bandCanvas(hex) {
    const [c, x] = cv(8, 64);
    for (let i = 0; i < 8; i++) { x.fillStyle = i & 1 ? '#F4ECDD' : mix(hex, '#5a3a3a', .35); x.fillRect(0, i * 8, 8, 8); }
    return c;
  }
  // The right page. With a note it prints the text on the same grid as the DOM editor; without one, rules only.
  function metrics(ctx, font) { ctx.font = font; const m = ctx.measureText('Hg'); return [m.fontBoundingBoxAscent || 0.9 * parseFloat(font.match(/(\d+)px/)[1]), m.fontBoundingBoxDescent || 0.3 * parseFloat(font.match(/(\d+)px/)[1])]; }
  function baseOff(ctx, font, lh) { const [a, d] = metrics(ctx, font); return (lh - (a + d)) / 2 + a; }
  PAGE.bodyFont = `400 ${PAGE.size}px Newsreader, Georgia, serif`;
  PAGE.titleFont = `600 ${PAGE.titleSize}px Newsreader, Georgia, serif`;
  PAGE.metaFont = `700 9px "Bricolage Grotesque", system-ui, sans-serif`;
  PAGE.baseline = () => { const [, x] = cv(4, 4); return baseOff(x, PAGE.bodyFont, PAGE.lh); };
  function wrap(ctx, text, maxW) {
    const out = [];
    String(text || '').split('\n').forEach(par => {
      const words = par.split(/(\s+)/).filter(Boolean); let line = '';
      words.forEach(wd => { const t = line + wd; if (ctx.measureText(t.trimEnd()).width > maxW && line.trim()) { out.push(line.trimEnd()); line = wd.trimStart(); } else line = t; });
      out.push(line.trimEnd());
    });
    return out;
  }
  function drawPage(c, paper, note) {
    const x = c.getContext('2d'), S = PAGE.S, w = DW, h = DH;
    x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(paper, 0, 0, c.width, c.height); x.scale(S, S);
    let g = x.createLinearGradient(0, 0, w * .16, 0); // gutter shade
    g.addColorStop(0, 'rgba(110,80,60,.30)'); g.addColorStop(.35, 'rgba(110,80,60,.08)'); g.addColorStop(1, 'rgba(110,80,60,0)');
    x.fillStyle = g; x.fillRect(0, 0, w * .16, h);
    g = x.createLinearGradient(w * .96, 0, w, 0); g.addColorStop(0, 'rgba(110,80,60,0)'); g.addColorStop(1, 'rgba(110,80,60,.07)');
    x.fillStyle = g; x.fillRect(w * .96, 0, w * .04, h);
    const bo = baseOff(x, PAGE.bodyFont, PAGE.lh);
    x.strokeStyle = 'rgba(96,120,178,.26)'; x.lineWidth = .7;
    for (let i = 0; i < PAGE.lines; i++) { const y = PAGE.bodyY + i * PAGE.lh + bo + 3; x.beginPath(); x.moveTo(PAGE.padL - 10, y); x.lineTo(w - PAGE.padR + 6, y); x.stroke(); }
    if (!note) return;
    x.fillStyle = 'rgba(43,42,74,.5)'; x.font = PAGE.metaFont; if ('letterSpacing' in x) x.letterSpacing = '1.4px';
    x.fillText(metaText(note), PAGE.padL, PAGE.metaY); if ('letterSpacing' in x) x.letterSpacing = '0px';
    x.fillStyle = INK;
    x.font = PAGE.titleFont; x.fillText(note.title || '', PAGE.padL, PAGE.titleY + baseOff(x, PAGE.titleFont, PAGE.titleLH));
    x.font = PAGE.bodyFont;
    wrap(x, note.body, w - PAGE.padL - PAGE.padR).slice(0, PAGE.lines).forEach((l, i) => x.fillText(l, PAGE.padL, PAGE.bodyY + i * PAGE.lh + bo));
  }
  const metaText = n => [(n.date || 'Today'), n.tag || ''].filter(Boolean).join('  ·  ').toUpperCase();

  const blanks = new Map(); // one rules-only page texture per paper, shared by every book (it is never disposed)
  function blankFor(paper) {
    if (!blanks.has(paper)) { const [c] = cv(DW * PAGE.S, DH * PAGE.S); drawPage(c, paper, null); blanks.set(paper, tex(c, true)); }
    return blanks.get(paper);
  }
  // Search dimming: one uniform per book, mixed in at the end of every book material's fragment shader.
  function addDim(m, u) {
    const prev = m.onBeforeCompile, key = prev ? 'sbdim-curl' : 'sbdim';
    m.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      sh.uniforms.uDim = u;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uDim;')
        .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(dot(gl_FragColor.rgb, vec3(.3,.59,.11))), uDim * .85) * (1.0 - uDim * .32);\n#include <tonemapping_fragment>');
    };
    m.customProgramCacheKey = () => key;
  }

  // ---- the book ----
  function create(note, o = {}) {
    note = note || { title: 'Untitled', body: '', tag: 'Ideas' };
    let hex = o.clothHex || TAGS[note.tag] || TAGS.Ideas;
    const paperC = o.paper || (art() && art().paper ? art().paper(1024) : fallbackPaper(1024));
    let linen = o.linen || (art() && art().linen ? art().linen(hex, 512) : fallbackLinen(hex));
    let labelSrc = o.label || fallbackLabel(hex);
    const own = []; // textures we made
    const T_ = (c, s, r) => { const t = tex(c, s, r); own.push(t); return t; };

    // cloth
    const TILE = 0.32;
    const clothMap = T_(linen.albedo, true, true), clothN = T_(linen.normal, false, true);
    [clothMap, clothN].forEach(t => t.repeat.set(1 / TILE, 1 / TILE));
    const cloth = new T.MeshPhysicalMaterial({ map: clothMap, normalMap: clothN, normalScale: new T.Vector2(.6, .6), roughness: .86, metalness: 0,
      sheen: lin(mix(hex, '#ffffff', .3)).multiplyScalar(.55) });

    const root = new T.Group(); root.name = 'SBBook';
    const body = new T.Group(); root.add(body);                         // squash happens here (about the base)

    // boards and spine
    const gBoard = rbox(BW, H, CT, .022, .012, 4, 4);
    const back = new T.Mesh(gBoard, cloth); back.rotation.y = Math.PI; back.position.set(BX0 + BW / 2, H / 2, -D / 2 + CT / 2);
    const gSpine = rbox(D, H, SPW, .022, .016, 2, 12, 4, 10, 16);
    const spine = new T.Mesh(gSpine, cloth); spine.rotation.y = -Math.PI / 2; spine.position.set(SPW / 2 + .004, H / 2, 0);
    const pivot = new T.Group(); pivot.position.set(HX, 0, D / 2 - CT / 2);
    const front = new T.Mesh(gBoard, cloth); front.position.set(BX0 - HX + BW / 2, H / 2, 0); pivot.add(front);
    body.add(back, spine, pivot);

    // page block (fore-edge, head, tail striations; paper on the faces)
    const gBlock = rbox(PW, PH, PZ1 - PZ0, .008, 0, 2, 2, 2, 4, 4);
    const stripeV = T_(stripes(false, 90), true, true), stripeH = T_(stripes(true, 90), true, true);
    stripeV.repeat.set(1 / (PZ1 - PZ0), 1); stripeH.repeat.set(1, 1 / (PZ1 - PZ0));
    const paperT = T_(paperC, true, true); paperT.repeat.set(1.2, 1.2);
    const mEdgeX = new T.MeshStandardMaterial({ map: stripeV, roughness: .95 });
    const mEdgeY = new T.MeshStandardMaterial({ map: stripeH, roughness: .95 });
    const mPaper = new T.MeshStandardMaterial({ map: paperT, roughness: .95 });
    const block = new T.Mesh(gBlock, [mEdgeX, mEdgeX, mEdgeY, mEdgeY, mPaper, mPaper]);
    block.position.set(PX0 + PW / 2, PY0 + PH / 2, (PZ0 + PZ1) / 2); body.add(block);

    // head and tail bands
    const mBand = new T.MeshStandardMaterial({ map: T_(bandCanvas(hex), true, true), roughness: .6 });
    mBand.map.repeat.set(1, 6);
    const gBand = new T.CylinderGeometry(.012, .012, PZ1 - PZ0 - .004, 12);
    [PY1 + .002, PY0 - .002].forEach(y => { const b = new T.Mesh(gBand, mBand); b.rotation.x = Math.PI / 2; b.position.set(PX0 + .004, y, (PZ0 + PZ1) / 2); body.add(b); });

    // front cover: debossed label, foil title
    const labelT = T_(labelCanvas(labelSrc), true);
    // living cover (from v2 Meadow): a live copy of the label that an effect paints over; idle books keep the static label
    let baseLabel = labelT.image, labelFx = null; const [liveC, liveX] = cv(baseLabel.width, baseLabel.height);
    const LW = .7, LH = .7, LY = .23;
    const mLabel = new T.MeshPhysicalMaterial({ map: labelT, transparent: true, roughness: .62, clearcoat: .3, clearcoatRoughness: .35, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2 });
    const lk = 1 + 2 * 26 / 512;
    const label = new T.Mesh(decalGeo(gBoard, LW * lk, LH * lk, 0, LY, .0006, 16, 16), mLabel); label.renderOrder = 2; front.add(label);
    const foil = (alpha) => new T.MeshStandardMaterial({ color: lin('#E6C987'), emissive: lin('#7A5A22'), emissiveIntensity: .35, metalness: .9, roughness: .35,
      alphaMap: alpha, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const titleT = T_(foilCanvas(note.title || 'Untitled', 1024, 256, 96, true), false);
    const mTitle = foil(titleT);
    const title = new T.Mesh(decalGeo(gBoard, .78, .195, 0, -.27, .0012), mTitle); title.renderOrder = 3; front.add(title);
    const spineT = T_(spineCanvas(note.title || 'Untitled'), false);
    const mSpineT = foil(spineT);
    const spineTitle = new T.Mesh(decalGeo(gSpine, D * .62, H * .9, 0, 0, .0012, 4, 8), mSpineT); spineTitle.rotation.z = 0; spineTitle.renderOrder = 3; spine.add(spineTitle);

    // endpaper on the inside of the front board, with the cloth turn-in showing around it
    const endT = T_(endpaperCanvas(labelSrc, paperC), true);
    endT.repeat.set(.9, .9); endT.offset.set(.05, .05);
    const mEnd = new T.MeshStandardMaterial({ map: endT, roughness: .82, emissive: 0xffffff, emissiveMap: endT, emissiveIntensity: 0 });
    const endp = new T.Mesh(new T.PlaneGeometry(BW - .05, H - .07), mEnd);
    endp.rotation.y = Math.PI; endp.position.set(BX0 - HX + BW / 2 - .008, H / 2, -CT / 2 - .0012); pivot.add(endp);

    // loose pages for the fan (page 0 is the top page: it carries the note)
    const S = PAGE.S, [pageC] = cv(DW * S, DH * S); drawPage(pageC, paperC, note);
    const pageT = T_(pageC, true);
    const blankT = blankFor(paperC);
    const backT = T_((() => { const [c, x] = cv(512, 512); x.drawImage(paperC, 0, 0, 512, 512); const g = x.createLinearGradient(512, 0, 400, 0);
      g.addColorStop(0, 'rgba(110,80,60,.28)'); g.addColorStop(1, 'rgba(110,80,60,0)'); x.fillStyle = g; x.fillRect(400, 0, 112, 512); return c; })(), true);
    const gPage = new T.PlaneGeometry(PW - .004, PH - .004, 28, 8); gPage.translate((PW - .004) / 2, 0, 0);
    const pages = [];
    for (let i = 0; i < NP; i++) {
      const u = { uTheta: { value: 0 }, uKappa: { value: 0 }, uLead: { value: .35 }, uDip: { value: .010 } };
      const m = curlMaterial(i === 0 ? pageT : blankT, backT, u);
      const mesh = new T.Mesh(gPage, m); mesh.customDepthMaterial = curlDepth(u);
      mesh.position.set(PX0 + .002, PY0 + PH / 2, PZ1 + .0012 + (NP - 1 - i) * .0010);
      mesh.renderOrder = 1; mesh.frustumCulled = false; body.add(mesh); pages.push({ mesh, u });
    }

    const ribbonAnchor = new T.Object3D(); ribbonAnchor.position.set(PX0 + .022, PY1 + .006, PZ1 - .012); // in the gutter, clear of the text
    body.add(ribbonAnchor);

    root.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = !o.material.transparent; } });
    const dimU = { value: 0 }, dimmed = new Set();
    root.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { if (!dimmed.has(m)) { dimmed.add(m); addDim(m, dimU); } }); });
    pages.forEach(p => { p.mesh.castShadow = true; });

    // redraw text canvases once the fonts are in
    fontsReady.then(() => { if (api.disposed) return; api.setTitle(note.title); drawPage(pageC, paperC, api.pageNote); pageT.needsUpdate = true; drawPage(blankT.image, paperC, null); blankT.needsUpdate = true; });

    const tmp = new T.Vector3();
    const api = {
      group: root, note, ribbonAnchor, pageNote: note, disposed: false,
      dims: { W, H, D, CT, PX0, PX1, PY0, PY1, PZ1, PW, PH },
      setCover(a) { pivot.rotation.y = -a; },
      setFan(t) {
        t = Math.max(0, Math.min(1, t));
        pages.forEach((p, i) => this.setPageCurl(i, t * (1.05 - i * .22) * (1 + .15 * Math.sin(i * 2.1)), -t * (1.6 - i * .25)));
      },
      setPageCurl(i, theta, kappa) { const u = pages[i].u; u.uTheta.value = theta; u.uKappa.value = kappa; },
      squash(sx, sy) { body.scale.set(sx, sy, sx); },
      setGlow(g) { pages.forEach(p => { p.mesh.material.emissiveIntensity = g; }); mEnd.emissiveIntensity = g * .6; }, // reading light (open.js)
      setDim(t) { dimU.value = Math.max(0, Math.min(1, t)); }, // search: 0 = normal, 1 = darkened and desaturated
      setLabelFx(fn) { labelFx = fn || null; if (!labelFx) { labelT.image = baseLabel; labelT.needsUpdate = true; } },
      // one frame of the living label: fx paints over the art (clipped to the recess); dim 0…1 puts the cover's lights out
      labelFrame(t, dim, tod) {
        if (!labelFx && !dim) return;
        const M = baseLabel.map, x = liveX; if (!M) return;
        x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, liveC.width, liveC.height); x.drawImage(baseLabel, 0, 0);
        x.save(); x.beginPath(); x.roundRect ? x.roundRect(M.m, M.m, M.w, M.h, M.r) : x.rect(M.m, M.m, M.w, M.h); x.clip();
        if (labelFx) { x.save(); labelFx(x, t, (u, v) => [M.ox + u * M.sw, M.oy + v * M.sh], M.sw, baseLabel, tod || 'golden'); x.restore(); }
        if (dim) { const d = Math.max(0, Math.min(1, dim)), k = c => Math.round(255 - (255 - c) * d);
          x.globalCompositeOperation = 'multiply'; x.globalAlpha = 1; x.fillStyle = `rgb(${k(38)},${k(32)},${k(70)})`; x.fillRect(0, 0, liveC.width, liveC.height); }
        x.restore();
        labelT.image = liveC; labelT.needsUpdate = true;
      },
      setLabel(c) {
        labelSrc = c;
        baseLabel = labelT.image = labelCanvas(c); labelT.needsUpdate = true;
        endT.image = endpaperCanvas(c, paperC); endT.needsUpdate = true;
      },
      setCloth(h) {
        hex = h;
        linen = art() && art().linen ? art().linen(h, 512) : fallbackLinen(h);
        clothMap.image = linen.albedo; clothMap.needsUpdate = true; clothN.image = linen.normal; clothN.needsUpdate = true;
        cloth.sheen.copy(lin(mix(h, '#ffffff', .3)).multiplyScalar(.55));
        mBand.map.image = bandCanvas(h); mBand.map.needsUpdate = true;
      },
      setTitle(t) {
        note.title = t;
        titleT.image = foilCanvas(t || 'Untitled', 1024, 256, 96, true); titleT.needsUpdate = true;
        spineT.image = spineCanvas(t || 'Untitled'); spineT.needsUpdate = true;
      },
      // --- used by open.js ---
      drawPage(n) { this.pageNote = n; drawPage(pageC, paperC, n); pageT.needsUpdate = true; }, // n=null: rules only
      pageQuad(out) { // the right page's corners in world space: TL, TR, BR, BL
        const m = pages[0].mesh; m.updateWorldMatrix(true, false); const w = PW - .004, h = (PH - .004) / 2;
        [[0, h], [w, h], [w, -h], [0, -h]].forEach(([x, y], i) => out[i].set(x, y, 0).applyMatrix4(m.matrixWorld));
        return out;
      },
      parallax(cam) { // the endpaper illustration drifts against the camera, like a picture behind glass
        endp.updateWorldMatrix(true, false); tmp.copy(cam.position); endp.worldToLocal(tmp);
        const z = Math.max(.3, tmp.z);
        endT.offset.set(.05 + Math.max(-.05, Math.min(.05, -tmp.x / z * .05)), .05 + Math.max(-.05, Math.min(.05, -tmp.y / z * .05)));
      },
      dispose() {
        this.disposed = true;
        root.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(m => m.dispose()); if (o.customDepthMaterial) o.customDepthMaterial.dispose(); } });
        own.forEach(t => t.dispose());
        root.parent && root.parent.remove(root);
      },
    };
    return api;
  }

  window.SBBook = { create, PAGE, TAGS, DIMS: { W, H, D }, fontsReady, metaText, baseOff: (font, lh) => baseOff(cv(4, 4)[1], font, lh) };
})();
