/* Tombol ganti tema gelap/terang (ikon matahari/bulan, satu set ikon). */
import { useTheme } from "../theme";

export default function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme !== "light";
  return (
    <button
      type="button"
      className="icon-btn"
      aria-pressed={dark}
      aria-label={dark ? "Matikan mode gelap" : "Nyalakan mode gelap"}
      onClick={toggle}
    >
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
