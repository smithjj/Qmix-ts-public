# Qmix CLI User Guide

## Overview

Qmix is a nonlinear-crystal phase-matching engine. Given a crystal, wavelengths,
and temperature, it finds the propagation angles that satisfy energy conservation
and momentum conservation (phase matching) for three-wave mixing processes such as

- **SHG** — second-harmonic generation (ω + ω → 2ω)
- **SFG** — sum-frequency generation (ω₁ + ω₂ → ω₃)
- **OPO** — optical parametric oscillation (ω₃ → ω₁ + ω₂)

For each valid polarization combination (e.g. `ooe`, `eoe`, `oee`, `eeo`, `oeo`,
`eoo`), the engine returns the phase-matching angle, effective nonlinearity
d_eff, walk-off angles, group velocities, temperature acceptance, and more.

## Installation

```bash
# From the project root
npm link
```

After `npm link` the `qmix-ts` command is available globally. Without linking, use:

```bash
node bin\cli.js [options...]
```

To create a distributable tarball (no server push needed):

```bash
npm pack
```

This produces `qmix-typescript-0.1.0.tgz`. Install it anywhere with:

```bash
npm install /path/to/qmix-typescript-0.1.0.tgz
```

## Usage

```
qmix-ts --crystal <name> --red1 <nm> --red2 <nm> --blue <nm> [options]
```

### Required options

All three wavelengths are specified. If they satisfy energy conservation,
the engine accepts them directly. Alternatively, set exactly one to **0**
and it will be computed:

```
    1/λ₃ = 1/λ₁ + 1/λ₂          (set --blue 0 for SFG/SHG)
    1/λ₁ = 1/λ₃ - 1/λ₂          (set --red1 0 for OPO)
    1/λ₂ = 1/λ₃ - 1/λ₁          (set --red2 0 for OPO)
```

| Option     | Description                                              |
|------------|----------------------------------------------------------|
| `--crystal` | Crystal name from `--list-crystals` (case-sensitive)    |
| `--red1`    | Longest interacting wavelength in nm                     |
| `--red2`    | Middle interacting wavelength in nm                      |
| `--blue`    | Shortest interacting wavelength in nm                    |

Exactly one of `--red1`, `--red2`, `--blue` must be **0**, indicating which
wavelength to compute from energy conservation:

```
    1/λ₃ = 1/λ₁ + 1/λ₂          (set --blue 0 for SFG/SHG)
    1/λ₁ = 1/λ₃ - 1/λ₂          (set --red1 0 for OPO)
    1/λ₂ = 1/λ₃ - 1/λ₁          (set --red2 0 for OPO)
```

### Optional options

| Option          | Default | Description                                    |
|-----------------|---------|------------------------------------------------|
| `--temperature` | 300     | Crystal temperature in Kelvin                  |
| `--plane`       | XY      | Principal plane for biaxial crystals: XY/XZ/YZ |
| `--type`        | Mix     | Mix or OPO                                     |

### Output options

| Option    | Description                                             |
|-----------|---------------------------------------------------------|
| `--json`  | Output results as JSON array instead of formatted text  |

### Input options

| Option            | Description                                               |
|-------------------|-----------------------------------------------------------|
| `--input <file>`  | Read configuration from JSON file (use `-` for stdin)     |

### Info and utility flags

| Flag               | Description                  |
|--------------------|------------------------------|
| `--info <crystal>` | Display detailed crystal metadata |
| `--list-crystals`  | List every available crystal |
| `--help`           | Print usage and exit         |

---

## Understanding the output

Each phase-matched polarization combination produces a block of text:

```
    1064.00(o) + 1064.00(o)  =  532.00(e)
    Walkoff [mrad]      =    0.0000   0.0000   55.742
    Phase velocities    = c/  1.6543   1.6543   1.6543
    Group velocities    = c/  1.6738   1.6738   1.6994
    GrpDelDisp(fs^2/mm) =     41.77    41.77   128.90
    At theta,phi        =    22.84    0.00 deg.
    d_eff               =     2.012E+00    pm/V
    S_o * L^2           =     4.254E+07    watt
    Crystal ang. tol.   =     0.577        mrad-cm
    Temperature range   =    60.874        K-cm
    Mix accpt ang   =     1.154    1.154  mrad-cm
    Mix accpt bw    =  1174.209 1174.209  GHz-cm
```

