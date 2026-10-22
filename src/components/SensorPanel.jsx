import { lazy, Suspense } from "react";
import { CONFIG, SENSORS } from "../config";
import { sensorDetail, sensorReading, sensorSeries } from "../sensors";

const SensorChart = lazy(() => import("./SensorChart"));

const UNITS = { pressure: "kPa", gas: "ppm" };
const DECIMALS = { pressure: 1, gas: 0 };
/* Semua grafik berbagi syncId agar kursor dan tooltip menunjukkan
   jam yang sama di keempat sensor (small multiples). */
const SYNC_ID = "mush-24h";

const byMode = (mode) => SENSORS.filter((sensor) => sensor.mode === mode);

export default function SensorPanel({ latest }) {
  const continuous = byMode("continuous");

  return (
    <section className="sensor-panel" aria-label="Sensor MUSH">
      <div className="sensor-panel-head">
        <h2>Sensor MUSH</h2>
        <span className="badge">{CONFIG.USE_MOCK ? "Data contoh" : "Telemetri"}</span>
      </div>
      <p className="small muted">
        Tren 24 jam untuk batch {latest?.drum_id ?? "belum dipilih"}. Arahkan kursor ke salah
        satu grafik untuk membandingkan jam yang sama di semua sensor.
      </p>

      <section className="sensor-group" aria-label="Sensor yang dipantau terus">
        <h3 className="sensor-group-head">Dipantau selama fermentasi</h3>
        <p className="small muted">
          Suhu dan kelembapan ada di proposal; tekanan dan gas masih usulan tim.
        </p>
        <div className="sensor-cards">
          {continuous.map((sensor) => {
            const status = sensorDetail(sensor.id, latest);
            const series = sensorSeries(sensor.id, latest);
            return (
              <article className="sensor-chart-card" key={sensor.id}>
                <div className="sensor-head">
                  <h4>{sensor.name}</h4>
                  <strong className="sensor-now tabular">{sensorReading(sensor.id, latest)}</strong>
                </div>
                <p className="small sensor-foot">
                  <span className={status === "Di luar target" ? "sensor-warn" : "sensor-state"}>
                    {status}
                  </span>
                  {sensor.threshold ? ` · ${sensor.threshold()}` : ""}
                </p>
                {series ? (
                  <Suspense fallback={<div className="chart-loading">Memuat grafik…</div>}>
                    <SensorChart
                      data={series}
                      name={sensor.id}
                      unit={UNITS[sensor.id] ?? ""}
                      decimals={DECIMALS[sensor.id] ?? 1}
                      band={sensor.band?.() ?? null}
                      syncId={SYNC_ID}
                    />
                  </Suspense>
                ) : (
                  <p className="small muted chart-missing">
                    Riwayat belum tersedia, grafik tidak ditampilkan.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}