/** Qmix web server — serves the calculator UI, comparison tool, scan tool, and JSON API.
 *
 * ## Endpoints
 *
 * ### `GET /api/crystals`
 * Returns a JSON array of all crystal names (93 total).
 * ```json
 * ["AAS","ADA","ADP",...,"ZGP","ZNSE","ZZ_B","ZZ_U"]
 * ```
 *
 * ### `GET /api/crystals/detail`
 * Returns each crystal with its type classification.
 * ```json
 * [{"name":"BBO","type":"uniaxial"},{"name":"LBO","type":"biaxial"},...]
 * ```
 *
 * ### `GET /api/crystal-info/:name`
 * Returns detailed metadata for one crystal (description, references, thermal properties,
 * d-tensor, etc.).  Data extracted from `original_snlo_qmix_func.m`.
 *
 * ### `GET /api/transmission/:name`
 * Returns the transmission curve for a crystal.
 * ```json
 * {"wavelengthsNm":[...],"transmission":[...]}
 * ```
 * Variant suffixes are resolved automatically (e.g. `BBO_1` → `BBO`).
 *
 * ### `POST /api/calculate`
 * Run a phase-matching calculation.  Accepts JSON body:
 *
 * | Field         | Type   | Default | Description                                     |
 * |---------------|--------|---------|-------------------------------------------------|
 * | `crystal`     | string | —       | Crystal name (required)                         |
 * | `red1`        | number | —       | Longest wavelength in nm (0 to compute)         |
 * | `red2`        | number | —       | Middle wavelength in nm (0 to compute)          |
 * | `blue`        | number | —       | Shortest wavelength in nm (0 to compute)        |
 * | `temperature` | number | 300     | Crystal temperature in K                        |
 * | `plane`       | string | "XY"    | Principal plane for biaxial crystals            |
 * | `type`        | string | "Mix"   | Mix or OPO                                      |
 * | `customCrystals` | object | —     | Optional: map of custom crystal definitions     |
 *
 * Example:
 * ```json
 * {"crystal":"BBO","red1":1064,"red2":1064,"blue":0}
 * ```
 * Returns a JSON array of results.  On error returns `[]`.
 *
 * ### Static files
 * The server serves the `public/` directory, providing:
 * - `index.html` — main calculator (transmission plot, crystal info, presets)
 * - `compare.html` — multi-crystal comparison table
 * - `custom.html` — custom crystal definition form
 * - `index.standalone.html`, `compare.standalone.html` — no-server versions
 *
 * ## Startup
 * ```sh
 * npm start
 * # or: node dist/server.js
 * # then open http://localhost:3001
 * ```
 *
 * The port can be overridden with the `PORT` environment variable.
 *
 * @module server
 */

import { readFileSync } from "node:fs";
import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { QmixEngine, registerUniaxialNlData } from "./qmix/engine.js";
import { CrystalDB } from "./qmix/crystal-db.js";
import { n12 } from "./qmix/n12.js";
import { calculateQpm, listQpmCrystals, getQpmPolarizations, qpmSweep, qpmTempTune, qpmPumpTune } from "./qmix/qpm.js";
import type { CrystalInfo, QmixInput } from "./qmix/types.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(rootDir, "public");

interface TransmissionCurve {
  readonly wavelengthsNm: readonly number[];
  readonly transmission: readonly number[];
}

let transmissionData: Record<string, TransmissionCurve> = {};

try {
  const fixturePath = resolve(rootDir, "fixtures", "transmission-golden.json");
  transmissionData = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, TransmissionCurve>;
} catch {
  console.warn("Warning: transmission-golden.json not found; transmission endpoint disabled");
}

app.use(express.json());
app.use(express.static(publicDir));

app.get("/api/crystals", (_req, res) => {
  res.json(CrystalDB.list());
});

app.get("/api/crystals/detail", (_req, res) => {
  const all = CrystalDB.list();
  const detail: Array<{ name: string; type: string }> = [];
  for (const name of all) {
    const info = CrystalDB.getCrystalInfo(name);
    detail.push({ name, type: info?.kind ?? "unknown" });
  }
  res.json(detail);
});

const variantSuffixes = ["_1", "_2", "_3", "_F", "_H", "_K", "_C", "_M", "_S"];

function resolveCrystalName(name: string): string {
  if (CrystalDB.hasCrystal(name)) return name;
  for (const suffix of variantSuffixes) {
    if (name.endsWith(suffix)) {
      const base = name.slice(0, -suffix.length);
      if (CrystalDB.hasCrystal(base)) return base;
    }
  }
  return name;
}

