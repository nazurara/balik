// =============================================================
//  BOOT · LOBI · CERITA PEMBUKA · JEDA ANTAR LEVEL · PENUTUP
// =============================================================
class PreBootScene extends Phaser.Scene {
  // muat lembar Li lebih dulu supaya ia bisa berlari di layar memuat
  constructor() { super('PreBoot'); }
  preload() { this.load.spritesheet('li', ASSETS.li, { frameWidth: SHEETS.li[0], frameHeight: SHEETS.li[1] }); }
  create() { this.scene.start('Boot'); }
}
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    hdCam(this);
    const g = this.add.graphics();
    T(this, 480, 214, 'Memuat perjalanan Li...', 20).setOrigin(0.5);
    // Li berlari mengikuti isi bar
    if (!this.anims.exists('li_run')) this.anims.create({ key: 'li_run', frames: this.anims.generateFrameNumbers('li', { frames: [36, 37, 38, 39, 40, 41, 42, 43] }), frameRate: 15, repeat: -1 });
    const li = this.add.sprite(336, 283, 'li', 36).setOrigin(0.5, 1).setScale(0.34).play('li_run');
    const draw = (p) => {
      g.clear(); g.fillStyle(0x3a3168); g.fillRoundedRect(330, 284, 300, 16, 8); g.fillStyle(0xc9b8ff); g.fillRoundedRect(332, 286, Math.max(12, 296 * p), 12, 6);
      li.x = 336 + 288 * p;
    };
    draw(0);
    this.time.addEvent({ delay: 90, loop: true, callback: () => {
      const c = this.add.circle(li.x - 10, 280, 2.5, 0xe8e0ff, 0.7);
      this.tweens.add({ targets: c, x: c.x - 14, y: c.y - 5, alpha: 0, scale: 2, duration: 450, onComplete: () => c.destroy() });
    } });
    this.load.on('progress', draw);
    for (const k in ASSETS) {
      if (k === 'li') continue;
      if (SHEETS[k]) this.load.spritesheet(k, ASSETS[k], { frameWidth: SHEETS[k][0], frameHeight: SHEETS[k][1] });
      else this.load.image(k, ASSETS[k]);
    }
  }
  create() {
    makeRuntimeTextures(this);
    // piksel tajam untuk aset buatan (garis jelas), halus untuk lukisan besar
    ['gt_', 'gb_', 'plat_', 'air_top', 'lumpur_top', 'senter', 'fist', 'baterai', 'buah', 'ikan', 'ikankecil', 'buaya', 'biawak', 'elang', 'bebek', 'lintah', 'kerbau', 'batu', 'rangkiang', 'bintang', 'daun', 'kelopak', 'tetes', 'debu', 'burung', 'bg_sungai', 'bg_gunung', 'bg_sawah', 'bg_kampung'].forEach((pre) => {
      this.textures.getTextureKeys().filter((k) => k.indexOf(pre) === 0).forEach((k) => this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST));
    });
    this.makeAnims();
    // beri waktu Li sampai di ujung bar
    this.time.delayedCall(350, () => this.scene.start('Title'));
  }
  makeAnims() {
    const A = (key, tex, frames, rate, repeat) => this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { frames }), frameRate: rate, repeat: repeat === undefined ? -1 : repeat });
    const R = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
    if (this.anims.exists('li_run')) this.anims.remove('li_run');
    A('li_walk', 'li', R(28, 35), 11); A('li_idle', 'li', [5, 6, 7, 8], 3.5); A('li_run', 'li', R(36, 43), 15);
    A('li_crouchwalk', 'li', [14, 15], 5); A('li_turn', 'li', [18, 19], 16, 0); A('li_swim', 'li', R(28, 35), 7); A('li_sitdown', 'li', [26, 27], 3, 0);
    A('copet_walk', 'copet', R(3, 10), 10); A('copet_run', 'copet', R(11, 18), 14); A('cat_walk', 'cat', [0, 1], 6);
    A('monyet_idle', 'monyet', [0, 1], 2); A('ular_idle', 'ular', [0, 1], 2.5); A('bat_fly', 'bat', [0, 1], 8);
    A('slime_hop', 'slime', [0, 1, 2, 1], 5); A('rat_walk', 'rat', [0, 1, 2], 9); A('ularbatu_idle', 'ularbatu', [0], 1);
    A('ikan_swim', 'ikan', [0, 1], 6); A('ikankecil0', 'ikankecil', [0], 1); A('biawak_walk', 'biawak', [0, 1], 5);
    A('elang_fly', 'elang', [0, 1], 5); A('bebek_walk', 'bebek', [0, 1], 5); A('lintah_crawl', 'lintah', [0, 1], 3); A('kerbau_walk', 'kerbau', [0, 1], 2.5);
    A('burung_fly', 'burung', [0, 1], 6);
  }
}

