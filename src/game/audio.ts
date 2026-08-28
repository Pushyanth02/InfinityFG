/* Procedural WebAudio sound engine — no audio assets, everything synthesized.
   Patch 7.0 "The Pure Arcanum": ADAPTIVE MUSIC INTENSITY (0 menu / 1 combat /
   2 boss — filter cutoff + pluck rate + a kick-heartbeat pulse layer on boss
   waves, Synthetik-style vertical layering), a duck() dip for pause/game-over,
   and new UI + gameplay voices (hover, tab, fuse, boss sting, tribute
   fanfare). All voices remain cheap oscillators; the noise buffer is cached
   and shared with the percussion layer.
   Patch 10.0 "The Sealed Rift": the score is MIXED LOUD — the music bus
   headroom rose ×0.5 → ×0.85 so the score is clearly hearable under SFX,
   the drone carries an extra octave-doubled layer, and BOSS MODE is a full
   ostinato: a driving two-tone minor-third pulse at 480ms + a tremolo
   saw layer, triggered the instant a tyrant enters the arena. Suspended-
   context guards stop note pile-ups when the tab is backgrounded. */

type OscType = OscillatorType;

/* Act-tinted musical roots (Hz, minor pentatonic-friendly). Patch 10.0:
   sixth root for the endless act (The Hollow Echo) — darker, half-step down. */
