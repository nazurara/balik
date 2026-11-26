// =============================================================
//  GAME — satu scene untuk semua level dan area rahasia.
// =============================================================
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.lv = data.level || 0;
    this.secretIdx = data.secret === undefined ? -1 : data.secret;
    this.isSecret = this.secretIdx >= 0;
    this.main = LEVELS[this.lv];
    this.L = this.isSecret ? SECRETS[this.secretIdx] : this.main;
    this.spawnX = data.x;
    const saved = (data.fromSave || data.fromCP) && RUN.minute ? RUN.minute : 0;
    this.minute = data.minute || (saved >= this.main.time[0] && saved <= this.main.time[1] + 15 ? saved : this.main.time[0]);
    this.fromCP = !!data.fromCP || !!data.fromSave;
    this.emerge = !!data.emerge;
  }

  // ===================================================== BANGUN DUNIA
  create() {
    hdCam(this);
    makeRuntimeTextures(this);
    const L = this.L;
    this.len = L.len;
    this.physics.world.setBounds(0, -400, L.len, 1400);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.paused = false; this.ended = false; this.cut = false;
    // scene dipakai ulang saat restart: kosongkan semua keadaan lama
    ['skyHidden', 'swim', 'raft', 'croc', 'cpUsed', 'autoTorch', 'autoWalk', 'autoRun', 'lows', 'fishes', 'glints', 'fogs', 'flies', 'leaves', 'thinkT', 'pauseObjs', 'raftState', 'swimZone', 'boulders', 'look', 'standSeg', 'exitX', 'hintT', 'curInteract', 'cpLamp', 'onRaft', 'ts', 'hand', 'darkness', 'torchOn', 'redFlash', 'jumpQueued', 'swimSpr', 'wake', 'emerge', 'seated', 'paddle', 'hands', 'treadSpr', 'flipRaft', 'crocStop', 'homeT'].forEach((k) => { this[k] = undefined; });
    this.solids = this.physics.add.staticGroup();
    this.plats = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: true });
    this.shots = this.physics.add.group();
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.items = []; this.interacts = []; this.lights = (L.lights || []).map((l) => ({ x: l[0], y: l[1], r: l[2] || 120 }));
    this.glows = [];
    this.fx = [];

    this.buildSky();
    this.buildBackground();
    this.buildWater();
    this.buildGround();
    this.buildPlatforms();
    this.buildDecor();
    this.buildObjects();
    this.buildPlayer();
    this.buildEnemies();
    this.buildSpecial();
    this.buildSpecial2();
    this.buildLighting();
    this.buildHud();
    this.buildInput();

    this.physics.add.collider(this.li, this.solids, (a, b) => this.onGround(b));
    this.physics.add.collider(this.li, this.plats, null, (li, p) => !this.p.dropT && li.body.velocity.y >= -5 && li.body.bottom <= p.body.top + 14);
    this.physics.add.collider(this.li, this.movers, (li, m) => { if (m.isRaft && li.body.touching.down) this.onRaft = true; });
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.plats);
    this.physics.add.overlap(this.li, this.enemies, (li, e) => this.touchEnemy(e));
    this.physics.add.overlap(this.li, this.shots, (li, s) => { if (!s.dead) { Audio2.play('bonk'); this.hurt(s.x); s.dead = true; s.destroy(); } });
    this.physics.add.collider(this.shots, this.solids, (s) => { this.puff(s.x, s.y, 4); s.destroy(); });

    Audio2.init();
    Audio2.playMusic(L.music); Audio2.setAmbience(L.amb);
    this.cam = this.cameras.main;
    this.cam.scrollX = Phaser.Math.Clamp(this.li.x - 380, 0, this.len - 960);
    this.cam.fadeIn(600, 10, 8, 20);
    this.elapsed = 0; this.maxX = this.li.x;
    if (!this.isSecret && !this.fromCP && this.spawnX === undefined) this.time.delayedCall(900, () => this.toast(this.main.name.toUpperCase() + ' · ' + this.main.sub, 3200));
    if (this.isSecret) this.time.delayedCall(700, () => this.toast('Pintu rahasia: ' + L.name, 2800));
    if (this.lv === 0 && !this.isSecret && !Save.flag('tut')) this.tutorial();
    this.events.once('shutdown', () => { Audio2.paused = false; this.anims.resumeAll(); });
  }

  // ---------- langit (dinamis menurut jam) ----------
  buildSky() {
    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-100);
    this.sun = this.add.image(0, 0, 'glow').setScrollFactor(0).setDepth(-99).setScale(1.4).setBlendMode(Phaser.BlendModes.ADD);
    this.sunCore = this.add.circle(0, 0, 13, 0xfff6d8).setScrollFactor(0).setDepth(-99);
    this.moon = this.add.image(0, 0, 'bulan').setScrollFactor(0).setDepth(52).setScale(0.55);
    this.moonGlow = this.add.image(0, 0, 'glow').setScrollFactor(0).setDepth(52).setScale(1.3).setTint(0xc8d0ff).setBlendMode(Phaser.BlendModes.ADD);
    this.stars = [];
    const r = mulberry(5);
    for (let i = 0; i < 70; i++) {
      const s = this.add.image(r() * 960, r() * 260, 'bintang').setScrollFactor(0).setDepth(52).setScale(0.4 + r() * 0.8);
      s.tw = r() * 6.28; this.stars.push(s);
    }
    this.lastSkyKey = '';
  }

  buildBackground() {
    const L = this.L, b = L.bg;
    const painted = { kota: [['kota1', 'kota2'], 0.5743], hutan: [['h_bg2'], 540 / 394], semak: [['semak_bg'], 540 / 388], gua: [['g_bg'], 540 / 432] };
    this.par = [];
    if (painted[b]) {
      const [keys, k] = painted[b], sf = b === 'gua' ? 0.25 : 0.3;
      const w = this.textures.get(keys[0]).getSourceImage().width * k - 1;
      const n = Math.ceil((this.len * sf + 960) / w) + 1;
      for (let i = 0; i < n; i++) {
        const im = this.add.image(i * w, 0, keys[i % keys.length]).setOrigin(0, 0).setScale(k).setScrollFactor(sf).setDepth(-90);
        if (keys.length === 1 && i % 2) { im.setFlipX(true); }
        if (L.tint) im.setTint(L.tint);
      }
      this.skyHidden = true;
    } else if (b === 'lumbung') {
      this.skyHidden = true;
      const g = this.add.graphics().setScrollFactor(0.4).setDepth(-90);
      for (let x = -20; x < this.len * 0.4 + 1000; x += 34) {
        g.fillStyle(((x / 34) | 0) % 2 ? 0x6b4430 : 0x7a4e36); g.fillRect(x, 0, 34, 540);
        g.fillStyle(0x52321f); g.fillRect(x, 0, 3, 540);
      }
      for (let x = 30; x < this.len * 0.4 + 1000; x += 120) { // ikatan padi tergantung
        g.lineStyle(2, 0x4a2c1c); g.lineBetween(x, 0, x, 90);
        g.fillStyle(0xe8c25a); g.fillTriangle(x - 16, 140, x + 16, 140, x, 88); g.fillStyle(0xc99a3a); g.fillRect(x - 3, 88, 6, 12);
      }
      for (let i = 0; i < 4; i++) { // berkas cahaya dari celah papan
        const sh = this.add.image(200 + i * 300, 0, 'lt_cone').setOrigin(0, 0.5).setRotation(1.2).setScale(1.2, 0.35).setAlpha(0.12).setScrollFactor(0.4).setDepth(-89).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: sh, alpha: 0.05, duration: 2500 + i * 300, yoyo: true, repeat: -1 });
      }
    } else {
      const lay = { sungai: ['bg_sungai_far', 'bg_sungai_mid', 'bg_sungai_near'], gunung: ['bg_gunung_far', 'bg_gunung_mid', 'bg_gunung_near'], sawah: ['bg_sawah_far', 'bg_sawah_mid'], kampung: ['bg_kampung_far', 'bg_kampung_mid'] }[b];
      const fs = [0.06, 0.16, 0.32];
      lay.forEach((key, i) => {
        const ts = new Tiler(this, 0, 0, 960, key, 1, -80 + i * 5, 0);
        ts.f = fs[i]; this.par.push(ts);
      });
      if (b === 'kampung') { this.add.image(this.main.home + 170, GY + 6, 'rumahgadang').setOrigin(0.5, 1).setScale(1.05).setDepth(-30); this.lights.push({ x: this.main.home + 170, y: GY - 120, r: 230 }); }
    }
    // burung di langit siang
    if (!L.dark && ['kota', 'hutan', 'sungai', 'gunung'].includes(b)) this.time.addEvent({ delay: 5200, loop: true, callback: () => this.birds() });
  }

  birds() {
    if (this.ts && this.ts.night > 0.5) return;
    const y = 40 + Math.random() * 110, dir = Math.random() < 0.6 ? 1 : -1, n = 1 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const b = this.add.sprite(dir > 0 ? -30 - i * 20 : 990 + i * 20, y + i * 8, 'burung').setScrollFactor(0).setDepth(-60).setScale(0.8).play('burung_fly').setFlipX(dir < 0);
      this.tweens.add({ targets: b, x: dir > 0 ? 1000 : -40, y: y - 25 + Math.random() * 50, duration: 10000 + Math.random() * 3000, onComplete: () => b.destroy() });
    }
  }

  // ---------- air: sungai & got ----------
  buildWater() {
    const L = this.L;
    this.waterY = L.water || null;
    this.surfaces = [];
    const addWater = (x0, x1, y) => {
      this.add.rectangle(x0, y, x1 - x0, 560 - y, 0x3a5aa6).setOrigin(0, 0).setDepth(-8);
      const s = new Tiler(this, x0, y - 7, x1 - x0, 'air_top', 0.5, 16).setAlpha(0.95); s.y0 = y - 7;
      this.surfaces.push(s);
      this.add.rectangle(x0, y + 6, x1 - x0, 560 - y, 0x4a7ad0, 0.42).setOrigin(0, 0).setDepth(16);
    };
    if (this.waterY) {
      // air hanya terlihat di antara tebing (tidak menembus tanah)
      this.wgaps = [];
      const sg = this.L.seg; let x = 0;
      sg.forEach((g) => { if (g[0] > x) this.wgaps.push([x, g[0]]); x = Math.max(x, g[1]); });
      if (x < this.len) this.wgaps.push([x, this.len]);
      this.wgaps.forEach(([a, b]) => addWater(a, b, this.waterY));
      const inW = (px) => this.wgaps.some(([a, b]) => px > a + 6 && px < b - 6);
      const rx = () => { for (let k = 0; k < 40; k++) { const px = Math.random() * this.len; if (inW(px)) return px; } return this.wgaps[0][0] + 40; };
      this.inWater = inW;
      // ikan kecil berenang di bawah permukaan
      this.fishes = [];
      for (let i = 0; i < 22; i++) {
        const f = this.add.sprite(rx(), this.waterY + 18 + Math.random() * 34, 'ikankecil', i % 3).setScale(0.45).setDepth(-6).setAlpha(0.85);
        f.v = (18 + Math.random() * 26) * (Math.random() < 0.5 ? -1 : 1); f.ph = Math.random() * 6; f.setFlipX(f.v > 0);
        this.fishes.push(f);
      }
      // kilau di permukaan
      this.glints = [];
      for (let i = 0; i < 40; i++) this.glints.push(this.add.image(rx(), this.waterY - 2 + Math.random() * 10, 'p_soft').setScale(0.35, 0.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(17).setAlpha(0));
    } else if (L.gaps === 'got') {
      const sg = L.seg;
      for (let i = 0; i < sg.length - 1; i++) addWater(sg[i][1], sg[i + 1][0], 516);
    }
    // jurang: bayangan gelap di dasar celah
    if (L.gaps === 'jurang') {
      const sg = L.seg;
      for (let i = 0; i < sg.length - 1; i++) {
        const x0 = sg[i][1], x1 = sg[i + 1][0], w = x1 - x0; if (w <= 2) continue;
        const yl = sg[i][2], yr = sg[i + 1][2], low = Math.max(yl, yr);
        const kl = sg[i][3] || this.L.ground, kr = sg[i + 1][3] || this.L.ground;
        // dinding tebing seberang yang tampak di dalam celah
        const ww = Math.min(26, w * 0.28);
        this.add.tileSprite(x0, yl + 26, ww, 560 - yl, 'wall_' + kl).setOrigin(0, 0).setTileScale(0.5).setDepth(-7);
        this.add.tileSprite(x1 - ww, yr + 26, ww, 560 - yr, 'wall_' + kr).setOrigin(0, 0).setTileScale(0.5).setDepth(-7).setFlipX(true);
        // kabut gelap di dasar: makin dalam makin pekat, bagian atas tetap terlihat
        const g = this.add.graphics().setDepth(-6);
        g.fillGradientStyle(0x2a2246, 0x2a2246, 0x120e20, 0x120e20, 0, 0, 0.92, 0.92); g.fillRect(x0, low + 4, w, 90);
        g.fillStyle(0x120e20, 0.92); g.fillRect(x0, low + 94, w, 560);
        // akar & rumput menjuntai di bibir tebing
        const r = mulberry(x0 | 0);
        for (let k = 0; k < 3; k++) {
          const side = k % 2, bx = side ? x1 - 3 - r() * 8 : x0 + 3 + r() * 8, by = (side ? yr : yl) + 22;
          const rt = this.add.rectangle(bx, by, 2, 10 + r() * 14, 0x5c7a4a).setOrigin(0.5, 0).setDepth(-5);
          this.tweens.add({ targets: rt, angle: { from: -5, to: 5 }, duration: 1800 + r() * 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
      }
    }
  }

  // ---------- tanah ----------
  buildGround() {
    const L = this.L;
    const add = (x0, x1, y, kind, mud) => {
      const w = x1 - x0;
      if (mud) {
        this.add.rectangle(x0, y + 6, w, 600 - y, 0x4a3226).setOrigin(0, 0).setDepth(-1);
        for (let k = 0; k < w / 40; k++) { const b = this.add.ellipse(x0 + 20 + k * 40 + Math.random() * 10, y + 16 + Math.random() * 12, 10, 4, 0x6a4a3a).setDepth(15.5); this.tweens.add({ targets: b, scaleX: 1.4, alpha: 0.4, duration: 1400 + Math.random() * 900, yoyo: true, repeat: -1 }); }
        for (let k = 0; k < w / 50; k++) { const r = this.add.rectangle(x0 + 16 + k * 50, y - 10, 2, 14, 0x7fae6a).setOrigin(0.5, 1).setDepth(15.6); this.tweens.add({ targets: r, angle: { from: -6, to: 6 }, duration: 1600 + k * 90, yoyo: true, repeat: -1 }); }
        const s = new Tiler(this, x0, y - 4, w, 'lumpur_top', 0.5, 15).setAlpha(0.96); s.y0 = y - 4;
        this.surfaces.push(s);
      } else {
        this.add.tileSprite(x0, y + 30, w, 600 - y, 'gb_' + kind).setOrigin(0, 0).setTileScale(0.5).setDepth(0);
        this.add.tileSprite(x0, y - 2, w, 32, 'gt_' + kind).setOrigin(0, 0).setTileScale(0.5).setDepth(1);
        const e = this.add.graphics().setDepth(1); // bibir tebing gelap di sisi
        const mudAt = (x) => (L.mud || []).some((m) => Math.abs(m[0] - x) < 2 || Math.abs(m[1] - x) < 2);
        e.fillStyle(0x2c2442, 1); if (!mudAt(x0)) e.fillRect(x0, y, 2.5, 600 - y); if (!mudAt(x1)) e.fillRect(x1 - 2.5, y, 2.5, 600 - y);
      }
      const z = this.add.zone(x0 + w / 2, y + (mud ? 8 : 0) + 150, w, 300);
      this.physics.add.existing(z, true); this.solids.add(z);
      z.seg = { x0, x1, y: y + (mud ? 8 : 0), mud: !!mud };
    };
    this.surfaces = this.surfaces || [];
    L.seg.forEach((s) => add(s[0], s[1], s[2], s[3] || L.ground));
    (L.mud || []).forEach((m) => add(m[0], m[1], GY + 6, null, true));
    this.segs = L.seg;
  }

  buildPlatforms() {
    // tidak ada yang melayang: setiap pijakan punya penopang sampai ke tanah/air
    (this.L.plat || []).forEach((p) => {
      const [x, y, w, kind] = p;
      let im, bw = w, bh = 12, solid = false;
      const below = this.groundBelow(x + w / 2, y + 20), bottom = below >= 600 ? 560 : below + 6;
      if (kind === 'awning') { im = new Tiler(this, x, y - 4, w, 'plat_awning', 0.5, 2).ims[0]; const g = this.add.graphics().setDepth(1); g.fillStyle(0x2c2442); g.fillRect(x + 3, y + 12, 5, GY - y - 10); g.fillRect(x + w - 8, y + 12, 5, GY - y - 10); g.fillStyle(0x6a5a7a); g.fillRect(x + 4, y + 12, 3, GY - y - 10); g.fillRect(x + w - 7, y + 12, 3, GY - y - 10); }
      else if (kind === 'rock') {
        // gundukan tanah berbatu yang menyatu dengan tanah di bawahnya (pijakan padat)
        const k = this.L.ground;
        this.add.tileSprite(x, y + 28, w, bottom - y - 28, 'gb_' + k).setOrigin(0, 0).setTileScale(0.5).setDepth(1);
        im = this.add.tileSprite(x, y - 2, w, 32, 'gt_' + k).setOrigin(0, 0).setTileScale(0.5);
        const e = this.add.graphics().setDepth(1); e.fillStyle(0x2c2442, 1); e.fillRect(x, y + 4, 2.5, bottom - y - 4); e.fillRect(x + w - 2.5, y + 4, 2.5, bottom - y - 4);
        this.add.image(x + w / 2, below + 3, 'shadow').setScale(w / 50, 1.2).setDepth(0.5);
        solid = true;
      }
      else if (kind === 'stone') { im = this.add.image(x + w / 2, y + 22, 'rock').setScale(w / 113 * 1.05).setOrigin(0.5, 0.62); }
      else if (kind === 'plank') {
        // dermaga: papan bertiang kayu
        const g = this.add.graphics().setDepth(1);
        [x + 8, x + w - 12].forEach((px) => { g.fillStyle(0x2c2018); g.fillRect(px - 1, y + 6, 8, bottom - y - 6); g.fillStyle(0x7a5236); g.fillRect(px, y + 6, 6, bottom - y - 6); g.fillStyle(0x9a6a44); g.fillRect(px, y + 6, 2, bottom - y - 6); });
        im = this.add.image(x + w / 2, y + 8, 'plank').setScale(w / 144).setOrigin(0.5, 0.3);
      }
      else if (kind === 'cave') {
        im = this.add.image(x, y - 4, 'cave_plat').setOrigin(0, 0).setScale(0.6); bw = im.displayWidth;
        // tiang batu (stalagmit) di bawah langkan gua
        const cw = bw * 0.42;
        this.add.tileSprite(x + bw / 2 - cw / 2, y + 10, cw, bottom - y - 10, 'wall_cave').setOrigin(0, 0).setTileScale(0.5).setDepth(1);
        const e = this.add.graphics().setDepth(1); e.fillStyle(0x1a1428, 1); e.fillRect(x + bw / 2 - cw / 2, y + 10, 2, bottom - y); e.fillRect(x + bw / 2 + cw / 2 - 2, y + 10, 2, bottom - y);
      }
      im.setDepth(2);
      const z = this.add.zone(x + bw / 2, solid ? (y + bottom) / 2 : y + bh / 2, bw, solid ? bottom - y : bh);
      this.physics.add.existing(z, true);
      if (solid) { this.solids.add(z); z.seg = { x0: x, x1: x + bw, y }; }
      else { this.plats.add(z); z.body.checkCollision.down = false; z.body.checkCollision.left = false; z.body.checkCollision.right = false; }
    });
  }

  buildDecor() {
    (this.L.dec || []).forEach(([key, x, y, sc, dep, flip]) => {
      const im = this.add.image(x, y + 2, key).setOrigin(0.5, 1).setScale(sc).setDepth(dep > 0 ? 14 : -3).setFlipX(!!flip);
      if (!/lamp_|lantern|cave_lamp|arah/.test(key)) this.add.image(x, y + 1, 'shadow').setScale(Math.min(4, im.displayWidth / 46), 1.1).setDepth(im.depth - 0.1).setAlpha(0.85);
      // pohon & semak bergoyang tertiup angin
      if (/tree|bush|flower|plant/.test(key)) this.tweens.add({ targets: im, angle: { from: -1.2, to: 1.2 }, duration: 2200 + Math.random() * 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: Math.random() * 1000 });
      if (key === 'lantern' || key === 'cave_lamp') this.tweens.add({ targets: im, angle: { from: -4, to: 4 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    // pagar pengaman jalan berkelok
    (this.L.rail || []).forEach(([x0, x1]) => {
      for (let x = x0 + 10; x < x1 - 60; x += 118) {
        const s = this.segs.find((s) => x >= s[0] && x < s[1]); if (!s) continue;
        this.add.image(x, s[2] + 1, 'fence_city').setOrigin(0, 1).setScale(0.4).setDepth(-2);
      }
    });
    // batang tumbang rendah: harus nunduk
    (this.L.low || []).forEach(([x]) => {
      // dua tunggul setinggi kepala Li yang menunduk, batang rebah tepat di atasnya
      this.add.image(x - 48, GY + 2, 'stump').setOrigin(0.5, 1).setScale(0.6, 0.66).setDepth(3);
      this.add.image(x + 48, GY + 2, 'stump').setOrigin(0.5, 1).setScale(0.6, 0.66).setDepth(3).setFlipX(true);
      this.add.image(x - 48, GY + 1, 'shadow').setScale(1.1, 1).setDepth(2.9); this.add.image(x + 48, GY + 1, 'shadow').setScale(1.1, 1).setDepth(2.9);
      this.add.image(x, GY - 38, 'log').setOrigin(0.5, 1).setScale(0.62).setDepth(12);
      const z = this.add.zone(x, GY - 62, 118, 34); this.physics.add.existing(z, true); this.solids.add(z); z.low = true;
      this.lows = this.lows || []; this.lows.push(z);
    });
  }

  // ---------- peti, semak periksa, item, checkpoint, pintu rahasia, papan akhir ----------
  buildObjects() {
    const L = this.L;
    (L.crate || []).forEach(([x, what, lvl]) => {
      const c = this.physics.add.staticImage(x, this.groundAt(x) - 15 - (lvl ? 33 : 0), 'crate').setScale(0.45).setDepth(3);
      c.refreshBody(); this.solids.add(c);
      this.interacts.push({ x, y: c.y - 14, r: 46, label: 'Buka peti', act: (it) => { it.done = true; this.openCrate(c, what); } });
    });
    (L.crate || []).forEach(([x, what, lvl]) => { if (!lvl) this.add.image(x, this.groundAt(x) + 1, 'shadow').setScale(0.9, 1).setDepth(2.9); });
    (L.search || []).forEach(([x, what]) => {
      const b = this.add.image(x, GY + 2, 'bush').setOrigin(0.5, 1).setScale(0.55).setDepth(13);
      const q = T(this, x, GY - 58, '?', 16, '#fff3b0').setOrigin(0.5).setDepth(13);
      this.tweens.add({ targets: q, y: q.y - 6, duration: 700, yoyo: true, repeat: -1 });
      this.interacts.push({ x, y: GY - 20, r: 50, label: 'Periksa semak', act: (it) => {
        it.done = true; q.destroy(); Audio2.play('step', 'grass'); Audio2.play('step', 'grass');
        this.tweens.add({ targets: b, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 4 });
        for (let i = 0; i < 6; i++) this.leafBurst(x, GY - 25);
        this.time.delayedCall(250, () => this.spawnItem(what, x, GY - 40, true));
      } });
    });
    (L.it || []).forEach(([k, x, y]) => this.spawnItem(k, x, y));
    if (!this.isSecret) {
      const cp = L.cp;
      if (cp) {
        const key = { warung: 'shop', gubuk: 'gubuk', musala: 'masjid2' }[cp.kind], sc = { warung: 0.78, gubuk: 1.08, musala: 1.05 }[cp.kind];
        const y = this.groundAt(cp.x);
        this.add.image(cp.x, y + 3, key).setOrigin(0.5, 1).setScale(sc).setDepth(-4);
        this.cpLamp = this.add.image(cp.x, y - 110, 'glow').setScale(0.9).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(-3);
        this.lights.push({ x: cp.x, y: y - 90, r: 170, cp: true });
        this.interacts.push({ x: cp.x, y: y - 40, r: 70, label: 'Istirahat', keep: true, act: () => this.rest(cp) });
      }
      const s = L.secret;
      if (s) {
        const y = this.groundAt(s.x);
        if (s.kind === 'jembatan') { this.add.image(s.x, y + 4, 'bridge_soft').setOrigin(0.5, 1).setScale(0.75).setDepth(-4); this.lights.push({ x: s.x - 6, y: y - 50, r: 60 }); }
        if (s.kind === 'terowongan') {
          // mulut terowongan di kaki tebing batu, dikelilingi bebatuan
          this.add.ellipse(s.x, y - 60, 250, 190, 0x5d567e).setDepth(-5);
          this.add.image(s.x, y + 4, 'cavein_soft').setOrigin(0.5, 1).setScale(0.62).setDepth(-4);
          this.add.image(s.x - 92, y + 4, 'rocks_bush').setOrigin(0.5, 1).setScale(0.32).setDepth(-3);
          this.add.image(s.x + 95, y + 4, 'rocks_bush').setOrigin(0.5, 1).setScale(0.3).setDepth(-3).setFlipX(true);
          this.lights.push({ x: s.x + 30, y: y - 80, r: 60 });
        }
        if (s.kind === 'airterjun') { this.add.image(s.x, y + 4, 'waterfall').setOrigin(0.5, 1).setScale(0.6).setDepth(-4); this.falls(s.x, y); }
        if (s.kind === 'lumbung') { this.add.image(s.x, y + 3, 'rangkiang').setOrigin(0.5, 1).setScale(0.62).setDepth(-4); this.lights.push({ x: s.x, y: y - 60, r: 70 }); }
        if (s.kind === 'semak') {
          [[-50, 0.75], [45, 0.8], [0, 1]].forEach(([dx, sc]) => { const b = this.add.image(s.x + dx, y + 4, 'bush').setOrigin(0.5, 1).setScale(sc).setDepth(-4); this.tweens.add({ targets: b, angle: { from: -1.5, to: 1.5 }, duration: 1800, yoyo: true, repeat: -1 }); });
          const eyes = this.add.image(s.x, y - 40, 'p_soft').setScale(0.3).setTint(0xaef0ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(-3);
          this.tweens.add({ targets: eyes, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
        }
        const lbl = { jembatan: 'Masuk gua', semak: 'Masuk semak', airterjun: 'Masuk balik air terjun', terowongan: 'Masuk terowongan', lumbung: 'Masuk lumbung' }[s.kind];
        this.interacts.push({ x: s.x, y: y - 40, r: 55, label: lbl, keep: true, act: () => this.enterSecret(s) });
        const sp = this.add.image(s.x, y - 70, 'p_soft').setScale(0.6).setTint(0xfff3b0).setBlendMode(Phaser.BlendModes.ADD).setDepth(12);
        this.tweens.add({ targets: sp, alpha: 0.15, scale: 0.3, duration: 1000, yoyo: true, repeat: -1 });
      }
      if (L.exit) {
        const y = this.groundAt(L.exit);
        this.add.image(L.exit, y + 2, 'arah').setOrigin(0.5, 1).setScale(0.42).setDepth(-3);
        T(this, L.exit, y - 92, L.exitSign, 13, '#fff3d6').setOrigin(0.5).setDepth(-3);
      }
    } else {
      // jalan keluar area rahasia
      const x = this.len - 70;
      this.add.image(x, GY + 2, 'ladder').setOrigin(0.5, 1).setScale(0.55).setDepth(-3);
      const lg = this.add.image(x, GY - 150, 'lt_cone').setOrigin(0, 0.5).setRotation(Math.PI / 2).setScale(0.6, 0.45).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.4).setDepth(12);
      this.lights.push({ x, y: GY - 90, r: 150 });
      T(this, x, GY - 120, 'Keluar ↑', 14, '#fff3d6').setOrigin(0.5).setDepth(12);
      this.exitX = x - 20;
    }
  }

  falls(x, y) { // percikan & kabut air terjun
    this.time.addEvent({ delay: 90, loop: true, callback: () => {
      const d = this.add.image(x - 12 + Math.random() * 24, y - 40, 'tetes').setDepth(-3).setScale(0.8);
      this.tweens.add({ targets: d, y: y - 5, x: d.x + (Math.random() - 0.5) * 30, alpha: 0, duration: 500, onComplete: () => d.destroy() });
    } });
  }

  groundAt(x) { const s = this.L.seg.find((s) => x >= s[0] && x <= s[1]); return s ? s[2] : GY; }

  spawnItem(kind, x, y, pop) {
    const sc = { nasi: 0.3, air: 0.24, hati: 0.3, baterai: 0.55 }[kind];
    const im = this.add.image(x, y, kind).setScale(sc).setDepth(6);
    // barang diletakkan di atas tanah/pijakan (tidak melayang di udara)
    const gb = this.groundBelow(x, y - 4), rest = gb < 600 ? gb - im.displayHeight / 2 + 1 : y;
    const sh = this.add.image(x, gb + 1, 'shadow').setScale(0.55, 0.7).setDepth(5).setAlpha(gb < 600 ? 0.8 : 0);
    const spark = this.add.image(x, rest, 'p_soft').setScale(0.9).setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setDepth(53);
    const it = { kind, im, sh, spark, x, y: rest, by: rest, ph: Math.random() * 6 };
    im.y = rest;
    if (pop) {
      // keluar dari peti/semak: melambung lalu jatuh dan memantul kecil di tanah
      it.by = y - 26; im.y = y;
      this.tweens.add({ targets: it, by: y - 30, duration: 220, ease: 'Quad.out', onComplete: () => this.tweens.add({ targets: it, by: rest, duration: 380, ease: 'Bounce.out' }) });
    }
    this.items.push(it);
  }
  groundBelow(x, y) {
    let best = 600;
    this.segs.forEach((s) => { if (x >= s[0] && x <= s[1] && s[2] >= y && s[2] < best) best = s[2]; });
    (this.L.plat || []).forEach((p) => { const w = p[2] || this.textures.get('cave_plat').getSourceImage().width * 0.6; if (x >= p[0] && x <= p[0] + w && p[1] >= y && p[1] < best) best = p[1]; });
    return best;
  }

  // ===================================================== PEMAIN
  buildPlayer() {
    let x = 60;
    if (this.spawnX !== undefined) x = this.spawnX;
    else if (this.fromCP && RUN.cp && RUN.cp.level === this.lv && !this.isSecret) x = RUN.cp.x;
    const y = this.groundAt(x) - 4;
    const li = this.li = this.physics.add.sprite(x, y, 'li', 5).setOrigin(0.5, 1).setScale(WS).setDepth(10);
    li.body.setSize(50, 168).setOffset(41, 32);
    li.body.setMaxVelocity(600, 900); li.setCollideWorldBounds(true);
    li.body.setGravityY(0);
    this.physics.world.gravity.y = 1400;
    this.p = { face: 1, coyote: 0, buffer: 0, crouch: false, turnT: 0, stopT: 0, landT: 0, sitT: 0, invul: 0, fatigue: 0, stepD: 0, dropT: 0, wasAir: false, warnTired: false, lastVY: 0 };
    this.lastSafe = { x, y: this.groundAt(x) };
    this.liShadow = this.add.image(x, y, 'shadow').setDepth(9).setScale(0.7, 0.8);
    if (this.emerge) {
      // ujung jalan pintas: lubang di balik semak & batu, Li keluar dari sana
      this.add.ellipse(x, y - 18, 70, 46, 0x1a1428).setDepth(-3);
      this.add.image(x - 30, y + 3, 'rock').setOrigin(0.5, 1).setScale(0.45).setDepth(-2);
      this.add.image(x + 34, y + 3, 'bush').setOrigin(0.5, 1).setScale(0.5).setDepth(-2);
      li.setAlpha(0); li.y -= 2;
      this.tweens.add({ targets: li, alpha: 1, duration: 700, delay: 300 });
      this.time.delayedCall(400, () => { this.puff(x, y, 8); Audio2.play('step', 'grass'); this.think('Jalan pintas! Lebih cepat sampai.'); });
    }
    // senter di tangan
    this.torchOn = false;
    this.senter = this.add.image(0, 0, 'senter').setScale(0.42).setDepth(11).setOrigin(0.15, 0.5).setVisible(false);
    this.fist = this.add.image(0, 0, 'fist').setScale(0.42).setDepth(11.5).setVisible(false);
  }

  onGround(z) {
    if (!z.seg || !this.li.body.blocked.down) return;
    this.standSeg = z.seg;
    if (!z.seg.mud) {
      const s = z.seg; this.lastSafe = { x: Phaser.Math.Clamp(this.li.x, s.x0 + 34, s.x1 - 34), y: s.y };
    }
  }

  // ===================================================== MUSUH
  buildEnemies() {
    (this.L.en || []).forEach((e) => this.makeEnemy(e));
  }
  makeEnemy(def) {
    const [kind, x, a, b] = def;
    const S = { copet: 0.6, cat: 0.42, monyet: 0.38, ular: 0.38, bat: 0.3, rat: 0.32, slime: 0.3, ularbatu: 0.38, ikan: 0.5, biawak: 0.42, elang: 0.3, bebek: 0.42, lintah: 0.5, kerbau: 0.6 }[kind];
    let y = kind === 'monyet' ? a - 2 : kind === 'bat' ? a : kind === 'elang' ? 110 : kind === 'ikan' ? this.waterY + 30 : this.groundAt(x) - 2;
    if (kind === 'lintah' || kind === 'kerbau') y = GY + 14;
    const e = (kind === 'kerbau') ? this.movers.create(x, y, kind) : this.enemies.create(x, y, kind);
    e.setOrigin(0.5, 1).setScale(S).setDepth(kind === 'kerbau' ? 4 : 7);
    e.kind = kind; e.x0 = x; e.y0 = y; e.min = (kind === 'monyet' || kind === 'bat') ? x - 60 : (a !== undefined ? a : x - 80); e.max = b !== undefined ? b : x + 80;
    e.dir = Math.random() < 0.5 ? -1 : 1; e.t = Math.random() * 3; e.state = 'idle';
    e.stompable = !['ular', 'ularbatu', 'lintah', 'kerbau'].includes(kind);
    e.hurts = kind !== 'kerbau';
    const fw = SHEETS[kind][0], fh = SHEETS[kind][1];
    e.body.setSize(fw * 0.62, fh * 0.7).setOffset(fw * 0.19, fh * 0.28);
    const anim = { copet: 'copet_walk', cat: null, monyet: 'monyet_idle', ular: 'ular_idle', bat: 'bat_fly', rat: 'rat_walk', slime: 'slime_hop', ularbatu: 'ularbatu_idle', ikan: 'ikan_swim', biawak: 'biawak_walk', elang: 'elang_fly', bebek: 'bebek_walk', lintah: 'lintah_crawl', kerbau: 'kerbau_walk' }[kind];
    if (anim) e.play(anim); if (e.anims.isPlaying) e.anims.setProgress(Math.random());
    if (kind === 'cat') { e.setFrame(1); e.setScale(S, S * 0.72); e.state = 'sleep'; e.zz = T(this, x + 10, y - 40, 'z z', 11, '#e8e0ff').setDepth(7); this.tweens.add({ targets: e.zz, y: e.zz.y - 8, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1 }); }
    if (['bat', 'elang', 'ikan', 'monyet'].includes(kind)) e.body.setAllowGravity(false);
    if (kind === 'monyet') { e.body.setImmovable(true); }
    if (kind === 'ikan') { e.setVisible(false); e.state = 'hide'; e.body.enable = false; }
    if (kind === 'kerbau') { e.body.setSize(fw * 0.7, fh * 0.45).setOffset(fw * 0.1, fh * 0.15); e.body.friction.x = 1; }
    if (kind === 'lintah') e.body.setAllowGravity(false);
    // jalur patroli tidak pernah melewati tepi tebing atau menembus peti
    if (['copet', 'rat', 'biawak', 'bebek', 'cat', 'slime'].includes(kind)) {
      const sg = this.segs.find((g) => x >= g[0] && x <= g[1]);
      if (sg) { e.seg = sg; e.min = Math.max(e.min, sg[0] + 36); e.max = Math.min(e.max, sg[1] - 36); }
      (this.L.crate || []).forEach(([cx]) => { if (cx > x && cx - 40 < e.max) e.max = cx - 40; if (cx < x && cx + 40 > e.min) e.min = cx + 40; });
      (this.L.plat || []).forEach(([px, py, pw, pk]) => { if (pk !== 'rock') return; if (px > x && px - 26 < e.max) e.max = px - 26; if (px + pw < x && px + pw + 26 > e.min) e.min = px + pw + 26; });
      if (e.max < e.min + 20) { const c = (e.min + e.max) / 2; e.min = c - 10; e.max = c + 10; }
      e.lastX = x; e.stuckT = 0; e.chaseT = 0;
    }
    return e;
  }

  updateEnemies(dt) {
    const li = this.li;
    const each = (e) => {
      if (!e.active) return;
      if (e.state === 'fall' || e.slip > 0) { this.enemyFall(e, dt); return; }
      if (e.dead) return;
      e.t += dt;
      const dx = li.x - e.x, adx = Math.abs(dx), dy = li.y - e.y;
      switch (e.kind) {
        case 'copet': case 'rat': case 'biawak': case 'bebek': {
          const base = { copet: 58, rat: 95, biawak: 52, bebek: 40 }[e.kind];
          // mengejar hanya bila Li berada di tanah yang sama (tidak nekat melompati jurang)
          const liSeg = this.segs.find((g) => li.x >= g[0] && li.x <= g[1]);
          const sees = e.kind === 'copet' && adx < 230 && Math.abs(dy) < 70 && !this.swim;
          if (sees && liSeg === e.seg) e.chaseT = 1.2; else e.chaseT = Math.max(0, e.chaseT - dt);
          let v;
          if (e.chaseT > 0) { e.dir = Math.sign(dx) || e.dir; v = e.dir * 118; }
          else {
            if (e.x <= e.min) e.dir = 1; else if (e.x >= e.max) e.dir = -1;
            v = base * e.dir;
          }
          // macet (tertahan sesuatu): berbalik arah
          if (Math.abs(e.x - e.lastX) < 0.15 && e.body.blocked.down) e.stuckT += dt; else e.stuckT = 0;
          e.lastX = e.x;
          if ((e.body.blocked.left && v < 0) || (e.body.blocked.right && v > 0) || e.stuckT > 0.35) { e.dir = -Math.sign(v || 1); v = e.dir * base; e.stuckT = 0; e.chaseT = 0; if (e.dir > 0) e.min = Math.min(e.x + 4, e.max - 20); else e.max = Math.max(e.x - 4, e.min + 20); }
          e.body.setVelocityX(v); e.setFlipX(v < 0);
          if (e.kind === 'copet') { const k = Math.abs(v) > 90 ? 'copet_run' : 'copet_walk'; if (e.anims.currentAnim?.key !== k) e.play(k); }
          if (e.kind === 'rat' || e.kind === 'biawak' || e.kind === 'bebek') e.anims.timeScale = Math.abs(v) / base;
          if (e.kind === 'bebek' && Math.random() < dt * 0.15 && adx < 500) Audio2.play('kwek');
          break;
        }
        case 'cat': {
          if (e.state === 'sleep') e.setScale(0.42, 0.42 * (0.7 + Math.sin(e.t * 2) * 0.03));
          if (e.state === 'sleep' && adx < 170) { e.state = 'wake'; e.setScale(0.42); Audio2.play('meong'); if (e.zz) e.zz.destroy(); e.t = 0; e.body.setVelocityY(-160); }
          if (e.state === 'wake' && e.t > 0.6) e.state = 'run';
          if (e.state === 'sit') { e.body.setVelocityX(0); e.setFlipX(dx > 0); if (e.t > 2) { const liSeg = this.segs.find((g) => li.x >= g[0] && li.x <= g[1]); if (liSeg === e.seg && adx < 260) e.state = 'run'; } }
          if (e.state === 'run') {
            if (e.t % 1.2 < dt) e.dir = Math.sign(dx) || 1;
            const liSeg = this.segs.find((g) => li.x >= g[0] && li.x <= g[1]);
            if (liSeg !== e.seg && adx > 120) { e.state = 'sit'; e.t = 0; e.body.setVelocityX(0); e.setScale(0.42); break; }
            e.body.setVelocityX(e.dir * 135); e.setFlipX(e.dir > 0); e.setScale(0.42, 0.42 * (1 + Math.abs(Math.sin(e.t * 14)) * 0.06));
          }
          break;
        }
        case 'monyet': {
          e.setFlipX(dx < 0);
          if (adx < 430 && e.t > 2.6) {
            e.t = 0; e.anims.stop(); e.setFrame(2); Audio2.play('monyet'); this.time.delayedCall(200, () => Audio2.play('swish'));
            this.time.delayedCall(260, () => { if (!e.active || e.dead) return; this.throwFruit(e); e.setFrame(0); this.time.delayedCall(400, () => e.active && !e.dead && e.play('monyet_idle')); });
          }
          break;
        }
        case 'ular': case 'ularbatu': {
          e.setFlipX(dx < 0);
          if (adx < 95 && e.state !== 'strike') { e.state = 'strike'; Audio2.play('desis'); e.anims.stop(); e.setFrame(e.kind === 'ular' ? 2 : 1); this.time.delayedCall(700, () => { if (e.active) { e.state = 'idle'; e.play(e.kind + '_idle'); } }); }
          e.body.setVelocityX(0);
          break;
        }
        case 'slime': {
          if (e.body.blocked.down) { e.body.setVelocityX(0); if (e.t > 1.3) { e.t = 0; const d = adx < 260 ? Math.sign(dx) : (e.x < e.min ? 1 : e.x > e.max ? -1 : (Math.random() < 0.5 ? -1 : 1)); e.body.setVelocity(d * 70, -230); } }
          break;
        }
        case 'bat': {
          if (e.state !== 'swoop' && adx < 210 && li.y > e.y) { e.state = 'swoop'; Audio2.play('kepak'); e.tx = li.x; e.ty = li.y - 40; e.t = 0; }
          if (e.state === 'swoop') {
            const k = Math.min(1, e.t / 0.9); e.x += (e.tx - e.x) * dt * 2.5; e.y = e.y0 + Math.sin(k * Math.PI) * (e.ty - e.y0);
            if (k >= 1) { e.state = 'idle'; e.t = 0; e.x0 = e.x; }
          } else { e.x = e.x0 + Math.sin(e.t * 1.3) * 60; e.y = e.y0 + Math.sin(e.t * 2.6) * 14; }
          e.body.reset(e.x, e.y); e.setFlipX(dx < 0);
          break;
        }
        case 'ikan': {
          if (e.state === 'hide') {
            if (adx < 150 && e.t > 1.8 && !this.seated && !this.hasGround(e.x0 - Math.sign(dx) * 30)) {
              e.state = 'jump'; e.t = 0; e.setVisible(true); e.body.enable = true; e.body.setAllowGravity(true);
              e.body.reset(e.x0 - Math.sign(dx) * 30, this.waterY + 8); e.body.setVelocity(Math.sign(dx) * 70, -600);
              this.splash(e.x, this.waterY, 7); Audio2.play('ikan');
            }
          } else {
            e.rotation = Math.atan2(e.body.velocity.y, Math.abs(e.body.velocity.x) + 0.01) * (e.body.velocity.x < 0 ? -1 : 1) * 0.7;
            e.setFlipX(e.body.velocity.x > 0);
            if (e.y > this.waterY + 26 && e.body.velocity.y > 0) { this.splash(e.x, this.waterY, 5); Audio2.play('gelembung'); e.state = 'hide'; e.t = 0; e.setVisible(false); e.body.enable = false; e.body.setAllowGravity(false); }
          }
          break;
        }
        case 'elang': {
          if (e.state === 'idle' || e.state === 'cruise') {
            e.state = 'cruise';
            const near = Math.abs(li.x - e.x0) < 650, tx = (near ? li.x : e.x0) + 170 * Math.sin(e.t * 0.5 + e.x0), ty = 95 + Math.sin(e.t * 1.7) * 18;
            e.x += (tx - e.x) * dt * 1.2; e.y += (ty - e.y) * dt * 2; e.setFlipX(tx < e.x);
            if (e.t > 4.5 && adx < 320 && near) { e.state = 'warn'; e.t = 0; Audio2.play('elang'); this.tweens.add({ targets: e, alpha: 0.5, duration: 90, yoyo: true, repeat: 3 }); }
          } else if (e.state === 'warn') {
            e.y -= 30 * dt;
            if (e.t > 0.6) { e.state = 'dive'; e.t = 0; e.anims.stop(); e.setFrame(2); const a = Math.atan2(li.y - 40 - e.y, li.x - e.x); e.vx = Math.cos(a) * 360; e.vy = Math.sin(a) * 360; e.setFlipX(e.vx < 0); }
          } else if (e.state === 'dive') {
            e.x += e.vx * dt; e.y += e.vy * dt;
            if (e.t > 1.1 || e.y > GY - 20) { e.state = 'climb'; e.t = 0; e.play('elang_fly'); }
          } else if (e.state === 'climb') {
            e.y -= 200 * dt; e.x += Math.sign(e.vx) * 150 * dt;
            if (e.y < 100) { e.state = 'cruise'; e.t = 0; }
          }
          e.body.reset(e.x, e.y);
          break;
        }
        case 'lintah': {
          e.x += Math.sin(e.t * 0.8) * 14 * dt; e.body.reset(e.x, e.y); e.setFlipX(Math.cos(e.t * 0.8) < 0);
          break;
        }
        case 'kerbau': {
          if (e.x < e.min) e.dir = 1; if (e.x > e.max) e.dir = -1;
          e.body.setVelocityX(e.dir * 26); e.setFlipX(e.dir < 0);
          if (Math.random() < dt * 0.06 && adx < 500) Audio2.play('kerbau');
          if (Math.random() < dt * 1.5) this.mudSplash(e.x + (Math.random() - 0.5) * 50, GY + 8);
          break;
        }
      }
      // tepi jurang: pengejar tergelincir & jatuh, yang lain berbalik
      if (['copet', 'rat', 'biawak', 'bebek', 'cat'].includes(e.kind) && e.body.blocked.down && Math.abs(e.body.velocity.x) > 5) {
        const d = Math.sign(e.body.velocity.x), ahead = e.x + d * e.displayWidth * 0.32;
        if (!this.hasGround(ahead)) {
          const chasing = (e.kind === 'copet' && e.chaseT > 0 && Math.abs(e.body.velocity.x) > 100) || (e.kind === 'cat' && e.state === 'run');
          if (chasing) { e.slip = 0.55; e.slipDir = d; e.x = e.x + d * 4; Audio2.play('tergelincir'); this.popText(e.x, e.y - e.displayHeight - 6, '!', '#ffe08a'); }
          else { e.dir = -d; e.body.setVelocityX(-e.body.velocity.x); e.x -= d * 3; }
        }
      }
      if (e.y > 640 && e.kind !== 'ikan') e.destroy();
    };
    this.enemies.getChildren().slice().forEach(each);
    this.movers.getChildren().slice().forEach((m) => { if (m.kind) each(m); });
    // batu menggelinding
    (this.boulders || []).forEach((b) => {
      if (!b.active) return;
      b.body.setVelocityX(-165); b.rotation -= 4.2 * dt;
      if (b.body.blocked.down && Math.random() < dt * 4) this.puff(b.x + 10, b.y + 10, 1);
      if (b.x < b.endX || b.y > 640) { this.puff(b.x, b.y, 6); b.destroy(); }
      else if (!this.p.invul && Phaser.Math.Distance.Between(b.x, b.y, li.x, li.y - 35) < 34) this.hurt(b.x);
    });
  }

  hasGround(x) {
    return this.segs.some((s) => x >= s[0] && x <= s[1]) || (this.L.mud || []).some((m) => x >= m[0] && x <= m[1]);
  }
  waterAt(x) {
    if (this.waterY) return this.waterY;
    if (this.L.gaps === 'got' && !this.hasGround(x)) return 516;
    return null;
  }
  // musuh tergelincir di tepi lalu jatuh berputar; kalau ke air ada percikan
  enemyFall(e, dt) {
    // fisika dimatikan; gerak jatuh dihitung manual supaya rapi saat berputar
    if (e.body.enable) { e.body.enable = false; e.bx = e.x; e.fvx = 0; e.fvy = 0; }
    if (e.slip > 0) {
      e.slip -= dt; e.angle = Math.sin(e.slip * 40) * 14; e.x = e.bx + Math.sin(e.slip * 30) * 2;
      if (e.slip <= 0) { e.state = 'fall'; e.dead = true; e.fvx = e.slipDir * 80; e.fvy = -200; Audio2.play('jatuh'); }
      return;
    }
    const wl = this.waterAt(e.x);
    if (e.splashed) { e.y += 30 * dt; return; }
    e.fvy += 1400 * dt; e.x += e.fvx * dt; e.y += e.fvy * dt;
    e.angle += e.slipDir * 380 * dt;
    if (wl && e.y - e.displayHeight * 0.3 > wl) {
      e.splashed = true; this.splash(e.x, wl, 16); Audio2.play('splash');
      this.tweens.add({ targets: e, alpha: 0, duration: 900, onComplete: () => e.destroy() });
      for (let i = 0; i < 5; i++) this.time.delayedCall(200 + i * 150, () => Audio2.play('gelembung'));
    }
    if (e.y > 680) { if (!wl) Audio2.play('batu'); e.destroy(); }
  }

  throwFruit(e) {
    const s = this.shots.create(e.x, e.y - 30, 'buah').setScale(0.45).setDepth(8);
    const tx = this.li.x, t = 0.9;
    s.body.setVelocity((tx - e.x) / t, -380); s.body.setAngularVelocity(400);
    s.body.setCircle(9, 4, 4);
  }

  touchEnemy(e) {
    if (e.dead || this.p.invul > 0 || this.cut) return;
    const li = this.li;
    if (e.stompable && li.body.velocity.y > 30 && li.body.bottom < e.body.top + 18) {
      e.dead = true; Audio2.play('stomp');
      li.body.setVelocityY(this.keyJumpHeld() ? -520 : -360);
      this.puff(e.x, e.y - 10, 7);
      e.body.enable = false; if (e.zz) e.zz.destroy();
      this.tweens.add({ targets: e, scaleY: e.scaleY * 0.2, scaleX: e.scaleX * 1.3, alpha: 0, y: e.y + 4, duration: 260, onComplete: () => e.destroy() });
      this.popText(e.x, e.y - 50, '✦', '#fff3b0');
      return;
    }
    if (!e.hurts) return;
    if (!e.stompable && li.body.velocity.y > 30 && li.body.bottom < e.body.top + 18) { li.body.setVelocityY(-380); this.popText(e.x, e.y - 50, 'Aduh! Tak bisa diinjak!', '#ffb3b3'); }
    this.hurt(e.x);
    if (e.kind === 'lintah') { RUN.bekal = Math.max(0, RUN.bekal - 10); this.popText(li.x, li.y - 90, 'Lintah! -10 bekal', '#ffb3b3'); }
  }

  // ===================================================== KHUSUS LEVEL
  buildSpecial() {
    const L = this.L;
    // rakit sungai
    if (L.raft && !this.isSecret) {
      const r = L.raft;
      this.raft = this.movers.create(r.x, this.waterY - 4, 'plank').setOrigin(0.5, 0.45).setScale(0.85).setDepth(8);
      this.raft.isRaft = true; this.raft.body.setSize(130, 22).setOffset(7, 10); this.raft.body.friction.x = 1;
      this.raftState = 'wait'; this.swimZone = [r.x - 60, 2780];
      T(this, r.x, this.waterY - 72, 'Naik rakit', 12, '#fff3d6').setOrigin(0.5).setDepth(12);
    }
    // batu longsor
    this.boulders = [];
    (L.boulder || []).forEach(([sx, ex, tx]) => {
      const gy = this.groundAt(sx);
      // lereng tebing berbatu di belakang tempat batu jatuh
      this.add.image(sx + 40, gy + 4, 'rocks_bush').setOrigin(0.5, 1).setScale(0.55).setDepth(-3);
      this.add.image(sx + 10, gy + 4, 'rock').setOrigin(0.5, 1).setScale(0.6).setDepth(8);
      T(this, sx - 40, gy - 110, '⚠ Rawan longsor', 12, '#ffd8a8').setOrigin(0.5).setDepth(-3);
      this.time.addEvent({ delay: 3600, loop: true, callback: () => {
        if (this.paused || this.li.x < ex - 120 || this.li.x > sx + 320) return;
        // kerikil berjatuhan & gemuruh sebagai tanda
        Audio2.play('gemuruh'); this.cam.shake(500, 0.0015);
        for (let k = 0; k < 6; k++) this.time.delayedCall(k * 90, () => {
          const pb = this.add.image(sx + 20 + Math.random() * 40, gy - 120, 'debu').setTint(0x8a80b0).setDepth(7).setScale(0.7);
          this.tweens.add({ targets: pb, y: gy - 4, x: pb.x - 20, duration: 500, ease: 'Quad.in', onComplete: () => pb.destroy() });
        });
        this.time.delayedCall(800, () => this.dropBoulder(sx, ex, gy));
      } });
    });
  }
  dropBoulder(sx, ex, gy) {
    {
      {
        if (this.ended) return;
        const b = this.physics.add.image(sx + 30, gy - 40, 'batu').setScale(0.55).setDepth(7.5).setAlpha(0);
        this.tweens.add({ targets: b, alpha: 1, duration: 150 });
        b.body.setCircle(38, 6, 6); b.body.setBounce(0.25); b.endX = ex;
        this.physics.add.collider(b, this.solids);
        this.boulders.push(b); Audio2.play('batu'); this.puff(sx, gy - 20, 5);
        this.cam.shake(150, 0.002);
      }
    }
  }
  buildSpecial2() {
    const L = this.L;
    // kabut pegunungan
    if (L.fog) {
      this.fogs = [];
      [[300, 0.35, -40, 0.12], [380, 0.5, 30, 0.2], [440, 0.7, 32, 0.28]].forEach(([y, a, d, sp]) => {
        const f = new Tiler(this, 0, y - 160, 960, 'fog', 2, d, 0).setAlpha(0);
        f.base = a; f.sp = sp; this.fogs.push(f);
      });
    }
    // kunang-kunang & daun gugur
    if (L.fireflies || L.dark) this.flies = new Drifters(this, { n: L.dark ? 12 : 26, keys: ['p_soft'], glow: true, scale: 0.28, depth: 54, sf: 1, area: null });
    if (['hutan', 'semak', 'sungai', 'gunung'].includes(L.bg)) this.leaves = new Drifters(this, { n: L.bg === 'gunung' ? 8 : 16, keys: L.bg === 'gunung' ? ['daun_oranye', 'daun_kuning'] : ['daun_hijau', 'daun_kuning', 'daun_oranye'], depth: 20, wind: 16, fall: 32, scale: 0.7 });
    if (L.bg === 'kota') this.leaves = new Drifters(this, { n: 7, keys: ['daun_hijau', 'kelopak'], depth: 20, wind: 20, fall: 26, scale: 0.7 });
    if (L.bg === 'gua') this.leaves = new Drifters(this, { n: 18, keys: ['p_soft'], depth: 20, wind: 4, fall: 6, scale: 0.18, alpha: 0.35 });
    // pikiran Li (kampung)
    this.thoughts = (L.thoughts || []).map((t) => ({ x: t[0], s: t[1], done: false }));
  }

  // ===================================================== CAHAYA & GELAP
  buildLighting() {
    this.dark = this.add.renderTexture(0, 0, 960, 540).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.brush = this.make.image({ x: 0, y: 0, key: 'lt_round', add: false });
    this.tint = this.add.rectangle(0, 0, 960, 540, 0xffffff).setOrigin(0, 0).setScrollFactor(0).setDepth(49).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.torchGlow = this.add.image(0, 0, 'glow_cone').setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setVisible(false);
    this.lights.forEach((l) => { l.g = this.add.image(l.x, l.y, 'glow').setScale(l.r / 70).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0); });
  }

  updateTime(dt) {
    const L = this.L;
    if (!this.isSecret) {
      const p = Phaser.Math.Clamp(this.maxX / this.len, 0, 1);
      const target = this.main.time[0] + (this.main.time[1] - this.main.time[0]) * p;
      this.minute = Math.max(this.minute + dt * 0.25, Math.min(target, this.minute + dt * 6)); // waktu bergeser pelan & terus berjalan
      this.minute = Math.min(this.minute, this.main.time[1] + 15);
      RUN.minute = this.minute;
    }
    const ts = this.ts = timeState(this.minute);
    let dark = L.dark ? (L.darkness || 0.9) : ts.dark;
    this.darkness = dark;
    this.tint.fillColor = L.dark ? 0xb8b0e0 : ts.tint;
    if (L.bg === 'kampung') this.tint.fillColor = 0x8a86c8;
    // langit
    if (!this.skyHidden) {
      const key = ts.top + '_' + ts.bot;
      if (key !== this.lastSkyKey) { this.lastSkyKey = key; this.sky.clear(); this.sky.fillGradientStyle(ts.top, ts.top, ts.bot, ts.bot, 1); this.sky.fillRect(0, 0, 960, 540); }
      const day = Phaser.Math.Clamp((this.minute - 330) / (1110 - 330), 0, 1);
      const sx = 80 + day * 800, sy = 360 - Math.sin(day * Math.PI) * 300;
      this.sun.setPosition(sx, sy).setAlpha(1 - ts.night); this.sunCore.setPosition(sx, sy).setAlpha(1 - ts.night).setFillStyle(this.minute > 1000 ? 0xffc48a : 0xfff6d8);
      const mk = Phaser.Math.Clamp((this.minute - 1080) / 300, 0, 1);
      this.moon.setPosition(120 + mk * 600, 120 - Math.sin(mk * Math.PI) * 50).setAlpha(ts.night); this.moonGlow.setPosition(this.moon.x, this.moon.y).setAlpha(ts.night * 0.45);
      this.stars.forEach((s) => s.setAlpha(ts.night * 0.8 * (0.35 + 0.65 * Math.abs(Math.sin(this.elapsed * 1.3 + s.tw)))));
    } else { this.sky.clear(); this.sun.setAlpha(0); this.sunCore.setAlpha(0); this.moon.setAlpha(0); this.moonGlow.setAlpha(0); this.stars.forEach((s) => s.setAlpha(0)); }
    if (this.flies) this.flies.setAlpha(L.dark ? 1 : Phaser.Math.Clamp(ts.night * 1.3, 0, 1));
  }

  drawLight() {
    const d = this.darkness, cx = this.cam.scrollX, li = this.li;
    this.lights.forEach((l) => { l.g.setAlpha(Math.min(0.75, d * 0.9) * (l.cp && !this.cpUsed ? 0.6 : 1) * (0.9 + Math.random() * 0.1)); });
    if (this.cpLamp) this.cpLamp.setAlpha(this.cpUsed ? Math.max(0.25, d) : 0);
    const torch = this.torchOn && RUN.battery > 0 && !this.swim && !this.seated && this.li.visible;
    if (d < 0.03) {
      // siang: senter tetap bisa dinyalakan, sinarnya samar
      this.dark.setVisible(false);
      if (torch) { const h = this.hand, rot = this.p.face > 0 ? this.torchTilt : Math.PI - this.torchTilt; this.torchGlow.setVisible(true).setPosition(h.x, h.y).setRotation(rot).setScale(0.9, 0.8).setAlpha(0.2); }
      else this.torchGlow.setVisible(false);
      return;
    }
    this.dark.setVisible(true);
    this.dark.clear(); this.dark.fill(0x060414, d);
    const E = (key, x, y, sx, sy, rot, a, ox) => { this.brush.setTexture(key).setOrigin(ox === undefined ? 0.5 : ox, 0.5).setPosition(x, y).setScale(sx, sy).setRotation(rot || 0).setAlpha(a); this.dark.erase(this.brush); };
    // pandangan sempit di sekitar Li
    E('lt_round', li.x - cx, li.y - 40, 0.62, 0.62, 0, 0.8);
    this.lights.forEach((l) => { if (l.x - cx > -200 && l.x - cx < 1160) E('lt_round', l.x - cx, l.y, l.r / 110, l.r / 110, 0, 0.9); });
    (this.items || []).forEach((it) => { if (!it.got && it.x - cx > -40 && it.x - cx < 1000) E('lt_round', it.x - cx, it.im.y, 0.12, 0.12, 0, 0.5); });
    if (torch) {
      const h = this.hand, flick = RUN.battery < 15 ? (Math.random() < 0.15 ? 0.35 : 1) : 1;
      const rot = this.p.face > 0 ? this.torchTilt : Math.PI - this.torchTilt;
      E('lt_cone', h.x - cx, h.y, 1.05, 0.95, rot, flick, 0);
      E('lt_round', h.x - cx, h.y, 0.35, 0.35, 0, flick);
      this.torchGlow.setVisible(true).setPosition(h.x, h.y).setRotation(rot).setScale(1.05, 0.95).setAlpha(Math.max(0.2 * (1 - d), 0.16 * Math.min(1, d * 1.5)) * flick);
    } else this.torchGlow.setVisible(false);
  }

  // ===================================================== HUD
  buildHud() {
    const D = 100, sf = (o) => o.setScrollFactor(0).setDepth(D);
    const g = sf(this.add.graphics());
    const box = (x, y, w, h) => { g.fillStyle(0x16122c, 0.4); g.fillRoundedRect(x + 2, y + 4, w, h, 12); g.fillStyle(0x2f2858, 0.86); g.fillRoundedRect(x, y, w, h, 12); g.lineStyle(2, 0xd6ccff, 0.9); g.strokeRoundedRect(x, y, w, h, 12); };
    box(10, 8, 262, 56); box(650, 8, 258, 64);
    this.hName = sf(T(this, 22, 15, (this.isSecret ? this.L.name : (this.lv + 1) + '. ' + this.main.name), 15, '#ffe7a6')).setDepth(D + 1);
    this.hSun = sf(this.add.image(30, 46, 'glow').setScale(0.22)).setDepth(D + 1);
    this.hClock = sf(T(this, 44, 37, '', 14, '#fff8ec')).setDepth(D + 1);
    this.hearts = [];
    for (let i = 0; i < 4; i++) this.hearts.push(sf(this.add.image(160 + i * 26, 46, 'hati').setScale(0.24)).setDepth(D + 1));
    sf(this.add.image(668, 25, 'nasi').setScale(0.16)).setDepth(D + 1);
    sf(this.add.image(668, 55, 'baterai').setScale(0.42)).setDepth(D + 1);
    sf(T(this, 684, 17, 'Bekal', 11, '#d6ccff', { strokeThickness: 0 })).setDepth(D + 1);
    sf(T(this, 684, 47, 'Senter', 11, '#d6ccff', { strokeThickness: 0 })).setDepth(D + 1);
    sf(T(this, 818, 17, 'Tenaga', 11, '#d6ccff', { strokeThickness: 0 })).setDepth(D + 1);
    this.bars = sf(this.add.graphics()).setDepth(D + 1);
    // tombol jeda
    const pb = new PButton(this, 928, 26, 40, 34, 'II', () => this.pause(), { size: 15, depth: D + 2 });
    this.toastT = sf(T(this, 480, 96, '', 16, '#fff8ec', { backgroundColor: '#2f2858cc', padding: { x: 12, y: 6 } })).setOrigin(0.5).setDepth(D + 3).setAlpha(0);
    this.prompt = this.add.container(0, 0).setDepth(60).setVisible(false);
    this.promptG = this.add.graphics(); this.promptT = T(this, 0, 0, '', 12, '#2c2442', { strokeThickness: 0 }).setOrigin(0.5);
    this.prompt.add([this.promptG, this.promptT]);
  }

  updateHud() {
    const m = this.minute;
    this.hClock.setText(clockText(m) + '  ' + timeLabel(m));
    this.hSun.setTexture(this.ts.night > 0.5 ? 'bulan' : 'glow').setScale(this.ts.night > 0.5 ? 0.38 : 0.24);
    this.hearts.forEach((h, i) => { h.setVisible(i < RUN.maxHearts); h.setTint(i < RUN.hearts ? 0xffffff : 0x3a3458).setAlpha(i < RUN.hearts ? 1 : 0.7); });
    const b = this.bars; b.clear();
    const bar = (x, y, w, v, c) => { b.fillStyle(0x16122c, 1); b.fillRoundedRect(x, y, w, 9, 4); b.fillStyle(c, 1); b.fillRoundedRect(x + 1, y + 1, Math.max(0, (w - 2) * v), 7, 3); b.fillStyle(0xffffff, 0.25); b.fillRect(x + 3, y + 2, Math.max(0, (w - 6) * v), 2); };
    const bk = RUN.bekal / 100;
    bar(684, 33, 122, bk, bk < 0.2 ? (this.elapsed % 0.6 < 0.3 ? 0xff6b6b : 0xb04848) : 0x8fd46a);
    bar(684, 62 - 0, 122, RUN.battery / 100, RUN.battery < 15 ? 0xff9b5a : 0xffe08a);
    const tn = 1 - this.p.fatigue / 100;
    bar(818, 33, 78, tn, tn < 0.25 ? 0xff9b5a : 0x7ac8ff);
    b.fillStyle(this.torchOn ? 0xffe08a : 0x6a6290, 1); b.fillCircle(830, 62, 5);
    if (!this.hintT) this.hintT = T(this, 840, 55, IS_TOUCH ? '' : 'F', 11, '#d6ccff', { strokeThickness: 0 }).setScrollFactor(0).setDepth(101);
  }

  toast(s, dur) {
    const t = this.toastT; t.setText(s); this.tweens.killTweensOf(t);
    t.setAlpha(0).setY(104);
    this.tweens.add({ targets: t, alpha: 1, y: 96, duration: 250 });
    this.tweens.add({ targets: t, alpha: 0, delay: dur || 2200, duration: 400 });
  }
  popText(x, y, s, col) {
    const t = T(this, x, y, s, 13, col || '#ffffff').setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1100, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }
  think(s) {
    if (this.thinkT && this.thinkT.active) { const o = this.thinkT; this.tweens.killTweensOf(o); this.tweens.add({ targets: o, alpha: 0, duration: 150, onComplete: () => o.destroy() }); }
    const t = T(this, this.li.x, this.li.y - 108, s, 13, '#2c2442', { strokeThickness: 0, backgroundColor: '#fff8ecee', padding: { x: 9, y: 5 }, align: 'center', wordWrap: { width: 230 } }).setOrigin(0.5, 1).setDepth(60);
    this.thinkT = t; t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300 });
    this.time.delayedCall(3200, () => this.tweens.add({ targets: t, alpha: 0, duration: 400, onComplete: () => { t.destroy(); if (this.thinkT === t) this.thinkT = null; } }));
  }

  tutorial() {
    const lines = IS_TOUCH ? ['Geser joystick kiri untuk berjalan', 'Tombol LONCAT untuk melompat · tahan untuk lebih tinggi', 'Ke bawah = nunduk · tombol AKSI muncul di dekat sesuatu']
      : ['A/D atau ←/→ jalan · tahan Shift untuk lari', 'Spasi loncat (tahan = lebih tinggi) · S/↓ nunduk', 'E interaksi · F nyalakan/matikan senter · Esc jeda'];
    lines.forEach((s, i) => this.time.delayedCall(4200 + i * 3200, () => this.toast(s, 2900)));
    Save.flag('tut', true);
  }

  // ===================================================== INPUT
  buildInput() {
    const K = this.input.keyboard;
    this.k = K.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S', space: 'SPACE', shift: 'SHIFT', e: 'E', f: 'F', esc: 'ESC', p: 'P', enter: 'ENTER' });
    K.on('keydown-ESC', () => this.pause()); K.on('keydown-P', () => this.pause());
    // tangkap tombol loncat langsung dari event (tidak menunggu frame berikutnya)
    ['SPACE', 'W', 'UP'].forEach((k) => K.on('keydown-' + k, (ev) => { if (!ev.repeat) this.jumpQueued = true; }));
    this.touch = new TouchPad(this);
  }
  keyJumpHeld() { const k = this.k; return k.space.isDown || k.w.isDown || k.up.isDown || (this.touch && this.touch.jump); }

  // ===================================================== LOOP
  update(t, dms) {
    if (this.paused) return;
    const dt = Math.min(0.05, dms / 1000);
    this.elapsed += dt;
    Audio2.paused = false;
    const li = this.li, p = this.p, k = this.k, tp = this.touch;
    const JD = Phaser.Input.Keyboard.JustDown;
    const tc = tp.enabled ? tp.consume() : {};
    let left = k.left.isDown || k.a.isDown || (tp.dx < -0.3), right = k.right.isDown || k.d.isDown || (tp.dx > 0.3);
    let down = k.down.isDown || k.s.isDown || (tp.dy > 0.6);
    let run = k.shift.isDown || Math.abs(tp.dx) > 0.93;
    let jumpPressed = JD(k.space) || JD(k.w) || JD(k.up) || tc.jumpPressed;
    const jumpHeld = this.keyJumpHeld();
    const action = JD(k.e) || JD(k.enter) || tc.action;
    if (JD(k.f) || tc.torch) this.toggleTorch();
    if (this.cut || this.ended) { left = right = down = run = jumpPressed = false; }
    if (this.L.calm) run = false;

    if (this.seated) this.updateSeated(dt);
    else if (this.swim) this.updateSwim(dt, left, right, jumpPressed);
    else this.updatePlayer(dt, left, right, down, run, jumpPressed, jumpHeld);
    if (this.cut && this.autoWalk) { li.body.setVelocityX(this.autoWalk); if (li.anims.currentAnim?.key !== (this.autoRun ? 'li_run' : 'li_walk')) li.play(this.autoRun ? 'li_run' : 'li_walk'); li.setFlipX(false); }

    this.maxX = Math.max(this.maxX, li.x);
    this.updateEnemies(dt);
    this.updateItems(dt);
    this.updateInteract(action);
    this.updateRaft(dt);
    this.updateNeeds(dt);
    this.updateTime(dt);
    this.updateCamera(dt);
    this.updateHand();
    this.drawLight();
    this.updateHud();
    this.updateAmbient(dt);
    if (tp.enabled) { tp.setTorch(RUN.battery > 0 && !this.swim); tp.draw(); }
    this.checkProgress();
  }

  updatePlayer(dt, left, right, down, run, jumpPressed, jumpHeld) {
    const li = this.li, p = this.p, b = li.body, onG = b.blocked.down || b.touching.down;
    p.invul = Math.max(0, p.invul - dt);
    li.setAlpha(p.invul > 0 && Math.floor(p.invul * 14) % 2 ? 0.45 : 1);
    p.dropT = Math.max(0, p.dropT - dt);
    const inMud = onG && this.standSeg && this.standSeg.mud && li.y > GY + 4;
    // terduduk lelah
    if (p.sitT > 0) {
      p.sitT -= dt; b.setVelocityX(b.velocity.x * 0.8);
      if (li.anims.currentAnim?.key !== 'li_sitdown') li.play('li_sitdown');
      if (p.sitT <= 0) { this.think(RUN.bekal < 5 ? 'Perut lapar... harus cari bekal.' : 'Ayo, Li. Sedikit lagi.'); }
      return;
    }
    const weak = RUN.bekal < 20 ? 0.75 : 1;
    let max = (run && onG && !p.crouch ? 245 : 150) * weak * (inMud ? 0.45 : 1) * (this.L.calm ? 0.68 : 1);
    // nunduk (tetap nunduk bila ada batang di atas kepala)
    const lowAbove = (this.lows || []).some((z) => Math.abs(z.x - li.x) < 70 && li.y > z.y);
    const wantCrouch = (down && onG) || (p.crouch && lowAbove && onG);
    if (wantCrouch !== p.crouch) { p.crouch = wantCrouch; if (p.crouch) b.setSize(50, 108).setOffset(41, 92); else b.setSize(50, 168).setOffset(41, 32); }
    if (p.crouch) max *= 0.42;
    let dir = (right ? 1 : 0) - (left ? 1 : 0);
    // putar balik
    if (dir && dir !== p.face) {
      if (onG && !p.crouch && Math.abs(b.velocity.x) < 120) { p.turnT = 0.11; }
      p.face = dir;
    }
    const target = dir * max;
    const acc = onG ? (dir ? 1400 : 1700) : 900;
    let vx = b.velocity.x;
    if (vx < target) vx = Math.min(target, vx + acc * dt); else if (vx > target) vx = Math.max(target, vx - acc * dt);
    // berhenti mendadak setelah lari
    if (onG && !dir && Math.abs(b.velocity.x) > 205 && p.stopT <= 0) { p.stopT = 0.26; this.puff(li.x + p.face * 14, li.y, 3); Audio2.play('step', 'stone'); }
    b.setVelocityX(vx);
    // loncat: coyote time + buffer + tinggi bergantung lamanya tombol ditahan
    p.coyote = onG ? 0.1 : p.coyote - dt; p.buffer = (jumpPressed || this.jumpQueued) ? 0.15 : p.buffer - dt; this.jumpQueued = false;
    if (p.buffer > 0 && p.coyote > 0 && !p.crouch) {
      b.setVelocityY(-640 * weak * (inMud ? 0.72 : 1)); b.y -= 1; p.buffer = 0; p.coyote = 0; p.jumpT = 0.12; Audio2.play('jump'); this.puff(li.x, li.y, 3);
      if (inMud) this.mudSplash(li.x, li.y);
    }
    p.jumpT = Math.max(0, (p.jumpT || 0) - dt);
    if (!jumpHeld && p.jumpT <= 0 && b.velocity.y < -300) b.setVelocityY(-300);
    b.setGravityY(b.velocity.y > 0 ? 700 : (jumpHeld ? 0 : 300)); // jatuh lebih cepat = terasa tajam
    // mendarat
    if (onG && p.wasAir && p.lastVY > 250) { p.landT = 0.09; Audio2.play('land'); this.puff(li.x, li.y, p.lastVY > 600 ? 6 : 3); }
    p.wasAir = !onG; p.lastVY = b.velocity.y;
    // langkah kaki
    if (onG && Math.abs(vx) > 20) {
      p.stepD += Math.abs(vx) * dt;
      if (p.stepD > (run ? 40 : 30)) { p.stepD = 0; Audio2.play('step', this.surface(inMud)); if (inMud) this.mudSplash(li.x, li.y); }
    }
    // animasi
    p.turnT -= dt; p.stopT -= dt; p.landT -= dt;
    li.setFlipX(p.face < 0);
    let anim = null, frame = null;
    if (!onG) frame = b.velocity.y < 0 ? 11 : 12;
    else if (p.crouch) { if (Math.abs(vx) > 15) anim = 'li_crouchwalk'; else frame = 15; }
    else if (p.landT > 0) frame = 10;
    else if (p.turnT > 0) frame = 18;
    else if (p.stopT > 0) frame = 25;
    else if (Math.abs(vx) > 195) anim = 'li_run';
    else if (Math.abs(vx) > 12) anim = 'li_walk';
    else anim = 'li_idle';
    if (anim) { if (li.anims.currentAnim?.key !== anim || !li.anims.isPlaying) li.play(anim, true); li.anims.timeScale = anim === 'li_walk' ? Math.max(0.5, Math.abs(vx) / 150) : 1; }
    else { li.anims.stop(); li.setFrame(frame); }
    // bayangan
    const gy = this.groundBelow(li.x, li.y - 4);
    this.liShadow.setPosition(li.x, gy + 1).setAlpha(Math.max(0, 0.7 - (gy - li.y) / 160)).setScale(0.7 - Math.min(0.3, (gy - li.y) / 400), 0.8);
    // air / jurang
    if (this.waterY && li.y > this.waterY + 6 && !this.swim) {
      if (this.swimZone && li.x > this.swimZone[0] && li.x < this.swimZone[1]) this.startSwim();
      else { this.splash(li.x, this.waterY, 10); Audio2.play('splash'); this.toast('Li terseret arus!'); this.hurt(null, true); }
    }
    if (li.y > 620) { this.hurt(null, true); }
  }

  surface(mud) {
    if (mud) return 'mud';
    if (this.onRaft) return 'wood';
    const g = this.L.ground; return g === 'forest' || g === 'bank' || g === 'pematang' || g === 'mount' ? 'grass' : 'stone';
  }

  // ---------- berenang ----------
  startSwim() {
    this.swim = true; const li = this.li;
    li.body.setAllowGravity(false); li.body.setVelocity(li.body.velocity.x * 0.4, 0); li.setAngle(0);
    this.splash(li.x, this.waterY, 14); Audio2.play('splash');
    this.toast(IS_TOUCH ? 'Berenang! Tekan LONCAT untuk mengayuh' : 'Berenang! Tekan Spasi untuk mengayuh', 2600);
    this.strokeT = 0; this.ringT = 0;
    // badan di bawah garis air tertutup air (kedalaman di bawah lapisan permukaan)
    if (!this.swimSpr) this.swimSpr = this.add.sprite(li.x, this.waterY, 'li', 36).setScale(WS).setDepth(15.8);
    if (!this.treadSpr) {
      this.treadSpr = this.add.sprite(li.x, this.waterY, 'li', 5).setOrigin(0.5, 1).setScale(WS).setDepth(15.8);
      this.treadSpr.setCrop(0, 0, 140, 138);
      this.hands = [0, 1].map((i) => this.add.image(li.x, this.waterY, 'tangan').setScale(0.42).setDepth(16.5).setFlipX(i === 0));
    }
    this.swimSpr.setVisible(false).play('li_swim'); this.treadSpr.setVisible(true); this.hands.forEach((h) => h.setVisible(true)); li.setVisible(false);
    if (!this.wake) this.wake = this.add.image(0, 0, 'p_soft').setTint(0xe6f0ff).setDepth(17).setAlpha(0.5);
    this.wake.setVisible(true);
  }
  endSwim() {
    this.swim = false; const li = this.li;
    li.body.setAllowGravity(true); li.setVisible(true);
    [this.swimSpr, this.treadSpr, this.wake].forEach((o) => o && o.setVisible(false));
    (this.hands || []).forEach((h) => h.setVisible(false));
  }
  updateSwim(dt, left, right, jumpPressed) {
    const li = this.li, b = li.body, p = this.p, W = this.waterY;
    p.invul = Math.max(0, p.invul - dt);
    const blink = p.invul > 0 && Math.floor(p.invul * 14) % 2 ? 0.45 : 1;
    const dir = (right ? 1 : 0) - (left ? 1 : 0); if (dir) p.face = dir;
    this.strokeT = Math.max(0, this.strokeT - dt);
    if (jumpPressed && this.strokeT < 0.25) { this.strokeT = 0.55; Audio2.play('stroke'); this.splash(li.x - p.face * 16, W, 5); }
    const boost = this.strokeT > 0.2 ? 120 : 0;
    const moving = dir !== 0 || boost > 0;
    b.setVelocityX(dir * (96 + boost) + (dir === 0 && boost ? p.face * boost : 0) - (moving ? 24 : 14));
    const ty = W + 46 + Math.sin(this.elapsed * 3) * 3;
    b.setVelocityY((ty - li.y) * 5);
    const t = this.elapsed, bob = Math.sin(t * 3.2) * 1.6;
    // berenang: tubuh mendatar, kepala di depan, kaki mengayuh di bawah air
    this.swimSpr.setVisible(moving).setPosition(li.x, W - 3 + bob).setFlipX(p.face < 0).setAngle(p.face * 74 + Math.sin(t * 6) * 4).setAlpha(blink);
    this.swimSpr.anims.timeScale = boost ? 1.8 : 1.2;
    // diam: mengapung tegak, kepala di atas air, kedua tangan mengayuh di permukaan
    const tr = this.treadSpr; tr.setVisible(!moving).setPosition(li.x, W + 43 + bob).setFlipX(p.face < 0).setAlpha(blink);
    this.hands.forEach((h, i) => {
      const s = i ? 1 : -1, a = t * 4.2 + i * Math.PI;
      h.setVisible(!moving).setPosition(li.x + s * (15 + Math.cos(a) * 4) + p.face * 2, W - 2 + Math.sin(a) * 1.5 + bob * 0.5).setAngle(s * (8 + Math.sin(a) * 10)).setAlpha(blink);
    });
    this.ringT -= dt;
    if (this.ringT <= 0) {
      this.ringT = moving ? 0.35 : 0.9;
      const ring = this.add.ellipse(li.x - (moving ? p.face * 20 : 0), W + 2, moving ? 18 : 30, 4).setStrokeStyle(1.2, 0xe6f0ff, 0.8).setDepth(16.4);
      this.tweens.add({ targets: ring, scaleX: 2.6, scaleY: 1.8, alpha: 0, duration: 1100, onComplete: () => ring.destroy() });
    }
    this.wake.setVisible(moving).setPosition(li.x - p.face * 30, W + 2).setScale(1.4 + Math.sin(t * 8) * 0.2, 0.25);
    if (moving && Math.random() < dt * 8) this.splash(li.x - p.face * 26, W, 1);
    if (Math.random() < dt * 3) { const bub = this.add.image(li.x + (Math.random() - 0.5) * 20, W + 4, 'p_soft').setScale(0.25).setDepth(17).setAlpha(0.7); this.tweens.add({ targets: bub, y: bub.y - 8, alpha: 0, duration: 600, onComplete: () => bub.destroy() }); }
    this.liShadow.setAlpha(0);
    // sampai di tepi seberang
    const bank = this.segs.find((s) => s[0] > this.swimZone[0] && li.x > s[0] - 26 && li.x < s[1]);
    if (bank) {
      this.endSwim(); li.y = bank[2] - 2; b.reset(li.x + 10, bank[2] - 2); b.setVelocity(60, -200);
      this.splash(li.x, W, 8); Audio2.play('splash'); this.think('Hah... hah... akhirnya sampai.');
      this.swimZone = null;
      if (this.croc && this.croc.active) { this.croc.state = 'stop'; this.croc.t = 0; }
      Audio2.playMusic(this.L.music);
    }
  }

  // ---------- rakit: Li duduk mendayung ----------
  updateSeated(dt) {
    const li = this.li, r = this.raft, t = this.elapsed;
    if (!r) { this.seated = false; return; }
    li.body.setAllowGravity(false); li.body.setVelocity(0, 0);
    li.body.reset(r.x - 16, r.y - 8 + Math.sin(t * 2.2) * 1);
    li.anims.stop(); li.setFrame(26).setFlipX(false); this.p.face = 1;
    // dayung: masuk ke air di depan, ditarik ke belakang, lalu diangkat
    const ph = (t * 1.1) % 1, pull = ph < 0.6;
    const ang = pull ? 62 + (ph / 0.6) * 70 : 132 - ((ph - 0.6) / 0.4) * 70;
    const lift = pull ? 0 : Math.sin((ph - 0.6) / 0.4 * Math.PI) * 7;
    this.paddle.setVisible(true).setPosition(li.x + 14, li.y - 26 - lift).setAngle(ang);
    if (pull && !this.pullSplash && ph > 0.08) { this.pullSplash = true; this.splash(li.x + 30, this.waterY, 3); Audio2.play('stroke'); }
    if (!pull) this.pullSplash = false;
    if (pull && Math.random() < dt * 10) this.splash(li.x + 14 + Math.cos(Phaser.Math.DegToRad(ang)) * 40, this.waterY, 1);
    this.liShadow.setAlpha(0);
  }

  // ---------- rakit & buaya ----------
  updateRaft(dt) {
    const r = this.raft, li = this.li;
    if (r && this.raftState === 'wait' && this.onRaft) {
      this.raftState = 'go'; Audio2.play('duduk');
      this.paddle = this.paddle || this.add.image(0, 0, 'dayung').setOrigin(0.28, 0.5).setScale(0.42).setDepth(15.8);
      this.seated = true;
      this.think('Pelan-pelan saja... jangan sampai jatuh.');
      this.time.delayedCall(600, () => r.active && r.body.setVelocityX(66));
    }
    if (r && this.raftState === 'go') {
      if (Math.random() < dt * 3) this.splash(r.x - 56, this.waterY, 1);
      if (r.x > this.L.raft.crocX - 260 && !this.croc) this.crocAppear();
      if (r.x > this.L.raft.stop) r.body.setVelocityX(0);
    }
    this.onRaft = false;
    const c = this.croc;
    if (!c || !c.active) return;
    c.t += dt;
    const W = this.waterY;
    if (c.state === 'stalk' && r) {
      // mengintai dari belakang rakit, perlahan naik dari dalam air
      const k = Phaser.Math.Clamp((r.x - c.ax) / (this.L.raft.crocX - c.ax), 0, 1);
      c.x = r.x - 150 + k * 40; c.y = W + 60 - k * 36 + Math.sin(this.elapsed * 2) * 1.5;
      if (Math.random() < dt * 6) { const bub = this.add.image(c.x + 30 + Math.random() * 40, W + 2, 'p_soft').setScale(0.3).setDepth(17).setAlpha(0.8); this.tweens.add({ targets: bub, y: W - 6, alpha: 0, duration: 500, onComplete: () => bub.destroy() }); }
      if (k >= 1) this.crocFlip();
    } else if (c.state === 'chase') {
      const target = li.x - 50, sp = 72;
      let nx = c.x + Phaser.Math.Clamp(target - c.x, -sp * dt, sp * dt);
      if (!this.inWater(nx + 70) || !this.inWater(nx - 70)) nx = c.x;   // tidak pernah naik ke darat
      c.x = nx; c.y = W + 16 + Math.sin(this.elapsed * 3) * 2; c.setFlipX(li.x < c.x);
      const near = Math.abs(c.x + (c.flipX ? -46 : 46) - li.x);
      c.setFrame(near < 80 ? 1 : 0);
      if (this.swim && !this.p.invul && near < 40) { Audio2.play('buaya'); this.hurt(c.x); }
      if (!this.swim) { c.state = 'stop'; c.t = 0; }
    } else if (c.state === 'stop') {
      // Li sudah di darat: buaya berhenti, mengintai sebentar lalu menyelam
      c.setFrame(0); c.y = W + 16 + Math.sin(this.elapsed * 2) * 1.5;
      if (c.t > 1.6) { c.state = 'leave'; c.t = 0; }
    } else if (c.state === 'leave') { c.y += 26 * dt; c.alpha -= dt * 0.7; if (c.alpha <= 0) { c.destroy(); this.croc = null; } }
  }
  crocAppear() {
    const r = this.raft;
    const c = this.croc = this.add.sprite(r.x - 150, this.waterY + 60, 'buaya', 0).setOrigin(0.5, 1).setScale(0.62).setDepth(15.7).setFlipX(false);
    c.state = 'stalk'; c.t = 0; c.ax = r.x;
    Audio2.playMusic('tegang');
    this.toast('Ada sesuatu di belakang rakit...!', 2400);
  }
  crocFlip() {
    const c = this.croc, r = this.raft, li = this.li, W = this.waterY;
    c.state = 'flip'; c.t = 0; c.setFrame(1); Audio2.play('buaya');
    // buaya menyeruak dari bawah ujung belakang rakit
    this.tweens.add({ targets: c, x: r.x - 60, y: W + 6, duration: 260, ease: 'Quad.out' });
    this.time.delayedCall(240, () => {
      Audio2.play('crack'); Audio2.play('splash'); this.cam.shake(380, 0.009);
      this.raftState = 'broken'; this.swimZone = [this.L.raft.x - 60, 2780];
      // rakit terungkit dari belakang lalu terbalik ke depan
      const w = r.displayWidth, rv = this.add.image(r.x + w / 2, r.y, 'plank').setOrigin(1, 0.45).setScale(r.scaleX).setDepth(15.7);
      r.body.enable = false; r.setVisible(false);
      this.tweens.add({ targets: rv, angle: 80, duration: 360, ease: 'Quad.out', onComplete: () => {
        this.tweens.add({ targets: rv, angle: 178, x: rv.x + 40, duration: 520, ease: 'Quad.in', onComplete: () => {
          this.splash(rv.x - w / 2, W, 16); Audio2.play('splash');
          this.tweens.add({ targets: rv, y: W + 26, alpha: 0, duration: 1400, onComplete: () => rv.destroy() });
        } });
      } });
      this.splash(r.x - w / 2, W, 12);
      // Li terpental ke depan
      this.seated = false; li.body.setAllowGravity(true); li.setFrame(9); li.body.reset(li.x, li.y - 6); li.body.setVelocity(210, -420);
      this.tweens.add({ targets: li, angle: 25, duration: 300, yoyo: true });
      if (this.paddle) { const pd = this.paddle; this.paddle = null; this.tweens.add({ targets: pd, x: pd.x - 70, y: W + 6, angle: pd.angle - 300, duration: 900, onComplete: () => this.tweens.add({ targets: pd, alpha: 0, x: pd.x - 30, duration: 1600, onComplete: () => pd.destroy() }) }); }
      r.destroy(); this.raft = null;
      this.time.delayedCall(1300, () => { if (!c.active) return; c.setFrame(0); c.state = 'chase'; c.t = 0; this.think('Buaya! Berenang, Li! Cepat ke tepi!'); });
    });
  }

  // ---------- bekal, kelelahan, senter ----------
  updateNeeds(dt) {
    const p = this.p, li = this.li, moving = Math.abs(li.body.velocity.x) > 20;
    if (this.cut) return;
    const calm = this.L.calm;
    if (!calm) {
      let drain = moving ? (Math.abs(li.body.velocity.x) > 200 ? 1.1 : 0.6) : 0.22;
      if (this.swim) drain = 2.6;
      RUN.bekal = Math.max(0, RUN.bekal - drain * dt);
      if (p.sitT <= 0) {
        if (moving && !this.swim) p.fatigue += dt * (Math.abs(li.body.velocity.x) > 200 ? 1.9 : 1.05) * (RUN.bekal <= 0 ? 2.5 : 1);
        else if (!moving) p.fatigue = Math.max(0, p.fatigue - dt * 4);
      }
      if (p.fatigue > 78 && !p.warnTired) { p.warnTired = true; this.toast('Li mulai lelah... istirahat sebentar atau cari tempat singgah', 2600); }
      if (p.fatigue >= 100 && li.body.blocked.down && !this.swim) {
        p.fatigue = 38; p.warnTired = false; p.sitT = 3.6; Audio2.play('lelah'); Audio2.play('duduk');
        this.toast(RUN.bekal <= 0 ? 'Bekal habis! Li terduduk kelaparan...' : 'Li kelelahan dan terduduk sebentar...', 2600);
      }
      if (this.swim && RUN.bekal <= 0 && !p.invul) { this.toast('Li hampir tenggelam!'); this.hurt(null); }
    }
    if (this.torchOn) { RUN.battery = Math.max(0, RUN.battery - dt * 0.9); if (RUN.battery <= 0) { this.torchOn = false; this.toast('Baterai senter habis!'); Audio2.play('senter'); } }
    // saat mulai gelap cukup diberi tahu; pemain sendiri yang menyalakan senter
    if (!this.autoTorch && this.darkness > 0.45 && !this.torchOn && RUN.battery > 0) { this.autoTorch = true; this.toast(IS_TOUCH ? 'Mulai gelap... ketuk 🔦 untuk menyalakan senter' : 'Mulai gelap... tekan F untuk menyalakan senter', 2800); }
  }
  toggleTorch(force) {
    if (RUN.battery <= 0 && !this.torchOn) { this.toast('Baterai senter habis. Cari baterai di peti atau semak.'); return; }
    this.torchOn = force === true ? true : !this.torchOn; Audio2.play('senter');
  }
  updateHand() {
    const li = this.li, p = this.p, show = this.torchOn && RUN.battery > 0 && p.sitT <= 0 && !this.swim && !this.seated && li.visible;
    let hx = 15, hy = -37;
    const f = li.frame.name;
    if (p.crouch) { hx = 16; hy = -24; } else if ((f >= 21 && f <= 25) || (f >= 36 && f <= 43)) { hx = 19; hy = -36; } else if (f >= 9 && f <= 12) { hx = 15; hy = -40; }
    if (this.swim) { hx = 16; hy = -50; }
    if (f >= 28 && f <= 35) hy += (f % 4 === 0 || f % 4 === 1) ? 0 : -1;
    this.hand = { x: li.x + hx * p.face, y: li.y + hy };
    this.torchTilt = p.crouch ? 0.16 : 0.07;
    this.senter.setVisible(show).setPosition(this.hand.x - 2 * p.face, this.hand.y).setFlipX(p.face < 0).setOrigin(p.face > 0 ? 0.15 : 0.85, 0.5).setRotation(p.face > 0 ? this.torchTilt : -this.torchTilt);
    this.fist.setVisible(show).setPosition(this.hand.x - 1 * p.face, this.hand.y + 1);
    this.senter.setDepth(li.depth + 0.5); this.fist.setDepth(li.depth + 0.6);
  }

  updateCamera(dt) {
    const li = this.li;
    this.look = (this.look || 0) + ((this.p.face * 70) - (this.look || 0)) * Math.min(1, dt * 1.5);
    const tx = Phaser.Math.Clamp(li.x - 400 + this.look, 0, this.len - 960);
    this.cam.scrollX += (tx - this.cam.scrollX) * Math.min(1, dt * 6);
    this.cam.scrollY = 0;
    this.par.forEach((ts) => ts.set(this.cam.scrollX * ts.f));
  }

  updateAmbient(dt) {
    const t = this.elapsed;
    this.surfaces.forEach((s, i) => { s.set(t * (s.key === 'lumpur_top' ? 4 : (i % 2 ? 18 : 26))); s.setY(s.y0 + Math.sin(t * 2 + i) * 0.8); });
    if (this.fishes) this.fishes.forEach((f) => {
      f.x += f.v * dt; f.y += Math.sin(t * 2 + f.ph) * 6 * dt;
      if (Math.random() < dt * 0.15) { f.v = -f.v; f.setFlipX(f.v > 0); }
      if (f.x < 0 || f.x > this.len || !this.inWater(f.x + Math.sign(f.v) * 8)) { f.v = -f.v; f.x += f.v * dt * 2; f.setFlipX(f.v > 0); }
    });
    if (this.glints) this.glints.forEach((g, i) => { g.setAlpha(Math.max(0, Math.sin(t * 1.7 + i * 2.3)) * 0.5 * (1 - this.ts.night * 0.6)); });
    if (this.fogs) { const p = Phaser.Math.Clamp(this.li.x / this.len, 0, 1); this.fogs.forEach((f) => { f.set(t * 12 * f.sp * 10 + this.cam.scrollX * f.sp); f.setAlpha(f.base * (0.35 + p * 0.9)); }); }
    if (this.leaves) this.leaves.update(dt, t);
    if (this.flies) this.flies.update(dt, t);
    // pikiran Li
    this.thoughts.forEach((th) => { if (!th.done && this.li.x > th.x) { th.done = true; this.think(th.s); } });
    if (this.thinkT && this.thinkT.active) this.thinkT.setPosition(this.li.x, this.li.y - 96);
  }

  // ---------- item ----------
  updateItems(dt) {
    const li = this.li, cx = li.x, cy = li.y - 38;
    this.items.forEach((it) => {
      if (it.got) return;
      it.ph += dt * 3; it.im.y = it.by; it.spark.setPosition(it.im.x, it.im.y).setAlpha(0.22 + Math.max(0, Math.sin(it.ph * 1.2)) * 0.2);
      if (Math.abs(cx - it.x) < 26 && Math.abs(cy - it.im.y) < 50) this.collect(it);
    });
  }
  collect(it) {
    it.got = true; it.sh.destroy(); it.spark.destroy();
    const k = it.kind;
    let msg = '';
    if (k === 'nasi') { RUN.bekal = Math.min(100, RUN.bekal + 30); RUN.stats.nasi++; msg = '+30 Bekal'; Audio2.play('nasi'); }
    if (k === 'air') { RUN.bekal = Math.min(100, RUN.bekal + 20); this.p.fatigue = Math.max(0, this.p.fatigue - 15); RUN.stats.air++; msg = '+20 Bekal'; Audio2.play('air'); }
    if (k === 'hati') { if (RUN.maxHearts < 4) RUN.maxHearts++; RUN.hearts = Math.min(RUN.maxHearts, RUN.hearts + 1); RUN.stats.hati++; msg = '+1 Hati'; Audio2.play('hati'); }
    if (k === 'baterai') { RUN.battery = Math.min(100, RUN.battery + 55); RUN.stats.baterai++; msg = '+ Baterai'; Audio2.play('baterai'); }
    this.popText(it.x, it.im.y - 20, msg, k === 'hati' ? '#ffb3c6' : '#fff3b0');
    for (let i = 0; i < 6; i++) { const s = this.add.image(it.x, it.im.y, 'p_soft').setScale(0.3).setTint(0xfff2b0).setBlendMode(Phaser.BlendModes.ADD).setDepth(55); this.tweens.add({ targets: s, x: s.x + Math.cos(i) * 30, y: s.y + Math.sin(i) * 30, alpha: 0, duration: 500, onComplete: () => s.destroy() }); }
    this.tweens.add({ targets: it.im, y: it.im.y - 30, scale: it.im.scale * 1.4, alpha: 0, duration: 350, onComplete: () => it.im.destroy() });
  }

  openCrate(c, what) {
    Audio2.play('peti'); Audio2.play('kayu'); this.puff(c.x, c.y, 6);
    for (let i = 0; i < 6; i++) {
      const d = this.add.rectangle(c.x, c.y, 6, 3, 0x8b5a3c).setDepth(8);
      this.tweens.add({ targets: d, x: d.x + (Math.random() - 0.5) * 70, y: d.y - 20 - Math.random() * 30, angle: Math.random() * 360, alpha: 0, duration: 600, onComplete: () => d.destroy() });
    }
    const x = c.x, y = c.y; c.destroy();
    this.time.delayedCall(150, () => this.spawnItem(what, x, y - 24, true));
  }

  // ---------- interaksi (E) ----------
  updateInteract(action) {
    const li = this.li;
    let best = null, bd = 1e9;
    this.interacts.forEach((it) => { if (it.done) return; const d = Math.abs(it.x - li.x); if (d < it.r && Math.abs(it.y - li.y) < 110 && d < bd) { bd = d; best = it; } });
    this.curInteract = best;
    if (best && !this.cut && !this.swim) {
      const s = (IS_TOUCH || this.touch.enabled ? '' : 'E  ') + best.label;
      if (this.promptT.text !== s) {
        this.promptT.setText(s);
        const w = this.promptT.width + 16;
        this.promptG.clear(); this.promptG.fillStyle(0xfff8ec, 0.95); this.promptG.fillRoundedRect(-w / 2, -11, w, 22, 8); this.promptG.lineStyle(2, 0x6c5cb4); this.promptG.strokeRoundedRect(-w / 2, -11, w, 22, 8);
        this.promptG.fillTriangle(-5, 10, 5, 10, 0, 16);
      }
      this.prompt.setVisible(true).setPosition(li.x, li.y - 102 + Math.sin(this.elapsed * 4) * 2);
      this.touch.setAction(true, 'AKSI');
      if (action) best.act(best);
    } else { this.prompt.setVisible(false); this.touch.setAction(false); }
  }

  rest(cp) {
    if (this.cut) return;
    this.cut = true; this.cpUsed = true;
    const li = this.li; li.body.setVelocityX(0); li.play('li_sitdown'); Audio2.play('duduk');
    this.time.delayedCall(600, () => Audio2.play('checkpoint'));
    RUN.bekal = 100; this.p.fatigue = 0; this.p.warnTired = false;
    RUN.cp = { level: this.lv, x: cp.x }; RUN.level = this.lv; saveRun();
    this.popText(cp.x, li.y - 110, 'Bekal penuh · posisi tersimpan', '#c8ffb8');
    this.think({ warung: 'Teh hangat dan nasi... terima kasih, Bu.', gubuk: 'Angin sepoi-sepoi... enak untuk rehat.', musala: 'Sholat dulu, lalu lanjut berjalan.' }[cp.kind]);
    this.time.delayedCall(1900, () => { this.cut = false; });
  }

  enterSecret(s) {
    if (this.cut) return;
    this.cut = true; Audio2.play('pintu');
    // Li berjalan masuk ke mulut pintu lalu perlahan hilang ke kegelapan
    const li = this.li; li.body.setVelocity(0, 0); li.body.setAllowGravity(false); li.play('li_walk');
    li.setFlipX(s.x < li.x);
    this.tweens.add({ targets: li, x: s.x, duration: 500 });
    this.tweens.add({ targets: li, alpha: 0, scale: li.scale * 0.88, duration: 700, delay: 350 });
    this.cam.fadeOut(1000, 0, 0, 0);
    this.cam.once('camerafadeoutcomplete', () => this.scene.restart({ level: this.lv, secret: s.area, minute: this.minute }));
  }

  checkProgress() {
    if (this.ended) return;
    const li = this.li;
    if (this.isSecret && li.x > this.exitX) {
      this.ended = true; this.cut = true; Audio2.play('pintu');
      li.body.setVelocity(0, 0); li.body.setAllowGravity(false); li.anims.stop(); li.setFrame(19);
      this.tweens.add({ targets: li, x: this.exitX + 20, y: li.y - 70, alpha: 0, duration: 900 });
      this.cam.fadeOut(900, 0, 0, 0);
      this.cam.once('camerafadeoutcomplete', () => this.scene.restart({ level: this.lv, x: this.L.exitTo, minute: this.minute, emerge: true }));
      return;
    }
    if (!this.isSecret && this.main.exit && li.x > this.main.exit + 20) this.complete();
    if (this.main.home && li.x > this.main.home - 120 && !this.cut) this.homecoming();
  }

  complete() {
    this.ended = true; this.cut = true;
    Audio2.play('menang'); Audio2.stopMusic(1);
    this.autoWalk = 150;
    this.time.delayedCall(1200, () => {
      this.cam.fadeOut(900, 10, 8, 20);
      this.cam.once('camerafadeoutcomplete', () => {
        RUN.level = this.lv + 1; RUN.cp = null; RUN.minute = null; RUN.hearts = Math.max(RUN.hearts, 1); saveRun();
        this.scene.start('Interlude', { level: this.lv + 1 });
      });
    });
  }

  homecoming() {
    // sampai di halaman Rumah Gadang: Li berjalan sendiri ke pintu, lalu cerita penutup langsung diputar
    this.cut = true; this.ended = true;
    this.autoWalk = 80; this.autoRun = false;
    Audio2.stopMusic(2.5);
    this.think('Mak... Li pulang.');
    const door = this.main.home + 150, dur = Math.max(800, (door - this.li.x) / 80 * 1000);
    this.time.delayedCall(dur, () => {
      this.autoWalk = 0; this.li.body.setVelocityX(0); this.li.anims.stop(); this.li.setFrame(5);
      Audio2.play('pintu'); Audio2.play('hati');
      this.tweens.add({ targets: this.li, alpha: 0, duration: 900 });
      this.cam.fadeOut(1300, 255, 236, 200);
      this.cam.once('camerafadeoutcomplete', () => this.scene.start('Ending'));
    });
  }

  // ---------- luka, mati, jeda ----------
  hurt(fromX, fell) {
    if (this.ended) return;
    if (this.p.invul > 0 && !fell) return;
    const li = this.li;
    RUN.hearts--; Audio2.play('hurt'); this.cam.shake(220, 0.006);
    if (!this.redFlash) this.redFlash = this.add.rectangle(0, 0, 960, 540, 0xff4a5a).setOrigin(0).setScrollFactor(0).setDepth(95).setAlpha(0);
    this.redFlash.setAlpha(0.28); this.tweens.add({ targets: this.redFlash, alpha: 0, duration: 380 });
    this.p.invul = 1.6; this.p.sitT = 0;
    if (RUN.hearts <= 0) { this.gameOver(); return; }
    if (fell) {
      // kembali ke tempat aman terakhir
      if (this.swim) this.endSwim();
      if (this.raftState === 'broken' || this.raftState === 'go') { this.respawnCP(); return; }
      li.body.reset(this.lastSafe.x, this.lastSafe.y - 4); li.body.setVelocity(0, 0);
      this.cam.scrollX = Phaser.Math.Clamp(li.x - 400, 0, this.len - 960);
      return;
    }
    const dir = fromX === null || fromX === undefined ? -this.p.face : Math.sign(li.x - fromX) || 1;
    li.body.setVelocity(dir * 190, this.swim ? 0 : -300);
  }
  respawnCP() {
    this.cut = true;
    this.cam.fadeOut(400, 0, 0, 0);
    this.cam.once('camerafadeoutcomplete', () => this.scene.restart({ level: this.lv, fromCP: true, minute: this.minute }));
  }
  gameOver() {
    this.ended = true; this.cut = true; this.paused = true; this.physics.pause();
    Audio2.stopMusic(0.5); Audio2.play('gameover');
    this.li.anims.stop(); this.li.setFrame(27);
    const O = [];
    O.push(this.add.rectangle(0, 0, 960, 540, 0x0a0816, 0.6).setOrigin(0).setScrollFactor(0).setDepth(180));
    O.push(panel(this, 300, 150, 360, 250, 190));
    O.push(T(this, 480, 190, 'Hati Li habis...', 24, '#ffe7a6').setOrigin(0.5).setScrollFactor(0).setDepth(195));
    O.push(T(this, 480, 226, 'Tapi rindu pada rumah belum habis.', 14, '#d6ccff').setOrigin(0.5).setScrollFactor(0).setDepth(195));
    const restart = (cp) => { RUN.hearts = RUN.maxHearts; RUN.bekal = Math.max(RUN.bekal, 70); this.p.fatigue = 0; this.scene.restart({ level: this.lv, fromCP: cp, minute: this.isSecret ? this.minute : Math.max(this.minute, this.main.time[0]) }); };
    O.push(new PButton(this, 480, 286, 260, 42, RUN.cp && RUN.cp.level === this.lv ? 'Coba lagi dari checkpoint' : 'Coba lagi', () => restart(true), { size: 16 }));
    O.push(new PButton(this, 480, 342, 260, 38, 'Ulang dari awal level', () => restart(false), { size: 15, color: 0x5a4f8e }));
  }
  pause() {
    if (this.ended) return;
    if (this.pauseObjs) {
      this.pauseObjs.forEach((o) => o.destroy()); this.pauseObjs = null; this.paused = false;
      this.physics.resume(); this.tweens.resumeAll(); this.anims.resumeAll(); this.time.paused = false; Audio2.paused = false; return;
    }
    this.paused = true; this.physics.pause(); this.tweens.pauseAll(); this.anims.pauseAll(); this.time.paused = true; Audio2.paused = true;
    const O = this.pauseObjs = [];
    O.push(this.add.rectangle(0, 0, 960, 540, 0x0a0816, 0.55).setOrigin(0).setScrollFactor(0).setDepth(180).setInteractive());
    O.push(panel(this, 270, 110, 420, 330, 190));
    O.push(T(this, 480, 158, 'Jeda', 28, '#ffe7a6').setOrigin(0.5).setScrollFactor(0).setDepth(195));
    O.push(new PButton(this, 480, 214, 230, 40, 'Lanjut berjalan', () => this.pause(), { size: 16 }));
    O.push(new PButton(this, 480, 264, 230, 36, 'Ulang dari checkpoint', () => { this.pause(); this.respawnCP(); }, { size: 15, color: 0x5a4f8e }));
    const mb = new PButton(this, 480, 310, 230, 36, Audio2.muted ? 'Suara: mati' : 'Suara: nyala', () => { mb.t.setText(Audio2.toggleMute() ? 'Suara: mati' : 'Suara: nyala'); }, { size: 15, color: 0x5a4f8e });
    O.push(mb);
    O.push(new PButton(this, 480, 356, 230, 36, 'Menu utama', () => { saveRun(); this.scene.start('Title'); }, { size: 15, color: 0x8a4f6e }));
    O.push(T(this, 480, 408, IS_TOUCH ? '' : 'A/D jalan · Shift lari · Spasi loncat\nS nunduk · E aksi · F senter', 12, '#cfc6ff', { strokeThickness: 0, align: 'center', lineSpacing: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(195));
  }

  // ---------- partikel kecil ----------
  puff(x, y, n) {
    for (let i = 0; i < n; i++) {
      const d = this.add.image(x + (Math.random() - 0.5) * 14, y - 2, 'debu').setDepth(12).setScale(0.6 + Math.random() * 0.5).setAlpha(0.8);
      this.tweens.add({ targets: d, x: d.x + (Math.random() - 0.5) * 34, y: d.y - 6 - Math.random() * 12, scale: d.scale * 1.6, alpha: 0, duration: 420 + Math.random() * 200, onComplete: () => d.destroy() });
    }
  }
  splash(x, y, n) {
    for (let i = 0; i < n; i++) {
      const d = this.add.image(x + (Math.random() - 0.5) * 20, y, 'tetes').setDepth(17).setScale(0.8 + Math.random() * 0.6);
      const vx = (Math.random() - 0.5) * 80, h = 18 + Math.random() * 30;
      this.tweens.add({ targets: d, x: d.x + vx, duration: 520, ease: 'Linear' });
      this.tweens.add({ targets: d, y: y - h, duration: 260, ease: 'Quad.out', yoyo: true, onComplete: () => d.destroy() });
    }
    const ring = this.add.ellipse(x, y + 2, 10, 3).setStrokeStyle(1.5, 0xe6f0ff, 0.9).setDepth(17);
    this.tweens.add({ targets: ring, scaleX: 5, scaleY: 3, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
  }
  mudSplash(x, y) {
    for (let i = 0; i < 3; i++) {
      const d = this.add.circle(x + (Math.random() - 0.5) * 16, y - 2, 1.6 + Math.random(), 0x6a4a3a).setDepth(16);
      this.tweens.add({ targets: d, x: d.x + (Math.random() - 0.5) * 30, y: d.y - 10 - Math.random() * 10, alpha: 0, duration: 400, onComplete: () => d.destroy() });
    }
  }
  leafBurst(x, y) {
    const d = this.add.image(x + (Math.random() - 0.5) * 30, y, Phaser.Utils.Array.GetRandom(['daun_hijau', 'daun_kuning'])).setDepth(14).setScale(0.7);
    this.tweens.add({ targets: d, x: d.x + (Math.random() - 0.5) * 60, y: d.y - 20 + Math.random() * 40, angle: 360, alpha: 0, duration: 900, onComplete: () => d.destroy() });
  }
}
