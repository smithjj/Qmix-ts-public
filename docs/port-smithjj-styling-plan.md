# Plan: Port smithjj.github.io stylized CSS to typescript_qmix/public/*.html

## Context Summary

The smithjj.github.io pages have enhanced styling compared to the current typsescript_qmix/public/ pages. All 5 smithjj pages (index, compare, qpm, refractive-index, custom) share:

1. A `.layout` CSS-grid with left/right sidebar ad cards (`thebook.webp`, `mlSNLO.webp`)
2. A `.page-header` container with kicker, large title, subtitle, and pill-style `.module-nav`
3. CSS variables (`:root` block) for colors, radii, shadows, focus rings
4. Enhanced body background (radial gradient + linear gradient)
5. Card styling with border, fancy shadows, CSS variable-based theming
6. Button gradients with hover lift transforms
7. Responsive breakpoints (hide sidebars at 1100px, stack grid at 640px)

Each page has a shared base CSS (~3600 chars) plus an enhanced override (~5800 chars starting at `:root`). The enhanced portion is identical across all shared pages.

Page-specific CSS additions:
- **index**: `.btn-row`, `.modal`, `.preset-item`, `.trans-plot`, `.crystal-info`, `.modal-overlay`
- **compare**: `.crystal-grid`, `.toolbar`, `.export-bar`, `.wrap`, table styling, `.zero`
- **qpm**: `.col-select`, `.tune-row`, `.wrap`, table styling, `#chart`
- **refractive-index**: `.trans-plot`, `.crystal-info`
- **custom**: `.coeff-grid`, `.coeff-input`, `.formula`, `.msg`

Our current pages have:
- **index**: `public/index.html` — same UI but simple `.top-nav a` links instead of `.page-header` + `.module-nav`
- **compare**: `public/compare.html` — same `.top-nav a`, no `.layout`/`.sidebar`
- **qpm**: `public/qpm.html` — similar, no `.top-nav` on this page (was recently removed)
- **refractive-index**: `public/refractive-index.html` — simple heading
- **custom**: `public/custom.html` — simple heading
- **scan**: `public/scan.html` — currently exists in our repo, not in smithjj
- **bmix, bmix-dsurf**: exist in our repo, not in smithjj

## Goals

1. Replace current `<style>` blocks with the full smithjj-enhanced CSS (base + `:root` overrides)
2. Wrap body content in `<div class="layout"><div class="sidebar sidebar-left">...</div><div class="container">...</div><div class="sidebar sidebar-right">...</div></div>`
3. Replace `.top-nav` / plain heading with `.page-header` + `.module-nav` pill navigation
4. Keep all JavaScript functionality intact
5. Copy ad card assets (thebook.webp, mlSNLO.webp) to `public/`

## Implementation Steps

### Step 1: Copy ad card image assets
- `cp /Users/jesse/Documents/GitHub/smithjj.github.io/thebook.webp public/thebook.webp`
- `cp /Users/jesse/Documents/GitHub/smithjj.github.io/mlSNLO.webp public/mlSNLO.webp`

### Step 2: Create unified CSS template

Extract the full `<style>` from `smithjj.github.io/index.html` (~9392 chars). This is the most complete shared style. We'll use it as the base for all pages, then append page-specific selectors.

The full CSS breaks down as:
- **Lines 1–~105**: Base reset + layout + sidebar + card + form + button + modal + preset + trans-plot + crystal-info (~3600 chars)
- **Lines ~105–~171**: `:root` CSS variables + enhanced overrides (~5800 chars)

For pages that need extra selectors:
- **compare**: Add `.toolbar`, `.export-bar`, `.crystal-grid`, `.status`, `.zero` from smithjj compare.html
- **qpm**: Add `.col-select`, `.tune-row`, `#chart` from smithjj qpm.html  
- **refractive-index**: No extra needed if base already covers it
- **custom**: No extra needed
- **scan**: Keep our current scan-specific styles
- **bmix**: Keep our current bmix-specific styles
- **bmix-dsurf**: Keep our current bmix-dsurf-specific styles

### Step 3: Restructure each page's body HTML

For each page replace:

```html
<body>
<div class="container">
  <h1>...</h1>
  <p class="sub">... <a href="...">links</a> ...</p>
  <!-- content -->
</div>
```

With:

