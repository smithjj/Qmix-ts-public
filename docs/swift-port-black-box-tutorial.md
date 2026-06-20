# Black-box tutorial: rewriting Qmix and Ref Ind in Swift

This guide is for an agent implementing a Swift rewrite of the MATLAB Qmix/Ref Ind behavior **without reading the MATLAB source algorithms**. Treat MATLAB as an executable oracle: call public entry points, record inputs/outputs, and reproduce the observed behavior in Swift.

Do **not** inspect or transcribe implementation details from files like `QmixEngine.m`, `CrystalDB.m`, `ref_ind.m`, or helper `.m` files. It is fine to call those functions and compare outputs.

## Goal

Implement a Swift package/app that reproduces these MATLAB-facing APIs:

1. **Ref Ind**: refractive-index lookup by crystal, temperature, and wavelength.
2. **Qmix**: nonlinear three-wave phase-matching calculator for principal-plane propagation.

The implementation should be driven by black-box tests generated from MATLAB.

## Environment assumptions

Repository root:

```txt
/Users/jesse/Documents/GitHub/typsescript_qmix
```

MATLAB app locations seen on this machine:

```txt
/Applications/MATLAB_R2024b.app
/Applications/MATLAB_R2025a.app
/Applications/MATLAB_R2026a.app
```

Typical executable:

```txt
/Applications/MATLAB_R2026a.app/bin/matlab
```

When invoking MATLAB from this repository, always put the current repo path at the **front** of MATLAB's path:

```matlab
addpath(pwd, '-begin')
```

This avoids accidentally calling older Qmix files from another MATLAB folder.

## Ways to call MATLAB as an oracle

### Option A: MATLAB command line

From the repository root:

```sh
/Applications/MATLAB_R2026a.app/bin/matlab -batch "addpath(pwd,'-begin'); disp(jsonencode(ref_ind('BBO',300,1064)))"
```

### Option B: MATLAB Core MCP server

If using Pi with the MATLAB Core MCP server, call MATLAB code through:

```js
mcp({
  tool: "matlab_core_evaluate_matlab_code",
  args: JSON.stringify({
    project_path: "/Users/jesse/Documents/GitHub/typsescript_qmix",
    code: "addpath(pwd,'-begin'); disp(jsonencode(ref_ind('BBO',300,1064)))"
  })
})
```

### Option C: temporary MATLAB probe scripts

Create small probe scripts that call public entry points, emit JSON with `jsonencode`, then run with `matlab -batch`. Keep these scripts focused on I/O observation, not source inspection.

## Ref Ind API

### MATLAB call shape

```matlab
n = ref_ind(crystal, temperatureKelvin, wavelengthNm)
[n, rangeNm] = ref_ind(crystal, temperatureKelvin, wavelengthNm)
```

Inputs:

| Parameter | Type | Meaning |
|---|---|---|
| `crystal` | string/char | Short crystal code, e.g. `'BBO'`, `'LBO'`, `'GAAS'` |
| `temperatureKelvin` | number | Crystal temperature in K |
| `wavelengthNm` | number | Vacuum wavelength in nm |

Outputs:

| Output | Type | Meaning |
|---|---|---|
| `n` | scalar or numeric vector | Refractive index/indices |
| `rangeNm` | numeric vector | Nominal wavelength range `[minNm, maxNm]` |

Observed output shapes:

| Crystal kind | Example | `n` shape | Interpretation |
|---|---|---|---|
| Isotropic | `GAAS` | scalar | one refractive index |
| Uniaxial | `BBO` | 1x2 vector | ordinary/extraordinary-style pair |
| Biaxial | `LBO` | 1x3 vector | principal indices `[nx, ny, nz]` |

Out-of-range wavelengths usually return zero-valued index entries, e.g. `[0 0]` or `[0 0 0]`. Treat any zero index as invalid/out of transmission range.

### Ref Ind examples

Run:

```matlab
addpath(pwd,'-begin')
examples = {
  'BBO',  300, 1064;
  'LBO',  300, 1064;
  'GAAS', 300, 1064;
};
for k = 1:size(examples,1)
  crystal = examples{k,1};
  T = examples{k,2};
  lambda = examples{k,3};
  [n, range] = ref_ind(crystal, T, lambda);
  fprintf('%s n=%s range=%s\n', crystal, mat2str(n,16), mat2str(range,16));
end
```

Representative expected values from the current golden fixtures:

