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

/** One row of a 3×6 contracted d-tensor (Voigt notation). */
export type DTensorRow = readonly [number, number, number, number, number, number];
/** 3×6 contracted nonlinear d-tensor. Use `null` when coefficients are unavailable. */
export type DTensor = readonly [DTensorRow, DTensorRow, DTensorRow];

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

/** Biaxial nonlinear-optical data.
 * @param dTensor - 3×6 contracted d-tensor in Voigt notation, or `null` if unavailable.
 * @param lambdaRef - Wavelength (nm) at which the quoted d values were measured. */
export interface BiNlEntry {
  readonly dTensor: DTensor | null;
  readonly lambdaRef: number;
}

/** Literature/source citations for a crystal entry. */
export interface CrystalReferenceCitations {
  /** Citation for the Sellmeier / refractive-index equation. */
  readonly refractiveIndex?: string;
  /** Citation for the thermo-optic correction coefficients. */
  readonly thermoOptic?: string;
  /** Citation for the nonlinear d-tensor values. */
  readonly dTensor?: string;
  /** Citation or note describing the transmission range. */
  readonly transmission?: string;
}

/** Optional thermal and material properties for a crystal. */
export interface CrystalThermalProperties {
  /** Thermal conductivity in W·m⁻¹·K⁻¹. May be anisotropic (principal values). */
  readonly conductivityWattPerMeterK?: number | readonly number[];
  /** Linear thermal-expansion coefficients in 10⁻⁶·K⁻¹. */
  readonly expansionCoefficients10Per6K?: readonly number[];
  /** Specific heat in J·kg⁻¹·K⁻¹. */
  readonly specificHeatJoulePerKgK?: number;
  /** Density in kg·m⁻³. */
  readonly densityKgPerM3?: number;
}

/** Crystal symmetry / optical class. */
export type CrystalKind = "isotropic" | "uniaxial" | "biaxial";

/** Complete metadata for a crystal entry, suitable for display and export. */
export interface CrystalMetadata {
  /** Crystal identifier (matches the key in CrystalDB.list()). */
  readonly name: string;
  /** Human-readable description e.g. "Beta-barium borate". */
  readonly description?: string | undefined;
  /** Chemical formula e.g. "β-BaB₂O₄". */
  readonly formula?: string | undefined;
  /** Optical kind: isotropic (1 index), uniaxial (2), or biaxial (3). */
  readonly kind: CrystalKind;
  /** Crystallographic point group / class e.g. "3m". */
  readonly crystalClass?: string | undefined;
  /** Transmission / usable wavelength range in nm. */
  readonly wavelengthRangeNm: readonly [number, number];
  /** Source citations. */
  readonly referenceCitations?: CrystalReferenceCitations | undefined;
  /** Thermal/material properties. */
  readonly thermalProperties?: CrystalThermalProperties | undefined;
}

/** Definition of a Sellmeier equation and its coefficients.
 *
 * - Function 1: n² = A + B / (λ² − C) + D / (λ² − E)
 * - Function 2: n² = A + B / (λ² − C) − D·λ²
 * - Function 3: n² = A + B / (λ² − C) + D·λ² / (λ² − E)
 * - Function 4: n² = A + B / (λ² − C) + D / (λ² − E)    (with different default exponents; handled internally)
 * - Function 5: Custom / legacy forms used by selected built-in crystals
 *
 * λ is in micrometers. Each inner array is one set of coefficients for a principal index. */
export interface SellmeierDefinition {
  readonly function: 1 | 2 | 3 | 4 | 5;
  readonly coefficients: readonly (readonly number[])[];
}

/** Definition of a temperature-correction model.
 *
 * - Function 1: Δn = (T − Tref)·(a/λ³ + b/λ² + c/λ + d)·10⁻⁵
 * - Function 2: ternary material form (same structure as function 1 internally)
 * - Function 3: alternative bilinear / higher-order form (used internally)
 *
 * λ is in micrometers. */
export interface TemperatureCorrectionDefinition {
  readonly function: 1 | 2 | 3;
  readonly coefficients: readonly (readonly number[])[];
  readonly referenceKelvin: number;
}

/** Information returned by `CrystalDB.getCrystalInfo()`. */
export interface CrystalInfo extends CrystalMetadata {
  /** True if this crystal was added at runtime rather than shipped built-in. */
  readonly isCustom: boolean;
}