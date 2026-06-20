import type { BiNlEntry, QmixInput, QmixResult, UniNlEntry, Vector3 } from "./types.js";
/** Main phase-matching engine. Given crystal, wavelengths, and temperature,
 * finds all valid propagation angles and polarization combinations satisfying
 * energy conservation and momentum conservation (phase matching) for three-wave
 * mixing processes (SHG, SFG, OPO).
 */
export declare class QmixEngine {
    /** Run the phase-matching search.
     * @param input - Wavelengths, crystal, temperature, plane, and mixing type.
     * @returns Array of results — one per valid polarization combination.
     *          Empty array if no phase-matching solutions exist.
     */
    calculate(input: QmixInput): QmixResult[];
}
export type Matrix3x3 = readonly [Vector3, Vector3, Vector3];
/** Biaxial d_eff calculation using the BI_NL d-tensor table. */
export declare function biNl(crystal: string, wavelengthNm: number, angleMatrix: Matrix3x3): number;
/** Compute squared refractive index at 300K for Miller scaling. */
export declare function firstSquaredIndex(crystal: string, wavelengthNm: number): number;
/** Register nonlinear-optical coefficients for a custom uniaxial crystal.
 * After registering, the crystal can be used with QmixEngine.calculate().
 * @param crystal - Name matching a crystal registered via CrystalDB.registerFromJson().
 * @param entry - NL coefficients: d1 = d1Cos*cosθ + d1Sin*sinθ, d2 = d2Cos2*cos²θ + d2Sin2*sin2θ.
 */
export declare function registerUniaxialNlData(crystal: string, entry: UniNlEntry): void;
/** Register nonlinear-optical coefficients for a custom biaxial crystal.
 * The d-tensor is a 3×6 contracted matrix. After registering, the crystal
 * can be used with QmixEngine.calculate() across all principal planes.
 * @param crystal - Name matching a crystal registered via CrystalDB.registerFromJson().
 * @param entry - 3×6 d-tensor and Miller-scaling reference wavelength.
 */
export declare function registerBiaxialNlData(crystal: string, entry: BiNlEntry): void;
//# sourceMappingURL=engine.d.ts.map