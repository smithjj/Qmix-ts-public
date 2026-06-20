# Qmix TypeScript

TypeScript port of the Qmix nonlinear crystal phase-matching engine.

This is free software, licensed under the GNU General Public License v3.0 (GPL-3.0).
See [LICENSE](LICENSE) for the full license text.

Reference behavior is captured in golden fixture JSON files.

## Test Coverage

| Fixture | Generator | Test file | Coverage |
|---|---|---|---|
| `crystaldb-golden.json` | `generate_crystaldb_golden.m` | `test/crystaldb-golden.test.ts` | All 93 crystals, 7 temps, 20,916 refractive-index data points |
| `qmix-golden.json` | `generate_qmix_golden.m` | `test/qmix-golden.test.ts` | Core phasematching: BBO + LBO, SHG/SFG/OPO, all polarization branches |
| `qmix-comprehensive-golden.json` | `generate_qmix_comprehensive_fixture.m` | `test/qmix-comprehensive.test.ts` | 15 uniaxial crystals, mid-IR, temperature variation |
| `qmix-biaxial-golden.json` | `generate_qmix_biaxial_fixture.m` | `test/qmix-biaxial.test.ts` | 8 biaxial crystals, all 3 principal planes |
| `qmix-full-coverage-golden.json` | `generate_qmix_full_coverage.m` | `test/qmix-full-coverage.test.ts` | **Every crystal in CrystalDB.ts** (~90 crystals, all planes) |
| `qpm-golden.json` | `generate_qpm_golden.m` | `test/qpm-golden.test.ts` | All 19 QPM crystals, grating period & d_eff (1e-6 tol) |

**332 tests, all passing.**

## Terminal UI (TUI)

The project includes an OpenTUI-based terminal interface for interactive calculations.

### Requirements

The TUI uses OpenTUI's native renderer. Run it with [Bun](https://bun.sh/) (tested with Bun 1.3.x):

```sh
bun --version
```

### Launch

Build first, then start the TUI:

```sh
npm run build
npm run tui
```

`npm run tui` runs:

```sh
bun dist/cli.js --tui
```

You can also launch directly after building:

```sh
bun dist/cli.js --tui
```

### Controls

| Key | Action |
|---|---|
| `F1` | Switch to Ref. Index screen |
| `F2` | Switch to Qmix screen |
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Up` / `Down` or `j` / `k` | Move through a focused selector list |
| `Shift+Up` / `Shift+Down` | Fast scroll a selector list |
| `Enter` | Calculate on the current screen |
| `Ctrl+C` | Exit |

### Ref. Index screen

Use this screen to calculate refractive indices for a crystal at a given temperature and wavelength.

Fields:

- Crystal search + filtered selector
- Temperature in K
- Wavelength in nm
- Optional `θ` angle in degrees
- Optional `φ` angle in degrees for biaxial crystals

The output panel displays ordinary/extraordinary indices for uniaxial crystals, principal indices for biaxial crystals, and angle-dependent values when angles are supplied.

### Qmix screen

Use this screen for phase-matching calculations.

Fields:

- Crystal search + filtered selector
- Temperature in K
- Principal plane (`XY`, `XZ`, `YZ`)
- Mixing type (`Mix`, `OPO`)
- Red1, Red2, and Blue wavelengths in nm (`0` means auto-compute via energy conservation)

The crystal selector filters by short code, full crystal description, and d_eff formula text. When the highlighted crystal changes, the scrollable output panel shows crystal metadata including source citations, transmission range, d_eff formulae, d tensor, and thermal/material data. Press `Enter` to replace the metadata preview with Qmix calculation results.

## Desktop app (Tauri)

The repository includes a Tauri v2 desktop wrapper for macOS and other desktop platforms. It loads the generated standalone web UI from `public/*.standalone.html`, so the app does not require the Express server at runtime.

### Requirements

Install the JavaScript and Tauri/Rust toolchains:

```sh
npm install
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

On macOS, install Xcode Command Line Tools at minimum:

```sh
xcode-select --install
```

For signed/distributable macOS app bundles you may also need full Xcode.

### Development build

```sh
npm run desktop:dev
```

This runs Tauri in development mode. The Tauri config regenerates standalone HTML before launch via `npm run standalone`.

### Production bundle

```sh
npm run desktop:build
```

This runs:

1. `npm run build`
2. `npm run standalone`
3. `tauri build`

The desktop window opens `public/index.standalone.html` and uses existing Plotly-based UI pages for Qmix, QPM, refractive-index calculations, and custom crystals.

## Development

Install dependencies:

```sh
npm install
```

Run checks:

```sh
npm run typecheck
npm test
npm run build
```

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.


