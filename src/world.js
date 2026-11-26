// =============================================================
//  WAKTU & CAHAYA — subuh, pagi, siang, sore, senja, malam.
//  Warna dikalikan (multiply) ke seluruh dunia; malam ditambah kegelapan.
// =============================================================
const TIMEKEYS = [
  // menit, tint, gelap, langit atas, langit bawah
  [300, 0x4c4f8a, 0.72, 0x161a46, 0x3a3870],
  [345, 0x8a80c0, 0.38, 0x3c4290, 0xc895b8],
  [390, 0xffcfae, 0.06, 0x7096dc, 0xffc39c],
  [450, 0xfff1e2, 0.0, 0x86b4f2, 0xd4eaff],
  [660, 0xffffff, 0.0, 0x7cb2f4, 0xcfe8ff],
  [900, 0xfff1da, 0.0, 0x88b2ec, 0xffe4c4],
  [1000, 0xffd3a2, 0.0, 0x96a4e4, 0xffcb96],
  [1065, 0xf1a07c, 0.1, 0x786ebe, 0xff9c6c],
  [1105, 0xb27ca2, 0.38, 0x46468e, 0xcd7a7c],
  [1150, 0x6c6cac, 0.72, 0x222858, 0x484884],
  [1320, 0x5c5ca4, 0.82, 0x131a40, 0x2a2e64]
];
function timeLabel(m) {
  if (m < 360) return 'Subuh'; if (m < 600) return 'Pagi'; if (m < 900) return 'Siang';
  if (m < 1050) return 'Sore'; if (m < 1110) return 'Senja'; return 'Malam';
}
function lerpCol(a, b, t) {
  const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255, br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}
function timeState(m) {
  let i = 0;
  while (i < TIMEKEYS.length - 2 && m > TIMEKEYS[i + 1][0]) i++;
  const a = TIMEKEYS[i], b = TIMEKEYS[i + 1], t = Phaser.Math.Clamp((m - a[0]) / (b[0] - a[0]), 0, 1);
  return { tint: lerpCol(a[1], b[1], t), dark: a[2] + (b[2] - a[2]) * t, top: lerpCol(a[3], b[3], t), bot: lerpCol(a[4], b[4], t), night: Phaser.Math.Clamp(((a[2] + (b[2] - a[2]) * t) - 0.2) / 0.5, 0, 1) };
}
