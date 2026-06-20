import { CrystalDB } from "./crystal-db.js";
import type { Vector3 } from "./types.js";

interface QpmCrystalEntry {
  readonly dTensor: readonly number[];
  readonly lambdaRefNm: number;
  readonly lambdaRangeNm: readonly [number, number];
  readonly polarizations: readonly string[];
  readonly hotLengthCoeffs: ReadonlyArray<{
    readonly Tref: number;
    readonly lin: number;
    readonly quad: number;
  }>;
}

const QPM_DATA: Record<string, QpmCrystalEntry> = {
  CTA: {
    dTensor: [18.1, 18.1, 3.4, 3.4, 2.1, 2.1],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 5300],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
    ],
  },
  GAAS: {
    dTensor: [119 * 2 / Math.sqrt(3)],
    lambdaRefNm: 1533,
    lambdaRangeNm: [996, 17001],
    polarizations: ["ZZZ"],
    hotLengthCoeffs: [{ Tref: 300, lin: 5.73e-6, quad: 0 }],
  },
  GAP: {
    dTensor: [37 * 2 / Math.sqrt(3)],
    lambdaRefNm: 1313,
    lambdaRangeNm: [799, 10001],
    polarizations: ["ZZZ"],
    hotLengthCoeffs: [{ Tref: 295, lin: 4.65e-6, quad: 0 }],
  },
  KNBO3: {
    dTensor: [21.9, 21.9, 8.9, 8.9, 12.4, 12.4],
    lambdaRefNm: 532,
    lambdaRangeNm: [400, 4500],
    polarizations: ["XXX-z", "XXX-y", "YXY", "YYX", "ZXZ", "ZZX"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 5e-7, quad: 0 }, { Tref: 300, lin: 5e-6, quad: 0 },
      { Tref: 300, lin: 5e-7, quad: 0 }, { Tref: 300, lin: 5e-7, quad: 0 },
      { Tref: 300, lin: 5e-6, quad: 0 }, { Tref: 300, lin: 5e-6, quad: 0 },
    ],
  },
  KTA_1: {
    dTensor: [15.5, 15.5, 3.66, 3.66, 2.3, 2.3],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4000],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
    ],
  },
  KTA_2: {
    dTensor: [15.5, 15.5, 3.66, 3.66, 2.3, 2.3],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4000],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
    ],
  },
  KTA_3: {
    dTensor: [15.5, 15.5, 3.66, 3.66, 2.3, 2.3],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4000],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
    ],
  },
  KTP_F: {
    dTensor: [15.3, 15.3, 3.9, 3.9, 1.95, 1.95],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4500],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 7.17e-6, quad: 0 }, { Tref: 300, lin: 7.42e-6, quad: 0 },
      { Tref: 300, lin: 7.17e-6, quad: 0 }, { Tref: 300, lin: 7.17e-6, quad: 0 },
      { Tref: 300, lin: 7.42e-6, quad: 0 }, { Tref: 300, lin: 7.42e-6, quad: 0 },
    ],
  },
  KTP_H: {
    dTensor: [15.3, 15.3, 3.9, 3.9, 1.95, 1.95],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4500],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
    ],
  },
  KTP_K: {
    dTensor: [15.3, 15.3, 3.9, 3.9, 1.95, 1.95],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4500],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 305, lin: 7.88e-6, quad: 16.3e-9 }, { Tref: 305, lin: 9.48e-6, quad: 21.6e-9 },
      { Tref: 305, lin: 7.88e-6, quad: 16.3e-9 }, { Tref: 305, lin: 7.88e-6, quad: 16.3e-9 },
      { Tref: 305, lin: 9.48e-6, quad: 21.6e-9 }, { Tref: 305, lin: 9.48e-6, quad: 21.6e-9 },
    ],
  },
  LBGO: {
    dTensor: [0.70, 0.18, 0.18, 0.63],
    lambdaRefNm: 532,
    lambdaRangeNm: [260, 1070],
    polarizations: ["ZZZ", "YZY", "YYZ", "YYY"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
    ],
  },
  LNB_C: {
    dTensor: [25, 4.6, 4.6, 4.6, 4.6, 2.6],
    lambdaRefNm: 532,
    lambdaRangeNm: [330, 5500],
    polarizations: ["ZZZ", "XZX", "XXZ", "YZY", "YYZ", "YYY"],
    hotLengthCoeffs: [
      { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 }, { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 },
      { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 }, { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 },
      { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 }, { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 },
    ],
  },
  LNB_M: {
    dTensor: [25, 4.6, 4.6, 4.6, 4.6, 2.6],
    lambdaRefNm: 532,
    lambdaRangeNm: [330, 5500],
    polarizations: ["ZZZ", "XZX", "XXZ", "YZY", "YYZ", "YYY"],
    hotLengthCoeffs: [
      { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 }, { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 },
      { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 }, { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 },
      { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 }, { Tref: 298, lin: 1.54e-5, quad: 5.3e-9 },
    ],
  },
  LITA_C: {
    dTensor: [13.8, 0.85, 0.85, 0.85, 0.85, 1.5],
    lambdaRefNm: 532,
    lambdaRangeNm: [280, 5000],
    polarizations: ["ZZZ", "XZX", "XXZ", "YZY", "YYZ", "YYY"],
    hotLengthCoeffs: [
      { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 }, { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 },
      { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 }, { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 },
      { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 }, { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 },
    ],
  },
  LITA_S: {
    dTensor: [13.8, 0.85, 0.85, 0.85, 0.85, 1.5],
    lambdaRefNm: 532,
    lambdaRangeNm: [280, 5000],
    polarizations: ["ZZZ", "XZX", "XXZ", "YZY", "YYZ", "YYY"],
    hotLengthCoeffs: [
      { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 }, { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 },
      { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 }, { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 },
      { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 }, { Tref: 293, lin: 1.6e-5, quad: 7.0e-9 },
    ],
  },
  LITA_M: {
    dTensor: [12.9, 0.46, 0.46, 0.46, 0.46, 1.54],
    lambdaRefNm: 532,
    lambdaRangeNm: [280, 6000],
    polarizations: ["ZZZ", "XZX", "XXZ", "YZY", "YYZ", "YYY"],
    hotLengthCoeffs: [
      { Tref: 293, lin: 1.46e-5, quad: 2.68e-8 }, { Tref: 293, lin: 1.46e-5, quad: 2.68e-8 },
      { Tref: 293, lin: 1.46e-5, quad: 2.68e-8 }, { Tref: 293, lin: 1.46e-5, quad: 2.68e-8 },
      { Tref: 293, lin: 1.46e-5, quad: 2.68e-8 }, { Tref: 293, lin: 1.46e-5, quad: 2.68e-8 },
    ],
  },
  RTA: {
    dTensor: [15.9, 15.9, 3.9, 3.9, 2.25, 2.25],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4500],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 300, lin: 1.4468e-5, quad: 1.0454e-8 }, { Tref: 300, lin: 0, quad: 0 },
      { Tref: 300, lin: 1.4468e-5, quad: 1.0454e-8 }, { Tref: 300, lin: 1.4468e-5, quad: 1.0454e-8 },
      { Tref: 300, lin: 0, quad: 0 }, { Tref: 300, lin: 0, quad: 0 },
    ],
  },
  RTP: {
    dTensor: [15.6, 15.6, 3.8, 3.8, 2.0, 2.0],
    lambdaRefNm: 532,
    lambdaRangeNm: [350, 4500],
    polarizations: ["ZZZ-x", "ZZZ-y", "YZY", "YYZ", "XZX", "XXZ"],
    hotLengthCoeffs: [
      { Tref: 293, lin: 9.44e-6, quad: 10.2e-9 }, { Tref: 293, lin: 12.49e-6, quad: 10.0e-9 },
      { Tref: 293, lin: 9.44e-6, quad: 10.2e-9 }, { Tref: 293, lin: 9.44e-6, quad: 10.2e-9 },
      { Tref: 293, lin: 12.49e-6, quad: 10.0e-9 }, { Tref: 293, lin: 12.49e-6, quad: 10.0e-9 },
    ],
  },
  ZNSE: {
    dTensor: [27 * 2 / Math.sqrt(3)],
    lambdaRefNm: 1064,
    lambdaRangeNm: [499, 19001],
    polarizations: ["ZZZ"],
    hotLengthCoeffs: [{ Tref: 300, lin: 7.1e-6, quad: 0 }],
  },
};