### Line-by-line

| Field | Meaning |
|-------|---------|
| `1064.00(o) + 1064.00(o) = 532.00(e)` | Interacting wavelengths with polarization: (o)rdinary or (e)xtraordinary. Read as "1064 nm o-pol + 1064 nm o-pol → 532 nm e-pol". |
| **Walkoff [mrad]** | Poynting-vector walk-off angle for each wave in milliradians. Non-zero only for extraordinary waves. |
| **Phase velocities** | Refractive index n = c/v_phase for each wave. |
| **Group velocities** | Group index n_g = c/v_group. Used for temporal walk-off calculations. |
| **GrpDelDisp** | Group delay dispersion in fs²/mm. |
| **theta, phi** | Phase-matching direction in degrees. Spherical coordinates relative to the crystal principal axes. |
| **d_eff** | Effective nonlinear coefficient in pm/V. Drives conversion efficiency. |
| **S_o * L²** | Figure of merit: pump intensity × length² needed for unity conversion (watts). Lower is better. |
| **Crystal ang. tol.** | Angular acceptance in mrad·cm. |
| **Temperature range** | Temperature acceptance in K·cm. |
| **Mix/OPO accpt ang** | Acceptance angle for each input wave. `********` means essentially infinite (degenerate OPO or walk-off-free). |
| **Mix/OPO accpt bw** | Acceptance bandwidth in GHz·cm for each input wave. |

---

## Examples

### 1. BBO second-harmonic generation (SHG) — 1064 → 532 nm

```bash
qmix-ts --crystal BBO --red1 1064 --red2 1064 --blue 0
```

```
    1064.00(o) + 1064.00(o)  =  532.00(e)
    Walkoff [mrad]      =    0.0000   0.0000   55.742
    Phase velocities    = c/  1.6543   1.6543   1.6543
    Group velocities    = c/  1.6738   1.6738   1.6994
    GrpDelDisp(fs^2/mm) =     41.77    41.77   128.90
    At theta,phi        =    22.84    0.00 deg.
    d_eff               =     2.012E+00    pm/V
    S_o * L^2           =     4.254E+07    watt
    Crystal ang. tol.   =     0.577        mrad-cm
    Temperature range   =    60.874        K-cm
    Mix accpt ang   =     1.154    1.154  mrad-cm
    Mix accpt bw    =  1174.209 1174.209  GHz-cm

    1064.00(e) + 1064.00(o)  =  532.00(e)
    Walkoff [mrad]      =   65.4923   0.0000   69.048
    Phase velocities    = c/  1.6195   1.6543   1.6369
    Group velocities    = c/  1.6357   1.6738   1.6798
    GrpDelDisp(fs^2/mm) =     41.37    41.77   123.15
    At theta,phi        =    32.45    0.00 deg.
    d_eff               =     1.425E+00    pm/V
    S_o * L^2           =     8.213E+07    watt
    Crystal ang. tol.   =     0.887        mrad-cm
    Temperature range   =    52.416        K-cm
    Mix accpt ang   =    18.477    0.932  mrad-cm
    Mix accpt bw    =   680.675 5029.039  GHz-cm
```

BBO has two valid polarization combinations for degenerate SHG:

- **ooe** (θ = 22.8°) — higher d_eff, lower walk-off in the fundamental
- **eoe**  (θ = 32.4°) — lower d_eff, fundamental has walk-off

### 2. BBO sum-frequency generation — 800 + 1064 → 456 nm

```bash
qmix-ts --crystal BBO --red1 800 --red2 1064 --blue 0
```

Three solutions appear. The non-degenerate SFG also enables the **oee**
polarization, where only wave 1 is ordinary:

```
    1064.00(o) +  800.00(o)  =  456.65(e)     θ = 25.6°  d_eff = 2.016
    1064.00(e) +  800.00(o)  =  456.65(e)     θ = 33.9°  d_eff = 1.403
    1064.00(o) +  800.00(e)  =  456.65(e)     θ = 40.0°  d_eff = 1.160
```

### 3. BBO OPO — 1064 nm signal from 532 nm pump

```bash
qmix-ts --crystal BBO --red1 1064 --red2 0 --blue 532 --type OPO
```

