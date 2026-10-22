/* Layar HOME: ringkasan + navigasi batch.
   Satu model yang jujur: kartu info statis, baris batch menavigasi
   ke detail (fokus ikut berpindah), grafik mengikuti fokus.
   Tanpa sakelar ON/OFF palsu: batch tidak bisa dimatikan. */
import { fmtTemp, classify, drumTone, worstFirst } from "../lib";
import { CONFIG } from "../config";
import SensorPanel from "../components/SensorPanel";

export default function Ringkasan({ latest, drums, onSelectDrum, onGo }) {
  if (!latest) return null;
  const [sLo, sHi] = CONFIG.THRESHOLDS.suhu;
  const [hLo, hHi] = CONFIG.THRESHOLDS.hum;
  const c = classify(latest.suhu, latest.kelembapan);
  const alerts = drums.filter((d) => drumTone(d) !== "ok").length;
  const ordered = worstFirst(drums);

  const openBatch = (id) => {
    onSelectDrum(id);
    onGo("batch");
  };

  return (
    <>
      <div className="body">
        <div className="greet">
          <span className="avatar" aria-hidden="true">
            PF
          </span>
          <div>
            <strong>Hi, Pagi Farm</strong>
            <small className="muted">
              Fermentasi hari {latest.hari}/{latest.total_hari}
            </small>
          </div>
          <div className="greet-right">
            <strong className="tabular">{fmtTemp(latest.suhu)}°</strong>
            <small className="muted">{latest.drum_id}</small>
          </div>
        </div>

        <div className="home-grid">
          <div className="dev-card">
            <span className="dev-ico" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 7 10 3.5 16 7v6L10 16.5 4 13V7Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <strong>{latest.drum_id}</strong>
            <small className="muted">{latest.label}</small>
            <span className="dev-foot">
              <span className={c.target ? "mini-on" : "mini-off"}>{c.ml}</span>
            </span>
          </div>

          <div className="dev-card">
            <span className="dev-ico orange" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2.5a3 3 0 0 1 3 3v5.2a4.5 4.5 0 1 1-6 0V5.5a3 3 0 0 1 3-3ZM10 6v8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <strong className="tabular">{fmtTemp(latest.suhu)}°C</strong>
            <small className="muted">Suhu drum</small>
            <span className="dev-foot">
              <span className="muted small">
                Target {sLo}–{sHi}°C
              </span>
            </span>
          </div>

          <div className="dev-card">
            <span className="dev-ico" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2.5S4.5 9 4.5 13a5.5 5.5 0 0 0 11 0C15.5 9 10 2.5 10 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <strong className="tabular">{latest.kelembapan}%</strong>
            <small className="muted">Kelembapan</small>
            <span className="dev-foot">
              <span className="muted small">
                Target {hLo}–{hHi}%
              </span>
            </span>
          </div>

          <div className="dev-card">
            <span className="dev-ico" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 17.5a7.5 7.5 0 1 1 7.5-7.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path d="M10 10l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <strong className="tabular">{latest.progres_pct}%</strong>
            <small className="muted">
              Hari {latest.hari}/{latest.total_hari} · {latest.berat.toFixed(1)} kg
            </small>
            <span className="dev-foot">
              <span className="mini-on">{c.action}</span>
            </span>
          </div>
        </div>

        <section aria-label="Daftar batch">
          <div className="row-between" style={{ padding: "0 2px" }}>
            <strong>Batch saya</strong>
            <small className="muted">
              {drums.length} batch{alerts > 0 ? ` · ${alerts} perlu cek` : ""}
            </small>
          </div>
          <div className="batch-rows" style={{ marginTop: 8 }}>
            {ordered.map((d) => {
              const cc = classify(d.suhu, d.kelembapan);
              const focused = d.drum_id === latest.drum_id;
              return (
                <button
                  key={d.drum_id}
                  type="button"
                  className="batch-row"
                  aria-label={`Lihat detail batch ${d.drum_id}`}
                  onClick={() => openBatch(d.drum_id)}
                >
                  <span className="grow">
                    <strong>
                      {d.drum_id}
                      {focused ? " · dipantau" : ""}
                    </strong>
                    <br />
                    <small className="muted">
                      Hari {d.hari}/{d.total_hari} · {fmtTemp(d.suhu)}°C · {d.kelembapan}% RH
                    </small>
                  </span>
                  <strong className={`tag ${cc.tone}`}>{cc.ml}</strong>
                  <span className="chev" aria-hidden="true">
                    ›
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <SensorPanel latest={latest} />
      </div>
    </>
  );
}


