/* Bar atas ala referensi: menu, logo, cari, tema, lonceng.
   Cari memakai <details> asli (bukan tombol mati). */
import ThemeToggle from "./ThemeToggle";

export default function TopBar({ title, alertCount = 0, onGo }) {
  return (
    <div className="topbar">
      <button type="button" className="top-icon" aria-label="Buka peringatan" onClick={() => onGo("peringatan")}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5.5h14M3 10h14M3 14.5h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>
      <span className="brand" aria-label="MUSH Pagi Farm">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="23" height="23" rx="7" fill="#0aa37e" />
          <path
            d="M8 18V9.5L13 14l5-4.5V18"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M8 20.5h10" stroke="#d6e69c" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="top-title">{title}</span>
      <details className="top-search">
        <summary aria-label="Daftar batch">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </summary>
        <div className="top-search-pop">
          <p className="small muted">Semua batch ada di tab Batch:</p>
          <button type="button" onClick={() => onGo("batch")}>
            Buka tab Batch
          </button>
        </div>
      </details>
      <ThemeToggle />
      <button
        type="button"
        className="top-icon bell"
        aria-label={`Peringatan, ${alertCount} perlu perhatian`}
        onClick={() => onGo("peringatan")}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 2.5a5 5 0 0 0-5 5v3L3.5 13h13L15 10.5v-3a5 5 0 0 0-5-5ZM8 15.5h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {alertCount > 0 && <span className="bell-badge">{alertCount}</span>}
      </button>
    </div>
  );
}