function opticalSign(name: string): string {
  try {
    const indices = CrystalDB.compute(name, 300, 1064);
    if (indices.length === 2) {
      return indices[1]! > indices[0]! ? "pos. uniaxial" : "neg. uniaxial";
    }
    return indices.length === 1 ? "isotropic" : "biaxial";
  } catch {
    return "";
  }
}

function toLegacyCrystalInfo(info: CrystalInfo): Record<string, unknown> {
  const kindLabel = info.kind === "uniaxial" ? opticalSign(info.name) : info.kind;
  return {
    crystal_description: info.description,
    iso_uni_or_bi: kindLabel || info.kind,
    crystal_class: info.crystalClass,
    wavelength_range: info.wavelengthRangeNm,
    ref_ind_source: info.referenceCitations?.refractiveIndex,
    thermo_optic_source: info.referenceCitations?.thermoOptic,
    d_source: info.referenceCitations?.dTensor,
    transmission_source: info.referenceCitations?.transmission,
    thermal_conductivity: info.thermalProperties?.conductivityWattPerMeterK,
    thermal_expansion: info.thermalProperties?.expansionCoefficients10Per6K,
    specific_heat: info.thermalProperties?.specificHeatJoulePerKgK,
    density: info.thermalProperties?.densityKgPerM3,
  };
}

app.get("/api/crystal-info/:crystal", (req, res) => {
  const crystal = resolveCrystalName(req.params.crystal);
  const info = CrystalDB.getCrystalInfo(crystal);
  if (!info) {
    res.status(404).json({ error: `No info data for ${req.params.crystal}` });
    return;
  }
  res.json(toLegacyCrystalInfo(info));
});

app.get("/api/transmission/:crystal", (req, res) => {
  const crystal = resolveCrystalName(req.params.crystal);
  const curve = transmissionData[crystal];
  if (!curve) {
    res.status(404).json({ error: `No transmission data for ${req.params.crystal}` });
    return;
  }
  res.json(curve);
});

app.post("/api/calculate", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const input: QmixInput = {
      selectedCrystal: String(body.crystal ?? ""),
      temperatureKelvin: Number(body.temperature ?? 300),
      wavelengthRed1Nm: Number(body.red1 ?? 0),
      wavelengthRed2Nm: Number(body.red2 ?? 0),
      wavelengthBlueNm: Number(body.blue ?? 0),
      principalPlane: (String(body.plane ?? "XY")) as QmixInput["principalPlane"],
      type: (String(body.type ?? "Mix")) as QmixInput["type"],
    };

    const engine = new QmixEngine();

    const customCrystals = body.customCrystals as Record<string, unknown> | undefined;
    if (customCrystals) {
      for (const [name, def] of Object.entries(customCrystals)) {
        const d = def as Record<string, unknown>;
        if (!name || !d) continue;
        try {
          CrystalDB.registerFromJson({ name, ...d } as Record<string, unknown>);
          const nl = d.nlData as Record<string, unknown> | undefined;
          if (nl) {
            registerUniaxialNlData(name, {
              d1Cos: Number(nl.d1Cos ?? 0),
              d1Sin: Number(nl.d1Sin ?? 0),
              d2Cos2: Number(nl.d2Cos2 ?? 0),
              d2Sin2: Number(nl.d2Sin2 ?? 0),
              lambdaRef: Number(nl.lambdaRef ?? 532),
            });
          }
        } catch {
          // already registered, ignore
        }
      }
    }

    const results = engine.calculate(input);
    res.json(results);
  } catch {
    res.json([]);
  }
});

