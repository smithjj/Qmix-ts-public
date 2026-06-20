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
//# sourceMappingURL=cli.d.ts.map