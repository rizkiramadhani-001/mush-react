/* Grafik garis Recharts: pita target, garis rata-rata,
   titik di luar target berwarna merah/oranye + tooltip,
   baris statistik min/rata-rata/maks. API props tidak berubah. */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../theme";

const DARK = {
  line: "#55b381",
  last: "#9dc400",
  bad: "#ec8d84",
  warn: "#eda75f",
  grid: "#233129",
  tick: "#a7b8ab",
  avg: "#82b4d8",
};
const LIGHT = {
  line: "#1c6b44",
  last: "#65a300",
  bad: "#b3362a",
  warn: "#8f550e",
  grid: "#dde5da",
  tick: "#4d6355",
  avg: "#2f5f8f",
};

function ChartTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const named = label != null && !String(label).startsWith("p");
  return (
    <div className="chart-tip">
      {named ? <span className="muted">{label} · </span> : null}
      <strong className="tabular">
        {Number(payload[0].value).toFixed(1)}
        {unit}
      </strong>
    </div>
  );
}

export default function TrendChart({ data, min, max, band, label, xLabels, unit = "°C" }) {
  const [theme] = useTheme();
  const P = theme === "light" ? LIGHT : DARK;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const n = data.length;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const avg = data.reduce((a, b) => a + b, 0) / n;
  const mid = Math.round((min + max) / 2);

  // Petakan tiap label sumbu-X ke satu indeks titik.
  const labelIdx = new Map(
    xLabels.map((name, k) => [Math.round((k * (n - 1)) / (xLabels.length - 1)), name]),
  );
  const chartData = data.map((v, i) => ({ name: labelIdx.get(i) ?? `p${i + 1}`, v }));

  const inBand = (v) => !band || (v >= band[0] && v <= band[1]);
  const dotColor = (v, i) => {
    if (i === n - 1) return P.last;
    if (inBand(v)) return P.line;
    return v > band[1] ? P.bad : P.warn;
  };

  const renderDot = (props) => {
    const { cx, cy, index } = props;
    if (cx == null || cy == null) return null;
    const last = index === n - 1;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={last ? 5 : 3}
        fill={dotColor(data[index], index)}
        stroke="#fff"
        strokeWidth={1.5}
      />
    );
  };

  return (
    <div>
      <div
        className="recharts-holder"
        role="img"
        aria-label={`${label}: ${data.map((v) => v.toFixed(1)).join(", ")}`}
      >
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <CartesianGrid stroke={P.grid} vertical={false} />
            <XAxis
              dataKey="name"
              ticks={xLabels}
              tick={{ fontSize: 10, fill: P.tick }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              domain={[min, max]}
              ticks={[min, mid, max]}
              tick={{ fontSize: 10, fill: P.tick }}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <Tooltip
              content={<ChartTip unit={unit} />}
              cursor={{ stroke: P.line, strokeOpacity: 0.35 }}
            />
            {band && <ReferenceArea y1={band[0]} y2={band[1]} fill={P.line} fillOpacity={0.1} />}
            <ReferenceLine y={avg} stroke={P.avg} strokeDasharray="4 3" opacity={0.7} />
            <Line
              type="monotone"
              dataKey="v"
              name="Suhu"
              stroke={P.line}
              strokeWidth={2.5}
              dot={renderDot}
              activeDot={{ r: 5, fill: P.line, stroke: "#fff" }}
              isAnimationActive={!reduceMotion}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <dl className="chart-stats">
        <div>
          <dt>Min</dt>
          <dd className="tabular">
            {lo.toFixed(1)}
            {unit}
          </dd>
        </div>
        <div>
          <dt>Rata-rata</dt>
          <dd className="tabular">
            {avg.toFixed(1)}
            {unit}
          </dd>
        </div>
        <div>
          <dt>Maks</dt>
          <dd className="tabular">
            {hi.toFixed(1)}
            {unit}
          </dd>
        </div>
      </dl>
    </div>
  );
}
