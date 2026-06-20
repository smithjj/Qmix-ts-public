/** Type for crystal names. */
export type CrystalName = string;
/** Type for crystal transmission ranges as [minNm, maxNm]. */
export type CrystalRange = readonly number[];

import type { BiNlEntry, CrystalInfo, CrystalKind, CrystalMetadata, CrystalReferenceCitations, CrystalThermalProperties, SellmeierDefinition, TemperatureCorrectionDefinition, UniNlEntry } from "./types.js";
import { registerBiaxialNlData, registerUniaxialNlData } from "./engine.js";
import { BUILT_IN_CRYSTAL_METADATA } from "./crystal-metadata.js";
type SellmeierFunction = SellmeierDefinition["function"];
type TempFunction = TemperatureCorrectionDefinition["function"];

interface BaseEntry {
  readonly rangeNm: CrystalRange;
  readonly numPolarizations: number;
  readonly metadata?: CrystalMetadata;
}

interface GenericEntry extends BaseEntry {
  readonly kind: "generic";
  readonly sellmeierFunction: SellmeierFunction;
  readonly coeffs: readonly (readonly number[])[];
  readonly tempCorrection?: {
    readonly tempFunction: TempFunction;
    readonly coeffs: readonly (readonly number[])[];
    readonly referenceKelvin: number;
  };
}

interface CustomEntry extends BaseEntry {
  readonly kind: "custom";
  readonly compute: (temperatureKelvin: number, wavelengthNm: number) => number[];
}

type CrystalEntry = GenericEntry | CustomEntry;

const entries: Record<string, CrystalEntry> = {
  AAS: makeEntry(3, 2, [600, 13000], [
    [9.22, 0.4454, 0.1264, 1733, 1000],
    [7.007, 0.323, 0.1192, 660, 1000]
  ]),
  ADA: makeCustomEntry(computeAda, 2, [220, 1200]),
  ADP: makeCustomEntry(computeAdp, 2, [184, 1500]),
  AGGS: makeEntry(1, 3, [729, 13000], [
    [5.0771, 0.1691, 0.049, 0.001583],
    [5.3172, 0.1777, 0.0721, 0.002437],
    [5.3179, 0.1776, 0.0728, 0.002437]
  ]),
  AGGSE: makeEntry(3, 3, [590, 16100], [
    [5.7182737, 0.2436557, 0.12550405, 24.729565, 250],
    [6.5626531, 0.328056, 0.12928073, 116.75498, 400],
    [6.6688973, 0.33109498, 0.12679454, 136.03294, 400]
  ]),
  AGS: makeCustomEntry(computeAgs, 2, [700, 14000]),
  AGSE: makeCustomEntry(computeAgse, 2, [750, 18000]),
  ASS: makeEntry(2, 2, [700, 14000], [
    [1, 6.585, 0.16, 0.1133, 225],
    [1, 5.845, 0.16, 0.0202, 225]
  ]),
  BBO_1: makeEntry(5, 2, [184, 3500], [
    [2.7359, 0.01878, 0.01822, -0.01471, 0.0006081, -0.0000674],
    [2.3753, 0.01224, 0.01667, -0.01627, 0.0005716, -0.00006305]
  ], { tempFunction: 2, coeffs: [[-1.66e-5], [-9.3e-6]], referenceKelvin: 293 }),
  BBO_2: makeCustomEntry(computeBbo2, 2, [192.5, 3139.2]),
  BBO_3: makeCustomEntry(computeBbo3, 2, [188, 5200]),
  BBO: makeCustomEntry(computeBbo3, 2, [188, 5200]),
  BBPO: makeEntry(1, 2, [350, 3300], [
    [2.774, 0.01124, 0.0418, 0.02094],
    [2.6873, 0.008977, 0.05332, 0.02133]
  ]),
  B2GGS: makeCustomEntry(computeB2ggs, 2, [750, 10800]),
  BGGS: makeEntry(1, 2, [434, 10001], [
    [5.1047, 0.148, 0.0562, 0.00253],
    [5.3288, 0.1674, 0.0536, 0.00265]
  ]),
  BGGSE: makeCustomEntry(computeBggse, 2, [780, 10720]),
  BGS: makeCustomEntry(computeBgs, 3, []),
  BGSE: makeCustomEntry(computeBgse, 3, [900, 16100]),
  BIBO: makeCustomEntry(computeBibo, 3, [285, 3100]),
  BPO: makeEntry(1, 2, [134, 3499], [
    [2.51252, 0.01055, 0.01026, 0.01659],
    [2.52984, 0.0108, 0.01028, 0.01762]
  ]),
  CBBF: makeEntry(1, 2, [150, 3500], [
    [2.2562126, 0.0091453, 0.0126509, 0.0104828],
    [2.0802682, 0.0070027, 0.0109331, 0.0047423]
  ]),
  CBO: makeEntry(1, 3, [170, 3000], [
    [2.3035, 0.01378, 0.01498, 0.00612],
    [2.3704, 0.01528, 0.01581, 0.00939],
    [2.4753, 0.01806, 0.01752, 0.01654]
  ], { tempFunction: 1, coeffs: [[0.0604, -0.426, 0.826, -2.28], [0.0894, -0.634, 1.274, -2.89], [0.0628, -0.395, 0.677, -2.69]], referenceKelvin: 293 }),
  CDA: makeCustomEntry(computeCda, 2, [260, 1430]),
  CDSE: makeCustomEntry(computeCdse, 2, [750, 16500]),
  CGA: makeEntry(1, 2, [2500, 12000], [
    [12.4008, 2.2082, 1.4861, 0.00133],
    [13.0079, 3.2613, 2.8382, 0.00125]
  ], { tempFunction: 1, coeffs: [[13.5784, -23.0022, 15.2857, 20.3402], [14.4885, -23.2396, 15.4161, 21.2952]], referenceKelvin: 293 }),
  CLBO: makeCustomEntry(computeClbo, 2, [180, 2750]),
  CSP: makeCustomEntry(computeCsp, 2, [950, 9500]),
  CSP_old: makeCustomEntry(computeCspOld, 2, [659, 10000]),
  CTA: makeEntry(2, 3, [350, 5300], [
    [1.91529, 1.47442, 0.03636, 3.3424, 256.3489],
    [2.17626, 1.25709, 0.04516, 3.57582, 268.5551],
    [2.46519, 1.1673, 0.06049, 3.69079, 278.8889]
  ], { tempFunction: 1, coeffs: [[0.3436, -0.4197, 0.3161, 0.8231], [0.5958, -0.812, 0.6376, 0.8546], [1.517, -2.7879, 2.5353, 2.5586]], referenceKelvin: 293 }),
  CTW: makeEntry(1, 2, [450, 2350], [
    [4.24822, 0.10569, 0.05791, 0.01715],
    [3.62986, 0.0574, 0.04271, 0.00699]
  ]),
  DADA: makeCustomEntry(computeDada, 2, [220, 1200]),
  DADP: makeCustomEntry(computeDadp, 2, [220, 1700]),
  DCDA: makeCustomEntry(computeDcda, 2, [270, 1660]),
  DKDP: makeCustomEntry(computeDkdp, 2, [200, 1600]),
  DLAP: makeCustomEntry(computeDlap, 3, [230, 1200]),
  DRDA: makeCustomEntry(computeDrda, 2, [260, 1700]),
  DRDP: makeCustomEntry(computeDrdp, 2, [220, 1500]),
  GAAS: makeCustomEntry(computeGaas, 1, [969, 17000]),
  GAN: makeEntry(2, 2, [400, 5000], [
    [1, 4.199, 0.03073, 3.625, 290.7025],
    [1, 4.347, 0.03172, 2.964, 231.9529]
  ]),
  GAP: makeCustomEntry(computeGap, 1, [699, 12501]),
  GCOB: makeEntry(2, 3, [320, 2700], [
    [2.1685, 0.6163, 0.0341, 0.5773, 107.0991],
    [2.2572, 0.6169, 0.0383, 1.3245, 115.7501],
    [2.2587, 0.6482, 0.0409, 1.8922, 148.8075]
  ]),
  GEO: makeEntry(1, 2, [410, 5080], [
    [2.797, 0.0329, 0.0005, 0.0113],
    [2.9152, 0.0197, 0.086, 0.0119]
  ]),
  GS: makeCustomEntry(computeGs, 2, [800, 16200]),
  HGS: makeEntry(3, 2, [500, 13000], [
    [7.4899, 0.22713, 0.10209, 1089.68, 706.14],
    [7.27453, 0.20413, 0.10074, 1098.54, 719.62]
  ]),
  HS: makeEntry(2, 2, [630, 13500], [
    [4.1506, 2.7896, 0.1328, 1.1378, 705],
    [4.0101, 4.3736, 0.1284, 1.5604, 705]
  ]),
  KABO: makeCustomEntry(computeKabo, 2, [180, 3600]),
  KBBF: makeCustomEntry(computeKbbf, 2, [160, 3500]),
  KBO: makeCustomEntry(computeKbo, 3, [165, 1400]),
  KDA: makeCustomEntry(computeKda, 2, [216, 1700]),
  KDP: makeCustomEntry(computeKdp, 2, [200, 1600]),
  KNBO3: makeCustomEntry(computeKnbo3, 3, [380, 5500]),
  KTA_1: makeCustomEntry(computeKta1, 3, [350, 4500]),
  KTA_2: makeCustomEntry(computeKta2, 3, [350, 4500]),
  KTA_3: makeCustomEntry(computeKta3, 3, [350, 4500]),
  KTP_F: makeCustomEntry(computeKtpf, 3, [350, 4500]),
  KTP_H: makeCustomEntry(computeKtph, 3, [350, 4500]),
  KTP_K: makeCustomEntry(computeKtpk, 3, [350, 4500]),
  LB4: makeEntry(1, 2, [159, 3502], [
    [2.56431, 0.012337, 0.013103, 0.019075],
    [2.38651, 0.010664, 0.012878, 0.012813]
  ]),
  LBGO: makeCustomEntry(computeLbgo, 2, [260, 1070]),
  LBO: makeCustomEntry(computeLbo, 3, [160, 2800]),
  LCB: makeEntry(1, 3, [179, 3201], [
    [2.7822579, 0.0160703, 0.0149796, 0.0153541],
    [2.7859832, 0.0158296, 0.014627, 0.0153774],
    [2.9681748, 0.0195743, 0.017539, 0.02061085]
  ], { tempFunction: 1, coeffs: [[-0.01148, 0.1814, -0.42937, 1.08278], [-0.03384, 0.31356, -0.55422, 0.77771], [-0.01511, 0.19754, -0.482, 0.6593]], referenceKelvin: 293 }),
  LFM: makeCustomEntry(computeLfm, 3, [230, 1200]),
  LGN: makeEntry(1, 2, [429, 7001], [
    [3.6836, 0.46, 0.296, 0.0094],
    [3.7952, 0.483, 0.314, 0.0102]
  ]),
  LGS: makeCustomEntry(computeLgs, 3, [700, 11000]),
  LGSE: makeEntry(3, 3, [370, 13200], [
    [6.25263, 0.17189, 0.06718, 801.07, 633.39],
    [6.54026, 0.18644, 0.07627, 848.02, 637.06],
    [6.66464, 0.18813, 0.08649, 977.03, 677.33]
  ]),
  LGT: makeEntry(1, 2, [750, 14000], [
    [6.24921, 0.42592, 0.0531, 0.00149],
    [6.70825, 0.5667, 0.01964, 0.001]
  ]),
  LGTO: makeEntry(1, 2, [500, 6000], [
    [3.6485, 0.0444, 0.0138, 0.0096],
    [3.7451, 0.036, 0.2503, 0.0102]
  ]),
  LIIO3: makeCustomEntry(computeLiio3, 2, [300, 5600]),
  LIS: makeCustomEntry(computeLis, 3, [716, 10620]),
  LISE: makeCustomEntry(computeLise, 3, [999, 12000]),
  LITA_C: makeCustomEntry(computeMatlabReferenceError, 2, [280, 5000]),
  LITA_M: makeCustomEntry(computeLitam, 2, [280, 6001]),
  LITA_S: makeCustomEntry(computeMatlabReferenceError, 2, [280, 5000]),
  LNB_C: makeCustomEntry(computeLnbc, 2, [330, 7001]),
  LNB_M: makeCustomEntry(computeLnbm, 2, [330, 7001]),
  LNB_S: makeCustomEntry(computeLnbs, 2, [330, 7001]),
  NLBO: makeEntry(1, 2, [200, 3500], [
    [3.433933, 0.0350044, 0.0180403, 0.014413],
    [3.1207853, 0.02825765, 0.0147568, 0.005254]
  ]),
  NTW: makeEntry(1, 3, [449, 2301], [
    [3.6246, 0.0627, 0.0435, 0.0084],
    [3.8688, 0.0773, 0.0518, 0.0111],
    [4.1915, 0.1003, 0.0604, 0.0186]
  ]),
  RBBF: makeCustomEntry(computeRbbf, 2, [165, 3500]),
  RDA: makeCustomEntry(computeRda, 2, [260, 1460]),
  RDP: makeCustomEntry(computeRdp, 2, [220, 1500]),
  RTA: makeCustomEntry(computeRta, 3, [350, 4500]),
  RTP: makeCustomEntry(computeRtp, 3, [350, 4500]),
  SC4H: makeCustomEntry(computeSc4h, 2, [370, 6000]),
  SC6H: makeCustomEntry(computeSc6h, 2, [400, 6000]),
  TAS: makeCustomEntry(computeTas, 2, [1250, 20000]),
  TCOB: makeEntry(1, 3, [525, 1551], [
    [2.80878, 0.02233, 0.01613, 0.00589],
    [2.9, 0.02334, 0.01729, 0.01104],
    [2.92981, 0.02373, 0.01568, 0.01198]
  ]),
  TE: makeEntry(2, 2, [3800, 32000], [
    [4.0164, 18.8133, 1.1572, 7.3729, 10000],
    [1.9041, 36.8133, 1.0803, 6.2456, 10000]
  ]),
  YCOB: makeCustomEntry(computeYcob, 3, [219, 3503]),
  ZGP: makeCustomEntry(computeZgp, 2, [740, 12000]),
  ZNSE: makeCustomEntry(computeZnse, 1, [499, 19001]),
  ZZ_U: makeCustomEntry(computeMatlabReferenceError, 2, [])
};