```html
<body>
<div class="layout">
<div class="sidebar sidebar-left">
  <a class="ad-card" href="https://as-photonics.com/book" target="_blank" rel="noopener">
    <span class="ad-kicker">Textbook</span>
    <img src="thebook.webp" alt="The Book">
    <strong class="ad-title">Crystal Nonlinear Optics</strong>
    <p><em>Crystal Nonlinear Optics: with SNLO examples (second edition)</em> teaches advanced crystal nonlinear optics from the ground up, so you can get the most out of Qmix.</p>
    <span class="ad-cta">Learn more</span>
  </a>
</div>
<div class="container">
  <header class="page-header">
    <div class="page-kicker">Qmix toolkit</div>
    <h1>[Page Title]</h1>
    <p class="sub">[Subtitle]</p>
    <nav class="module-nav" aria-label="Qmix modules">
      <span class="nav-current">[Current Page]</span>
      <!-- links to other pages -->
    </nav>
  </header>
  <!-- existing page content untouched -->
</div>
<div class="sidebar sidebar-right">
  <a class="ad-card" href="https://as-photonics.com/mlSNLO" target="_blank" rel="noopener">
    <span class="ad-kicker">Software</span>
    <img src="mlSNLO.webp" alt="mlSNLO">
    <strong class="ad-title">Automate design scans</strong>
    <p><strong>mlSNLO</strong> is a versatile MATLAB App for nonlinear optics. Write batch scripts to automate calculations and explore design spaces.</p>
    <span class="ad-cta">Explore mlSNLO</span>
  </a>
</div>
</div>
</body>
```

Navigation map (`.module-nav`):
| Page | nav-current | Links |
|---|---|---|
| index.html | Qmix | Compare crystals, QPM, Refractive index, Custom crystals |
| compare.html | Compare crystals | Qmix, QPM, Refractive index, Custom crystals |
| qpm.html | QPM | Qmix, Compare crystals, Refractive index, Custom crystals |
| refractive-index.html | Refractive index | Qmix, Compare crystals, QPM, Custom crystals |
| custom.html | Custom crystals | Qmix, Compare crystals, QPM, Refractive index |

### Step 4: Update existing `<style>` per page

For each `public/*.html`:
1. Replace everything between `<style>` and `</style>` with the unified smithjj base + enhanced CSS
2. Append any page-specific selectors our current page needs but smithjj base doesn't have
3. For `scan.html`, `bmix.html`, `bmix-dsurf.html`: Add the smithjj base styles but keep existing page-specific selectors

### Step 5: Regenerate standalone pages

Run `node tools/build-standalone.mjs` so `.standalone.html` files pick up the new HTML structure and CSS.

### Step 6: Rebuild Tauri app (if needed)

Run `npx tauri build` to update `.app` and `.dmg` bundles.

## Detailed File-by-File Plan

### public/index.html
- Replace `<style>` with smithjj index.html full CSS (~9392 chars)
- Wrap body in `.layout` + sidebars + `.container`
- Replace `<h1>Qmix</h1>` + `<p class="sub">...links...</p>` with `.page-header` + `.module-nav`
- Keep all JavaScript after `</style>` intact

### public/compare.html
- Replace `<style>` with smithjj compare.html full CSS (~9411 chars)  
- Which includes `.crystal-grid`, `.toolbar`, `.export-bar`, `.wrap`, table styles
- Wrap body in `.layout` + sidebars + `.container`
- Replace heading with `.page-header` + `.module-nav`

### public/qpm.html
- Replace `<style>` with smithjj qpm.html full CSS (~8592 chars)
- Which includes `input[type="radio"]`, `.col-select`, `.tune-row`, `#chart`, `.wrap`, table styles
- Wrap body in `.layout` + sidebars + `.container`
- Replace heading with `.page-header` + `.module-nav`

### public/refractive-index.html
- Replace `<style>` with smithjj refractive-index.html full CSS (~7047 chars)
- Wrap body in `.layout` + sidebars + `.container`
- Replace heading with `.page-header` + `.module-nav`

### public/custom.html
- Replace `<style>` with smithjj custom.html full CSS (~8051 chars)
- Which includes `.coeff-grid`, `.coeff-input`, `.formula`, `.msg`
- Wrap body in `.layout` + sidebars + `.container`
- Replace heading with `.page-header` + `.module-nav`

### public/scan.html
- smithjj doesn't have scan.html. We'll apply the smithjj base + enhanced CSS to scan.html.
- Add scan-specific selectors: `.row { display:flex; gap:1rem; flex-wrap:wrap; align-items:end; }`, `.col-select`, `.radio-group`, `#chart`, `.wrap`, table styles
- Wrap body in `.layout` + sidebars + `.container`
- Replace heading with `.page-header` + `.module-nav`

### public/bmix.html, public/bmix-dsurf.html
- smithjj doesn't have these. Apply smithjj base + enhanced CSS.
- Keep existing bmix/bmix-dsurf-specific selectors.
- Wrap body in `.layout` + sidebars + `.container`
- Replace heading with `.page-header` + `.module-nav`

## Validation Checklist

- [ ] All 8 public/*.html files have `.layout` wrapper
- [ ] All 8 files have `.page-header` with `.module-nav` pills
- [ ] All 8 files include smithjj CSS variables and enhanced styling
- [ ] All 8 files load correctly in browser (no broken CSS)
- [ ] Navigation pills work between all pages
- [ ] Sidebars display ad cards correctly
- [ ] Sidebars hide at <1100px viewport
- [ ] All JavaScript functionality preserved (calculate, presets, etc.)
- [ ] Standalone pages regenerate correctly
- [ ] Tauri app rebuilds and displays correctly