const ACT_ROOTS = [110.0, 98.0, 123.47, 87.31, 130.81, 92.5];
const PENTA = [1, 1.2, 1.5, 1.8, 2.25, 2.7, 3.0];

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  /* current settings (0..1 each) */
  private volMaster = 0.8;
  private volMusic = 0.7;
  private volSfx = 0.9;

  /* music state */
  private musicNodes: { osc: OscillatorNode[]; lfo: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  private musicTimer: number | undefined;
  private musicAct = 0;
  private musicOn = false;
  private lastPluck = 0;

  /* Patch 7.0 — adaptive intensity (0 menu / 1 combat / 2 boss), boss pulse
     layer timer, and the pause/game-over duck multiplier.
     Patch 10.0 — boss mode also drives a tremolo saw layer + a two-tone
     ostinato; bossBeatIdx alternates the ostinato notes. */
  private intensity: 0 | 1 | 2 = 1;
  private pulseTimer: number | undefined;
  private duckMul = 1;
  private bossBeatIdx = 0;
  private tremolo: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode } | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.sfxBus.connect(this.master);
        this.musicBus.connect(this.master);
        this.master.connect(this.ctx.destination);
        this.applyVolumes();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ensure();
    /* start the ambient score on first gesture — browsers require it */
    this.startMusic();
  }

  /** Set all volumes. Values are 0..100 from the settings sliders. */
  setVolumes(master: number, music: number, sfx: number) {
    this.volMaster = Math.max(0, Math.min(100, master)) / 100;
    this.volMusic = Math.max(0, Math.min(100, music)) / 100;
    this.volSfx = Math.max(0, Math.min(100, sfx)) / 100;
    this.applyVolumes();
    /* music mute → stop scheduling plucks to save cycles */
    if (this.volMusic * this.volMaster <= 0.001) this.stopMusic();
    else this.startMusic();
  }

  get muted(): boolean { return this.volMaster <= 0.001; }

  private applyVolumes() {
    if (!this.master || !this.sfxBus || !this.musicBus) return;
    const t = this.ctx?.currentTime ?? 0;
    this.master.gain.setTargetAtTime(this.volMaster, t, 0.03);
    this.sfxBus.gain.setTargetAtTime(this.volSfx, t, 0.03);
    /* Patch 10.0 — the music bus mix is LOUD and clear: ×0.5 → ×0.85
        headroom. The drone layers sit well below sum-to-1 so ×0.85 stays
        clean at full volume; duck() still dips to 0.3 for pause/death. */
    this.musicBus.gain.setTargetAtTime(this.volMusic * 0.85 * this.duckMul, t, 0.12);
  }

  /* ------------------------ adaptive music intensity ---------------------- */

  /** Patch 7.0 — set the music intensity: 0 = menu (calm, dark), 1 = combat
      (default), 2 = boss (bright drone + kick heartbeat + faster plucks).
      Patch 10.0 — the transition is IMMEDIATE when a boss enters (the filter
      glide time-constant dropped 1.4s → 0.5s) and boss mode layers a driving
      two-tone ostinato + tremolo saw for a dramatic, unmistakable cue. */
  setIntensity(level: 0 | 1 | 2) {
    this.intensity = level;
    if (this.musicNodes && this.ctx) {
      const t = this.ctx.currentTime;
      const cutoff = level === 0 ? 430 : level === 1 ? 620 : 1150;
      this.musicNodes.filter.frequency.setTargetAtTime(cutoff, t, level === 2 ? 0.5 : 1.4);
    }
    if (level === 2) this.startPulse();
    else { this.stopPulse(); this.stopTremolo(); }
  }

  /** Patch 10.0 — boss heartbeat OSTINATO: a kick every 480 ms alternating
      with a dark minor-third stab, so the boss theme DRIVES instead of
      merely breathing. Guarded by a suspended-context check so backgrounded
      tabs never pile notes onto a frozen timeline. */
  private startPulse() {
    if (this.pulseTimer !== undefined || !this.musicOn || !this.ctx || !this.musicBus) return;
    const beat = () => {
      if (!this.ctx || !this.musicBus) return;
      /* suspended context (tab hidden) — skip this beat entirely rather
         than scheduling onto a frozen currentTime (burst-on-resume bug) */
      if (this.ctx.state !== "running") return;
      const t0 = this.ctx.currentTime + 0.02;
      const o = this.ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(96, t0);
      o.frequency.exponentialRampToValueAtTime(42, t0 + 0.16);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g).connect(this.musicBus);
      o.start(t0);
      o.stop(t0 + 0.26);
      /* alternate beats carry a low minor-third stab — the ostinato heartbeat */
      if (this.bossBeatIdx++ % 2 === 1) {
        const root = ACT_ROOTS[this.musicAct] ?? ACT_ROOTS[0];
        const o2 = this.ctx.createOscillator();
        o2.type = "triangle";
        o2.frequency.value = root * 1.2;           // minor third above the root
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.0001, t0);
        g2.gain.exponentialRampToValueAtTime(0.085, t0 + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
        o2.connect(g2).connect(this.musicBus);
        o2.start(t0);
        o2.stop(t0 + 0.38);
      }
    };
    beat();
    this.pulseTimer = window.setInterval(beat, 480);
    this.startTremolo();
  }

  private stopPulse() {
    if (this.pulseTimer === undefined) return;
    window.clearInterval(this.pulseTimer);
    this.pulseTimer = undefined;
  }

  /** Patch 10.0 — boss tremolo layer: a quiet sawtooth whose gain is
      modulated by a 5.2 Hz LFO. Reads as bowed strings under siege — drama
      without drowning the drone. Cleanly stopped outside boss mode. */
  private startTremolo() {
    if (this.tremolo || !this.ctx || !this.musicBus || !this.musicNodes) return;
    try {
      const root = ACT_ROOTS[this.musicAct] ?? ACT_ROOTS[0];
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = root * 1.5;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.0;
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 5.2;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain).connect(gain.gain);
      gain.gain.setTargetAtTime(0.055, this.ctx.currentTime, 0.6);
      osc.connect(gain).connect(this.musicNodes.filter);
      osc.start();
      lfo.start();
      this.tremolo = { osc, gain, lfo };
    } catch {
      this.tremolo = null;
    }
  }

  private stopTremolo() {
    const t = this.tremolo;
    if (!t || !this.ctx) { this.tremolo = null; return; }
    this.tremolo = null;
    try {
      const now = this.ctx.currentTime;
      t.gain.gain.setTargetAtTime(0, now, 0.3);
      window.setTimeout(() => {
        try { t.osc.stop(); t.lfo.stop(); } catch { /* already stopped */ }
      }, 1200);
    } catch { /* teardown race — nodes already gone */ }
  }

  /** Pause / game-over duck — dips the music bus without touching the
      player's volume sliders. */
  duck(on: boolean) {
    this.duckMul = on ? 0.3 : 1;
    this.applyVolumes();
  }

  /* ------------------------------ music layer ----------------------------- */

  /** Begin the ambient drone + pluck scheduler (idempotent). */
  startMusic() {
    const ctx = this.ensure();
    if (!ctx || !this.musicBus || this.musicOn) return;
    if (this.volMusic * this.volMaster <= 0.001) return;
    this.musicOn = true;

    const root = ACT_ROOTS[this.musicAct] ?? ACT_ROOTS[0];
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.Q.value = 0.6;

    /* drone: two detuned triangles + a soft sub + an octave double,
       gently breathing via LFO. Patch 10.0 — slightly richer/louder so the
       score reads as MUSIC, not ambience. */
    const oscs: OscillatorNode[] = [];
    for (const [det, lvl] of [[0, 0.22], [7, 0.14], [-5, 0.11], [0.5, 0.09]] as const) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = root * (det === 0.5 ? 2 : 1);
      o.detune.value = det === 0.5 ? 0 : det * 12;
      const g = ctx.createGain();
      g.gain.value = lvl;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
    }
    /* Patch 10.0 — octave-doubled shimmer: a soft sine 2 octaves up gives
       the drone a harmonic crown without touching the mix ceiling. */
    {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = root * 4;
      const g = ctx.createGain();
      g.gain.value = 0.045;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
    }
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    filter.connect(gain).connect(this.musicBus);
    gain.gain.setTargetAtTime(0.7, ctx.currentTime, 2.5);

    this.musicNodes = { osc: oscs, lfo, gain, filter };
    /* honour the current intensity if the score spins up mid-fight */
    if (this.intensity === 2) this.startPulse();
    this.schedulePluck();
  }

  stopMusic() {
    if (!this.musicOn) return;
    this.musicOn = false;
    this.stopPulse();
    this.stopTremolo();
    window.clearTimeout(this.musicTimer);
    const nodes = this.musicNodes;
    this.musicNodes = null;
    if (nodes && this.ctx) {
      const t = this.ctx.currentTime;
      nodes.gain.gain.setTargetAtTime(0, t, 0.4);
      window.setTimeout(() => {
        try { nodes.osc.forEach((o) => o.stop()); nodes.lfo.stop(); } catch { /* already stopped */ }
      }, 1500);
    }
  }

  /** Shift the drone's root note when the act changes (1..5). */
  setMusicAct(act: number) {
    this.musicAct = Math.max(0, Math.min(ACT_ROOTS.length - 1, act - 1));
    if (!this.musicNodes || !this.ctx) return;
    const root = ACT_ROOTS[this.musicAct];
    const t = this.ctx.currentTime;
    this.musicNodes.osc.forEach((o, i) => {
      const mult = i === 3 ? 2 : 1;
      o.frequency.setTargetAtTime(root * mult, t, 1.8);
    });
  }

  /** Sparse pentatonic plucks over the drone — rate follows intensity:
      menu is slowest, boss waves push them closer together. */
  private schedulePluck() {
    if (!this.musicOn) return;
    const base = this.intensity === 0 ? 3400 : this.intensity === 2 ? 1300 : 2400;
    const spread = this.intensity === 0 ? 4200 : this.intensity === 2 ? 1700 : 3600;
    const delay = base + Math.random() * spread;
    this.musicTimer = window.setTimeout(() => {
      this.pluck();
      this.schedulePluck();
    }, delay);
  }

  private pluck() {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || !this.musicOn) return;
    if (ctx.state !== "running") return;   // Patch 10.0: frozen-timeline guard
    if (this.volMusic * this.volMaster <= 0.001) return;
    const now = ctx.currentTime;
    if (now - this.lastPluck < 1.2) return;
    this.lastPluck = now;
    const root = ACT_ROOTS[this.musicAct] ?? ACT_ROOTS[0];
    const steps = 1 + Math.floor(Math.random() * (PENTA.length - 1));
    const freq = root * PENTA[steps] * 2;
    const t0 = now + 0.05;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.075 + Math.random() * 0.025, t0 + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.8);
    osc.connect(g).connect(this.musicBus);
    osc.start(t0);
    osc.stop(t0 + 3);
    /* occasional soft fifth below for warmth */
    if (Math.random() < 0.4) {
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = freq / 1.5;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(0.042, t0 + 0.12);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4);
      osc2.connect(g2).connect(this.musicBus);
      osc2.start(t0);
      osc2.stop(t0 + 2.6);
    }
  }

  /* ------------------------------ sfx voices ------------------------------ */

  private tone(freq: number, dur: number, type: OscType, vol: number, slideTo?: number, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxBus) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /* Cached 1s white-noise buffer — sliced per hit instead of re-allocating. */
  private noise(dur: number, vol: number, filterFreq: number, delay = 0, q = 1) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxBus) return;
    if (!this.noiseBuf) {
      const len = ctx.sampleRate; // 1 second
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = filterFreq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t0, Math.random() * 0.5, dur + 0.05);
    src.stop(t0 + dur + 0.05);
  }

  castFire() { this.noise(0.22, 0.3, 900, 0, 0.7); this.tone(220, 0.24, "sawtooth", 0.12, 70); }
  castIce() { this.tone(1240, 0.16, "triangle", 0.16, 1900); this.tone(2400, 0.1, "sine", 0.08, 3200, 0.03); }
  castLightning() { this.noise(0.12, 0.34, 3200, 0, 2); this.tone(1600, 0.09, "square", 0.1, 200); }
  castEarth() { this.tone(90, 0.3, "sine", 0.3, 40); this.noise(0.2, 0.2, 300, 0, 0.6); }
  castShadow() { this.tone(700, 0.28, "sawtooth", 0.1, 60); }
  castLight() { this.tone(660, 0.12, "triangle", 0.14); this.tone(880, 0.12, "triangle", 0.13, undefined, 0.07); this.tone(1320, 0.16, "triangle", 0.12, undefined, 0.14); }
  castTime() { this.tone(300, 0.4, "sine", 0.16, 1200); this.tone(1200, 0.3, "sine", 0.08, 300, 0.1); }
  castVoid() { this.tone(160, 0.4, "sine", 0.28, 30); this.noise(0.3, 0.12, 180, 0, 0.5); }
  castArcane() { this.tone(880, 0.12, "triangle", 0.1, 1500); this.tone(1320, 0.1, "triangle", 0.08, 2100, 0.04); this.noise(0.1, 0.08, 4200, 0, 1.4); }
  castBlood() { this.tone(140, 0.22, "sawtooth", 0.18, 50); this.noise(0.14, 0.16, 800, 0, 0.7); }
  castNature() { this.tone(240, 0.2, "triangle", 0.12, 420); this.tone(420, 0.24, "sine", 0.09, 180, 0.07); }
  /* Patch 9.0 — wind whoosh + sonic boom (procedural, like every voice). */
  castWind() { this.noise(0.26, 0.22, 1400, 0.35, 0.4); this.tone(520, 0.18, "triangle", 0.09, 980); }
  castSonic() { this.tone(120, 0.45, "sine", 0.3, 24); this.noise(0.3, 0.18, 500, 0, 0.5); this.tone(880, 0.22, "triangle", 0.1, 90, 0.05); }
  bolt() { this.tone(1500, 0.05, "square", 0.035, 900); }
  surge() { this.tone(180, 0.7, "sawtooth", 0.2, 1500); this.noise(0.5, 0.16, 2400, 0.05, 0.5); [523, 784, 1047, 1568].forEach((f, i) => this.tone(f, 0.2, "triangle", 0.1, undefined, 0.1 + i * 0.07)); }
  elite() { this.tone(320, 0.18, "square", 0.1, 160); this.tone(640, 0.16, "square", 0.08, 320, 0.08); }
  poison() { this.tone(300, 0.16, "triangle", 0.07, 180); }
  hit() { this.noise(0.07, 0.2, 1800, 0, 0.8); }
  crit() { this.noise(0.1, 0.3, 2600, 0, 1.2); this.tone(520, 0.12, "square", 0.08, 900); }
  hurt() { this.tone(180, 0.24, "sawtooth", 0.2, 60); this.noise(0.16, 0.2, 500, 0, 0.6); }
  enemyDie() { this.noise(0.18, 0.22, 700, 0, 0.8); this.tone(320, 0.16, "square", 0.07, 60); }
  shift() { this.tone(120, 0.5, "sine", 0.24, 1400); this.noise(0.4, 0.14, 1200, 0.05, 0.4); this.tone(1400, 0.35, "sine", 0.1, 160, 0.12); }
  combo() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.13, undefined, i * 0.055)); }
  waveClear() { [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.2, "triangle", 0.12, undefined, i * 0.09)); }
  waveStart() { this.tone(196, 0.3, "sawtooth", 0.1, 98); this.tone(392, 0.24, "sawtooth", 0.08, 196, 0.12); }
  bossRoar() { this.tone(70, 0.9, "sawtooth", 0.3, 40); this.noise(0.7, 0.2, 220, 0, 0.4); this.tone(140, 0.6, "square", 0.1, 55, 0.1); }
  pickup() { this.tone(880, 0.1, "sine", 0.12); this.tone(1320, 0.14, "sine", 0.1, undefined, 0.06); }
  levelup() { [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.16, "sine", 0.1, undefined, i * 0.06)); }
  click() { this.startMusic(); this.tone(940, 0.05, "square", 0.05, 600); }
  death() { this.tone(220, 1.1, "sawtooth", 0.22, 35); this.noise(0.8, 0.18, 300, 0.1, 0.5); }
  freeze() { this.tone(2000, 0.3, "sine", 0.1, 400); }

  /* ------------------------ Patch 7.0 — new voices ------------------------ */

  /** Soft UI hover tick — deliberately almost subliminal. */
  uiHover() { this.tone(1180, 0.03, "sine", 0.02); }
  /** Arcanum tab switch. */
  tab() { this.tone(640, 0.07, "triangle", 0.06, 980); }
  /** Spell fusion — riser + resolve chord. */
  fuse() {
    this.tone(160, 0.55, "sawtooth", 0.16, 1350);
    this.noise(0.45, 0.14, 2000, 0.04, 0.5);
    [440, 587, 880].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.09, undefined, 0.16 + i * 0.06));
  }
  /** Boss title card — a dark orchestral-ish sting. Patch 10.0: bigger —
      timpani thump + brass riser + tritone tail for an unmistakable cue. */
  sting() {
    this.tone(62, 0.85, "sawtooth", 0.28, 36);
    this.tone(99, 0.5, "square", 0.1, 49, 0.06);
    this.noise(0.5, 0.14, 150, 0, 0.4);
    /* timpani drop */
    this.tone(88, 0.6, "sine", 0.3, 30, 0.02);
    /* brass riser into the tritone */
    this.tone(140, 0.7, "sawtooth", 0.08, 420, 0.18);
    this.tone(415, 0.5, "sawtooth", 0.07, 293, 0.55);
  }
  /** Patch 10.0 — END-CREDITS fanfare: the sealed-rift resolve chord. A
      slow major-ish lift (the one bright moment in the score). */
  credits() {
    [262, 330, 392, 523].forEach((f, i) => this.tone(f, 1.4, "triangle", 0.09, undefined, i * 0.16));
    this.tone(131, 1.8, "sine", 0.22, 98);
    this.tone(660, 1.6, "sine", 0.06, undefined, 0.7);
  }
  /** Patch 10.0 — the FIGHT choice: the rift reopens. Dark riser + slam. */
  reopen() {
    this.tone(70, 1.1, "sawtooth", 0.24, 300);
    this.noise(0.9, 0.2, 900, 0.15, 0.4);
    this.tone(180, 0.8, "square", 0.12, 50, 0.55);
  }
  /** Tribute gate fanfare — ascending major chords. */
  fanfare() {
    [523, 659, 784].forEach((f) => this.tone(f, 0.3, "triangle", 0.07));
    [659, 830, 1047].forEach((f, i) => this.tone(f, 0.34, "triangle", 0.075, undefined, 0.14 + i * 0.02));
  }
}
