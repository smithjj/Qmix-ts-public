export declare const BUILT_IN_CRYSTAL_METADATA: Record<string, {
    readonly name: string;
    readonly description: string;
    readonly kind: "isotropic" | "uniaxial" | "biaxial";
    readonly crystalClass: string;
    readonly wavelengthRangeNm: readonly number[];
    readonly referenceCitations?: {
        readonly refractiveIndex?: string;
        readonly thermoOptic?: string;
        readonly dTensor?: string;
        readonly transmission?: string;
    };
    readonly thermalProperties?: {
        readonly conductivityWattPerMeterK?: number | readonly number[];
        readonly expansionCoefficients10Per6K?: readonly number[];
        readonly specificHeatJoulePerKgK?: number;
        readonly densityKgPerM3?: number;
    };
}>;
export type BuiltInCrystalName = keyof typeof BUILT_IN_CRYSTAL_METADATA;
//# sourceMappingURL=crystal-metadata.d.ts.map