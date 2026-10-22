/* Unit test fungsi murni (tanpa React): node --test src/lib.test.js */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classify, fmtTemp, worstFirst } from "./lib.js";
import { sensorReading, sensorDetail } from "./sensors.js";

describe("fmtTemp", () => {
  it("satu desimal", () => {
    assert.equal(fmtTemp(41.234), "41.2");
    assert.equal(fmtTemp(39), "39.0");
  });
});

describe("sensor telemetry", () => {
  it("missing telemetry never claims a zero reading or inactive hardware", () => {
    for (const id of ["temperature", "humidity", "weight", "press", "pressure", "gas", "gate"]) {
      assert.equal(sensorReading(id, {}), "Belum ada data");
    }
    assert.equal(sensorReading("press", { machine_sensors: { press: { value: 12 } } }), "Belum ada data");
    assert.equal(sensorReading("gas", { machine_sensors: { gas: { unit: "ppm" } } }), "Belum ada data");
  });
  it("preserves actual zero readings and false boolean states", () => {
    const latest = { suhu: 0, kelembapan: 0, berat: 0, machine_sensors: {
      press: { value: 0, unit: "N", target_reached: false },
      pressure: { value: 0, unit: "kPa" },
      gas: { value: 0, unit: "ppm" },
      gate: { limit_reached: false },
    } };
    assert.equal(sensorReading("temperature", latest), "0.0°C");
    assert.equal(sensorReading("humidity", latest), "0% RH");
    assert.equal(sensorReading("weight", latest), "0.0 kg");
    assert.equal(sensorReading("press", latest), "0 N");
    assert.equal(sensorReading("pressure", latest), "0 kPa");
    assert.equal(sensorReading("gas", latest), "0 ppm");
    assert.equal(sensorReading("gate", latest), "Batas gerak belum tercapai");
    assert.equal(sensorDetail("press", latest), "Target pres belum tercapai");
  });
  it("renders controller decisions without deriving actuator commands", () => {
    const latest = { machine_sensors: {
      press: { value: 12, unit: "N", target_reached: true },
      gate: { limit_reached: true },
    } };
    assert.equal(sensorReading("press", latest), "12 N");
    assert.equal(sensorDetail("press", latest), "Target pres tercapai");
    assert.equal(sensorReading("gate", latest), "Batas gerak tercapai");
    assert.equal(sensorDetail("gate", latest), "Kontak batas terpicu");
  });
});

describe("classify", () => {
  it("dalam target → Asam laktat", () => {
    const c = classify(41.2, 62);
    assert.equal(c.tone, "ok");
    assert.equal(c.ml, "Asam laktat");
    assert.equal(c.target, true);
  });
  it("batas inklusif 40 dan 45", () => {
    assert.equal(classify(40, 55).target, true);
    assert.equal(classify(45, 70).target, true);
  });
  it("suhu berlebih → anomali", () => {
    const c = classify(46.1, 62);
    assert.equal(c.tone, "bad");
    assert.match(c.ml, /Anomali/);
  });
  it("suhu rendah → awal fermentasi", () => {
    assert.equal(classify(39.4, 68).ml, "Awal fermentasi");
  });
  it("kelembapan di luar target → perhatian", () => {
    const c = classify(41.2, 75);
    assert.equal(c.target, false);
    assert.equal(c.ml, "Perlu perhatian");
  });
});

describe("worstFirst", () => {
  it("terburuk dulu: bad, warn, ok", () => {
    const drums = [
      { drum_id: "A", suhu: 41.2, kelembapan: 62 },
      { drum_id: "B", suhu: 46.1, kelembapan: 62 },
      { drum_id: "C", suhu: 39.4, kelembapan: 68 },
    ];
    assert.deepEqual(
      worstFirst(drums).map((d) => d.drum_id),
      ["B", "C", "A"],
    );
  });
});
