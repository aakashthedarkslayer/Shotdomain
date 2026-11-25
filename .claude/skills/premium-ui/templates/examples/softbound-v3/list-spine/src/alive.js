/* Softbound v3: living covers (brought over from v2's Meadow direction, whose covers breathed).
   window.SBAlive.fx(tag) → (ctx, t, P, k, base, tod): paints one frame over the cover art.
   P(u, v) maps cover space (0…1 across × 0…1 down the 768×1024 painting) to label pixels; k = painting width in px.
   Everything is a pure function of t (no state), so any book can start or stop mid-loop. Positions match art.js's scenes. */
(function () {
  'use strict';
  const TAU = Math.PI * 2, fract = x => x - Math.floor(x), rnd = i => fract(Math.sin(i * 127.1 + 311.7) * 43758.5453);
  const night = tod => tod === 'night';

  function glow(x, X, Y, r, rgb, a) {
    const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r);
  }
  // soft wisps rising from (u, v): steam from the dal pot and the tea cup
  function steam(x, t, P, k, u, v, n, rise, spread, size, tod) {
    x.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const per = 3.4 + 1.6 * rnd(i + 1), ph = fract(t / per + rnd(i + 40));
      const [X, Y] = P(u + (rnd(i + 5) - .5) * spread + .035 * Math.sin(t * .9 + ph * 5 + i), v - ph * rise);
      glow(x, X, Y, k * size * (.6 + ph * 1.1), night(tod) ? '205,212,240' : '255,246,232', .2 * Math.sin(Math.PI * ph));
    }
  }

  const FX = {
    Travel(x, t, P, k, base, tod) { // petals drift off the two branches; glints wink on the lake
      for (let i = 0; i < 16; i++) {
        const per = 7 + 4 * rnd(i), ph = fract(t / per + rnd(i + 50)), left = i % 2 === 0;
        const u = (left ? .02 + .22 * rnd(i + 3) : .7 + .26 * rnd(i + 3)) + ph * (.22 + .14 * rnd(i + 9)) * (left ? 1 : -.7) + .03 * Math.sin(t * 1.3 + i);
        const v = .06 + .12 * rnd(i + 7) + ph * .62, r = k * .011 * (.7 + .6 * rnd(i + 11));
        const [X, Y] = P(u, v);
        x.save(); x.translate(X, Y); x.rotate(t * (1 + rnd(i)) * 2 + i); x.scale(1, .5 + .45 * Math.sin(t * 3 + i));
        x.globalAlpha = Math.sin(Math.PI * Math.min(1, ph * 1.15)) * (night(tod) ? .55 : .9);
        x.fillStyle = i % 3 ? '#F4B3C6' : '#FBD6E0'; x.beginPath(); x.ellipse(0, 0, r, r * .62, 0, 0, TAU); x.fill(); x.restore();
      }
      x.globalCompositeOperation = 'screen';
      for (let i = 0; i < 12; i++) {
        const [X, Y] = P(.08 + .84 * rnd(i + 20), .62 + .12 * rnd(i + 30)), a = Math.pow(Math.max(0, Math.sin(t * 1.6 + i * 2.1)), 3) * (night(tod) ? .35 : .55);
        x.globalAlpha = a; x.fillStyle = '#FFF2D6'; x.fillRect(X - k * .022, Y, k * .044, Math.max(1, k * .004));
      }
    },
    Recipes(x, t, P, k, base, tod) { steam(x, t, P, k, .5, .5, 8, .34, .2, .05, tod); },
    Personal(x, t, P, k, base, tod) { // the cat breathes (its own pixels, stretched up from the cushion); dust floats in the window light
      const [x0, y0] = P(.35, .49), [x1, y1] = P(.79, .655), w = x1 - x0, h = y1 - y0, s = 1 + .028 * (.5 + .5 * Math.sin(t * TAU / 3.8));
      x.drawImage(base, x0, y0, w, h, x0, y1 - h * s, w, h * s);
      x.globalCompositeOperation = 'screen';
      for (let i = 0; i < 14; i++) {
        const [X, Y] = P(.3 + .42 * fract(rnd(i + 60) + t * .006 * (1 + rnd(i))) + .02 * Math.sin(t * .5 + i), .12 + .36 * fract(rnd(i + 70) - t * .01 * (.5 + rnd(i + 2))));
        glow(x, X, Y, k * .008, night(tod) ? '200,210,255' : '255,226,170', (.35 + .35 * Math.sin(t * 1.2 + i * 1.7)) * (night(tod) ? .5 : 1));
      }
    },
    Work(x, t, P, k, base, tod) { // a little flock crosses the sky; at night the city's windows twinkle
      x.lineCap = 'round'; x.lineWidth = Math.max(1.2, k * .004); x.strokeStyle = night(tod) ? 'rgba(210,214,240,.55)' : 'rgba(58,52,82,.6)';
      const ph = fract(t / 16);
      for (let i = 0; i < 4; i++) {
        const [X, Y] = P(-.1 + ph * 1.25 - i * .045, .16 + .03 * i + .015 * Math.sin(t * .8 + i)), f = Math.sin(t * 9 + i * 1.3), s = k * .016;
        x.beginPath(); x.moveTo(X - s, Y - s * .35 * f); x.quadraticCurveTo(X - s * .45, Y - s * .5 * f - s * .2, X, Y); x.quadraticCurveTo(X + s * .45, Y - s * .5 * f - s * .2, X + s, Y - s * .35 * f); x.stroke();
      }
      if (night(tod)) { x.globalCompositeOperation = 'screen';
        for (let i = 0; i < 18; i++) { const [X, Y] = P(.05 + .9 * rnd(i + 80), .7 + .14 * rnd(i + 90)); x.globalAlpha = Math.pow(Math.max(0, Math.sin(t * (.7 + rnd(i)) + i * 3)), 4) * .8; x.fillStyle = '#FFD98A'; x.fillRect(X, Y, Math.max(1.5, k * .005), Math.max(1.5, k * .005)); } }
    },
    Reading(x, t, P, k, base, tod) { // monsoon rain on the window; the tea steams
      const [wx0, wy0] = P(.06, .05), [wx1, wy1] = P(.67, .57);
      x.save(); x.beginPath(); x.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); x.clip();
      x.strokeStyle = night(tod) ? 'rgba(190,200,235,.32)' : 'rgba(236,240,252,.38)'; x.lineWidth = Math.max(1, k * .0025);
      for (let i = 0; i < 46; i++) {
        const per = .6 + .45 * rnd(i), ph = fract(t / per + rnd(i + 10)), X = wx0 + (wx1 - wx0) * rnd(i + 20) + ph * k * .03, Y = wy0 - k * .05 + (wy1 - wy0 + k * .1) * ph;
        x.beginPath(); x.moveTo(X, Y); x.lineTo(X - k * .012, Y - k * .06); x.stroke();
      }
      x.fillStyle = 'rgba(240,244,255,.45)';
      for (let i = 0; i < 6; i++) { const ph = fract(t / (6 + 4 * rnd(i + 30)) + rnd(i + 31)), X = wx0 + (wx1 - wx0) * rnd(i + 32), Y = wy0 + (wy1 - wy0) * Math.pow(ph, 1.6);
        x.beginPath(); x.ellipse(X, Y, k * .005, k * .008, 0, 0, TAU); x.fill(); }
      x.restore();
      steam(x, t, P, k, .345, .63, 5, .14, .05, .025, tod);
    },
    Ideas(x, t, P, k, base, tod) { // fireflies wander and pulse; the sky lantern's flame breathes; stars twinkle
      x.globalCompositeOperation = 'screen';
      for (let i = 0; i < 10; i++) {
        const [X, Y] = P(.08 + .84 * rnd(i + 100) + .05 * Math.sin(t * (.25 + .2 * rnd(i)) + i), .26 + .34 * rnd(i + 110) + .04 * Math.cos(t * (.3 + .2 * rnd(i + 1)) + i * 2));
        glow(x, X, Y, k * .022, '255,196,110', .55 * (.45 + .55 * Math.pow(Math.max(0, Math.sin(t * (.9 + rnd(i + 5)) + i * 2.3)), 2)));
      }
      const [LX, LY] = P(.59, .33); glow(x, LX, LY, k * .14, '255,170,90', .1 + .07 * Math.sin(t * 2.1) + .03 * Math.sin(t * 5.3));
      for (let i = 0; i < 12; i++) { const [X, Y] = P(rnd(i + 120), .02 + .2 * rnd(i + 130)), a = Math.pow(Math.max(0, Math.sin(t * (.8 + rnd(i)) + i * 4)), 6), s = k * .012 * a;
        x.globalAlpha = a; x.fillStyle = '#FFFFFF'; x.fillRect(X - s, Y - .6, 2 * s, 1.2); x.fillRect(X - .6, Y - s, 1.2, 2 * s); }
    }
  };
  window.SBAlive = { fx: tag => FX[tag] || FX.Ideas };
})();
