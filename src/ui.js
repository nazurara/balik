// =============================================================
//  UI & EFEK BERSAMA: kamera HD, tombol, tekstur cahaya, partikel,
//  kontrol sentuh (hanya muncul di HP/tablet), dan simpanan.
// =============================================================
const FONT = '"Pixelify Sans", "Trebuchet MS", monospace';
const IS_TOUCH = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

function hdCam(scene) {
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0).setZoom(2).setScroll(0, 0);
  return cam;
}

function T(scene, x, y, s, size, color, extra) {
  return scene.add.text(x, y, s, Object.assign({ fontFamily: FONT, fontSize: size + 'px', color: color || '#fff8ec', stroke: '#2c2442', strokeThickness: Math.max(2, Math.round(size / 6)) }, extra || {}));
}

// ---------- simpanan ----------
const Save = {
  key: 'balik_save_v2',
  get() { try { return JSON.parse(localStorage.getItem(this.key)) || null; } catch (e) { return null; } },
  set(o) { try { localStorage.setItem(this.key, JSON.stringify(o)); } catch (e) {} },
  clear() { try { localStorage.removeItem(this.key); } catch (e) {} },
  flag(k, v) { try { if (v === undefined) return localStorage.getItem('balik_' + k) === '1'; localStorage.setItem('balik_' + k, v ? '1' : '0'); } catch (e) { return false; } }
};
// keadaan perjalanan (dibawa antar level)
const RUN = { level: 0, hearts: 3, maxHearts: 3, bekal: 100, battery: 85, stats: { nasi: 0, air: 0, hati: 0, baterai: 0 }, cp: null };
function freshRun() {
  RUN.level = 0; RUN.hearts = 3; RUN.maxHearts = 3; RUN.bekal = 100; RUN.battery = 85; RUN.cp = null; RUN.minute = null;
  RUN.stats = { nasi: 0, air: 0, hati: 0, baterai: 0 };
}
function saveRun() { Save.set({ level: RUN.level, hearts: RUN.hearts, maxHearts: RUN.maxHearts, bekal: RUN.bekal, battery: RUN.battery, stats: RUN.stats, cp: RUN.cp, minute: RUN.minute }); }
function loadRun() { const s = Save.get(); if (!s) return false; Object.assign(RUN, s); return true; }

// ---------- tombol bergaya menu Balik (ungu lembut) ----------
class PButton {
  constructor(scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    this.scene = scene; this.x = x; this.y = y; this.h = h; this.onClick = onClick;
    this.depth = opts.depth || 200; this.col = opts.color || 0x6c5cb4; this.hover = false; this.down = false;
    this.c = scene.add.container(x, y).setDepth(this.depth).setScrollFactor(0);
    this.g = scene.add.graphics();
    this.t = T(scene, 0, 1, label, opts.size || 20, opts.textColor || '#ffffff', { strokeThickness: 0 }).setOrigin(0.5);
    this.w = Math.max(w, this.t.width + 36);          // tulisan tidak pernah keluar dari tombol
    this.c.add([this.g, this.t]);
    this.z = scene.add.zone(x, y, this.w, h).setInteractive({ useHandCursor: true }).setDepth(this.depth + 2).setScrollFactor(0);
    const grow = (k) => { scene.tweens.killTweensOf(this.c); scene.tweens.add({ targets: this.c, scale: k, duration: 160, ease: 'Back.out' }); };
    this.z.on('pointerover', () => { this.hover = true; this.draw(); grow(1.08); });
    this.z.on('pointerout', () => { this.hover = false; this.down = false; this.draw(); grow(1); });
    this.z.on('pointerdown', () => { this.down = true; this.draw(); grow(0.96); Audio2.init(); Audio2.play('klik'); });
    this.z.on('pointerup', () => { if (this.down) { this.down = false; this.draw(); grow(this.hover ? 1.08 : 1); this.onClick && this.onClick(); } });
    this.draw();
  }
  draw() {
    const g = this.g, x = -this.w / 2, y = -this.h / 2, r = Math.min(12, this.h / 2);
    const c = Phaser.Display.Color.IntegerToColor(this.col);
    const light = Phaser.Display.Color.GetColor(Math.min(255, c.red + 40), Math.min(255, c.green + 40), Math.min(255, c.blue + 40));
    const dark = Phaser.Display.Color.GetColor(c.red * 0.6 | 0, c.green * 0.6 | 0, c.blue * 0.65 | 0);
    g.clear();
    g.fillStyle(0x1e1830, 0.45); g.fillRoundedRect(x + 2, y + 6, this.w, this.h, r);
    g.fillStyle(dark, 1); g.fillRoundedRect(x, y + 4, this.w, this.h, r);
    g.fillStyle(this.hover ? light : this.col, 1); g.fillRoundedRect(x, y, this.w, this.h - 2, r);
    g.fillStyle(0xffffff, 0.22); g.fillRoundedRect(x + 6, y + 4, this.w - 12, 4, 2);
    g.lineStyle(2.5, 0xf1ecff, 1); g.strokeRoundedRect(x, y, this.w, this.h - 2, r);
  }
  setVisible(v) { [this.c, this.z].forEach((o) => o.setVisible(v)); if (v) this.z.setInteractive(); else this.z.disableInteractive(); return this; }
  destroy() { [this.c, this.z].forEach((o) => o.destroy()); }
}

