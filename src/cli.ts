/**
 * Command-line interface for the Qmix phase-matching engine.
 *
 * ## Basic usage
 * ```
 * qmix-ts --crystal BBO --red1 1064 --red2 1064 --blue 0
 * ```
 * Exactly one of `--red1`, `--red2`, `--blue` may be **0**, indicating
 * which wavelength to compute from energy conservation:
 * - `--blue 0`: 1/λ₃ = 1/λ₁ + 1/λ₂ (SFG/SHG)
 * - `--red1 0`: 1/λ₁ = 1/λ₃ − 1/λ₂ (OPO)
 * - `--red2 0`: 1/λ₂ = 1/λ₃ − 1/λ₁ (OPO)
 *
 * If all three are non-zero the engine verifies they satisfy energy conservation
 * and proceeds (no need to guess which one to zero).
 *
 * ## JSON mode
 * ```
 * qmix-ts --crystal BBO --red1 1064 --red2 1064 --blue 0 --json
 * ```
 * Outputs the results as a JSON array instead of formatted text.
 *
 * ## JSON input from a file or pipe
 * ```
 * qmix-ts --input input.json --json
 * echo '{"crystal":"LBO","red1":1064,"red2":1550,"blue":0,"plane":"YZ"}' | qmix-ts --input - --json
 * ```
 *
 * ## Crystal information
 * ```
 * qmix-ts --info BBO
 * ```
 * Prints metadata: description, crystal class, Sellmeier references,
 * d-tensor values, thermal properties, density.
 *
 * ## Custom crystals
 * ```
 * qmix-ts --add-crystal my-crystal.json --crystal MyCrystal --red1 1064 --red2 532 --blue 0
 * ```
 * Registers one or more DIY crystals from a JSON definition, then immediately
 * calculates with them.  See {@link CrystalDB.registerFromJson} for the JSON format.
 *
 * ## Example output
 * ```
 *     1064.00(o) + 1064.00(o)  =  532.00(e)
 *     Walkoff [mrad]      =    0.0000   0.0000   55.742
 *     Phase velocities    = c/  1.6543   1.6543   1.6543
 *     Group velocities    = c/  1.6738   1.6738   1.6994
 *     GrpDelDisp(fs^2/mm) =     41.77    41.77   128.90
 *     At theta,phi        =    22.84    0.00 deg.
 *     d_eff               =     2.012E+00    pm/V
 *     S_o * L^2           =     4.254E+07    watt
 *     Crystal ang. tol.   =     0.577        mrad-cm
 *     Temperature range   =    60.874        K-cm
 *     Mix accpt ang   =     1.154    1.154  mrad-cm
 *     Mix accpt bw    =  1174.209 1174.209  GHz-cm
 * ```
 *
 * | Field               | Meaning                                               |
 * |---------------------|-------------------------------------------------------|
 * | `Walkoff [mrad]`    | Poynting-vector walk-off angle for each wave (mrad).  |
 * | `Phase velocities`  | Refractive index n = c/v_phase per wave.              |
 * | `Group velocities`  | Group index n_g = c/v_group.                          |
 * | `GrpDelDisp`        | Group-delay dispersion (fs²/mm).                      |
 * | `At theta,phi`      | Phase-matching direction (degrees).                   |
 * | `d_eff`             | Effective nonlinear coefficient (pm/V).               |
 * | `S_o * L²`          | Figure of merit: pump power × length² for unity gain. |
 * | `Crystal ang. tol.` | Angular acceptance (mrad·cm).                          |
 * | `Temperature range` | Temperature acceptance (K·cm).                         |
 * | `Mix/OPO accpt ang`  | Acceptance angle for each input wave.                 |
 * | `Mix/OPO accpt bw`   | Acceptance bandwidth (GHz·cm).                        |
 *
 * @module cli
 */

import { readFileSync } from "node:fs";
import { QmixEngine } from "./qmix/engine.js";
import { registerUniaxialNlData } from "./qmix/engine.js";
import { formatQmixResults } from "./qmix/format.js";
import { CrystalDB } from "./qmix/crystal-db.js";
import type { MixingType, PrincipalPlane, QmixInput, QmixResult } from "./qmix/types.js";

