# Swift CrystalDB seed entries: BBO, KTP, LBO

These are black-box/metadata seed entries for a Swift rewrite. They summarize the crystal database records needed for the first implementation pass without depending on MATLAB source algorithms.

Use these entries for:

- crystal code lookup
- crystal kind / number of polarizations
- wavelength range handling
- metadata display
- nonlinear tensor / d_eff metadata
- fixture-based validation at common wavelengths

For refractive-index formulas, either use literature formulas from the cited references or fit/derive behavior from MATLAB oracle fixtures. Do not transcribe MATLAB source algorithms if this is a clean-room rewrite.

## Suggested Swift data shape

```swift
enum CrystalKind: String, Codable {
    case isotropic
    case uniaxial
    case biaxial
}

struct CrystalMetadata: Codable, Equatable {
    var code: String
    var description: String
    var formula: String?
    var kind: CrystalKind
    var crystalClass: String
    var wavelengthRangeNm: ClosedRange<Double>
    var refractiveIndexSource: String
    var thermoOpticSource: String
    var transmissionSource: String
    var dEffFormulae: [String]
    var dTensor: [[Double?]]?       // 3 x 6 contracted d tensor, nil for unknown entries
    var dSource: String?
    var thermalConductivity: [Double]
    var thermalConductivitySource: String?
    var thermalExpansion: [Double]
    var thermalExpansionSource: String?
    var specificHeatJPerKgK: Double?
    var specificHeatSource: String?
    var densityKgPerM3: Double?
}

struct CrystalDBEntry: Codable, Equatable {
    var metadata: CrystalMetadata
    var referenceSamples300K: [Double: [Double]]
}
```

`referenceSamples300K` is intentionally not a formula. It gives quick black-box sanity checks at common wavelengths.

## BBO

Short code: `BBO`

```swift
let bbo = CrystalDBEntry(
    metadata: CrystalMetadata(
        code: "BBO",
        description: "beta-BaB_2O_4 or beta-borium borate",
        formula: "β-BaB2O4",
        kind: .uniaxial,
        crystalClass: "3m",
        wavelengthRangeNm: 188.0...5200.0,
        refractiveIndexSource: "Tamosauskas, Opt. Mat. Exp. 8, p1410 (2018)",
        thermoOpticSource: "Kato, SPIE v. 11670 (2021)",
        transmissionSource: "Bhar, Appl. Phys. Lett. v58 p231 (1991).",
        dEffFormulae: [
            "d_zxx sin(theta+rho) - d_yyy cos(theta+rho)sin(3phi)",
            "d_yyy cos^2(theta+rho)cos(3phi)"
        ],
        dTensor: [
            [0,     0,     0,    0,    0.08, 2.2],
            [2.2,  -2.2,   0,    0.08, 0,    0],
            [0.08,  0.08, nil,   0,    0,    0]
        ],
        dSource: "Eckardt, IEEE JQE v26 p922 (1990).",
        thermalConductivity: [1.2, 1.6],
        thermalConductivitySource: "Beasley, Appl. Opt. v33 p1000 (1994).",
        thermalExpansion: [0.5, 33.3],
        thermalExpansionSource: "Opt. Soc. Am. Handbook of Optics",
        specificHeatJPerKgK: 490,
        specificHeatSource: "Barnes, JOSAB v12 p124 (1995).",
        densityKgPerM3: 3850
    ),
    referenceSamples300K: [
        532:  [1.6739967698418783, 1.5546410091066407],
        1064: [1.6542503265005448, 1.5420107726397105],
        1550: [1.646270041403794, 1.5389375414416138]
    ]
)
```

Notes:

- Output has two indices at each wavelength.
- Existing fixtures treat `BBO` as the default/recommended BBO record.
- Wavelength range from fixture data is `[188, 5200]` nm.

## KTP family

There is no bare `KTP` entry in the current fixture metadata. Use explicit variants:

- `KTP_F` — flux-grown, Bonnin/Cristal Laser refractive-index source
- `KTP_H` — hydrothermally grown, Vanherzeele source
- `KTP_K` — flux-grown, Kato source

All are biaxial, class `mm2`, range `350...4500` nm, and share the same nonlinear d tensor metadata.

### Common KTP nonlinear metadata

