/* Grafik tren satu sensor: area 24 jam, pita target bila ada.
   Lazy-loaded supaya recharts tidak masuk ke bundle awal.
   Konfigurasi sumbu mengikuti TrendChart yang sudah terbukti: ticks X
   berupa label string, ticks Y berupa angka eksplisit. */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const X_TICKS = ["0h", "6h", "12h", "18h", "23h"];
/* Setiap label kedua agar tidak bertabrakan di layar sempit. */
const pickTicks = (labels) => labels.filter((_, i) => i % 2 === 0 || i === labels.length - 1);

function Tip({ active, payload, unit, decimals }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <span className="muted">{payload[0].payload.name} · </span>
      <strong className="tabular">
        {Number(payload[0].value).toFixed(decimals)}
        {unit}
      </strong>
    </div>
  );
}

export default function SensorChart({ data, name, unit = "", band, decimals = 1, height = 170, xLabels, syncId }) {
  const points = data.map((value, i) => ({ name: xLabels ? (xLabels[i] ?? `${i}`) : `${i}h`, value }));
  const ticks = xLabels ? pickTicks(points.map((p) => p.name)) : X_TICKS;
  // Ambang ikut masuk domain supaya pita target selalu terlihat, bukan terpotong.
  const shown = band ? [...data, band[0], band[1]] : data;
  const lo = Math.min(...shown);
  const hi = Math.max(...shown);
  const pad = (hi - lo) * (band ? 0.08 : 0.2) || 1;
  const floor = lo - pad;
  const ceil = hi + pad;
  const mid = Number(((floor + ceil) / 2).toFixed(decimals));

  return (
    <div
      className="sensor-chart"
      role="img"
      aria-label={`Tren ${name} 24 jam: ${data.map((v) => v.toFixed(decimals)).join(", ")} ${unit}`}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={points} syncId={syncId} syncMethod="index" margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={`fill-${name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0aa37e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#b9d67f" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e7ede6" vertical={false} />
          <XAxis
            dataKey="name"
            ticks={ticks}
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#5f746c" }}
          />
          <YAxis
            domain={[floor, ceil]}
            ticks={[floor, mid, ceil]}
            tickLine={false}
            axisLine={false}
            width={46}
            tick={{ fontSize: 10, fill: "#5f746c" }}
            tickFormatter={(v) => Number(v).toFixed(decimals)}
          />
          {band && <ReferenceArea y1={band[0]} y2={band[1]} fill="#b9d67f" fillOpacity={0.18} />}
          <Tooltip content={<Tip unit={unit} decimals={decimals} />} cursor={{ stroke: "#0aa37e", strokeWidth: 1.5 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0aa37e"
            strokeWidth={2.5}
            fill={`url(#fill-${name})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}