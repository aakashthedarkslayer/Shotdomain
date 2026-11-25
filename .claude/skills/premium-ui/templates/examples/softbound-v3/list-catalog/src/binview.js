/* Softbound v3: the clay bin's UI (BIN agent). Loaded after scene.js; talks only through window.SB.bin.
   On the shelf: a tap target + count badge that rides on the resting pot. In the bin view: the header, the front book's caption,
   "Bring back", hold-to-empty (a charging ring that heats the kiln while you hold), Escape/back/tap-outside to close, an sr-only list. */
(function () {
  'use strict';
  const SB = window.SB; if (!SB || !SB.bin || !SB.screenEl) return;
  const B = SB.bin, screenEl = SB.screenEl, homeEl = screenEl.querySelector('.sb-home') || screenEl, cv = screenEl.querySelector('canvas');
  const hap = k => { try { window.SBHaptics && SBHaptics[k] && SBHaptics[k](); } catch (e) {} };
  const snd = (n, o) => { try { window.SBSound && SBSound.play(n, o || {}); } catch (e) {} };
  const CLOTH = window.SB_CLOTH || {}, INK = window.SB_INK || {}, glyph = (t, z) => window.SB_GLYPH_SVG ? SB_GLYPH_SVG(t, z) : '';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const HOLD_MS = 1200;
  const ago = at => { const s = (Date.now() - at) / 1000; return s < 45 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : 'at ' + new Date(at).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}); };
  const plural = n => `${n} notebook${n === 1 ? '' : 's'}`;
  const IC = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const st = document.createElement('style');
  st.textContent = `
#screen .sb-binb{all:unset;box-sizing:border-box;position:absolute;left:0;top:0;width:62px;height:70px;border-radius:26px;cursor:pointer;pointer-events:auto;z-index:2;opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s;-webkit-tap-highlight-color:transparent}
#screen .sb-binb.on{opacity:1;visibility:visible;transition:opacity .4s}
#screen .sb-binb:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
#screen .sb-binc{position:absolute;right:-2px;top:-4px;min-width:22px;height:22px;padding:0 6px;box-sizing:border-box;border-radius:11px;background:#B65A31;color:#FFF6EC;font:750 12px/22px var(--fd);text-align:center;
  box-shadow:0 0 0 2px rgba(255,248,238,.92),0 6px 12px -4px rgba(90,40,20,.55);transform-origin:30% 80%}
#screen[data-time="night"] .sb-binc{box-shadow:0 0 0 2px rgba(46,38,52,.9),0 6px 12px -4px rgba(0,0,0,.6)}
#screen .sb-binc.pop{animation:sb-binpop .55s cubic-bezier(.3,1.9,.5,1)}
@keyframes sb-binpop{0%{transform:scale(.3)}100%{transform:scale(1)}}
#screen.overview .sb-binb{opacity:0;pointer-events:none}
#screen .sb-bv{position:absolute;inset:0;z-index:5;opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s;touch-action:none;cursor:grab}
#screen .sb-bv.on{opacity:1;visibility:visible;transition:opacity .5s .35s}
#screen .bv-hd{position:absolute;top:60px;left:20px;display:flex;align-items:center;gap:14px;pointer-events:none}
#screen .bv-hd .sb-ib{pointer-events:auto}
#screen .bv-hd .sb-ttl{margin:3px 0 0}
#screen .bv-cap{position:absolute;left:24px;right:24px;bottom:132px;transition:opacity .2s,transform .35s cubic-bezier(.2,0,0,1);pointer-events:none}
#screen .bv-cap.out{opacity:0;transform:translateY(6px)}
#screen .bv-cap .sb-nt{white-space:nowrap}
#screen .bv-hint{margin:10px 0 0;font:600 12px var(--fd);color:var(--mut);letter-spacing:.01em;display:flex;align-items:center;gap:6px}
#screen .bv-hint svg{opacity:.7}
#screen[data-time="night"] .bv-cap,#screen[data-time="night"] .bv-hd{text-shadow:0 1px 10px rgba(20,12,24,.55)}
#screen .bv-act{position:absolute;left:20px;right:20px;bottom:44px;display:flex;gap:10px}
#screen .bv-act button{all:unset;box-sizing:border-box;cursor:pointer;flex:1;height:56px;border-radius:28px;display:flex;align-items:center;justify-content:center;gap:8px;font:700 15px var(--fd);position:relative;
  transition:transform .25s cubic-bezier(.3,1.6,.5,1),background 1s,color 1s;-webkit-tap-highlight-color:transparent}
#screen .bv-act button:active{transform:scale(.95)}
#screen .bv-act button:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
#screen .bv-act .bv-rs{background:#2B2A4A;color:#fff;box-shadow:0 12px 22px -10px rgba(43,42,74,.75),inset 0 1px 0 rgba(255,255,255,.18)}
#screen[data-time="night"] .bv-act .bv-rs{background:#F3D9A8;color:#2B2A4A}
#screen .bv-act .bv-em{background:var(--pill);color:var(--ink);box-shadow:0 1px 1px rgba(80,50,40,.06),0 12px 22px -12px rgba(80,50,40,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);overflow:visible}
#screen .bv-em::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,#F2C48E,#E8743A 70%,#D9461E);opacity:.92;transform-origin:left;transform:scaleX(var(--p,0))}
#screen .bv-em span,#screen .bv-em svg.ic{position:relative}
#screen .bv-em.charging{transform:scale(.97)}
#screen .bv-em .rg{position:absolute;inset:-4px;width:calc(100% + 8px);height:64px;overflow:visible;pointer-events:none}
#screen .bv-em .rg rect{fill:none;stroke:#E2622E;stroke-width:2.5;stroke-linecap:round;stroke-dasharray:100;transition:stroke-dashoffset .25s}
#screen .bv-em.charging .rg rect{transition:none}
`;
  document.head.appendChild(st);

  const btn = document.createElement('button'); btn.className = 'sb-binb'; btn.innerHTML = '<b class="sb-binc" aria-hidden="true">0</b>';
  homeEl.appendChild(btn);
  const badge = btn.firstChild;
  const view = document.createElement('div'); view.className = 'sb-bv'; view.setAttribute('role', 'dialog'); view.setAttribute('aria-modal', 'true'); view.setAttribute('aria-label', 'Clay bin'); view.inert = true;
  view.innerHTML = `<div class="bv-hd"><button class="sb-ib bv-x" aria-label="Close the bin">${IC('<path d="M14.5 5.5 8 12l6.5 6.5"/>')}</button><div><p class="sb-cnt"></p><p class="sb-ttl">Clay bin</p></div></div>
    <div class="bv-cap" aria-live="polite"></div>
    <div class="bv-act"><button class="bv-rs">${IC('<path d="M12 19V6M6.5 11 12 5.5l5.5 5.5"/>')}<span>Bring back</span></button><button class="bv-em" aria-label="Empty the bin forever. Press and hold."><svg class="rg" aria-hidden="true"><rect pathLength="100"/></svg><svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 3.2 4.6 4.8 4.6 9.2A4.6 4.6 0 0 1 12 17a4.6 4.6 0 0 1-4.6-4.8c0-2 1-3.3 2-4.3.2 1.6 1 2.6 2 2.9C11 8.3 11.3 5.4 12 3z"/><path d="M6 21h12"/></svg><span>Hold to empty</span></button></div>
    <ul class="sb-sr" aria-label="Notebooks in the bin"></ul><p class="sb-sr bv-say" aria-live="polite"></p>`;
  screenEl.appendChild(view);
  const $ = s => view.querySelector(s), cap = $('.bv-cap'), cnt = $('.sb-cnt'), list = $('ul.sb-sr'), say = $('.bv-say'), rs = $('.bv-rs'), em = $('.bv-em'), ring = em.querySelector('.rg rect');

  /* ---- the pot's tap target, riding on the 3D pot ---- */
  let lastN = 0, px = -1, py = -1, ph = -1;
  function sync() {
    const L = B.list, n = L.length;
    badge.textContent = n > 99 ? '99+' : n;
    if (n > lastN) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
    lastN = n;
    btn.setAttribute('aria-label', n ? `Clay bin: ${plural(n)}. Open it to bring one back.` : 'Clay bin is empty');
    cnt.textContent = n ? `${plural(n)} resting in the clay` : 'Empty';
    list.innerHTML = L.map((r, i) => `<li><button data-i="${i}" aria-label="Bring back ${esc(r.note.title || 'Untitled')}, ${esc(r.note.tag)}, deleted ${ago(r.at)}"></button></li>`).join('');
    em.disabled = rs.disabled = !n;
    place();
  }
  function place() {
    const a = B.anchor(), show = !!a && !B.isOpen && lastN > 0;
    btn.classList.toggle('on', show); if (!show) return;
    const top = a.y - 10, h = Math.max(44, a.bottom - top + 6);
    if (Math.abs(a.x - px) > .4 || Math.abs(top - py) > .4 || Math.abs(h - ph) > .4) { px = a.x; py = top; ph = h; btn.style.transform = `translate(${(a.x - 31).toFixed(1)}px,${top.toFixed(1)}px)`; btn.style.height = h.toFixed(1) + 'px'; }
  }
  SB.onTick(place); // runs only while the scene loop is awake
  btn.addEventListener('click', () => { if (B.busy) return; snd('tick', {pitch: .8}); hap('selection'); B.open(); });

  /* ---- the bin view ---- */
  function caption() {
    const L = B.list, r = L[Math.max(0, B.front)];
    cap.classList.add('out'); clearTimeout(caption.t);
    caption.t = setTimeout(() => {
      if (!r) { cap.innerHTML = ''; return; }
      const n = r.note, c = mix(CLOTH[n.tag] || '#CDBDF2', '#FFFFFF', .35);
      cap.innerHTML = `<div class="sb-meta"><span class="sb-tg" style="--c:${c};--d:${INK[n.tag] || '#2B2A4A'}">${glyph(n.tag, 12)}${esc(n.tag)}</span><span>Deleted ${ago(r.at)}</span></div>
        <p class="sb-nt">${esc(n.title || 'Untitled')}</p><p class="sb-sn" style="-webkit-line-clamp:1">${esc(n.body) || 'Empty for now.'}</p>
        <p class="bv-hint">${L.length > 1 ? 'Spin the pot to browse · tap a book to bring it back' : 'Tap the book to bring it back'}</p>`;
      cap.classList.remove('out');
      rs.setAttribute('aria-label', `Bring back ${n.title || 'Untitled'}`);
    }, 120);
  }
  let opener = null;
  function opened() {
    opener = document.activeElement; view.inert = false; view.classList.add('on'); homeEl.inert = true; if (cv) cv.inert = true;
    sync(); caption(); setTimeout(() => { if (B.isOpen) rs.focus({preventScroll: true}); }, 380);
  }
  function closed() {
    view.classList.remove('on'); view.inert = true; homeEl.inert = false; if (cv) cv.inert = false; endHold(true);
    const back = opener && opener.isConnected && !opener.closest('[inert]') && opener !== document.body ? opener : cv; opener = null;
    setTimeout(() => { try { (btn.classList.contains('on') ? btn : back || cv).focus({preventScroll: true}); } catch (e) {} }, 60);
  }
  B.onchange = type => {
    if (type === 'open') opened(); else if (type === 'close') closed();
    else if (type === 'front') caption();
    else if (type === 'emptied') { say.textContent = 'The bin was fired. Those notebooks are gone.'; }
    if (type !== 'front') sync();
    if (type === 'change' && B.isOpen) caption();
  };
  $('.bv-x').addEventListener('click', () => B.close());
  rs.addEventListener('click', () => { if (B.list.length) B.restore(Math.max(0, B.front)); });
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) B.restore(+b.dataset.i); });
  list.addEventListener('focusin', e => { const b = e.target.closest('button'); if (b) B.spinTo(+b.dataset.i); });
  view.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); B.close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); B.spinBy(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); B.spinBy(-1); }
  });
  // drag sideways to spin the pot; tap a book (the front one comes home, another spins to the front); tap outside to close
  let d = null;
  const k = () => (screenEl.getBoundingClientRect().width / 390) || 1;
  view.addEventListener('pointerdown', e => { if (e.target.closest('button') || !B.isOpen) return; d = {x0: e.clientX, y0: e.clientY, lx: e.clientX, lt: performance.now(), v: 0, moved: false}; try { view.setPointerCapture(e.pointerId); } catch (_) {} });
  view.addEventListener('pointermove', e => { if (!d) return; const dx = (e.clientX - d.x0) / k();
    if (!d.moved && Math.hypot(dx, (e.clientY - d.y0) / k()) > 7) { d.moved = true; B.drag(0, 'start'); }
    if (!d.moved) return; const now = performance.now(), dt = Math.max(1, now - d.lt) / 1000; d.v = d.v * .55 + ((e.clientX - d.lx) / k() / 120 / dt) * .45; d.lx = e.clientX; d.lt = now; B.drag(dx, 'move'); });
  const up = e => { if (!d) return; const D = d; d = null;
    if (D.moved) { B.drag((e.clientX - D.x0) / k(), 'end', performance.now() - D.lt > 90 ? 0 : D.v); return; }
    if (e.type !== 'pointerup') return;
    const i = B.pick(e.clientX, e.clientY);
    if (i < 0) B.close(); else if (i === B.front) B.restore(i); else { B.spinTo(i); hap('selection'); } };
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);

  /* ---- hold to empty: the ring charges and the kiln warms while you hold; let go early and it cools ---- */
  let hold = null;
  function startHold() {
    if (hold || !B.list.length || !B.isOpen) return;
    hold = {t0: performance.now(), raf: 0, q: 0}; em.classList.add('charging'); em.querySelector('span').textContent = 'Keep holding…'; hap('selection'); snd('scratch', {pitch: .5, gain: .5});
    const loop = () => { if (!hold) return; const p = Math.min(1, (performance.now() - hold.t0) / HOLD_MS), q = Math.floor(p * 4);
      em.style.setProperty('--p', p.toFixed(3)); ring.setAttribute('stroke-dashoffset', (100 - p * 100).toFixed(1)); B.charge(p);
      if (q > hold.q) { hold.q = q; if (q < 4) { hap('selection'); snd('tick', {pitch: .7 + q * .15, gain: .5}); } }
      if (p >= 1) { hold = null; em.classList.remove('charging'); em.querySelector('span').textContent = 'Firing…'; cap.classList.add('out'); B.empty(); setTimeout(() => endHold(true), 600); return; }
      hold.raf = requestAnimationFrame(loop); };
    loop();
  }
  function endHold(reset) {
    if (hold) { cancelAnimationFrame(hold.raf); hold = null; B.charge(0); }
    else if (!reset) return;
    em.classList.remove('charging'); em.style.setProperty('--p', 0); ring.setAttribute('stroke-dashoffset', 100); em.querySelector('span').textContent = 'Hold to empty';
  }
  em.addEventListener('pointerdown', e => { e.preventDefault(); try { em.setPointerCapture(e.pointerId); } catch (_) {} startHold(); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => em.addEventListener(ev, () => endHold()));
  em.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
  em.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') endHold(); });
  em.addEventListener('click', e => e.preventDefault());
  // the ring's rounded rect matches the button once it has a size
  const sizeRing = () => { const r = em.getBoundingClientRect(), s = k(), w = r.width / s + 8, h = 64; const rr = ring;
    rr.setAttribute('x', 1.25); rr.setAttribute('y', 1.25); rr.setAttribute('width', Math.max(10, w - 2.5)); rr.setAttribute('height', h - 2.5); rr.setAttribute('rx', (h - 2.5) / 2); rr.setAttribute('stroke-dashoffset', 100); };
  requestAnimationFrame(sizeRing); addEventListener('resize', sizeRing);
  sync();
})();
