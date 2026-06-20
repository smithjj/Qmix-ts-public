import { CrystalDB } from "./crystal-db.js";
import type { MixingType, PolarizationTriplet, QmixInput, QmixResult, Vector2, Vector3 } from "./types.js";
import { computeCanonicalWavelengths } from "./wavelengths.js";

/** Main phase-matching engine. Given crystal, wavelengths, and temperature,
 * finds all valid propagation angles and polarization combinations satisfying
 * energy conservation and momentum conservation (phase matching) for three-wave
 * mixing processes (SHG, SFG, OPO).
 */
export class QmixEngine {
  /** Run the phase-matching search.
   * @param input - Wavelengths, crystal, temperature, plane, and mixing type.
   * @returns Array of results — one per valid polarization combination.
   *          Empty array if no phase-matching solutions exist.
   */
  calculate(input: QmixInput): QmixResult[] {
    const crystal = input.selectedCrystal;
    const temperatureKelvin = input.temperatureKelvin;
    const wavelengthsNm = computeCanonicalWavelengths(input);
    const omega = map3(wavelengthsNm, (wavelength) => 1 / wavelength);
    const omegav = map3(omega, (value) => value + 1e-7);
    const omegavp = map3(omega, (value) => value - 1e-7);
    const lambdav = map3(omegav, (value) => 1 / value);
    const lambdavp = map3(omegavp, (value) => 1 / value);

    const referenceIndex = CrystalDB.compute(crystal, temperatureKelvin, wavelengthsNm[0]);
    if (referenceIndex.some((value) => value === 0)) {
      throw new Error("Wavelength out of transmission range");
    }

    if (referenceIndex.length === 2) {
      const nxyz = lookupUniaxialIndices(crystal, temperatureKelvin, wavelengthsNm);
      const nxyzt = lookupUniaxialIndices(crystal, temperatureKelvin + 1, wavelengthsNm);
      const nxyzv = lookupUniaxialIndices(crystal, temperatureKelvin, lambdav);
      const nxyzvp = lookupUniaxialIndices(crystal, temperatureKelvin, lambdavp);

      if (crystal === "ZZ_U") {
        throw new Error(`Uniaxial crystal ${crystal} nonlinear coefficients must be loaded from file; not implemented in QmixEngine`);
      }
      return calcUniaxial(crystal,
        wavelengthsNm,
        input.type,
        omega,
        omegav,
        omegavp,
        nxyz,
        nxyzt,
        nxyzv,
        nxyzvp
      );
    }

    if (referenceIndex.length === 3) {
      const nxyz = lookupBiaxialIndices(crystal, temperatureKelvin, wavelengthsNm);
      const nxyzt = lookupBiaxialIndices(crystal, temperatureKelvin + 1, wavelengthsNm);
      const nxyzv = lookupBiaxialIndices(crystal, temperatureKelvin, lambdav);
      const nxyzvp = lookupBiaxialIndices(crystal, temperatureKelvin, lambdavp);

      if (crystal === "ZZ_B") {
        throw new Error(`Biaxial crystal ${crystal} d-tensor must be loaded from file; not implemented in QmixEngine`);
      }
      return calcBiaxial(crystal,
        input.principalPlane,
        wavelengthsNm,
        input.type,
        omega,
        omegav,
        omegavp,
        nxyz,
        nxyzt,
        nxyzv,
        nxyzvp
      );
    }

    return [];
  }
}

type Matrix3x2 = readonly [Vector2, Vector2, Vector2];
export type Matrix3x3 = readonly [Vector3, Vector3, Vector3];

function lookupUniaxialIndices(crystal: string, temperatureKelvin: number, wavelengthsNm: Vector3): Matrix3x2 {
  return [
    lookupUniaxialIndex(crystal, temperatureKelvin, wavelengthsNm[0]),
    lookupUniaxialIndex(crystal, temperatureKelvin, wavelengthsNm[1]),
    lookupUniaxialIndex(crystal, temperatureKelvin, wavelengthsNm[2])
  ];
}

function lookupUniaxialIndex(crystal: string, temperatureKelvin: number, wavelengthNm: number): Vector2 {
  const index = CrystalDB.compute(crystal, temperatureKelvin, wavelengthNm);
  if (index.length !== 2) {
    throw new Error(`Biaxial crystal ${crystal} is not implemented in QmixEngine yet`);
  }

  const ordinary = index[0];
  const extraordinary = index[1];
  if (ordinary === undefined || extraordinary === undefined || ordinary === 0 || extraordinary === 0) {
    throw new Error("Wavelength out of transmission range");
  }
  return [ordinary, extraordinary];
}

function lookupBiaxialIndices(crystal: string, temperatureKelvin: number, wavelengthsNm: Vector3): Matrix3x3 {
  return [
    lookupBiaxialIndex(crystal, temperatureKelvin, wavelengthsNm[0]),
    lookupBiaxialIndex(crystal, temperatureKelvin, wavelengthsNm[1]),
    lookupBiaxialIndex(crystal, temperatureKelvin, wavelengthsNm[2])
  ];
}

function lookupBiaxialIndex(crystal: string, temperatureKelvin: number, wavelengthNm: number): Vector3 {
  const index = CrystalDB.compute(crystal, temperatureKelvin, wavelengthNm);
  if (index.length !== 3) {
    throw new Error(`Uniaxial crystal ${crystal} is not implemented in the biaxial QmixEngine path`);
  }

  const nx = index[0];
  const ny = index[1];
  const nz = index[2];
  if (nx === undefined || ny === undefined || nz === undefined || nx === 0 || ny === 0 || nz === 0) {
    throw new Error("Wavelength out of transmission range");
  }
  return [nx, ny, nz];
}

type WaveIndex = 0 | 1 | 2;
type AxisIndex = 0 | 1 | 2;
type BooleanVector3 = readonly [boolean, boolean, boolean];

function calcUniaxial(
  crystal: string,
  lambda: Vector3,
  mixType: MixingType,
  omega: Vector3,
  omegav: Vector3,
  omegavp: Vector3,
  nxyz: Matrix3x2,
  nxyzt: Matrix3x2,
  nxyzv: Matrix3x2,
  nxyzvp: Matrix3x2
): QmixResult[] {
  const a = nxyz[0][0] * omega[0];
  const b = nxyz[1][0] * omega[1];
  const c = nxyz[2][0] * omega[2];
  const d = nxyz[0][1] * omega[0];
  const e = nxyz[1][1] * omega[1];
  const f = nxyz[2][1] * omega[2];
  const results: QmixResult[] = [];

  addAnalyticUniaxialResult(results, (1 - ((a + b) / c) ** 2) / (((a + b) / f) ** 2 - 1), {
    crystal,
    lambda,
    polarizations: "ooe",
    dEffIndex: 0,
    dEffWalkoffWave: 2,
    extraordinary: [false, false, true],
    mixType,
    omega,
    omegav,
    omegavp,
    nxyz,
    nxyzt,
    nxyzv,
    nxyzvp
  });

  for (const theta of findPMAngles((angle) => deltaKEoeUni(angle, a, b, c, d, f))) {
    results.push(makeUniaxialBranchResult(theta, {
      crystal,
      lambda,
      polarizations: "eoe",
      dEffIndex: 1,
      dEffWalkoffWave: 2,
      extraordinary: [true, false, true],
      mixType,
      omega,
      omegav,
      omegavp,
      nxyz,
      nxyzt,
      nxyzv,
      nxyzvp
    }));
  }

  if (lambda[0] !== lambda[1]) {
    for (const theta of findPMAngles((angle) => deltaKOeeUni(angle, a, b, c, e, f))) {
      results.push(makeUniaxialBranchResult(theta, {
        crystal,
        lambda,
        polarizations: "oee",
        dEffIndex: 1,
        dEffWalkoffWave: 2,
        extraordinary: [false, true, true],
        mixType,
        omega,
        omegav,
        omegavp,
        nxyz,
        nxyzt,
        nxyzv,
        nxyzvp
      }));
    }
  }

  for (const theta of findPMAngles((angle) => deltaKEeoUni(angle, a, b, c, d, e))) {
    results.push(makeUniaxialBranchResult(theta, {
      crystal,
      lambda,
      polarizations: "eeo",
      dEffIndex: 1,
      dEffWalkoffWave: 0,
      extraordinary: [true, true, false],
      mixType,
      omega,
      omegav,
      omegavp,
      nxyz,
      nxyzt,
      nxyzv,
      nxyzvp
    }));
  }

  addAnalyticUniaxialResult(results, (1 - (b / (c - a)) ** 2) / ((b / (c - a)) ** 2 - (b / e) ** 2), {
    crystal,
    lambda,
    polarizations: "oeo",
    dEffIndex: 0,
    dEffWalkoffWave: 1,
    extraordinary: [false, true, false],
    mixType,
    omega,
    omegav,
    omegavp,
    nxyz,
    nxyzt,
    nxyzv,
    nxyzvp
  });

  if (lambda[0] !== lambda[1]) {
    addAnalyticUniaxialResult(results, (1 - (a / (c - b)) ** 2) / ((a / (c - b)) ** 2 - (a / d) ** 2), {
      crystal,
      lambda,
      polarizations: "eoo",
      dEffIndex: 0,
      dEffWalkoffWave: 0,
      extraordinary: [true, false, false],
      mixType,
      omega,
      omegav,
      omegavp,
      nxyz,
      nxyzt,
      nxyzv,
      nxyzvp
    });
  }

  return results;
}

