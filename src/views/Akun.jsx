/* Layar GATEWAY ala referensi layar 5: kartu hijau gateway,
   ringkasan pemakaian (pakai angka sensor asli), daftar perangkat. */
import { fmtTemp, classify } from "../lib";
import { CONFIG } from "../config";
import SensorStrip from "../components/SensorStrip";

export default function Akun({ latest, drums = [], drumId, onRetry }) {
  const [sLo, sHi] = CONFIG.THRESHOLDS.suhu;
  const avg = latest && latest.h24.length ? latest.h24.reduce((a, b) => a + b, 0) / latest.h24.length : null;

  return (
    <>
      <div className="body">
        <section className="controller" aria-label="Gateway ESP32 RF433">
          <div className="row-between">
            <div className="ctl-id">
              <span className="ctl-ico" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 9a8 8 0 0 1 14 0M6.5 11.5a5 5 0 0 1 9 0M9 14a2 2 0 0 1 4 0" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
                  <circle cx="11" cy="17" r="1.3" fill="#fff" />
                </svg>
              </span>
              <div>
                <strong>ESP32 Gateway</strong>
                <small>RF433 · DS18B20 dalam drum</small>
              </div>
            </div>
            <span className="ctl-status">Online · {latest?.sinkron ?? "--:--"}</span>
          </div>
          <p className="small">Batch aktif: {drumId ?? "-"} · Sinkron {latest?.sinkron ?? "--:--"}</p>
          <p className="small">
            RF433 · {drums.length} drum terpantau · Polling tiap {CONFIG.POLL_MS / 1000} detik
          </p>
        </section>

        <div className="two-col">
          <div className="card mini-stat">
            <small className="muted">Rata-rata suhu</small>
            <strong className="tabular">{avg == null ? "--" : `${fmtTemp(avg)}°C`}</strong>
            <small className="muted">24 reading terakhir</small>
          </div>
          <div className="card mini-stat">
            <small className="muted">Target fermentasi</small>
            <strong className="tabular">{CONFIG.THRESHOLDS.fermentDays} hari</strong>
            <small className="muted">
              Suhu {sLo}–{sHi}°C
            </small>
          </div>
        </div>

        <SensorStrip latest={latest} title="Sensor aktif" />

        <section className="card" aria-label="Reading per batch">
          <strong>Reading per batch</strong>
          <p className="small muted">
            Tren suhu per sensor ada di panel Tren sensor.
          </p>
          {latest ? null : (
            <p className="small muted" role="status">
              Belum ada data sensor.
            </p>
          )}
          <div className="usage-list">
            {drums.map((d) => (
              <div key={d.drum_id} className="usage-row">
                <span className="dev-ico sm" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M4 7 10 3.5 16 7v6L10 16.5 4 13V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <strong>
                    {fmtTemp(d.suhu)}°C · {d.kelembapan}% RH
                  </strong>
                  <br />
                  <small className="muted">
                    Batch {d.drum_id} · Hari {d.hari}/{d.total_hari}
                  </small>
                </div>
                <strong className={`tag ${classify(d.suhu, d.kelembapan).tone}`}>
                  {classify(d.suhu, d.kelembapan).ml}
                </strong>
              </div>
            ))}
          </div>
          <button type="button" className="btn wide" onClick={onRetry}>
            Sinkronkan data
          </button>
          <p className="small muted">Versi {CONFIG.VERSION} · interval {CONFIG.POLL_MS / 1000} dtk</p>
        </section>
      </div>
    </>
  );
}