for (const [name, entry] of Object.entries(entries)) {
  const inline = BUILT_IN_CRYSTAL_METADATA[name as keyof typeof BUILT_IN_CRYSTAL_METADATA];
  if (inline !== undefined) {
    const kind = numPolarizationsToKind(entry.numPolarizations);
    entries[name] = {
      ...entry,
      metadata: {
        name,
        description: inline.description,
        formula: undefined,
        kind,
        crystalClass: inline.crystalClass,
        wavelengthRangeNm: [entry.rangeNm[0]!, entry.rangeNm[1]!] as const,
        ...(inline.referenceCitations !== undefined ? { referenceCitations: inline.referenceCitations } : {}),
        ...(inline.thermalProperties !== undefined ? { thermalProperties: inline.thermalProperties } : {}),
      }
    };
  }
}

const builtInEntries = new Set(Object.keys(entries));

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
export class CrystalDB {
  /** Compute refractive index(es) for a crystal at a given temperature and wavelength.
   * @param crystalName - Crystal name (from `list()` or registered via `registerFromJson()`).
   * @param temperatureKelvin - Crystal temperature in K.
   * @param wavelengthNm - Wavelength in nm.
   * @returns - 2-element array for uniaxial [no, ne], 3-element for biaxial [nx, ny, nz].
   * @throws If the wavelength is out of the crystal's transmission range.
   */
  static compute(crystalName: string, temperatureKelvin: number, wavelengthNm: number): number[] {
    const entry = getEntry(crystalName);
    if (entry.kind === "custom" && entry.compute === computeMatlabReferenceError) {
      return entry.compute(temperatureKelvin, wavelengthNm);
    }
    if (!isInRange(wavelengthNm, entry.rangeNm)) {
      return zeros(entry.numPolarizations);
    }

    if (entry.kind === "custom") {
      return entry.compute(temperatureKelvin, wavelengthNm);
    }

    return computeGenericEntry(entry, temperatureKelvin, wavelengthNm);
  }

  /** List every known crystal in alphabetical order. */
  static list(): CrystalName[] {
    return Object.keys(entries).sort();
  }

  /** List only built-in crystals in alphabetical order. */
  static listBuiltins(): CrystalName[] {
    return Object.keys(entries).filter((name) => builtInEntries.has(name)).sort();
  }

  /** List only custom crystals registered at runtime. */
  static listCustom(): CrystalName[] {
    return Object.keys(entries).filter((name) => !builtInEntries.has(name)).sort();
  }

  /** Return true if the crystal name is known (built-in or custom). */
  static hasCrystal(crystalName: string): boolean {
    return entries[crystalName] !== undefined;
  }

  /** Get metadata and classification information for a crystal.
   * @returns CrystalInfo if the crystal exists, otherwise undefined. */
  static getCrystalInfo(crystalName: string): CrystalInfo | undefined {
    const entry = entries[crystalName];
    if (entry === undefined) return undefined;
    const kind = numPolarizationsToKind(entry.numPolarizations);
    return {
      name: crystalName,
      kind,
      wavelengthRangeNm: [entry.rangeNm[0]!, entry.rangeNm[1]!] as const,
      ...entry.metadata,
      isCustom: !builtInEntries.has(crystalName),
    };
  }

