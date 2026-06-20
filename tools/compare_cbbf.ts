import { QmixEngine } from "../dist/index.js";

const engine = new QmixEngine();
const result = engine.calculate({
  selectedCrystal: "CBBF",
  temperatureKelvin: 300,
  wavelengthRed1Nm: 1064,
  wavelengthRed2Nm: 1064,
  wavelengthBlueNm: 0,
  principalPlane: "XY",
  type: "Mix",
});

for (const r of result) {
  if (r.dEffPmPerV === 0) continue;
  console.log(`TS: ${r.polarizations} theta=${r.thetaDeg} phi=${r.phiDeg}`);
  console.log(`  rind: ${r.phaseVelocityIndex.map((x) => x.toFixed(15)).join(" ")}`);
  console.log(`  gvi:  ${r.groupVelocityIndex.map((x) => x.toFixed(15)).join(" ")}`);
  const d1 = Math.abs(r.groupVelocityIndex[0] - r.groupVelocityIndex[2]);
  const d2 = Math.abs(r.groupVelocityIndex[1] - r.groupVelocityIndex[2]);
  console.log(`  gvi_diff: [${d1.toExponential(15)}, ${d2.toExponential(15)}]`);
  console.log(`  acceptanceBW: ${r.acceptanceBW[0]} ${r.acceptanceBW[1]}`);
}