app.post("/api/refractive-index", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const crystal = String(body.crystal ?? "");
    const wavelengthNm = Number(body.wavelength ?? 0);
    const temperatureKelvin = Number(body.temperature ?? 300);
    if (!crystal || !Number.isFinite(wavelengthNm) || wavelengthNm <= 0) {
      res.status(400).json({ error: "crystal and wavelength are required" });
      return;
    }

    const customCrystals = body.customCrystals as Record<string, unknown> | undefined;
    if (customCrystals) {
      for (const [name, def] of Object.entries(customCrystals)) {
        const d = def as Record<string, unknown>;
        if (!name || !d) continue;
        try { CrystalDB.registerFromJson({ name, ...d } as Record<string, unknown>); } catch { /* ignore */ }
      }
    }

    const indices = CrystalDB.compute(crystal, temperatureKelvin, wavelengthNm);
    if (indices.length === 0 || indices.some((v) => v === 0)) {
      res.json({ error: "Wavelength out of transmission range", indices: [] });
      return;
    }

    const result: Record<string, unknown> = { indices, numPolarizations: indices.length };

    if (indices.length === 2) {
      const no = indices[0]!;
      const ne = indices[1]!;
      result.no = no;
      result.ne = ne;
      const thetaRad = Number(body.theta ?? NaN);
      if (Number.isFinite(thetaRad)) {
        const ct = Math.cos(thetaRad), st = Math.sin(thetaRad);
        result.n_e_theta = 1 / Math.sqrt((ct / no) ** 2 + (st / ne) ** 2);
        result.n_o_theta = no;
      }
    } else if (indices.length === 3) {
      let nx = indices[0]!;
      let ny = indices[1]!;
      let nz = indices[2]!;
      const thetaRad = Number(body.theta ?? NaN);
      const phiRad = Number(body.phi ?? NaN);
      if (Number.isFinite(thetaRad) && Number.isFinite(phiRad)) {
        const [nHi, nLo] = n12([nx, ny, nz], thetaRad, phiRad, "Z");
        result.n_hi = nHi;
        result.n_lo = nLo;
      }
      result.nx = nx;
      result.ny = ny;
      result.nz = nz;
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.get("/api/qpm-crystals", (_req, res) => {
  res.json(listQpmCrystals());
});

app.get("/api/qpm-polarizations", (req, res) => {
  const crystal = String(req.query.crystal ?? "");
  res.json(getQpmPolarizations(crystal));
});

app.post("/api/qpm-sweep", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const crystal = String(body.crystal ?? "");
    const temperature = Number(body.temperature ?? 300);
    const pumpNm = Number(body.pumpNm ?? 0);
    const red1Nm = Number(body.red1Nm ?? 0);
    const red2Nm = Number(body.red2Nm ?? 0);
    const polIndex = Number(body.polIndex ?? 0);
    if (!crystal || !pumpNm || !red1Nm || !red2Nm) {
      res.status(400).json({ error: "crystal, pumpNm, red1Nm, red2Nm are required" });
      return;
    }
    const results = qpmSweep(crystal, temperature, pumpNm, red1Nm, red2Nm, polIndex);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/qpm-temp-tune", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const crystal = String(body.crystal ?? "");
    const pumpNm = Number(body.pumpNm ?? 0);
    const red1Nm = Number(body.red1Nm ?? 0);
    const red2Nm = Number(body.red2Nm ?? 0);
    const periodUm = Number(body.periodUm ?? 0);
    const polIndex = Number(body.polIndex ?? 0);
    const tempMin = Number(body.tempMin ?? 300);
    const tempMax = Number(body.tempMax ?? 500);
    const tempSteps = Number(body.tempSteps ?? 50);
    if (!crystal || !pumpNm || !periodUm) {
      res.status(400).json({ error: "crystal, pumpNm, periodUm are required" });
      return;
    }
    const results = qpmTempTune(crystal, pumpNm, red1Nm, red2Nm, periodUm, polIndex, tempMin, tempMax, tempSteps);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/qpm-pump-tune", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const crystal = String(body.crystal ?? "");
    const temperature = Number(body.temperature ?? 300);
    const pumpMinNm = Number(body.pumpMinNm ?? 0);
    const pumpMaxNm = Number(body.pumpMaxNm ?? 0);
    const red1Nm = Number(body.red1Nm ?? 0);
    const red2Nm = Number(body.red2Nm ?? 0);
    const periodUm = Number(body.periodUm ?? 0);
    const polIndex = Number(body.polIndex ?? 0);
    const pumpSteps = Number(body.pumpSteps ?? 50);
    if (!crystal || !pumpMinNm || !pumpMaxNm || !periodUm) {
      res.status(400).json({ error: "crystal, pumpMinNm, pumpMaxNm, periodUm are required" });
      return;
    }
    const results = qpmPumpTune(crystal, temperature, pumpMinNm, pumpMaxNm, red1Nm, red2Nm, periodUm, polIndex, pumpSteps);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/qpm-calculate", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const crystal = String(body.crystal ?? "");
    const temperature = Number(body.temperature ?? 300);
    const pumpNm = Number(body.pumpNm ?? 0);
    const signalNm = Number(body.signalNm ?? 0);
    const idlerNm = Number(body.idlerNm ?? 0);
    if (!crystal || !pumpNm || !signalNm || !idlerNm) {
      res.status(400).json({ error: "crystal, pumpNm, signalNm, and idlerNm are required" });
      return;
    }
    const results = calculateQpm(crystal, temperature, pumpNm, signalNm, idlerNm);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.listen(port, () => {
  console.log(`Qmix web interface at http://localhost:${port}`);
});