interface UniaxialBranchOptions {
  readonly crystal: string;
  readonly lambda: Vector3;
  readonly polarizations: PolarizationTriplet;
  readonly dEffIndex: 0 | 1;
  readonly dEffWalkoffWave: WaveIndex;
  readonly extraordinary: BooleanVector3;
  readonly mixType: MixingType;
  readonly omega: Vector3;
  readonly omegav: Vector3;
  readonly omegavp: Vector3;
  readonly nxyz: Matrix3x2;
  readonly nxyzt: Matrix3x2;
  readonly nxyzv: Matrix3x2;
  readonly nxyzvp: Matrix3x2;
}

function addAnalyticUniaxialResult(results: QmixResult[], discriminant: number, options: UniaxialBranchOptions): void {
  if (discriminant >= 0) {
    results.push(makeUniaxialBranchResult(Math.atan(Math.sqrt(discriminant)), options));
  }
}

function makeUniaxialBranchResult(theta: number, options: UniaxialBranchOptions): QmixResult {
  const { crystal, lambda, polarizations, dEffIndex, dEffWalkoffWave, extraordinary, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp } = options;
  const phi = 0;
  const nt = extraordinaryIndices(theta, nxyz);
  const nta = extraordinaryIndices(theta + 0.001, nxyz);
  const walkoff = map3(nt, (index, wave) => (extraordinary[wave] ? -((nta[wave] - index) / index) / 1e-3 * 1e3 : 0));
  const dEff = uniNl(crystal, lambda[2], theta + 0.001 * walkoff[dEffWalkoffWave])[dEffIndex];
  const ntv = extraordinaryIndices(theta, nxyzv);
  const ntvp = extraordinaryIndices(theta, nxyzvp);
  const ntt = extraordinaryIndices(theta, nxyzt);
  const rind = map3(nxyz, (indices, wave) => (extraordinary[wave] ? nt[wave] : indices[0]));
  const rindv = map3(nxyzv, (indices, wave) => (extraordinary[wave] ? ntv[wave] : indices[0]));
  const rindvp = map3(nxyzvp, (indices, wave) => (extraordinary[wave] ? ntvp[wave] : indices[0]));
  const rindt = map3(nxyzt, (indices, wave) => (extraordinary[wave] ? ntt[wave] : indices[0]));

  return makeResult({
    lambda,
    polarizations,
    theta,
    phi,
    dEff,
    walkoff,
    rind,
    rindv,
    rindvp,
    temperatureRangeKCm: phaseMismatchTemperatureRange(rind, rindt, omega),
    mixType,
    omega,
    omegav,
    omegavp
  });
}

function calcBiaxial(
  crystal: string,
  plane: string,
  lambda: Vector3,
  mixType: MixingType,
  omega: Vector3,
  omegav: Vector3,
  omegavp: Vector3,
  nxyz: Matrix3x3,
  nxyzt: Matrix3x3,
  nxyzv: Matrix3x3,
  nxyzvp: Matrix3x3
): QmixResult[] {
  const a = nxyz[0][0] * omega[0];
  const b = nxyz[0][1] * omega[0];
  const c = nxyz[0][2] * omega[0];
  const d = nxyz[1][0] * omega[1];
  const e = nxyz[1][1] * omega[1];
  const f = nxyz[1][2] * omega[1];
  const g = nxyz[2][0] * omega[2];
  const h = nxyz[2][1] * omega[2];
  const i = nxyz[2][2] * omega[2];

  switch (plane) {
    case "XY":
      return calcBiaxialPlaneXy(crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp, a, b, c, d, e, f, g, h);
    case "XZ":
      return calcBiaxialPlaneXz(crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp, a, b, c, d, e, f, g, h, i);
    case "YZ":
      return calcBiaxialPlaneYz(crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp, a, b, c, d, e, f, g);
    default:
      return [];
  }
}

function calcBiaxialPlaneXy(
  crystal: string,
  lambda: Vector3,
  mixType: MixingType,
  omega: Vector3,
  omegav: Vector3,
  omegavp: Vector3,
  nxyz: Matrix3x3,
  nxyzt: Matrix3x3,
  nxyzv: Matrix3x3,
  nxyzvp: Matrix3x3,
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number
): QmixResult[] {
  const results: QmixResult[] = [];
  const base = biaxialBranchBase(crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp);
  addAnalyticBiaxialResult(results, (1 - ((c + f) / h) ** 2) / (((c + f) / g) ** 2 - 1), {
    ...base,
    polarizations: "ooe",
    theta: Math.PI / 2,
    phi: 0,
    variable: "phi",
    indexAtAngle: biaxialXyIndices,
    ordinaryAxis: 2,
    extraordinary: [false, false, true],
    dEffKind: "xy",
    dEffNegKind: "xy_neg",
    dEffWalkoffWave: 2,
    signFlip: "phi",
    negativeZeroForOrdinaryWalkoff: false
  });

  if (lambda[0] !== lambda[1]) {
    for (const phi of findPMAngles((angle) => deltaKEoeXy(angle, a, b, f, g, h))) {
      results.push(makeBiaxialBranchResult({
        ...base,
        polarizations: "eoe",
        theta: Math.PI / 2,
        phi,
        variable: "phi",
        indexAtAngle: biaxialXyIndices,
        ordinaryAxis: 2,
        extraordinary: [true, false, true],
        dEffKind: "eoe_xy",
        dEffNegKind: "eoe_xy_neg",
        dEffWalkoffWave: 2,
        signFlip: "phi",
        negativeZeroForOrdinaryWalkoff: true
      }));
    }

    for (const phi of findPMAngles((angle) => deltaKOeeXy(angle, c, d, e, g, h))) {
      results.push(makeBiaxialBranchResult({
        ...base,
        polarizations: "oee",
        theta: Math.PI / 2,
        phi,
        variable: "phi",
        indexAtAngle: biaxialXyIndices,
        ordinaryAxis: 2,
        extraordinary: [false, true, true],
        dEffKind: "oee_xy",
        dEffNegKind: "oee_xy_neg",
        dEffWalkoffWave: 2,
        signFlip: "phi",
        negativeZeroForOrdinaryWalkoff: true
      }));
    }
  }

  return results;
}

