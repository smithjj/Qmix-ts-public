import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { calculateQpm } from "../src/index.js";

interface QpmGoldenFixture {
  readonly schemaVersion: 1;
  readonly generatedBy: string;
  readonly source: { readonly matlabVersion: string; readonly engine: string };
  readonly numericTolerance: { readonly absolute: number; readonly relative: number };
  readonly cases: readonly QpmGoldenCase[];
}

interface QpmGoldenCase {
  readonly name: string;
  readonly description: string;
  readonly input: {
    readonly selectedCrystal: string;
    readonly temperatureKelvin: number;
    readonly pumpNm: number;
    readonly signalNm: number;
    readonly idlerNm: number;
  };
  readonly expected: {
    readonly resultCount: number;
    readonly results: readonly { readonly polarization: string; readonly periodUm: number; readonly dEffPmPerV: number }[];
    readonly error: string;
  };
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(rootDir, "fixtures", "qpm-golden.json");

if (!existsSync(fixturePath)) {
  describe.skip("QPM golden fixture", () => {
    it("(fixture not yet generated; run MATLAB: generate_qpm_golden)", () => {});
  });
} else {
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as QpmGoldenFixture;

  describe("QPM golden fixture", () => {
    it("documents the reference fixture", () => {
      expect(fixture.schemaVersion).toBe(1);
      expect(fixture.generatedBy).toBe("tools/generate_qpm_golden.m");
      expect(fixture.source.engine).toBe("qpm.m");
      expect(fixture.cases.length).toBeGreaterThanOrEqual(15);
    });

    it.each(fixture.cases)("matches MATLAB for $name", (testCase) => {
      if (testCase.expected.error) {
        return;
      }

      const actual = calculateQpm(
        testCase.input.selectedCrystal,
        testCase.input.temperatureKelvin,
        testCase.input.pumpNm,
        testCase.input.signalNm,
        testCase.input.idlerNm,
      );

      expect(actual, testCase.name).toHaveLength(testCase.expected.resultCount);

      for (let i = 0; i < testCase.expected.results.length; i += 1) {
        const a = actual[i];
        const e = testCase.expected.results[i];
        expect(a, `${testCase.name}[${i}]`).toBeDefined();
        expect(e, `${testCase.name}[${i}]`).toBeDefined();
        if (!a || !e) continue;

        expect(a.polarization, `${testCase.name}[${i}].polarization`).toBe(e.polarization);

        // periodUm: use 1e-6 absolute tolerance (nm-scale precision in μm)
        const pDiff = Math.abs(a.periodUm - e.periodUm);
        expect(pDiff, `${testCase.name}[${i}].periodUm`).toBeLessThanOrEqual(1e-6);

        // dEffPmPerV: use relative + absolute tolerance
        const dTol = Math.max(1e-6, Math.abs(e.dEffPmPerV) * 1e-9 + 1e-9);
        const dDiff = Math.abs(a.dEffPmPerV - e.dEffPmPerV);
        expect(dDiff, `${testCase.name}[${i}].dEffPmPerV`).toBeLessThanOrEqual(dTol);
      }
    });
  });
}