// ---------- panel ----------
function panel(scene, x, y, w, h, depth) {
  const g = scene.add.graphics().setDepth(depth || 190).setScrollFactor(0);
  g.fillStyle(0x120e24, 0.45); g.fillRoundedRect(x + 3, y + 7, w, h, 16);
  g.fillStyle(0x3a3168, 0.96); g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(3, 0xd6ccff, 1); g.strokeRoundedRect(x, y, w, h, 16);
  g.lineStyle(1.5, 0x8f80d8, 1); g.strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 11);
  return g;
}

// ---------- tekstur cahaya, kabut, partikel lembut (dibuat saat mulai) ----------
function makeRuntimeTextures(scene) {
  const tx = scene.textures;
  if (tx.exists('lt_round')) return;
  const can = (key, w, h, fn) => { const c = tx.createCanvas(key, w, h); fn(c.getContext('2d'), w, h); c.refresh(); };
  can('lt_round', 256, 256, (c, w) => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  });
  // kerucut senter: pangkal di kiri-tengah, mengarah ke kanan
  can('lt_cone', 512, 256, (c, w, h) => {
    const img = c.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x, dy = y - h / 2, ang = Math.abs(Math.atan2(dy, dx + 18)), dist = Math.sqrt(dx * dx + dy * dy) / w;
      let a = Math.max(0, 1 - ang / 0.36); a = Math.pow(a, 0.8) * Math.max(0, 1 - Math.pow(dist, 1.6)) * Math.min(1, dist * 9 + 0.35);
      a *= Math.max(0, Math.min(1, (h / 2 - Math.abs(dy)) / 40));   // tanpa tepi lurus di atas/bawah
      const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.min(255, a * 255);
    }
    c.putImageData(img, 0, 0);
  });
  can('glow', 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,220,150,0.9)'); g.addColorStop(0.4, 'rgba(255,190,110,0.35)'); g.addColorStop(1, 'rgba(255,170,90,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  can('glow_cone', 512, 256, (c, w, h) => {
    const src = tx.get('lt_cone').getSourceImage(); c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = 'rgba(255,236,170,1)'; c.fillRect(0, 0, w, h);
  });
  can('p_soft', 16, 16, (c) => { const g = c.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 16, 16); });
  can('fog', 512, 160, (c, w, h) => {
    const r = mulberry(7);
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = h * 0.3 + r() * h * 0.5, rr = 30 + r() * 60;
      for (const dx of [-w, 0, w]) {
        const g = c.createRadialGradient(x + dx, y, 0, x + dx, y, rr);
        g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(x + dx - rr, y - rr, rr * 2, rr * 2);
      }
    }
  });
  can('shadow', 64, 16, (c) => { const g = c.createRadialGradient(32, 8, 0, 32, 8, 32); g.addColorStop(0, 'rgba(20,10,40,0.45)'); g.addColorStop(1, 'rgba(20,10,40,0)'); c.save(); c.scale(1, 0.25); c.fillStyle = g; c.fillRect(0, -24, 64, 64); c.restore(); });
}