export function listQpmCrystals(): string[] {
  return Object.keys(QPM_DATA).sort();
}

export function getQpmPolarizations(crystal: string): readonly string[] {
  const entry = QPM_DATA[crystal];
  if (!entry) return [];
  return entry.polarizations;
}

function axisIndex(numPol: number, ch: string): number {
  switch (ch) {
    case "X": return 0;
    case "Y": return numPol === 2 ? 0 : 1;
    case "Z": return numPol === 2 ? 1 : (numPol === 1 ? 0 : 2);
    default: return 0;
  }
}

function rc(crystal: string, temp: number, wl: number, axis: number): number {
  const v = CrystalDB.compute(crystal, temp, wl);
  return v[axis] ?? 0;
}

export interface QpmResult {
  readonly polarization: string;
  readonly periodUm: number;
  readonly dEffPmPerV: number;
}

export function calculateQpm(
  crystal: string,
  temperatureKelvin: number,
  pumpNm: number,
  signalNm: number,
  idlerNm: number,
): QpmResult[] {
  const entry = QPM_DATA[crystal];
  if (!entry) throw new Error(`QPM crystal ${crystal} not found`);

  const results: QpmResult[] = [];
  const numPol = CrystalDB.compute(crystal, temperatureKelvin, pumpNm).length;

  for (let p = 0; p < entry.polarizations.length; p++) {
    const dBase = entry.dTensor[p] !== undefined ? entry.dTensor[p]! : 0;
    if (dBase === 0) continue;

    const iZ = axisIndex(numPol, "Z");
    const nPumpVec = CrystalDB.compute(crystal, temperatureKelvin, pumpNm);
    const nSigVec = CrystalDB.compute(crystal, temperatureKelvin, signalNm);
    const nIdlVec = CrystalDB.compute(crystal, temperatureKelvin, idlerNm);
    if (nPumpVec.some((v) => v === 0) || nSigVec.some((v) => v === 0) || nIdlVec.some((v) => v === 0)) continue;

    const np = nPumpVec[iZ]!;
    const ns = nSigVec[iZ]!;
    const ni = nIdlVec[iZ]!;

    const deltaKOver2Pi = np / pumpNm - ns / signalNm - ni / idlerNm;
    if (Math.abs(deltaKOver2Pi) < 1e-20) continue;

    const periodNm = 1 / Math.abs(deltaKOver2Pi);
    const periodUm = periodNm / 1000;

    const coeff = entry.hotLengthCoeffs[p]!;
    const dT = temperatureKelvin - coeff.Tref;
    const expansion = 1 + coeff.lin * dT + coeff.quad * dT * dT;

    const dQpm = dBase * 2 / Math.PI;
    let dEff = dQpm;
    try {
      const nsh = firstSquaredIndex(crystal, entry.lambdaRefNm) - 1;
      const nfun = firstSquaredIndex(crystal, 2 * entry.lambdaRefNm) - 1;
      const npMiller = firstSquaredIndex(crystal, pumpNm) - 1;
      const n2pMiller = firstSquaredIndex(crystal, 2 * pumpNm) - 1;
      const millerScale = (npMiller / nsh) * (n2pMiller / nfun) ** 2;
      dEff = dQpm * millerScale;
    } catch {
      // Miller scaling unavailable (e.g., 2nd harmonic outside transmission range);
      // fall back to uncorrected d_eff.
    }

    results.push({
      polarization: entry.polarizations[p]!,
      periodUm,
      dEffPmPerV: dEff,
    });
  }

  return results.sort((a, b) => a.periodUm - b.periodUm);
}