// ---------------------------------------------------------------- LOBI
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    hdCam(this);
    this.add.image(0, 0, 'loby').setOrigin(0, 0).setDisplaySize(960, 540);
    // lampu halte berkedip lembut
    this.lamp = this.add.image(108, 241, 'glow').setScale(1.1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
    this.tweens.add({ targets: this.lamp, alpha: { from: 0.45, to: 0.75 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // kelopak sakura dari pohon kiri & daun hijau dari pohon kanan
    this.petals = new Drifters(this, { n: 26, keys: ['kelopak'], sf: 0, depth: 5, wind: 26, fall: 24, scale: 0.9, spawnRect: { x: -40, y: -10, w: 300, h: 180 } });
    this.leaves = new Drifters(this, { n: 8, keys: ['daun_hijau', 'daun_kuning'], sf: 0, depth: 5, wind: -14, fall: 30, scale: 0.75, spawnRect: { x: 820, y: 170, w: 140, h: 120 } });
    // burung melintas
    this.birds = [];
    this.time.addEvent({ delay: 3800, loop: true, callback: () => this.bird() }); this.bird();
    // Mulai (tergambar di lukisan) = perjalanan baru dari cerita pembuka; Lanjut = progres tersimpan
    this.going = false;
    const save = Save.get();
    this.hot(() => this.start(false));
    if (save && LEVELS[save.level]) new PButton(this, 480, 402, 220, 40, '↪ Lanjut · ' + LEVELS[save.level].name, () => this.start(true), { size: 16, color: 0x7a6ac4 });
    this.muteBtn = T(this, 930, 22, Audio2.muted ? '🔇' : '🔊', 20).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => { Audio2.init(); this.muteBtn.setText(Audio2.toggleMute() ? '🔇' : '🔊'); });
    this.input.once('pointerdown', () => { Audio2.init(); Audio2.playMusic('title'); Audio2.setAmbience('kota'); });
    if (Audio2.ctx) { Audio2.playMusic('title'); Audio2.setAmbience('kota'); }
    this.cameras.main.fadeIn(500);
  }
  hot(cb) {
    // tombol Mulai dipotong rapi mengikuti bentuknya dari lukisan lobi, lalu dianimasikan
    const x = 480.3, y = 323.5, w = 220, h = 82;
    const im = this.add.image(x, y, 'btn_mulai').setDisplaySize(w, h).setDepth(20);
    const base = im.scaleX, by = im.scaleY;
    const z = this.add.zone(x, y - 4, w - 6, h - 16).setInteractive({ useHandCursor: true }).setDepth(21);
    const grow = (f) => { this.tweens.killTweensOf(im); this.tweens.add({ targets: im, scaleX: base * f, scaleY: by * f, duration: 170, ease: 'Back.out' }); };
    z.on('pointerover', () => { grow(1.1); im.setTint(0xf4f0ff); });
    z.on('pointerout', () => { grow(1); im.clearTint(); });
    z.on('pointerdown', () => { grow(0.95); Audio2.init(); Audio2.play('klik'); });
    z.on('pointerup', () => { grow(1.1); cb(); });
  }
  bird() {
    const y = 40 + Math.random() * 120, dir = Math.random() < 0.6 ? 1 : -1, n = 1 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const b = this.add.sprite(dir > 0 ? -30 - i * 22 : 990 + i * 22, y + i * 9, 'burung').setScale(0.9).play('burung_fly').setFlipX(dir < 0).setDepth(2);
      b.anims.setProgress(Math.random());
      this.tweens.add({ targets: b, x: dir > 0 ? 1000 : -40, y: y - 30 + Math.random() * 60, duration: 9000 + Math.random() * 3000, onComplete: () => b.destroy() });
    }
  }
  start(cont) {
    if (this.going) return; this.going = true;
    Audio2.init();
    if (cont && loadRun()) { this.go('Game', { level: RUN.level, fromSave: true }); return; }
    // Mulai selalu dari awal: cerita pembuka lalu Bagian 1
    freshRun(); Save.clear();
    this.go('Story', { level: 0 });
  }
  go(k, d) { this.cameras.main.fadeOut(500, 10, 8, 20); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(k, d)); }
  update(t, dt) { this.petals.update(dt / 1000, t / 1000); this.leaves.update(dt / 1000, t / 1000); }
}

