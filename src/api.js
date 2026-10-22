/* Lapisan API, view tidak tahu mock vs server. */
import { CONFIG, SEED, MACHINE_SENSOR_SEED, sensorHistory } from "./config";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
  getDrums() {
    return this._get("/api/drums");
  },
  getLatest(drumId) {
    return this._get(`/api/latest?drum=${encodeURIComponent(drumId)}`);
  },
};

export const Api = CONFIG.USE_MOCK ? MockApi : HttpApi;
