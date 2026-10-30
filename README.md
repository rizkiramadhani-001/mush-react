# MUSH React · Field Console

Dashboard pemantauan fermentasi silase Pagi Farm. Satu aplikasi React yang
menyesuaikan diri: tampilan ponsel di bawah 1024px, dasbor multi-halaman di
layar lebar. Data produksi dibaca dari [`mush-server`](https://github.com/rizkiramadhani-001/mush-server).

**Stack:** React 19 · Ionic React 9 · Vite 8 · Recharts · Three.js

## Ringkasan

- Empat layar: ringkasan, detail batch, peringatan, dan akun.
- Satu sumber ambang dan data contoh di `src/config.js`.
- Adapter data ganda: `MockApi` untuk demo, `HttpApi` untuk server.
- Polling 10 detik, berhenti saat tab tidak terlihat.
- Tema terang/gelap mengikuti preferensi sistem dan tersimpan di perangkat.
- Satuan metrik, tabel target, dan label status konsisten di mobile dan desktop.

## Alur data

```
mush-server ──GET /api/drums──┐
             ──GET /api/latest?drum=B-024──┐
                                           ▼
                                   src/api.js (HttpApi)
                                           │  dipetakan ke snapshot view
                                           ▼
                                   App.jsx ──► views/components
```

`mush-react` tidak menulis data. Input bacaan dan event berasal dari gateway
ESP32 lewat `mush-server`.

## Menjalankan

Kebutuhan: Node.js 20+ dan `mush-server` yang berjalan di
`http://127.0.0.1:8080`.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Vite meneruskan `/api` dan `/health` ke
`127.0.0.1:8080`, sehingga browser tidak terkena CORS.

Perintah lain:

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

`HttpApi` memanggil dua endpoint:

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

Deret grafik hanya dibuat bila semua nilai dalam log terisi, sehingga tidak ada
angka pengganti saat sensor belum mengirim data.

Bila `API_BASE` diisi langsung tanpa proxy, tambahkan origin dashboard ke
`CORS_ORIGIN` di `mush-server`.

## Layar dan navigasi

Route hash: `#/ringkasan`, `#/batch`, `#/peringatan`, `#/akun`. Tautan langsung,
reload, dan tombol Back/Forward browser bekerja tanpa aturan fallback server.

- Di bawah 1024px: `Phone.jsx` dengan `IonPage`, header, konten yang bergulir,
  dan navigasi bawah. Tarik ke bawah (`IonRefresher`) atau tombol tengah untuk
  memperbarui data.
- 1024px ke atas: `PcDashboard.jsx` dengan navigasi samping dan konten yang sama.
  Hanya satu mode yang di-mount dalam satu waktu.
- Pilihan batch disimpan di `localStorage` dan dipakai bersama oleh kedua mode.
- Tema memakai `useSyncExternalStore`; nilai awal dari penyimpanan, lalu
  preferensi OS.

## Sensor dan telemetri

Panel sensor mengikuti proposal IoT: DS18B20 untuk suhu, load cell 5 kg + HX711
untuk berat, sensor tekan untuk gaya pres, dan limit switch untuk batas gerak.
Kelembapan, tekanan, dan gas masih berstatus usulan tim; ambang dan satuannya
tidak ditebak aplikasi.

| Sensor | Sumber tampilan |
|---|---|
| Suhu drum | `latest.suhu` |
| Kelembapan | `latest.kelembapan` |
| Berat kemasan | `latest.berat` |
| Tekanan | `machine_sensors.pressure` |
| Gas | `machine_sensors.gas` |
| Gaya pres | `machine_sensors.press` |
| Batas gerak | `machine_sensors.gate` |

`machine_sensors` adalah ekstensi opsional `GET /api/latest`, bukan kemampuan
server yang sudah diimplementasikan. Bentuknya:

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

Nilai hilang atau `null` selalu tampil sebagai "Belum ada data", bukan nol.

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

Pada mode server, deret tersebut dibangun `src/api.js` dari `log`. Sensor tanpa
deret tidak digambar; `gate` tidak punya grafik karena nilainya boolean.

## Build dan deploy

```bash
npm run build
```

Hasil ada di `dist/`. Sajikan lewat HTTP, jangan membuka `index.html` dengan
`file://`. `base: './'` membuat build tetap jalan di subpath.

Untuk hosting statis tanpa reverse proxy, set `VITE_API_BASE` saat build dan
izinkan origin tersebut di `CORS_ORIGIN` server.

## Pengujian

```bash
npm run lint   # oxlint
npm test       # node --test src/lib.test.js
```

Tes mencakup aturan klasifikasi ambang, label status, dan pembacaan sensor yang
hilang.

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

## Batasan

- Capacitor dan proyek native Android/iOS belum ada; ini aplikasi web Ionic.
- `machine_sensors` belum dikirim server, jadi sebagian panel menampilkan
  "Belum ada data".
- Label klasifikasi dihitung dari ambang, bukan model Random Forest.

## Repo terkait

- [MUSH Server](https://github.com/rizkiramadhani-001/mush-server) — API, Prisma, PostgreSQL
- [MUSH ML](https://github.com/rizkiramadhani-001/mush-ml) — layanan prediksi FastAPI
- [Landing page](https://github.com/rizkiramadhani-001/landing)