// ---------------------------------------------------------------- CERITA (panel bergambar)
class PanelScene extends Phaser.Scene {
  // panel bergambar tanpa efek membesar: muncul dengan pudar, pindah otomatis
  showPanel(key) {
    if (this.cur) { const old = this.cur; this.tweens.add({ targets: old, alpha: 0, duration: 500, onComplete: () => old.destroy() }); }
    const tex = this.textures.get(key).getSourceImage();
    const k = Math.max(960 / tex.width, 540 / tex.height);
    const im = this.add.image(480, 270, key).setScale(k).setAlpha(0).setDepth(1);
    this.tweens.add({ targets: im, alpha: 1, duration: 500 });
    this.cur = im; Audio2.play('halaman');
    return im;
  }
  setupPanels(n, keyPre, delay, onDone) {
    this.i = -1; this.cur = null; this.busy = false; this.done = false; this.n = n; this.keyPre = keyPre; this.delay = delay; this.onDone = onDone;
    this.add.rectangle(480, 270, 960, 540, 0x0e0b1c);
    this.skipBtn = new PButton(this, 888, 26, 120, 32, 'Lewati »', () => this.finish(), { size: 15, depth: 20 });
    this.next();
  }
  next() {
    if (this.done) return;
    if (this.auto) this.auto.remove();
    this.i++;
    if (this.i >= this.n) return this.finish();
    this.showPanel(this.keyPre + this.i);
    this.onPanel && this.onPanel(this.i);
    if (this.i < this.n - 1 || this.autoLast) this.auto = this.time.delayedCall(this.delay, () => this.next());
  }
  finish() { if (this.done) return; this.done = true; if (this.auto) this.auto.remove(); this.onDone(); }
}

class StoryScene extends PanelScene {
  constructor() { super('Story'); }
  create() {
    hdCam(this);
    this.autoLast = true;
    Audio2.playMusic('title'); Audio2.setAmbience('kota');
    this.setupPanels(5, 'story_', 3000, () => {
      Save.flag('intro', true);
      this.cameras.main.fadeOut(700, 10, 8, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Interlude', { level: 0 }));
    });
  }
}

// ---------------------------------------------------------------- JEDA ANTAR LEVEL
class InterludeScene extends Phaser.Scene {
  constructor() { super('Interlude'); }
  create(data) {
    hdCam(this);
    const lv = data.level, L = LEVELS[lv];
    this.going = false;
    const g = this.add.graphics(); g.fillGradientStyle(0x1a1638, 0x1a1638, 0x3a2c5a, 0x3a2c5a, 1); g.fillRect(0, 0, 960, 540);
    this.stars = [];
    for (let i = 0; i < 60; i++) { const s = this.add.image(Math.random() * 960, Math.random() * 330, 'bintang').setScale(0.5 + Math.random()).setAlpha(Math.random()); this.stars.push(s); this.tweens.add({ targets: s, alpha: 0.1, duration: 800 + Math.random() * 1500, yoyo: true, repeat: -1 }); }
    this.leaves = new Drifters(this, { n: 16, keys: lv >= 3 ? ['kelopak'] : ['daun_hijau', 'daun_oranye', 'daun_kuning'], sf: 0, wind: 22, fall: 26, scale: 0.9, alpha: 0.9 });
    // siluet Li berjalan pelan
    const li = this.add.sprite(-40, 470, 'li').setOrigin(0.5, 1).setScale(0.5).play('li_walk').setTint(0x2a2040);
    this.tweens.add({ targets: li, x: 1000, duration: 14000 });
    this.add.rectangle(480, 505, 960, 70, 0x120e24);
    const story = lv > 0 ? INTERLUDES[lv - 1] : 'Pagi masih gelap. Terminal kota mulai ramai.\nLi mengencangkan tali ranselnya.';
    const head = T(this, 480, 150, 'Bagian ' + (lv + 1) + ' · ' + L.name, 30, '#ffe7a6').setOrigin(0.5).setAlpha(0);
    const sub = T(this, 480, 188, L.sub + '  ·  ' + clockText(L.time[0]), 16, '#d6ccff').setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [head, sub], alpha: 1, duration: 900 });
    const body = T(this, 480, 270, '', 20, '#fff8ec', { align: 'center', lineSpacing: 8, wordWrap: { width: 760 } }).setOrigin(0.5);
    let n = 0; this.full = story;
    this.typer = this.time.addEvent({ delay: 34, repeat: story.length - 1, callback: () => { body.setText(story.slice(0, ++n)); if (n % 3 === 0) Audio2.play('klik'); } });
    this.body = body;
    const tip = T(this, 480, 400, IS_TOUCH ? 'Ketuk untuk melanjutkan perjalanan' : 'Tekan Spasi / Enter untuk melanjutkan', 14, '#cfc6ff').setOrigin(0.5).setAlpha(0);
    this.time.delayedCall(1200, () => this.tweens.add({ targets: tip, alpha: 0.9, duration: 500, yoyo: true, repeat: -1, hold: 600 }));
    const go = () => {
      if (this.typer.getRepeatCount() > 0) { this.typer.remove(); body.setText(this.full); return; }
      if (this.going) return; this.going = true;
      this.cameras.main.fadeOut(600, 10, 8, 20); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', { level: lv }));
    };
    this.input.on('pointerdown', go);
    ['SPACE', 'ENTER', 'E'].forEach((k) => this.input.keyboard.on('keydown-' + k, go));
    Audio2.playMusic(lv >= 4 ? 'sawah' : 'title'); Audio2.setAmbience(lv >= 3 ? 'sawah' : 'hutan');
    this.cameras.main.fadeIn(700);
  }
  update(t, dt) { this.leaves.update(dt / 1000, t / 1000); }
}

