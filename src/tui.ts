import {
  createCliRenderer,
  Box,
  Text,
  ScrollBox,
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  type Renderable,
  type SelectOption,
  InputRenderableEvents,
} from "@opentui/core";
import { CrystalDB } from "./qmix/crystal-db.js";
import { QmixEngine } from "./qmix/engine.js";
import { n12 } from "./qmix/n12.js";
import { formatQmixResults } from "./qmix/format.js";
import type { PrincipalPlane, MixingType } from "./qmix/types.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/* ─────────────────────────  data  ───────────────────────── */
const CRYSTALS = CrystalDB.list().sort();
const CRYSTAL_OPTS = CRYSTALS.map((n) => ({ name: n, description: "", value: n }));
const PLANE_OPTS = [
  { name: "XY", description: "", value: "XY" },
  { name: "XZ", description: "", value: "XZ" },
  { name: "YZ", description: "", value: "YZ" },
];
const TYPE_OPTS = [
  { name: "Mix", description: "Sum/Difference frequency", value: "Mix" },
  { name: "OPO", description: "Optical parametric oscillation", value: "OPO" },
];

type CrystalInfo = Record<string, unknown>;
const moduleDir = dirname(fileURLToPath(import.meta.url));
const crystalInfoPath = resolve(moduleDir, "..", "fixtures", "crystal-info-golden.json");
const CRYSTAL_INFO = JSON.parse(readFileSync(crystalInfoPath, "utf8")) as Record<string, CrystalInfo>;

/* ────────────────────────  helpers  ──────────────────────── */
const label = (t: string) => Text({ content: t, fg: "#888888" });

function fmtValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function crystalOptions(filter: string): SelectOption[] {
  const q = filter.trim().toUpperCase();
  const names = q
    ? CRYSTALS.filter((name) => {
        const info = CRYSTAL_INFO[name];
        const desc = fmtValue(info?.crystal_description).toUpperCase();
        const formula = fmtValue(info?.d_eff1).toUpperCase() + " " + fmtValue(info?.d_eff2).toUpperCase();
        return name.includes(q) || desc.includes(q) || formula.includes(q);
      })
    : CRYSTALS;
  if (names.length === 0) return [{ name: "No matches", description: "", value: "" }];
  return names.map((name) => ({ name, description: fmtValue(CRYSTAL_INFO[name]?.crystal_description), value: name }));
}

function updateCrystalSelect(select: SelectRenderable, filter: string, preferred = "BBO"): void {
  const current = (select.getSelectedOption()?.value as string | undefined) || preferred;
  const options = crystalOptions(filter);
  select.options = options;
  const next = options.findIndex((opt) => opt.value === current);
  select.setSelectedIndex(next >= 0 ? next : 0);
}

function crystalInfoText(code: string): string {
  if (!code) return "No matching crystal selected. Refine the crystal search.";
  const info = CRYSTAL_INFO[code];
  if (!info) return `${code}\nNo crystal metadata found.`;

  const lines: string[] = [];
  lines.push(`${code} — ${fmtValue(info.crystal_description)}`);
  lines.push(`Type/class: ${fmtValue(info.iso_uni_or_bi)} | ${fmtValue(info.crystal_class)}`);
  lines.push(`Transmission: ${fmtValue(info.wavelength_range)} nm`);
  lines.push("");
  lines.push("Sources:");
  lines.push(`  refractive index: ${fmtValue(info.ref_ind_source)}`);
  lines.push(`  thermo-optic:     ${fmtValue(info.thermo_optic_source)}`);
  lines.push(`  transmission:     ${fmtValue(info.transmission_source)}`);
  if (info.d_source) lines.push(`  nonlinear d:      ${fmtValue(info.d_source)}`);
  lines.push("");

  if (info.d_eff1 || info.d_eff2) {
    lines.push("d_eff formulae:");
    if (info.d_eff1) lines.push(`  d_eff1 = ${fmtValue(info.d_eff1)}`);
    if (info.d_eff2) lines.push(`  d_eff2 = ${fmtValue(info.d_eff2)}`);
    lines.push("");
  }
  if (info.d_string) {
    lines.push("d tensor:");
    lines.push(fmtValue(info.d_string));
    lines.push("");
  }

  lines.push("Thermal/material metadata:");
  lines.push(`  conductivity: ${fmtValue(info.thermal_conductivity)} W/m/K`);
  if (info.thermal_conductivity_source) lines.push(`    ${fmtValue(info.thermal_conductivity_source).trim()}`);
  lines.push(`  expansion:    ${fmtValue(info.thermal_expansion)} ppm/K`);
  if (info.thermal_expansion_source) lines.push(`    ${fmtValue(info.thermal_expansion_source).trim()}`);
  lines.push(`  specific heat: ${fmtValue(info.specific_heat)} J/kg/K`);
  if (info.specific_heat_source) lines.push(`    ${fmtValue(info.specific_heat_source).trim()}`);
  lines.push(`  density:       ${fmtValue(info.density)} kg/m³`);
  return lines.join("\n");
}