```txt
BBO  @ 300 K, 1064 nm -> [1.6542503265005448, 1.5420107726397105], range [188, 5200]
LBO  @ 300 K, 1064 nm -> [1.5647618387743905, 1.5903449958266433, 1.6052903296184884], range [160, 2800]
GAAS @ 300 K, 1064 nm -> 3.4741838728419747, range [969, 17000]
```

### Suggested Swift model

```swift
struct RefractiveIndexQuery {
    var crystal: String
    var temperatureKelvin: Double
    var wavelengthNm: Double
}

enum RefractiveIndexValue: Equatable {
    case isotropic(Double)
    case uniaxial(Double, Double)
    case biaxial(nx: Double, ny: Double, nz: Double)
}

struct RefractiveIndexResult {
    var value: RefractiveIndexValue
    var wavelengthRangeNm: ClosedRange<Double>?
    var isInRange: Bool
}
```

You do not need this exact shape, but your tests should normalize MATLAB scalar/vector output to a comparable Swift value.

## Qmix API

### MATLAB call shape

```matlab
engine = QmixEngine();
results = engine.calculate(inputStruct);
```

The input struct uses legacy GUI field names:

```matlab
input = struct( ...
  'qmix_selected_crystal', 'BBO', ...
  'qmix_temperature', 300, ...
  'qmix_wavelength_red1', 1064, ...
  'qmix_wavelength_red2', 1064, ...
  'qmix_wavelength_blue', 0, ...
  'qmix_principal_plane', 'XY', ...
  'qmix_type', 'Mix');

engine = QmixEngine();
results = engine.calculate(input);
```

Canonical input meaning:

| Canonical name | MATLAB struct field | Type | Meaning |
|---|---|---|---|
| `selectedCrystal` | `qmix_selected_crystal` | string | Crystal code |
| `temperatureKelvin` | `qmix_temperature` | number | Temperature in K |
| `wavelengthRed1Nm` | `qmix_wavelength_red1` | number | Long/red wavelength 1 in nm |
| `wavelengthRed2Nm` | `qmix_wavelength_red2` | number | Long/red wavelength 2 in nm |
| `wavelengthBlueNm` | `qmix_wavelength_blue` | number | Short/blue wavelength in nm |
| `principalPlane` | `qmix_principal_plane` | string | `'XY'`, `'XZ'`, or `'YZ'` |
| `type` | `qmix_type` | string | `'Mix'` or `'OPO'` |

Wavelength convention:

- Exactly one wavelength may be `0`; Qmix computes it from energy conservation.
- For SHG/SFG/Mix, common input is `red1`, `red2`, `blue=0`.
- For OPO, one red wavelength may be `0` while blue/pump is supplied.
- If all wavelengths are non-zero, Qmix expects them to satisfy energy conservation.

Energy conservation relation:

```txt
1 / blue = 1 / red1 + 1 / red2
```

### Qmix result fields

`results` is an array of solution objects. Each solution exposes at least these observed public fields:

| Field | Shape | Meaning |
|---|---|---|
| `wavelengths` | 1x3 | `[red1Nm, red2Nm, blueNm]` after auto-compute |
| `polarizations` | string | Triplet like `'ooe'`, `'eoe'`, `'eeo'` |
| `theta` | scalar | Phase-matching theta in degrees |
| `phi` | scalar | Phase-matching phi in degrees |
| `d_eff` | scalar | Effective nonlinearity in pm/V |
| `walkoff` | 1x3 | Walkoff in mrad for the three waves |
| `phaseVelocityIndex` | 1x3 | Phase-velocity refractive indices |
| `groupVelocityIndex` | 1x3 | Group-velocity indices |
| `gdd` | 1x3 | Group-delay dispersion in fs²/mm |
| `S0L2` | scalar | SNLO-style `S_o * L^2` watt value |
| `angleTolerance` | scalar | Angular tolerance in mrad·cm |
| `temperatureRange` | scalar | Temperature acceptance/range in K·cm |
| `acceptanceAngle` | 1x2 | Acceptance angle values in mrad·cm |
| `acceptanceBW` | 1x2 | Acceptance bandwidth values |

Some branches have `d_eff == 0` but are still valid phase-matching solutions. Preserve them unless the desired UI explicitly filters them.

### Qmix example: BBO 1064 nm SHG

MATLAB probe:

