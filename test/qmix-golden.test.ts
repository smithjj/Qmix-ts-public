import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { formatQmixResults, QmixEngine } from "../src/index.js";
import type { GoldenFixture, QmixResult, Vector2, Vector3 } from "../src/index.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(rootDir, "fixtures", "qmix-golden.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as GoldenFixture;

const scalarKeys = [
  "thetaDeg",
  "phiDeg",
  "dEffPmPerV",
  "s0L2Watt",
  "angleToleranceMradCm",
  "temperatureRangeKCm"
] as const;

const vector3Keys = ["wavelengthsNm", "walkoffMrad", "phaseVelocityIndex", "groupVelocityIndex", "gddFs2PerMm"] as const;
const vector2Keys = ["acceptanceAngleMradCm", "acceptanceBW"] as const;

describe("QmixEngine MATLAB golden fixture", () => {
  it("documents the reference fixture", () => {
    expect(fixture.schemaVersion).toBe(1);
    expect(fixture.generatedBy).toBe("tools/generate_qmix_golden.m");
    expect(fixture.source.engine).toBe("QmixEngine.m");
    expect(fixture.cases.map((testCase) => testCase.name)).toEqual([
      "bbo_shg_mix",
      "bbo_shg_opo",
      "bbo_sfg_non_degenerate",
      "lbo_shg_xy",
      "lbo_sfg_xy_zero_deff_branches",
      "lbo_shg_xz_zero_deff",
      "lbo_sfg_xz_eoe_eeo",
      "lbo_sfg_yz",
      "lbo_sfg_yz_oeo_eoo",
      "lbo_sfg_yz_eeo_zero_deff"
    ]);
  });

  it.each(fixture.cases)("matches MATLAB for $name", (testCase) => {
    const engine = new QmixEngine();
    const actual = engine.calculate(testCase.input);

    expect(actual, testCase.name).toHaveLength(testCase.expected.resultCount);
    for (let index = 0; index < testCase.expected.results.length; index += 1) {
      const actualResult = actual[index];
      const expectedResult = testCase.expected.results[index];
      expect(actualResult, `${testCase.name}[${index}]`).toBeDefined();
      expect(expectedResult, `${testCase.name}[${index}]`).toBeDefined();
      if (actualResult === undefined || expectedResult === undefined) {
        continue;
      }

      expectResultCloseTo(actualResult, expectedResult, `${testCase.name}[${index}]`);
    }

    expect(formatQmixResults(actual, testCase.input.type)).toEqual(testCase.expected.formattedText);
  });
});

function expectResultCloseTo(actual: QmixResult, expected: QmixResult, label: string): void {
  expect(actual.polarizations, label).toBe(expected.polarizations);

  for (const key of scalarKeys) {
    expectCloseTo(actual[key], expected[key], `${label}.${key}`);
  }
  for (const key of vector3Keys) {
    expectVector3CloseTo(actual[key], expected[key], `${label}.${key}`, key === "gddFs2PerMm" ? 1e-3 : 0);
  }
  for (const key of vector2Keys) {
    expectVector2CloseTo(actual[key], expected[key], `${label}.${key}`);
  }
}

function expectVector3CloseTo(actual: Vector3, expected: Vector3, label: string, absoluteToleranceFloor = 0): void {
  for (let index = 0; index < 3; index += 1) {
    expectCloseTo(actual[index as 0 | 1 | 2], expected[index as 0 | 1 | 2], `${label}[${index}]`, absoluteToleranceFloor);
  }
}

function expectVector2CloseTo(actual: Vector2, expected: Vector2, label: string): void {
  for (let index = 0; index < 2; index += 1) {
    expectCloseTo(actual[index as 0 | 1], expected[index as 0 | 1], `${label}[${index}]`);
  }
}

function expectCloseTo(actual: number, expected: number, label: string, absoluteToleranceFloor = 0): void {
  const tolerance = Math.max(absoluteToleranceFloor, fixture.numericTolerance.absolute + Math.abs(expected) * fixture.numericTolerance.relative);
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(tolerance);
}
