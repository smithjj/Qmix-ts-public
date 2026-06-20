import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// 1. Bundle the full engine + QPM
console.log("Bundling engine...");
const bundle = await esbuild.build({
  entryPoints: [resolve(rootDir, "src/standalone-entry.ts")],
  bundle: true,
  format: "iife",
  globalName: "QmixEngineBundle",
  minifySyntax: true,
  treeShaking: true,
  write: false,
  platform: "browser",
  target: "es2020",
});
const engineJs = bundle.outputFiles[0].text;

// 2. Read fixture data
const crystalInfo = JSON.parse(readFileSync(resolve(rootDir, "fixtures", "crystal-info-golden.json"), "utf8"));
const transmissionData = JSON.parse(readFileSync(resolve(rootDir, "fixtures", "transmission-golden.json"), "utf8"));

// 3. Build crystal list with types
const crystalNames = Object.keys(crystalInfo).sort();
const crystalTypes = {};
for (const name of crystalNames) {
  const info = crystalInfo[name];
  const desc = (info?.iso_uni_or_bi || "").toLowerCase();
  if (desc.includes("biaxial")) crystalTypes[name] = "biaxial";
  else if (desc.includes("uniaxial")) crystalTypes[name] = "uniaxial";
  else crystalTypes[name] = "unknown";
}

