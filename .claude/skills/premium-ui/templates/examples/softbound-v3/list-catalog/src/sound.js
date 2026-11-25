/* Softbound v3 sound: pure WebAudio synthesis, no files. Exposes SBSound + SBHaptics. */
(function () {
  var LS = 'sb-muted', SR = 48000;
  var muted = false; try { muted = localStorage.getItem(LS) === '1'; } catch (e) {}
  var ctx = null, chain = null, unlocked = false, roomWanted = false, room = null;

  // length in seconds of each sound (also used to size offline renders)
  var DUR = { thup: .22, tick: .045, whoosh: .55, riffle: .55, scratch: .16, clap: .3, pop: .14, sink: .45, bleed: 1.0 };
  // per-sound trim, tuned from offline loudness measurements
  var LV = { thup: 1.2, tick: 8, whoosh: .65, riffle: .85, scratch: .6, clap: 1.8, pop: 2, sink: 1.1, bleed: .55 };
  try { if (window.__SB_LV) for (var k in window.__SB_LV) LV[k] = window.__SB_LV[k]; } catch (e) {}

  function mkChain(c) {
    var bus = c.createGain();
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -26; comp.knee.value = 24; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .18;
    var lim = c.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .06;
    var out = c.createGain(); out.gain.value = 1;
    bus.connect(comp); comp.connect(lim); lim.connect(out); out.connect(c.destination);
    return { bus: bus, out: out };
  }
  function mkNoise(c) {
    var b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ---- voice helpers (R = {c, nb, out}) ----
  function noise(R, t, dur) {
    var s = R.c.createBufferSource(); s.buffer = R.nb; s.loop = true;
    s.start(t, Math.random() * .5); s.stop(t + dur + .02); return s;
  }
  function osc(R, type, f0, f1, t, dur, tc) {
    var o = R.c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + (tc || dur));
    o.start(t); o.stop(t + dur + .02); return o;
  }
  function filt(R, type, f, q) { var f_ = R.c.createBiquadFilter(); f_.type = type; f_.frequency.value = f; f_.Q.value = q || .7; return f_; }
  // fade-in a, exponential decay to dur, then to exact zero
  function amp(R, t, a, peak, dur) {
    var g = R.c.createGain(), p = g.gain;
    p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + a);
    p.exponentialRampToValueAtTime(.0005, t + dur - .003); p.linearRampToValueAtTime(0, t + dur);
    g.connect(R.out); return g;
  }
  function chainN(src) { for (var i = 1; i < arguments.length; i++) { src.connect(arguments[i]); src = arguments[i]; } return src; }

  var S = {
    thup: function (R, t, p) { // soft clay landing: low damped body + muffled knock
      var d = DUR.thup, a = amp(R, t, .004, .9, d);
      chainN(osc(R, 'sine', 105 * p, 58 * p, t, d, .09), a);
      var a2 = amp(R, t, .003, .5, .07);
      chainN(noise(R, t, .07), filt(R, 'lowpass', 240 * p), filt(R, 'lowpass', 240 * p), a2);
    },
    tick: function (R, t, p) { // wooden detent
      var a = amp(R, t, .001, .9, .014);
      chainN(noise(R, t, .02), filt(R, 'bandpass', 2800 * p, 7), filt(R, 'lowpass', 5000), a);
      var a2 = amp(R, t, .001, .45, .044);
      chainN(osc(R, 'sine', 1900 * p, 1900 * p, t, .044), a2);
    },
    whoosh: function (R, t, p) { // cloth through air
      var d = DUR.whoosh, f = filt(R, 'bandpass', 300 * p, 1.1), a = amp(R, t, .2, .8, d);
      f.frequency.setValueAtTime(300 * p, t);
      f.frequency.exponentialRampToValueAtTime(1500 * p, t + .25);
      f.frequency.exponentialRampToValueAtTime(500 * p, t + d);
      chainN(noise(R, t, d), f, filt(R, 'lowpass', 3200), a);
    },
    riffle: function (R, t, p) { // pages fanning: 4 flutters of tiny paper clicks
      for (var i = 0; i < 4; i++) for (var k = 0; k < 6; k++) {
        var tt = t + i * .115 + k * .0075 + Math.random() * .002, pk = (.8 - i * .1) * (1 - k * .13);
        chainN(noise(R, tt, .014), filt(R, 'bandpass', (3600 + Math.random() * 1800) * p, 1.2), amp(R, tt, .0015, pk, .012));
      }
    },
    scratch: function (R, t, p) { // nib on paper
      var d = DUR.scratch, g = R.c.createGain(), pr = g.gain, n = 16;
      pr.setValueAtTime(0, t);
      for (var i = 1; i < n; i++) {
        var u = i / n, env = Math.sin(Math.PI * u);
        pr.linearRampToValueAtTime(env * (.35 + Math.random() * .65), t + u * d);
      }
      pr.linearRampToValueAtTime(0, t + d); g.connect(R.out);
      chainN(noise(R, t, d), filt(R, 'highpass', 1800), filt(R, 'bandpass', 3800 * p, 4), filt(R, 'lowpass', 7000), g);
    },
    clap: function (R, t, p) { // hardcover closing + air
      chainN(osc(R, 'sine', 140 * p, 70 * p, t, .14, .1), amp(R, t, .002, .8, .14));
      chainN(noise(R, t, .06), filt(R, 'lowpass', 900 * p), filt(R, 'lowpass', 900 * p), amp(R, t, .002, .7, .06));
      var f = filt(R, 'bandpass', 1800 * p, 1.8);
      f.frequency.setValueAtTime(1800 * p, t); f.frequency.exponentialRampToValueAtTime(600 * p, t + .3);
      chainN(noise(R, t, .28), f, amp(R, t + .02, .03, .3, .26));
    },
    pop: function (R, t, p) { // spring back up
      chainN(osc(R, 'sine', 180 * p, 560 * p, t, .12, .07), amp(R, t, .003, .7, .12));
      chainN(noise(R, t, .03), filt(R, 'bandpass', 1300 * p, 2), filt(R, 'lowpass', 3000), amp(R, t, .002, .25, .03));
    },
    sink: function (R, t, p) { // squelch into clay
      var d = DUR.sink, f = filt(R, 'lowpass', 900 * p, 4);
      f.frequency.setValueAtTime(900 * p, t); f.frequency.exponentialRampToValueAtTime(180 * p, t + .4);
      var l = R.c.createGain(); l.gain.value = .7;
      var lf = osc(R, 'sine', 17, 17, t, d), lg = R.c.createGain(); lg.gain.value = .3; lf.connect(lg); lg.connect(l.gain);
      chainN(noise(R, t, d), f, l, amp(R, t, .02, .9, d));
      chainN(osc(R, 'sine', 140 * p, 60 * p, t, .35, .3), amp(R, t, .01, .5, .35));
    },
    bleed: function (R, t, p) { // watercolour wash
      var d = DUR.bleed, f = filt(R, 'lowpass', 500 * p, .7);
      f.frequency.setValueAtTime(500 * p, t);
      f.frequency.exponentialRampToValueAtTime(2200 * p, t + .4);
      f.frequency.exponentialRampToValueAtTime(900 * p, t + d);
      chainN(noise(R, t, d), filt(R, 'highpass', 200), f, amp(R, t, .35, .6, d));
    }
  };

  function voice(name, c, nb, out, t, p) {
    var g = c.createGain(); g.gain.value = LV[name]; g.connect(out);
    S[name]({ c: c, nb: nb, out: g }, t, p);
  }

  function startRoom() {
    if (room || !unlocked) return;
    var g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.006, ctx.currentTime + 2);
    var s = ctx.createBufferSource(); s.buffer = chain.nb; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
    var h = ctx.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = 60;
    s.connect(f); f.connect(h); h.connect(g); g.connect(chain.bus); s.start();
    room = { s: s, g: g };
  }
  function stopRoom() {
    if (!room) return; var r = room; room = null;
    r.g.gain.cancelScheduledValues(ctx.currentTime); r.g.gain.setValueAtTime(r.g.gain.value, ctx.currentTime);
    r.g.gain.linearRampToValueAtTime(0, ctx.currentTime + .5); r.s.stop(ctx.currentTime + .55);
  }

  window.SBSound = {
    names: Object.keys(S), durations: DUR,
    get muted() { return muted; },
    setMuted: function (m) {
      muted = !!m; try { localStorage.setItem(LS, muted ? '1' : '0'); } catch (e) {}
      if (muted) stopRoom(); else if (roomWanted) startRoom();
    },
    unlock: function () {
      if (unlocked) { try { ctx.resume(); } catch (e) {} return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try {
        ctx = new AC({ latencyHint: 'interactive' }); chain = mkChain(ctx); chain.nb = mkNoise(ctx);
        if (ctx.resume) ctx.resume(); unlocked = true;
        if (roomWanted && !muted) startRoom();
      } catch (e) { ctx = null; }
    },
    play: function (name, o) {
      if (!unlocked || muted || !S[name]) return;
      o = o || {};
      var p = (o.pitch || 1) * (1 + (Math.random() - .5) * .06), out = chain.bus;
      try {
        if (o.pan && ctx.createStereoPanner) {
          var pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, o.pan)); pn.connect(chain.bus); out = pn;
        }
        var g = ctx.createGain(); g.gain.value = o.gain == null ? 1 : o.gain; g.connect(out);
        voice(name, ctx, chain.nb, g, ctx.currentTime + .005, p);
      } catch (e) {}
    },
    room: function (on) {
      roomWanted = !!on;
      if (on && !muted) startRoom(); else stopRoom();
    },
    // test hook: same graph in an OfflineAudioContext
    __renderOffline: function (name, o) {
      o = o || {};
      var c = new OfflineAudioContext(1, Math.ceil((DUR[name] + .005) * SR), SR), ch = mkChain(c);
      voice(name, c, mkNoise(c), ch.bus, .005, o.pitch || 1);
      return c.startRendering().then(function (b) { return b.getChannelData(0); });
    }
  };

  function vib(ms) { try { const ua = navigator.userActivation; if (navigator.vibrate && (!ua || ua.hasBeenActive)) navigator.vibrate(ms); } catch (e) {} } // browsers block vibrate before the first touch; skip quietly
  window.SBHaptics = { selection: function () { vib(8); }, light: function () { vib(12); }, medium: function () { vib(20); } };
})();