The acceptance statistics change in OPO mode: acceptance is governed by
signal-idler walk-off and group-velocity mismatch rather than signal-pump.

Note the `********` entries — in the ooe OPO case the signal and idler are
identical (degenerate OPO), so their walk-off and GVM vanish, producing
essentially infinite acceptance.

### 4. LBO XY-plane SHG — 1064 → 532 nm

```bash
qmix-ts --crystal LBO --red1 1064 --red2 1064 --blue 0 --plane XY
```

```
    1064.00(o) + 1064.00(o)  =  532.00(e)
    At theta,phi        =    90.00   11.35 deg.
    d_eff               =     8.322E-01    pm/V
    ...
```

LBO is biaxial (point group mm2). In the XY principal plane, θ = 90° is fixed
and φ is the free parameter. Walk-off is small (6.9 mrad) compared to BBO
(55.7 mrad), making LBO attractive for high-power SHG.

### 5. LBO YZ-plane SFG — 1064 + 1550 → 630 nm

```bash
qmix-ts --crystal LBO --red1 1064 --red2 1550 --blue 0 --plane YZ
```

```
    1550.00(e) + 1064.00(o)  =  630.91(o)
    Walkoff [mrad]      =   -9.3339  -0.0000   -0.000
    ...
```

A non-degenerate `eoo` interaction. The e-polarized 1550 nm wave has a
−9.3 mrad walk-off, while the o-polarized waves do not. Negative d_eff
(−0.489 pm/V) is normal — only |d_eff| matters for efficiency.

### 6. LBO XZ-plane SHG — symmetry-forbidden

```bash
qmix-ts --crystal LBO --red1 1064 --red2 1064 --blue 0 --plane XZ
```

```
    1064.00(o) + 1064.00(o)  =  532.00(e)
    At theta,phi        =     32.15     0.00 deg.
    d_eff               =     0.000E+00    pm/V
```

A phase-matching angle exists at θ = 32.15°, but the crystal symmetry (mm2)
makes d_eff = 0 for this XZ-plane ooe interaction. The result is still
reported so the user knows the angle exists but has no nonlinear coupling.

### 7. LBO XY-plane SFG — with zero-coupling branches

```bash
qmix-ts --crystal LBO --red1 800 --red2 1064 --blue 0 --plane XY
```

```
    1064.00(o) +  800.00(o)  =  456.65(e)    φ = 21.2°   d_eff = 0.806

    1064.00(e) +  800.00(o)  =  456.65(e)    φ = 49.3°   d_eff = 0.000   ✗

    1064.00(o) +  800.00(e)  =  456.65(e)    φ = 73.5°   d_eff = 0.000   ✗
```

Non-degenerate SFG opens additional polarization branches, but in LBO the eoe
and oee combinations are symmetry-forbidden in the XY plane.

### 8. LBO YZ-plane SFG — two valid solutions

```bash
qmix-ts --crystal LBO --red1 800 --red2 1064 --blue 0 --plane YZ
```

```
    1064.00(o) +  800.00(e)  =  456.65(o)    θ = 22.1°   d_eff = −0.636
    1064.00(e) +  800.00(o)  =  456.65(o)    θ = 66.3°   d_eff = −0.280
```

The YZ plane offers two distinct phase-matched `oeo` and `eoo` solutions
with different d_eff magnitudes.

### 9. Temperature dependence — BBO at 50°C

```bash
qmix-ts --crystal BBO --red1 1064 --red2 1064 --blue 0 --temperature 323
```

```
    At theta,phi        =    22.85    0.00 deg.     (vs 22.84° at 27°C)
    At theta,phi        =    32.47    0.00 deg.     (vs 32.45° at 27°C)
```

The phase-matching angle shifts slightly with temperature due to the thermal
dispersion (dn/dT). The walk-off and d_eff also change marginally.

---

## Crystal information

```bash
qmix-ts --info BBO
```

Displays detailed metadata for any of the 87 documented crystals:

```
Crystal: BBO
  Description: beta-BaB_2O_4 or beta-borium borate
  Type: neg. uniaxial
  Class: 3m
  Wavelength range: 185 - 2600 nm
  Refractive index source: Tamosauskas, Opt. Mat. Exp. 8, p1410 (2018)
  Thermo-optic source: Kato, SPIE v. 11670 (2021)
  d-tensor source: Eckardt, IEEE JQE v26 p922 (1990).
  Density: 3850 kg/m^3
  Specific heat: 490 J/kg-K
  Thermal conductivity: [1.2,1.6] W/m-K
  Thermal expansion: [0.5,33.3] 1e-6/K
```

The web interface displays the same information below the transmission plot when
a crystal is selected, including d_eff formulas, d-tensor, and all source references.

---

## Crystal library

```bash
qmix-ts --list-crystals
```

76 of 93 crystals are usable for phasematching (47 uniaxial + 29 biaxial).
The remaining 17 either error in the MATLAB reference or require external
data files. A few notable entries:

| Crystal | Type | Range (nm) | Notable for |
|---------|------|------------|-------------|
| BBO | Uniaxial | 188–5200 | High d_eff, UV transparency |
| LBO | Biaxial (mm2) | 160–2800 | High damage threshold, low walk-off |
| KDP | Uniaxial | 200–1600 | Frequency conversion in fusion lasers |
| KTP | Biaxial (mm2) | 350–4500 | Telecom-band OPOs, high d_eff |
| ZGP | Uniaxial | 740–12000 | Mid-IR OPOs |
| AGS | Uniaxial | 700–14000 | Mid-IR SFG |
| BIBO | Biaxial | 285–3100 | Very high d_eff |
| KNbO₃ | Biaxial | 380–5500 | Visible frequency conversion |

---

## Refractive index calculator

Compute principal refractive indices or the index at an arbitrary
propagation direction.

**CLI:**
```bash
# Uniaxial — principal indices
qmix-ts --ri BBO --wavelength 1064

# Uniaxial with propagation angle
qmix-ts --ri BBO --wavelength 532 --theta 22.84

# Biaxial with full direction
qmix-ts --ri LBO --wavelength 1064 --theta 30 --phi 45
```

