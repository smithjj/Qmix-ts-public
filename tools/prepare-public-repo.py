#!/usr/bin/env python3
"""
Prepare a public version of the Qmix TypeScript project by removing
all BMix content and the scan.html page.

Usage:
    python3 tools/prepare-public-repo.py ../Qmix-ts-public
"""
import shutil
import sys
from pathlib import Path

SRC = Path("/Users/jesse/Documents/GitHub/typsescript_qmix")
DST = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/Users/jesse/Documents/GitHub/Qmix-ts-public")

# Files and directories to completely remove
REMOVE = [
    # Source files
    "src/qmix/bmix.ts",
    "src/qmix/bmix-dsurf.ts",
    # Public pages
    "public/bmix.html",
    "public/bmix.standalone.html",
    "public/bmix-dsurf.html",
    "public/bmix-dsurf.standalone.html",
    "public/scan.html",
    "public/scan.standalone.html",
    # Tests and fixtures
    "test/bmix-golden.test.ts",
    "fixtures/bmix-golden.json",
    # MATLAB tools and examples
    "snlo_bmix_func.m",
    "example_script_bmix.m",
    "BI_NL.m",
    "Bmix.dat",
    "tools/check_bmix_order.mjs",
    "tools/generate_bmix_golden.m",
    "tools/tauri-prebuild/bmix.standalone.html",
    "tools/tauri-prebuild/bmix-dsurf.standalone.html",
    "tools/tauri-prebuild/scan.html",
    "tools/tauri-prebuild/scan.standalone.html",
    # Generated docs for bmix
    "typedoc-api/functions/qmix_bmix.calculateBmix.html",
    "typedoc-api/modules/qmix_bmix.html",
    "typedoc-api/interfaces/qmix_bmix.BmixInput.html",
    "typedoc-api/interfaces/qmix_bmix.BmixRow.html",
    # Standalone dir (will be regenerated)
    "standalone",
]

# Files to remove bmix content from (edit in place)
EDIT_FILES = [
    "package.json",
    "src/index.ts",
    "src/standalone-entry.ts",
    "src/server.ts",
    "src/cli.ts",
    "src/tui.ts",
    "README.md",
    "tools/build-standalone.mjs",
]


def should_copy(rel_path: str) -> bool:
    """Return False for files/dirs that should be excluded."""
    for pat in REMOVE:
        if rel_path == pat or rel_path.startswith(pat + "/"):
            return False
    # Skip generated/CI files
    skip_prefixes = [
        "node_modules/",
        "dist/",
        ".git/",
        "src-tauri/target/",
        "src-tauri/gen/",
    ]
    for p in skip_prefixes:
        if rel_path.startswith(p):
            return False
    return True


def copy_tree():
    """Copy source tree to destination, excluding removed files."""
    for src_path in SRC.rglob("*"):
        rel = src_path.relative_to(SRC).as_posix()
        if not should_copy(rel):
            continue
        dst_path = DST / rel
        if src_path.is_dir():
            dst_path.mkdir(parents=True, exist_ok=True)
        else:
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_path, dst_path)


def clean_file(path: Path) -> bool:
    """Remove bmix/scan references from a source file. Returns True if modified."""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    new_lines = []
    skip_block = False
    modified = False

    for line in lines:
        lower = line.lower()

        # Skip import/export lines mentioning bmix
        if "bmix" in lower or "b_mix" in lower:
            if line.strip().startswith(("import", "export")):
                modified = True
                continue
            if "calculateBmix" in line or "bmixDsurf" in line:
                modified = True
                continue

        # Skip bmix API endpoints in server.ts
        if '"/api/bmix' in line:
            skip_block = True
            modified = True
            continue
        if skip_block:
            if line.strip() == "});" or (line.strip().startswith("app.") and "/api/bmix" not in lower):
                skip_block = False
            elif line.strip().startswith("app."):
                skip_block = False
            else:
                continue

        # Skip scan.html references in comments/docstrings
        if "scan.html" in lower and line.strip().startswith("*"):
            modified = True
            continue

        new_lines.append(line)

    if modified:
        path.write_text("".join(new_lines), encoding="utf-8")
    return modified


def clean_package_json(path: Path):
    """Remove scripts and dependencies related to bmix/scan."""
    text = path.read_text(encoding="utf-8")
    # Remove "scan" from docs script list
    text = text.replace(' src/qmix/bmix.ts src/qmix/bmix-dsurf.ts', '')
    path.write_text(text, encoding="utf-8")


def clean_build_standalone(path: Path):
    """Remove bmix and scan from standalone generation."""
    text = path.read_text(encoding="utf-8")
    text = text.replace('generateStandalone("bmix");\n', '')
    text = text.replace('generateStandalone("bmix-dsurf");\n', '')
    text = text.replace('generateStandalone("scan");\n', '')
    path.write_text(text, encoding="utf-8")


def remove_sidebar_links(path: Path):
    """Remove bmix-dsurf link from bmix.html page-header nav in public pages."""
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    # The bmix pages won't exist, so no need to clean nav in them
    # But other pages may still reference bmix-dsurf in the header module-nav
    # Actually the nav only has: Qmix, Compare, QPM, Refractive index, Custom crystals
    # So no bmix links there. Skip.


def main():
    print(f"Preparing public repo at: {DST}")
    print("Copying files...")
    copy_tree()

    print("Cleaning source files...")
    for rel in EDIT_FILES:
        path = DST / rel
        if path.exists():
            if rel == "package.json":
                clean_package_json(path)
            elif rel == "tools/build-standalone.mjs":
                clean_build_standalone(path)
            else:
                clean_file(path)
            print(f"  Cleaned: {rel}")

    # Also remove scan references in public pages that remain
    for page in ["index.html", "compare.html", "qpm.html", "refractive-index.html", "custom.html"]:
        for variant in [page, page.replace(".html", ".standalone.html")]:
            path = DST / "public" / variant
            if path.exists():
                text = path.read_text(encoding="utf-8")
                # Remove scan link from top-nav or module-nav
                # These are simple text matches
                if "scan.html" in text.lower():
                    text = text.replace('      <a href="scan.html">Scan</a>\n', '')
                    text = text.replace('      <a href="scan.standalone.html">Scan</a>\n', '')
                    path.write_text(text, encoding="utf-8")
                    print(f"  Removed scan link from public/{variant}")

    print("\nDone. Verify the output with:")
    print(f"  cd {DST} && git status")


if __name__ == "__main__":
    main()