  /** Get the transmission range for a crystal.
   * @returns [minNm, maxNm] or an empty array if unbounded. */
  static getRange(crystalName: string): CrystalRange {
    return getEntry(crystalName).rangeNm;
  }

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
  static registerFromJson(json: Record<string, unknown>): void {
    const name = String(json.name ?? "");
    if (!name) throw new Error("Crystal name is required");
    ensureNotRegistered(name);
    const numPol = Number(json.numPolarizations ?? 2);
    const range = json.rangeNm as number[];
    if (!Array.isArray(range) || range.length < 2) {
      throw new Error("rangeNm must be an array of [min, max]");
    }
    const sellmeier = Number(json.sellmeierFunction ?? 1) as SellmeierFunction;
    const coeffs = json.coefficients as readonly (readonly number[])[];
    if (!Array.isArray(coeffs) || coeffs.length !== numPol) {
      throw new Error(`coefficients must be an array with ${numPol} rows`);
    }
    const tempCoeffs = json.temperatureCoefficients as readonly (readonly number[])[];
    const tempRef = Number(json.temperatureReferenceKelvin ?? 293);
    const tempFunction = Number(json.temperatureFunction ?? 1) as TempFunction;
    const tempCorrection = Array.isArray(tempCoeffs) && tempCoeffs.length === numPol
      ? { tempFunction, coeffs: tempCoeffs, referenceKelvin: tempRef }
      : undefined;
    const metadata: CrystalMetadata | undefined = json.description || json.formula || json.crystalClass || json.referenceCitations || json.thermalProperties
      ? {
          name,
          kind: numPolarizationsToKind(numPol),
          wavelengthRangeNm: [range[0]!, range[1]!] as const,
          description: json.description as string | undefined,
          formula: json.formula as string | undefined,
          crystalClass: json.crystalClass as string | undefined,
          referenceCitations: json.referenceCitations as CrystalReferenceCitations | undefined,
          thermalProperties: json.thermalProperties as CrystalThermalProperties | undefined,
        }
      : undefined;
    const entry: GenericEntry = {
      kind: "generic",
      sellmeierFunction: sellmeier,
      numPolarizations: numPol,
      rangeNm: range,
      coeffs,
      ...(tempCorrection !== undefined ? { tempCorrection } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    };
    entries[name] = entry;
  }

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
  }): void {
    const { name, kind, wavelengthRangeNm, sellmeier, temperatureCorrection, nonlinear } = def;
    ensureNotRegistered(name);
    const numPol = kindToNumPolarizations(kind);
    if (sellmeier.coefficients.length !== numPol) {
      throw new Error(`sellmeier.coefficients must have ${numPol} rows for ${kind} crystal`);
    }
    if (temperatureCorrection !== undefined && temperatureCorrection.coefficients.length !== numPol) {
      throw new Error(`temperatureCorrection.coefficients must have ${numPol} rows for ${kind} crystal`);
    }

    const metadata: CrystalMetadata = {
      name,
      description: def.description,
      formula: def.formula,
      kind,
      crystalClass: def.crystalClass,
      wavelengthRangeNm,
      referenceCitations: def.references,
      thermalProperties: def.thermalProperties,
    };

    const entry: GenericEntry = {
      kind: "generic",
      sellmeierFunction: sellmeier.function,
      numPolarizations: numPol,
      rangeNm: wavelengthRangeNm,
      coeffs: sellmeier.coefficients,
      metadata,
      ...(temperatureCorrection !== undefined
        ? {
            tempCorrection: {
              tempFunction: temperatureCorrection.function,
              coeffs: temperatureCorrection.coefficients,
              referenceKelvin: temperatureCorrection.referenceKelvin,
            }
          }
        : {}),
    };
    entries[name] = entry;

    if (nonlinear !== undefined) {
      if (kind === "uniaxial" || kind === "isotropic") {
        registerUniaxialNlData(name, nonlinear as UniNlEntry);
      } else {
        registerBiaxialNlData(name, nonlinear as BiNlEntry);
      }
    }
  }

  /** Remove a custom crystal registered with `registerFromJson` or `register`.
   * Built-in crystals cannot be unregistered.
   * @returns true if the crystal existed and was removed. */
  static unregister(crystalName: string): boolean {
    if (builtInEntries.has(crystalName)) return false;
    if (entries[crystalName] === undefined) return false;
    delete entries[crystalName];
    return true;
  }
}

function numPolarizationsToKind(numPolarizations: number): CrystalKind {
  if (numPolarizations === 1) return "isotropic";
  if (numPolarizations === 2) return "uniaxial";
  return "biaxial";
}

function kindToNumPolarizations(kind: CrystalKind): number {
  switch (kind) {
    case "isotropic": return 1;
    case "uniaxial": return 2;
    case "biaxial": return 3;
  }
}

function ensureNotRegistered(name: string): void {
  if (entries[name] !== undefined) {
    throw new Error(`Crystal '${name}' is already registered`);
  }
}

function getEntry(crystalName: string): CrystalEntry {
  const entry = entries[crystalName];
  if (entry === undefined) {
    throw new Error(`Unknown crystal: ${crystalName}`);
  }
  return entry;
}

function makeEntry(
  sellmeierFunction: SellmeierFunction,
  numPolarizations: number,
  rangeNm: CrystalRange,
  coeffs: readonly (readonly number[])[],
  tempCorrection?: GenericEntry["tempCorrection"]
): GenericEntry {
  return {
    kind: "generic",
    sellmeierFunction,
    numPolarizations,
    rangeNm,
    coeffs,
    ...(tempCorrection === undefined ? {} : { tempCorrection })
  };
}

function makeCustomEntry(
  compute: (temperatureKelvin: number, wavelengthNm: number) => number[],
  numPolarizations: number,
  rangeNm: CrystalRange
): CustomEntry {
  return {
    kind: "custom",
    compute,
    numPolarizations,
    rangeNm
  };
}

function computeGenericEntry(entry: GenericEntry, temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const dT = temperatureKelvin - (entry.tempCorrection?.referenceKelvin ?? 0);

  return entry.coeffs.map((coeff, index) => {
    const n2 = genericSellmeier(entry.sellmeierFunction, coeff, lambda2);
    let n = Math.sqrt(Math.abs(n2));

    if (entry.tempCorrection !== undefined) {
      const tempCoeff = requiredValue(entry.tempCorrection.coeffs[index], `Missing temperature coefficients for polarization ${index}`);
      n += temperatureCorrection(entry.tempCorrection.tempFunction, tempCoeff, lambda, lambda2, dT);
    }

    return n;
  });
}

function genericSellmeier(sellmeierFunction: SellmeierFunction, coeff: readonly number[], lambda2: number): number {
  switch (sellmeierFunction) {
    case 1:
      return required(coeff[0], "c0") + required(coeff[1], "c1") / (lambda2 - required(coeff[2], "c2")) - required(coeff[3], "c3") * lambda2;
    case 2:
      return required(coeff[0], "c0") +
        (required(coeff[1], "c1") * lambda2) / (lambda2 - required(coeff[2], "c2")) +
        (required(coeff[3], "c3") * lambda2) / (lambda2 - required(coeff[4], "c4"));
    case 3:
      return required(coeff[0], "c0") + required(coeff[1], "c1") / (lambda2 - required(coeff[2], "c2")) + required(coeff[3], "c3") / (lambda2 - required(coeff[4], "c4"));
    case 4:
      return required(coeff[0], "c0") +
        (required(coeff[1], "c1") * lambda2) / (lambda2 - required(coeff[2], "c2")) +
        (required(coeff[3], "c3") * lambda2) / (lambda2 - required(coeff[4], "c4")) +
        (required(coeff[5], "c5") * lambda2) / (lambda2 - required(coeff[6], "c6"));
    case 5:
      return required(coeff[0], "c0") +
        required(coeff[1], "c1") / (lambda2 - required(coeff[2], "c2")) +
        required(coeff[3], "c3") * lambda2 +
        required(coeff[4], "c4") * lambda2 ** 2 +
        required(coeff[5], "c5") * lambda2 ** 3;
  }
}

function temperatureCorrection(
  tempFunction: TempFunction,
  coeff: readonly number[],
  lambda: number,
  lambda2: number,
  dT: number
): number {
  switch (tempFunction) {
    case 1:
      return 1e-5 *
        (required(coeff[0], "t0") / lambda ** 3 +
          required(coeff[1], "t1") / lambda2 +
          required(coeff[2], "t2") / lambda +
          required(coeff[3], "t3")) *
        dT;
    case 2:
      return required(coeff[0], "t0") * dT;
    case 3:
      return required(coeff[0], "t0") * dT + required(coeff[1], "t1") * dT ** 2;
  }
}

function computeAda(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 2.443449, b: 2.017752, c: 57.83514282, d: 0.016757, e: 0.018272821, temp: 4.56e-5 },
    { a: 2.275962, b: 1.59826, c: 126.8851303, d: 0.014296, e: 0.014296, temp: -1.25e-5 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.a + (row.b * lambda2) / (lambda2 - row.c) + row.d / (lambda2 - row.e))) - row.temp * (temperatureKelvin - 300));
}