```matlab
addpath(pwd,'-begin')
engine = QmixEngine();
input = struct( ...
  'qmix_selected_crystal', 'BBO', ...
  'qmix_temperature', 300, ...
  'qmix_wavelength_red1', 1064, ...
  'qmix_wavelength_red2', 1064, ...
  'qmix_wavelength_blue', 0, ...
  'qmix_principal_plane', 'XY', ...
  'qmix_type', 'Mix');
results = engine.calculate(input);

out = cell(1, numel(results));
for k = 1:numel(results)
  r = results(k);
  out{k} = struct( ...
    'wavelengthsNm', r.wavelengths, ...
    'polarizations', r.polarizations, ...
    'thetaDeg', r.theta, ...
    'phiDeg', r.phi, ...
    'dEffPmPerV', r.d_eff, ...
    'walkoffMrad', r.walkoff, ...
    'phaseVelocityIndex', r.phaseVelocityIndex, ...
    'groupVelocityIndex', r.groupVelocityIndex, ...
    'gddFs2PerMm', r.gdd, ...
    's0L2Watt', r.S0L2, ...
    'angleToleranceMradCm', r.angleTolerance, ...
    'temperatureRangeKCm', r.temperatureRange, ...
    'acceptanceAngleMradCm', r.acceptanceAngle, ...
    'acceptanceBW', r.acceptanceBW);
end

disp(jsonencode(out))
```

Observed first solution from golden fixtures:

```json
{
  "wavelengthsNm": [1064, 1064, 532],
  "polarizations": "ooe",
  "thetaDeg": 22.836667170440727,
  "phiDeg": 0,
  "dEffPmPerV": 2.011942024498794,
  "walkoffMrad": [0, 0, 55.74197721627937],
  "phaseVelocityIndex": [1.6542503265005448, 1.6542503265005448, 1.654250326500545],
  "groupVelocityIndex": [1.6738448647348743, 1.6738448647348743, 1.6993939846419899],
  "gddFs2PerMm": [41.77047188542901, 41.77047188542901, 128.89912612488138],
  "s0L2Watt": 42539785.55454671,
  "angleToleranceMradCm": 0.5769365242543327,
  "temperatureRangeKCm": 60.87398995277865,
  "acceptanceAngleMradCm": [1.1538730485086657, 1.1538730485086657],
  "acceptanceBW": [39.140291471311805, 39.140291471311805]
}
```

The same case currently has two solutions total.

## Recommended black-box development workflow

### 1. Define Swift public API first

Suggested Swift shapes:

```swift
struct QmixInput {
    var selectedCrystal: String
    var temperatureKelvin: Double
    var wavelengthRed1Nm: Double
    var wavelengthRed2Nm: Double
    var wavelengthBlueNm: Double
    var principalPlane: PrincipalPlane
    var type: MixingType
}

enum PrincipalPlane: String { case xy = "XY", xz = "XZ", yz = "YZ" }
enum MixingType: String { case mix = "Mix", opo = "OPO" }

enum Polarization: Character { case ordinary = "o", extraordinary = "e" }

struct QmixResult {
    var wavelengthsNm: [Double]          // count 3
    var polarizations: String           // count 3, e.g. "ooe"
    var thetaDeg: Double
    var phiDeg: Double
    var dEffPmPerV: Double
    var walkoffMrad: [Double]           // count 3
    var phaseVelocityIndex: [Double]    // count 3
    var groupVelocityIndex: [Double]    // count 3
    var gddFs2PerMm: [Double]           // count 3
    var s0L2Watt: Double
    var angleToleranceMradCm: Double
    var temperatureRangeKCm: Double
    var acceptanceAngleMradCm: [Double] // count 2
    var acceptanceBW: [Double]          // count 2
}
```

### 2. Build a MATLAB oracle harness

Write a black-box generator that takes JSON input cases, calls MATLAB entry points, and writes JSON output. The agent may create new probe scripts but must not inspect MATLAB source algorithms.

For Ref Ind, generate cases over:

- all crystals you support
- several temperatures: 200, 250, 293, 300, 350, 400, 500 K
- wavelengths inside, at, and outside each range

For Qmix, generate representative cases over:

- uniaxial crystals (`BBO`, etc.)
- biaxial crystals (`LBO`, `KTP_F`, etc.)
- isotropic crystals where applicable
- `Mix` and `OPO`
- degenerate SHG, non-degenerate SFG, and OPO
- all principal planes for biaxial crystals: `XY`, `XZ`, `YZ`
- cases with no phase match and cases with zero `d_eff`

