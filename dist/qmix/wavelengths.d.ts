import type { QmixInput, Vector3 } from "./types.js";
export interface NormalizedQmixInput extends QmixInput {
    readonly wavelengthsNm: Vector3;
}
export declare function normalizeInput(input: QmixInput): NormalizedQmixInput;
export declare function computeCanonicalWavelengths(input: QmixInput): Vector3;
//# sourceMappingURL=wavelengths.d.ts.map