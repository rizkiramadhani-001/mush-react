/* Satu-satunya tempat untuk ambang, data contoh, dan interval. */
export const CONFIG = {
  USE_MOCK: true, // false → pakai HttpApi ke server beneran
  API_BASE: "", // mis. "https://mush.pagifarm.id"
  POLL_MS: 10_000,
  VERSION: "v4-react",
  THRESHOLDS: {
    suhu: [40, 45], // °C, teks "Dalam target · 40–45°C" di mockup
    hum: [55, 70], // %RH, teks "target 55–70%"
    fermentDays: 14,
  },
  KAPASITAS_KG: 5, // load cell, berat paket maksimum
  CHART: { min: 35, max: 45 }, // domain sumbu-Y grafik suhu
};

export const SEED = {
  "B-024": {
    label: "Pakan silase premium · 5 kg",
    suhu: 41.2,
    hum: 62,
    berat: 4.8,
    day: 9,
    total: 14,
    started: "belum dicatat",
    h24: [41.0, 41.2, 41.0, 41.3, 41.1, 41.4, 41.2, 41.5, 41.3, 41.4, 41.2, 41.3, 41.2],
    h7: [40.6, 40.9, 41.1, 40.8, 41.3, 41.0, 41.2],
    log: [
      { t: "10:42", suhu: 41.2, hum: 62 },
      { t: "10:32", suhu: 41.1, hum: 62 },
      { t: "10:22", suhu: 41.3, hum: 61 },
      { t: "10:12", suhu: 41.0, hum: 62 },
      { t: "10:02", suhu: 41.4, hum: 61 },
      { t: "09:52", suhu: 41.1, hum: 62 },
      { t: "09:42", suhu: 40.9, hum: 61 },
      { t: "09:32", suhu: 41.2, hum: 62 },
    ],
  },
  "B-025": {
    label: "Pakan silase premium · 5 kg",
    suhu: 39.4,
    hum: 68,
    berat: 4.6,
    day: 4,
    total: 14,
    started: "belum dicatat",
    h24: [38.9, 39.1, 39.0, 39.3, 39.2, 39.5, 39.4, 39.6, 39.3, 39.4, 39.5, 39.4, 39.4],
    h7: [38.5, 38.9, 39.0, 39.2, 39.3, 39.4, 39.4],
    log: [
      { t: "10:41", suhu: 39.4, hum: 68 },
      { t: "10:31", suhu: 39.2, hum: 67 },
      { t: "10:21", suhu: 39.5, hum: 68 },
      { t: "10:11", suhu: 39.3, hum: 68 },
      { t: "10:01", suhu: 39.1, hum: 67 },
      { t: "09:51", suhu: 39.4, hum: 68 },
      { t: "09:41", suhu: 39.2, hum: 67 },
      { t: "09:31", suhu: 39.0, hum: 68 },
    ],
  },
};

export const EVENTS = [
  { when: "08:42", title: "Kelembapan stabil", status: "Selesai", tone: "ok" },
  { when: "Kemarin", title: "Suhu naik sementara", status: "Selesai", tone: "warn" },
  { when: "2 hari", title: "Profil batch diperbarui", status: "Info", tone: "info" },
];

/* Sensor MUSH.
   - "source": asal sensor di dokumen. "proposal" = PROPOSAL BARU IOT - TERISI.docx
     subbab 2.3 dan 2.4. "diskusi" = hasil rapat tim SensorIX (chat.md) 1-2 Oktober
     2026, jawaban resmi ke mitra: sensor suhu, tekanan, dan gas.
   - "mode": cara sensor bekerja, yang menentukan bentuk tampilannya.
     "continuous" dipantau selama fermentasi sehingga punya tren.
     "once" hanya berjalan satu kali saat pengisian atau penakaran sehingga
     hanya punya status, bukan tren 24 jam.
   Unit dan ambang tidak ditetapkan di kedua sumber, jadi tidak ditebak. */
