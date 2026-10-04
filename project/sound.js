// Synthesised stadium sound: crowd bed, referee whistle, floodlight clunk, whoosh. No audio files.
export function createSound() {
  let ctx = null, master, crowdG, lp, on = false, lastLvl = -1, lastOpen = -1;
  const noiseBuf = (secs, brown) => {
    const len = Math.floor(ctx.sampleRate * secs), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2 + w * 0.06; } else d[i] = w; } }
    return b;
  };
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(6, true); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5;
    lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    crowdG = ctx.createGain(); crowdG.gain.value = 0;
    const swell = ctx.createGain(); swell.gain.value = 1;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11; const lfoG = ctx.createGain(); lfoG.gain.value = 0.25; lfo.connect(lfoG); lfoG.connect(swell.gain);
    src.connect(bp); bp.connect(lp); lp.connect(swell); swell.connect(crowdG); crowdG.connect(master);
    src.start(); lfo.start();
  }
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  return {
    get enabled() { return on; },
    toggle(v) {
      on = v === undefined ? !on : v;
      if (on && !ctx) init();
      if (ctx) { ctx.resume && ctx.resume(); master.gain.setTargetAtTime(on ? 0.85 : 0, ctx.currentTime, 0.25); }
      return on;
    },
    setCrowd(level, open) {
      if (!ctx || !on) return;
      if (Math.abs(level - lastLvl) > 0.005) { crowdG.gain.setTargetAtTime(level, ctx.currentTime, 0.5); lastLvl = level; }
      if (Math.abs(open - lastOpen) > 0.005) { lp.frequency.setTargetAtTime(260 + open * 3600, ctx.currentTime, 0.5); lastOpen = open; }
    },
    whistle(n = 1) {
      if (!ctx || !on) return; let t = ctx.currentTime + 0.05;
      for (let k = 0; k < n; k++) {
        const dur = k === n - 1 ? (n === 3 ? 1.1 : 0.7) : 0.32;
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 2950;
        const v = ctx.createOscillator(); v.frequency.value = 34; const vg = ctx.createGain(); vg.gain.value = 140; v.connect(vg); vg.connect(o.frequency);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.setValueAtTime(0.18, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(master); o.start(t); v.start(t); o.stop(t + dur + 0.05); v.stop(t + dur + 0.05);
        t += dur + 0.14;
      }
    },
    clunk() {
      if (!ctx || !on) return; const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
      const g = ctx.createGain(); env(g, t, 0.005, 0.5, 0.45); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.6);
      const n = ctx.createBufferSource(); n.buffer = noiseBuf(0.3, false); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      const ng = ctx.createGain(); env(ng, t, 0.002, 0.25, 0.15); n.connect(f); f.connect(ng); ng.connect(master); n.start(t);
    },
    whoosh(strength = 1) {
      if (!ctx || !on) return; const t = ctx.currentTime;
      const n = ctx.createBufferSource(); n.buffer = noiseBuf(0.9, false);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.5);
      const g = ctx.createGain(); env(g, t, 0.12, 0.22 * strength, 0.55); n.connect(f); f.connect(g); g.connect(master); n.start(t);
    },
    roar() {
      if (!ctx || !on) return; const t = ctx.currentTime;
      const n = ctx.createBufferSource(); n.buffer = noiseBuf(3, true); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.4;
      const g = ctx.createGain(); env(g, t, 0.6, 0.6, 2.2); n.connect(f); f.connect(g); g.connect(master); n.start(t);
    },
  };
}