function computeAdp(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: -8.7835e-4, b: 7.2007e-4, c: 1.40526e-5, d: -1.179e-4, A: 1.6996, B: 0.64955, C: -0.01723, D: 1.10624, E: 30 },
    { a: -1.089e-5, b: 5.14e-6, c: 2.4714e-7, d: -9.99e-7, A: 1.42036, B: 0.74453, C: -0.013, D: 0.42033, E: 30 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(
    row.A + row.a * temperatureKelvin +
      ((row.B + row.b * temperatureKelvin) * lambda2) / (lambda2 + row.C + row.c * temperatureKelvin) +
      ((row.D + row.d * temperatureKelvin) * lambda2) / (lambda2 - row.E)
  )));
}

function computeAgs(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const base = [
    { A: 11.15176, B: 0.23052, C: 0.07319, D: 11918.07, E: 2224.38 },
    { A: 10.62054, B: 0.22283, C: 0.09609, D: 10591.78, E: 2084.7 },
    { A: 10.61542, B: 0.21986, C: 0.10223, D: 10591.78, E: 2084.7 }
  ] as const;
  const temp = [
    { a: 5.4715, b: -13.1712, c: 11.1658, d: 2.6567 },
    { a: 4.7561, b: -11.5291, c: 9.8642, d: 3.5284 }
  ] as const;
  const n2 = base.map((row) => Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E)));
  const selectedN2 = [n2[0], lambda > 0.6328 ? n2[1] : n2[2]];

  return selectedN2.map((value, index) => {
    const tempRow = requiredValue(temp[index], `Missing AGS temperature coefficients ${index}`);
    return Math.sqrt(requiredValue(value, `Missing AGS index ${index}`)) +
      1e-5 * (temperatureKelvin - 293) * (tempRow.a / lambda ** 3 + tempRow.b / lambda2 + tempRow.c / lambda + tempRow.d);
  });
}

function computeAgse(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 11.62264, B: 0.43221, C: 0.15597, D: 18868.52, E: 3953.34, a: 3.2357, b: -2.2217, c: 2.4217, d: 6.3228 },
    { A: 11.33168, B: 0.45951, C: 0.21284, D: 17816.81, E: 3828.78, a: 2.2337, b: -2.2254, c: 2.0152, d: 6.3338 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    (row.a / lambda ** 3 + row.b / lambda2 + row.c / lambda + row.d) * 1e-5 * (temperatureKelvin - 293));
}

function computeB2ggs(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 7.51817, B: 0.1635, C: 0.0683, D: 2245.22, E: 1000.43, a: 3.0074, b: -5.4356, c: 3.5693, d: 3.0308 },
    { A: 7.24074, B: 0.15207, C: 0.0679, D: 2145.08, E: 1013.92, a: 3.616, b: -6.3563, c: 4.0965, d: 4.5299 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    1e-5 * (row.d + row.c / lambda + row.b / lambda2 + row.a / lambda ** 3) * (temperatureKelvin - 293));
}

function computeBgs(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 6.39731, B: 0.15895, C: 0.02841, D: 811.45, E: 606.97, a: 0.8097, b: -0.8578, c: 0.6703, d: 3.3207 },
    { A: 6.86357, B: 0.16688, C: 0.03156, D: 1146.08, E: 665.85, a: 0.6914, b: -0.8399, c: 0.6655, d: 2.3081 },
    { A: 7.49244, B: 0.1694, C: 0.03299, D: 1692.27, E: 751.89, a: 0.6854, b: -0.8233, c: 0.3813, d: 1.3766 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    1e-5 * (row.a / lambda ** 3 + row.b / lambda2 + row.c / lambda + row.d) * (temperatureKelvin - 293.15));
}

function computeBggse(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 7.39367, B: 0.27086, C: 0.06961, D: 1513.1, E: 1237.35, a: 14.1291, b: -23.3638, c: 12.9005, d: 2.867 },
    { A: 8.11658, B: 0.30287, C: 0.13199, D: 2197.51, E: 1408.89, a: 13.9802, b: -23.0577, c: 12.6154, d: 1.762 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    1e-5 * (row.a / lambda ** 3 + row.b / lambda2 + row.c / lambda + row.d) * (temperatureKelvin - 293));
}

function computeBgse(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 6.72431, B: 0.26375, C: 0.04248, D: 608.63, E: 756.87, a: 6.0868, b: -12.6368, c: 10.5624, d: 1.5532 },
    { A: 6.86603, B: 0.26816, C: 0.04259, D: 682.97, E: 781.78, a: 6.3935, b: -13.1762, c: 10.895, d: 2.813 },
    { A: 7.16709, B: 0.32681, C: 0.06973, D: 731.86, E: 790.16, a: 6.3141, b: -13.079, c: 10.8486, d: 2.2548 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    1e-5 * (row.a / lambda ** 3 + row.b / lambda2 + row.c / lambda + row.d) * (temperatureKelvin - 298));
}

function computeBibo(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 3.07403, B: 0.03231, C: 0.03163, D: 0.013376, a: 0.3826, b: 1.0868, c: 2.1546, d: 3.9343, e: 0.00502 },
    { A: 3.1694, B: 0.03717, C: 0.03483, D: 0.01827, a: 0.6614, b: 1.7119, c: 2.0856, d: 3.7731, e: 0.006664 },
    { A: 3.6545, B: 0.05112, C: 0.03713, D: 0.02261, a: 0.9861, b: 3.7512, c: 5.5064, d: 4.6591, e: 0.011622 }
  ] as const;
  const deltaT = temperatureKelvin - 293;

  return rows.map((row) => {
    const n = Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) - row.D * lambda2));
    const dn = (row.a / lambda ** 3 - row.b / lambda2 + row.c / lambda + row.d) * 1e-5;
    return n + dn * (1 - row.e * deltaT) * deltaT;
  });
}

function computeCda(temperatureKelvin: number, wavelengthNm: number): number[] {
  return sell2(wavelengthNm, [
    { a: 2.420405, b: 1.403336, c: 57.82416181, d: 0.016272, e: 0.018005614 },
    { a: 2.350262, b: 0.685328, c: 127.2688578, d: 0.015645, e: 0.014820871 }
  ]).map((n, index) => n - requiredValue([2.87e-5, 2.21e-5][index], `Missing CDA temp ${index}`) * (temperatureKelvin - 300));
}

function computeCdse(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 9.1123, b: 0.40251, c: 0.22436, d: 10545.6, e: 3380, A: 7.3594, B: -6.7719, C: 4.2963, D: 4.0288 },
    { a: 9.73476, b: 0.40611, c: 0.22546, d: 13231.7, e: 3629, A: 9.0506, B: -8.4423, C: 5.1288, D: 4.3387 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.b / (lambda2 - row.c) + row.d / (lambda2 - row.e))) +
    1e-5 * (row.A / lambda ** 3 + row.B / lambda2 + row.C / lambda + row.D) * (temperatureKelvin - 293));
}

function computeClbo(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 2.2104, b: 0.01018, c: 0.01424, d: 0.01258, A: -12.48, B: -0.328, C: 0, D: 0 },
    { a: 2.0588, b: 0.00838, c: 0.01363, d: 0.00607, A: -8.36, B: 0.047, C: -0.039, D: 0.014 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.b / (lambda2 - row.c) - row.d * lambda2)) +
    (row.A + row.B / lambda + row.C / lambda2 + row.D / lambda ** 3) * 1e-6 * (temperatureKelvin - 293));
}

function computeCspOld(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 3.72202, b: 5.91985, c: 0.06408, d: 3.92371, e: 2071.59, f: 1.1538, g: -1.1955, h: 0.7263, i: 10.8238 },
    { a: 4.68981, b: 4.77331, c: 0.08006, d: 0.91879, e: 496.71, f: 1.3732, g: -0.6361, h: 0.8303, i: 11.4051 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.a + (row.b * lambda2) / (lambda2 - row.c) + (row.d * lambda2) / (lambda2 - row.e))) +
    (row.f / lambda ** 3 + row.g / lambda2 + row.h / lambda + row.i) * 1e-5 * (temperatureKelvin - 294));
}

function computeCsp(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 11.95 + 5.3479e-4 * temperatureKelvin + 5.5894e-7 * temperatureKelvin ** 2, b: 0.6134 + 9.4768e-5 * temperatureKelvin + 2.0148e-7 * temperatureKelvin ** 2, c: 0.101733, d: 2334.22, e: 833.205 },
    { a: 11.438 + 5.5408e-4 * temperatureKelvin + 5.0458e-7 * temperatureKelvin ** 2, b: 0.61584 + 3.8668e-5 * temperatureKelvin + 2.9901e-7 * temperatureKelvin ** 2, c: 0.11182, d: 2021.26, e: 777.162 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.a + (row.b * lambda2) / (lambda2 - row.c) + row.d / (lambda2 - row.e))));
}

function computeDada(_temperatureKelvin: number, wavelengthNm: number): number[] {
  return sell2(wavelengthNm, [
    { a: 2.413739, b: 1.036935, c: 59.54823056, d: 0.01904, e: 0.00242674464 },
    { a: 2.259082, b: 0.187187, c: 41.57228079, d: 0.016092, e: 0.002630972 }
  ]);
}

