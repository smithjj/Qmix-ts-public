/** Type for crystal names. */
export type CrystalName = string;
/** Type for crystal transmission ranges as [minNm, maxNm]. */
export type CrystalRange = readonly number[];
import type { BiNlEntry, CrystalInfo, CrystalKind, CrystalReferenceCitations, CrystalThermalProperties, SellmeierDefinition, TemperatureCorrectionDefinition, UniNlEntry } from "./types.js";
/** Database of nonlinear-crystal refractive indices.
 *
 * Provides static methods to compute refractive indices for all 93 built-in
 * crystals at arbitrary wavelengths and temperatures, and to register custom
 * DIY crystals defined by Sellmeier coefficients.
 *
 * Usage:
 * ```ts
 * const [no, ne] = CrystalDB.compute("BBO", 300, 1064);
 * const names = CrystalDB.list();
 * ```
 */
export declare class CrystalDB {
    /** Compute refractive index(es) for a crystal at a given temperature and wavelength.
     * @param crystalName - Crystal name (from `list()` or registered via `registerFromJson()`).
     * @param temperatureKelvin - Crystal temperature in K.
     * @param wavelengthNm - Wavelength in nm.
     * @returns - 2-element array for uniaxial [no, ne], 3-element for biaxial [nx, ny, nz].
     * @throws If the wavelength is out of the crystal's transmission range.
     */
    static compute(crystalName: string, temperatureKelvin: number, wavelengthNm: number): number[];
    /** List every known crystal in alphabetical order. */
    static list(): CrystalName[];
    /** List only built-in crystals in alphabetical order. */
    static listBuiltins(): CrystalName[];
    /** List only custom crystals registered at runtime. */
    static listCustom(): CrystalName[];
    /** Return true if the crystal name is known (built-in or custom). */
    static hasCrystal(crystalName: string): boolean;
    /** Get metadata and classification information for a crystal.
     * @returns CrystalInfo if the crystal exists, otherwise undefined. */
    static getCrystalInfo(crystalName: string): CrystalInfo | undefined;
    /** Get the transmission range for a crystal.
     * @returns [minNm, maxNm] or an empty array if unbounded. */
    static getRange(crystalName: string): CrystalRange;
    /** Register a custom crystal from a JSON-compatible definition.
     *
     * Expected JSON shape:
     * ```json
     * {
     *   "name": "MyCrystal",
     *   "numPolarizations": 2,
     *   "rangeNm": [200, 5000],
     *   "sellmeierFunction": 1,
     *   "coefficients": [[A, B, C, D, E], [A, B, C, D, E]],
     *   "temperatureCoefficients": [[a, b, c, d], [a, b, c, d]],
     *   "temperatureReferenceKelvin": 293,
     *   "temperatureFunction": 1
     * }
     * ```
     * Sellmeier function 1: n² = A + B/(λ²−C) + D/(λ²−E)  (λ in µm).
     * Sellmeier function 2: n² = A + B·λ²/(λ²−C) + D·λ²/(λ²−E).
     * Sellmeier function 3: n² = A + B/(λ²−C) + D/(λ²−E)  (legacy format).
     * Sellmeier function 4: n² = A + B·λ²/(λ²−C) + D·λ²/(λ²−E) + F·λ²/(λ²−G).
     * Sellmeier function 5: n² = A + B/(λ²−C) + D·λ² + E·λ⁴ + F·λ⁶.
     * Temperature function 1: Δn = (T−Tref)·(a/λ³ + b/λ² + c/λ + d)·10⁻⁵.
     * Temperature function 2: Δn = (T−Tref)·a.
     * Temperature function 3: Δn = (T−Tref)·a + (T−Tref)²·b.
     * @throws If the name is missing, already registered, or coefficients are invalid.
     */
    static registerFromJson(json: Record<string, unknown>): void;
    /** Register a complete crystal entry with Sellmeier coefficients and optional metadata.
     *
     * This is the recommended programmatic API for adding custom crystals because it
     * carries the crystal description, citations, thermal properties, and nonlinear
     * data in a single typed object.
     *
     * @param def - Complete crystal definition. The `nonlinear` field is automatically
     *              routed to `registerUniaxialNlData()` or `registerBiaxialNlData()`.
     * @throws If the name conflicts with an existing built-in or custom crystal.
     */
    static register(def: {
        readonly name: string;
        readonly description?: string;
        readonly formula?: string;
        readonly crystalClass?: string;
        readonly kind: CrystalKind;
        readonly wavelengthRangeNm: readonly [number, number];
        readonly references?: CrystalReferenceCitations;
        readonly thermalProperties?: CrystalThermalProperties;
        readonly sellmeier: SellmeierDefinition;
        readonly temperatureCorrection?: TemperatureCorrectionDefinition;
        readonly nonlinear?: UniNlEntry | BiNlEntry;
    }): void;
    /** Remove a custom crystal registered with `registerFromJson` or `register`.
     * Built-in crystals cannot be unregistered.
     * @returns true if the crystal existed and was removed. */
    static unregister(crystalName: string): boolean;
}
//# sourceMappingURL=crystal-db.d.ts.map