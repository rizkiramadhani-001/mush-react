import { useCallback, useEffect, useRef, useState } from "react";
import { IonContent, IonPage, IonToast } from "@ionic/react";
import { classify } from "./lib";
import { Api } from "./api";
import { SEED, CONFIG } from "./config";
import Phone from "./components/Phone";
import useMediaQuery from "./hooks/useMediaQuery";
import Ringkasan from "./views/Ringkasan";
import BatchDetail from "./views/BatchDetail";
import Peringatan from "./views/Peringatan";
import Akun from "./views/Akun";
import PcDashboard from "./views/PcDashboard";

const TABS = ["ringkasan", "batch", "peringatan", "akun"];
const TAB_TITLES = {
  ringkasan: "Ringkasan",
  batch: "Detail Batch",
  peringatan: "Peringatan",
  akun: "Akun",
};

function stored(key, fallback, valid) {
  try {
    const v = window.localStorage.getItem(key);
    return v && valid(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [tab, setTab] = useState(() => {
    const route = window.location.hash.slice(2);
    return TABS.includes(route) ? route : stored("mush.tab", "ringkasan", (v) => TABS.includes(v));
  });
  const [drumId, setDrumId] = useState(() => stored("mush.drum", "", (v) => Boolean(v)));
  const [drums, setDrums] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const drumRef = useRef(drumId);

  useEffect(() => {
    drumRef.current = drumId;
    try {
      window.localStorage.setItem("mush.drum", drumId);
    } catch {
      /* mode privat, abaikan */
    }
  }, [drumId]);

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  const refresh = useCallback(async (announce = false) => {
    try {
      const d = await Api.getDrums();
      let id = drumRef.current;
      if (!d.some((item) => item.drum_id === id)) id = d[0]?.drum_id ?? "";
      const l = id ? await Api.getLatest(id) : null;
      if (id !== drumRef.current) {
        drumRef.current = id;
        setDrumId(id);
      }
      setDrums(d);
      setLatest(l);
      setLoading(false);
      setError("");
      if (announce) showToast("Data berhasil diperbarui.");
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError(String(e?.message ?? e));
      if (announce) showToast("Gagal memperbarui data. Coba lagi.");
    }
  }, [showToast]);

  const selectDrum = useCallback(
    async (id) => {
      if (drumRef.current === id) return;
      drumRef.current = id;
      setDrumId(id);
      setLoading(true);
      await refresh(false);
      showToast(`Berpindah ke Batch ${id}.`);
    },
    [refresh, showToast],
  );

  const simulate = useCallback(() => {
    if (!CONFIG.USE_MOCK) {
      showToast("Simulasi hanya tersedia pada mode data contoh.");
      return;
    }
    const s = SEED[drumRef.current];
    if (!s) return;
    s.suhu = +(s.suhu + (Math.random() - 0.5) * 0.4).toFixed(1);
    s.hum = Math.max(50, Math.min(75, s.hum + Math.round((Math.random() - 0.5) * 2)));
    s.h24.push(s.suhu);
    s.h24.shift();
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    s.log.unshift({ t, suhu: s.suhu, hum: s.hum });
    s.log = s.log.slice(0, 20);
    refresh(false);
    showToast(`Simulasi reading ${t}: ${s.suhu.toFixed(1)}°C.`);
  }, [refresh, showToast]);

  const go = useCallback((id) => {
    if (!TABS.includes(id)) return;
    window.location.hash = `/${id}`;
    setTab(id);
  }, []);

  useEffect(() => {
    if (!TABS.includes(window.location.hash.slice(2))) {
      window.history.replaceState(null, "", `#/${tab}`);
    }
    const onRoute = () => {
      const route = window.location.hash.slice(2);
      if (TABS.includes(route)) setTab(route);
      else {
        window.history.replaceState(null, "", "#/ringkasan");
        setTab("ringkasan");
      }
    };
    window.addEventListener("hashchange", onRoute);
    return () => window.removeEventListener("hashchange", onRoute);
  }, [tab]);

  useEffect(() => {
    document.body.dataset.tab = tab;
    document.title = `MUSH ${TAB_TITLES[tab]} - Pagi Farm`;
    try {
      window.localStorage.setItem("mush.tab", tab);
    } catch {
      /* mode privat, abaikan */
    }
  }, [tab]);

  useEffect(() => {
    refresh(false);
    const poll = window.setInterval(() => {
      if (!document.hidden) refresh(false);
    }, CONFIG.POLL_MS);
    const onVis = () => {
      if (!document.hidden) refresh(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const shared = { latest, drums, drumId, onSelectDrum: selectDrum, onSimulate: simulate, onGo: go, onRetry: () => refresh(true) };
  const centerAction = () => refresh(true);
  const centerLabel = "Sinkronkan data";
  // Satu mode mounted dalam satu waktu, tidak ada ID ganda di DOM.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <>
      <a className="skip-link" href="#main" onClick={(event) => {
        event.preventDefault();
        document.getElementById("main")?.focus();
      }}>
        Lewati ke konten utama
      </a>

      {isDesktop ? (
        <IonPage className="desktop-page"><IonContent>
        <main className="pc-main">
          <PcDashboard
            page={tab}
            onGo={go}
            latest={latest}
            drums={drums}
            drumId={drumId}
            loading={loading}
            error={error}
            onSelectDrum={selectDrum}
            onSimulate={simulate}
            onAction={centerAction}
            actionLabel={centerLabel}
            onRetry={() => refresh(true)}
          />
        </main>
        </IonContent></IonPage>
      ) : (
        <Phone key={tab} id={tab} title={TAB_TITLES[tab]} alertCount={drums.filter(d => !classify(d.suhu, d.kelembapan).target).length} onGo={go} onAction={centerAction} actionLabel={centerLabel} onRefresh={() => refresh(false)}>
          {error && <div className="page-error" role="alert">Pembaruan gagal: {error} <button type="button" className="link-btn" onClick={() => refresh(true)}>Coba lagi</button></div>}
          {loading && !latest ? <LoadingBody /> : tab === "akun" ? <Akun {...shared} /> : !latest ? <EmptyBody /> : (
            <>{tab === "ringkasan" && <Ringkasan {...shared} />}
              {tab === "batch" && <BatchDetail {...shared} />}
              {tab === "peringatan" && <Peringatan {...shared} />}</>
          )}
        </Phone>
      )}

      <IonToast isOpen={Boolean(toast)} message={toast} duration={3200} position="top" onDidDismiss={() => setToast("")} buttons={[{ text: "Tutup", role: "cancel" }]} />
    </>
  );
}

function LoadingBody() {
  return (
    <div className="body" role="status" aria-label="Memuat data sensor">
      <div className="card">
        <div className="skeleton" style={{ width: "60%" }} />
        <div className="skeleton" style={{ width: "90%", marginTop: 8 }} />
        <div className="skeleton" style={{ width: "40%", marginTop: 8 }} />
        <p className="small muted" style={{ marginTop: 8 }}>
          Memuat data sensor…
        </p>
      </div>
    </div>
  );
}

function EmptyBody() {
  return (
    <div className="body" role="status">
      <div className="card">
        <p>
          <strong>Belum ada data sensor.</strong>
        </p>
        <p className="small muted">Periksa koneksi gateway, lalu muat ulang.</p>
      </div>
    </div>
  );
}
