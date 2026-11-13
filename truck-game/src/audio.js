// Synthesized sounds (Web Audio): engine, horn, impacts and the delivery jingle. No audio files.
export function createAudio() {
  let ctx = null;
  let engine = null;
  let master = null;
  let hornNodes = null;
  let enabled = true;

  function start() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.7 : 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    const sub = ctx.createGain();
    sub.gain.value = 0.5;
    osc1.connect(filter);
    osc2.connect(sub).connect(filter);
    filter.connect(gain).connect(master);
    osc1.start();
    osc2.start();
    engine = { osc1, osc2, filter, gain };
  }

  function updateEngine(rpm, throttle) {
    if (!engine) return;
    const t = ctx.currentTime;
    const f = 18 + (rpm / 2400) * 55;
    engine.osc1.frequency.setTargetAtTime(f, t, 0.05);
    engine.osc2.frequency.setTargetAtTime(f / 2, t, 0.05);
    engine.filter.frequency.setTargetAtTime(300 + throttle * 900 + rpm * 0.15, t, 0.08);
    engine.gain.gain.setTargetAtTime(0.08 + throttle * 0.1, t, 0.1);
  }

  function horn(on) {
    if (!ctx) return;
    if (on && !hornNodes) {
      const g = ctx.createGain();
      g.gain.value = 0.12;
      g.connect(master);
      const oscs = [311, 370].map((f) => {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = f;
        o.connect(g);
        o.start();
        return o;
      });
      hornNodes = { g, oscs };
    } else if (!on && hornNodes) {
      hornNodes.oscs.forEach((o) => o.stop());
      hornNodes.g.disconnect();
      hornNodes = null;
    }
  }

  function thud(strength = 1) {
    if (!ctx) return;
    const len = 0.25;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    const g = ctx.createGain();
    g.gain.value = Math.min(1, 0.3 + strength * 0.4);
    src.connect(f).connect(g).connect(master);
    src.start();
  }

  function jingle(notes = [523, 659, 784, 1047]) {
    if (!ctx) return;
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.4);
    });
  }

  return {
    start,
    updateEngine,
    horn,
    thud,
    jingle,
    suspend: () => ctx && ctx.suspend(),
    resume: () => ctx && ctx.resume(),
    setEnabled(on) {
      enabled = on;
      if (master) master.gain.value = on ? 0.7 : 0;
    },
  };
}
