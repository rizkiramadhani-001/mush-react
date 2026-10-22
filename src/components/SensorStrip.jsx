/* Strip sensor ringkas untuk halaman selain Ringkasan.
   Memakai sensorReading/sensorDetail yang sama dengan SensorPanel agar
   dummy data dan aturan "belum ada data" konsisten di semua halaman. */
import { SENSORS } from "../config";
import { sensorDetail, sensorReading } from "../sensors";

export default function SensorStrip({ latest, title = "Sensor MUSH" }) {
  if (!latest) return null;
  return (
    <section className="sensor-strip" aria-label={title}>
      <h2>{title}</h2>
      <div className="sensor-strip-grid">
        {SENSORS.map((sensor) => {
          const detail = sensorDetail(sensor.id, latest);
          return (
            <div className="sensor-chip" key={sensor.id}>
              <small className="muted">{sensor.name}</small>
              <strong>{sensorReading(sensor.id, latest)}</strong>
              {detail && <small className="muted">{detail}</small>}
            </div>
          );
        })}
      </div>
    </section>
  );
}