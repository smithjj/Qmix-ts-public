import { readFileSync, writeFileSync } from "node:fs";

const text = readFileSync("original_snlo_qmix_func.m", "utf8");
const lines = text.split("\n");

// Find the second "switch currentCrystal" (the real one, not the commented-out one)
let switchLine = -1;
let switchCount = 0;
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trimStart();
  if (trimmed.startsWith("switch currentCrystal") && !trimmed.startsWith("%")) {
    switchCount++;
    if (switchCount === 1) {
      switchLine = i;
      break;
    }
  }
}

if (switchLine === -1) throw new Error("Could not find switch");

const switchIndent = lines[switchLine].search(/\S/);

// Find case indentation from first case
let caseIndent = switchIndent + 4;
for (let i = switchLine + 1; i < Math.min(switchLine + 50, lines.length); i++) {
  const trimmed = lines[i].trimStart();
  if (trimmed.startsWith("case '") && !trimmed.startsWith("%")) {
    caseIndent = lines[i].search(/\S/);
    break;
  }
}

const info = {};
let currentCrystal = "";
let currentVars = {};
let inCase = false;

for (let i = switchLine + 1; i < lines.length; i++) {
  const line = lines[i];
  const leading = line.search(/\S/);
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("%") || trimmed.startsWith("//")) continue;

  if (leading === switchIndent && trimmed.startsWith("end")) break;

  const atCaseIndent = leading === caseIndent;
  if (atCaseIndent && trimmed.startsWith("case '")) {
    if (inCase && currentCrystal) info[currentCrystal] = currentVars;
    const match = trimmed.match(/case '([^']+)'/);
    currentCrystal = match ? match[1] : "";
    currentVars = {};
    inCase = true;
    continue;
  }

  if (leading === caseIndent && trimmed.startsWith("otherwise")) {
    if (inCase && currentCrystal) info[currentCrystal] = currentVars;
    inCase = false;
    continue;
  }

  if (!inCase || !currentCrystal) continue;

  const varMatch = trimmed.match(/^(crystal_description|wavelength_range|iso_uni_or_bi|crystal_class|ref_ind_source|thermo_optic_source|d_eff1|d_eff2|d_string|d_source|thermal_conductivity|thermal_expansion|specific_heat|density|transmission_source|thermal_conductivity_source|thermal_expansion_source|specific_heat_source)\s*=\s*(.*?);?\s*$/);
  if (varMatch) {
    const name = varMatch[1];
    let value = varMatch[2].trim();

    // Handle MATLAB ... continuation
    if (value === "...") {
      if (i + 1 < lines.length) {
        i++;
        value = lines[i].trim();
      }
    }

    if (value.startsWith("{")) {
      const cellLines = [value];
      let depth = 0;
      for (const ch of value) { if (ch === "{") depth++; if (ch === "}") depth--; }
      while (depth > 0 && i + 1 < lines.length) {
        i++;
        const nextLine = lines[i].trim();
        cellLines.push(nextLine);
        for (const ch of nextLine) { if (ch === "{") depth++; if (ch === "}") depth--; }
      }
      const joined = cellLines.join(" ");
      const strs = [];
      const strRe = /'([^']*)'/g;
      let m;
      while ((m = strRe.exec(joined)) !== null) strs.push(m[1]);
      value = strs;
    } else if (value.startsWith("[")) {
      let arrStr = value;
      if (!arrStr.includes("]")) {
        while (i + 1 < lines.length) {
          i++;
          const nextLine = lines[i].trim();
          arrStr += " " + nextLine;
          if (nextLine.includes("]")) break;
        }
      }
      arrStr = arrStr.replace(/;/g, ",").replace(/\]$/, "").replace(/^\[/, "");
      const parts = arrStr.split(",").map(s => s.trim()).filter(s => s);
      const nums = parts.map(s => {
        const n = Number(s);
        return isNaN(n) ? s : n;
      });
      value = nums.length === 1 ? nums[0] : nums;
    } else if (value.startsWith("'") || value.startsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.toLowerCase() === "nan") {
      value = null;
    } else {
      const n = Number(value);
      if (!isNaN(n) && value.trim() !== "") value = n;
    }

    currentVars[name] = value;
  }
}

if (inCase && currentCrystal) info[currentCrystal] = currentVars;

for (const crystal of Object.keys(info)) {
  const ds = info[crystal]["d_string"];
  if (Array.isArray(ds)) {
    info[crystal]["d_string"] = ds.join("\n");
  }
}

writeFileSync("fixtures/crystal-info-golden.json", JSON.stringify(info, null, 2));
console.log(`Wrote info for ${Object.keys(info).length} crystals to fixtures/crystal-info-golden.json`);