Output shows nₒ/nₑ for uniaxial, and for biaxial shows n_x, n_y, n_z
plus n_hi/n_lo at the requested direction (using the full Fresnel
quadratic, matching MATLAB's `N12` function).

**Web:** Open `http://localhost:3001/refractive-index.html`.
Select a crystal, enter wavelength, temperature, and optional θ/φ.

**API:** `POST /api/refractive-index` with body:
```json
{"crystal":"LBO","wavelength":1064,"temperature":300,"theta":0.5236,"phi":0.7854}
```
(θ and φ in radians.)

---

## Wavelength scan

The scan page (`http://localhost:3001/scan.html`) sweeps one wavelength
across a range and plots phase-matching properties.

- Set two fixed wavelengths and choose which one to sweep.
- Pick the number of steps and the Y-axis quantity (d_eff, θ, φ,
  temperature range, angular tolerance, SₒL²).
- Results are shown as a Plotly chart with colour-coded polarization
  traces and a sortable data table.
- The "Show d_eff = 0" checkbox filters zero-coupling results.

---

## Custom crystals

DIY crystals can be defined through the web interface or a JSON file.

**Web:** `http://localhost:3001/custom.html`
- Enter Sellmeier coefficients (function 1: n² = A + Bλ²/(λ²−C) + D/(λ²−E))
- Enter temperature correction coefficients (optional)
- Enter nonlinear-optical coefficients (d₁ = A·cosθ + B·sinθ,
  d₂ = C·cos²θ + D·sin2θ)
- Save to localStorage, export/import JSON files

**CLI:**
```bash
qmix-ts --add-crystal my-crystal.json --crystal MyCrystal --red1 1064 --red2 532 --blue 0
```
The JSON format matches the form fields:
```json
{
  "name": "MyCrystal",
  "numPolarizations": 2,
  "rangeNm": [200, 5000],
  "coefficients": [[A,B,C,D,E], [A,B,C,D,E]],
  "temperatureCoefficients": [[a,b,c,d], [a,b,c,d]],
  "nlData": {"d1Cos":0, "d1Sin":0.39, "d2Cos2":0, "d2Sin2":0.39, "lambdaRef":532}
}
```

**API:** Pass `customCrystals` in the `/api/calculate` request body.

---

## Standalone pages (no server needed)

Eight pages bundle the engine and all fixture data into a single HTML
file (~320 KB each). Open directly in a browser — no Express server
required.

- `public/index.standalone.html` — main calculator
- `public/compare.standalone.html` — crystal comparison
- `public/scan.standalone.html` — wavelength scan
- `public/qpm.standalone.html` — QPM calculator
- `public/bmix.standalone.html` — biaxial phase-matching
- `public/bmix-dsurf.standalone.html` — 3D d_eff surface
- `public/refractive-index.standalone.html` — refractive index lookup
- `public/custom.standalone.html` — custom crystal definitions

Rebuild after engine changes:
```bash
node tools/build-standalone.mjs
```

---

## TypeDoc API documentation

```bash
npm run docs       # generate
npm run docs:serve # view at http://localhost:3002
```

Covers `QmixEngine`, `CrystalDB`, all types, CLI flags, server
endpoints, and register functions for custom crystals.  Served via HTTP
(client-side JavaScript renderer).

---

## Batch and JSON usage

### Formatted text output

```bash
qmix-ts --crystal BBO --red1 1064 --red2 1064 --blue 0
```

Each result block is separated by a blank line.

### JSON output (machine-readable)

```bash
qmix-ts --crystal BBO --red1 1064 --red2 1064 --blue 0 --json
```

Returns an array of result objects with all numeric fields.

### JSON input from file

```bash
qmix-ts --input input.json --json
```

Input file format:

```json
{
  "crystal": "LBO",
  "red1": 1064,
  "red2": 1550,
  "blue": 0,
  "temperature": 300,
  "plane": "YZ",
  "type": "Mix"
}
```

### JSON input from stdin (pipe-friendly)

```bash
cat input.json | qmix-ts --input - --json
```

On Windows PowerShell:

```powershell
Get-Content input.json | qmix-ts --input - --json
```

### TypeScript API

For programmatic use, import the API directly:

```typescript
import { QmixEngine, formatQmixResults } from "qmix-ts";

const engine = new QmixEngine();
const results = engine.calculate({
  selectedCrystal: "BBO",
  temperatureKelvin: 300,
  wavelengthRed1Nm: 1064,
  wavelengthRed2Nm: 1064,
  wavelengthBlueNm: 0,
  principalPlane: "XY",
  type: "Mix",
});

const formatted = formatQmixResults(results, "Mix");
for (const line of formatted) console.log(line);
```

---

## Web interface

Start the server and open `http://localhost:3001`:

```bash
npm start
```

Pages:

| Path | Description |
|------|-------------|
| `/` | Main calculator with Plotly transmission plot, crystal info panel, presets |
| `/compare.html` | Multi-crystal comparison table with sort, CSV/JSON export |
| `/scan.html` | Wavelength sweep tool with Plotly chart |
| `/bmix.html` | Biaxial phase-matching (θ–φ sweep, 4-quadrant \|d_eff\| plot) |
| `/bmix-dsurf.html` | 3D directional d_eff surface with overlaid PM curves |
| `/qpm.html` | Quasi-phase-matching calculator (sweep, temp tune, pump tune) |
| `/custom.html` | Custom crystal definition form |
| `/refractive-index.html` | Refractive index lookup at any angle |

The comparison tool loops through selected crystals × applicable planes,
compiling results into a sortable table with hide-zero-d_eff filter.  The
scan tool sweeps one wavelength across a range and plots any
phase-matching quantity.  Custom crystals defined in the web UI are saved
to localStorage and can be exported as JSON.

---

## Error handling

| Scenario | Behaviour |
|----------|-----------|
| Missing required option | Prints error + usage, exits with code 1 |
| Non-numeric wavelength | Prints error, exits with code 1 |
| Invalid plane/type | Prints error, exits with code 1 |
| Wavelength out of range | Prints "Wavelength out of transmission range" |
| Crystal not supported for PM | Prints "{crystal} is not implemented yet" |
| No zero wavelength | "Exactly one wavelength must be zero" |
| All three non-zero, consistent | Accepted (energy conservation verified) |
| All three non-zero, inconsistent | "Wavelengths do not satisfy energy conservation" |
| Crystal not found for --info | "No information available for ..." |
| Unknown crystal name | "Unknown crystal: ..." |
| JSON input parse error | Error message with parse details |
| Custom crystal name conflict | "Crystal ... is already registered" |
