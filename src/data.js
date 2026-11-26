// =============================================================
//  DATA LEVEL — semua koordinat dalam piksel dunia (tinggi layar 540).
//  seg: [x0, x1, yAtas]  tanah padat · plat: [x, y, lebar, jenis]
//  dec: [kunci, x, yBawah, skala, kedalaman(-1 belakang / 1 depan), flip]
//  en : [jenis, x, ...]  · it: [jenis, x, y]  · crate: [x, isi]
// =============================================================
const GY = 468;           // tinggi tanah standar
const WS = 0.42;          // skala sprite (Li dsb.)
const BALIK = { W: 960, H: 540 };

const LEVELS = [
  // ---------------------------------------------------------------- 1
  {
    id: 'kota', name: 'Kota', sub: 'Terminal & jalanan kota', music: 'kota', amb: 'kota', len: 3000,
    time: [330, 480], bg: 'kota', ground: 'city',
    seg: [[0, 700, GY], [810, 1330, GY], [1440, 1860, GY], [1960, 2520, GY], [2630, 3000, GY]],
    gaps: 'got',
    plat: [[440, 388, 110, 'awning'], [2240, 380, 120, 'awning']],
    crate: [[380, 'baterai'], [1120, 'air'], [1120, 'nasi', 1], [2150, 'nasi']],
    dec: [['shelter', 70, GY, 0.95, -1], ['bus_sign', 190, GY, 0.55, -1], ['bench', 270, GY, 0.48, -1], ['lamp_city', 330, GY, 0.6, -1], ['trash', 560, GY, 0.48, -1],
      ['tree_city', 880, GY, 0.62, -1], ['vending', 1040, GY, 0.5, -1], ['lamp_city', 1260, GY, 0.6, -1], ['planter', 1480, GY, 0.45, -1], ['toko', 1680, GY, 0.5, -1],
      ['bench', 1790, GY, 0.48, -1], ['lamp_city', 2020, GY, 0.6, -1], ['tree_city', 2230, GY, 0.62, -1], ['planter2', 2470, GY, 0.45, -1], ['cone', 2680, GY, 0.4, 1], ['barrier', 2760, GY, 0.45, 1], ['lamp_city', 2860, GY, 0.6, -1]],
    lights: [[330, GY - 98], [1260, GY - 98], [2020, GY - 98], [2860, GY - 98]],
    en: [['copet', 600, 480, 690], ['cat', 1000], ['copet', 1780, 1700, 1850], ['cat', 2050], ['copet', 2440, 2260, 2510], ['copet', 2800, 2650, 2900]],
    it: [['nasi', 250, GY - 30], ['air', 495, 358], ['nasi', 1020, GY - 30], ['air', 1750, GY - 30], ['nasi', 2300, 350], ['air', 2720, GY - 30]],
    cp: { x: 1580, kind: 'warung' },
    secret: { x: 2400, kind: 'jembatan', area: 0 },
    exit: 2930, exitSign: 'Kampung →'
  },
  // ---------------------------------------------------------------- 2
  {
    id: 'hutan', name: 'Jalan Lintas & Hutan', sub: 'Jalan tanah, akar, jurang kecil', music: 'hutan', amb: 'hutan', len: 3200,
    time: [540, 720], bg: 'hutan', ground: 'forest',
    seg: [[0, 620, GY], [740, 1380, GY], [1500, 2050, GY], [2170, 2700, GY], [2820, 3200, GY]],
    gaps: 'jurang',
    plat: [[380, 392, 110, 'rock'], [1150, 380, 120, 'rock'], [1800, 372, 110, 'rock'], [2470, 385, 110, 'rock']],
    low: [[900], [2380]],
    dec: [['tree_round', 120, GY, 0.95, -1], ['bush', 260, GY, 0.5, 1], ['pagar', 290, GY, 0.5, -1], ['flower', 560, GY, 0.5, 1], ['tree_round', 1000, GY, 0.95, -1], ['bush2', 1300, GY, 0.55, 1],
      ['stump', 1640, GY, 0.5, -1], ['tree_round', 1980, GY, 0.95, -1], ['bush3', 1930, GY, 0.55, 1], ['lampbranch', 2560, GY, 0.55, -1], ['tree_round', 2900, GY, 0.95, -1], ['bush', 3060, GY, 0.5, 1]],
    lights: [[2564, GY - 34]],
    en: [['monyet', 435, 392], ['ular', 1050], ['monyet', 1210, 380], ['ular', 1700], ['monyet', 1855, 372], ['monyet', 2525, 385], ['ular', 2950]],
    it: [['nasi', 250, GY - 30], ['air', 770, GY - 30], ['nasi', 1180, 350], ['air', 1830, 342], ['nasi', 2280, GY - 30], ['air', 2900, GY - 30]],
    search: [[2000, 'baterai']],
    cp: { x: 1620, kind: 'gubuk' },
    secret: { x: 2250, kind: 'semak', area: 1 },
    exit: 3130, exitSign: 'Sungai →'
  },
  // ---------------------------------------------------------------- 3
  {
    id: 'sungai', name: 'Sungai', sub: 'Batu loncatan, rakit, dan arus', music: 'sungai', amb: 'sungai', len: 3800,
    time: [780, 990], bg: 'sungai', ground: 'bank', water: 486,
    seg: [[0, 520, GY], [1080, 1560, GY], [2780, 3800, GY]],
    plat: [[590, 444, 74, 'stone'], [712, 428, 74, 'stone', 1], [842, 446, 74, 'stone'], [972, 430, 74, 'stone', 1], [1500, 456, 70, 'plank']],
    raft: { x: 1585, stop: 2700, crocX: 2300 },
    dec: [['tree_round', 140, GY, 0.95, -1], ['bush', 420, GY, 0.5, 1], ['flower', 1130, GY, 0.5, 1], ['tree_round', 1250, GY, 0.95, -1], ['rocks_bush', 2900, GY, 0.5, -1], ['tree_round', 3550, GY, 0.95, -1], ['bush2', 3700, GY, 0.55, 1]],
    en: [['ikan', 655], ['ikan', 910], ['biawak', 1250, 1110, 1420], ['ikan', 1900], ['ikan', 2150], ['biawak', 3000, 2850, 3180], ['biawak', 3520, 3420, 3700]],
    it: [['nasi', 300, GY - 30], ['air', 749, 398], ['nasi', 1180, GY - 30], ['nasi', 2950, GY - 30], ['air', 3380, GY - 30]],
    crate: [[1350, 'baterai']],
    cp: { x: 1440, kind: 'gubuk' },
    secret: { x: 3250, kind: 'airterjun', area: 2 },
    exit: 3740, exitSign: 'Kelok Sembilan →'
  },
  // ---------------------------------------------------------------- 4
  {
    id: 'gunung', name: 'Pegunungan', sub: 'Kelok Sembilan berkabut', music: 'gunung', amb: 'gunung', len: 3600,
    time: [1000, 1125], bg: 'gunung', ground: 'mount', fog: true,
    seg: [[0, 500, GY], [500, 760, 422, 'road'], [760, 1000, 376, 'road'], [1080, 1400, 334], [1400, 1660, 292], [1740, 2100, 300, 'road'], [2100, 2400, 342, 'road'], [2480, 2800, 392], [2800, 3100, 432, 'road'], [3180, 3600, GY]],
    gaps: 'jurang',
    plat: [],
    boulder: [[1640, 1100, 1660], [3080, 2500, 3100]],
    dec: [['tree_round', 200, GY, 0.95, -1], ['rocks_bush', 640, 422, 0.45, -1], ['arah2', 900, 376, 0.4, -1], ['tree_round', 1250, 334, 0.95, -1], ['rocks_bush', 2250, 342, 0.45, 1], ['tree_round', 2650, 392, 0.95, -1], ['arah2', 3300, GY, 0.4, -1], ['tree_round', 3450, GY, 0.95, -1]],
    rail: [[500, 1000], [1740, 2400], [2800, 3100]],
    en: [['elang', 900], ['elang', 1900], ['elang', 2900]],
    it: [['nasi', 320, GY - 30], ['air', 1200, 304], ['nasi', 1500, 262], ['air', 2200, 312], ['nasi', 2950, 402], ['air', 3400, GY - 30]],
    crate: [[620, 'baterai']],
    cp: { x: 1900, kind: 'musala' },
    secret: { x: 2620, kind: 'terowongan', area: 3 },
    exit: 3540, exitSign: 'Ngarai →'
  },
  // ---------------------------------------------------------------- 5
  {
    id: 'sawah', name: 'Ngarai & Sawah', sub: 'Pematang sempit di malam hari', music: 'sawah', amb: 'sawah', len: 3600,
    time: [1170, 1260], bg: 'sawah', ground: 'pematang', fireflies: true,
    seg: [[0, 420, GY], [620, 900, GY], [1120, 1500, GY], [1700, 2100, GY], [2300, 2650, GY], [2900, 3600, GY]],
    mud: [[420, 620], [900, 1120], [1500, 1700], [2100, 2300], [2650, 2900]],
    plat: [],
    dec: [['tree_round', 160, GY, 0.95, -1], ['rocks_bush', 760, GY, 0.4, -1], ['tree_round', 1300, GY, 0.95, -1], ['arah', 2000, GY, 0.4, -1], ['tree_round', 3100, GY, 0.95, -1], ['lamp_post', 3400, GY, 0.5, -1]],
    lights: [[3412, GY - 82]],
    en: [['bebek', 760, 640, 880], ['kerbau', 1000, 920, 1080], ['bebek', 1300, 1140, 1480], ['lintah', 520], ['lintah', 1600], ['bebek', 1900, 1720, 2080], ['lintah', 2200], ['kerbau', 2760, 2680, 2860], ['bebek', 3150, 2920, 3350]],
    it: [['nasi', 250, GY - 30], ['air', 800, GY - 30], ['nasi', 1400, GY - 30], ['air', 2000, GY - 30], ['nasi', 2560, GY - 30], ['air', 3250, GY - 30]],
    search: [[1240, 'baterai']],
    cp: { x: 1850, kind: 'gubuk' },
    secret: { x: 2480, kind: 'lumbung', area: 4 },
    exit: 3540, exitSign: 'Kampung →'
  },
  // ---------------------------------------------------------------- 6
  {
    id: 'kampung', name: 'Kampung', sub: 'Jalan pulang ke Rumah Gadang', music: 'kampung', amb: 'kampung', len: 2100,
    time: [1290, 1310], bg: 'kampung', ground: 'village', calm: true, fireflies: true,
    seg: [[0, 2100, GY]],
    plat: [],
    dec: [['pagar', 200, GY, 0.5, -1], ['lamp_post', 380, GY, 0.5, -1], ['tree_round', 560, GY, 0.95, -1], ['pagar', 800, GY, 0.5, -1], ['lamp_post', 980, GY, 0.5, -1], ['pot_plant', 1150, GY, 0.42, -1], ['pagar', 1300, GY, 0.5, -1], ['lamp_post', 1500, GY, 0.5, -1]],
    lights: [[392, GY - 82], [992, GY - 82], [1512, GY - 82]],
    thoughts: [[300, 'Udara kampung... baunya sama seperti dulu.'], [900, 'Sedikit lagi, Li.'], [1350, 'Itu... Rumah Gadang kami!']],
    en: [], it: [],
    home: 1650
  }
];