```swift
let ktpDTensor: [[Double?]] = [
    [0,    0,   0,    0,   1.95, 0],
    [0,    0,   0,    3.9, 0,    0],
    [1.95, 3.9, 15.3, 0,   0,    0]
]
```

Common values:

```swift
let ktpCommonClass = "mm2"
let ktpRange = 350.0...4500.0
let ktpThermoOpticSource = "Weichmann, Opt. Lett. v18 p1208 (1993)."
let ktpDSource = "Pack, Appl. Opt. v43 p3319 (2004)."
let ktpThermalConductivity = [2.0, 2.3, 2.6]
let ktpThermalConductivitySource = "Ebbers, SPIE v2704 (1996)."
let ktpThermalExpansion = [7.88, 9.48, 0.02]
let ktpThermalExpansionSource = "Smith, arxiv 1607.03964 (2016)."
let ktpSpecificHeat = 728.0
let ktpSpecificHeatSource = "Barnes, JOSAB v12 p124 (1995)."
let ktpDensity = 3025.0
let ktpTransmissionSource = "Hansson, Appl. Opt. v39 p5058 (2000)."
```

### KTP_F

```swift
let ktpF = CrystalDBEntry(
    metadata: CrystalMetadata(
        code: "KTP_F",
        description: "KTiOPO_4 or potassium titanyl phosphate (flux grown)",
        formula: "KTiOPO4",
        kind: .biaxial,
        crystalClass: ktpCommonClass,
        wavelengthRangeNm: ktpRange,
        refractiveIndexSource: "Bonnin, unpublished (from Cristal Laser).",
        thermoOpticSource: ktpThermoOpticSource,
        transmissionSource: ktpTransmissionSource,
        dEffFormulae: [],
        dTensor: ktpDTensor,
        dSource: ktpDSource,
        thermalConductivity: ktpThermalConductivity,
        thermalConductivitySource: ktpThermalConductivitySource,
        thermalExpansion: ktpThermalExpansion,
        thermalExpansionSource: ktpThermalExpansionSource,
        specificHeatJPerKgK: ktpSpecificHeat,
        specificHeatSource: ktpSpecificHeatSource,
        densityKgPerM3: ktpDensity
    ),
    referenceSamples300K: [
        532:  [1.7797398704912022, 1.7897723001300598, 1.887720999215207],
        1064: [1.7403671497168447, 1.7478689807629968, 1.8296632046770789],
        1550: [1.730177065827481, 1.7370787692047733, 1.815937056164548]
    ]
)
```

### KTP_H

```swift
let ktpH = CrystalDBEntry(
    metadata: CrystalMetadata(
        code: "KTP_H",
        description: "KTiOPO_4 or potassium titanyl phosphate (hydrothermally grown)",
        formula: "KTiOPO4",
        kind: .biaxial,
        crystalClass: ktpCommonClass,
        wavelengthRangeNm: ktpRange,
        refractiveIndexSource: "Vanherzeele, Appl. Opt. v27 p3314 (1988).",
        thermoOpticSource: ktpThermoOpticSource,
        transmissionSource: ktpTransmissionSource,
        dEffFormulae: [],
        dTensor: ktpDTensor,
        dSource: ktpDSource,
        thermalConductivity: ktpThermalConductivity,
        thermalConductivitySource: ktpThermalConductivitySource,
        thermalExpansion: ktpThermalExpansion,
        thermalExpansionSource: ktpThermalExpansionSource,
        specificHeatJPerKgK: ktpSpecificHeat,
        specificHeatSource: ktpSpecificHeatSource,
        densityKgPerM3: ktpDensity
    ),
    referenceSamples300K: [
        532:  [1.7790080008702849, 1.7899967309754226, 1.8868539778556026],
        1064: [1.7398947358373007, 1.7475578303776182, 1.8296556334682756],
        1550: [1.7295244130314091, 1.7367546976885941, 1.8159501890843464]
    ]
)
```

### KTP_K

