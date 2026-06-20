import type { QmixInput, Vector3 } from "./types.js";

export interface NormalizedQmixInput extends QmixInput {
  readonly wavelengthsNm: Vector3;
}

export function normalizeInput(input: QmixInput): NormalizedQmixInput {
  return {
    ...input,
    wavelengthsNm: computeCanonicalWavelengths(input)
  };
}

export function computeCanonicalWavelengths(input: QmixInput): Vector3 {
  const wavelengths = [
    input.wavelengthRed1Nm,
    input.wavelengthRed2Nm,
    input.wavelengthBlueNm
  ];

  for (const wavelength of wavelengths) {
    if (!Number.isFinite(wavelength)) {
      throw new Error("All wavelength values must be finite numbers");
    }
    if (wavelength < 0) {
      throw new Error("Wavelength values must be non-negative");
    }
  }

  const zeroIndexes = wavelengths
    .map((wavelength, index) => (wavelength === 0 ? index : -1))
    .filter((index) => index >= 0);

  let zeroIndex: number;
  if (zeroIndexes.length === 0) {
    const red1 = wavelengths[0];
    const red2 = wavelengths[1];
    const blue = wavelengths[2];
    if (red1 === undefined || red2 === undefined || blue === undefined || red1 === 0 || red2 === 0 || blue === 0) {
      throw new Error("Exactly one wavelength must be zero");
    }
    const expectedBlue = 1 / (1 / red1 + 1 / red2);
    const energyError = Math.abs(expectedBlue - blue) / blue;
    if (energyError > 1e-12) {
      throw new Error(
        `Wavelengths do not satisfy energy conservation: 1/${red1} + 1/${red2} = 1/${expectedBlue.toFixed(4)}, not 1/${blue}`
      );
    }
    wavelengths[2] = expectedBlue;
    zeroIndex = 2;
  } else {
    if (zeroIndexes.length !== 1) {
      throw new Error("Exactly one wavelength must be zero");
    }
    const first = zeroIndexes[0];
    if (first === undefined) {
      throw new Error("Exactly one wavelength must be zero");
    }
    zeroIndex = first;
  }

  if (zeroIndex === 2) {
    const red1 = wavelengths[0];
    const red2 = wavelengths[1];
    if (red1 === undefined || red2 === undefined || red1 === 0 || red2 === 0) {
      throw new Error("Cannot compute blue wavelength from zero red wavelength");
    }
    wavelengths[2] = 1 / (1 / red1 + 1 / red2);
  } else {
    const known = wavelengths.filter((wavelength) => wavelength !== 0);
    const first = known[0];
    const second = known[1];
    if (first === undefined || second === undefined) {
      throw new Error("Cannot compute missing red wavelength");
    }
    wavelengths[zeroIndex] = 1 / Math.abs(1 / second - 1 / first);
  }

  const sorted = [...wavelengths].sort((a, b) => b - a);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  if (first === undefined || second === undefined || third === undefined) {
    throw new Error("Expected three wavelengths");
  }

  return [first, second, third];
}
