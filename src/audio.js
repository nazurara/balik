// =============================================================
//  AUDIO — semua suara dibuat langsung dengan Web Audio (tanpa file):
//  musik bernuansa Minang (saluang + talempong + gandang), suasana alam,
//  dan efek suara. Bebas hak cipta karena dibangkitkan oleh kode.
// =============================================================
const Audio2 = {
  ctx: null, muted: false, vol: { music: 0.55, sfx: 0.8, amb: 0.6 },
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(c.destination);
    // gema lembut (ruang terbuka)
    this.verb = c.createConvolver(); this.verb.buffer = this.impulse(2.2, 2.5);
    this.verbGain = c.createGain(); this.verbGain.gain.value = 0.28; this.verb.connect(this.verbGain); this.verbGain.connect(this.master);
    this.mus = c.createGain(); this.mus.gain.value = this.vol.music; this.mus.connect(this.master); this.mus.connect(this.verb);
    this.sfx = c.createGain(); this.sfx.gain.value = this.vol.sfx; this.sfx.connect(this.master);
    this.amb = c.createGain(); this.amb.gain.value = this.vol.amb; this.amb.connect(this.master);
    this.noiseBuf = this.makeNoise(2);
    try { this.muted = localStorage.getItem('balik_mute') === '1'; } catch (e) {}
    this.master.gain.value = this.muted ? 0 : 0.9;
  },
  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('balik_mute', this.muted ? '1' : '0'); } catch (e) {}
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    return this.muted;
  },
  makeNoise(sec) {
    const c = this.ctx, b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  },
  impulse(sec, decay) {
    const c = this.ctx, len = c.sampleRate * sec, b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  noise(t, dur, f, q, gain, type, dest, f2) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const bf = c.createBiquadFilter(); bf.type = type || 'bandpass'; bf.frequency.setValueAtTime(f, t); bf.Q.value = q || 1;
    if (f2) bf.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bf); bf.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  tone(t, f, dur, gain, type, dest, f2, attack) {
    const c = this.ctx, o = c.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
    return o;
  },
  // ---------------- instrumen ----------------
  talempong(t, f, dur, gain) { // gong kecil perunggu: FM dengan rasio tak harmonis
    const c = this.ctx, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * 2.76; mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.6);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.connect(g); g.connect(this.mus); car.start(t); mod.start(t); car.stop(t + dur + 0.1); mod.stop(t + dur + 0.1);
  },
  saluang(t, f, dur, gain, slideFrom) { // seruling bambu: sinus + napas + vibrato
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.setValueAtTime(slideFrom || f, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    o2.frequency.setValueAtTime((slideFrom || f) * 2.001, t); o2.frequency.exponentialRampToValueAtTime(f * 2.001, t + 0.12);
    lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.5, dur * 0.6));
    lfo.connect(lg); lg.connect(o.frequency);
    const g2 = c.createGain(); g2.gain.value = 0.12; o2.connect(g2); g2.connect(lp);
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.09); g.gain.setValueAtTime(gain, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(this.mus);
    [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + dur + 0.05); });
    this.noise(t, Math.min(dur, 0.35), f * 2, 3, gain * 0.25, 'bandpass', this.mus); // hembusan napas
  },
  gandang(t, hi, gain) {
    if (hi) { this.tone(t, 320, 0.12, gain * 0.7, 'sine', this.mus, 180); this.noise(t, 0.06, 2500, 1, gain * 0.25, 'bandpass', this.mus); }
    else { this.tone(t, 110, 0.28, gain, 'sine', this.mus, 55); }
  },
  pad(t, f, dur, gain) {
    [1, 1.5, 2].forEach((k, i) => this.tone(t, f * k, dur, gain / (i + 1), 'triangle', this.mus, null, dur * 0.35));
  },

  // ---------------- musik ----------------
  // tangga nada pentatonik ala saluang (mendekati D–F–G–A–C)
  SCALE: [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 880.0],
  SONGS: {
    title:   { bpm: 76, mood: 'calm',  tal: [0, 2, 4, 2, 3, 2, 4, 5], drum: 0 },
    kota:    { bpm: 104, mood: 'walk', tal: [0, 2, 3, 4, 3, 2, 4, 5], drum: 1 },
    hutan:   { bpm: 98, mood: 'walk',  tal: [2, 4, 5, 4, 3, 4, 2, 0], drum: 1 },
    sungai:  { bpm: 92, mood: 'walk',  tal: [0, 3, 4, 3, 5, 4, 3, 2], drum: 1 },
    gunung:  { bpm: 80, mood: 'mist',  tal: [0, 1, 3, 1, 4, 3, 1, 0], drum: 0 },
    sawah:   { bpm: 70, mood: 'night', tal: [2, 0, 3, 2, 4, 3, 2, 1], drum: 0 },
    gua:     { bpm: 60, mood: 'cave',  tal: [0, 1, 0, 3, 0, 1, 2, 1], drum: 0 },
    kampung: { bpm: 62, mood: 'calm',  tal: [0, 2, 4, 5, 4, 2, 3, 2], drum: 0 },
    tegang:  { bpm: 132, mood: 'tense', tal: [0, 1, 0, 3, 0, 1, 4, 3], drum: 2 }
  },
  playMusic(name) {
    if (!this.ctx) return;
    if (this.song === name) return;
    this.song = name; this.songStep = 0;
    this.nextT = this.ctx.currentTime + 0.15;
    this.mus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.mus.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.mus.gain.exponentialRampToValueAtTime(this.vol.music, this.ctx.currentTime + 1.2);
    const r = this.rng = mulberry(name.length * 977 + 13);
    // frase saluang dibangkitkan sekali per lagu supaya berulang (terasa sebagai melodi)
    this.phrase = [];
    let p = 4;
    for (let i = 0; i < 16; i++) {
      p = Math.max(0, Math.min(8, p + [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)]));
      this.phrase.push({ n: p, len: [1, 1, 2, 2, 3, 4][Math.floor(r() * 6)], rest: r() < 0.22 });
    }
    this.phraseStarts = {}; let acc = 0;
    for (const n of this.phrase) { this.phraseStarts[acc] = n; acc += n.len; }
    this.phraseLen = acc;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 60);
  },
  stopMusic(fade) {
    if (!this.ctx) return;
    this.song = null;
    this.mus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, fade || 0.4);
  },
  tick() {
    if (!this.ctx || !this.song) return;
    const S = this.SONGS[this.song], beat = 60 / S.bpm / 2; // per 1/8
    while (this.nextT < this.ctx.currentTime + 0.25) {
      const t = this.nextT, k = this.songStep, sc = this.SCALE;
      // talempong (ostinato)
      if (S.mood === 'walk' || S.mood === 'tense') this.talempong(t, sc[S.tal[k % 8]] * (S.mood === 'tense' ? 1 : 1), beat * 2.2, 0.07);
      else if (k % 2 === 0) this.talempong(t, sc[S.tal[(k / 2) % 8]], beat * 4, S.mood === 'cave' ? 0.035 : 0.05);
      // gandang
      if (S.drum === 1) { if (k % 4 === 0) this.gandang(t, false, 0.22); if (k % 4 === 2) this.gandang(t, true, 0.12); if (k % 8 === 7) this.gandang(t, true, 0.08); }
      if (S.drum === 2) { if (k % 2 === 0) this.gandang(t, false, 0.25); else this.gandang(t, true, 0.14); }
      // saluang (melodi)
      if (k % 2 === 0 && S.mood !== 'tense') {
        const n = this.phraseStarts[(k / 2) % this.phraseLen];
        if (n && !n.rest) {
          const f = this.SCALE[n.n];
          this.saluang(t, f, n.len * beat * 2 * 0.95, S.mood === 'walk' ? 0.075 : 0.1, (k / 2) % 4 === 0 ? f * 0.94 : null);
        }
      }
      // pad lembut untuk suasana tenang/malam
      if ((S.mood !== 'walk' && S.mood !== 'tense') && k % 16 === 0) this.pad(t, this.SCALE[S.tal[(k / 16) % 8]] / 2, beat * 16, 0.03);
      this.nextT += beat; this.songStep++;
    }
  },

  // ---------------- suasana ----------------
  setAmbience(kind) {
    if (!this.ctx) return;
    if (this.ambKind === kind) return;
    this.ambKind = kind;
    if (this.ambNodes) this.ambNodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    this.ambNodes = [];
    clearInterval(this.ambTimer);
    const c = this.ctx;
    const bed = (f, q, gain, type, lfoRate) => {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const bf = c.createBiquadFilter(); bf.type = type || 'lowpass'; bf.frequency.value = f; bf.Q.value = q || 0.7;
      const g = c.createGain(); g.gain.value = gain;
      if (lfoRate) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfoRate; lg.gain.value = f * 0.5; l.connect(lg); lg.connect(bf.frequency); l.start(); this.ambNodes.push(l); }
      s.connect(bf); bf.connect(g); g.connect(this.amb); s.start(); this.ambNodes.push(s);
    };
    const R = Math.random;
    const chirp = (t) => { const f = 2600 + R() * 1800; for (let i = 0; i < 2 + (R() * 3 | 0); i++) this.tone(t + i * 0.09, f, 0.07, 0.025, 'sine', this.amb, f * (1.2 + R() * 0.3)); };
    const cricket = (t) => { const f = 4200 + R() * 600; for (let i = 0; i < 6; i++) this.tone(t + i * 0.035, f, 0.02, 0.012, 'square', this.amb); };
    const frog = (t) => { const f = 160 + R() * 60; this.tone(t, f, 0.12, 0.05, 'sawtooth', this.amb, f * 0.7); this.tone(t + 0.16, f, 0.1, 0.04, 'sawtooth', this.amb, f * 0.7); };
    const drip = (t) => this.tone(t, 1400 + R() * 900, 0.18, 0.04, 'sine', this.amb, 700);
    let ev = null, every = 1500;
    if (kind === 'kota') { bed(260, 0.6, 0.12); ev = (t) => { if (R() < 0.35) chirp(t); if (R() < 0.18) this.noise(t, 2.2, 300, 0.8, 0.05, 'bandpass', this.amb, 900); }; every = 1600; }
    else if (kind === 'hutan') { bed(5200, 3, 0.012, 'bandpass', 7); ev = (t) => { if (R() < 0.6) chirp(t); }; every = 900; }
    else if (kind === 'sungai') { bed(700, 0.5, 0.2, 'lowpass', 0.3); bed(1800, 1.2, 0.05, 'bandpass', 0.7); ev = (t) => { if (R() < 0.3) chirp(t); }; every = 1500; }
    else if (kind === 'air_terjun') { bed(900, 0.4, 0.3, 'lowpass'); bed(3000, 0.8, 0.06, 'bandpass'); }
    else if (kind === 'gunung') { bed(500, 1.5, 0.16, 'bandpass', 0.15); ev = (t) => { if (R() < 0.15) this.tone(t, 1800, 0.9, 0.02, 'sine', this.amb, 1300); }; every = 2500; }
    else if (kind === 'sawah') { bed(5000, 4, 0.006, 'bandpass', 11); ev = (t) => { cricket(t); if (R() < 0.5) cricket(t + 0.4); if (R() < 0.35) frog(t + 0.2); }; every = 700; }
    else if (kind === 'gua') { bed(120, 0.7, 0.18); ev = (t) => { if (R() < 0.6) drip(t); }; every = 1300; }
    else if (kind === 'kampung') { bed(4800, 4, 0.004, 'bandpass', 9); ev = (t) => { if (R() < 0.7) cricket(t); }; every = 900; }
    if (ev) this.ambTimer = setInterval(() => { if (this.ctx && !this.paused) ev(this.ctx.currentTime + 0.05); }, every);
  },

  // ---------------- efek suara ----------------
  play(name, opt) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005, R = Math.random;
    switch (name) {
      case 'step': {
        const s = opt || 'stone';
        if (s === 'water') this.noise(t, 0.12, 900 + R() * 300, 1, 0.12, 'bandpass');
        else if (s === 'mud') { this.noise(t, 0.14, 300, 1.5, 0.14, 'lowpass'); this.tone(t, 90, 0.08, 0.05, 'sine'); }
        else if (s === 'grass') this.noise(t, 0.07, 2200 + R() * 600, 0.9, 0.07, 'highpass');
        else if (s === 'wood') { this.tone(t, 180 + R() * 30, 0.07, 0.08, 'triangle'); this.noise(t, 0.04, 1200, 2, 0.04); }
        else this.noise(t, 0.05, 1600 + R() * 500, 2.5, 0.08, 'bandpass');
        break;
      }
      case 'jump': this.tone(t, 260, 0.16, 0.12, 'square', null, 520); this.noise(t, 0.08, 1800, 1, 0.04, 'highpass'); break;
      case 'land': this.noise(t, 0.09, 400, 0.8, 0.16, 'lowpass'); break;
      case 'nasi': this.tone(t, 660, 0.12, 0.12, 'triangle'); this.tone(t + 0.08, 990, 0.18, 0.12, 'triangle'); break;
      case 'air': for (let i = 0; i < 3; i++) this.tone(t + i * 0.05, 500 + i * 180, 0.08, 0.08, 'sine', null, 900 + i * 200); break;
      case 'hati': [523, 659, 784, 1046].forEach((f, i) => this.talempongSfx(t + i * 0.07, f, 0.4, 0.12)); break;
      case 'baterai': this.tone(t, 880, 0.08, 0.07, 'square'); this.tone(t + 0.09, 1320, 0.14, 0.07, 'square'); break;
      case 'hurt': this.tone(t, 420, 0.3, 0.16, 'sawtooth', null, 140); this.noise(t, 0.2, 800, 1, 0.1); break;
      case 'stomp': this.tone(t, 220, 0.12, 0.18, 'square', null, 80); this.noise(t, 0.08, 600, 1, 0.12); break;
      case 'senter': this.noise(t, 0.03, 4000, 3, 0.15); this.tone(t, 2000, 0.03, 0.05, 'square'); break;
      case 'checkpoint': [587, 698, 880].forEach((f, i) => this.talempongSfx(t + i * 0.12, f, 1.2, 0.12)); break;
      case 'pintu': this.noise(t, 0.7, 200, 0.7, 0.2, 'lowpass', null, 900); this.tone(t, 90, 0.6, 0.12, 'sine', null, 60); break;
      case 'splash': this.noise(t, 0.5, 1500, 0.6, 0.3, 'bandpass', null, 400); for (let i = 0; i < 5; i++) this.tone(t + 0.05 + R() * 0.3, 600 + R() * 900, 0.08, 0.05, 'sine', null, 1600); break;
      case 'stroke': this.noise(t, 0.25, 900, 0.8, 0.09, 'bandpass', null, 500); break;
      case 'crack': for (let i = 0; i < 6; i++) this.noise(t + i * 0.05, 0.08, 600 + R() * 1500, 2, 0.25); this.tone(t, 120, 0.5, 0.2, 'sawtooth', null, 50); break;
      case 'buaya': this.tone(t, 70, 0.9, 0.25, 'sawtooth', null, 50); this.noise(t, 0.9, 200, 1, 0.12, 'lowpass'); break;
      case 'elang': { const o = this.tone(t, 2600, 0.7, 0.07, 'sawtooth', null, 1400); this.tone(t + 0.02, 2200, 0.6, 0.04, 'sine', null, 1100); break; }
      case 'monyet': for (let i = 0; i < 5; i++) this.tone(t + i * 0.07, 700 + R() * 600, 0.06, 0.06, 'square', null, 500); break;
      case 'meong': this.tone(t, 600, 0.45, 0.08, 'triangle', null, 850); this.tone(t + 0.15, 850, 0.3, 0.06, 'triangle', null, 500); break;
      case 'kwek': for (let i = 0; i < 2; i++) { this.tone(t + i * 0.15, 420, 0.1, 0.07, 'sawtooth', null, 300); this.noise(t + i * 0.15, 0.1, 1100, 4, 0.06); } break;
      case 'kerbau': this.tone(t, 140, 0.9, 0.12, 'sawtooth', null, 95); break;
      case 'batu': this.noise(t, 0.3, 250, 0.7, 0.25, 'lowpass'); this.tone(t, 70, 0.25, 0.15, 'sine'); break;
      case 'ikan': this.noise(t, 0.25, 2000, 1, 0.12, 'bandpass', null, 800); break;
      case 'lelah': this.noise(t, 0.6, 700, 1.4, 0.07, 'bandpass', null, 400); this.noise(t + 0.7, 0.5, 600, 1.4, 0.06, 'bandpass', null, 350); break;
      case 'duduk': this.noise(t, 0.15, 300, 0.8, 0.12, 'lowpass'); break;
      case 'klik': this.tone(t, 900, 0.05, 0.08, 'square'); break;
      case 'halaman': this.noise(t, 0.25, 3000, 0.8, 0.06, 'highpass', null, 1500); break;
      case 'menang': [523, 659, 784, 1046, 1318].forEach((f, i) => this.talempongSfx(t + i * 0.11, f, 1, 0.12)); break;
      case 'gameover': [392, 349, 293, 262].forEach((f, i) => this.talempongSfx(t + i * 0.22, f, 1.2, 0.12)); break;
      case 'peti': this.tone(t, 300, 0.15, 0.1, 'triangle', null, 200); this.noise(t, 0.1, 900, 1, 0.08); break;
      case 'gemuruh': this.noise(t, 1.0, 120, 0.6, 0.25, 'lowpass'); this.tone(t, 45, 1.0, 0.18, 'sine', null, 35); break;
      case 'tergelincir': this.tone(t, 500, 0.4, 0.09, 'sine', null, 900); this.noise(t, 0.3, 2500, 1.5, 0.08, 'bandpass', null, 1200); break;
      case 'jatuh': { const o = this.tone(t, 1400, 0.9, 0.08, 'sine', null, 300); break; }
      case 'swish': this.noise(t, 0.18, 1800, 1.2, 0.12, 'bandpass', null, 600); break;
      case 'desis': this.noise(t, 0.5, 5200, 1.5, 0.1, 'highpass'); break;
      case 'kepak': for (let i = 0; i < 3; i++) this.noise(t + i * 0.1, 0.08, 700, 1, 0.1, 'lowpass'); break;
      case 'bonk': this.tone(t, 520, 0.12, 0.14, 'triangle', null, 260); break;
      case 'kayu': for (let i = 0; i < 4; i++) this.tone(t + i * 0.04 + R() * 0.03, 160 + R() * 120, 0.07, 0.1, 'triangle'); break;
      case 'gelembung': this.tone(t, 400 + R() * 300, 0.1, 0.05, 'sine', null, 900); break;
    }
  },
  talempongSfx(t, f, dur, gain) {
    const c = this.ctx, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * 2.76; mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.6);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.connect(g); g.connect(this.sfx); car.start(t); mod.start(t); car.stop(t + dur + 0.1); mod.stop(t + dur + 0.1);
  }
};

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