// ---------- partikel melayang (daun, kelopak, kunang-kunang, debu gua) ----------
class Drifters {
  constructor(scene, opts) {
    this.s = scene; this.o = Object.assign({ n: 14, keys: ['daun_hijau'], depth: 25, sf: 1, area: null, wind: 18, fall: 30, scale: 0.6, sway: 22, spin: 2, alpha: 1, glow: false }, opts);
    this.list = [];
    for (let i = 0; i < this.o.n; i++) this.list.push(this.spawn(true));
  }
  area() {
    const cam = this.s.cameras.main, o = this.o;
    if (o.area) return o.area;
    return o.sf === 0 ? { x: 0, y: -20, w: 960, h: 560 } : { x: cam.scrollX - 40, y: -20, w: 1040, h: 560 };
  }
  spawn(first) {
    const a = this.area(), o = this.o, k = Phaser.Utils.Array.GetRandom(o.keys);
    const im = this.s.add.image(a.x + Math.random() * a.w, first ? a.y + Math.random() * a.h : a.y - 10, k).setDepth(o.depth).setScrollFactor(o.sf).setScale(o.scale * (0.7 + Math.random() * 0.6)).setAlpha(o.alpha);
    if (o.glow) im.setBlendMode(Phaser.BlendModes.ADD).setTint(0xd8ff7a);
    if (o.spawnRect) { const r = o.spawnRect; im.x = r.x + Math.random() * r.w; im.y = first ? r.y + Math.random() * a.h : r.y + Math.random() * r.h; }
    im.ph = Math.random() * 6.28; im.sp = 0.6 + Math.random() * 0.8; im.rs = (Math.random() - 0.5) * o.spin;
    return im;
  }
  update(dt, t) {
    const o = this.o, a = this.area();
    for (let i = 0; i < this.list.length; i++) {
      const p = this.list[i];
      if (o.glow) { // kunang-kunang: melayang acak & berkedip
        p.x += Math.cos(t * 0.7 + p.ph) * 12 * dt * p.sp; p.y += Math.sin(t * 0.9 + p.ph * 2) * 9 * dt * p.sp;
        p.setAlpha((0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 * p.sp + p.ph))) * (this.alphaMul === undefined ? 1 : this.alphaMul));
        if (p.x < a.x - 30 || p.x > a.x + a.w + 30) p.x = a.x + Math.random() * a.w;
        continue;
      }
      p.x += (o.wind + Math.sin(t * 1.6 * p.sp + p.ph) * o.sway) * dt; p.y += o.fall * p.sp * dt;
      p.rotation += p.rs * dt; p.scaleY = p.scaleX * (0.6 + 0.4 * Math.abs(Math.sin(t * 2 * p.sp + p.ph)));
      if (p.y > a.y + a.h + 10 || p.x > a.x + a.w + 60 || p.x < a.x - 80) { p.destroy(); this.list[i] = this.spawn(false); }
    }
  }
  setAlpha(a) { this.alphaMul = a; if (!this.o.glow) this.list.forEach((p) => p.setAlpha(a * this.o.alpha)); }
  destroy() { this.list.forEach((p) => p.destroy()); }
}