/** Full QPM sweep result matching MATLAB's Z matrix columns. */
export interface QpmSweepRow {
  readonly signalNm: number;
  readonly idlerNm: number;
  readonly periodUm: number;
  readonly tempRangeKCm: number;
  readonly gviSignal: number;
  readonly gviIdler: number;
  readonly gviPump: number;
  readonly gddSignal: number;
  readonly gddIdler: number;
  readonly gddPump: number;
}

/** Run a full QPM wavelength sweep (matching MATLAB snlo_qpm_func.m lines 562-612).
 * @returns Array of sweep rows, one per (signal, idler) pair.
 */
export function qpmSweep(
  crystal: string,
  temperatureKelvin: number,
  pumpNm: number,
  red1Nm: number,
  red2Nm: number,
  polIndex: number,
): QpmSweepRow[] {
  const entry = QPM_DATA[crystal];
  if (!entry) throw new Error(`QPM crystal ${crystal} not found`);

  const pol = entry.polarizations[polIndex];
  if (!pol) throw new Error(`Polarization index ${polIndex} out of range`);

  const lambdaP = pumpNm;
  const blue = Math.min(red1Nm, red2Nm);
  const red = Math.max(red1Nm, red2Nm);

  const nPumpVec = CrystalDB.compute(crystal, temperatureKelvin, lambdaP);
  if (nPumpVec.some((v) => v === 0)) return [];
  const numPol = nPumpVec.length;

  const polI = [axisIndex(numPol, pol[0]!), axisIndex(numPol, pol[1]!), axisIndex(numPol, pol[2]!)];
  const iz = polI[2]!;
  const i1 = polI[0]!;
  const i2 = polI[1]!;

  const nPump = nPumpVec[iz]!;
  const ntPump = rc(crystal, temperatureKelvin + 1, lambdaP, iz);
  const nnPump = rc(crystal, temperatureKelvin, 1 / (1 / lambdaP - 1e-7), iz);
  const npPump = rc(crystal, temperatureKelvin, 1 / (1 / lambdaP + 1e-7), iz);

  // Thermal expansion alpha = hot_length(T+1) - hot_length(T) (MATLAB alpha)
  const hlCoeff = entry.hotLengthCoeffs[polIndex];
  let alpha = 0;
  if (hlCoeff) {
    const hlT = 1 + hlCoeff.lin * (temperatureKelvin - hlCoeff.Tref) + hlCoeff.quad * (temperatureKelvin - hlCoeff.Tref) ** 2;
    const hlTp1 = 1 + hlCoeff.lin * (temperatureKelvin + 1 - hlCoeff.Tref) + hlCoeff.quad * (temperatureKelvin + 1 - hlCoeff.Tref) ** 2;
    alpha = hlTp1 - hlT;
  }

  // Determine sweep range
  const type1 = pol[0] === pol[1];
  const range = type1
    ? [Math.min(blue, 1 / (1 / lambdaP - 1 / red)), lambdaP * 2] as const
    : [Math.min(blue, 1 / (1 / lambdaP - 1 / red)), Math.max(red, 1 / (1 / lambdaP - 1 / blue))] as const;

  const npts = type1 ? 200 : 400;
  const deltaLambda = (range[1] - range[0]) / npts;

  const rows: QpmSweepRow[] = [];

  for (let i = 0; i < npts; i++) {
    const lambdaI = range[0] + deltaLambda * i;
    const lambdaS = 1 / (1 / lambdaP - 1 / lambdaI);
    if (!Number.isFinite(lambdaS) || lambdaS <= 0) continue;
    if (lambdaS < 0.9 * lambdaP) continue;

    // Wavenumber-shifted wavelengths for finite-difference derivatives
    const lambdaSp = 1 / (1 / lambdaS + 1e-7);
    const lambdaSn = 1 / (1 / lambdaS - 1e-7);
    const lambdaIp = 1 / (1 / lambdaI + 1e-7);
    const lambdaIn = 1 / (1 / lambdaI - 1e-7);

    // Signal refractive indices at 3 wavelengths (red, center, blue shifted by 1 wavenumber)
    const nSn = rc(crystal, temperatureKelvin, lambdaSn, i1);
    const nS = rc(crystal, temperatureKelvin, lambdaS, i1);
    const nSp = rc(crystal, temperatureKelvin, lambdaSp, i1);
    if (nSn === 0 || nS === 0 || nSp === 0) continue;

    // Idler refractive indices at 3 wavelengths
    const nIn = rc(crystal, temperatureKelvin, lambdaIn, i2);
    const nI = rc(crystal, temperatureKelvin, lambdaI, i2);
    const nIp = rc(crystal, temperatureKelvin, lambdaIp, i2);
    if (nIn === 0 || nI === 0 || nIp === 0) continue;

    // Period
    const omegaN = nPump / lambdaP - nS / lambdaS - nI / lambdaI;
    if (Math.abs(omegaN) < 1e-20) continue;
    const periodUm = 0.001 / Math.abs(omegaN);

    // Temperature bandwidth
    const nStZ = rc(crystal, temperatureKelvin + 1, lambdaS, i1);
    const nItZ = rc(crystal, temperatureKelvin + 1, lambdaI, i2);
    const tempRange = Math.abs(1e-7 / (omegaN / (1 + alpha) - ntPump / lambdaP + nStZ / lambdaS + nItZ / lambdaI));

    // Group velocity indices (MATLAB lines 604-606)
    const gviS = 0.5 * (nS + nSp + 1e7 * ((1e-7 + 2 / lambdaS) * (nSp - nS)));
    const gviI = 0.5 * (nI + nIp + 1e7 * ((1e-7 + 2 / lambdaI) * (nIp - nI)));
    const gviP = 0.5 * (nPump + npPump + 1e7 * (1e-7 + 2 / lambdaP) * (npPump - nPump));

    // GDD (MATLAB lines 607-612)
    const grpS = 0.5 * (nS + nSn + 1e7 * (-1e-7 + 2 / lambdaS) * (nS - nSn));
    const grpI = 0.5 * (nI + nIn + 1e7 * (-1e-7 + 2 / lambdaI) * (nI - nIn));
    const grpP = 0.5 * (nPump + nnPump + 1e7 * (-1e-7 + 2 / lambdaP) * (nPump - nnPump));
    const gddS = -5.8946 * gviS * gviS * 3e6 * (1 / gviS - 1 / grpS);
    const gddI = -5.8946 * gviI * gviI * 3e6 * (1 / gviI - 1 / grpI);
    const gddP = -5.8946 * gviP * gviP * 3e6 * (1 / gviP - 1 / grpP);

    rows.push({
      signalNm: lambdaS,
      idlerNm: lambdaI,
      periodUm,
      tempRangeKCm: Number.isFinite(tempRange) ? tempRange : 0,
      gviSignal: gviS,
      gviIdler: gviI,
      gviPump: gviP,
      gddSignal: gddS,
      gddIdler: gddI,
      gddPump: gddP,
    });
  }

  return rows;
}