export const SENSORS = [
  {
    id: "temperature",
    source: "proposal",
    mode: "continuous",
    name: "Suhu drum",
    hardware: "DS18B20 waterproof",
    location: "Fermentasi",
    purpose: "Suhu internal drum, dikirim LGT8F32P → RF433 → ESP32.",
    threshold: () => `Target ${CONFIG.THRESHOLDS.suhu.join("–")}°C`,
    band: () => CONFIG.THRESHOLDS.suhu,
  },
  {
    id: "humidity",
    source: "diskusi",
    mode: "continuous",
    name: "Kelembapan",
    hardware: "Model sensor belum ditetapkan",
    location: "Fermentasi",
    purpose: "Dipantau sebagai kondisi ruang fermentasi bersama suhu.",
    threshold: () => `Target ${CONFIG.THRESHOLDS.hum.join("–")}% RH`,
    band: () => CONFIG.THRESHOLDS.hum,
  },
  {
    id: "pressure",
    source: "diskusi",
    mode: "continuous",
    name: "Tekanan",
    hardware: "Sensor tekanan (belum ada di proposal)",
    location: "Fermentasi",
    purpose: "Diajukan sebagai parameter monitoring tambahan saat pengujian.",
    band: () => null,
  },
  {
    id: "gas",
    source: "diskusi",
    mode: "continuous",
    name: "Gas",
    hardware: "Sensor MQ (masih diperhitungkan)",
    location: "Fermentasi",
    purpose: "Knoop gas fermentasi; belum diputuskan pada 1 Oktober 2026.",
    band: () => null,
  },
  {
    id: "weight",
    source: "proposal",
    mode: "once",
    name: "Berat kemasan",
    hardware: "Load cell 5 kg + HX711",
    location: "Penakaran",
    purpose: "Menimbang silase sebelum pintu wadah takar dibuka.",
    threshold: () => `Kapasitas ${CONFIG.KAPASITAS_KG} kg`,
  },
  {
    id: "press",
    source: "proposal",
    mode: "once",
    name: "Gaya tekan pres",
    hardware: "Sensor tekan",
    location: "Pemadatan",
    purpose: "Umpan balik untuk menentukan titik henti pres berulir.",
  },
  {
    id: "gate",
    source: "proposal",
    mode: "once",
    name: "Batas gerak pintu",
    hardware: "Limit switch",
    location: "Penakaran",
    purpose: "Mendeteksi batas mekanis pintu wadah takar.",
  },
];

// Nilai contoh supaya panel terisi saat USE_MOCK. Semua null saatUSE_MOCK
// dimatikan dan server belum mengirim telemetri lini robotik.
export const MACHINE_SENSOR_SEED = {
  press: { value: 480, unit: "N", target_reached: true, updated_at: "10:42" },
  gate: { limit_reached: false, updated_at: "10:42" },
  pressure: { value: 101.8, unit: "kPa", updated_at: "10:42" },
  gas: { value: 1240, unit: "ppm", updated_at: "10:42" },
};

/* Sejarah 24 jam untuk grafik. Dibangun mundur dari nilai terkini supaya
   titik terakhir sama dengan bacaan live, dan deterministik agar tidak
   berubah antar render. Sensor tanpa nilai basenya tidak dibuat, supaya
   grafik tidak menampilkan garis angka palsu. */
function history24(base, step, precision, seed) {
  const n = 24;
  const out = new Array(n);
  out[n - 1] = Number(base.toFixed(precision));
  let v = base;
  let s = seed;
  for (let i = n - 2; i >= 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    v -= (((s / 0x7fffffff) - 0.5) * step) * 2;
    out[i] = Number(v.toFixed(precision));
  }
  return out;
}

const series = (base, step, precision, seed) =>
  Number.isFinite(base) ? history24(base, step, precision, seed) : null;

/* Hanya parameter yang dipantau terus-menerus selama fermentasi yang
   dibuat deretnya. Pres dan berat adalah satu langkah proses saat
   pengisian dan penakaran, jadi tidak punya tren 24 jam. */
export function sensorHistory(drumId) {
  const s = SEED[drumId];
  const m = MACHINE_SENSOR_SEED ?? {};
  const seed = [...drumId].reduce((acc, ch) => acc + ch.charCodeAt(0), 7);
  return {
    temperature: series(s.suhu, 0.2, 1, seed),
    humidity: series(s.hum, 1.5, 0, seed + 1),
    pressure: series(m.pressure?.value, 0.12, 1, seed + 3),
    gas: series(m.gas?.value, 70, 0, seed + 4),
  };
}