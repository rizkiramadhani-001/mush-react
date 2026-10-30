/* Lapisan API, view tidak tahu mock vs server. */
import { CONFIG, SEED, MACHINE_SENSOR_SEED, sensorHistory } from "./config";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_LABEL = "Pakan silase premium · 5 kg";

function snapshot(drumId) {
  const s = SEED[drumId];
  return {
    drum_id: drumId,
    label: s.label,
    started: s.started,
    suhu: s.suhu,
    kelembapan: s.hum,
    berat: s.berat,
    kapasitas_kg: CONFIG.KAPASITAS_KG,
    hari: s.day,
    total_hari: s.total,
    progres_pct: Math.round((s.day / s.total) * 100),
    sinkron: s.log[0]?.t ?? "--:--",
    sumber: `sensor drum ${drumId}`,
    h24: [...s.h24],
    h7: [...s.h7],
    log: s.log.map((r) => ({ ...r })),
    machine_sensors: structuredClone(MACHINE_SENSOR_SEED),
    sensor_history: sensorHistory(drumId),
  };
}

/* Deret grafik dari log bacaan server. Sensor tanpa nilai lengkap tidak
   dibuat, supaya grafik tidak menampilkan angka palsu. */
function seriesFrom(log, key) {
  const values = log
    .map((row) => (row[key] == null ? null : Number(row[key])))
    .reverse();
  return values.length && values.every(Number.isFinite) ? values : null;
}

/* Kontrak server v3.1 lebih ramping dari bentuk snapshot yang dipakai view.
   Field yang tidak dikirim server diisi netral, bukan telemetri karangan. */
function fromServer(body) {
  const log = Array.isArray(body.log) ? body.log : [];
  return {
    drum_id: body.drum_id,
    label: body.label ?? DEFAULT_LABEL,
    started: body.started ?? "belum dicatat",
    suhu: Number(body.suhu),
    kelembapan: body.kelembapan ?? null,
    tekanan: body.tekanan ?? null,
    gas: body.gas ?? null,
    berat: body.berat == null ? null : Number(body.berat),
    kapasitas_kg: CONFIG.KAPASITAS_KG,
    hari: body.hari ?? 0,
    total_hari: body.total_hari ?? CONFIG.THRESHOLDS.fermentDays,
    progres_pct: body.progres_pct ?? 0,
    sinkron: body.sinkron ?? "--:--",
    sumber: body.sumber ?? `sensor drum ${body.drum_id}`,
    status: body.status,
    ml_label: body.ml_label,
    h24: Array.isArray(body.h24) ? body.h24 : [],
    h7: Array.isArray(body.h7) ? body.h7 : [],
    log: log.map((row) => ({ ...row })),
    machine_sensors: undefined,
    sensor_history: {
      temperature: seriesFrom(log, "suhu"),
      humidity: seriesFrom(log, "hum"),
      pressure: seriesFrom(log, "tekanan"),
      gas: seriesFrom(log, "gas"),
    },
  };
}

const MockApi = {
  async getDrums() {
    await wait(350);
    return Object.keys(SEED).map((id) => snapshot(id));
  },
  async getLatest(drumId) {
    await wait(250);
    if (!SEED[drumId]) throw new Error(`Batch ${drumId} tidak dikenal`);
    return snapshot(drumId);
  },
};

const HttpApi = {
  async _get(path) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(CONFIG.API_BASE + path, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${path}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  },
  async getDrums() {
    const body = await this._get("/api/drums");
    const ids = (body.drums ?? []).map((drum) => drum.id).filter(Boolean);
    const results = await Promise.allSettled(
      ids.map((id) => this.getLatest(id)),
    );
    return results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
  },
  async getLatest(drumId) {
    const body = await this._get(
      `/api/latest?drum=${encodeURIComponent(drumId)}`,
    );
    return fromServer(body);
  },
};

export const Api = CONFIG.USE_MOCK ? MockApi : HttpApi;