/** Find the signal wavelength that satisfies the QPM condition for a given period.
 * Sweeps to find the period closest to the target, then refines with bisection.
 */
function qpmFindSignal(
  crystal: string,
  temperatureKelvin: number,
  pumpNm: number,
  red1Nm: number,
  red2Nm: number,
  periodTargetUm: number,
  polIndex: number,
): { signalNm: number; idlerNm: number; periodUm: number } | undefined {
  const entry = QPM_DATA[crystal];
  if (!entry) return undefined;

  const pol = entry.polarizations[polIndex];
  if (!pol) return undefined;

  const blue = Math.min(red1Nm, red2Nm);
  const red = Math.max(red1Nm, red2Nm);

  const nPumpVec = CrystalDB.compute(crystal, temperatureKelvin, pumpNm);
  if (nPumpVec.some((v) => v === 0)) return undefined;
  const numPol = nPumpVec.length;

  const polI = [axisIndex(numPol, pol[0]!), axisIndex(numPol, pol[1]!), axisIndex(numPol, pol[2]!)];
  const iz = polI[2]!;
  const i1 = polI[0]!;
  const nPump = nPumpVec[iz]!;

  // Apply thermal expansion to the target period (matching MATLAB snlo_qpm_func.m)
  // Compute grating k-vector with thermal expansion (matching MATLAB snlo_qpm_func.m)
  // MATLAB: expansion = hotLength(T) - hotLength(295), then k_g = 1E7./(grating_period.*(1+expansion))
  const periodNm = periodTargetUm * 1000;
  const coeff = entry.hotLengthCoeffs[polIndex];
  let expansion = 0;
  if (coeff) {
    const hlNow = 1 + coeff.lin * (temperatureKelvin - coeff.Tref) + coeff.quad * (temperatureKelvin - coeff.Tref) ** 2;
    const hl295 = 1 + coeff.lin * (295 - coeff.Tref) + coeff.quad * (295 - coeff.Tref) ** 2;
    expansion = hlNow - hl295;
  }
  const kG = 1e7 / (periodNm * (1 + expansion)); // cm⁻¹

  // Pump k-vector in cm⁻¹
  const omegaP = 1e7 / pumpNm;
  const kP = omegaP * nPump;

  // Determine wavenumber search range (MATLAB snlo_qpm_func.m lines 1688-1696)
  // Transmission range in wavenumbers
  const transRangeWn = [1e7 / Math.max(red1Nm, red2Nm), 1e7 / Math.min(red1Nm, red2Nm)] as const;
  const omegaRedDest = Math.max(transRangeWn[0], Math.min(1e7 / Math.max(red1Nm, red2Nm), omegaP - 1e7 / Math.min(red1Nm, red2Nm)));
  const omegaBluest = Math.min(transRangeWn[1], Math.max(1e7 / Math.min(red1Nm, red2Nm), omegaP - 1e7 / Math.max(red1Nm, red2Nm)));
  const type1 = pol[0] === pol[1];
  let omegaRed = omegaRedDest;
  let omegaBlue = omegaBluest;
  if (type1) omegaBlue = Math.min(omegaBlue, 0.5 * omegaP);

  const deltaOmega = 5; // cm⁻¹ step, matching MATLAB
  const npts = Math.floor((omegaBlue - omegaRed) / deltaOmega);
  if (npts < 2) return undefined;

  // Sweep signal wavenumber to find zero crossings of delta_k
  const i2 = polI[1]!;
  for (let i = 0; i < npts - 1; i++) {
    const omegaS = omegaRed + deltaOmega * i;
    const omegaI = omegaP - omegaS;
    if (omegaI <= 0) continue;

    const omegaS1 = omegaS;
    const omegaS2 = omegaS + deltaOmega;
    const omegaI1 = omegaI;
    const omegaI2 = omegaP - omegaS2;
    if (omegaI2 <= 0) continue;

    // Convert to nm for index lookup
    const sigNm1 = 1e7 / omegaS1;
    const sigNm2 = 1e7 / omegaS2;
    const idlNm1 = 1e7 / omegaI1;
    const idlNm2 = 1e7 / omegaI2;

    const nS1 = rc(crystal, temperatureKelvin, sigNm1, i1);
    const nI1 = rc(crystal, temperatureKelvin, idlNm1, i2);
    const nS2 = rc(crystal, temperatureKelvin, sigNm2, i1);
    const nI2 = rc(crystal, temperatureKelvin, idlNm2, i2);
    if (nS1 === 0 || nI1 === 0 || nS2 === 0 || nI2 === 0) continue;

    const kS1 = omegaS1 * nS1;
    const kI1 = omegaI1 * nI1;
    const kS2 = omegaS2 * nS2;
    const kI2 = omegaI2 * nI2;

    const dk1 = kG - Math.abs(kP - kS1 - kI1);
    const dk2 = kG - Math.abs(kP - kS2 - kI2);

    if (Number.isFinite(dk1) && Number.isFinite(dk2) && Math.sign(dk1) !== Math.sign(dk2) && dk1 !== 0 && dk2 !== 0) {
      // Zero crossing found — refine with bisection
      let lo = omegaS1, hi = omegaS2;
      let flo = dk1, fhi = dk2;
      for (let iter = 0; iter < 80; iter++) {
        const mid = (lo + hi) / 2;
        const omegaMid = mid;
        const omegaImid = omegaP - omegaMid;
        const sigMid = 1e7 / omegaMid;
        const idlMid = 1e7 / omegaImid;
        const nSMid = rc(crystal, temperatureKelvin, sigMid, i1);
        const nIMid = rc(crystal, temperatureKelvin, idlMid, i2);
        if (nSMid === 0 || nIMid === 0) break;
        const fmid = kG - Math.abs(kP - omegaMid * nSMid - omegaImid * nIMid);
        if (Math.abs(fmid) < 1e-12) {
          const periodUmMid = 0.001 / Math.abs(nPump / pumpNm - nSMid / sigMid - nIMid / idlMid);
          return { signalNm: sigMid, idlerNm: idlMid, periodUm: periodUmMid };
        }
        if (Math.sign(flo) === Math.sign(fmid)) { lo = mid; flo = fmid; }
        else { hi = mid; fhi = fmid; }
      }
      // Return the mid point
      const omegaBest = (lo + hi) / 2;
      const sigBest = 1e7 / omegaBest;
      const idlBest = 1e7 / (omegaP - omegaBest);
      const nSb = rc(crystal, temperatureKelvin, sigBest, i1);
      const nIb = rc(crystal, temperatureKelvin, idlBest, i2);
      const periodBest = 0.001 / Math.abs(nPump / pumpNm - nSb / sigBest - nIb / idlBest);
      return { signalNm: sigBest, idlerNm: idlBest, periodUm: periodBest };
    }
  }
  return undefined;
}

