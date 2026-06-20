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
export {};
//# sourceMappingURL=server.d.ts.map