/* Mode PC: dasbor multi-halaman untuk layar lebar (navigasi samping).
   Isi tiap halaman sama dengan tab HP; hanya satu mode yang di-mount
   dalam satu waktu (lihat App.jsx) sehingga tidak ada ID ganda.
   Animasi: pergantian halaman memakai fade+naik 260ms (kontinuitas
   ruang antar halaman, MOTION 2), indikator aktif statis tanpa loop. */
import { Suspense, lazy, useState } from "react";
import { classify, fmtBerat, fmtTemp, liveEventsFor, worstFirst, drumTone } from "../lib";
import { CONFIG, EVENTS } from "../config";
import BottomNav from "../components/BottomNav";
import SensorPanel from "../components/SensorPanel";
import SensorStrip from "../components/SensorStrip";
import useAnimatedNumber from "../hooks/useAnimatedNumber";

const TrendChart = lazy(() => import("../components/TrendChart"));
const SensorChart = lazy(() => import("../components/SensorChart"));
const WEEK_LABELS = ["H-6", "H-5", "H-4", "H-3", "H-2", "H-1", "Ini"];
const chartFallback = <div className="skeleton" style={{ height: 170, marginTop: 8 }} />;

export default function PcDashboard({
  page,
  onGo,
  latest,
  drums,
  drumId,
  loading,
  error,
  onSelectDrum,
  onSimulate,
  onAction,
  actionLabel,
  onRetry,
}) {
  const [sLo, sHi] = CONFIG.THRESHOLDS.suhu;
  const [hLo, hHi] = CONFIG.THRESHOLDS.hum;
  const top = latest ? classify(latest.suhu, latest.kelembapan) : null;

  return (
    <div className="pc-wrap" id="main" tabIndex={-1}>
      <h1 className="visually-hidden">Dasbor MUSH Pagi Farm</h1>
      <header className="pc-topbar card">
        <div className="pc-brand">
          <span className="pc-mark" aria-hidden="true">
            M
          </span>
          <div>
            <strong>MUSH · Pagi Farm</strong>
            <br />
            <small className="muted">Pemantauan fermentasi</small>
          </div>
        </div>
        <div className="pc-controls">
          {top && (
            <span className="pc-status" role="status">
              <strong className={`tag ${top.tone}`}>{top.ml}</strong>
            </span>
          )}
          <label className="visually-hidden" htmlFor="pc-drum-select">
            Pilih batch
          </label>
          <select
            id="pc-drum-select"
            className="field"
            value={drumId}
            onChange={(e) => onSelectDrum(e.target.value)}
          >
            {drums.map((d) => (
              <option key={d.drum_id} value={d.drum_id}>
                 Batch {d.drum_id}
              </option>
            ))}
          </select>
          {CONFIG.USE_MOCK && (
            <button type="button" className="btn" onClick={onSimulate}>
              Simulasi reading
            </button>
          )}
        </div>
      </header>

      {loading && !latest && (
        <div className="card" role="status" aria-label="Memuat data sensor">
          <div className="skeleton" style={{ width: "40%" }} />
          <div className="skeleton" style={{ width: "80%", marginTop: 8 }} />
          <p className="small muted" style={{ marginTop: 8 }}>
            Memuat data sensor…
          </p>
        </div>
      )}

      {error && (
        <div className="card" role="alert">
          <span className="icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong>Mode contoh (offline)</strong>
            <br />
            <small className="muted">{error}</small>
            <br />
            <button type="button" className="btn secondary" onClick={onRetry} style={{ marginTop: 8 }}>
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {!latest && !loading && !error && (
        <div className="card" role="status">
          <p>
            <strong>Belum ada data sensor.</strong>
          </p>
          <p className="small muted">Periksa koneksi gateway, lalu muat ulang.</p>
          <button type="button" className="btn secondary" onClick={onRetry} style={{ marginTop: 8 }}>
            Coba lagi
          </button>
        </div>
      )}

      {latest && (
        <div className="pc-shell">
          <aside className="pc-nav card" aria-label="Navigasi dasbor">
            <p className="pc-nav-label">Workspace</p>
            <BottomNav active={page} onGo={onGo} onAction={onAction} actionLabel={actionLabel} />
            <div className="pc-nav-footer"><strong>Pagi Farm</strong><small>{CONFIG.USE_MOCK ? "Data contoh · mode demo" : "Data dari server API"}</small><span>{drums.length} batch terdaftar</span></div>
          </aside>
          {/* key memicu ulang animasi entrance tiap ganti halaman. */}
          <div className="pc-page" key={page}>
            <div className="pc-page-heading"><div><p>Pagi Farm / {page === "ringkasan" ? "Ringkasan" : page === "batch" ? "Batch" : page === "peringatan" ? "Peringatan" : "Profil"}</p><h2>{page === "ringkasan" ? "Kondisi farm hari ini" : page === "batch" ? "Pantau fermentasi" : page === "peringatan" ? "Peringatan & kejadian" : "Profil & perangkat"}</h2></div><div className="pc-updated"><span>Pembacaan terakhir</span><strong>{latest.sinkron}</strong></div></div>
            {page === "ringkasan" && (
              <PageRingkasan
                latest={latest}
                drums={drums}
                drumId={drumId}
                sLo={sLo}
                sHi={sHi}
                hLo={hLo}
                hHi={hHi}
                onSelectDrum={onSelectDrum}
              />
            )}
            {page === "batch" && (
              <PageBatch latest={latest} drums={drums} drumId={drumId} onSelectDrum={onSelectDrum} />
            )}
            {page === "peringatan" && <PagePeringatan latest={latest} drums={drums} drumId={drumId} />}
            {page === "akun" && <PageAkun latest={latest} />}
          </div>
        </div>
      )}
    </div>
  );
}

function PageRingkasan({ latest, drums, drumId, sLo, sHi, hLo, hHi, onSelectDrum }) {
  const c = classify(latest.suhu, latest.kelembapan);
  const suhuAnim = useAnimatedNumber(latest.suhu);
  const ordered = worstFirst(drums);
  const needy = ordered.filter((d) => drumTone(d) !== "ok");

  return (
    <>
      <h2 className="pc-h">Kondisi saat ini</h2>
      {needy.length > 0 && (
        <div className="alarm-strip" data-tone={drumTone(needy[0])} role="alert" style={{ marginBottom: 14 }}>
          <span className="grow">
            <strong>Perlu cek: {needy[0].drum_id}</strong>{" "}
            <small className="muted">
              {classify(needy[0].suhu, needy[0].kelembapan).desc}
              {needy.length > 1 ? ` · +${needy.length - 1} lainnya` : ""}
            </small>
          </span>
          <button type="button" className="btn" onClick={() => onSelectDrum(needy[0].drum_id)}>
            Lihat
          </button>
        </div>
      )}
      <section className="pc-kpis" aria-label="Kondisi saat ini">
        <div className="card hero">
          <p className="status-line" data-tone={c.tone}>
            <span>{c.target ? `Dalam target · ${sLo}–${sHi}°C` : `Di luar target · ${sLo}–${sHi}°C`}</span>
          </p>
          <p className="big-temp" aria-live="polite">
            {fmtTemp(suhuAnim)}
            <span className="unit">°C</span>
          </p>
          <p className="muted small">Suhu saat ini (DS18B20 dalam drum)</p>
        </div>
        <div className="card">
          <small className="muted">Kelembapan</small>
          <div className="blue-big tabular">{latest.kelembapan}%</div>
          <small className="muted">target {hLo}–{hHi}%</small>
        </div>
        <div className="card">
          <small className="muted">Hari fermentasi</small>
          <div className="green-big tabular">
            {latest.hari} / {latest.total_hari}
          </div>
          <small className="muted">Batch {drumId}</small>
        </div>
        <div className="progress-card">
          <div className="row-between">
            <small>
              {latest.drum_id} · Hari {latest.hari}/{latest.total_hari}
            </small>
            <strong className="lime tabular">{latest.progres_pct}%</strong>
          </div>
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
          <small className="muted">
            Mulai: {latest.started} · {latest.label} · {fmtBerat(latest.berat)}
          </small>
        </div>
      </section>

      <SensorPanel latest={latest} />
      <section className="pc-grid-2" aria-label="Tren dan batch">
        <div className="card">
          <div className="row-between">
            <strong>Tren suhu · 24 jam</strong>
            <span className="badge">Data contoh</span>
          </div>
          <Suspense fallback={chartFallback}>
            <TrendChart
              data={latest.h24}
              min={CONFIG.CHART.min}
              max={CONFIG.CHART.max}
              band={CONFIG.THRESHOLDS.suhu}
              label="Tren suhu 24 jam"
              xLabels={["00", "06", "12", "18", "24"]}
            />
          </Suspense>
        </div>
        <div className="card">
          <strong>Batch aktif</strong>
          <div className="batch-list" role="group" aria-label="Pilih batch, bermasalah dulu" style={{ marginTop: 8 }}>
            {ordered.map((d) => {
              const cc = classify(d.suhu, d.kelembapan);
              return (
                <button
                  key={d.drum_id}
                  type="button"
                  className={d.drum_id === drumId ? "batch-item sel" : "batch-item"}
                  aria-pressed={d.drum_id === drumId}
                  onClick={() => onSelectDrum(d.drum_id)}
                >
                  <span>
                    <strong>{d.drum_id}</strong>
                    <br />
                    <small className="muted">
                      Hari {d.hari}/{d.total_hari} · {fmtTemp(d.suhu)}°C
                    </small>
                  </span>
                  <strong className={`tag ${cc.tone}`}>{cc.ml}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function PageBatch({ latest, drums, drumId, onSelectDrum }) {
  const c = classify(latest.suhu, latest.kelembapan);
  const [sLo, sHi] = CONFIG.THRESHOLDS.suhu;
  return (
    <>
      <h2 className="pc-h">Detail batch {latest.drum_id}</h2>
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
      </section>
      <section className="pc-grid-2" aria-label="Daftar batch dan timbangan">
        <div className="card">
          <strong>Pilih batch</strong>
          <div className="room-grid" role="group" aria-label="Pilih batch" style={{ marginTop: 8 }}>
            {drums.map((d, i) => {
              const cc = classify(d.suhu, d.kelembapan);
              const sel = d.drum_id === drumId;
              return (
                <button
                  key={d.drum_id}
                  type="button"
                  className={sel ? "room-card sel" : "room-card"}
                  aria-pressed={sel}
                  onClick={() => onSelectDrum(d.drum_id)}
                >
                  <span className={`room-art a${i % 3}`} aria-hidden="true" />
                  <strong>{d.drum_id}</strong>
                  <small className="muted">
                    Hari {d.hari}/{d.total_hari} · {fmtTemp(d.suhu)}°C
                  </small>
                  <span className="room-foot">
                    <span className={cc.target ? "mini-on" : "mini-off"}>{cc.ml}</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="card mini-stat">
          <small className="muted">Berat paket · maks {latest.kapasitas_kg} kg</small>
          <strong className="tabular">{fmtBerat(latest.berat)}</strong>
          <small className="muted">
            Progres {latest.progres_pct}% · {c.action}
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
      </section>
      <SensorStrip latest={latest} />
      <section className="pc-grid-2" aria-label="Tren dan pembacaan batch">
        <div className="card">
          <div className="row-between">
            <strong>Suhu · 7 hari</strong>
            <span className="badge">Data contoh</span>
          </div>
          <Suspense fallback={chartFallback}>
            <TrendChart
              data={latest.h7}
              min={CONFIG.CHART.min}
              max={CONFIG.CHART.max}
              band={CONFIG.THRESHOLDS.suhu}
              label="Suhu 7 hari"
              xLabels={["H-6", "H-4", "H-2", "Hari ini"]}
            />
          </Suspense>
          <p className="small muted" style={{ marginTop: 10 }}>
            {latest.label} · Mulai: {latest.started} · Hari {latest.hari}/{latest.total_hari}
          </p>
        </div>
        <div className="card">
          <strong>Pembacaan terakhir</strong>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabel pembacaan terakhir, geser untuk melihat semua" style={{ marginTop: 8 }}>
            <table className="readings">
              <caption>
                Sumber: {latest.sumber} via RF433 → ESP32
              </caption>
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
                    <td className="num temp">{fmtTemp(r.suhu)}°C</td>
                    <td className="num">{r.hum}% RH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function PagePeringatan({ latest, drums, drumId }) {
  const [filter, setFilter] = useState("semua");
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
      <h2 className="pc-h">Peringatan · {drumId}</h2>
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
      <section className="pc-grid-2" aria-label="Metrik dan status">
        <div className="metric-row" role="group" aria-label="Metrik farm">
          <PcMetric icon="temp" value={`${fmtTemp(latest.suhu)}°C`} label="Suhu drum" sub={`Target ${sLo}–${sHi}`} />
          <PcMetric icon="drop" value={`${latest.kelembapan}%`} label="Moisture" sub={`Target ${hLo}–${hHi}`} />
          <PcMetric icon="wind" value={`${latest.hari} hr`} label="Fermentasi" sub={`dari ${latest.total_hari}`} />
          <PcMetric icon="rain" value={Number.isFinite(latest.berat) ? latest.berat.toFixed(1) : "—"} label="Berat kg" sub={`maks ${latest.kapasitas_kg}`} />
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
      </section>
      <SensorStrip latest={latest} />
      <section className="pc-grid-2" aria-label="Statistik dan kejadian">
        <div className="card">
          <div className="row-between">
            <strong>Suhu 7 hari dalam target?</strong>
            <small className="muted">{c.target ? "Ya" : "Belum"}</small>
          </div>
          <Suspense fallback={chartFallback}>
            <SensorChart
              data={latest.h7}
              name="alert-temperature"
              unit="°C"
              band={CONFIG.THRESHOLDS.suhu}
              xLabels={WEEK_LABELS}
              height={170}
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
        </div>
        <div className="card events">
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
        </div>
      </section>
    </>
  );
}

function PcMetric({ icon, value, label, sub }) {
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

function PageAkun({ latest }) {
  return (
    <>
      <h2 className="pc-h">Akun dan perangkat</h2>
      <SensorStrip latest={latest} title="Sensor aktif" />
      <section className="pc-grid-2" aria-label="Akun dan perangkat">
        <div className="card">
          <strong>Pagi Farm</strong>
          <br />
          <small className="muted">Mitra hidroponik · 2× drum 50L</small>
          <br />
          <br />
          <small className="muted">Peran: operator lapangan</small>
        </div>
        <div className="card">
          <strong>Perangkat &amp; bantuan</strong>
          <ul className="conn" style={{ marginTop: 8 }}>
            <li>
              <span>ESP32 Gateway RF433</span>
              <strong className="tag ok small">Online</strong>
            </li>
            <li>
              <span>DS18B20 + LGT8F32P (dalam drum)</span>
              <strong className="tag ok small">2 unit</strong>
            </li>
            <li>
              <span>Load cell 5 kg + Heat sealer</span>
              <strong className="tag ok small">{fmtBerat(latest.berat)}</strong>
            </li>
          </ul>
          <p className="small muted" style={{ marginTop: 10 }}>
            Butuh bantuan? <span>Hubungi SensorIX</span>
          </p>
        </div>
      </section>
    </>
  );
}