```swift
let ktpK = CrystalDBEntry(
    metadata: CrystalMetadata(
        code: "KTP_K",
        description: "KTiOPO_4 or potassium titanyl phosphate (flux grown)",
        formula: "KTiOPO4",
        kind: .biaxial,
        crystalClass: ktpCommonClass,
        wavelengthRangeNm: ktpRange,
        refractiveIndexSource: "Kato, Appl. Opt. v41 p5040 (2002).",
        thermoOpticSource: "same",
        transmissionSource: ktpTransmissionSource,
        dEffFormulae: [],
        dTensor: ktpDTensor,
        dSource: ktpDSource,
        thermalConductivity: ktpThermalConductivity,
        thermalConductivitySource: ktpThermalConductivitySource,
        thermalExpansion: ktpThermalExpansion,
        thermalExpansionSource: ktpThermalExpansionSource,
        specificHeatJPerKgK: ktpSpecificHeat,
        specificHeatSource: ktpSpecificHeatSource,
        densityKgPerM3: ktpDensity
    ),
    referenceSamples300K: [
        532:  [1.7780059317494248, 1.7887843321672305, 1.8888212226228052],
        1064: [1.737961057367306, 1.7455173166272924, 1.829761657728498],
        1550: [1.728182832145524, 1.7349502353365507, 1.8158494895746795]
    ]
)
```

### Suggested KTP alias policy

Because the current database exposes no bare `KTP`, do not silently alias `KTP` unless your UI needs a convenience default. If you do add an alias, make it explicit:

```swift
let aliases = [
    "KTP": "KTP_K" // or choose KTP_F, but document the choice
]
```

## LBO

Short code: `LBO`

```swift
let lbo = CrystalDBEntry(
    metadata: CrystalMetadata(
        code: "LBO",
        description: "LiB_3O_5 or lithium triborate",
        formula: "LiB3O5",
        kind: .biaxial,
        crystalClass: "mm2",
        wavelengthRangeNm: 160.0...2800.0,
        refractiveIndexSource: "Kato, IEEE JQE v30 p2950 (1994).",
        thermoOpticSource: "same",
        transmissionSource: "unknown",
        dEffFormulae: [],
        dTensor: [
            [0,     0,    0,    0,    0,  -0.67],
            [-0.67, 0.04, 0.85, 0,    0,   0],
            [0,     0,    0,    0.85, 0,   0]
        ],
        dSource: "Roberts, IEEE JQE v28 p2057 (1992).",
        thermalConductivity: [2.7, 3.1, 4.5],
        thermalConductivitySource: "Reidel, Opt. Ex. v22 p17607 (2014).",
        thermalExpansion: [58, -53, 25],
        thermalExpansionSource: "at 300 K. Ref: Grechin, Quant Elect v40 p509 (2010)",
        specificHeatJPerKgK: 1060,
        specificHeatSource: "Barnes, JOSAB v12 p124 (1995).",
        densityKgPerM3: 2474
    ),
    referenceSamples300K: [
        532:  [1.5785086395381485, 1.6063972549856282, 1.6215479403886834],
        1064: [1.5647618387743905, 1.5903449958266433, 1.6052903296184884],
        1550: [1.5573906190531435, 1.5809951948921974, 1.5959019393395908]
    ]
)
```

Notes:

- Output has three principal indices `[nx, ny, nz]`.
- The fixture wavelength range is `[160, 2800]` nm.
- The metadata fixture says transmission source is unknown.

## Minimal sanity tests

```swift
func testSeedRefIndSamples() throws {
    XCTAssertEqual(try db.indices("BBO", 300, 1064), [1.6542503265005448, 1.5420107726397105], accuracy: 1e-9)
    XCTAssertEqual(try db.indices("LBO", 300, 1064), [1.5647618387743905, 1.5903449958266433, 1.6052903296184884], accuracy: 1e-9)
    XCTAssertEqual(try db.indices("KTP_K", 300, 1064), [1.737961057367306, 1.7455173166272924, 1.829761657728498], accuracy: 1e-9)
}
```

The exact `XCTAssertEqual` helper for arrays is up to the Swift project; compare element-wise with the shown tolerance.

## Sellmeier equations and coefficients

All equations below use:

```txt
λ = wavelength in micrometers
λ² = λ * λ
T = temperature in kelvin
```

The returned index is `sqrt(abs(n²)) + temperatureCorrection`. The `abs` is included because the reference implementation protects square-root evaluation this way near invalid ranges.

### BBO default entry (`BBO`)

Current default `BBO` uses the BBO_3-style equation.

Equation for each polarization row:

```txt
n²(λ) = a + (b λ²)/(λ² - c) + (d λ²)/(λ² - e) + (f λ²)/(λ² - g)
Δn(λ,T) = (T - 293) * (A/λ³ + B/λ² + C/λ + D) * 1e-5
n(λ,T) = sqrt(abs(n²(λ))) + Δn(λ,T)
```

Rows are `[ordinary, extraordinary]`.

| row | a | b | c | d | e | f | g | temp A | temp B | temp C | temp D |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ordinary | 1 | 0.90291 | 0.003926 | 0.83155 | 0.018786 | 0.76536 | 60.01 | -0.0137 | 0.0607 | -0.1334 | -1.5287 |
| extraordinary | 1 | 1.151075 | 0.007142 | 0.21803 | 0.02259 | 0.656 | 263.0 | 0.0413 | -0.2119 | 0.4408 | -1.2749 |

Swift-friendly coefficient form:

```swift
struct BBOCoef {
    let a, b, c, d, e, f, g: Double
    let tempA, tempB, tempC, tempD: Double
}

let bboSellmeier: [BBOCoef] = [
    .init(a: 1, b: 0.90291,  c: 0.003926, d: 0.83155, e: 0.018786, f: 0.76536, g: 60.01,
          tempA: -0.0137, tempB: 0.0607, tempC: -0.1334, tempD: -1.5287),
    .init(a: 1, b: 1.151075, c: 0.007142, d: 0.21803, e: 0.02259,  f: 0.656,   g: 263.0,
          tempA: 0.0413, tempB: -0.2119, tempC: 0.4408, tempD: -1.2749)
]
```

### LBO (`LBO`)

Equation for each principal-axis row:

```txt
n²(λ) = a + b/(c - λ²) + d λ² + e λ⁴ + f λ⁶
Δn(λ,T) = (T - 293) * 1e-6 * (g λ + h) * (1 + i * (T - 293))
n(λ,T) = sqrt(abs(n²(λ))) + Δn(λ,T)
```

Rows are `[nx, ny, nz]`.

| row | a | b | c | d | e | f | g | h | i |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| nx | 2.4542 | -0.01125 | 0.01135 | -0.01388 | 0 | 0 | -3.76 | 2.3 | 2.913e-2 |
| ny | 2.539 | -0.01277 | 0.01189 | -0.01849 | 4.3025e-5 | -2.9131e-5 | 6.01 | -19.4 | -3.289e-3 |
| nz | 2.5865 | -0.0131 | 0.01223 | -0.01862 | 4.5778e-5 | -3.2526e-5 | 1.5 | -9.7 | -7.449e-3 |

Swift-friendly coefficient form:

```swift
struct LBOCoef {
    let a, b, c, d, e, f: Double
    let g, h, i: Double
}

let lboSellmeier: [LBOCoef] = [
    .init(a: 2.4542, b: -0.01125, c: 0.01135, d: -0.01388, e: 0,          f: 0,
          g: -3.76, h: 2.3,   i: 2.913e-2),
    .init(a: 2.539,  b: -0.01277, c: 0.01189, d: -0.01849, e: 4.3025e-5,  f: -2.9131e-5,
          g: 6.01,  h: -19.4, i: -3.289e-3),
    .init(a: 2.5865, b: -0.0131,  c: 0.01223, d: -0.01862, e: 4.5778e-5,  f: -3.2526e-5,
          g: 1.5,   h: -9.7,  i: -7.449e-3)
]
```

### KTP_F (`KTP_F`)

Equation:

```txt
n²(λ) = A + B/(λ² - C) - D λ²
Δn(λ,T) = (E + F/λ + G/λ² + H/λ³) * (T - 298)
n(λ,T) = sqrt(abs(n²(λ))) + Δn(λ,T)
```

Rows are `[nx, ny, nz]`.

Base Sellmeier rows:

| row | A | B | C | D |
|---|---:|---:|---:|---:|
| nx | 3.0067 | 0.0395 | 0.04251 | 0.01247 |
| ny | 3.0319 | 0.04152 | 0.04586 | 0.01337 |
| nz | 3.3134 | 0.05694 | 0.05941 | 0.016713 |

Shared KTP thermal rows:

| row | E | F | G | H |
|---|---:|---:|---:|---:|
| nx | 0.952e-6 | 8.711e-6 | -4.735e-6 | 1.427e-6 |
| ny | -2.113e-6 | 21.232e-6 | -14.761e-6 | 4.269e-6 |
| nz | -12.101e-6 | 59.129e-6 | -44.414e-6 | 12.415e-6 |

Swift-friendly coefficient form:

```swift
struct KTPCoefABCD {
    let A, B, C, D: Double
    let E, F, G, H: Double
}

let ktpThermal: [(E: Double, F: Double, G: Double, H: Double)] = [
    (0.952e-6,   8.711e-6,  -4.735e-6,  1.427e-6),
    (-2.113e-6, 21.232e-6, -14.761e-6,  4.269e-6),
    (-12.101e-6, 59.129e-6, -44.414e-6, 12.415e-6)
]

let ktpFSellmeierBase: [(A: Double, B: Double, C: Double, D: Double)] = [
    (3.0067, 0.0395,  0.04251, 0.01247),
    (3.0319, 0.04152, 0.04586, 0.01337),
    (3.3134, 0.05694, 0.05941, 0.016713)
]
```

### KTP_H (`KTP_H`)

Equation:

```txt
n²(λ) = A + B/(1 - C/λ²) - D λ²
       = A + (B λ²)/(λ² - C) - D λ²
Δn(λ,T) = (E + F/λ + G/λ² + H/λ³) * (T - 298)
n(λ,T) = sqrt(abs(n²(λ))) + Δn(λ,T)
```

Rows are `[nx, ny, nz]`.

Base Sellmeier rows:

| row | A | B | C | D |
|---|---:|---:|---:|---:|
| nx | 2.1146 | 0.89188 | 0.043518 | 0.0132 |
| ny | 2.1518 | 0.87862 | 0.047528 | 0.01327 |
| nz | 2.3136 | 1.00012 | 0.056792 | 0.01679 |

Thermal coefficients are the same shared KTP thermal rows listed under `KTP_F`.

```swift
let ktpHSellmeierBase: [(A: Double, B: Double, C: Double, D: Double)] = [
    (2.1146, 0.89188, 0.043518, 0.0132),
    (2.1518, 0.87862, 0.047528, 0.01327),
    (2.3136, 1.00012, 0.056792, 0.01679)
]
```

### KTP_K (`KTP_K`)

Equation:

```txt
n²(λ) = A + B/(λ² - C) + D/(λ² - E)
Δn(λ,T) = (T - 293) * ( 1e-5 * (F/λ³ + G/λ² + H/λ + I + Jλ + Kλ²) - 1.293e-6 )
n(λ,T) = sqrt(abs(n²(λ))) + Δn(λ,T)
```

Rows are `[nx, ny, nz]`.

| row | A | B | C | D | E | F | G | H | I | J | K |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| nx | 3.291 | 0.0414 | 0.03978 | 9.35522 | 31.45571 | 0.1717 | -0.5353 | 0.8416 | 0.1627 | 0 | 0 |
| ny | 3.45018 | 0.04341 | 0.04597 | 16.98825 | 39.43799 | 0.1997 | -0.4063 | 0.5154 | 0.5425 | 0 | 0 |
| nz | 4.59423 | 0.06206 | 0.04763 | 110.80672 | 86.12171 | 0.366 | 0.009266 | -2.137 | 5.353 | -2.57 | 0.4693 |

Swift-friendly coefficient form:

```swift
struct KTPKCoef {
    let A, B, C, D, E: Double
    let F, G, H, I, J, K: Double
}

let ktpKSellmeier: [KTPKCoef] = [
    .init(A: 3.291,   B: 0.0414,  C: 0.03978, D: 9.35522,   E: 31.45571,
          F: 0.1717,  G: -0.5353, H: 0.8416,  I: 0.1627,   J: 0,     K: 0),
    .init(A: 3.45018, B: 0.04341, C: 0.04597, D: 16.98825,  E: 39.43799,
          F: 0.1997,  G: -0.4063, H: 0.5154,  I: 0.5425,   J: 0,     K: 0),
    .init(A: 4.59423, B: 0.06206, C: 0.04763, D: 110.80672, E: 86.12171,
          F: 0.366,   G: 0.009266,H: -2.137,  I: 5.353,    J: -2.57, K: 0.4693)
]
```