function calcBiaxialPlaneYz(
  crystal: string,
  lambda: Vector3,
  mixType: MixingType,
  omega: Vector3,
  omegav: Vector3,
  omegavp: Vector3,
  nxyz: Matrix3x3,
  nxyzt: Matrix3x3,
  nxyzv: Matrix3x3,
  nxyzvp: Matrix3x3,
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number
): QmixResult[] {
  const results: QmixResult[] = [];
  const base = biaxialBranchBase(crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp);
  for (const theta of findPMAngles((angle) => deltaKEeoYz(angle, b, c, e, f, g))) {
    results.push(makeBiaxialBranchResult({
      ...base,
      polarizations: "eeo",
      theta,
      phi: Math.PI / 2,
      variable: "theta",
      indexAtAngle: biaxialYzIndices,
      ordinaryAxis: 0,
      extraordinary: [true, true, false],
      dEffKind: "eeo_yz",
      dEffNegKind: "eeo_yz_neg",
      dEffWalkoffWave: 0,
      signFlip: "theta",
      negativeZeroForOrdinaryWalkoff: true
    }));
  }

  addAnalyticBiaxialResult(results, (1 - (e / (g - a)) ** 2) / ((e / (g - a)) ** 2 - (e / f) ** 2), {
    ...base,
    polarizations: "oeo",
    theta: 0,
    phi: Math.PI / 2,
    variable: "theta",
    indexAtAngle: biaxialYzIndices,
    ordinaryAxis: 0,
    extraordinary: [false, true, false],
    dEffKind: "oeo_yz",
    dEffNegKind: "oeo_yz_neg",
    dEffWalkoffWave: 1,
    signFlip: "theta",
    negativeZeroForOrdinaryWalkoff: true
  });

  if (lambda[0] !== lambda[1]) {
    addAnalyticBiaxialResult(results, (1 - (b / (g - d)) ** 2) / ((b / (g - d)) ** 2 - (b / c) ** 2), {
      ...base,
      polarizations: "eoo",
      theta: 0,
      phi: Math.PI / 2,
      variable: "theta",
      indexAtAngle: biaxialYzIndices,
      ordinaryAxis: 0,
      extraordinary: [true, false, false],
      dEffKind: "eoo_yz",
      dEffNegKind: "eoo_yz_neg",
      dEffWalkoffWave: 0,
      signFlip: "theta",
      negativeZeroForOrdinaryWalkoff: true
    });
  }

  return results;
}

function calcBiaxialPlaneXz(
  crystal: string,
  lambda: Vector3,
  mixType: MixingType,
  omega: Vector3,
  omegav: Vector3,
  omegavp: Vector3,
  nxyz: Matrix3x3,
  nxyzt: Matrix3x3,
  nxyzv: Matrix3x3,
  nxyzvp: Matrix3x3,
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
  i: number
): QmixResult[] {
  const results: QmixResult[] = [];
  const base = biaxialBranchBase(crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp);
  addAnalyticBiaxialResult(results, (1 - ((b + e) / g) ** 2) / (((b + e) / i) ** 2 - 1), {
    ...base,
    polarizations: "ooe",
    theta: 0,
    phi: 0,
    variable: "theta",
    indexAtAngle: biaxialXzIndices,
    ordinaryAxis: 1,
    extraordinary: [false, false, true],
    dEffKind: "ooe_xz",
    dEffNegKind: "ooe_xz_neg",
    dEffWalkoffWave: 2,
    signFlip: "theta",
    negativeZeroForOrdinaryWalkoff: true
  });

  for (const theta of findPMAngles((angle) => deltaKEoeXz(angle, a, c, e, g, i))) {
    results.push(makeBiaxialBranchResult({
      ...base,
      polarizations: "eoe",
      theta,
      phi: 0,
      variable: "theta",
      indexAtAngle: biaxialXzIndices,
      ordinaryAxis: 1,
      extraordinary: [true, false, true],
      dEffKind: "eoe_xz",
      dEffNegKind: "eoe_xz_neg",
      dEffWalkoffWave: 2,
      signFlip: "theta",
      temperatureExtraordinaryOffset: 1e-10,
      negativeZeroForOrdinaryWalkoff: true
    }));
  }

  if (lambda[0] !== lambda[1]) {
    for (const theta of findPMAngles((angle) => deltaKOeeXz(angle, b, d, f, g, i))) {
      results.push(makeBiaxialBranchResult({
        ...base,
        polarizations: "oee",
        theta,
        phi: 0,
        variable: "theta",
        indexAtAngle: biaxialXzIndices,
        ordinaryAxis: 1,
        extraordinary: [false, true, true],
        dEffKind: "oee_xz",
        dEffNegKind: "oee_xz_neg",
        dEffWalkoffWave: 2,
        signFlip: "theta",
        temperatureExtraordinaryOffset: 1e-10,
        negativeZeroForOrdinaryWalkoff: true
      }));
    }
  }

  for (const theta of findPMAngles((angle) => deltaKEeoXz(angle, a, c, d, f, h))) {
    results.push(makeBiaxialBranchResult({
      ...base,
      polarizations: "eeo",
      theta,
      phi: 0,
      variable: "theta",
      indexAtAngle: biaxialXzIndices,
      ordinaryAxis: 1,
      extraordinary: [true, true, false],
      dEffKind: "eeo_xz",
      dEffNegKind: "eeo_xz_neg",
      dEffWalkoffWave: 0,
      signFlip: "theta",
      temperatureExtraordinaryOffset: 1e-10,
      negativeZeroForOrdinaryWalkoff: true
    }));
  }

  addAnalyticBiaxialResult(results, (1 - (d / (h - b)) ** 2) / ((d / (h - b)) ** 2 - (d / f) ** 2), {
    ...base,
    polarizations: "oeo",
    theta: 0,
    phi: 0,
    variable: "theta",
    indexAtAngle: biaxialXzIndices,
    ordinaryAxis: 1,
    extraordinary: [false, true, false],
    dEffKind: "oeo_xz",
    dEffNegKind: "oeo_xz_neg",
    dEffWalkoffWave: 1,
    signFlip: "theta",
    temperatureExtraordinaryOffset: 1e-10,
    negativeZeroForOrdinaryWalkoff: true
  });

  if (lambda[0] !== lambda[1]) {
    addAnalyticBiaxialResult(results, (1 - (a / (h - e)) ** 2) / ((a / (h - e)) ** 2 - (a / c) ** 2), {
      ...base,
      polarizations: "eoo",
      theta: 0,
      phi: 0,
      variable: "theta",
      indexAtAngle: biaxialXzIndices,
      ordinaryAxis: 1,
      extraordinary: [true, false, false],
      dEffKind: "eoo_xz",
      dEffNegKind: "eoo_xz_neg",
      dEffWalkoffWave: 0,
      signFlip: "theta",
      temperatureExtraordinaryOffset: 1e-10,
      negativeZeroForOrdinaryWalkoff: true
    });
  }

  return results;
}

interface BiaxialBranchBase {
  readonly crystal: string;
  readonly lambda: Vector3;
  readonly mixType: MixingType;
  readonly omega: Vector3;
  readonly omegav: Vector3;
  readonly omegavp: Vector3;
  readonly nxyz: Matrix3x3;
  readonly nxyzt: Matrix3x3;
  readonly nxyzv: Matrix3x3;
  readonly nxyzvp: Matrix3x3;
}

interface BiaxialBranchOptions extends BiaxialBranchBase {
  readonly polarizations: PolarizationTriplet;
  readonly theta: number;
  readonly phi: number;
  readonly variable: "theta" | "phi";
  readonly indexAtAngle: (angle: number, indices: Matrix3x3) => Vector3;
  readonly ordinaryAxis: AxisIndex;
  readonly extraordinary: BooleanVector3;
  readonly dEffKind: BiaxialAngleKind;
  readonly dEffNegKind: BiaxialAngleKind;
  readonly dEffWalkoffWave: WaveIndex;
  readonly signFlip: "theta" | "phi";
  readonly temperatureExtraordinaryOffset?: number;
  readonly negativeZeroForOrdinaryWalkoff: boolean;
}

function biaxialBranchBase(
  crystal: string,
  lambda: Vector3,
  mixType: MixingType,
  omega: Vector3,
  omegav: Vector3,
  omegavp: Vector3,
  nxyz: Matrix3x3,
  nxyzt: Matrix3x3,
  nxyzv: Matrix3x3,
  nxyzvp: Matrix3x3
): BiaxialBranchBase {
  return { crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp };
}