const USAGE = `Usage: qmix [options]

Options (CLI mode):
  --crystal <name>       Crystal name (required)
  --red1 <nm>            First red wavelength in nm (required)
  --red2 <nm>            Second red wavelength in nm (required)
  --blue <nm>            Blue wavelength in nm (required)
  --temperature <K>      Temperature in Kelvin (default: 300)
  --plane <XY|XZ|YZ>     Principal plane (default: XY)
  --type <Mix|OPO>       Mixing type (default: Mix)

Options (JSON mode):
  --input <file>         Read input from JSON file (use "-" for stdin)
  --json                 Output results as JSON

Options (info mode):
  --info <crystal>       Display detailed crystal information

Options (refractive-index mode):
  --ri <crystal>         Compute refractive index (use --wavelength, --temperature, --theta, --phi)
  --wavelength <nm>      Wavelength in nm (required with --ri)
  --theta <deg>          Polar angle in degrees (optional)
  --phi <deg>            Azimuthal angle in degrees (optional, biaxial only)

Options (custom crystal mode):
  --add-crystal <file>   Register custom crystal(s) from JSON (compatible with --crystal)

Utility:
  --list-crystals        List all available crystal names
  --tui                  Start the interactive text user interface (TUI)
  --help                 Show this message`;

/** Schema for a Qmix calculation read from a JSON file or stdin.
 * Matches the CLI flags:
 * - `crystal` → `--crystal`
 * - `red1` → `--red1`
 * - `red2` → `--red2`
 * - `blue` → `--blue`
 * - `temperature` → `--temperature` (default 300)
 * - `plane` → `--plane` (default "XY")
 * - `type` → `--type` (default "Mix")
 */
export interface JsonInput {
  crystal: string;
  red1: number;
  red2: number;
  blue: number;
  temperature?: number;
  plane?: string;
  type?: string;
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv;
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "json" || key === "list-crystals" || key === "help" || key === "tui") {
      args[key] = "true";
    } else {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        console.error(`Error: --${key} requires a value`);
        process.exit(1);
      }
      args[key] = value;
    }
  }
  return args;
}

function readJsonInput(path: string): Promise<JsonInput> {
  if (path === "-") {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
      process.stdin.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as JsonInput);
        } catch (err) {
          reject(err);
        }
      });
      process.stdin.on("error", reject);
      process.stdin.resume();
    });
  }
  try {
    const text = readFileSync(path, "utf8");
    return Promise.resolve(JSON.parse(text) as JsonInput);
  } catch (err) {
    return Promise.reject(err);
  }
}

function buildInput(args: Record<string, string>): QmixInput {
  const crystal = args.crystal;
  const red1 = args.red1;
  const red2 = args.red2;
  const blue = args.blue;

  if (!crystal || !red1 || !red2 || !blue) {
    console.error("Error: --crystal, --red1, --red2, and --blue are required");
    console.error(USAGE);
    process.exit(1);
  }

  const red1Nm = Number.parseFloat(red1);
  const red2Nm = Number.parseFloat(red2);
  const blueNm = Number.parseFloat(blue);

  if (!Number.isFinite(red1Nm) || !Number.isFinite(red2Nm) || !Number.isFinite(blueNm)) {
    console.error("Error: wavelength values must be numbers");
    process.exit(1);
  }

  const temperature = args.temperature !== undefined ? Number.parseFloat(args.temperature) : 300;
  if (!Number.isFinite(temperature)) {
    console.error("Error: --temperature must be a number");
    process.exit(1);
  }

  const plane = (args.plane ?? "XY") as PrincipalPlane;
  if (plane !== "XY" && plane !== "XZ" && plane !== "YZ") {
    console.error('Error: --plane must be one of XY, XZ, YZ');
    process.exit(1);
  }

  const type = (args.type ?? "Mix") as MixingType;
  if (type !== "Mix" && type !== "OPO") {
    console.error('Error: --type must be one of Mix, OPO');
    process.exit(1);
  }

  return {
    selectedCrystal: crystal,
    temperatureKelvin: temperature,
    wavelengthRed1Nm: red1Nm,
    wavelengthRed2Nm: red2Nm,
    wavelengthBlueNm: blueNm,
    principalPlane: plane,
    type,
  };
}

