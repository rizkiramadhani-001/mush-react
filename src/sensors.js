import { classify } from "./lib.js";

const missing = "Belum ada data";
const binary = (value, yes, no) =>
  typeof value === "boolean" ? (value ? yes : no) : missing;
const measured = (value, unit) =>
  Number.isFinite(value) && unit?.trim() ? `${value} ${unit}` : missing;

/** Missing telemetry must never be shown as zero, inactive, or offline. */
export function sensorReading(id, latest) {
  const machine = latest?.machine_sensors;
  switch (id) {
    case "temperature":
      return Number.isFinite(latest?.suhu) ? `${latest.suhu.toFixed(1)}°C` : missing;
    case "humidity":
      return Number.isFinite(latest?.kelembapan) ? `${latest.kelembapan}% RH` : missing;
    case "weight":
      return Number.isFinite(latest?.berat) ? `${latest.berat.toFixed(1)} kg` : missing;
    case "press":
      return measured(machine?.press?.value, machine?.press?.unit);
    case "pressure":
      return measured(machine?.pressure?.value, machine?.pressure?.unit);
    case "gas":
      return measured(machine?.gas?.value, machine?.gas?.unit);
    case "gate":
      return binary(
        machine?.gate?.limit_reached,
        "Batas gerak tercapai",
        "Batas gerak belum tercapai",
      );
    default:
      return missing;
  }
}

/** Riwayat 24 jam untuk grafik, atau null bila sensor belum punya data. */
export function sensorSeries(id, latest) {
  return latest?.sensor_history?.[id] ?? null;
}

/** Secondary line from the controller decision, never derived from actuator logic. */
export function sensorDetail(id, latest) {
  const machine = latest?.machine_sensors;
  switch (id) {
    case "temperature":
    case "humidity": {
      if (!Number.isFinite(latest?.suhu) || !Number.isFinite(latest?.kelembapan)) return null;
      return classify(latest.suhu, latest.kelembapan).target
        ? "Dalam target"
        : "Di luar target";
    }
    case "press":
      return binary(
        machine?.press?.target_reached,
        "Target pres tercapai",
        "Target pres belum tercapai",
      );
    case "gate":
      return binary(
        machine?.gate?.limit_reached,
        "Kontak batas terpicu",
        "Kontak batas belum terpicu",
      );
    case "pressure":
    case "gas":
      return "Belum ada ambang tim";
    default:
      return null;
  }
}