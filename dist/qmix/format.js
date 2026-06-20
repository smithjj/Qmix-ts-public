export function formatQmixResults(results, mixType) {
    return results.flatMap((result) => formatQmixResult(result, mixType));
}
export function formatQmixResult(result, mixType) {
    if (result.dEffPmPerV === 0) {
        return formatMinimalResult(result);
    }
    const lambda = result.wavelengthsNm;
    const polar = result.polarizations;
    const walkoff = result.walkoffMrad;
    const rind = result.phaseVelocityIndex;
    const gvi = result.groupVelocityIndex;
    const gdd = result.gddFs2PerMm;
    const acptAngle = result.acceptanceAngleMradCm;
    const acptBW = result.acceptanceBW;
    const acptAngle1 = Math.abs(acptAngle[0]) >= 500 ? "********" : fixed(acptAngle[0], 3, 8);
    const acptAngle2 = Math.abs(acptAngle[1]) >= 500 ? "********" : fixed(acptAngle[1], 3, 8);
    const bw1 = Math.abs(acptBW[0]) >= 1e3 ? "********" : fixed(acptBW[0] * 30, 3, 8);
    const bw2 = Math.abs(acptBW[1]) >= 1e3 ? "********" : fixed(acptBW[1] * 30, 3, 8);
    return [
        interactionLine(lambda, polar),
        `Walkoff [mrad]      =  ${fixed(walkoff[0], 4, 8)} ${fixed(walkoff[1], 4, 8)} ${fixed(walkoff[2], 3, 8)}`,
        `Phase velocities    = c/${fixed(rind[0], 4, 8)} ${fixed(rind[1], 4, 8)} ${fixed(rind[2], 4, 8)}`,
        `Group velocities    = c/${fixed(gvi[0], 4, 8)} ${fixed(gvi[1], 4, 8)} ${fixed(gvi[2], 4, 8)}`,
        `GrpDelDisp(fs^2/mm) =  ${fixed(gdd[0], 2, 8)} ${fixed(gdd[1], 2, 8)} ${fixed(gdd[2], 2, 8)}`,
        `At theta,phi        =  ${fixed(result.thetaDeg, 2, 7)} ${fixed(result.phiDeg, 2, 7)} deg.`,
        `d_eff               =  ${exponential(result.dEffPmPerV, 3, 12)}    pm/V`,
        `S_o * L^2           =  ${exponential(result.s0L2Watt, 3, 12)}    watt`,
        `Crystal ang. tol.   =  ${fixed(Math.abs(result.angleToleranceMradCm), 3, 8)}        mrad-cm`,
        temperatureLine(result.temperatureRangeKCm),
        `${mixType} accpt ang   =  ${acptAngle1} ${acptAngle2}  mrad-cm`,
        `${mixType} accpt bw    =  ${bw1} ${bw2}  GHz-cm`,
        " "
    ];
}
function formatMinimalResult(result) {
    return [
        interactionLine(result.wavelengthsNm, result.polarizations),
        `At theta,phi        =  ${fixed(result.thetaDeg, 2, 8)} ${fixed(result.phiDeg, 2, 8)} deg.`,
        `d_eff               =  ${exponential(result.dEffPmPerV, 3, 12)}    pm/V`,
        " "
    ];
}
function interactionLine(lambda, polar) {
    return `    ${fixed(lambda[0], 2, 7)}(${polar[0]}) + ${fixed(lambda[1], 2, 7)}(${polar[1]})  = ${fixed(lambda[2], 2, 7)}(${polar[2]})`;
}
function temperatureLine(value) {
    if (Math.abs(value) > 1000) {
        return "Temperature range   =  ********        K-cm";
    }
    return `Temperature range   =  ${fixed(Math.abs(value), 3, 8)}        K-cm`;
}
function fixed(value, digits, width) {
    const text = Object.is(value, -0)
        ? `-${(0).toFixed(digits)}`
        : value.toFixed(digits);
    return text.padStart(width);
}
function exponential(value, digits, width) {
    const normalized = Object.is(value, -0) ? -0 : value;
    const text = normalized
        .toExponential(digits)
        .replace("e", "E")
        .replace(/E([+-])(\d+)$/, (_match, sign, exponent) => {
        return `E${sign}${exponent.padStart(2, "0")}`;
    });
    return text.padStart(width);
}
//# sourceMappingURL=format.js.map