function buildJsonInput(json: JsonInput): QmixInput {
  const plane = (json.plane ?? "XY") as PrincipalPlane;
  if (plane !== "XY" && plane !== "XZ" && plane !== "YZ") {
    console.error('Error: plane must be one of XY, XZ, YZ');
    process.exit(1);
  }

  const type = (json.type ?? "Mix") as MixingType;
  if (type !== "Mix" && type !== "OPO") {
    console.error('Error: type must be one of Mix, OPO');
    process.exit(1);
  }

  return {
    selectedCrystal: json.crystal,
    temperatureKelvin: json.temperature ?? 300,
    wavelengthRed1Nm: json.red1,
    wavelengthRed2Nm: json.red2,
    wavelengthBlueNm: json.blue,
    principalPlane: plane,
    type,
  };
}

/** Command-line entry point for the Qmix phase-matching calculator.
 *
 * Usage: qmix-ts --crystal BBO --red1 1064 --red2 1064 --blue 0
 *
 * Full documentation: https://github.com/anomalyco/opencode (or see docs/user-guide.md)
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (args.tui !== undefined || (Object.keys(args).length === 0 && process.stdout.isTTY)) {
    const { startTui } = await import("./tui.js");
    startTui();
    return;
  }

  if (args.help !== undefined) {
    console.log(USAGE);
    process.exit(0);
  }

  if (args["list-crystals"] !== undefined) {
    const crystals = CrystalDB.list();
    for (const name of crystals) console.log(name);
    process.exit(0);
  }

  if (args["add-crystal"] !== undefined) {
    const filePath = args["add-crystal"];
    const text = readFileSync(filePath, "utf8");
    const data = JSON.parse(text) as Record<string, unknown>;
    if (data.name) {
      CrystalDB.registerFromJson(data as Record<string, unknown>);
      const nl = data.nlData as Record<string, unknown> | undefined;
      if (nl) {
        registerUniaxialNlData(String(data.name), {
          d1Cos: Number(nl.d1Cos ?? 0),
          d1Sin: Number(nl.d1Sin ?? 0),
          d2Cos2: Number(nl.d2Cos2 ?? 0),
          d2Sin2: Number(nl.d2Sin2 ?? 0),
          lambdaRef: Number(nl.lambdaRef ?? 532),
        });
      }
      console.log(`Registered custom crystal: ${data.name}`);
    } else {
      for (const [name, def] of Object.entries(data)) {
        const d = def as Record<string, unknown>;
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
        console.log(`Registered custom crystal: ${name}`);
      }
    }
    // Fall through to main calculation if --crystal was also provided
  }

  if (args.ri !== undefined || args["refractive-index"] !== undefined) {
    const crystal = args.ri || args["refractive-index"];
    if (!crystal) {
      console.error("Error: --ri <crystal> is required");
      process.exit(1);
    }
    const wavelengthNm = Number.parseFloat(args.wavelength ?? "0");
    if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) {
      console.error("Error: --wavelength <nm> is required");
      process.exit(1);
    }
    const temperature = args.temperature !== undefined ? Number.parseFloat(args.temperature) : 300;
    const theta = args.theta !== undefined ? Number.parseFloat(args.theta) * Math.PI / 180 : undefined;
    const phi = args.phi !== undefined ? Number.parseFloat(args.phi) * Math.PI / 180 : undefined;

    try {
      const indices = CrystalDB.compute(crystal, temperature, wavelengthNm);
      if (indices.length === 0 || indices.some((v) => v === 0)) {
        console.log("Wavelength out of transmission range");
        process.exit(0);
      }
      if (indices.length === 2) {
        const no = indices[0]!;
        const ne = indices[1]!;
        console.log(`n_o = ${no.toFixed(6)}`);
        console.log(`n_e = ${ne.toFixed(6)}`);
        if (theta !== undefined) {
          const cos = Math.cos(theta);
          const sin = Math.sin(theta);
          const nTheta = 1 / Math.sqrt((cos / no) ** 2 + (sin / ne) ** 2);
          console.log(`n(${(theta * 180 / Math.PI).toFixed(2)}°) = ${nTheta.toFixed(6)}`);
        }
      } else if (indices.length === 3) {
        const nx = indices[0]!;
        const ny = indices[1]!;
        const nz = indices[2]!;
        console.log(`n_x = ${nx.toFixed(6)}`);
        console.log(`n_y = ${ny.toFixed(6)}`);
        console.log(`n_z = ${nz.toFixed(6)}`);
        if (theta !== undefined && phi !== undefined) {
          // Full biaxial Fresnel equation (N12 algorithm)
          const x = 1 / (nx * nx);
          const y = 1 / (ny * ny);
          const z = 1 / (nz * nz);
          const st = Math.sin(theta), ct = Math.cos(theta);
          const sp = Math.sin(phi), cp = Math.cos(phi);
          const a = st * st, b = cp * cp, c = sp * sp, d = ct * ct;
          const bo = -(a * b * (y + z) + a * c * (x + z) + d * (x + y));
          const co = a * b * y * z + a * c * x * z + d * x * y;
          const disc = bo * bo - 4 * co; // ao = 1
          if (disc >= 0) {
            const nSqHi = (-bo + Math.sqrt(disc)) / 2;
            const nSqLo = -(nSqHi + bo);
            const nHi = 1 / Math.sqrt(nSqHi);
            const nLo = 1 / Math.sqrt(nSqLo);
            console.log(`n_hi(${(theta * 180 / Math.PI).toFixed(2)}°, ${(phi * 180 / Math.PI).toFixed(2)}°) = ${Math.max(nLo, nHi).toFixed(6)}`);
            console.log(`n_lo(${(theta * 180 / Math.PI).toFixed(2)}°, ${(phi * 180 / Math.PI).toFixed(2)}°) = ${Math.min(nLo, nHi).toFixed(6)}`);
          }
        }
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (args.info !== undefined) {
    const crystal = args.info;
    const fixturePath = new URL("../fixtures/crystal-info-golden.json", import.meta.url);
    const data = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, Record<string, unknown>>;
    const info = data[crystal];
    if (!info) {
      console.error(`Error: No information available for "${crystal}"`);
      process.exit(1);
    }
    console.log(`Crystal: ${crystal}`);
    if (info.crystal_description) console.log(`  Description: ${info.crystal_description}`);
    if (info.iso_uni_or_bi) console.log(`  Type: ${info.iso_uni_or_bi}`);
    if (info.crystal_class) console.log(`  Class: ${info.crystal_class}`);
    if (info.wavelength_range) console.log(`  Wavelength range: ${(info.wavelength_range as number[]).join(" - ")} nm`);
    if (info.ref_ind_source) console.log(`  Refractive index source: ${info.ref_ind_source}`);
    if (info.thermo_optic_source) console.log(`  Thermo-optic source: ${info.thermo_optic_source}`);
    if (info.d_source) console.log(`  d-tensor source: ${info.d_source}`);
    if (info.density) console.log(`  Density: ${info.density} kg/m^3`);
    if (info.specific_heat) console.log(`  Specific heat: ${info.specific_heat} J/kg-K`);
    if (info.thermal_conductivity) console.log(`  Thermal conductivity: ${JSON.stringify(info.thermal_conductivity)} W/m-K`);
    if (info.thermal_expansion) console.log(`  Thermal expansion: ${JSON.stringify(info.thermal_expansion)} 1e-6/K`);
    process.exit(0);
  }

  const useJson = args.json !== undefined;
  let input: QmixInput;

  try {
    if (args.input !== undefined) {
      const json = await readJsonInput(args.input);
      input = buildJsonInput(json);
    } else {
      input = buildInput(args);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (useJson) {
      console.log(JSON.stringify({ error: message }));
    } else {
      console.error(`Error: ${message}`);
    }
    process.exit(1);
    return;
  }

  try {
    const engine = new QmixEngine();
    const results = engine.calculate(input);

    if (useJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      const lines = formatQmixResults(results, input.type);
      for (const line of lines) {
        console.log(line);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (useJson) {
      console.log(JSON.stringify({ error: message }));
    } else {
      console.error(`Error: ${message}`);
    }
    process.exit(1);
  }
}

main();