function addAnalyticBiaxialResult(results: QmixResult[], discriminant: number, options: BiaxialBranchOptions): void {
  if (discriminant >= 0) {
    const angle = Math.atan(Math.sqrt(discriminant));
    results.push(makeBiaxialBranchResult(options.variable === "theta" ? { ...options, theta: angle } : { ...options, phi: angle }));
  }
}

function makeBiaxialBranchResult(options: BiaxialBranchOptions): QmixResult {
  const { crystal, lambda, mixType, omega, omegav, omegavp, nxyz, nxyzt, nxyzv, nxyzvp, polarizations, variable, indexAtAngle, ordinaryAxis, extraordinary, dEffKind, dEffNegKind, dEffWalkoffWave, signFlip, temperatureExtraordinaryOffset = 0, negativeZeroForOrdinaryWalkoff } = options;
  let theta = options.theta;
  let phi = options.phi;
  const angle = variable === "theta" ? theta : phi;
  const nt = indexAtAngle(angle, nxyz);
  const nta = indexAtAngle(angle + 0.001, nxyz);
  const allWalkoff = map3(nt, (index, wave) => -((nta[wave] - index) / index) / 1e-3 * 1e3);
  const walkoff = map3(allWalkoff, (value, wave) => (extraordinary[wave] ? value : negativeZeroForOrdinaryWalkoff ? -0 : 0));

  let dEff = biNl(crystal, lambda[2], buildAngleMat3(dEffKind, angle, walkoff[dEffWalkoffWave]));
  if (dEff !== 0) {
    const flippedDEff = biNl(crystal, lambda[2], buildAngleMat3(dEffNegKind, angle, walkoff[dEffWalkoffWave]));
    if (Math.abs(dEff) < Math.abs(flippedDEff)) {
      dEff = flippedDEff;
      if (signFlip === "theta") {
        theta = Math.PI - theta;
      } else {
        phi = -phi;
      }
    }
  }

  const resultAngle = variable === "theta" ? theta : phi;
  const ntv = indexAtAngle(resultAngle, nxyzv);
  const ntvp = indexAtAngle(resultAngle, nxyzvp);
  const ntt = map3(indexAtAngle(resultAngle, nxyzt), (index) => index + temperatureExtraordinaryOffset);
  const rind = map3(nxyz, (indices, wave) => (extraordinary[wave] ? nt[wave] : indices[ordinaryAxis]));
  const rindv = map3(nxyzv, (indices, wave) => (extraordinary[wave] ? ntv[wave] : indices[ordinaryAxis]));
  const rindvp = map3(nxyzvp, (indices, wave) => (extraordinary[wave] ? ntvp[wave] : indices[ordinaryAxis]));
  const rindt = map3(nxyzt, (indices, wave) => (extraordinary[wave] ? ntt[wave] : indices[ordinaryAxis]));

  return makeResult({
    lambda,
    polarizations,
    theta,
    phi,
    dEff,
    walkoff,
    rind,
    rindv,
    rindvp,
    temperatureRangeKCm: phaseMismatchTemperatureRange(rind, rindt, omega),
    mixType,
    omega,
    omegav,
    omegavp
  });
}

function phaseMismatchTemperatureRange(rind: Vector3, rindt: Vector3, omega: Vector3): number {
  return Math.abs(1e-7 / Math.abs(rind[2] * omega[2] - rind[1] * omega[1] - rind[0] * omega[0] - rindt[2] * omega[2] + rindt[1] * omega[1] + rindt[0] * omega[0]));
}

interface MakeResultOptions {
  readonly lambda: Vector3;
  readonly polarizations: PolarizationTriplet;
  readonly theta: number;
  readonly phi: number;
  readonly dEff: number;
  readonly walkoff: Vector3;
  readonly rind: Vector3;
  readonly rindv: Vector3;
  readonly rindvp: Vector3;
  readonly temperatureRangeKCm: number;
  readonly mixType: MixingType;
  readonly omega: Vector3;
  readonly omegav: Vector3;
  readonly omegavp: Vector3;
}

function makeResult(options: MakeResultOptions): QmixResult {
  const { lambda, polarizations, theta, phi, dEff, walkoff, rind, rindv, rindvp, temperatureRangeKCm, mixType, omega, omegav, omegavp } = options;

  if (dEff === 0) {
    return {
      wavelengthsNm: lambda,
      polarizations,
      thetaDeg: radiansToDegrees(theta),
      phiDeg: radiansToDegrees(phi),
      dEffPmPerV: dEff,
      walkoffMrad: [0, 0, 0],
      phaseVelocityIndex: [0, 0, 0],
      groupVelocityIndex: [0, 0, 0],
      gddFs2PerMm: [0, 0, 0],
      s0L2Watt: 0,
      angleToleranceMradCm: 0,
      temperatureRangeKCm: 0,
      acceptanceAngleMradCm: [0, 0],
      acceptanceBW: [0, 0]
    };
  }

  const groupVelocityIndex = map3(rind, (index, i) => {
    return 0.5 * (index + rindv[i] + ((omega[i] + omegav[i]) * (rindv[i] - index)) / 1e-7);
  });
  const gdd = map3(rind, (index, i) => {
    return (omegav[i] * rindv[i] + omegavp[i] * rindvp[i] - 2 * omega[i] * index) * 1e32 / (3e8 ** 2 * 2 * Math.PI);
  });
  const s0L2Watt = Math.abs(33.6 * product3(rind) * lambda[0] * lambda[1] * (1 / dEff ** 2));
  const angleSigns: Vector3 = [-1, -1, 1];
  const angleTolerance = Math.abs(0.1 / sum3(map3(rind, (index, i) => angleSigns[i] * index * walkoff[i] / lambda[i])));

  let acceptanceAngle: Vector2;
  let acceptanceBW: Vector2;
  if (mixType === "Mix") {
    acceptanceAngle = [
      Math.abs((0.1 * lambda[0]) / (rind[0] * (1e-20 + walkoff[0] - walkoff[2]))),
      Math.abs((0.1 * lambda[1]) / (rind[1] * (1e-20 + walkoff[1] - walkoff[2])))
    ];
    acceptanceBW = [
      1 / (1e-20 + Math.abs(groupVelocityIndex[0] - groupVelocityIndex[2])),
      1 / (1e-20 + Math.abs(groupVelocityIndex[1] - groupVelocityIndex[2]))
    ];
  } else {
    acceptanceAngle = [
      Math.abs((0.1 * lambda[0]) / (rind[0] * (1e-20 + walkoff[0] - walkoff[1]))),
      Math.abs((0.1 * lambda[1]) / (rind[1] * (1e-20 + walkoff[0] - walkoff[1])))
    ];
    const bandwidth = 1 / (1e-20 + Math.abs(groupVelocityIndex[0] - groupVelocityIndex[1]));
    acceptanceBW = [bandwidth, bandwidth];
  }

  return {
    wavelengthsNm: lambda,
    polarizations,
    thetaDeg: radiansToDegrees(theta),
    phiDeg: radiansToDegrees(phi),
    dEffPmPerV: dEff,
    walkoffMrad: walkoff,
    phaseVelocityIndex: rind,
    groupVelocityIndex,
    gddFs2PerMm: gdd,
    s0L2Watt,
    angleToleranceMradCm: angleTolerance,
    temperatureRangeKCm: Number.isFinite(temperatureRangeKCm) ? Math.abs(temperatureRangeKCm) : 1e6,
    acceptanceAngleMradCm: acceptanceAngle,
    acceptanceBW
  };
}

function extraordinaryIndices(theta: number, indices: Matrix3x2): Vector3 {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return map3(indices, ([ordinary, extraordinary]) => {
    return 1 / Math.sqrt((cos / ordinary) ** 2 + (sin / extraordinary) ** 2);
  });
}

