import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { QmixEngine } from "../src/index.js";
import type { GoldenFixture, QmixResult, Vector2, Vector3 } from "../src/index.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(rootDir, "fixtures", "qmix-comprehensive-golden.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as GoldenFixture;

const scalarKeys = [
  "thetaDeg",
  "phiDeg",
  "dEffPmPerV",
  "s0L2Watt",
  "angleToleranceMradCm",
  "temperatureRangeKCm",
] as const;

const vector3Keys = ["wavelengthsNm", "walkoffMrad", "phaseVelocityIndex", "groupVelocityIndex", "gddFs2PerMm"] as const;
const vector2Keys = ["acceptanceAngleMradCm", "acceptanceBW"] as const;

describe("QmixEngine comprehensive phasematching golden fixture", () => {
  it("documents the reference fixture", () => {
    expect(fixture.schemaVersion).toBe(1);
    expect(fixture.generatedBy).toBe("tools/generate_qmix_comprehensive_fixture.m");
    expect(fixture.source.engine).toBe("QmixEngine.m");
    expect(fixture.cases.length).toBeGreaterThan(20);
  });

  it.each(fixture.cases)("matches MATLAB for $name", (testCase) => {
    const engine = new QmixEngine();
    let actual: QmixResult[];
    try {
      actual = engine.calculate(testCase.input);
    } catch {
      actual = [];
    }

    expect(actual, testCase.name).toHaveLength(testCase.expected.resultCount);
    for (let index = 0; index < testCase.expected.results.length; index += 1) {
      const actualResult = actual[index];
      const expectedResult = testCase.expected.results[index];
      expect(actualResult, `${testCase.name}[${index}]`).toBeDefined();
      expect(expectedResult, `${testCase.name}[${index}]`).toBeDefined();
      if (actualResult === undefined || expectedResult === undefined) {
        continue;
      }

      expect(actualResult.polarizations, `${testCase.name}[${index}].polarizations`).toBe(expectedResult.polarizations);

      for (const key of scalarKeys) {
        expectCloseTo(actualResult[key], expectedResult[key], `${testCase.name}[${index}].${key}`);
      }
      for (const key of vector3Keys) {
        expectVector3CloseTo(actualResult[key], expectedResult[key], `${testCase.name}[${index}].${key}`, key === "gddFs2PerMm" ? 1e-3 : 0);
      }
      for (const key of vector2Keys) {
        expectVector2CloseTo(actualResult[key], expectedResult[key], `${testCase.name}[${index}].${key}`, key === "acceptanceAngleMradCm" ? 1e-6 : 0);
      }
    }
  });
});

function expectVector3CloseTo(actual: Vector3, expected: Vector3, label: string, absoluteToleranceFloor = 0): void {
  for (let index = 0; index < 3; index += 1) {
    expectCloseTo(actual[index as 0 | 1 | 2], expected[index as 0 | 1 | 2], `${label}[${index}]`, absoluteToleranceFloor);
  }
}

function expectVector2CloseTo(actual: Vector2, expected: Vector2, label: string, absoluteToleranceFloor = 0): void {
  for (let index = 0; index < 2; index += 1) {
    expectCloseTo(actual[index as 0 | 1], expected[index as 0 | 1], `${label}[${index}]`, absoluteToleranceFloor);
  }
}

function expectCloseTo(actual: number, expected: number, label: string, absoluteToleranceFloor = 0): void {
  const tolerance = Math.max(absoluteToleranceFloor, Math.abs(expected) * 1e-9 + 1e-9);
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(tolerance);
}
