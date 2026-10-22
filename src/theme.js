/* Tema gelap/terang global: satu sumber, semua toggle sinkron.
   Nilai awal dari penyimpanan, lalu preferensi OS. Tanpa window = gelap. */
import { useSyncExternalStore } from "react";

const KEY = "mush.theme";
const DARK_META = "#0b1210";
const LIGHT_META = "#e9efe9";

function initial() {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* mode privat, abaikan */
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

let theme = typeof window !== "undefined" ? initial() : "dark";
const listeners = new Set();

function apply() {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? LIGHT_META : DARK_META);
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* mode privat, abaikan */
  }
}

if (typeof window !== "undefined") apply();

export function setTheme(next) {
  if (next !== "light" && next !== "dark") return;
  theme = next;
  apply();
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  setTheme(theme === "light" ? "dark" : "light");
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTheme() {
  const mode = useSyncExternalStore(subscribe, () => theme);
  return [mode, toggleTheme];
}