// Area rahasia: lebih gelap & berbahaya, berisi hadiah dan jalan pintas
const SECRETS = [
  { name: 'Gua Bawah Jembatan', bg: 'gua', ground: 'cave', len: 1500, dark: true, music: 'gua', amb: 'gua',
    seg: [[0, 420, GY], [520, 900, GY], [990, 1500, GY]],
    plat: [[300, 372, 0, 'cave'], [700, 352, 0, 'cave'], [1150, 362, 0, 'cave']],
    dec: [['crystal_b', 160, GY, 0.5, -1], ['cave_lamp', 380, 300, 0.55, -1], ['crystal_p', 640, GY, 0.5, 1], ['cart', 860, GY, 0.5, -1], ['cave_lamp', 1050, 300, 0.55, -1], ['crystal_b', 1380, GY, 0.5, 1]],
    lights: [[380, 290, 90], [1050, 290, 90]],
    en: [['bat', 420, 300], ['rat', 760, 560, 880], ['slime', 1100, 1000, 1300], ['ularbatu', 1320]],
    it: [['nasi', 200, GY - 30], ['hati', 760, 318], ['air', 1250, GY - 30]], crate: [[1020, 'baterai']],
    exitTo: 2700 },
  { name: 'Semak Lebat', bg: 'semak', ground: 'forest', len: 1300, dark: true, darkness: 0.55, music: 'gua', amb: 'hutan',
    seg: [[0, 600, GY], [700, 1300, GY]],
    plat: [[440, 392, 100, 'rock'], [900, 392, 110, 'rock']],
    dec: [['bush', 120, GY, 0.55, 1], ['tree_round', 380, GY, 0.95, -1], ['flower', 820, GY, 0.5, 1], ['bush2', 1150, GY, 0.55, 1]],
    en: [['ular', 300], ['monyet', 955, 392], ['ular', 1100]],
    it: [['nasi', 300, GY - 30], ['hati', 490, 350], ['air', 1180, GY - 30]], search: [[1000, 'baterai']],
    exitTo: 3000 },
  { name: 'Gua Balik Air Terjun', bg: 'gua', tint: 0x9fc4ff, ground: 'cave', len: 1300, dark: true, music: 'gua', amb: 'air_terjun',
    seg: [[0, 500, GY], [600, 1300, GY]],
    plat: [[320, 372, 0, 'cave'], [900, 360, 0, 'cave']],
    dec: [['crystal_b', 200, GY, 0.55, 1], ['crystal_b', 760, GY, 0.5, -1], ['crystal_p', 1100, GY, 0.5, 1]],
    lights: [[200, GY - 30, 70], [760, GY - 30, 70]],
    en: [['bat', 350, 300], ['slime', 800, 650, 1000], ['bat', 1000, 280]],
    it: [['nasi', 180, GY - 30], ['hati', 380, 340], ['air', 1150, GY - 30]], crate: [[700, 'baterai']],
    exitTo: 3600 },
  { name: 'Terowongan Tebing', bg: 'gua', tint: 0xc9b8a8, ground: 'cave', len: 1300, dark: true, music: 'gua', amb: 'gua',
    seg: [[0, 450, GY], [560, 1300, GY]],
    plat: [[250, 380, 0, 'cave'], [850, 355, 0, 'cave']],
    dec: [['cave_lamp', 300, 300, 0.55, -1], ['cart', 700, GY, 0.5, -1], ['cave_fence', 1100, GY, 0.45, 1]],
    lights: [[300, 290, 90]],
    en: [['rat', 300, 150, 420], ['bat', 650, 290], ['ularbatu', 1000]],
    it: [['nasi', 200, GY - 30], ['hati', 900, 325], ['air', 1200, GY - 30]], crate: [[620, 'baterai']],
    exitTo: 3300 },
  { name: 'Lumbung Padi', bg: 'lumbung', ground: 'village', len: 1100, dark: true, darkness: 0.7, music: 'gua', amb: 'sawah',
    seg: [[0, 1100, GY]],
    plat: [[300, 400, 120, 'plank'], [520, 340, 120, 'plank'], [760, 380, 120, 'plank']],
    dec: [['barrel', 150, GY, 0.45, -1], ['crate', 420, GY, 0.45, -1], ['barrel', 900, GY, 0.45, -1], ['lantern', 600, 250, 0.55, -1]],
    lights: [[600, 270, 100]],
    en: [['rat', 400, 200, 700], ['rat', 850, 700, 1000]],
    it: [['nasi', 150, GY - 30], ['hati', 580, 310], ['air', 820, 350]], crate: [[1000, 'baterai']],
    exitTo: 3300 }
];

const INTERLUDES = [
  'Gerbang kota akhirnya terlewati.\nJalan masih panjang. Tapi Li terus melangkah.',
  'Hutan sudah Li lewati.\nSungai menunggu di depan.',
  'Pakaian Li masih basah, tapi sungai sudah di belakang.\nDi depan, Kelok Sembilan menanjak ke langit sore.',
  'Kabut gunung perlahan turun bersama malam.\nDari kejauhan, sawah di ngarai berkilau diterangi bulan.',
  'Bau tanah sawah dan suara jangkrik...\nLi tahu, kampungnya sudah dekat.'
];
