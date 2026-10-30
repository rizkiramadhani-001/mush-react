# MUSH React · Field Console

> Dashboard pemantauan fermentasi silase untuk Pagi Farm. Satu basis kode React
> untuk ponsel dan desktop, terhubung langsung ke REST API MUSH.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-9-3880FF?logo=ionic&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-prototype-f0b429)

## Konteks

Fermentasi silase perlu dipantau terus-menerus: suhu dan kelembapan di luar
target dapat menandakan kontaminasi atau fermentasi yang belum matang. MUSH
mengubah pembacaan sensor drum menjadi dashboard yang bisa dibaca cepat oleh
operator, baik dari ponsel di lapangan maupun layar lebar di ruang kontrol.

Repo ini adalah lapisan presentasi dari tiga bagian sistem:

```
mush-react  ←  mush-server  ←  gateway ESP32 (suhu, kelembapan, tekanan, gas)
                    │
                    └──  mush-ml (prediksi 1 & 7 hari)
```

- [MUSH Server](https://github.com/rizkiramadhani-001/mush-server) — API, Prisma, PostgreSQL
- [MUSH ML](https://github.com/rizkiramadhani-001/mush-ml) — layanan prediksi FastAPI
- [Landing page](https://github.com/rizkiramadhani-001/landing)

## Yang ditonjolkan

- **Satu UI, dua tata letak.** Tampilan ponsel di bawah 1024px, dasbor
  multi-halaman di layar lebar, dengan state dan pemilihan batch yang sama.
- **Adapter data terpisah dari view.** `MockApi` untuk demo tanpa backend,
  `HttpApi` untuk server sungguhan; komponen tidak mengetahui asal data.
- **Kontrak API dipetakan rapi.** Response v3.1 yang ramping diubah menjadi
  snapshot view di satu tempat (`src/api.js`).
- **Data hilang tidak dipalsukan.** Sensor tanpa nilai tampil "Belum ada data",
  bukan nol atau status offline.
- **Aksesibilitas dasar.** Skip link, label ARIA, navigasi keyboard, status
  loading/error, dan tema terang/gelap yang mengikuti preferensi sistem.

## Fitur

| Layar | Isi |
|---|---|
| Ringkasan | Status batch, metrik suhu/kelembapan/berat, tren, daftar peringatan |
| Detail Batch | Profil batch, progres fermentasi, timbangan, riwayat bacaan |
| Peringatan | Batch di luar target, kejadian turunan, status sensor |
| Akun | Status koneksi, batch aktif, pengaturan tema |

- Route hash: `#/ringkasan`, `#/batch`, `#/peringatan`, `#/akun` — mendukung
  tautan langsung, reload, dan Back/Forward browser.
- Polling 10 detik; berhenti saat tab tidak terlihat dan menyegarkan saat tab
  kembali aktif.
- Tarik ke bawah atau tombol sinkronisasi untuk refresh manual, dengan toast.
- Visual drum 3D dan grafik tren memakai Three.js dan Recharts.

## Tech stack

| Bagian | Teknologi |
|---|---|
| UI | React 19, Ionic React 9 |
| Build | Vite 8 |
| Grafik | Recharts 3 |
| Visual | Three.js |
| Gaya | CSS custom properties, tema terang/gelap |
| Lint & tes | oxlint, `node:test` |

## Menjalankan

Kebutuhan: Node.js 20.19+ dan `mush-server` di `http://127.0.0.1:8080`.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Vite meneruskan `/api` dan `/health` ke
`127.0.0.1:8080`, jadi browser tidak terkena CORS.

```bash
npm run lint
npm test
npm run build
npm run preview
```

## Konfigurasi

Semua pengaturan aplikasi berada di `src/config.js`.

| Nilai | Default | Keterangan |
|---|---|---|
| `USE_MOCK` | `false` | `true` memakai `SEED`, `false` memakai `HttpApi` |
| `API_BASE` | `""` | Kosong = origin sama lewat proxy Vite |
| `POLL_MS` | `10000` | Interval polling dashboard |
| `THRESHOLDS.suhu` | `[40, 45]` | Target suhu drum (°C) |
| `THRESHOLDS.hum` | `[55, 70]` | Target kelembapan (%RH) |
| `THRESHOLDS.fermentDays` | `14` | Durasi fermentasi acuan |
| `KAPASITAS_KG` | `5` | Kapasitas load cell |
| `CHART` | `35–45` | Domain sumbu Y grafik suhu |

`API_BASE` dapat dioverride saat build:

```bash
VITE_API_BASE=https://mush.pagifarm.id npm run build
```

## Koneksi ke `mush-server`

| Endpoint | Dipakai untuk |
|---|---|
| `GET /api/drums` | Daftar batch `{ drums: [{ id }] }` |
| `GET /api/latest?drum=<id>` | Snapshot bacaan terbaru per batch |

Kontrak server v3.1 lebih ramping daripada bentuk snapshot yang dipakai view,
jadi `src/api.js` memetakan response:

| Field view | Sumber |
|---|---|
| `suhu`, `kelembapan`, `tekanan`, `gas` | response `latest` |
| `hari`, `total_hari`, `progres_pct` | response `latest` |
| `berat` | `batches.berat_kg` lewat response `latest` |
| `started` | `batches.tanggal_mulai` lewat response `latest` |
| `h24`, `h7`, `log` | response `latest` |
| `sensor_history.*` | dibangun dari `log` server |
| `label` | default produk; server belum menyimpan label batch |
| `machine_sensors` | belum dikirim server, tampil "Belum ada data" |

Deret grafik hanya dibuat bila semua nilai dalam log terisi. Bila `API_BASE`
diisi langsung tanpa proxy, tambahkan origin dashboard ke `CORS_ORIGIN` di
`mush-server`.

## Sensor dan telemetri

| Sensor | Sumber tampilan | Catatan |
|---|---|---|
| Suhu drum | `latest.suhu` | DS18B20, target 40–45°C |
| Kelembapan | `latest.kelembapan` | Target 55–70% RH |
| Berat kemasan | `latest.berat` | Load cell 5 kg + HX711 |
| Tekanan | `machine_sensors.pressure` | Sensor diferensial, unit dari perangkat |
| Gas | `machine_sensors.gas` | MQ-135, nilai ADC mentah |
| Gaya pres | `machine_sensors.press` | Umpan balik screw press |
| Batas gerak | `machine_sensors.gate` | Limit switch, boolean |

`machine_sensors` adalah ekstensi opsional `GET /api/latest`, belum dikirim
server. Nilai hilang atau `null` selalu tampil sebagai "Belum ada data".

```json
{
  "machine_sensors": {
    "press": { "value": 480, "unit": "N", "target_reached": true, "updated_at": "10:42" },
    "gate": { "limit_reached": false, "updated_at": "10:42" },
    "pressure": { "value": 101.8, "unit": "kPa", "updated_at": "10:42" },
    "gas": { "value": 1240, "unit": "ppm", "updated_at": "10:42" }
  }
}
```

Grafik memakai `sensor_history` dengan urutan lama → terbaru:

```json
{
  "sensor_history": {
    "temperature": [40.9, 41.0],
    "humidity": [61, 62],
    "pressure": [101.6, 101.8],
    "gas": [1180, 1240]
  }
}
```

Pada mode server, deret dibangun dari `log`; sensor tanpa deret tidak digambar.
`gate` tidak punya grafik karena nilainya boolean.

## Struktur

```
src/
  App.jsx               state global, routing hash, polling, pemilihan batch
  api.js                MockApi / HttpApi + pemetaan response server
  config.js             ambang, seed, daftar sensor, interval
  lib.js                format, klasifikasi, urutan keparahan
  sensors.js            nilai dan deret sensor untuk komponen
  theme.js              tema terang/gelap
  components/           Phone, TopBar, BottomNav, grafik, panel sensor, Drum3D
  views/                Ringkasan, BatchDetail, Peringatan, Akun, PcDashboard
  hooks/                useMediaQuery, useAnimatedNumber
```

## Pengujian

```bash
npm run lint   # oxlint
npm test       # node --test src/lib.test.js
```

10 tes mencakup aturan klasifikasi ambang, label status, pembacaan sensor yang
hilang, dan urutan keparahan batch.

## Build dan deploy

```bash
npm run build
```

Hasil ada di `dist/`. Sajikan lewat HTTP, jangan membuka `index.html` dengan
`file://`. `base: './'` membuat build tetap jalan di subpath. Untuk hosting
statis tanpa reverse proxy, set `VITE_API_BASE` dan izinkan origin tersebut di
`CORS_ORIGIN` server.

## Batasan dan rencana

- Capacitor, proyek native Android/iOS, dan build APK/IPA belum ada.
- `machine_sensors` belum menjadi bagian response server.
- Label klasifikasi dihitung dari ambang, bukan model Random Forest.
- Berikutnya: autentikasi operator, riwayat batch lintas siklus, dan notifikasi.

## Status

Prototipe fungsional untuk kolaborasi Pagi Farm. API dan ML berjalan terpisah;
dashboard sudah memakai kontrak v3.1.
