# MUSH / Field Console · Ionic React

Responsive dashboard for MUSH fermentation monitoring on mobile and desktop.

**Stack:** React 19, Ionic React, Vite

## Portfolio snapshot

- One responsive product surface with separate mobile and desktop layouts
- Mock and HTTP data adapters for local development and API integration
- Route-based views for summary, batch detail, alerts, and account settings
- Lint, unit test, and production build scripts

**Related repositories:** [MUSH Server](https://github.com/rizkiramadhani-001/mush-server) · [MUSH ML](https://github.com/rizkiramadhani-001/mush-ml) · [MUSH landing page](https://github.com/rizkiramadhani-001/landing)

Dashboard pemantauan fermentasi Pagi Farm, menggunakan Ionic React, React 19,
dan Vite. Data contoh aktif secara default melalui `src/config.js`.

## Jalankan

```bash
npm install
npm run dev
```

```bash
npm run lint
npm test
npm run build
npm run preview
```

Build web tersedia di `dist/`. Sajikan melalui HTTP, bukan membuka `index.html`
langsung dengan `file://`.

## Ionic dan navigasi

- `src/main.jsx`: `setupIonicReact()`, stylesheet Ionic, dan `IonApp`.
- `src/components/Phone.jsx`: `IonPage`, `IonHeader`, `IonContent`, dan
  `IonFooter`. Header dan navigasi tetap terlihat; hanya konten yang bergulir.
- Tarik konten ke bawah untuk memperbarui data (`IonRefresher`). Tombol tengah
  juga memperbarui data, dengan umpan balik `IonToast`.
- Route hash: `#/ringkasan`, `#/batch`, `#/peringatan`, `#/akun`.
  Mendukung tautan langsung, reload, serta tombol Back/Forward browser tanpa
  aturan fallback khusus pada server.
- Layar di bawah 1024px menggunakan tampilan mobile; layar lebih lebar memakai
  `PcDashboard` dalam Ionic page/content. Route dan pilihan batch digunakan
  bersama. Hanya satu halaman aktif yang di-mount pada mobile.
- Navigasi tab dan sidebar tetap memakai komponen React proyek ini; aplikasi
  tidak menggunakan `IonRouterOutlet` atau animasi stack navigasi Ionic.

## Data

`src/config.js` menyimpan ambang, seed, dan interval polling.
`src/api.js` menyediakan MockApi / HttpApi. Polling berhenti saat tab tersembunyi;
HTTP request memiliki timeout delapan detik. Simulasi data tersedia pada tombol
demo desktop, bukan pada tombol sinkronisasi mobile.

Untuk backend, gunakan `USE_MOCK: false` dan `API_BASE` di konfigurasi.
Kontrak referensi tersedia di `../mush-dashboard/api-contract.json`.
Perhatikan bahwa adapter React saat ini mengharapkan `getDrums()` berupa array
snapshot lengkap; kontrak v3.1 mengembalikan `{ drums: [{ id }] }`. Adapter API
perlu disamakan sebelum memakai server tersebut.

## Android / iOS

Konversi ini mencakup aplikasi web Ionic. Capacitor, proyek native Android/iOS,
dan build APK/IPA belum ditambahkan. `ionic.config.json` mendeskripsikan proyek
Ionic React berbasis Vite.

## Sensor MUSH

Panel Sensor MUSH pada Ringkasan (mobile dan desktop) mengikuti
`PROPOSAL BARU IOT - TERISI.docx`: sensor tekan
(2.3.1), load cell 5 kg + HX711 dan limit switch (2.3.2), DS18B20 (2.4.1).
Motor, penyemprot, heat sealer, RF433, dan wireless coil bukan sensor pembacaan.
Proposal menyebut pH sebagai evaluasi kualitas, bukan sensor pH terpasang.

- Suhu menggunakan `latest.suhu`; berat menggunakan field lama `latest.berat`.
- Data pres dan limit switch merupakan telemetri lini robotik bersama,
  bukan sensor terpisah untuk setiap drum. Kendalinya tetap pada kontroler lokal.
- `MACHINE_SENSOR_SEED` di `src/config.js` bernilai null sampai ada data.
- `machine_sensors` adalah ekstensi opsional response `GET /api/latest` untuk
  frontend ini, belum endpoint atau kemampuan server yang telah diimplementasikan.

```json
{
  "machine_sensors": {
    "press": null,
    "gate": null
  }
}
```

Saat tersedia, isi objek berikut dari pengukuran/keputusan kontroler:

| Objek | Field | Arti |
|---|---|---|
| `press` | `value` (number), `unit` (string) | Gaya/tekanan terkalibrasi, unit wajib dari perangkat |
| `press` | `target_reached` (boolean) | Keputusan batas pres dari kontroler |
| `gate` | `limit_reached` (boolean) | Kontak batas terpicu; tidak menyimpulkan pintu terbuka/tertutup |
| Semua objek | `updated_at` (string) | Waktu pengukuran robotik, terpisah dari suhu drum |

Nilai hilang/null ditampilkan sebagai belum tersedia, bukan nol atau offline.
Tidak ada batas tekanan atau unit yang diasumsikan oleh aplikasi. Field kelembapan
lama tetap dipertahankan, dengan catatan model sensor tidak ditentukan proposal.

### Grafik tren

Grafik pada panel sensor memakai `sensor_history` dari `GET /api/latest`:

```json
{
  "sensor_history": {
    "temperature": [40.9, 41.0],
    "humidity": [61, 62],
    "press": [470, 480],
    "pressure": [101.6, 101.8],
    "gas": [1180, 1240]
  }
}
```

- Deret dibaca dari indeks 0 (24 jam lalu) ke indeks terakhir (bacaan terkini).
- `temperature` dan `humidity` boleh memakai pita target. `press`, `pressure`, dan
  `gas` digambar tanpa pita karena ambangnya belum ditetapkan tim.
- Sensor tanpa deret tidak digambar. `gate` tidak punya grafik karena nilainya
  boolean, bukan angka.
- Pada mode contoh, `sensorHistory()` di `src/config.js` membuat deret 24 jam
  deterministik yang dihitung mundur dari nilai terkini, sehingga titik terakhir
  selalu sama dengan bacaan live.