function biaxialXyIndices(phi: number, indices: Matrix3x3): Vector3 {
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  return map3(indices, ([nx, ny]) => 1 / Math.sqrt((cos / ny) ** 2 + (sin / nx) ** 2));
}

function biaxialXzIndices(theta: number, indices: Matrix3x3): Vector3 {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return map3(indices, ([nx, _ny, nz]) => 1 / Math.sqrt((sin / nz) ** 2 + (cos / nx) ** 2));
}

function biaxialYzIndices(theta: number, indices: Matrix3x3): Vector3 {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return map3(indices, ([_nx, ny, nz]) => 1 / Math.sqrt((cos / ny) ** 2 + (sin / nz) ** 2));
}

type BiaxialAngleKind =
  | "xy"
  | "xy_neg"
  | "eoe_xy"
  | "eoe_xy_neg"
  | "oee_xy"
  | "oee_xy_neg"
  | "eeo_yz"
  | "eeo_yz_neg"
  | "oeo_yz"
  | "oeo_yz_neg"
  | "eoo_yz"
  | "eoo_yz_neg"
  | "ooe_xz"
  | "ooe_xz_neg"
  | "eoe_xz"
  | "eoe_xz_neg"
  | "oee_xz"
  | "oee_xz_neg"
  | "eeo_xz"
  | "eeo_xz_neg"
  | "oeo_xz"
  | "oeo_xz_neg"
  | "eoo_xz"
  | "eoo_xz_neg";

function buildAngleMat3(kind: BiaxialAngleKind, angle: number, walkoffMrad: number): Matrix3x3 {
  const adjusted = angle + 0.001 * walkoffMrad;

  switch (kind) {
    case "xy":
      return [
        [0, 0, 1],
        [0, 0, 1],
        [-Math.sin(adjusted), Math.cos(adjusted), 0]
      ];
    case "xy_neg":
      return [
        [0, 0, 1],
        [0, 0, 1],
        [Math.sin(adjusted), Math.cos(adjusted), 0]
      ];
    case "eoe_xy":
      return [
        [-Math.sin(adjusted), Math.cos(adjusted), 0],
        [0, 0, 1],
        [-Math.sin(adjusted), Math.cos(adjusted), 0]
      ];
    case "eoe_xy_neg":
      return [
        [Math.sin(adjusted), Math.cos(adjusted), 0],
        [0, 0, 1],
        [Math.sin(adjusted), Math.cos(adjusted), 0]
      ];
    case "oee_xy":
      return [
        [0, 0, 1],
        [-Math.sin(adjusted), Math.cos(adjusted), 0],
        [-Math.sin(adjusted), Math.cos(adjusted), 0]
      ];
    case "oee_xy_neg":
      return [
        [0, 0, 1],
        [Math.sin(adjusted), Math.cos(adjusted), 0],
        [Math.sin(adjusted), Math.cos(adjusted), 0]
      ];
    case "eeo_yz":
      return [
        [0, Math.cos(adjusted), -Math.sin(adjusted)],
        [0, Math.cos(adjusted), -Math.sin(adjusted)],
        [1, 0, 0]
      ];
    case "eeo_yz_neg":
      return [
        [0, -Math.cos(adjusted), -Math.sin(adjusted)],
        [0, -Math.cos(adjusted), -Math.sin(adjusted)],
        [1, 0, 0]
      ];
    case "oeo_yz":
      return [
        [1, 0, 0],
        [0, Math.cos(adjusted), -Math.sin(adjusted)],
        [1, 0, 0]
      ];
    case "oeo_yz_neg":
      return [
        [1, 0, 0],
        [0, -Math.cos(adjusted), -Math.sin(adjusted)],
        [1, 0, 0]
      ];
    case "ooe_xz":
      return [
        [0, 1, 0],
        [0, 1, 0],
        [Math.cos(adjusted), 0, -Math.sin(adjusted)]
      ];
    case "ooe_xz_neg":
      return [
        [0, 1, 0],
        [0, 1, 0],
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)]
      ];
    case "eoe_xz":
      return [
        [Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0],
        [Math.cos(adjusted), 0, -Math.sin(adjusted)]
      ];
    case "eoe_xz_neg":
      return [
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0],
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)]
      ];
    case "oee_xz":
      return [
        [0, 1, 0],
        [Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [Math.cos(adjusted), 0, -Math.sin(adjusted)]
      ];
    case "oee_xz_neg":
      return [
        [0, 1, 0],
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)]
      ];
    case "eeo_xz":
      return [
        [Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0]
      ];
    case "eeo_xz_neg":
      return [
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0]
      ];
    case "oeo_xz":
      return [
        [0, 1, 0],
        [Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0]
      ];
    case "oeo_xz_neg":
      return [
        [0, 1, 0],
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0]
      ];
    case "eoo_yz":
      return [
        [0, Math.cos(adjusted), -Math.sin(adjusted)],
        [1, 0, 0],
        [1, 0, 0]
      ];
    case "eoo_yz_neg":
      return [
        [0, -Math.cos(adjusted), -Math.sin(adjusted)],
        [1, 0, 0],
        [1, 0, 0]
      ];
    case "eoo_xz":
      return [
        [Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0],
        [0, 1, 0]
      ];
    case "eoo_xz_neg":
      return [
        [-Math.cos(adjusted), 0, -Math.sin(adjusted)],
        [0, 1, 0],
        [0, 1, 0]
      ];
  }
}

/** Biaxial d_eff calculation using the BI_NL d-tensor table. */
export function biNl(crystal: string, wavelengthNm: number, angleMatrix: Matrix3x3): number {
  const entry = BI_NL_DATA[crystal];
  if (entry === undefined) {
    throw new Error(`Biaxial crystal ${crystal} is not implemented in QmixEngine yet`);
  }
  if (entry.dTensor === null) {
    throw new Error(`Biaxial crystal ${crystal} d-tensor must be loaded from file; not implemented in QmixEngine`);
  }

  const dTensor = entry.dTensor;
  const wave1 = angleMatrix[0];
  const wave2 = angleMatrix[1];
  const wave3 = angleMatrix[2];
  const colvect = [
    wave1[0] * wave2[0],
    wave1[1] * wave2[1],
    wave1[2] * wave2[2],
    wave1[1] * wave2[2] + wave1[2] * wave2[1],
    wave1[0] * wave2[2] + wave1[2] * wave2[0],
    wave1[1] * wave2[0] + wave1[0] * wave2[1],
  ] as const;
  const projected: Vector3 = [
    dot6(dTensor[0], colvect),
    dot6(dTensor[1], colvect),
    dot6(dTensor[2], colvect),
  ];
  const rawDEff = wave3[0] * projected[0] + wave3[1] * projected[1] + wave3[2] * projected[2];

  const nsh = firstSquaredIndex(crystal, entry.lambdaRef) - 1;
  const nfun = firstSquaredIndex(crystal, 2 * entry.lambdaRef) - 1;
  const np = firstSquaredIndex(crystal, wavelengthNm) - 1;
  const n2p = firstSquaredIndex(crystal, 2 * wavelengthNm) - 1;
  return rawDEff * (np / nsh) * (n2p / nfun) ** 2;
}

export type DTensorRow = readonly [number, number, number, number, number, number];
export type DTensor = readonly [DTensorRow, DTensorRow, DTensorRow];
export interface BiNlEntry {
  readonly dTensor: DTensor | null;
  readonly lambdaRef: number;
}