### 3. Use the existing JSON fixtures as initial tests

This repository already contains golden fixtures generated from MATLAB:

```txt
fixtures/crystaldb-golden.json
fixtures/qmix-golden.json
fixtures/qmix-comprehensive-golden.json
fixtures/qmix-biaxial-golden.json
fixtures/qmix-full-coverage-golden.json
```

These are safe to use as black-box target data because they are recorded outputs, not algorithms.

### 4. Match numeric behavior incrementally

Suggested order:

1. Energy-conservation wavelength normalization.
2. Ref Ind output shape and range behavior.
3. Ref Ind numerical values for a small crystal set.
4. Qmix result object shape and empty-result behavior.
5. Qmix uniaxial cases.
6. Qmix biaxial principal-plane cases.
7. Derived fields: walkoff, group velocity index, GDD, acceptance values.
8. Full fixture coverage.

### 5. Tolerances

Start strict for direct refractive indices:

```txt
absolute <= 1e-9
relative <= 1e-9
```

Use pragmatic tolerances for ill-conditioned or derived Qmix values:

- Angles: about `1e-6` to `1e-4` degrees depending on solver stability.
- `d_eff`: usually tight when formulas match, but allow looser tolerances while bootstrapping.
- `temperatureRange` and `acceptanceBW`: can be ill-conditioned when denominators are nearly zero; use absolute floors.
- Very large sentinel-like values should be compared semantically, not bit-for-bit.

## Important behavioral notes to discover/verify by black-box tests

- MATLAB uses crystal short codes such as `BBO`, `LBO`, `KTP_F`, `GAAS`.
- Ref Ind output may be a scalar or vector depending on crystal type.
- Zeros in refractive-index output indicate invalid/out-of-range wavelengths.
- Qmix may return multiple branches for one input.
- Qmix may return branches with `d_eff == 0`; keep them.
- For energy conservation, exactly one wavelength may be zero and is auto-computed.
- Biaxial crystals depend on principal plane.
- Formatted display text is not the primary contract; numeric result fields are.

## Minimal Swift test examples

Write tests equivalent to:

```swift
func testBBORefInd1064() throws {
    let result = try engine.refractiveIndex(crystal: "BBO", temperatureKelvin: 300, wavelengthNm: 1064)
    XCTAssertEqual(result.indices[0], 1.6542503265005448, accuracy: 1e-9)
    XCTAssertEqual(result.indices[1], 1.5420107726397105, accuracy: 1e-9)
}

func testLBORefInd1064() throws {
    let result = try engine.refractiveIndex(crystal: "LBO", temperatureKelvin: 300, wavelengthNm: 1064)
    XCTAssertEqual(result.indices[0], 1.5647618387743905, accuracy: 1e-9)
    XCTAssertEqual(result.indices[1], 1.5903449958266433, accuracy: 1e-9)
    XCTAssertEqual(result.indices[2], 1.6052903296184884, accuracy: 1e-9)
}

func testBBOQmixSHG() throws {
    let results = try engine.qmix(.init(
        selectedCrystal: "BBO",
        temperatureKelvin: 300,
        wavelengthRed1Nm: 1064,
        wavelengthRed2Nm: 1064,
        wavelengthBlueNm: 0,
        principalPlane: .xy,
        type: .mix
    ))
    XCTAssertEqual(results.count, 2)
    XCTAssertEqual(results[0].wavelengthsNm[2], 532, accuracy: 1e-9)
    XCTAssertEqual(results[0].polarizations, "ooe")
    XCTAssertEqual(results[0].thetaDeg, 22.836667170440727, accuracy: 1e-6)
    XCTAssertEqual(results[0].dEffPmPerV, 2.011942024498794, accuracy: 1e-6)
}
```

## Agent checklist

- [ ] Do not read MATLAB source algorithms.
- [ ] Use MATLAB only through public entry points (`ref_ind`, `QmixEngine().calculate`).
- [ ] Generate/consume JSON fixtures for repeatable tests.
- [ ] Normalize scalar/vector Ref Ind outputs before comparison.
- [ ] Preserve Qmix branches with zero `d_eff`.
- [ ] Compare numeric fields, not formatted text.
- [ ] Add fixture tests before optimizing or refactoring.
- [ ] Document any observed edge cases as black-box behavior.
