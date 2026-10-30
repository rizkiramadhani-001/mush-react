/* Layar KONTROLER ala referensi layar 4: kartu hijau status,
   4 metrik, 3 status, statistik + daftar kejadian. */
import { Suspense, lazy, useState } from "react";
import { fmtBerat, fmtTemp, classify, liveEventsFor, drumTone } from "../lib";
import { CONFIG, EVENTS } from "../config";
import SensorStrip from "../components/SensorStrip";

const SensorChart = lazy(() => import("../components/SensorChart"));
const WEEK_LABELS = ["H-6", "H-5", "H-4", "H-3", "H-2", "H-1", "Ini"];

export default function Peringatan({ latest, drums = [] }) {
  const [filter, setFilter] = useState("semua");
  if (!latest) return null;
  const c = classify(latest.suhu, latest.kelembapan);
  const live = liveEventsFor(latest);
  const all = [...live, ...EVENTS];
  const attention = (e) => e.tone === "warn" || e.tone === "bad";
  const shown = filter === "semua" ? all : filter === "perhatian" ? all.filter(attention) : all.filter((e) => !attention(e));
  const okCount = drums.filter((d) => drumTone(d) === "ok").length;
  const warnCount = drums.filter((d) => drumTone(d) !== "ok").length;
  const [sLo, sHi] = CONFIG.THRESHOLDS.suhu;
  const [hLo, hHi] = CONFIG.THRESHOLDS.hum;

  return (
    <>
      <div className="body">
        <section className="controller" aria-label={`Kontroler batch ${latest.drum_id}`}>
          <div className="row-between">
            <div className="ctl-id">
              <span className="ctl-ico" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M5 7.5 11 4l6 3.5v9L11 20l-6-3.5v-9Z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <strong>Batch {latest.drum_id}</strong>
                <small>{latest.label}</small>
              </div>
            </div>
            <span className="ctl-status">{c.ml}</span>
          </div>
          <p className="small">
            {latest.log.length} sensor readings · {fmtBerat(latest.berat)}
          </p>
          <div className="ctl-tabs" role="tablist" aria-label="Filter kejadian">
            {[
              ["semua", "Semua"],
              ["perhatian", "Perlu perhatian"],
              ["normal", "Normal"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={filter === id ? "ctl-tab on" : "ctl-tab"}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <div className="metric-row" role="group" aria-label="Metrik farm">
          <Metric icon="temp" value={`${fmtTemp(latest.suhu)}°C`} label="Suhu drum" sub={`Target ${sLo}–${sHi}`} />
          <Metric icon="drop" value={`${latest.kelembapan}%`} label="Moisture" sub={`Target ${hLo}–${hHi}`} />
          <Metric icon="wind" value={`${latest.hari} hr`} label="Fermentasi" sub={`dari ${latest.total_hari}`} />
          <Metric icon="rain" value={Number.isFinite(latest.berat) ? latest.berat.toFixed(1) : "—"} label="Berat kg" sub={`maks ${latest.kapasitas_kg}`} />
        </div>

        <div className="stat-row">
          <div className="card stat-mini">
            <strong className="tabular">{okCount}</strong>
            <small className="muted">Dalam target</small>
          </div>
          <div className="card stat-mini">
            <strong className="tabular">{warnCount}</strong>
            <small className="muted">Perlu pantau</small>
          </div>
          <div className="card stat-mini">
            <strong className="tabular">{latest.progres_pct}%</strong>
            <small className="muted">Progres</small>
          </div>
        </div>

        <SensorStrip latest={latest} />

        <section className="card" aria-label="Tren suhu 7 hari">
          <div className="row-between">
            <strong>Suhu 7 hari dalam target?</strong>
            <small className="muted">{c.target ? "Ya" : "Belum"}</small>
          </div>
          <Suspense fallback={<div className="chart-loading">Memuat grafik…</div>}>
            <SensorChart
              data={latest.h7}
              name="alert-temperature"
              unit="°C"
              xLabels={WEEK_LABELS}
              band={CONFIG.THRESHOLDS.suhu}
              height={150}
            />
          </Suspense>
          <div className="stat-foot">
            <div>
              <small className="muted">Reading terakhir</small>
              <br />
              <strong className="tabular">
                {latest.log[0]?.t ?? "--:--"} · {latest.log[0] ? fmtTemp(latest.log[0].suhu) : "--"}°C
              </strong>
            </div>
            <div className="right">
              <small className="muted">Status ML</small>
              <br />
              <strong className={`tag ${c.tone}`}>{c.ml}</strong>
            </div>
          </div>
          <p className="small muted">{c.action}</p>
        </section>

        <section className="card events" aria-label="Riwayat kejadian">
          <div className="row-between">
            <strong>Kejadian</strong>
            <small className="muted">
              {warnCount > 0 ? `${warnCount} batch perlu perhatian` : "Semua batch normal"}
            </small>
          </div>
          {shown.length === 0 ? (
            <p className="small muted" role="status">
              Belum ada kejadian pada filter ini.
            </p>
          ) : (
            shown.map((ev) => (
              <div key={`${ev.when}-${ev.title}`} className={`ev ${ev.tone}-l`}>
                <small className="muted">{ev.when}</small>
                <strong>{ev.title}</strong>
                <span className={`tag ${ev.tone}`}>{ev.status}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}

function Metric({ icon, value, label, sub }) {
  const paths = {
    temp: "M10 17.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v8A3.5 3.5 0 0 0 10 17.5ZM10 6v7",
    drop: "M10 2.5S4.5 9 4.5 13a5.5 5.5 0 0 0 11 0C15.5 9 10 2.5 10 2.5Z",
    wind: "M3 8h9a2.5 2.5 0 1 0-2.5-2.5M3 12h13a2.5 2.5 0 1 1-2.5 2.5",
    rain: "M6 13v4M10 13v4M14 13v4M7 10a5 5 0 0 1 10 0",
  };
  return (
    <div className="metric">
      <span className="m-ico" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d={paths[icon]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <strong className="tabular">{value}</strong>
      <small className="muted">{label}</small>
      <small className="muted dim">{sub}</small>
    </div>
  );
}