export interface QpmTuningRow {
  readonly param: number;
  readonly signalNm: number;
  readonly idlerNm: number;
  readonly periodUm: number;
}

/** Temperature tuning: sweep temperature at a fixed period using root-finding. */
export function qpmTempTune(
  crystal: string,
  pumpNm: number,
  red1Nm: number,
  red2Nm: number,
  periodUm: number,
  polIndex: number,
  tempMin: number,
  tempMax: number,
  tempSteps: number,
): QpmTuningRow[] {
  const results: QpmTuningRow[] = [];
  for (let i = 0; i <= tempSteps; i++) {
    const temp = tempMin + (tempMax - tempMin) * i / tempSteps;
    const found = qpmFindSignal(crystal, temp, pumpNm, red1Nm, red2Nm, periodUm, polIndex);
    if (found) results.push({ param: temp, ...found });
  }
  return results;
}

/** Pump tuning: sweep pump wavelength at a fixed period and temperature using root-finding. */
export function qpmPumpTune(
  crystal: string,
  temperatureKelvin: number,
  pumpMinNm: number,
  pumpMaxNm: number,
  red1Nm: number,
  red2Nm: number,
  periodUm: number,
  polIndex: number,
  pumpSteps: number,
): QpmTuningRow[] {
  const results: QpmTuningRow[] = [];
  for (let i = 0; i <= pumpSteps; i++) {
    const pump = pumpMinNm + (pumpMaxNm - pumpMinNm) * i / pumpSteps;
    const found = qpmFindSignal(crystal, temperatureKelvin, pump, red1Nm, red2Nm, periodUm, polIndex);
    if (found) results.push({ param: pump, ...found });
  }
  return results;
}

function firstSquaredIndex(crystal: string, wavelengthNm: number): number {
  const idx = CrystalDB.compute(crystal, 300, wavelengthNm)[0];
  if (idx === undefined || idx === 0) throw new Error(`Could not compute ${crystal} Miller scaling`);
  return idx ** 2;
}
