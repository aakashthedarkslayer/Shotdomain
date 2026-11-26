/* Softbound v3: opening a book to read and write. Exposes window.SBOpen (see CONTRACT.md).
   open(book, SB): dip, lift arc and turn, hinge spring (4° overshoot), riffle, dolly into the spread, then the editor.
   close(): the page settles, the cover claps shut with an air puff, the book glides back to its slot. */
(function () {
  const T = window.THREE;
  if (!T) return;
  const V3 = T.Vector3, Q = T.Quaternion;
  const snd = (n, o) => { try { window.SBSound && SBSound.play(n, o); } catch (e) {} };
  const hap = n => { try { window.SBHaptics && SBHaptics[n] && SBHaptics[n](); } catch (e) {} };
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---- springs (semi-implicit Euler, sub-stepped) ----
  const S = (x, k, z) => ({ x, v: 0, t: x, k, z });
  const step = (s, dt) => { s.v += (s.k * (s.t - s.x) - 2 * Math.sqrt(s.k) * s.z * s.v) * dt; s.x += s.v * dt; };
  const still = (s, e = 1e-3) => Math.abs(s.t - s.x) < e && Math.abs(s.v) < e * 4;
  const snap = s => { s.x = s.t; s.v = 0; };

  // ---- composition of the end frame ----
  const OPEN = Math.PI * 0.86;          // the spread rests in a soft V (left page lifted ~25°): the illustration faces you
  const YAW = -0.15, PITCH = -0.04, ROLL = -0.014; // the book held a little turned: the fore-edge comes toward you
  const ARC = 0.32;                     // lift arc height
  const STRIP = 0.19, PAGE_Y = 0.535;   // gutter x (fraction of the width: the painted strip left of it), page centre y

  // ---- styles (injected once) ----
  let styled = false;
  function style(P) {
    if (styled) return; styled = true;
    const st = document.createElement('style');
    st.textContent = `
.sbo{position:absolute;left:0;top:0;pointer-events:none;overflow:hidden;z-index:6;--ink:#2B2A4A}
.sbo-vig{position:absolute;inset:0;opacity:0;transition:opacity .9s cubic-bezier(.3,0,.2,1);
  background:radial-gradient(130% 70% at 60% 44%,rgba(40,24,16,0) 50%,rgba(40,24,16,.30) 100%),linear-gradient(rgba(40,24,16,.16),rgba(40,24,16,0) 18%),linear-gradient(0deg,rgba(52,30,20,.30),rgba(52,30,20,0) 30%)}
.sbo.on .sbo-vig{opacity:1}
.sbo-dof{position:absolute;inset:0;-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);opacity:0;transition:opacity .7s cubic-bezier(.3,0,.2,1)}
.sbo.ed .sbo-dof{opacity:1}
.sbo-glint{position:absolute;inset:0;overflow:hidden;pointer-events:none;mix-blend-mode:soft-light}
.sbo-glint::after{content:"";position:absolute;top:-20%;bottom:-20%;width:46%;left:0;transform:translateX(-140%) skewX(-14deg);
  background:linear-gradient(90deg,rgba(255,236,200,0),rgba(255,236,200,.55) 40%,rgba(255,246,225,.7) 50%,rgba(255,236,200,.55) 60%,rgba(255,236,200,0))}
.sbo.ed .sbo-glint::after{animation:sbo-glint 1.5s .1s cubic-bezier(.4,0,.2,1) both}
@keyframes sbo-glint{to{transform:translateX(330%) skewX(-14deg)}}
.sbo-top{position:absolute;left:16px;right:16px;top:54px;display:flex;align-items:center;gap:10px;opacity:0;transform:translateY(-8px);transition:opacity .35s,transform .5s cubic-bezier(.2,.9,.3,1.2)}
.sbo.ed .sbo-top{opacity:1;transform:none}
.sbo-back{all:unset;pointer-events:auto;cursor:pointer;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(255,251,245,.9);color:var(--ink);
  box-shadow:0 1px 1px rgba(60,35,25,.08),0 10px 22px -10px rgba(60,35,25,.45)}
.sbo-back:active{transform:scale(.92)}
.sbo-back svg{width:18px;height:18px}
.sbo-tag{all:unset;box-sizing:border-box;height:28px;padding:0 12px;border-radius:99px;display:inline-flex;align-items:center;gap:6px;background:var(--c);color:var(--ink);font:700 12px "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:.01em;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.35),0 8px 18px -10px rgba(60,35,25,.5)}
.sbo-tag{cursor:pointer;pointer-events:auto;padding:0 12px 0 8px}
.sbo-tag svg{color:var(--d,#2B2A4A)}
.sbo-sp{flex:1}
.sbo-del{all:unset;pointer-events:auto;cursor:pointer;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(255,251,245,.9);color:#9A3B3B;box-shadow:0 1px 1px rgba(60,35,25,.08),0 10px 22px -10px rgba(60,35,25,.45)}
.sbo-del:active{transform:scale(.92)}
.sbo-del svg{width:18px;height:18px}
.sbo-tags{position:absolute;left:0;right:0;top:102px;display:flex;gap:7px;padding:0 16px;overflow-x:auto;scrollbar-width:none;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .25s,transform .35s cubic-bezier(.2,.9,.3,1.2)}
.sbo-tags::-webkit-scrollbar{display:none}
.sbo.ed.picking .sbo-tags{opacity:1;transform:none;pointer-events:auto}
.sbo-tags button{all:unset;cursor:pointer;flex:none;box-sizing:border-box;height:32px;padding:0 12px 0 5px;border-radius:99px;display:inline-flex;align-items:center;gap:6px;background:rgba(255,251,245,.92);color:#2B2A4A;font:600 12px "Bricolage Grotesque",system-ui,sans-serif;box-shadow:0 8px 18px -12px rgba(60,35,25,.5)}
.sbo-tags button i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:var(--d)}
.sbo-tags button[aria-checked="true"]{background:#2B2A4A;color:#FBF6EC}
.sbo-page{position:absolute;left:0;top:0;width:${P.DW}px;height:${P.DH}px;transform-origin:0 0;opacity:0;transition:opacity .3s;backface-visibility:hidden;color:var(--ink)}
.sbo.ed .sbo-page{opacity:1;pointer-events:auto}
.sbo-f{position:absolute;left:${P.padL}px;right:${P.padR}px}
.sbo-f input,.sbo-f textarea,.sbo-ink{all:unset;box-sizing:border-box;position:absolute;inset:0;width:100%;height:100%;padding:0;margin:0;border:0;
  font:inherit;line-height:inherit;letter-spacing:0;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal}
.sbo-f input,.sbo-f textarea{color:transparent;caret-color:#2B3A8C;-webkit-text-fill-color:transparent;background:transparent;resize:none;overflow:hidden;cursor:text;pointer-events:auto}
.sbo-f textarea{overflow-y:auto;scrollbar-width:none}
.sbo-f textarea::-webkit-scrollbar{display:none}
.sbo-f ::selection{background:rgba(96,120,178,.28)}
.sbo-f input::placeholder,.sbo-f textarea::placeholder{-webkit-text-fill-color:rgba(43,42,74,.32)}
.sbo-title{top:${P.titleY}px;height:${P.titleLH}px;font:${P.titleFont};line-height:${P.titleLH}px}
.sbo-title .sbo-ink,.sbo-title input{white-space:pre;overflow:hidden}
.sbo-body{top:${P.bodyY}px;height:${P.lines * P.lh}px;font:${P.bodyFont};line-height:${P.lh}px}
.sbo-ink{pointer-events:none;overflow:hidden;color:#2B2A4A;text-shadow:0 .75px 0 rgba(255,251,242,.9),0 -.35px 0 rgba(20,18,50,.22)}
.sbo-ink .w{animation:sbo-dry 1.2s cubic-bezier(.35,.1,.3,1) both}
@keyframes sbo-dry{
  0%{color:#0F1A6E;text-shadow:.45px -.55px 0 rgba(255,255,255,.95),0 0 1.8px rgba(36,58,190,.55),0 .75px 0 rgba(255,251,242,.6)}
  35%{color:#18227A;text-shadow:.35px -.45px 0 rgba(255,255,255,.6),0 0 1.2px rgba(36,58,190,.3),0 .75px 0 rgba(255,251,242,.75)}
  100%{color:#2B2A4A;text-shadow:0 .75px 0 rgba(255,251,242,.9),0 -.35px 0 rgba(20,18,50,.22)}}
.sbo-foot{position:absolute;left:${P.padL}px;right:${P.padR - 4}px;top:${P.footY}px;height:30px;display:flex;align-items:center;justify-content:space-between;
  font:600 10px "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:.06em;color:rgba(43,42,74,.45)}
.sbo-save{all:unset;pointer-events:auto;cursor:pointer;height:30px;padding:0 14px 0 11px;border-radius:99px;display:inline-flex;align-items:center;gap:6px;
  background:#2B2A4A;color:#FBF6EC;font:700 12px "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:.01em;
  box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 6px 14px -6px rgba(43,42,74,.6)}
.sbo-save:active{transform:scale(.95)}
.sbo-save svg{width:13px;height:13px}
.sbo-fade{transition:opacity .2s ease}`;
    document.head.appendChild(st);
  }

  // ---- debossed ink: a mirror under each field, one span per word, wet words dry over 1.2s ----
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function inkField(el, ink, dryAll) {
    let toks = [], born = [];
    const render = () => {
      const now = performance.now(), nt = el.value.split(/(\s+)/);
      born = nt.map((w, i) => (w === toks[i] ? born[i] : (dryAll ? -1e9 : now)));
      toks = nt;
      ink.innerHTML = nt.map((w, i) => {
        if (!w.trim()) return esc(w);
        const age = now - born[i];
        return age < 1200 ? `<span class="w" style="animation-delay:${-age}ms">${esc(w)}</span>` : esc(w);
      }).join('') + (el.value.endsWith('\n') ? '​' : '');
      ink.scrollTop = el.scrollTop; ink.scrollLeft = el.scrollLeft;
    };
    render(); dryAll = false;
    el.addEventListener('input', render);
    el.addEventListener('scroll', () => { ink.scrollTop = el.scrollTop; ink.scrollLeft = el.scrollLeft; });
    return render;
  }

  // ---- homography: map the DW×DH page box onto a projected quad (TL, TR, BR, BL) ----
  function matrix3d(w, h, p) {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = p;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const det = dx1 * dy2 - dx2 * dy1 || 1e-9;
    const a13 = (dx3 * dy2 - dx2 * dy3) / det, a23 = (dx1 * dy3 - dx3 * dy1) / det;
    const a11 = x1 - x0 + a13 * x1, a21 = x3 - x0 + a23 * x3, a12 = y1 - y0 + a13 * y1, a22 = y3 - y0 + a23 * y3;
    return `matrix3d(${a11 / w},${a12 / w},0,${a13 / w},${a21 / h},${a22 / h},0,${a23 / h},0,0,1,0,${x0},${y0},0,1)`;
  }

  let cur = null; // the session
  const ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  const ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  const GL = (t, z) => window.SB_GLYPH_SVG ? SB_GLYPH_SVG(t, z) : '';
  const INKC = window.SB_INK || {};
  const TAGLIST = ['Ideas', 'Travel', 'Recipes', 'Personal', 'Work', 'Reading'];
  const ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function buildOverlay(s) {
    const P = SBBook.PAGE, n = s.note, root = document.createElement('div');
    root.className = 'sbo';
    const hex = (SBBook.TAGS && SBBook.TAGS[n.tag]) || '#CDBDF2';
    root.innerHTML = `<div class="sbo-dof"></div><div class="sbo-vig"></div>
      <div class="sbo-top"><button class="sbo-back" aria-label="Save and close">${ICON_BACK}</button><button class="sbo-tag" style="--c:${hex};--d:${INKC[n.tag] || '#2B2A4A'}" aria-label="Tag: ${esc(n.tag || 'Ideas')}. Change tag" aria-expanded="false">${GL(n.tag, 14)}<span>${esc(n.tag || 'Ideas')}</span></button><span class="sbo-sp"></span><button class="sbo-del" aria-label="Delete note">${ICON_DEL}</button></div>
      <div class="sbo-tags" role="radiogroup" aria-label="Tag">${TAGLIST.map(k => `<button role="radio" aria-checked="${k === (n.tag || 'Ideas')}" data-tag="${k}" style="--c:${(SBBook.TAGS && SBBook.TAGS[k]) || '#CDBDF2'};--d:${INKC[k] || '#2B2A4A'}"><i>${GL(k, 12)}</i>${k}</button>`).join('')}</div>
      <div class="sbo-page" role="group" aria-label="Note page"><div class="sbo-glint"></div>
        <div class="sbo-f sbo-title"><div class="sbo-ink" aria-hidden="true"></div><input spellcheck="false" autocomplete="off" aria-label="Title" placeholder="Title"></div>
        <div class="sbo-f sbo-body"><div class="sbo-ink" aria-hidden="true"></div><textarea spellcheck="false" aria-label="Note" placeholder="Write something…"></textarea></div>
        <div class="sbo-foot"><span class="sbo-count"></span><button class="sbo-save">${ICON_OK}Save</button></div>
      </div>`;
    const q = c => root.querySelector(c);
    const ti = q('.sbo-title input'), ta = q('.sbo-body textarea'), count = q('.sbo-count');
    ti.value = n.title || ''; ta.value = n.body || '';
    inkField(ti, q('.sbo-title .sbo-ink'), true); inkField(ta, q('.sbo-body .sbo-ink'), true);
    const words = () => { const k = (ta.value.match(/\S+/g) || []).length; count.textContent = (s.edited ? 'EDITED JUST NOW' : String(n.date || 'Today').toUpperCase()) + ' · ' + k + (k === 1 ? ' WORD' : ' WORDS'); };
    words();
    const onWord = e => { // a soft scratch each time a word is finished
      const el = e.target, i = el.selectionStart, v = el.value;
      if (e.inputType && e.inputType.startsWith('insert') && i > 1 && /\s/.test(v[i - 1]) && /\S/.test(v[i - 2])) snd('scratch', { pitch: .9 + Math.random() * .2, gain: .8 });
      words();
    };
    ti.addEventListener('input', onWord); ta.addEventListener('input', onWord);
    const markEdited = () => { if (!s.edited) { s.edited = true; words(); } };
    ti.addEventListener('input', markEdited); ta.addEventListener('input', markEdited);
    // tag + cloth (kept from v2's create sheet): tap the pill to pick; a fresh notebook opens with the picker showing
    const pill = q('.sbo-tag'), pick = on => { root.classList.toggle('picking', on); pill.setAttribute('aria-expanded', String(on)); };
    pill.addEventListener('click', () => { pick(!root.classList.contains('picking')); snd('tick', { gain: .6 }); });
    q('.sbo-tags').addEventListener('click', e => { const b = e.target.closest('button[data-tag]'); if (!b) return; const k = b.dataset.tag;
      n.tag = k; q('.sbo-tags').querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      pill.style.setProperty('--c', (SBBook.TAGS && SBBook.TAGS[k]) || '#CDBDF2'); pill.style.setProperty('--d', INKC[k] || '#2B2A4A');
      pill.innerHTML = GL(k, 14) + '<span>' + esc(k) + '</span>'; pill.setAttribute('aria-label', 'Tag: ' + k + '. Change tag');
      try { s.SB && s.SB.save && s.SB.save(n); } catch (err) {}
      try { s.book && s.book.drawPage && s.book.drawPage(Object.assign({}, n, { title: '', body: '' })); } catch (err) {}
      snd('pop', { gain: .6 }); pick(false); });
    if (!n.title && !n.body) pick(true);
    q('.sbo-del').addEventListener('click', () => { const SBr = s.SB; SBOpen.close().then(() => { try { SBr && SBr.remove && SBr.remove(n); } catch (err) {} }); });
    ti.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ta.focus({ preventScroll: true }); } });
    root.addEventListener('keydown', e => { if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); SBOpen.close(); } });
    q('.sbo-save').addEventListener('click', () => SBOpen.close());
    q('.sbo-back').addEventListener('click', () => SBOpen.close());
    s.el = { root, page: q('.sbo-page'), dof: q('.sbo-dof'), ti, ta };
    // keep the caret line above the keyboard: scroll the page's own text, never the screen
    const keep = () => {
      if (document.activeElement !== ta) return;
      const vv = window.visualViewport, bottom = vv ? vv.offsetTop + vv.height : innerHeight;
      const r = ta.getBoundingClientRect(), k = r.height / ta.offsetHeight || 1;
      const line = ta.value.slice(0, ta.selectionStart).split('\n').length - 1; // rough: hard lines only
      const caret = r.top + ((line + 1) * P.lh - ta.scrollTop) * k;
      if (caret > bottom - 16) ta.scrollTop += (caret - bottom + 16) / k + P.lh;
    };
    ta.addEventListener('input', keep); ta.addEventListener('focus', () => setTimeout(keep, 300));
    window.visualViewport && visualViewport.addEventListener('resize', keep);
    s.unkeep = () => window.visualViewport && visualViewport.removeEventListener('resize', keep);
    const host = s.SB.screenEl || s.canvas.parentElement;
    host.appendChild(root);
    return root;
  }

  function placeOverlay(s) {
    const c = s.canvas, r = s.el.root;
    r.style.left = c.offsetLeft + 'px'; r.style.top = c.offsetTop + 'px';
    r.style.width = c.clientWidth + 'px'; r.style.height = c.clientHeight + 'px';
  }
  const quad = [new V3(), new V3(), new V3(), new V3()];
  function projectPage(s) {
    const cam = s.SB.camera, cw = s.canvas.clientWidth, ch = s.canvas.clientHeight;
    cam.updateMatrixWorld();
    s.book.pageQuad(quad);
    const p = [];
    quad.forEach(v => { v.project(cam); p.push((v.x + 1) / 2 * cw, (1 - v.y) / 2 * ch); });
    s.el.page.style.transform = matrix3d(SBBook.PAGE.DW, SBBook.PAGE.DH, p);
    const a = Math.min(p[1], p[3]) - 16, b = Math.max(p[5], p[7]) + 22;
    const m = `linear-gradient(#000 ${a - 26}px,transparent ${a + 6}px,transparent ${b - 6}px,#000 ${b + 30}px)`;
    s.el.dof.style.webkitMaskImage = s.el.dof.style.maskImage = m;
  }

  // ---- where the book is read from, and where the camera ends ----
  function plan(s) {
    const { book, SB } = s, cam = SB.camera, g = book.group;
    cam.updateMatrixWorld();
    const qc = cam.quaternion.clone();
    const f = new V3(0, 0, -1).applyQuaternion(qc), r = new V3(1, 0, 0).applyQuaternion(qc), u = new V3(0, 1, 0).applyQuaternion(qc);
    s.QR = qc.clone().multiply(new Q().setFromEuler(new T.Euler(PITCH, YAW, ROLL, 'YXZ')));
    const c0 = g.localToWorld(new V3(.5, .7, 0)).applyMatrix4(cam.matrixWorldInverse);
    const centre = new V3(0, c0.y * .35 + .1, c0.z * .8).applyMatrix4(cam.matrixWorld);
    s.PR = centre.sub(new V3(.5, .7, 0).applyQuaternion(s.QR));
    // fit a camera with the same orientation so the right page lands DW px wide at the right of the screen
    const tc = cam.clone(), cw = s.canvas.clientWidth, ch = s.canvas.clientHeight, P = SBBook.PAGE;
    const keep = [g.position.clone(), g.quaternion.clone()];
    const fit = () => {
      g.position.copy(s.PR); g.quaternion.copy(s.QR); g.updateMatrixWorld(true);
      const W = book.pageQuad([new V3(), new V3(), new V3(), new V3()]);
      const mid = W.reduce((a, v) => a.add(v), new V3()).multiplyScalar(.25);
      const px = (v) => { const p = v.clone().project(tc); return [(p.x + 1) / 2 * cw, (1 - p.y) / 2 * ch]; };
      let d = 4, ox = 0, oy = 0;
      const place = dd => { tc.position.copy(mid).addScaledVector(f, -dd).addScaledVector(r, ox).addScaledVector(u, oy); tc.updateMatrixWorld(); };
      for (let it = 0; it < 4; it++) {
        let lo = .2, hi = 80;
        for (let j = 0; j < 32; j++) {
          const m = (lo + hi) / 2; place(m);
          const a = px(W[0]), b = px(W[1]), c = px(W[2]), e = px(W[3]);
          (((e[1] - a[1]) + (c[1] - b[1])) / 2 > P.DH) ? (lo = m) : (hi = m);
        }
        d = (lo + hi) / 2; place(d);
        const pts = W.map(px), gx = (pts[0][0] + pts[3][0]) / 2, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
        const ppw = (ch / 2) / Math.tan(T.MathUtils.degToRad(tc.fov) / 2) / d;
        ox += (gx - cw * STRIP) / ppw; oy -= (cy - ch * PAGE_Y) / ppw;
      }
      place(d);
      return tc.position.clone();
    };
    let CE = fit();
    const travel = CE.clone().sub(cam.position).dot(f);
    if (travel < .4) { s.PR.addScaledVector(f, .4 - travel); CE = fit(); } // the camera only ever moves toward the book
    s.CE = CE; s.WUP = new V3(0, 1, 0);
    // reading light: render the read pose once, tiny and offscreen, sample a blank patch of paper and top it up to paper-white
    s.glow = 0;
    const Rr = SB.renderer;
    if (Rr && Rr.readRenderTargetPixels) {
      const rt = new T.WebGLRenderTarget(48, 104), mc = cam.clone();
      mc.position.copy(CE); mc.updateProjectionMatrix(); mc.updateMatrixWorld();
      g.position.copy(s.PR); g.quaternion.copy(s.QR); book.setCover(OPEN); g.updateMatrixWorld(true);
      const Wq = book.pageQuad([new V3(), new V3(), new V3(), new V3()]);
      const pt = Wq[0].clone().lerp(Wq[3], .78).lerp(Wq[1].clone().lerp(Wq[2], .78), .35).project(mc);
      const x = Math.round((pt.x + 1) / 2 * 48), y = Math.round((pt.y + 1) / 2 * 104), px = new Uint8Array(36);
      const prev = Rr.getRenderTarget();
      Rr.setRenderTarget(rt); Rr.render(SB.scene || g.parent, mc); Rr.readRenderTargetPixels(rt, clamp(x - 1, 0, 45), clamp(y - 1, 0, 101), 3, 3, px); Rr.setRenderTarget(prev);
      rt.dispose(); book.setCover(0);
      let m = 0; for (let i = 0; i < 36; i += 4) m += (px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11) / 255 / 9;
      s.glow = clamp((.78 - m) / .85, 0, .8);
      s.paperLum = m;
    }
    g.position.copy(keep[0]); g.quaternion.copy(keep[1]); g.updateMatrixWorld(true);
  }

  // ---- pose every frame ----
  const qa = new Q(), qw = new Q(), ew = new T.Euler();
  function pose(s) {
    const { book, SB, sp } = s, g = book.group, L = sp.lift.x, arc = Math.sin(Math.PI * clamp(L, 0, 1));
    g.position.lerpVectors(s.P0, s.PR, L).addScaledVector(s.WUP, ARC * arc + sp.yoff.x);
    qa.copy(s.Q0).slerp(s.QR, clamp(sp.turn.x, -0.2, 1.2));
    ew.set(arc * .05, -arc * .10, arc * .07); qw.setFromEuler(ew); g.quaternion.copy(qa).multiply(qw);
    book.squash(1 + (1 - sp.sq.x) * .55, sp.sq.x);
    book.setCover(Math.max(0, sp.cover.x));
    // curl lags the motion (air drag), but each tip stays above the page beneath it, and the bottom page above the block
    let hBelow = 0;
    for (let i = s.pages.length - 1; i >= 0; i--) {
      const p = s.pages[i];
      const k = Math.max(clamp(-p.v * .42, -2.4, 2.4) - p.x * .25, (hBelow - p.x) / .45);
      hBelow = p.x + .45 * k;
      book.setPageCurl(i, p.x, k);
    }
    SB.camera.position.lerpVectors(s.C0, s.CE, s.sp.cam2.x);
    SB.camera.updateMatrixWorld();
    book.parallax && book.parallax(SB.camera);
    const gl = clamp((sp.cam2.x - .55) / .45, 0, 1); book.setGlow && book.setGlow(s.glow * gl * gl * (3 - 2 * gl));
  }

  function springs(s, dt) {
    const sp = s.sp, list = [sp.lift, sp.turn, sp.yoff, sp.sq, sp.cover, sp.cam1, sp.cam2, ...s.pages];
    const n = Math.ceil(dt / (1 / 240)), h = dt / n;
    for (let k = 0; k < n; k++) {
      sp.cam2.t = sp.cam1.x;           // two critically damped stages: an eased, overshoot-free dolly
      list.forEach(x => step(x, h));
      s.pages.forEach((p, i) => {
        if (p.x < 0) { p.x = 0; p.v = -p.v * .15; }                  // pages bounce off the block
        const up = s.pages[i - 1];                                     // and never pass through the page above
        if (up && p.x > up.x) { p.x = up.x; p.v = Math.min(p.v, up.v); }
      });
      s.onSub && s.onSub();
    }
    return list.every(x => still(x, s.phase === 'close' ? 5e-3 : 2e-3)); // close snaps exactly home in finish()
  }

  function wake(s) {
    if (!s.off) s.off = s.SB.onTick ? s.SB.onTick(dt => s.tick(dt)) : null;
    s.SB.requestFrame && s.SB.requestFrame();
  }
  function sleep(s) { if (s.off) { s.off(); s.off = null; } }

  // ---- open ----
  function open(book, SB) {
    if (cur) return Promise.resolve(false);
    if (!book || !book.pageQuad || !SB || !SB.camera) return Promise.reject(new Error('SBOpen needs an SBBook and SB'));
    style(SBBook.PAGE);
    const canvas = (SB.renderer && SB.renderer.domElement) || document.querySelector('canvas');
    const g = book.group, scene = SB.scene || g.parent;
    const s = cur = { book, SB, canvas, note: book.note || {}, t: 0, off: null, phase: 'open' };
    SBOpen.book = book;
    s.home = { parent: g.parent, pos: g.position.clone(), quat: g.quaternion.clone(), scale: g.scale.clone() };
    s.camHome = { pos: SB.camera.position.clone(), quat: SB.camera.quaternion.clone() };
    if (scene && g.parent !== scene) scene.attach(g);
    s.P0 = g.position.clone(); s.Q0 = g.quaternion.clone(); s.C0 = SB.camera.position.clone();
    plan(s);
    s.sp = { lift: S(0, 56, .74), turn: S(0, 40, .86), yoff: S(0, 520, 1), sq: S(1, 320, .32), cover: S(0, 60, .76), cam1: S(0, 17, 1), cam2: S(0, 17, 1) };
    s.pages = [0, 1, 2, 3].map(i => Object.assign(S(0, 74 - i * 9, .44), { grab: [.84, .7, .56, .42][i], rel: [1.95, 1.65, 1.35, 1.05][i], free: false }));
    buildOverlay(s); placeOverlay(s);
    SB.homeOverlay && SB.homeOverlay(false);
    let resolveOpen; const done = new Promise(r => (resolveOpen = r));
    const flags = {};
    const once = (k, fn) => { if (!flags[k]) { flags[k] = 1; fn(); } };
    const showEditor = () => once('ed', () => {
      projectPage(s); s.el.root.classList.add('ed');
      setTimeout(() => { if (cur === s && s.phase === 'open') book.drawPage(Object.assign({}, s.note, { title: '', body: '' })); }, 320); // the DOM ink takes over from the printed text
      SBOpen.isOpen = true; resolveOpen(true);
      if (!s.note.title && !s.note.body) s.el.ti.focus({ preventScroll: true }); // a new note: type straight away
    });
    requestAnimationFrame(() => s.el && s.el.root.classList.add('on'));

    if (reduced()) { // crossfade, no flight
      canvas.classList.add('sbo-fade'); canvas.style.opacity = 0;
      setTimeout(() => {
        Object.values(s.sp).forEach(x => { x.t = x === s.sp.sq ? 1 : x === s.sp.cover ? OPEN : x === s.sp.yoff ? 0 : 1; snap(x); });
        s.sp.cam2.x = s.sp.cam2.t = 1; s.pages.forEach(snap);
        pose(s); SB.requestFrame && SB.requestFrame(); canvas.style.opacity = 1; showEditor();
      }, 200);
      return done;
    }

    const sp = s.sp;
    sp.yoff.t = -.012; sp.sq.t = .962; // anticipation: a 3px dip
    s.onSub = () => {
      s.pages.forEach(p => {
        if (!p.free && sp.cover.x < p.rel) p.t = Math.max(0, sp.cover.x) * p.grab;
        else { if (!p.free) { p.free = true; p.z = .6; once('riffle', () => snd('riffle')); } p.t = 0; }
      });
    };
    s.tick = dt => {
      dt = clamp(dt || 0, 0, 1 / 20); s.t += dt;
      if (s.t > .09) once('lift', () => { sp.yoff.t = 0; sp.sq.t = 1; sp.sq.v = .9; sp.lift.t = 1; sp.turn.t = 1; snd('whoosh'); hap('selection'); });
      if (sp.lift.x > .15) once('dolly', () => { sp.cam1.t = 1; });
      if (sp.lift.x > .42) once('hinge', () => { sp.cover.t = OPEN; });
      if (sp.cover.x > Math.PI / 2) once('light', () => hap('light'));
      const rest = springs(s, dt);
      pose(s);
      if (!flags.ed && s.t > .9 && Math.abs(sp.cover.x - OPEN) < .05 && s.pages.every(p => p.free && p.x < .012 && Math.abs(p.v) < .25) && sp.cam2.x > .8) showEditor();
      if (flags.ed) projectPage(s);
      if (rest && flags.ed) { sleep(s); return; }
      SB.requestFrame && SB.requestFrame();
    };
    wake(s);
    return done;
  }

  // ---- close ----
  function close() {
    const s = cur;
    if (!s || s.phase !== 'open') return Promise.resolve(false);
    s.phase = 'close';
    const { book, SB, sp } = s, n = s.note, el = s.el;
    // keep what was written: the printed page takes over from the DOM ink before the cover comes down
    n.title = el.ti.value.trim() || n.title || 'Untitled'; n.body = el.ta.value;
    book.drawPage(n); book.setTitle && book.setTitle(n.title);
    try { SB.save && SB.save(n); } catch (e) {}
    el.ti.blur(); el.ta.blur();
    el.root.classList.remove('ed', 'on');
    SBOpen.isOpen = false;
    let resolveClose; const done = new Promise(r => (resolveClose = r));
    const finish = () => {
      sleep(s);
      const g = book.group, h = s.home;
      if (h.parent && g.parent !== h.parent) h.parent.add(g);
      g.position.copy(h.pos); g.quaternion.copy(h.quat); g.scale.copy(h.scale);
      book.setCover(0); book.setFan(0); book.squash(1, 1); book.setGlow && book.setGlow(0);
      SB.camera.position.copy(s.camHome.pos); SB.camera.quaternion.copy(s.camHome.quat); SB.camera.updateMatrixWorld();
      setTimeout(() => el.root.remove(), 400); s.unkeep && s.unkeep();
      s.canvas.style.opacity = ''; s.canvas.classList.remove('sbo-fade');
      cur = null; SBOpen.book = null;
      SB.requestFrame && SB.requestFrame();
      resolveClose(true);
    };
    if (reduced()) {
      s.canvas.style.opacity = 0;
      setTimeout(() => { SB.homeOverlay && SB.homeOverlay(true); finish(); setTimeout(() => (s.canvas.style.opacity = 1), 30); }, 200);
      return done;
    }
    let t = 0, clapped = false;
    s.onSub = () => {
      if (!clapped && sp.cover.x <= 0 && sp.cover.v < 0) { // the clap: the board meets the block
        clapped = true;
        const v = Math.abs(sp.cover.v);
        sp.cover.x = 0; sp.cover.v = v * .1; sp.cover.t = 0; sp.cover.k = 320; sp.cover.z = .55;
        snd('clap', { gain: clamp(v / 9, .5, 1) }); hap('medium');
        sp.sq.v -= 2.4;
        try { SB.puff && SB.puff(book.group.localToWorld(new V3(.5, .7, .2)), 1); } catch (e) {}
        sp.lift.t = 0; sp.lift.z = 1; sp.lift.k = 70; sp.turn.t = 0; sp.turn.z = 1; sp.turn.k = 60; sp.cam1.t = 0; sp.cam1.k = sp.cam2.k = 40;
        SB.homeOverlay && SB.homeOverlay(true);
      }
    };
    s.pages[0].v = 1.5; // the page lifts a breath and settles
    s.tick = dt => {
      dt = clamp(dt || 0, 0, 1 / 20); t += dt;
      if (t > .26 && !s.falling) { s.falling = true; Object.assign(sp.cover, { t: -.7, k: 26, z: .12 }); snd('whoosh', { gain: .35, pitch: 1.3 }); }
      const rest = springs(s, dt);
      pose(s);
      if (clapped && rest) { finish(); return; }
      SB.requestFrame && SB.requestFrame();
    };
    wake(s);
    return done;
  }

  const SBOpen = window.SBOpen = { open, close, isOpen: false, book: null, get busy() { return !!cur; }, get _cur() { return cur; } };
})();