// ---------- kontrol sentuh: joystick kiri, tombol loncat kanan, aksi & senter kontekstual ----------
class TouchPad {
  constructor(scene) {
    this.s = scene; this.dx = 0; this.dy = 0; this.jump = false; this.jumpPressed = false; this.action = false; this.torch = false;
    this.enabled = IS_TOUCH;
    scene.input.addPointer(3);
    if (!this.enabled) {
      // kalau ternyata layar disentuh (laptop layar sentuh), munculkan kontrol saat itu juga
      this.onFirstTouch = () => { if (!this.enabled) { this.enabled = true; this.build(); } };
      window.addEventListener('touchstart', this.onFirstTouch, { once: true });
      scene.events.once('shutdown', () => window.removeEventListener('touchstart', this.onFirstTouch));
      return;
    }
    this.build();
  }
  build() {
    const s = this.s, D = 150;
    this.g = s.add.graphics().setScrollFactor(0).setDepth(D);
    this.base = { x: 110, y: 440 }; this.knob = { x: 110, y: 440 }; this.stickId = null;
    const btn = (x, y, r, label, size) => {
      const o = { x, y, r, down: false, vis: true, id: null };
      o.t = T(s, x, y, label, size || 15, '#ffffff', { strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
      return o;
    };
    this.bJump = btn(870, 450, 46, 'LONCAT', 14);
    this.bAct = btn(870, 350, 32, 'AKSI', 13);
    this.bTorch = btn(770, 462, 28, '🔦', 20);
    this.bAct.vis = false; this.bTorch.vis = false;
    s.input.on('pointerdown', (p) => this.down(p));
    s.input.on('pointermove', (p) => this.move(p));
    s.input.on('pointerup', (p) => this.up(p));
    s.input.on('pointerupoutside', (p) => this.up(p));
  }
  world(p) { return { x: p.x / 2, y: p.y / 2 }; }
  hit(b, w) { return b.vis && Phaser.Math.Distance.Between(w.x, w.y, b.x, b.y) < b.r + 12; }
  down(p) {
    if (!this.enabled || this.s.paused) return;
    const w = this.world(p);
    if (this.hit(this.bJump, w)) { this.bJump.down = true; this.bJump.id = p.id; this.jump = true; this.jumpPressed = true; return; }
    if (this.hit(this.bAct, w)) { this.bAct.id = p.id; this.action = true; this.bAct.down = true; return; }
    if (this.hit(this.bTorch, w)) { this.torch = true; this.bTorch.down = true; this.bTorch.id = p.id; return; }
    if (w.x < 400 && w.y > 200 && this.stickId === null) { this.stickId = p.id; this.base = { x: w.x, y: w.y }; this.knob = { x: w.x, y: w.y }; this.dx = this.dy = 0; }
  }
  move(p) {
    if (p.id !== this.stickId) return;
    const w = this.world(p), dx = w.x - this.base.x, dy = w.y - this.base.y, d = Math.min(46, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    this.knob = { x: this.base.x + Math.cos(a) * d, y: this.base.y + Math.sin(a) * d };
    this.dx = Math.cos(a) * d / 46; this.dy = Math.sin(a) * d / 46;
  }
  up(p) {
    if (p.id === this.stickId) { this.stickId = null; this.dx = this.dy = 0; this.base = { x: 110, y: 440 }; this.knob = { x: 110, y: 440 }; }
    [this.bJump, this.bAct, this.bTorch].forEach((b) => { if (b && b.id === p.id) { b.down = false; b.id = null; if (b === this.bJump) this.jump = false; } });
  }
  setAction(v, label) { if (!this.bAct) return; this.bAct.vis = v; if (label) this.bAct.t.setText(label); }
  setTorch(v) { if (this.bTorch) this.bTorch.vis = v; }
  consume() { const r = { jumpPressed: this.jumpPressed, action: this.action, torch: this.torch }; this.jumpPressed = this.action = this.torch = false; return r; }
  draw() {
    if (!this.g) return;
    const g = this.g; g.clear();
    g.fillStyle(0xffffff, 0.12); g.fillCircle(this.base.x, this.base.y, 50); g.lineStyle(3, 0xffffff, 0.45); g.strokeCircle(this.base.x, this.base.y, 50);
    g.fillStyle(0xe8e0ff, 0.6); g.fillCircle(this.knob.x, this.knob.y, 24); g.lineStyle(2, 0x6c5cb4, 0.8); g.strokeCircle(this.knob.x, this.knob.y, 24);
    [[this.bJump, 0xf2b84b], [this.bAct, 0x7fc8a0], [this.bTorch, 0xffe9a0]].forEach(([b, c]) => {
      b.t.setVisible(b.vis); if (!b.vis) return;
      g.fillStyle(c, b.down ? 0.85 : 0.55); g.fillCircle(b.x, b.y + (b.down ? 2 : 0), b.r); g.lineStyle(3, 0xffffff, 0.8); g.strokeCircle(b.x, b.y + (b.down ? 2 : 0), b.r);
    });
  }
}

// Pengganti TileSprite untuk tekstur ber-alpha (TileSprite membuat bagian transparan jadi hitam):
// deretan gambar biasa yang bisa digeser (untuk air beriak, parallax, kabut).
class Tiler {
  constructor(scene, x, y, w, key, scale, depth, sf) {
    this.s = scene; this.x = x; this.w = w; this.sc = scale; this.key = key;
    const src = scene.textures.get(key).getSourceImage();
    this.tw = src.width * scale; this.ims = [];
    const n = Math.ceil(w / this.tw) + 1;
    for (let i = 0; i < n; i++) this.ims.push(scene.add.image(x + i * this.tw, y, key).setOrigin(0, 0).setScale(scale).setDepth(depth).setScrollFactor(sf === undefined ? 1 : sf));
    this.set(0);
  }
  set(off) {
    const o = ((off % this.tw) + this.tw) % this.tw;
    this.ims.forEach((im, i) => {
      const x = this.x + i * this.tw - o; im.x = x;
      // potong supaya tidak keluar dari batas area
      const left = Math.max(0, this.x - x), right = Math.max(0, x + this.tw - (this.x + this.w));
      const fw = im.frame.width;
      if (left >= this.tw || right >= this.tw) { im.setVisible(false); return; }
      im.setVisible(true).setCrop(left / this.sc, 0, fw - (left + right) / this.sc, im.frame.height);
    });
  }
  setAlpha(a) { this.ims.forEach((im) => im.setAlpha(a)); return this; }
  setY(y) { this.ims.forEach((im) => im.y = y); return this; }
  get y() { return this.ims[0].y; }
}
