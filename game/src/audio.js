// Runway Dawn — procedural sound. No audio files: every effect is synthesized
// with the Web Audio API (oscillators + noise), so the game ships zero assets
// and makes zero network requests. The context only starts after a user
// gesture, so headless screenshot runs stay silent without errors.

export function createAudio() {
  let ctx = null;
  let master = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return true;
    } catch (_e) {
      return false;
    }
  }

  function unlock() {
    if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function beep(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    try {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (_e) { /* headless: stay silent */ }
  }

  function noiseBurst(dur, vol, lowpass) {
    if (!ensure() || muted) return;
    try {
      const t = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = lowpass || 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol || 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filt).connect(g).connect(master);
      src.start(t);
    } catch (_e) { /* headless: stay silent */ }
  }

  return {
    unlock,
    get muted() { return muted; },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.35; return muted; },
    pickup() { beep(660, 0.12, 'sine', 0.15, 990); },
    cash() { beep(880, 0.1, 'sine', 0.14); setTimeout(() => beep(1318, 0.16, 'sine', 0.14), 90); },
    crash() { noiseBurst(0.25, 0.3, 500); beep(90, 0.2, 'sawtooth', 0.12, 45); },
    punch() { noiseBurst(0.08, 0.18, 1400); },
    sirenOn() {
      if (!ensure() || sirenOsc || muted) return;
      try {
        sirenOsc = ctx.createOscillator();
        sirenOsc.type = 'sine';
        sirenOsc.frequency.value = 700;
        sirenGain = ctx.createGain();
        sirenGain.gain.value = 0.045;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.6;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 260;
        lfo.connect(lfoGain).connect(sirenOsc.frequency);
        sirenOsc.connect(sirenGain).connect(master);
        sirenOsc.start();
        lfo.start();
        sirenOsc._lfo = lfo;
      } catch (_e) { sirenOsc = null; }
    },
    sirenOff() {
      try { if (sirenOsc) { sirenOsc.stop(); sirenOsc._lfo && sirenOsc._lfo.stop(); } } catch (_e) {}
      sirenOsc = null;
    },
    engine(speedNorm) {
      if (!ensure() || muted) return;
      try {
        if (!engineOsc) {
          engineOsc = ctx.createOscillator();
          engineOsc.type = 'sawtooth';
          engineGain = ctx.createGain();
          engineGain.gain.value = 0;
          const filt = ctx.createBiquadFilter();
          filt.type = 'lowpass';
          filt.frequency.value = 420;
          engineOsc.connect(filt).connect(engineGain).connect(master);
          engineOsc.start();
        }
        const t = ctx.currentTime;
        engineOsc.frequency.setTargetAtTime(55 + speedNorm * 130, t, 0.08);
        engineGain.gain.setTargetAtTime(speedNorm > 0.03 ? 0.05 + speedNorm * 0.05 : 0, t, 0.1);
      } catch (_e) { /* headless: stay silent */ }
    },
    engineOff() {
      try { if (engineGain) engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch (_e) {}
    },
  };
}