const BI_NL_DATA: Record<string, BiNlEntry> = {
  AGGS:  { dTensor: [[15, 8,  8, 0,   0, 0], [0, 0, 0, 0,   0, 8], [0, 0, 0, 0, 8, 0]] as DTensor, lambdaRef: 730 },
  AGGSE: { dTensor: [[0, 28, 14.5, 0, 0, 0], [0, 0, 0, 0, 0, 28], [0, 0, 0, 0, 14.5, 0]] as DTensor, lambdaRef: 1500 },
  BIBO:  { dTensor: [[2.53, 2.93, -1.93, 1.63, 0, 0], [0, 0, 0, 0, 1.67, 3.48], [0, 0, 0, 0, -1.58, 1.67]] as DTensor, lambdaRef: 532 },
  BGS:   { dTensor: [[12.6, 5.1, 5.7, 0, 0, 0], [0, 0, 0, 0, 0, 5.1], [0, 0, 0, 0, 5.7, 0]] as DTensor, lambdaRef: 2260 },
  BGSE:  { dTensor: [[0, 0, 0, 0, 1.5, 5.3], [5.3, -6.2, -14.2, -5, 0, 0], [1.5, -5, 0, -14.2, 0, 0]] as DTensor, lambdaRef: 1000 },
  CBO:   { dTensor: [[0, 0, 0, 1.1, 0, 0], [0, 0, 0, 0, 1.1, 0], [0, 0, 0, 0, 0, 1.1]] as DTensor, lambdaRef: 532 },
  CTA:   { dTensor: [[0, 0, 0, 0, 2.1, 0], [0, 0, 0, 3.4, 0, 0], [2.1, 3.4, 18.1, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  DLAP:  { dTensor: [[0, 0, 0, -0.58, 0, 0.4], [0.4, 0.37, -0.84, 0, -0.58, 0], [0, 0, 0, -0.84, 0, -0.58]] as DTensor, lambdaRef: 532 },
  GCOB:  { dTensor: [[0.28, 0.212, -0.58, 0, -0.36, 0], [0, 0, 0, 1.66, 0, 0.228], [-0.32, 1.67, -1.2, 0, -0.61, 0]] as DTensor, lambdaRef: 532 },
  KBO:   { dTensor: [[0.05, 0.003, 0.04, 0, 0, 0], [0, 0, 0, 0, 0, 0.003], [0, 0, 0, 0, 0.04, 0]] as DTensor, lambdaRef: 532 },
  KNBO3: { dTensor: [[21.9, 8.9, 12.4, 0, 0, 0], [0, 0, 0, 0, 0, 9.2], [0, 0, 0, 0, 13, 0]] as DTensor, lambdaRef: 532 },
  KTA_1: { dTensor: [[0, 0, 0, 0, 2.3, 0], [0, 0, 0, 3.64, 0, 0], [2.3, 3.66, 15.5, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  KTA_2: { dTensor: [[0, 0, 0, 0, 2.3, 0], [0, 0, 0, 3.64, 0, 0], [2.3, 3.66, 15.5, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  KTA_3: { dTensor: [[0, 0, 0, 0, 2.3, 0], [0, 0, 0, 3.64, 0, 0], [2.3, 3.66, 15.5, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  KTP_F: { dTensor: [[0, 0, 0, 0, 1.95, 0], [0, 0, 0, 3.9, 0, 0], [2.2, 3.9, 15.3, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  KTP_H: { dTensor: [[0, 0, 0, 0, 1.95, 0], [0, 0, 0, 3.9, 0, 0], [2.2, 3.9, 15.3, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  KTP_K: { dTensor: [[0, 0, 0, 0, 1.95, 0], [0, 0, 0, 3.9, 0, 0], [2.2, 3.9, 15.3, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  LBO:   { dTensor: [[0, 0, 0, 0, 0, -0.67], [-0.67, 0.04, 0.85, 0, 0, 0], [0, 0, 0, 0.85, 0, 0]] as DTensor, lambdaRef: 532 },
  LCB:   { dTensor: [[0, 0, 0, 0.7, 0, 0.58], [0.58, -1.04, 0.25, 0, 0.7, 0], [0, 0, 0, 0.25, 0, 0.7]] as DTensor, lambdaRef: 532 },
  LFM:   { dTensor: [[0, 0, 0, 0, 0.1, 0], [0, 0, 0, -1.16, 0, 0], [0.1, -1.16, 1.68, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  LGS:   { dTensor: [[0, 0, 0, 0, 5.1, 0], [0, 0, 0, 5.8, 0, 0], [5.1, 5.8, -10.7, 0, 0, 0]] as DTensor, lambdaRef: 1150 },
  LGSE:  { dTensor: [[0, 0, 0, 0, 7.7, 0], [0, 0, 0, 9.9, 0, 0], [7.7, 9.9, -18.2, 0, 0, 0]] as DTensor, lambdaRef: 1150 },
  LIS:   { dTensor: [[0, 0, 0, 0, 5.7, 0], [0, 0, 0, 7.25, 0, 0], [5.7, 7.25, -16, 0, 0, 0]] as DTensor, lambdaRef: 1150 },
  LISE:  { dTensor: [[0, 0, 0, 0, 11.8, 0], [0, 0, 0, 8.2, 0, 0], [11.8, 8.2, -16, 0, 0, 0]] as DTensor, lambdaRef: 1150 },
  NTW:   { dTensor: [[2.3, 3.7, 9.3, 0, 0, 5.8], [5.8, 1.9, 0.15, 0, 0, 3.7], [0, 0, 0, 0.15, 9.3, 0]] as DTensor, lambdaRef: 527 },
  RTA:   { dTensor: [[0, 0, 0, 0, 2.17, 0], [0, 0, 0, 3.9, 0, 0], [2.25, 3.9, 15.9, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  RTP:   { dTensor: [[0, 0, 0, 0, 2.0, 0], [0, 0, 0, 4.0, 0, 0], [2.0, 3.8, 15.6, 0, 0, 0]] as DTensor, lambdaRef: 532 },
  TCOB:  { dTensor: [[0.52, 0.25, -0.69, 0, -0.36, 0], [0, 0, 0, 1.65, 0, 0.25], [-0.36, 1.65, -1.27, 0, -0.69, 0]] as DTensor, lambdaRef: 532 },
  YCOB:  { dTensor: [[0.155, 0.235, -0.59, 0, -0.30, 0], [0, 0, 0, 1.62, 0, 0.24], [-0.30, 1.62, -1.2, 0, -0.59, 0]] as DTensor, lambdaRef: 532 },
  ZZ_B:  { dTensor: null, lambdaRef: 0 },
};

/** Compute squared refractive index at 300K for Miller scaling. */
export function firstSquaredIndex(crystal: string, wavelengthNm: number): number {
  const index = CrystalDB.compute(crystal, 300, wavelengthNm)[0];
  if (index === undefined || index === 0) {
    throw new Error(`Could not compute ${crystal} Miller scaling`);
  }
  return index ** 2;
}

function dot6(left: readonly [number, number, number, number, number, number], right: readonly [number, number, number, number, number, number]): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2] + left[3] * right[3] + left[4] * right[4] + left[5] * right[5];
}

function uniNl(crystal: string, wavelengthNm: number, angleRad: number): Vector2 {
  const entry = UNI_NL_DATA[crystal];
  if (entry === undefined) {
    throw new Error(`Uniaxial crystal ${crystal} is not implemented in QmixEngine yet`);
  }

  const d1 = entry.d1Cos * Math.cos(angleRad) + entry.d1Sin * Math.sin(angleRad);
  const d2 = entry.d2Cos2 * Math.cos(angleRad) ** 2 + entry.d2Sin2 * Math.sin(2 * angleRad);

  const nsh = firstSquaredIndex(crystal, entry.lambdaRef) - 1;
  const nfun = firstSquaredIndex(crystal, 2 * entry.lambdaRef) - 1;
  const np = firstSquaredIndex(crystal, wavelengthNm) - 1;
  const n2p = firstSquaredIndex(crystal, 2 * wavelengthNm) - 1;
  const scale = (np / nsh) * (n2p / nfun) ** 2;
  return [d1 * scale, d2 * scale];
}

/** Uniaxial nonlinear-optical coefficients.
 * d₁ = d1Cos·cosθ + d1Sin·sinθ  (type-1, one e-wave)
 * d₂ = d2Cos2·cos²θ + d2Sin2·sin2θ  (type-2, two e-waves)
 * Both are scaled by the Miller-δ factor at the operating wavelength. */
export interface UniNlEntry {
  readonly d1Cos: number;
  readonly d1Sin: number;
  readonly d2Cos2: number;
  readonly d2Sin2: number;
  readonly lambdaRef: number;
}

const UNI_NL_DATA: Record<string, UniNlEntry> = {
  AAS:    { d1Cos: 18.0, d1Sin: 11.3, d2Cos2: 18.0, d2Sin2: 0,    lambdaRef: 5300 },
  ADA:    { d1Cos: 0,    d1Sin: 0.39, d2Cos2: 0,    d2Sin2: 0.39, lambdaRef: 532 },
  ADP:    { d1Cos: 0,    d1Sin: 0.55, d2Cos2: 0,    d2Sin2: 0.55, lambdaRef: 532 },
  AGSE:   { d1Cos: 0,    d1Sin: 33,   d2Cos2: 0,    d2Sin2: 33,   lambdaRef: 5300 },
  AGS:    { d1Cos: 0,    d1Sin: 13,   d2Cos2: 0,    d2Sin2: 13,   lambdaRef: 5300 },
  ASS:    { d1Cos: 9.2,  d1Sin: 8.4,  d2Cos2: 9.2,  d2Sin2: 0,    lambdaRef: 5300 },
  BBO:    { d1Cos: 2.2,  d1Sin: 0.08, d2Cos2: 2.2,  d2Sin2: 0,    lambdaRef: 532 },
  BBPO:   { d1Cos: 0.19, d1Sin: 0,    d2Cos2: 0.19, d2Sin2: 0,    lambdaRef: 532 },
  BPO:    { d1Cos: 0,    d1Sin: 0.76, d2Cos2: 0,    d2Sin2: 0.76, lambdaRef: 532 },
  B2GGS:  { d1Cos: 0,    d1Sin: 13.0, d2Cos2: 0,    d2Sin2: 0,    lambdaRef: 931.1 },
  BGGSE:  { d1Cos: 30,   d1Sin: 18.3, d2Cos2: 30,   d2Sin2: 0,    lambdaRef: 5300 },
  CBBF:   { d1Cos: 0.5,  d1Sin: 0,    d2Cos2: 0.5,  d2Sin2: 0,    lambdaRef: 532 },
  CDA:    { d1Cos: 0,    d1Sin: 0.40, d2Cos2: 0,    d2Sin2: 0.4,  lambdaRef: 532 },
  CDSE:   { d1Cos: 0,    d1Sin: 18,   d2Cos2: 0,    d2Sin2: 0,    lambdaRef: 5300 },
  CGA:    { d1Cos: 0,    d1Sin: 235,  d2Cos2: 0,    d2Sin2: 235,  lambdaRef: 5300 },
  CLBO:   { d1Cos: 0,    d1Sin: 0.74, d2Cos2: 0,    d2Sin2: 0.675, lambdaRef: 532 },
  CSP:    { d1Cos: 0,    d1Sin: 84,   d2Cos2: 0,    d2Sin2: 84,   lambdaRef: 2300 },
  CTW:    { d1Cos: 0,    d1Sin: 6.2,  d2Cos2: 0,    d2Sin2: 0,    lambdaRef: 527 },
  DADA:   { d1Cos: 0,    d1Sin: 0.39, d2Cos2: 0,    d2Sin2: 0.39, lambdaRef: 532 },
  DADP:   { d1Cos: 0,    d1Sin: 0.52, d2Cos2: 0,    d2Sin2: 0.52, lambdaRef: 532 },
  DCDA:   { d1Cos: 0,    d1Sin: 0.40, d2Cos2: 0,    d2Sin2: 0.40, lambdaRef: 532 },
  DKDP:   { d1Cos: 0,    d1Sin: 0.36, d2Cos2: 0,    d2Sin2: 0.36, lambdaRef: 532 },
  DRDA:   { d1Cos: 0,    d1Sin: 0.39, d2Cos2: 0,    d2Sin2: 0.39, lambdaRef: 532 },
  DRDP:   { d1Cos: 0,    d1Sin: 0.38, d2Cos2: 0,    d2Sin2: 0.38, lambdaRef: 532 },
  GEO:    { d1Cos: 0.79, d1Sin: 0,    d2Cos2: 0.79, d2Sin2: 0,    lambdaRef: 532 },
  GS:     { d1Cos: 54,   d1Sin: 0,    d2Cos2: 54,   d2Sin2: 0,    lambdaRef: 5300 },
  HGS:    { d1Cos: 0,    d1Sin: 24.1, d2Cos2: 0,    d2Sin2: 24.1, lambdaRef: 5300 },
  HS:     { d1Cos: 50,   d1Sin: 0,    d2Cos2: 50,   d2Sin2: 0,    lambdaRef: 5300 },
  KABO:   { d1Cos: 0.45, d1Sin: 0,    d2Cos2: 0.45, d2Sin2: 0,    lambdaRef: 532 },
  KBBF:   { d1Cos: 0.47, d1Sin: 0,    d2Cos2: 0.47, d2Sin2: 0,    lambdaRef: 532 },
  KDA:    { d1Cos: 0,    d1Sin: 0.52, d2Cos2: 0,    d2Sin2: 0.52, lambdaRef: 532 },
  KDP:    { d1Cos: 0,    d1Sin: 0.39, d2Cos2: 0,    d2Sin2: 0.39, lambdaRef: 532 },
  LB4:    { d1Cos: 0,    d1Sin: 0.12, d2Cos2: 0,    d2Sin2: 0,    lambdaRef: 532 },
  LBGO:   { d1Cos: 0.72, d1Sin: 0.18, d2Cos2: 0.72, d2Sin2: 0,    lambdaRef: 532 },
  LGN:    { d1Cos: 3.0,  d1Sin: 0,    d2Cos2: 3.0,  d2Sin2: 0,    lambdaRef: 532 },
  LGT:    { d1Cos: 0,    d1Sin: 42,   d2Cos2: 0,    d2Sin2: 42,   lambdaRef: 2650 },
  LGTO:   { d1Cos: -2.4, d1Sin: 0,    d2Cos2: 2.4,  d2Sin2: 0,    lambdaRef: 670 },
  LIIO3:  { d1Cos: 0,    d1Sin: 4.4,  d2Cos2: 0,    d2Sin2: 0.11, lambdaRef: 532 },
  LITA_C: { d1Cos: 0,    d1Sin: -0.85, d2Cos2: 0,   d2Sin2: 0,    lambdaRef: 532 },
  LITA_M: { d1Cos: 0,    d1Sin: -0.85, d2Cos2: 0,   d2Sin2: 0,    lambdaRef: 532 },
  LITA_S: { d1Cos: 0,    d1Sin: -0.85, d2Cos2: 0,   d2Sin2: 0,    lambdaRef: 532 },
  LNB_C:  { d1Cos: -2.2, d1Sin: -4.5, d2Cos2: 2.2,  d2Sin2: 0,    lambdaRef: 532 },
  LNB_M:  { d1Cos: -2.2, d1Sin: -4.5, d2Cos2: 2.2,  d2Sin2: 0,    lambdaRef: 532 },
  LNB_S:  { d1Cos: -2.2, d1Sin: -4.5, d2Cos2: 2.2,  d2Sin2: 0,    lambdaRef: 532 },
  NLBO:   { d1Cos: 2.3,  d1Sin: 0,    d2Cos2: 2.3,  d2Sin2: 0,    lambdaRef: 532 },
  RBBF:   { d1Cos: 0.45, d1Sin: 0,    d2Cos2: 0.45, d2Sin2: 0,    lambdaRef: 532 },
  RDA:    { d1Cos: 0,    d1Sin: 0.39, d2Cos2: 0,    d2Sin2: 0.39, lambdaRef: 532 },
  RDP:    { d1Cos: 0,    d1Sin: 0.38, d2Cos2: 0,    d2Sin2: 0.38, lambdaRef: 532 },
  SC4H:   { d1Cos: 0,    d1Sin: 6.5,  d2Cos2: 0,    d2Sin2: 0,    lambdaRef: 532 },
  SC6H:   { d1Cos: 0,    d1Sin: 6.7,  d2Cos2: 0,    d2Sin2: 0,    lambdaRef: 532 },
  TAS:    { d1Cos: 31.5, d1Sin: 20,   d2Cos2: 31.5, d2Sin2: 0,    lambdaRef: 5300 },
  TE:     { d1Cos: 600,  d1Sin: 0,    d2Cos2: 600,  d2Sin2: 0,    lambdaRef: 5300 },
  ZGP:    { d1Cos: 0,    d1Sin: 75.4, d2Cos2: 0,    d2Sin2: 75.4, lambdaRef: 5300 },
};

function deltaKEoeUni(theta: number, a: number, b: number, c: number, d: number, f: number): number {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const k3 = (c * f) / Math.sqrt((f * cos) ** 2 + (c * sin) ** 2);
  const k1 = (a * d) / Math.sqrt((d * cos) ** 2 + (a * sin) ** 2);
  return k3 - k1 - b;
}

function deltaKOeeUni(theta: number, a: number, b: number, c: number, e: number, f: number): number {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const k3 = (c * f) / Math.sqrt((f * cos) ** 2 + (c * sin) ** 2);
  const k2 = (b * e) / Math.sqrt((e * cos) ** 2 + (b * sin) ** 2);
  return k3 - k2 - a;
}

function deltaKEeoUni(theta: number, a: number, b: number, c: number, d: number, e: number): number {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const k1 = (a * d) / Math.sqrt((d * cos) ** 2 + (a * sin) ** 2);
  const k2 = (b * e) / Math.sqrt((e * cos) ** 2 + (b * sin) ** 2);
  return c - k1 - k2;
}

function deltaKEoeXy(phi: number, a: number, b: number, f: number, g: number, h: number): number {
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const k3 = (g * h) / Math.sqrt((g * cos) ** 2 + (h * sin) ** 2);
  const k1 = (a * b) / Math.sqrt((a * cos) ** 2 + (b * sin) ** 2);
  return k3 - k1 - f;
}

function deltaKOeeXy(phi: number, c: number, d: number, e: number, g: number, h: number): number {
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const k3 = (g * h) / Math.sqrt((g * cos) ** 2 + (h * sin) ** 2);
  const k2 = (d * e) / Math.sqrt((d * cos) ** 2 + (e * sin) ** 2);
  return k3 - k2 - c;
}

function deltaKEeoYz(theta: number, b: number, c: number, e: number, f: number, g: number): number {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const k1 = (b * c) / Math.sqrt((c * cos) ** 2 + (b * sin) ** 2);
  const k2 = (e * f) / Math.sqrt((f * cos) ** 2 + (e * sin) ** 2);
  return g - k1 - k2;
}

function deltaKEoeXz(theta: number, a: number, c: number, e: number, g: number, i: number): number {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const k3 = (g * i) / Math.sqrt((i * cos) ** 2 + (g * sin) ** 2);
  const k1 = (a * c) / Math.sqrt((c * cos) ** 2 + (a * sin) ** 2);
  return k3 - k1 - e;
}

function deltaKOeeXz(theta: number, b: number, d: number, f: number, g: number, i: number): number {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const k3 = (g * i) / Math.sqrt((i * cos) ** 2 + (g * sin) ** 2);
  const k2 = (d * f) / Math.sqrt((f * cos) ** 2 + (d * sin) ** 2);
  return k3 - k2 - b;
}

function deltaKEeoXz(theta: number, a: number, c: number, d: number, f: number, h: number): number {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const k1 = (a * c) / Math.sqrt((c * cos) ** 2 + (a * sin) ** 2);
  const k2 = (d * f) / Math.sqrt((f * cos) ** 2 + (d * sin) ** 2);
  return h - k1 - k2;
}

function findPMAngles(deltaK: (angle: number) => number): number[] {
  const lower = 0;
  const upper = Math.PI / 2;
  const samples = 1024;
  const angles: number[] = [];
  let previousAngle = lower;
  let previousValue = deltaK(previousAngle);

  for (let sample = 1; sample < samples; sample += 1) {
    const angle = lower + ((upper - lower) * sample) / (samples - 1);
    const value = deltaK(angle);

    if (Number.isFinite(previousValue) && Number.isFinite(value) && Math.sign(previousValue) !== Math.sign(value) && previousValue !== 0 && value !== 0) {
      const root = bisect(deltaK, previousAngle, angle);
      if (Math.abs(deltaK(root)) < 1e-6 && (angles.length === 0 || Math.min(...angles.map((existing) => Math.abs(existing - root))) > 1e-8)) {
        angles.push(root);
      }
    }

    previousAngle = angle;
    previousValue = value;
  }

  return angles;
}

function bisect(fn: (x: number) => number, lower: number, upper: number): number {
  let lo = lower;
  let hi = upper;
  let flo = fn(lo);
  let fhi = fn(hi);
  let root = (lo + hi) / 2;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const secant = (lo * fhi - hi * flo) / (fhi - flo);
    const mid = Number.isFinite(secant) && secant > lo && secant < hi ? secant : (lo + hi) / 2;
    const fmid = fn(mid);
    root = mid;
    if (Math.sign(flo) === Math.sign(fmid)) {
      lo = mid;
      flo = fmid;
    } else {
      hi = mid;
      fhi = fmid;
    }
  }
  return bestFloatingRoot(fn, root);
}

function bestFloatingRoot(fn: (x: number) => number, root: number): number {
  // MATLAB fzero can land on a neighboring float; pick the local value with the smallest residual.
  const candidates = [nextDown(root), root, nextUp(root)];
  return candidates.reduce((best, candidate) => (Math.abs(fn(candidate)) < Math.abs(fn(best)) ? candidate : best), root);
}

function nextDown(value: number): number {
  return nextAfter(value, -Infinity);
}

function nextUp(value: number): number {
  return nextAfter(value, Infinity);
}

function nextAfter(value: number, direction: number): number {
  if (!Number.isFinite(value) || value === direction) {
    return value;
  }
  if (value === 0) {
    return direction > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE;
  }

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const increment = (value > 0) === (direction > value) ? 1n : -1n;
  view.setBigUint64(0, bits + increment, false);
  return view.getFloat64(0, false);
}

/** Register nonlinear-optical coefficients for a custom uniaxial crystal.
 * After registering, the crystal can be used with QmixEngine.calculate().
 * @param crystal - Name matching a crystal registered via CrystalDB.registerFromJson().
 * @param entry - NL coefficients: d1 = d1Cos*cosθ + d1Sin*sinθ, d2 = d2Cos2*cos²θ + d2Sin2*sin2θ.
 */
export function registerUniaxialNlData(crystal: string, entry: UniNlEntry): void {
  if (UNI_NL_DATA[crystal] !== undefined) {
    throw new Error(`Uniaxial NL data for ${crystal} is already registered`);
  }
  UNI_NL_DATA[crystal] = entry;
}

/** Register nonlinear-optical coefficients for a custom biaxial crystal.
 * The d-tensor is a 3×6 contracted matrix. After registering, the crystal
 * can be used with QmixEngine.calculate() across all principal planes.
 * @param crystal - Name matching a crystal registered via CrystalDB.registerFromJson().
 * @param entry - 3×6 d-tensor and Miller-scaling reference wavelength.
 */
export function registerBiaxialNlData(crystal: string, entry: BiNlEntry): void {
  if (BI_NL_DATA[crystal] !== undefined) {
    throw new Error(`Biaxial NL data for ${crystal} is already registered`);
  }
  BI_NL_DATA[crystal] = entry;
}

function map3<T, U>(values: readonly [T, T, T], fn: (value: T, index: 0 | 1 | 2) => U): [U, U, U] {
  return [fn(values[0], 0), fn(values[1], 1), fn(values[2], 2)];
}

function product3(values: Vector3): number {
  return values[0] * values[1] * values[2];
}

function sum3(values: Vector3): number {
  return values[0] + values[1] + values[2];
}

function radiansToDegrees(angle: number): number {
  return (angle * 180) / Math.PI;
}
