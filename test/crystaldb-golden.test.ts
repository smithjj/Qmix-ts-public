import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CrystalDB } from "../src/index.js";

interface CrystalDbGoldenFixture {
  readonly schemaVersion: 1;
  readonly generatedBy: string;
  readonly source: {
    readonly matlabVersion: string;
    readonly engine: string;
  };
  readonly numericTolerance: {
    readonly absolute: number;
    readonly relative: number;
  };
  readonly temperatureSamplesKelvin: readonly number[];
  readonly commonWavelengthSamplesNm: readonly number[];
  readonly cases: readonly CrystalDbGoldenCase[];
}

interface CrystalDbGoldenCase {
  readonly crystal: string;
  readonly wavelengthRangeNm: readonly number[];
  readonly wavelengthSamplesNm: readonly number[];
  readonly temperatureSamplesKelvin: readonly number[];
  readonly numPolarizations: number;
  readonly sampleCount: number;
  readonly samples: readonly CrystalDbGoldenSample[];
}

interface CrystalDbGoldenSample {
  readonly temperatureKelvin: number;
  readonly wavelengthNm: number;
  readonly refractiveIndex: readonly number[] | number;
  readonly error: string;
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(rootDir, "fixtures", "crystaldb-golden.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as CrystalDbGoldenFixture;

describe("CrystalDB MATLAB golden fixture", () => {
  it("covers every MATLAB crystal with broad temperature and wavelength samples", () => {
    expect(fixture.schemaVersion).toBe(1);
    expect(fixture.generatedBy).toBe("tools/generate_crystaldb_golden.m");
    expect(fixture.source.engine).toBe("CrystalDB.m");
    expect(fixture.cases).toHaveLength(93);
    expect(fixture.temperatureSamplesKelvin).toEqual([200, 250, 293, 300, 350, 400, 500]);
    expect(fixture.commonWavelengthSamplesNm).toContain(532);
    expect(fixture.commonWavelengthSamplesNm).toContain(1064);
    expect(new Set(fixture.cases.map((testCase) => testCase.crystal)).size).toBe(fixture.cases.length);

    for (const testCase of fixture.cases) {
      expect(testCase.sampleCount, testCase.crystal).toBe(testCase.samples.length);
      expect(testCase.samples.length, testCase.crystal).toBeGreaterThan(100);
      expect(testCase.temperatureSamplesKelvin, testCase.crystal).toEqual(fixture.temperatureSamplesKelvin);
      expect(testCase.wavelengthSamplesNm.length, testCase.crystal).toBeGreaterThan(15);
    }
  });

  it("records MATLAB reference errors instead of dropping failing samples", () => {
    const erroredSamples = fixture.cases.flatMap((testCase) =>
      testCase.samples.filter((sample) => sample.error !== "").map((sample) => ({ crystal: testCase.crystal, sample }))
    );

    expect(erroredSamples.length).toBeGreaterThan(0);
    expect(erroredSamples.some((entry) => entry.crystal === "LITA_C")).toBe(true);
  });
});

describe("CrystalDB TypeScript parity", () => {
  const implementedCrystals = new Set<string>(CrystalDB.list());
  const implementedCases = fixture.cases.filter((testCase) => implementedCrystals.has(testCase.crystal));
  const unimplementedCases = fixture.cases.filter((testCase) => !implementedCrystals.has(testCase.crystal));

  it("documents the current port boundary", () => {
    expect(implementedCases.map((testCase) => testCase.crystal).sort()).toEqual([...implementedCrystals].sort());
    expect(implementedCases.length).toBeGreaterThanOrEqual(2);
    expect(unimplementedCases.length).toBe(fixture.cases.length - implementedCases.length);
  });

  it.each(implementedCases)("matches MATLAB refractive indices for $crystal", (testCase) => {
    for (const sample of testCase.samples) {
      if (sample.error !== "") {
        expect(
          () => CrystalDB.compute(testCase.crystal, sample.temperatureKelvin, sample.wavelengthNm),
          `${testCase.crystal} ${sample.temperatureKelvin} K ${sample.wavelengthNm} nm`
        ).toThrow();
        continue;
      }

      const actual = CrystalDB.compute(testCase.crystal, sample.temperatureKelvin, sample.wavelengthNm);
      const expected = Array.isArray(sample.refractiveIndex) ? sample.refractiveIndex : [sample.refractiveIndex];
      expectVectorCloseTo(
        actual,
        expected,
        fixture.numericTolerance.absolute,
        fixture.numericTolerance.relative,
        `${testCase.crystal} ${sample.temperatureKelvin} K ${sample.wavelengthNm} nm`
      );
    }
  });
});

function expectVectorCloseTo(
  actual: readonly number[],
  expected: readonly number[],
  absoluteTolerance: number,
  relativeTolerance: number,
  label: string
): void {
  expect(actual.length, label).toBe(expected.length);
  for (let index = 0; index < expected.length; index += 1) {
    const actualValue = actual[index];
    const expectedValue = expected[index];
    expect(actualValue, `${label}[${index}]`).toBeDefined();
    expect(expectedValue, `${label}[${index}]`).toBeDefined();

    if (actualValue === undefined || expectedValue === undefined) {
      continue;
    }

    const tolerance = absoluteTolerance + Math.abs(expectedValue) * relativeTolerance;
    expect(Math.abs(actualValue - expectedValue), `${label}[${index}]`).toBeLessThanOrEqual(tolerance);
  }
}
