export declare function listQpmCrystals(): string[];
export declare function getQpmPolarizations(crystal: string): readonly string[];
export interface QpmResult {
    readonly polarization: string;
    readonly periodUm: number;
    readonly dEffPmPerV: number;
}
export declare function calculateQpm(crystal: string, temperatureKelvin: number, pumpNm: number, signalNm: number, idlerNm: number): QpmResult[];
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
export declare function qpmSweep(crystal: string, temperatureKelvin: number, pumpNm: number, red1Nm: number, red2Nm: number, polIndex: number): QpmSweepRow[];
export interface QpmTuningRow {
    readonly param: number;
    readonly signalNm: number;
    readonly idlerNm: number;
    readonly periodUm: number;
}
/** Temperature tuning: sweep temperature at a fixed period using root-finding. */
export declare function qpmTempTune(crystal: string, pumpNm: number, red1Nm: number, red2Nm: number, periodUm: number, polIndex: number, tempMin: number, tempMax: number, tempSteps: number): QpmTuningRow[];
/** Pump tuning: sweep pump wavelength at a fixed period and temperature using root-finding. */
export declare function qpmPumpTune(crystal: string, temperatureKelvin: number, pumpMinNm: number, pumpMaxNm: number, red1Nm: number, red2Nm: number, periodUm: number, polIndex: number, pumpSteps: number): QpmTuningRow[];
//# sourceMappingURL=qpm.d.ts.map