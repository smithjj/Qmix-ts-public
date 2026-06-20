import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { QmixEngine } from "../src/index.js";
import type { GoldenFixture, QmixResult, Vector2, Vector3 } from "../src/index.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(rootDir, "fixtures", "qmix-biaxial-golden.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as GoldenFixture;

const scalarKeys = ["thetaDeg","phiDeg","dEffPmPerV","s0L2Watt","angleToleranceMradCm","temperatureRangeKCm"] as const;
const vector3Keys = ["wavelengthsNm","walkoffMrad","phaseVelocityIndex","groupVelocityIndex","gddFs2PerMm"] as const;
const vector2Keys = ["acceptanceAngleMradCm","acceptanceBW"] as const;

describe("QmixEngine biaxial phasematching golden fixture", () => {
  it("documents the reference fixture", () => {
    expect(fixture.schemaVersion).toBe(1);
    expect(fixture.generatedBy).toBe("tools/generate_qmix_biaxial_fixture.m");
    expect(fixture.source.engine).toBe("QmixEngine.m");
    expect(fixture.cases.length).toBeGreaterThan(15);
  });

  it.each(fixture.cases)("matches MATLAB for $name", (testCase) => {
    const engine = new QmixEngine();
    let actual: QmixResult[];
    try { actual = engine.calculate(testCase.input); } catch { actual = []; }
    expect(actual, testCase.name).toHaveLength(testCase.expected.resultCount);
    for (let i = 0; i < testCase.expected.results.length; i++) {
      const a = actual[i];
      const e = testCase.expected.results[i];
      expect(a, `${testCase.name}[${i}]`).toBeDefined();
      expect(e, `${testCase.name}[${i}]`).toBeDefined();
      if (!a || !e) continue;
      expect(a.polarizations, `${testCase.name}[${i}].polarizations`).toBe(e.polarizations);
      for (const key of scalarKeys) expectCloseTo(a[key], e[key], `${testCase.name}[${i}].${key}`);
      for (const key of vector3Keys) expectVector3CloseTo(a[key], e[key], `${testCase.name}[${i}].${key}`, key === "gddFs2PerMm" ? 1e-3 : 0);
      for (const key of vector2Keys) expectVector2CloseTo(a[key], e[key], `${testCase.name}[${i}].${key}`, key === "acceptanceAngleMradCm" ? 1e-6 : 0);
    }
  });
});

function expectVector3CloseTo(a: Vector3, e: Vector3, label: string, floor = 0) {
  for (let i = 0; i < 3; i++) expectCloseTo(a[i as 0|1|2], e[i as 0|1|2], `${label}[${i}]`, floor);
}
function expectVector2CloseTo(a: Vector2, e: Vector2, label: string, floor = 0) {
  for (let i = 0; i < 2; i++) expectCloseTo(a[i as 0|1], e[i as 0|1], `${label}[${i}]`, floor);
}
function expectCloseTo(a: number, e: number, label: string, floor = 0) {
  const tol = Math.max(floor, Math.abs(e) * 1e-9 + 1e-9);
  expect(Math.abs(a - e), label).toBeLessThanOrEqual(tol);
}
