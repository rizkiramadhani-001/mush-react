/* Helper murni: format + klasifikasi status (aturan ambang).
   Model ML penuh (Random Forest / Isolation Forest) jalan di server;
   aplikasi hanya menampilkan label agar tetap informatif saat offline. */
import { CONFIG } from "./config.js";

export const fmtTemp = (v) => Number(v).toFixed(1);

export function classify(
  suhu,
  hum,
  [sLo, sHi] = CONFIG.THRESHOLDS.suhu,
  [hLo, hHi] = CONFIG.THRESHOLDS.hum,
) {
  const sOk = suhu >= sLo && suhu <= sHi;
  const hOk = hum >= hLo && hum <= hHi;
  if (sOk && hOk)
    return {
      tone: "ok",
      target: true,
      ml: "Asam laktat",
      action: "Tidak ada tindakan diperlukan",
      desc: "Semua parameter berada dalam target.",
    };
  if (suhu > sHi)
    return {
      tone: "bad",
      target: false,
      ml: "Anomali: cek udara",
      action: "Perlu pemeriksaan drum",
      desc: `Suhu ${suhu.toFixed(1)}°C melebihi batas ${sHi}°C, kemungkinan kontaminasi udara.`,
    };
  if (suhu < sLo)
    return {
      tone: "warn",
      target: false,
      ml: "Awal fermentasi",
      action: "Pantau lebih sering",
      desc: `Suhu ${suhu.toFixed(1)}°C di bawah target (fase awal, pantau lebih sering).`,
    };
  return {
    tone: "warn",
    target: false,
    ml: "Perlu perhatian",
    action: "Perlu pemeriksaan drum",
    desc: `Kelembapan ${hum}% di luar target ${hLo}–${hHi}%.`,
  };
}

/** Kejadian live turunan dari data, untuk daftar riwayat (paling atas saat anomali). */
export function liveEventsFor(latest) {
  if (!latest) return [];
  const c = classify(latest.suhu, latest.kelembapan);
  if (c.target) return [];
  return [
    {
      when: latest.log[0]?.t ?? "Baru",
      title: c.tone === "bad" ? "Suhu di luar target" : "Parameter perlu perhatian",
      status: "Perlu cek",
      tone: "warn",
    },
  ];
}

/** Urutan keparahan untuk alarm-first: bermasalah dulu, normal terakhir. */
export const SEVERITY = { bad: 0, warn: 1, ok: 2 };

export function drumTone(d) {
  return classify(d.suhu, d.kelembapan).tone;
}

/** Salinan daftar drum terurut yang terburuk dulu (seleksi tidak berubah). */
export function worstFirst(drums) {
  return [...drums].sort((a, b) => SEVERITY[drumTone(a)] - SEVERITY[drumTone(b)]);
}