function computeDadp(_temperatureKelvin: number, wavelengthNm: number): number[] {
  return sell2(wavelengthNm, [
    { a: 2.279481, b: 1.215879, c: 57.97555433, d: 0.010761, e: 0.013262977 },
    { a: 2.151161, b: 1.199009, c: 126.6005279, d: 0.009652, e: 0.009712103 }
  ]);
}

function computeDcda(temperatureKelvin: number, wavelengthNm: number): number[] {
  const temp = [-2.33e-5, -1.67e-5] as const;
  return sell2(wavelengthNm, [
    { a: 2.40817, b: 2.212173, c: 126.871163, d: 0.015598, e: 0.019101728 },
    { a: 2.345809, b: 0.651843, c: 127.3304614, d: 0.015141, e: 0.016836101 }
  ]).map((n, index) => n + requiredValue(temp[index], `Missing DCDA temp ${index}`) * (temperatureKelvin - 300));
}

function computeDkdp(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const z = (temperature: number, index: 0 | 1): number => {
    const rows = [
      { A: 1.55934 + 3.3935e-4 * temperature, B: 0.71098 - 4.1655e-4 * temperature, C: -0.01407 - 6.4904e-6 * temperature, D: 0.67671 + 4.8281e-5 * temperature },
      { A: 1.68647 + 3.43e-6 * temperature, B: 0.46629 - 6.25e-5 * temperature, C: -0.01663 - 1.3626e-6 * temperature, D: 0.59614 + 2.41e-7 * temperature }
    ] as const;
    const row = rows[index];
    return Math.sqrt(Math.abs(row.A + (row.B * lambda2) / (lambda2 + row.C) + (row.D * lambda2) / (lambda2 - 30)));
  };
  const baseRows = [
    { A: 2.240921, B: 0.009676393, C: 64.01986, D: 0.01770363, E: 0.0007878938 },
    { A: 2.126019, B: 0.0085784088, C: 83.393628, D: 0.006356423, E: 0.0008103504 }
  ] as const;

  return baseRows.map((row, index) => {
    const i = index as 0 | 1;
    const thermal = z(temperatureKelvin, i) - z(306, i);
    return thermal + Math.sqrt(Math.abs(row.A + (row.C * row.B) / (row.C * lambda2 - 1) + (row.D * lambda2) / (row.E * lambda2 - 1)));
  });
}

function computeDlap(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { A: 2.2352, B: 0.0118, C: -0.0146, D: -0.00683, E: -4.2e-5 },
    { A: 2.4313, B: 0.0151, C: -0.0214, D: -0.0143, E: -2.2e-5 },
    { A: 2.4484, B: 0.0172, C: -0.0229, D: -0.0115, E: -7.2e-5 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (row.C + lambda2) + row.D * lambda2)) + row.E * (temperatureKelvin - 298));
}

function computeDrda(_temperatureKelvin: number, wavelengthNm: number): number[] {
  return sell2(wavelengthNm, [
    { a: 2.373255, b: 1.979528, c: 126.9867549, d: 0.01543, e: 0.015836964 },
    { a: 2.270806, b: 0.275372, c: 58.08499107, d: 0.013592, e: 0.01596609 }
  ]);
}

function computeDrdp(_temperatureKelvin: number, wavelengthNm: number): number[] {
  return sell2(wavelengthNm, [
    { a: 2.235596, b: 2.355322, c: 126.8547185, d: 0.010929, e: 0.001414783 },
    { a: 2.152727, b: 0.961253, c: 127.0144778, d: 0.010022, e: 0.001379157 }
  ]);
}

function computeGaas(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const c = 1 / (0.4431307 + 0.000050564 * (temperatureKelvin - 295)) ** 2;
  const d = 0.031764 + 0.0000435 * (temperatureKelvin - 295) + 4.664e-7 * (temperatureKelvin - 295) ** 2;
  const e = 1 / (0.8746453 + 0.0001913 * (temperatureKelvin - 295) - 4.882e-7 * (temperatureKelvin - 295) ** 2) ** 2;
  const g = 1 / (36.9166 - 0.011622 * (temperatureKelvin - 295)) ** 2;
  return [Math.sqrt(Math.abs(5.372514 + 27.83972 / (c - 1 / lambda2) + d / (e - 1 / lambda2) + 1.43636e-3 / (g - 1 / lambda2)))];
}

function computeGap(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const A = 10.926 + 7.0787e-4 * temperatureKelvin + 1.8594e-7 * temperatureKelvin ** 2;
  const B = 0.53718 + 5.8035e-5 * temperatureKelvin + 1.9819e-7 * temperatureKelvin ** 2;
  const D = 1504 + 0.25935 * temperatureKelvin - 0.00023326 * temperatureKelvin ** 2;
  return [Math.sqrt(Math.abs(A + B / (lambda2 - 0.0911014) + D / (lambda2 - 758.048)))];
}

function computeGs(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 10.6409, b: 0.3788, c: 0.1232, d: 7090.7, e: 2216.3, f: 3.8764, g: -4.9338, h: 2.8974, i: 9.1979 },
    { a: 8.2477, b: 0.2881, c: 0.1669, d: 4927.5, e: 1990.1, f: 30.3257, g: -7.4499, h: 3.3385, i: 4.8576 }
  ] as const;

  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.b / (lambda2 - row.c) + row.d / (lambda2 - row.e))) +
    1e-5 * (temperatureKelvin - 293) * (row.f / lambda ** 3 + row.g / lambda2 + row.h / lambda + row.i));
}

function computeKabo(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const n1 = Math.sqrt(Math.abs(2.3765 + 0.01303 / (lambda2 - 0.01852) - 0.01317 * lambda2));
  const n2 = Math.sqrt(Math.abs(2.1752 + 0.0095 / (lambda2 - 0.0153) - 0.00832 * lambda2));
  const t1 = 1e-5 * (temperatureKelvin - 293) * (1.6101 + 0.0361 * lambda);
  const t2 = 1e-5 * (temperatureKelvin - 293) * (1.9905 + (0.0956 + (0.0083 - 0.0015 / lambda) / lambda) / lambda);
  return [n1 + t1, n2 + t2];
}

function computeKbbf(_temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  return [
    Math.sqrt(Math.abs(1 + 1.1713 / (1 - 0.00733 / lambda2) - 0.01022 * lambda2)),
    Math.sqrt(Math.abs(1 + 0.9316 / (1 - 0.00675 / lambda2) - 0.00169 * lambda2))
  ];
}

function computeKbo(_temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { a: 1.99191, b: 0.009253, c: 0.009329 },
    { a: 2.02998, b: 0.009464, c: 0.009188 },
    { a: 2.17908, b: 0.010354, c: 0.008781 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.b / (lambda2 - row.c))));
}

function computeKda(temperatureKelvin: number, wavelengthNm: number): number[] {
  const temp = [-3.95e-5, -2.27e-5] as const;
  return sell2(wavelengthNm, [
    { a: 2.424647, b: 3.742954, c: 126.9036045, d: 0.015841, e: 0.018624061 },
    { a: 2.262579, b: 0.769288, c: 127.0537007, d: 0.013461, e: 0.016165851 }
  ]).map((n, index) => n + requiredValue(temp[index], `Missing KDA temp ${index}`) * (temperatureKelvin - 300));
}

function computeKdp(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { a: 1.44896, b: 3.185e-5, c: 0.84181, d: -1.4114e-4, e: -0.0128, f: -2.134e-7, g: 0.90793, h: 5.75e-7, i: 30 },
    { a: 1.42691, b: -1.152e-5, c: 0.72722, d: -6.139e-5, e: -0.01213, f: -3.104e-7, g: 0.22543, h: -1.98e-7, i: 30 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(
    row.a + row.b * temperatureKelvin +
      ((row.c + row.d * temperatureKelvin) * lambda2) / (lambda2 + row.e + row.f * temperatureKelvin) +
      ((row.g + row.h * temperatureKelvin) * lambda2) / (lambda2 - row.i)
  )));
}

function computeKnbo3(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const deltaT = temperatureKelvin - 300;
  const rows = [
    { a: 4.4222, b: 0.09972, c: 0.05496, d: 0.01976, e: 0, f: 0, A: 0.2541, B: 241.79441, C: 0.96897, D: 0.0035473 },
    { a: 4.8353, b: 0.12808, c: 0.05674, d: 0.02528, e: 1.859e-6, f: 1.0689e-6, A: 0.2846, B: 143.04726, C: 0.38005, D: 0.0014781 },
    { a: 4.9856, b: 0.15266, c: 0.06331, d: 0.02831, e: 2.0754e-6, f: 1.2131e-6, A: 0.3486, B: 11.92604, C: 0.76106, D: -0.00412735 }
  ] as const;

  return rows.map((row) => {
    const n = Math.sqrt(Math.abs(row.a + row.b / (lambda2 - row.c) - row.d * lambda2 + row.e * lambda ** 4 - row.f * lambda ** 6));
    const thermal = (1 / (2e6 * n)) * (lambda2 / (lambda2 - row.A ** 2)) ** 2 * (row.B * deltaT + 0.5 * row.C * deltaT ** 2 + (1 / 3) * row.D * deltaT ** 3);
    return n + thermal;
  });
}