function generateStandalone(name) {
  const templatePath = resolve(rootDir, "public", name + ".html");
  let html = readFileSync(templatePath, "utf8");

  // Rewrite internal links: href="foo.html" -> href="foo.standalone.html"
  html = html.replace(/href="(\w[\w-]*)\.html"/g, 'href="$1.standalone.html"');

  // Inline the shared CSS if linked
  const sharedCssPath = resolve(rootDir, "public", "styles", "qmix-shared.css");
  let sharedCss = "";
  try { sharedCss = readFileSync(sharedCssPath, "utf8"); } catch {}
  if (sharedCss) {
    html = html.replace(
      /<link rel="stylesheet" href="styles\/qmix-shared\.css">/,
      '<style>' + sharedCss.trim() + '</style>'
    );
  }

  const suffixLookup = JSON.stringify(["_1", "_2", "_3", "_F", "_H", "_K", "_C", "_M", "_S"]);

  const shims = `
<script>
const INLINE_CRYSTAL_INFO = ${JSON.stringify(crystalInfo)};
const INLINE_TRANSMISSION = ${JSON.stringify(transmissionData)};
const INLINE_CRYSTAL_NAMES = ${JSON.stringify(crystalNames)};
const INLINE_CRYSTAL_TYPES = ${JSON.stringify(crystalTypes)};
</script>
<script>
${engineJs}
</script>
<script>
function resolveCrystalName(name) {
  const suffixes = ${suffixLookup};
  if (INLINE_CRYSTAL_INFO[name] || INLINE_TRANSMISSION[name]) return name;
  for (const s of suffixes) {
    if (name.endsWith(s)) {
      var base = name.slice(0, -s.length);
      if (INLINE_CRYSTAL_INFO[base] || INLINE_TRANSMISSION[base]) return base;
    }
  }
  return name;
}
async function inlineFetch(url, options) {
  if (url === "/api/crystals") return { json: async () => INLINE_CRYSTAL_NAMES, ok: true };
  if (url === "/api/crystals/detail") return {
    json: async () => INLINE_CRYSTAL_NAMES.map(function(n) { return { name: n, type: INLINE_CRYSTAL_TYPES[n] || "unknown" }; }),
    ok: true
  };
  var infoMatch = url.match(/^\\/api\\/crystal-info\\/(.+)/);
  if (infoMatch) {
    var crystal = infoMatch[1], resolved = resolveCrystalName(crystal);
    if (INLINE_CRYSTAL_INFO[resolved]) return { json: async function() { return INLINE_CRYSTAL_INFO[resolved]; }, ok: true };
    return { json: async function() { return { error: "No info data" }; }, ok: false };
  }
  var transMatch = url.match(/^\\/api\\/transmission\\/(.+)/);
  if (transMatch) {
    var crystal = transMatch[1], resolved = resolveCrystalName(crystal);
    if (INLINE_TRANSMISSION[resolved]) return { json: async function() { return INLINE_TRANSMISSION[resolved]; }, ok: true };
    return { json: async function() { return { error: "No transmission data" }; }, ok: false };
  }
  if (url === "/api/calculate" && options && options.method === "POST") {
    var body = JSON.parse(options.body);
    try {
      var input = {
        selectedCrystal: body.crystal,
        temperatureKelvin: body.temperature || 300,
        wavelengthRed1Nm: body.red1,
        wavelengthRed2Nm: body.red2,
        wavelengthBlueNm: body.blue,
        principalPlane: body.plane || "XY",
        type: body.type || "Mix",
      };
      var engine = new QmixEngineBundle.QmixEngine();
      var results = engine.calculate(input);
      return { json: async function() { return results; }, ok: true };
    } catch(e) { return { json: async function() { return []; }, ok: true }; }
  }
  if (url === "/api/refractive-index" && options && options.method === "POST") {
    var body = JSON.parse(options.body);
    try {
      var crystal = body.crystal, wave = Number(body.wavelength), temp = Number(body.temperature || 300);
      if (!crystal || !Number.isFinite(wave) || wave <= 0) throw new Error("crystal and wavelength required");
      var indices = QmixEngineBundle.CrystalDB.compute(crystal, temp, wave);
      if (indices.length === 0 || indices.some(function(v) { return v === 0; }))
        return { json: async function() { return { error: "Out of range", indices: [] }; }, ok: true };
      var result = { indices: indices, numPolarizations: indices.length };
      if (indices.length === 2) {
        result.no = indices[0]; result.ne = indices[1];
        var thetaRad = Number(body.theta || NaN);
        if (Number.isFinite(thetaRad)) {
          var ct = Math.cos(thetaRad), st = Math.sin(thetaRad);
          result.n_e_theta = 1 / Math.sqrt((ct / indices[0]) ** 2 + (st / indices[1]) ** 2);
          result.n_o_theta = indices[0];
        }
      } else if (indices.length === 3) {
        result.nx = indices[0]; result.ny = indices[1]; result.nz = indices[2];
        var thetaRad = Number(body.theta || NaN), phiRad = Number(body.phi || NaN);
        if (Number.isFinite(thetaRad) && Number.isFinite(phiRad)) {
          var nv = QmixEngineBundle.n12([indices[0], indices[1], indices[2]], thetaRad, phiRad, "Z");
          result.n_hi = nv[0]; result.n_lo = nv[1];
        }
      }
      return { json: async function() { return result; }, ok: true };
    } catch(e) { return { json: async function() { return { error: e.message }; }, ok: false }; }
  }
  if (url === "/api/bmix-calculate" && options && options.method === "POST") {
    return { json: async function() { return { error: "BMix not available in public release" }; }, ok: false };
  }
  if (url === "/api/bmix-dsurf" && options && options.method === "POST") {
    return { json: async function() { return { error: "BMix not available in public release" }; }, ok: false };
  }
  if (url === "/api/qpm-crystals") {
    return { json: async function() { return QmixEngineBundle.listQpmCrystals(); }, ok: true };
  }
  if (url.indexOf("/api/qpm-polarizations") === 0) {
    var crystal = url.split("=").pop();
    return { json: async function() { return QmixEngineBundle.getQpmPolarizations(crystal); }, ok: true };
  }
  if (url === "/api/qpm-sweep" && options && options.method === "POST") {
    var body = JSON.parse(options.body);
    try {
      var results = QmixEngineBundle.qpmSweep(
        String(body.crystal || ""), Number(body.temperature || 300),
        Number(body.pumpNm || 0), Number(body.red1Nm || 0), Number(body.red2Nm || 0),
        Number(body.polIndex || 0)
      );
      return { json: async function() { return results; }, ok: true };
    } catch(e) { return { json: async function() { return { error: e.message }; }, ok: false }; }
  }
  if (url === "/api/qpm-temp-tune" && options && options.method === "POST") {
    var body = JSON.parse(options.body);
    try {
      var results = QmixEngineBundle.qpmTempTune(
        String(body.crystal || ""), Number(body.pumpNm || 0),
        Number(body.red1Nm || 0), Number(body.red2Nm || 0),
        Number(body.periodUm || 0), Number(body.polIndex || 0),
        Number(body.tempMin || 300), Number(body.tempMax || 500), Number(body.tempSteps || 50)
      );
      return { json: async function() { return results; }, ok: true };
    } catch(e) { return { json: async function() { return { error: e.message }; }, ok: false }; }
  }
  if (url === "/api/qpm-pump-tune" && options && options.method === "POST") {
    var body = JSON.parse(options.body);
    try {
      var results = QmixEngineBundle.qpmPumpTune(
        String(body.crystal || ""), Number(body.temperature || 300),
        Number(body.pumpMinNm || 0), Number(body.pumpMaxNm || 0),
        Number(body.red1Nm || 0), Number(body.red2Nm || 0),
        Number(body.periodUm || 0), Number(body.polIndex || 0),
        Number(body.pumpSteps || 50)
      );
      return { json: async function() { return results; }, ok: true };
    } catch(e) { return { json: async function() { return { error: e.message }; }, ok: false }; }
  }
  if (url === "/api/qpm-calculate" && options && options.method === "POST") {
    var body = JSON.parse(options.body);
    try {
      var results = QmixEngineBundle.calculateQpm(
        String(body.crystal || ""), Number(body.temperature || 300),
        Number(body.pumpNm || 0), Number(body.signalNm || 0), Number(body.idlerNm || 0)
      );
      return { json: async function() { return results; }, ok: true };
    } catch(e) { return { json: async function() { return { error: e.message }; }, ok: false }; }
  }
  return { json: async function() { return {}; }, ok: false };
}
window.fetch = inlineFetch;
</script>`;

  html = html.replace("</head>", shims + "\n</head>");

  const outputPath = resolve(rootDir, "public", name + ".standalone.html");
  writeFileSync(outputPath, html);
  const sizeKB = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
  console.log("  " + name + ".standalone.html — " + sizeKB + " KB");
}

console.log("Generating standalone pages...");
generateStandalone("index");
generateStandalone("compare");
generateStandalone("refractive-index");
generateStandalone("qpm");
generateStandalone("custom");
