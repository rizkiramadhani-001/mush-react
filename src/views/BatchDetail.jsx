/* Layar BATCH ala referensi layar 2: kartu sambutan hijau,
   grid 2x2 batch, dua kartu timbangan. */
import { Suspense, lazy } from "react";
import { fmtBerat, fmtTemp, classify } from "../lib";
import { CONFIG } from "../config";
import SensorStrip from "../components/SensorStrip";

const TrendChart = lazy(() => import("../components/TrendChart"));

export default function BatchDetail({ latest, drums = [], drumId, onSelectDrum }) {
  if (!latest) return null;
  const c = classify(latest.suhu, latest.kelembapan);
  const [sLo, sHi] = CONFIG.THRESHOLDS.suhu;

  return (
    <>
      <div className="body">
        <section className="welcome" aria-label="Sambutan batch">
          <div className="welcome-text">
            <strong>Welcome</strong>
            <span>To Pagi Farm Fermentasi</span>
            <small>
              {latest.label} · Target {sLo}–{sHi}°C
            </small>
            <div className="welcome-pills">
              <span>Batch {latest.drum_id}</span>
              <span>
                Hari {latest.hari}/{latest.total_hari}
              </span>
              <span>{c.ml}</span>
            </div>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              <rect x="14" y="20" width="44" height="40" rx="10" fill="#fff" opacity="0.92" />
              <rect x="14" y="20" width="44" height="12" rx="6" fill="#0aa37e" opacity="0.35" />
              <path d="M28 44h16M28 50h10" stroke="#0b6b4f" strokeWidth="3" strokeLinecap="round" />
              <circle cx="50" cy="28" r="8" fill="#d6e69c" />
            </svg>
          </div>
        </section>

        <div className="seg" role="group" aria-label="Pilih batch yang dipantau">
          {drums.map((d) => {
            const cc = classify(d.suhu, d.kelembapan);
            const sel = d.drum_id === drumId;
            return (
              <button
                key={d.drum_id}
                type="button"
                className={sel ? "seg-btn on" : "seg-btn"}
                aria-pressed={sel}
                aria-label={`Pantau batch ${d.drum_id}, hari ${d.hari} dari ${d.total_hari}, ${cc.ml}`}
                onClick={() => onSelectDrum(d.drum_id)}
              >
                {d.drum_id}
                <small>
                  H{d.hari}/{d.total_hari}
                </small>
              </button>
            );
          })}
        </div>

        <div className="two-col">
          <div className="card mini-stat">
            <span className="dev-ico" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2v16M4 6l6-4 6 4M4 6v8l6 4 6-4V6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </span>
            <small className="muted">Berat paket</small>
            <strong className="tabular">{fmtBerat(latest.berat)}</strong>
            <small className="muted">maks {latest.kapasitas_kg} kg</small>
            <div
              className="bar"
              role="progressbar"
              aria-label="Kapasitas paket"
              aria-valuemin="0"
              aria-valuemax={latest.kapasitas_kg}
              aria-valuenow={latest.berat ?? 0}
            >
              <div className="fill" style={{ "--p": (latest.berat ?? 0) / latest.kapasitas_kg }} />
            </div>
          </div>
          <div className="card mini-stat">
            <span className="dev-ico" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 10V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <small className="muted">Progres fermentasi</small>
            <strong className="tabular">{latest.progres_pct}%</strong>
            <small className="muted">
              {latest.total_hari - latest.hari} hari menuju target
            </small>
            <div
              className="bar"
              role="progressbar"
              aria-label="Progres fermentasi"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={latest.progres_pct}
            >
              <div className="fill" style={{ "--p": latest.progres_pct / 100 }} />
            </div>
          </div>
        </div>

        <SensorStrip latest={latest} />

        <section className="card" aria-label="Tren suhu 7 hari">
          <div className="row-between">
            <strong>Suhu 7 hari</strong>
            <small className="muted">{latest.sumber}</small>
          </div>
          <Suspense fallback={<div className="skeleton" style={{ height: 170, marginTop: 8 }} />}>
            <TrendChart
              data={latest.h7}
              min={CONFIG.CHART.min}
              max={CONFIG.CHART.max}
              band={CONFIG.THRESHOLDS.suhu}
              label="Suhu 7 hari"
              xLabels={["H-6", "H-4", "H-2", "Hari ini"]}
            />
          </Suspense>
        </section>

        <section className="card" aria-label="Pembacaan terakhir">
          <strong>Pembacaan terakhir</strong>
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Tabel pembacaan terakhir, geser untuk melihat semua"
          >
            <table className="readings">
              <caption className="visually-hidden">Pembacaan suhu terakhir</caption>
              <thead>
                <tr>
                  <th scope="col">Waktu</th>
                  <th scope="col" className="num">
                    Suhu
                  </th>
                  <th scope="col" className="num">
                    Rh
                  </th>
                </tr>
              </thead>
              <tbody>
                {latest.log.map((r, i) => (
                  <tr key={`${r.t}-${i}`}>
                    <td>{r.t}</td>
                    <td className="num">{fmtTemp(r.suhu)}°C</td>
                    <td className="num">{r.hum}% RH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