function computeKta2(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const rows = [
    { A: 2.1495, B: 1.0203, C: 0.042378, D: 0.5531, E: 72.3045, F: 1.9951, G: 1.9567, H: 2.05e-5 },
    { A: 2.1308, B: 1.0564, C: 0.042523, D: 0.6927, E: 54.8505, F: 2.0017, G: 1.7261, H: 2.7e-5 },
    { A: 2.1931, B: 1.2382, C: 0.059171, D: 0.5088, E: 53.2898, F: 1.892, G: 2, H: 3.98e-5 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (1 - row.C / lambda ** row.F) + row.D / (1 - row.E / lambda ** row.G))) + row.H * (temperatureKelvin - 298));
}

function computeKta1(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 1.90713, B: 1.23522, C: 0.19692, D: 0.01025, E: 2.05e-5 },
    { A: 2.15912, B: 1.00099, C: 0.21844, D: 0.01096, E: 2.7e-5 },
    { A: 2.14786, B: 1.29559, C: 0.22719, D: 0.01436, E: 3.98e-5 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (1 - (row.C / lambda) ** 2) - row.D * lambda2)) + row.E * (temperatureKelvin - 298));
}

function computeKta3(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 5.55552, B: 0.04703, C: 0.0403, D: 602.9734, E: 249.6806, F: 0.6086e-5, G: -1.2878e-5, H: 0.9073e-5, I: 0.4294e-5 },
    { A: 5.70174, B: 0.04837, C: 0.04706, D: 647.9035, E: 254.7727, F: 0.9568e-5, G: -1.9496e-5, H: 1.3307e-5, I: 0.6421e-5 },
    { A: 6.98362, B: 0.06644, C: 0.05279, D: 920.3789, E: 259.8645, F: 1.5855e-5, G: -4.2712e-5, H: 4.1149e-5, I: 0.7051e-5 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    (row.F / lambda ** 3 + row.G / lambda ** 2 + row.H / lambda + row.I) * (temperatureKelvin - 298));
}

function computeKtpf(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = ktpTempRows([
    [3.0067, 0.0395, 0.04251, 0.01247],
    [3.0319, 0.04152, 0.04586, 0.01337],
    [3.3134, 0.05694, 0.05941, 0.016713]
  ]);
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) - row.D * lambda2)) + ktpThermal(row, lambda, lambda2, temperatureKelvin));
}

function computeKtph(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = ktpTempRows([
    [2.1146, 0.89188, 0.043518, 0.0132],
    [2.1518, 0.87862, 0.047528, 0.01327],
    [2.3136, 1.00012, 0.056792, 0.01679]
  ]);
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (1 - row.C / lambda2) - row.D * lambda2)) + ktpThermal(row, lambda, lambda2, temperatureKelvin));
}

function computeKtpk(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 3.291, B: 0.0414, C: 0.03978, D: 9.35522, E: 31.45571, F: 0.1717, G: -0.5353, H: 0.8416, I: 0.1627, J: 0, K: 0 },
    { A: 3.45018, B: 0.04341, C: 0.04597, D: 16.98825, E: 39.43799, F: 0.1997, G: -0.4063, H: 0.5154, I: 0.5425, J: 0, K: 0 },
    { A: 4.59423, B: 0.06206, C: 0.04763, D: 110.80672, E: 86.12171, F: 0.366, G: 0.009266, H: -2.137, I: 5.353, J: -2.57, K: 0.4693 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    (temperatureKelvin - 293) * (1e-5 * (row.F / lambda ** 3 + row.G / lambda2 + row.H / lambda + row.I + row.J * lambda + row.K * lambda2) - 1.293e-6));
}

function computeLbgo(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 3.2187, B: 0.03194, C: 0.01039, D: -0.00661, a: 0.1859, b: -0.9308, c: 1.6877, d: 0.4327 },
    { A: 3.365, B: 0.0308, C: 0.01946, D: -0.01176, a: 0.1127, b: -0.5543, c: 1.0902, d: 0.2343 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D * lambda2)) +
    (temperatureKelvin - 295) * 1e-5 * (row.a / lambda ** 3 + row.b / lambda2 + row.c / lambda + row.d));
}

function computeLfm(_temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { A: 1.4376, B: 0.4045, C: 0.01692601, D: 0.0005 },
    { A: 1.6586, B: 0.5006, C: 0.023409, D: 0.0127 },
    { A: 1.6714, B: 0.5928, C: 0.02534464, D: 0.0153 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + (row.B * lambda2) / (lambda2 - row.C) - row.D * lambda2)));
}

function computeLgs(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { A: 5.40285, B: 0.1105, C: 0.03238, D: 460.11, E: 422.74, F: 0.5297, G: -1.6259, H: 2.3076, J: 2.8162 },
    { A: 5.62849, B: 0.12052, C: 0.03429, D: 485.31, E: 424.93, F: 1.0422, G: -2.7532, H: 3.3179, J: 3.2336 },
    { A: 5.77851, B: 0.12325, C: 0.03465, D: 580.13, E: 451.62, F: 0.6987, G: -2.0982, H: 2.9039, J: 3.1098 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    1e-5 * (temperatureKelvin - 293) * (row.F / lambda ** 3 + row.G / lambda2 + row.H / lambda + row.J));
}

function computeLiio3(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { A: 3.415716, B: 0.047031, C: 0.035306, D: 0.008801, E: -203.885e-6, F: -131.8e-6, G: 0.13 },
    { A: 2.918692, B: 0.035145, C: 0.028224, D: 0.003641, E: -323.46e-6, F: 53.575e-6, G: 0.19 }
  ] as const;
  return rows.map((row) => {
    const n = Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) - row.D * lambda2));
    const c = lambda2 / (lambda2 - row.G ** 2);
    return n + ((temperatureKelvin - 298) * (row.E * c + row.F * c ** 2)) / (2 * n);
  });
}

function computeLis(temperatureKelvin: number, wavelengthNm: number): number[] {
  return computeTernaryThermal(temperatureKelvin, wavelengthNm, 293, [
    { A: 6.70276, B: 0.13853, C: 0.05712, D: 2164.01, E: 942.06, F: 1.2899, G: -2.7837, H: 2.7327, I: 2.5423 },
    { A: 7.09598, B: 0.1424, C: 0.06514, D: 2511.13, E: 988.03, F: 1.6719, G: -3.5215, H: 3.406, I: 3.0173 },
    { A: 7.55716, B: 0.15063, C: 0.06604, D: 3241.54, E: 1090.62, F: 1.6051, G: -3.404, H: 3.3096, I: 2.9708 }
  ]);
}

function computeLise(temperatureKelvin: number, wavelengthNm: number): number[] {
  return computeTernaryThermal(temperatureKelvin, wavelengthNm, 298, [
    { A: 5.79323, B: 0.21461, C: 0.08391, D: 466.11, E: 617.02, F: 0.7242, G: -0.9339, H: 1.7224, I: 3.9593 },
    { A: 6.01426, B: 0.23387, C: 0.08872, D: 495.14, E: 622.67, F: 1.4136, G: -2.0858, H: 2.443, I: 7.4585 },
    { A: 6.19362, B: 0.23879, C: 0.08957, D: 628.13, E: 664.9, F: 0.9988, G: -1.3402, H: 1.9607, I: 5.3949 }
  ]);
}

function computeLnbc(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { A: 4.9048, B: 2.1429e-8, C: -88506.25, D: 0.11775, E: 2.2314e-8, F: -88506.25, G: 0.21802, H: -2.9671e-8, I: -88506.25, J: -0.027153 },
    { A: 4.582, B: 2.2971e-7, C: -88506.25, D: 0.09921, E: 5.2716e-8, F: -88506.25, G: 0.2109, H: -4.9143e-8, I: -88506.25, J: -0.02194 }
  ] as const;
  const n = rows.map((row) => Math.sqrt(Math.abs(row.A + row.B * (row.C + temperatureKelvin ** 2) + (row.D + row.E * (row.F + temperatureKelvin ** 2)) / (lambda2 - (row.G + row.H * (row.I + temperatureKelvin ** 2)) ** 2) + row.J * lambda2)));
  const dT = temperatureKelvin - 273;
  const k = (dT - 24.5) * (dT + 570.82);
  const thing = Math.sqrt(Math.abs(5.35583 + 4.629e-7 * k + (0.100473 + 3.862e-8 * k) / (lambda2 - (0.20692 - 8.9e-9 * k) ** 2) + (100 + 2.657e-5 * k) / (lambda2 - 11.34927 ** 2) - 1.5334e-2 * lambda2));
  return [thing + requiredValue(n[0], "Missing LNB_C ordinary index") - requiredValue(n[1], "Missing LNB_C extraordinary index"), thing];
}

