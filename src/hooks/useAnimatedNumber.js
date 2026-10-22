/* Angka beranimasi menuju nilai terbaru (ease-out, rAF).
   Dipakai untuk bacaan hero agar perubahan tiap polling terbaca sebagai
   gerak, bukan kedip. Diam saat prefers-reduced-motion. */
import { useEffect, useRef, useState } from "react";

export default function useAnimatedNumber(value, duration = 400) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const from = fromRef.current;
    if (from === value) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (value - from) * eased;
      fromRef.current = v;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduceMotion]);

  return reduceMotion ? value : display;
}
