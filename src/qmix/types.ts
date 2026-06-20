/** List of available principal planes for biaxial crystals. */
export const principalPlanes = ["XY", "XZ", "YZ"] as const;
/** Principal plane selection: XY (theta=90), XZ (phi=0), or YZ (phi=90). */
export type PrincipalPlane = (typeof principalPlanes)[number];

/** Mixing types: sum/difference-frequency generation (Mix) or optical parametric oscillation (OPO). */
export const mixingTypes = ["Mix", "OPO"] as const;
export type MixingType = (typeof mixingTypes)[number];

/** Ordinary or extraordinary polarization. */
export type Polarization = "o" | "e";
/** Polarization triplet for the three interacting waves, e.g. "ooe", "eoe", "eoo". */
export type PolarizationTriplet = `${Polarization}${Polarization}${Polarization}`;

/** A 2-element vector. */
export type Vector2 = readonly [number, number];
/** A 3-element vector. */
export type Vector3 = readonly [number, number, number];

/** Input parameters for a Qmix calculation.
 *
 * @example
 * ```ts
 * { selectedCrystal: "BBO", temperatureKelvin: 300,
 *   wavelengthRed1Nm: 1064, wavelengthRed2Nm: 1064, wavelengthBlueNm: 0,
 *   principalPlane: "XY", type: "Mix" }
 * ```
 */
export interface QmixInput {
  /** Crystal name (from CrystalDB.list() or custom). */
  readonly selectedCrystal: string;
  /** Crystal temperature in Kelvin. */
  readonly temperatureKelvin: number;
  /** Longest interacting wavelength in nm (0 to compute). */
  readonly wavelengthRed1Nm: number;
  /** Middle interacting wavelength in nm (0 to compute). */
  readonly wavelengthRed2Nm: number;
  /** Shortest interacting wavelength in nm (0 to compute). */
  readonly wavelengthBlueNm: number;
  /** Principal plane for biaxial crystals. Ignored for uniaxial. */
  readonly principalPlane: PrincipalPlane;
  /** Mix or OPO. */
  readonly type: MixingType;
}

/** A single phase-matching result for one polarization combination.
 * Every field is machine-readable; use `formatQmixResults()` for human-readable output. */
export interface QmixResult {
  readonly wavelengthsNm: Vector3;
  readonly polarizations: PolarizationTriplet;
  readonly thetaDeg: number;
  readonly phiDeg: number;
  readonly dEffPmPerV: number;
  readonly walkoffMrad: Vector3;
  readonly phaseVelocityIndex: Vector3;
  readonly groupVelocityIndex: Vector3;
  readonly gddFs2PerMm: Vector3;
  readonly s0L2Watt: number;
  readonly angleToleranceMradCm: number;
  readonly temperatureRangeKCm: number;
  readonly acceptanceAngleMradCm: Vector2;
  readonly acceptanceBW: Vector2;
}

/** Schema for golden fixture JSON files containing reference MATLAB output. */
export interface GoldenFixture {
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
  readonly cases: readonly GoldenFixtureCase[];
}

export interface GoldenFixtureCase {
  readonly name: string;
  readonly description: string;
  readonly input: QmixInput;
  readonly expected: {
    readonly resultCount: number;
    readonly results: readonly QmixResult[];
    readonly formattedText: readonly string[];
  };
}