function computeLnbm(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const a = temperatureKelvin ** 2 - 88506.25;
  const b = 293 ** 2 - 88506.25;
  const g = 2.1429e-8 * a + (0.11228 + 2.2314e-8 * a) / (lambda2 - (0.22262 - 2.9671e-8 * a) ** 2);
  const h = 2.2971e-7 * a + (0.091806 + 5.2716e-8 * a) / (lambda2 - (0.219285 - 4.9143e-8 * a) ** 2);
  const i = 2.1429e-8 * b + (0.11228 + 2.2314e-8 * b) / (lambda2 - (0.22262 - 2.9671e-8 * b) ** 2);
  const j = 2.2971e-7 * b + (0.091806 + 5.2716e-8 * b) / (lambda2 - (0.219285 - 4.9143e-8 * b) ** 2);
  const gh = [g - i, h - j] as const;
  const rows = [
    { A: 1, B: 2.4272, C: 0.01478, D: 1.4617, E: 0.05612, F: 9.6536, G: 371.216 },
    { A: 1, B: 2.2454, C: 0.01242, D: 1.3005, E: 0.05313, F: 6.8972, G: 331.33 }
  ] as const;
  return rows.map((row, index) => Math.sqrt(Math.abs(row.A + (row.B * lambda2) / (lambda2 - row.C) + (row.D * lambda2) / (lambda2 - row.E) + (row.F * lambda2) / (lambda2 - row.G) + requiredValue(gh[index], `Missing LNB_M gh ${index}`))));
}

function computeLnbs(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { a: 4.913, b: 0, c: 0.1173, d: 1.65e-8, e: 0.212, f: 2.7e-8, g: 0.0278 },
    { a: 4.5567, b: 2.605e-7, c: 0.097, d: 2.7e-8, e: 0.201, f: 5.4e-8, g: 0.0224 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.b * temperatureKelvin ** 2 + (row.c + row.d * temperatureKelvin ** 2) / (lambda2 - (row.e + row.f * temperatureKelvin ** 2) ** 2) - row.g * lambda2)));
}

function computeLitam(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const factor = (temperatureKelvin - 297.66) * (temperatureKelvin + 297.66);
  const rows = [
    { a: 4.5082, b: 0.084888, c: 0.19552, d: 1.157, e: 8.2517, f: 0.0237, g: 2.0704e-8, h: 1.4449e-8, i: 1.5978e-8, j: 4.7686e-6, k: 1.1127e-5 },
    { a: 4.5615, b: 0.08488, c: 0.1927, d: 5.5832, e: 8.3067, f: 0.021696, g: 4.782e-7, h: 3.0913e-8, i: 2.7326e-8, j: 1.4837e-5, k: 1.3647e-7 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.g * factor + (row.b + row.h * factor) / (lambda2 - (row.c + row.i * factor) ** 2) + (row.d + row.j * factor) / (lambda2 - (row.e + row.k * factor) ** 2) - lambda2 * row.f)));
}

function computeRbbf(_temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  return [
    Math.sqrt(Math.abs(1 + 1.18675 / (1 - 0.0075 / lambda2) - 0.0091 * lambda2)),
    Math.sqrt(Math.abs(1 + 0.9753 / (1 - 0.00665 / lambda2) - 0.00145 * lambda2))
  ];
}

function computeRda(temperatureKelvin: number, wavelengthNm: number): number[] {
  const temp = [3.37e-5, 2.21e-5] as const;
  return sell2(wavelengthNm, [
    { a: 2.390661, b: 3.487176, c: 126.7648558, d: 0.015513, e: 0.018112315 },
    { a: 2.27557, b: 0.720099, c: 126.6309092, d: 0.013915, e: 0.01459264 }
  ]).map((n, index) => n - requiredValue(temp[index], `Missing RDA temp ${index}`) * (temperatureKelvin - 300));
}

function computeRdp(temperatureKelvin: number, wavelengthNm: number): number[] {
  const temp = [3.74e-5, 2.73e-5] as const;
  return sell2(wavelengthNm, [
    { a: 2.249885, b: 3.688005, c: 127.1998253, d: 0.01056, e: 0.007780475 },
    { a: 2.159913, b: 0.988431, c: 127.692938, d: 0.009515, e: 0.00847799 }
  ]).map((n, index) => n - requiredValue(temp[index], `Missing RDP temp ${index}`) * (temperatureKelvin - 300));
}

function computeRta(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 3.21992, b: 0.04763, c: 0.04063, d: 0, e: 0, f: 0.01035, g: 0.4287e-5, h: -0.9181e-5, i: 0.6685e-5, j: 1.9687e-5 },
    { a: 3.24185, b: 0.05056, c: 0.04532, d: 0, e: 0, f: 0.01062, g: 0.5138e-5, h: -1.1054e-5, i: 0.8035e-5, j: 1.9591e-5 },
    { a: 7.00229, b: 0.06787, c: 0.05241, d: 917.9906, e: 261.3629, f: 0, g: 1.5905e-5, h: -4.2423e-5, i: 4.2161e-5, j: 1.7355e-5 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.b / (lambda2 - row.c) + row.d / (lambda2 - row.e) - row.f * lambda2)) +
    (temperatureKelvin - 293) * (row.g / lambda ** 3 + row.h / lambda2 + row.i / lambda + row.j));
}

function computeRtp(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const dT = temperatureKelvin - 273;
  const baseRows = [
    { a: 4.65575, b: 0.04068, c: 0.0475, d: 204.2586, e: 130.7684, aa: [-58.4301133, 0.8293467, -0.0012434], bb: [6.07288812, -0.01105364, -0.00030399], cc: 0.0475, dd: [0.0235581, 0.00355983, 0.00003605], ee: [-8383.255485, 81.44602698, -0.201565315], ff: 130.7684 },
    { a: 4.76892, b: 0.0449, c: 0.0513, d: 221.3309, e: 134.2832, aa: [-62.4511021, 0.8717407, -0.0055007], bb: [8.91438141, 0.01046736, -0.00007373], cc: 0.0513, dd: [-0.05895352, 0.00317686, 0.00000488], ee: [-9907.07483, 82.428501, -0.67622044], ff: 134.2832 },
    { a: 7.97109, b: 0.06079, c: 0.05968, d: 1234.6913, e: 269.8094, aa: [102.760193, 1.9338609, -0.0084049], bb: [6.30709593, 0.11421781, -0.00057001], cc: 0.05968, dd: [0.85521814, -0.00255447, 0.00002943], ee: [17770.81914, 420.54130735, -2.25182362], ff: 269.8094 }
  ] as const;

  return baseRows.map((row) => {
    const n0 = Math.sqrt(Math.abs(row.a + row.b / (lambda2 - row.c) + row.d / (lambda2 - row.e)));
    const out = [0, 1, 2].map((index) =>
      requiredValue(row.aa[index], `RTP aa ${index}`) +
      requiredValue(row.bb[index], `RTP bb ${index}`) / (lambda2 - row.cc) +
      requiredValue(row.dd[index], `RTP dd ${index}`) / (lambda2 - row.cc) ** 2 +
      requiredValue(row.ee[index], `RTP ee ${index}`) / (lambda2 - row.ff)
    );
    return n0 * Math.exp(1e-6 / (2 * n0 ** 2) * (requiredValue(out[0], "RTP out0") * dT + 0.5 * requiredValue(out[1], "RTP out1") * dT ** 2 + (1 / 3) * requiredValue(out[2], "RTP out2") * dT ** 2));
  });
}

function computeSc4h(_temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  return [
    Math.sqrt(Math.abs(1 + (0.20075 * lambda2) / (lambda2 + 12.07224) + (5.54861 * lambda2) / (lambda2 - 0.02641) + (35.65066 * lambda2) / (lambda2 - 1268.24708))),
    Math.sqrt(Math.abs(6.79485 + 0.15558 / (lambda2 - 0.03535) - 0.02296 * lambda2))
  ];
}

function computeSc6h(_temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  return [
    Math.sqrt(Math.abs(6.57232 + 0.1401 / (lambda2 + 0.03178) - 0.02153 * lambda2)),
    Math.sqrt(Math.abs(6.7452 + 0.15352 / (lambda2 - 0.03597) - 0.02249 * lambda2))
  ];
}

function computeTas(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { a: 10.21, b: 0.444 ** 2, c: 0.522, d: 25 ** 2, e: 4.52e-5 },
    { a: 8.993, b: 0.444 ** 2, c: 0.308, d: 25 ** 2, e: -3.55e-5 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(1 + (row.a * lambda2) / (lambda2 - row.b) + (row.c * lambda2) / (lambda2 - row.d))) - row.e * (temperatureKelvin - 300));
}

function computeYcob(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const rows = [
    { a: 2.6629, b: 0.034508, c: 0.0009115, d: 0.010944, e: 0.000016415, f: 8.2058e-6, g: -5.0188e-6 },
    { a: 2.846, b: 0.038086, c: 0.00098163, d: 0.020364, e: 0.00010088, f: 2.8217e-6, g: 1.9154e-6 },
    { a: 2.9027, b: 0.0423, c: 0.00068559, d: 0.020262, e: 0.00029925, f: 3.031e-6, g: 1.8399e-6 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.a + row.b / lambda2 + row.c / lambda2 ** 2 - row.d * lambda2 - row.e * lambda2 ** 2)) + (row.f + row.g * lambda) * (temperatureKelvin - 293));
}

