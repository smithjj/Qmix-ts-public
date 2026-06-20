export { CrystalDB } from "./qmix/crystal-db.js";
export { QmixEngine, registerUniaxialNlData, registerBiaxialNlData, biNl, firstSquaredIndex } from "./qmix/engine.js";
export { formatQmixResult, formatQmixResults } from "./qmix/format.js";
export { computeCanonicalWavelengths, normalizeInput } from "./qmix/wavelengths.js";
export { calculateQpm, listQpmCrystals, getQpmPolarizations, qpmSweep, qpmTempTune, qpmPumpTune } from "./qmix/qpm.js";
export { n12 } from "./qmix/n12.js";

export type { CrystalName, CrystalRange } from "./qmix/crystal-db.js";
export type {
  GoldenFixture,
  GoldenFixtureCase,
  MixingType,
  PolarizationTriplet,
  PrincipalPlane,
  QmixInput,
  QmixResult,
  Vector2,
  Vector3,
  DTensor,
  DTensorRow,
  UniNlEntry,
  BiNlEntry,
  CrystalKind,
  CrystalMetadata,
  CrystalInfo,
  CrystalReferenceCitations,
  CrystalThermalProperties,
  SellmeierDefinition,
  TemperatureCorrectionDefinition
} from "./qmix/types.js";
export type { NormalizedQmixInput } from "./qmix/wavelengths.js";