// ---------------------------------------------------------------- PENUTUP
class EndingScene extends PanelScene {
  constructor() { super('Ending'); }
  create() {
    hdCam(this);
    this.extra = []; this.petals = null; this.autoLast = false;
    Audio2.playMusic('kampung'); Audio2.setAmbience('kampung');
    Save.clear();
    this.onPanel = (i) => {
      this.extra.forEach((o) => o.destroy()); this.extra = [];
      if (i === 2) this.time.delayedCall(400, () => Audio2.play('hati'));
      if (i === 4 && !this.petals) this.petals = new Drifters(this, { n: 22, keys: ['kelopak'], sf: 0, depth: 10, wind: 18, fall: 24, scale: 1 });
      if (i === 5) { this.skipBtn.destroy(); this.time.delayedCall(600, () => this.finalUI()); }
    };
    this.setupPanels(6, 'end_', 3500, () => { this.i = 4; this.next(); });
  }
  finish() { if (this.i >= 5) return; if (this.auto) this.auto.remove(); this.i = 4; this.next(); }
  finalUI() {
    // angka asli di lukisan sudah dihapus; jumlah sebenarnya ditulis di tempat yang sama
    const im = this.cur, k = im.scaleX, ox = 480 - im.width * k / 2, oy = 270 - im.height * k / 2;
    const P = (x, y) => ({ x: ox + x * k, y: oy + y * k });
    [[185, RUN.stats.nasi], [265, RUN.stats.air], [358, Math.max(1, RUN.hearts)]].forEach(([x, v], i) => {
      const p = P(x - 1, 283);
      const t = T(this, p.x, p.y, '0', 21, '#ffffff', { strokeThickness: 0 }).setOrigin(0, 0.5).setDepth(4).setAlpha(0);
      this.extra.push(t);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 200 + i * 250 });
      const c = { n: 0 };
      this.tweens.add({ targets: c, n: v, duration: 700, delay: 300 + i * 250, onUpdate: () => t.setText(String(Math.round(c.n))), onComplete: () => { t.setText(String(v)); Audio2.play('klik'); } });
    });
    // tombol Main Lagi: potongan tombol dari lukisan, membesar saat disentuh kursor
    const bp = P(572.5, 271.5), bw = 287 * k, bh = 83 * k;
    const btn = this.add.image(bp.x, bp.y, 'btn_mainlagi').setDisplaySize(bw, bh).setDepth(5);
    const sx = btn.scaleX, sy = btn.scaleY;
    this.tweens.add({ targets: btn, y: bp.y - 2, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const z = this.add.zone(bp.x, bp.y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(25);
    const grow = (f) => { this.tweens.add({ targets: btn, scaleX: sx * f, scaleY: sy * f, duration: 170, ease: 'Back.out' }); };
    z.on('pointerover', () => { grow(1.08); btn.setTint(0xfff8e8); });
    z.on('pointerout', () => { grow(1); btn.clearTint(); });
    z.on('pointerdown', () => grow(0.96));
    z.on('pointerup', () => { Audio2.play('klik'); freshRun(); this.cameras.main.fadeOut(500, 10, 8, 20); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title')); });
    this.extra.push(btn, z);
  }
  update(t, dt) { if (this.petals) this.petals.update(dt / 1000, t / 1000); }
}

// teks jam
function clockText(m) {
  m = Math.round(m) % 1440; const h = Math.floor(m / 60), mm = m % 60;
  return String(h).padStart(2, '0') + '.' + String(mm).padStart(2, '0');
}