function computeZgp(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const rows = [
    { a: 8.0409, b: 1.68625, c: 0.40824, d: 1.288, e: 611.05, f: 1.51e-4, g: 1.91e-7 },
    { a: 8.0929, b: 1.8649, c: 0.41468, d: 0.84052, e: 452.05, f: 1.65e-4, g: 1.992e-7 }
  ] as const;
  return rows.map((row) => Math.sqrt(Math.abs(row.a + (row.b * lambda2) / (lambda2 - row.c) + (row.d * lambda2) / (lambda2 - row.e))) + row.f * (temperatureKelvin - 300) + row.g * (temperatureKelvin - 300) ** 2);
}

function computeZnse(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  const coeffs = [
    { a: 4.4795137, b: 9.60711e-5, c: -8.03819e-7, d: 1.31557e-9, e: -1.03854e-12, g: 0.20107634 ** 2 },
    { a: 0.37244243, b: 4.44903e-5, c: 1.4785e-6, d: -2.66133e-9, e: 2.09294e-12, g: 0.3921052 ** 2 },
    { a: 2.8702146, b: 2.14314e-5, c: 1.6644e-8, d: 4.3991e-10, e: -8.36072e-13, g: 47.04759 ** 2 }
  ] as const;
  const n2 = 1 + coeffs.reduce((sum, row) => {
    const f = row.a + row.b * temperatureKelvin + row.c * temperatureKelvin ** 2 + row.d * temperatureKelvin ** 3 + row.e * temperatureKelvin ** 4;
    return sum + (f * lambda2) / (lambda2 - row.g);
  }, 0);
  return [Math.sqrt(Math.abs(n2))];
}

function computeMatlabReferenceError(): number[] {
  throw new Error("MATLAB reference computation errors for this crystal in crystaldb-golden.json");
}

function computeBbo2(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  const firstBand = wavelengthNm > 192.5 && wavelengthNm < 204.8;
  const secondBand = wavelengthNm >= 204.8 && wavelengthNm < 3139.2;
  const low = [
    { a: 3.63357, b: 0.01878, c: 0.01822, d: 60.9129, e: 67.8505 },
    { a: 3.33443, b: 0.01139, c: 0.01865, d: 441.2743, e: 457.6342 }
  ] as const;
  const high = [
    { a: 3.63357, b: 0.01878, c: 0.01822, d: 60.9129, e: 67.8505 },
    { a: 3.33443, b: 0.0126, c: 0.01618, d: 441.2743, e: 457.6342 }
  ] as const;
  const temp = [
    { a: -0.0137, b: 0.0607, c: -0.1334, d: -1.5287 },
    { a: 0.0413, b: -0.2119, c: 0.4408, d: -1.2749 }
  ] as const;

  return low.map((lowCoeff, index) => {
    const highCoeff = requiredValue(high[index], `Missing BBO_2 high-band coefficients for polarization ${index}`);
    const tempCoeff = requiredValue(temp[index], `Missing BBO_2 temperature coefficients for polarization ${index}`);
    const n1 = Math.sqrt(Math.abs(lowCoeff.a + lowCoeff.b / (lambda2 - lowCoeff.c) + lowCoeff.d / (lambda2 - lowCoeff.e)));
    const n2 = Math.sqrt(Math.abs(highCoeff.a + highCoeff.b / (lambda2 - highCoeff.c) + highCoeff.d / (lambda2 - highCoeff.e)));
    const thermal = (temperatureKelvin - 300) * (tempCoeff.a / lambda ** 3 + tempCoeff.b / lambda2 + tempCoeff.c / lambda + tempCoeff.d) * 1e-5;
    return (firstBand ? n1 : 0) + (secondBand ? n2 : 0) + thermal;
  });
}

function computeBbo3(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;

  const coefficients = [
    { a: 1, b: 0.90291, c: 0.003926, d: 0.83155, e: 0.018786, f: 0.76536, g: 60.01, tempA: -0.0137, tempB: 0.0607, tempC: -0.1334, tempD: -1.5287 },
    { a: 1, b: 1.151075, c: 0.007142, d: 0.21803, e: 0.02259, f: 0.656, g: 263.0, tempA: 0.0413, tempB: -0.2119, tempC: 0.4408, tempD: -1.2749 }
  ] as const;

  return coefficients.map((coefficient) => {
    const n2 = Math.abs(
      coefficient.a +
        (coefficient.b * lambda2) / (lambda2 - coefficient.c) +
        (coefficient.d * lambda2) / (lambda2 - coefficient.e) +
        (coefficient.f * lambda2) / (lambda2 - coefficient.g)
    );
    const thermalShift =
      (temperatureKelvin - 293) *
      (coefficient.tempA / lambda ** 3 + coefficient.tempB / lambda2 + coefficient.tempC / lambda + coefficient.tempD) *
      1e-5;
    return Math.sqrt(n2) + thermalShift;
  });
}

function computeLbo(temperatureKelvin: number, wavelengthNm: number): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;

  const coefficients = [
    { a: 2.4542, b: -0.01125, c: 0.01135, d: -0.01388, e: 0, f: 0, g: -3.76, h: 2.3, i: 2.913e-2 },
    { a: 2.539, b: -0.01277, c: 0.01189, d: -0.01849, e: 4.3025e-5, f: -2.9131e-5, g: 6.01, h: -19.4, i: -3.289e-3 },
    { a: 2.5865, b: -0.0131, c: 0.01223, d: -0.01862, e: 4.5778e-5, f: -3.2526e-5, g: 1.5, h: -9.7, i: -7.449e-3 }
  ] as const;
  const deltaT = temperatureKelvin - 293;

  return coefficients.map((coefficient) => {
    const n2 = Math.abs(
      coefficient.a +
        coefficient.b / (coefficient.c - lambda2) +
        coefficient.d * lambda2 +
        coefficient.e * lambda ** 4 +
        coefficient.f * lambda ** 6
    );
    const thermalShift = deltaT * 1e-6 * (coefficient.g * lambda + coefficient.h) * (1 + coefficient.i * deltaT);
    return Math.sqrt(n2) + thermalShift;
  });
}

function isInRange(wavelengthNm: number, rangeNm: CrystalRange): boolean {
  if (rangeNm.length === 0) {
    return true;
  }
  const minNm = Math.min(...rangeNm);
  const maxNm = Math.max(...rangeNm);
  return wavelengthNm > minNm && wavelengthNm < maxNm;
}

function zeros(length: number): number[] {
  return Array.from({ length }, () => 0);
}

function sell2(wavelengthNm: number, rows: readonly { readonly a: number; readonly b: number; readonly c: number; readonly d: number; readonly e: number }[]): number[] {
  const lambda2 = (wavelengthNm * 1e-3) ** 2;
  return rows.map((row) => Math.sqrt(Math.abs(row.a + (row.b * lambda2) / (lambda2 - row.c) + row.d / (lambda2 - row.e))));
}

interface KtpThermalRow {
  readonly A: number;
  readonly B: number;
  readonly C: number;
  readonly D: number;
  readonly E: number;
  readonly F: number;
  readonly G: number;
  readonly H: number;
}

function ktpTempRows(base: readonly (readonly [number, number, number, number])[]): KtpThermalRow[] {
  const thermal = [
    { E: 0.952e-6, F: 8.711e-6, G: -4.735e-6, H: 1.427e-6 },
    { E: -2.113e-6, F: 21.232e-6, G: -14.761e-6, H: 4.269e-6 },
    { E: -12.101e-6, F: 59.129e-6, G: -44.414e-6, H: 12.415e-6 }
  ] as const;
  return base.map(([A, B, C, D], index) => ({
    A,
    B,
    C,
    D,
    ...requiredValue(thermal[index], `Missing KTP thermal row ${index}`)
  }));
}

function ktpThermal(row: KtpThermalRow, lambda: number, lambda2: number, temperatureKelvin: number): number {
  return (row.E + row.F / lambda + row.G / lambda2 + row.H / lambda ** 3) * (temperatureKelvin - 298);
}

function computeTernaryThermal(
  temperatureKelvin: number,
  wavelengthNm: number,
  referenceKelvin: number,
  rows: readonly {
    readonly A: number;
    readonly B: number;
    readonly C: number;
    readonly D: number;
    readonly E: number;
    readonly F: number;
    readonly G: number;
    readonly H: number;
    readonly I: number;
  }[]
): number[] {
  const lambda = wavelengthNm * 1e-3;
  const lambda2 = lambda ** 2;
  return rows.map((row) => Math.sqrt(Math.abs(row.A + row.B / (lambda2 - row.C) + row.D / (lambda2 - row.E))) +
    1e-5 * (temperatureKelvin - referenceKelvin) * (row.F / lambda ** 3 + row.G / lambda2 + row.H / lambda + row.I));
}

function required(value: number | undefined, label: string): number {
  if (value === undefined) {
    throw new Error(label);
  }
  return value;
}

function requiredValue<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(label);
  }
  return value;
}