export async function startTui(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    screenMode: "alternate-screen",
    targetFps: 30,
    useMouse: true,
    consoleMode: "disabled",
  });

  /* ═════════════════════════  Output  ═════════════════════════ */
  const outText = new TextRenderable(renderer, {
    id: "out-text",
    content: "",
    wrapMode: "word",
    width: "100%",
  });
  const outWrap = Box(
    { flexGrow: 1, flexShrink: 1, borderStyle: "single", title: " Output ", padding: 1 },
    ScrollBox(
      {
        width: "100%",
        height: "100%",
        scrollY: true,
        scrollX: false,
        stickyScroll: false,
        viewportCulling: true,
      },
      outText,
    ),
  );
  function setOut(text: string) {
    outText.content = text;
  }

  /* ═══════════════════  Ref. Index screen  ═══════════════════ */
  let refIdx = 0;

  const rSearch = new InputRenderable(renderer, { id: "r-search", width: 20, value: "BBO", placeholder: "filter crystal" });
  const rCry = new SelectRenderable(renderer, {
    id: "r-cry",
    width: 22,
    height: 6,
    options: crystalOptions("BBO"),
    selectedIndex: 0,
    showDescription: false,
    showScrollIndicator: true,
    wrapSelection: true,
  });
  const rTmp = new InputRenderable(renderer, { id: "r-tmp", width: 12, value: "300", placeholder: "300" });
  const rWav = new InputRenderable(renderer, { id: "r-wav", width: 12, value: "1064", placeholder: "1064" });
  const rTh  = new InputRenderable(renderer, { id: "r-th",  width: 12, value: "", placeholder: "optional" });
  const rPh  = new InputRenderable(renderer, { id: "r-ph",  width: 12, value: "", placeholder: "optional" });
  const refInputs: Renderable[] = [rSearch, rCry, rTmp, rWav, rTh, rPh];

  function calcRef() {
    try {
      const cry = ((rCry.getSelectedOption()?.value as string | undefined) ?? "BBO").toUpperCase().trim();
      const tmp = parseFloat(rTmp.value || "300") || 300;
      const wav = parseFloat(rWav.value || "1064") || 1064;
      const thS = (rTh.value || "").trim();
      const phS = (rPh.value || "").trim();

      if (!CRYSTALS.includes(cry)) {
        setOut(`Unknown crystal: ${cry}\nKnown: ${CRYSTALS.slice(0, 20).join(", ")}…`);
        return;
      }
      const idx = CrystalDB.compute(cry, tmp, wav);
      if (!idx.length || idx.some((v) => v === 0)) {
        setOut(`${cry} @ ${wav} nm, ${tmp} K — out of range.`);
        return;
      }

      let out = `${cry}  |  ${tmp} K  |  ${wav} nm\n`;
      if (idx.length === 3) {
        out += `nx = ${idx[0]!.toFixed(5)}\nny = ${idx[1]!.toFixed(5)}\nnz = ${idx[2]!.toFixed(5)}`;
        if (thS && phS) {
          const th = parseFloat(thS), ph = parseFloat(phS);
          if (Number.isFinite(th) && Number.isFinite(ph)) {
            const nv = n12([idx[0]!, idx[1]!, idx[2]!], (th * Math.PI) / 180, (ph * Math.PI) / 180, "Z");
            out += `\n\nAt θ=${th}°, φ=${ph}°:\n  n_hi = ${nv[0]!.toFixed(5)}\n  n_lo = ${nv[1]!.toFixed(5)}`;
          }
        }
      } else if (idx.length === 2) {
        out += `n_o = ${idx[0]!.toFixed(5)}\nn_e = ${idx[1]!.toFixed(5)}`;
        if (thS) {
          const th = parseFloat(thS);
          if (Number.isFinite(th)) {
            const ct = Math.cos((th * Math.PI) / 180), st = Math.sin((th * Math.PI) / 180);
            const ne = 1 / Math.sqrt((ct / idx[0]!) ** 2 + (st / idx[1]!) ** 2);
            out += `\n\nAt θ=${th}°:\n  n_e(θ) = ${ne.toFixed(5)}\n  n_o    = ${idx[0]!.toFixed(5)}`;
          }
        }
      } else {
        out += `n = ${idx[0]!.toFixed(5)}  (isotropic)`;
      }
      setOut(out);
    } catch (e: any) {
      setOut(`Error: ${e.message}`);
    }
  }

  const refScreen = Box(
    { id: "ref-scr", flexDirection: "column", flexGrow: 1 },
    Box({ flexDirection: "row", gap: 1, marginBottom: 1, flexShrink: 0 },
      Box({ flexDirection: "column", width: 24 }, label("Crystal search"), rSearch, rCry),
      Box({ flexDirection: "column", width: 12 }, label("Temp K"), rTmp),
      Box({ flexDirection: "column", width: 12 }, label("λ nm"), rWav),
      Box({ flexDirection: "column", width: 12 }, label("θ °"), rTh),
      Box({ flexDirection: "column", width: 12 }, label("φ °"), rPh),
    ),
    outWrap,
  );

  /* ══════════════════════  Qmix screen  ══════════════════════ */
  let qmixIdx = 0;

  const qSearch = new InputRenderable(renderer, { id: "q-search", width: 20, value: "BBO", placeholder: "filter crystal" });
  const qCry = new SelectRenderable(renderer, {
    id: "q-cry",
    width: 22,
    height: 6,
    options: crystalOptions("BBO"),
    selectedIndex: 0,
    showDescription: false,
    showScrollIndicator: true,
    wrapSelection: true,
  });
  const qTmp = new InputRenderable(renderer, { id: "q-tmp", width: 10, value: "300", placeholder: "300" });
  const qR1  = new InputRenderable(renderer, { id: "q-r1",  width: 10, value: "1064", placeholder: "1064" });
  const qR2  = new InputRenderable(renderer, { id: "q-r2",  width: 10, value: "1064", placeholder: "1064" });
  const qBl  = new InputRenderable(renderer, { id: "q-bl",  width: 10, value: "0", placeholder: "0=auto" });
  const qPl  = new SelectRenderable(renderer, { id: "q-pl", width: 8, options: PLANE_OPTS, selectedIndex: 0, showDescription: false });
  const qTy  = new SelectRenderable(renderer, { id: "q-ty", width: 10, options: TYPE_OPTS, selectedIndex: 0, showDescription: false });
  const qmixInputs: Renderable[] = [qSearch, qCry, qTmp, qR1, qR2, qBl, qPl, qTy];

  function showQmixCrystalInfo() {
    const cry = ((qCry.getSelectedOption()?.value as string | undefined) ?? "BBO").toUpperCase().trim();
    setOut(crystalInfoText(cry));
  }

  qCry.on(SelectRenderableEvents.SELECTION_CHANGED, showQmixCrystalInfo);
  qCry.on(SelectRenderableEvents.ITEM_SELECTED, showQmixCrystalInfo);

  function calcQmix() {
    try {
      const cry = ((qCry.getSelectedOption()?.value as string | undefined) ?? "BBO").toUpperCase().trim();
      const tmp = parseFloat(qTmp.value || "300") || 300;
      const r1  = parseFloat(qR1.value || "1064") || 1064;
      const r2  = parseFloat(qR2.value || "1064") || 1064;
      const bl  = parseFloat(qBl.value || "0") || 0;
      const pl  = (qPl.getSelectedOption()?.value as string) || "XY";
      const ty  = ((qTy.getSelectedOption()?.value as string) || "Mix") as MixingType;

      if (!CRYSTALS.includes(cry)) {
        setOut(`Unknown crystal: ${cry}\nKnown: ${CRYSTALS.slice(0, 20).join(", ")}…`);
        return;
      }
      const engine = new QmixEngine();
      const res = engine.calculate({
        selectedCrystal: cry,
        temperatureKelvin: tmp,
        wavelengthRed1Nm: r1,
        wavelengthRed2Nm: r2,
        wavelengthBlueNm: bl,
        principalPlane: pl as PrincipalPlane,
        type: ty,
      });
      if (!res.length) {
        setOut(`${cry} — no phase-match.\nT=${tmp}K  λ₁=${r1}  λ₂=${r2}  λ₃=${bl || "auto"}  ${pl} ${ty}`);
        return;
      }
      setOut(`${cry} @ ${tmp} K  |  ${res.length} solution(s)\n` + formatQmixResults(res, ty).join("\n"));
    } catch (e: any) {
      setOut(`Error: ${e.message}`);
    }
  }

  const qmixScreen = Box(
    { id: "qmix-scr", flexDirection: "column", flexGrow: 1 },
    Box({ flexDirection: "row", gap: 1, marginBottom: 1, flexShrink: 0 },
      Box({ flexDirection: "column", width: 24 }, label("Crystal search"), qSearch, qCry),
      Box({ flexDirection: "column", width: 12 }, label("Temp K"), qTmp),
      Box({ flexDirection: "column", width: 10 }, label("Plane"), qPl),
      Box({ flexDirection: "column", width: 12 }, label("Type"), qTy),
    ),
    Box({ flexDirection: "row", gap: 1, marginBottom: 1, flexShrink: 0 },
      Box({ flexDirection: "column", width: 12 }, label("Red1 nm"), qR1),
      Box({ flexDirection: "column", width: 12 }, label("Red2 nm"), qR2),
      Box({ flexDirection: "column", width: 12 }, label("Blue nm"), qBl),
    ),
    outWrap,
  );

  /* ═══════════════════  Root layout  ═══════════════════ */
  const content = new BoxRenderable(renderer, { id: "content", flexDirection: "column", flexGrow: 1 });
  let currentScreen: "ref" | "qmix" = "qmix";
  content.add(qmixScreen);

  renderer.root.add(
    Box({ flexDirection: "column", width: "100%", height: "100%", padding: 1 },
      Box({ flexDirection: "row", gap: 2, height: 1, marginBottom: 1, flexShrink: 0 },
        Text({ content: "[F1] Ref.Index   [F2] Qmix   [Tab] Next   [Enter] Calc   [Ctrl+C] Exit", fg: "#888888" }),
      ),
      content,
    ),
  );

  /* ═══════════════════  Focus helpers  ═══════════════════ */
  function whichScreen(): "ref" | "qmix" {
    return currentScreen;
  }

  function focusRef(i: number) { refIdx = ((i % refInputs.length) + refInputs.length) % refInputs.length; refInputs[refIdx]!.focus(); }
  function focusQmix(i: number) { qmixIdx = ((i % qmixInputs.length) + qmixInputs.length) % qmixInputs.length; qmixInputs[qmixIdx]!.focus(); }

  function nextField() {
    if (whichScreen() === "ref") focusRef(refIdx + 1);
    else focusQmix(qmixIdx + 1);
  }
  function prevField() {
    if (whichScreen() === "ref") focusRef(refIdx - 1);
    else focusQmix(qmixIdx - 1);
  }
  function doCalc() {
    if (whichScreen() === "ref") calcRef();
    else calcQmix();
  }
  function switchTo(screen: "ref" | "qmix") {
    if (currentScreen === screen) return;
    if (content.getRenderable("ref-scr")) content.remove("ref-scr");
    if (content.getRenderable("qmix-scr")) content.remove("qmix-scr");
    currentScreen = screen;
    if (screen === "ref") {
      content.add(refScreen);
      setOut("Ref. Index mode — crystal, temperature, wavelength, optional angles.");
      focusRef(0);
    } else {
      content.add(qmixScreen);
      showQmixCrystalInfo();
      focusQmix(0);
    }
  }

  /* ═══════════════════  Keys  ═══════════════════ */
  renderer.keyInput.on("keypress", (key) => {
    if (key.name === "f1") { switchTo("ref"); return true; }
    if (key.name === "f2") { switchTo("qmix"); return true; }
    if (key.name === "tab" && key.shift) { prevField(); return true; }
    if (key.name === "tab") { nextField(); return true; }
    if (key.name === "return") { doCalc(); return true; }
    return false;
  });

  /* Enter on inputs also triggers calculate */
  rSearch.on(InputRenderableEvents.INPUT, () => updateCrystalSelect(rCry, rSearch.value));
  qSearch.on(InputRenderableEvents.INPUT, () => { updateCrystalSelect(qCry, qSearch.value); showQmixCrystalInfo(); });

  for (const inp of [rSearch, rTmp, rWav, rTh, rPh, qSearch, qTmp, qR1, qR2, qBl]) {
    inp.on(InputRenderableEvents.ENTER, () => doCalc());
  }

  /* start */
  focusQmix(0);
  showQmixCrystalInfo();
}
