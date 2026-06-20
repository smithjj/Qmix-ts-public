#!/usr/bin/env python3
"""
Generate a standalone/ directory containing self-contained HTML files
with all internal links pointing to other .html files in the same directory.

Usage:
    python3 tools/make-standalone.py
"""
import shutil
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public"
STANDALONE_DIR = PROJECT_ROOT / "standalone"

def make_standalone():
    # Clean and recreate directory
    if STANDALONE_DIR.exists():
        shutil.rmtree(STANDALONE_DIR)
    STANDALONE_DIR.mkdir(parents=True)

    # Copy all standalone HTML files
    for src in sorted(PUBLIC_DIR.glob("*.standalone.html")):
        dst = STANDALONE_DIR / src.name
        shutil.copy2(src, dst)

    # Fix links and rename files
    for path in sorted(STANDALONE_DIR.glob("*.standalone.html")):
        text = path.read_text(encoding="utf-8")
        # Replace href="foo.standalone.html" with href="foo.html"
        fixed = re.sub(r'href="([\w-]+)\.standalone\.html"', r'href="\1.html"', text)
        # Also fix any remaining href="foo.html" from the template (already standalone)
        # These should remain as-is since we rename the files

        new_name = path.name.replace(".standalone.html", ".html")
        new_path = STANDALONE_DIR / new_name
        new_path.write_text(fixed, encoding="utf-8")
        path.unlink()
        print(f"  Fixed: {new_name}")

    print(f"\nDone. Standalone files written to: {STANDALONE_DIR}")
    files = list(STANDALONE_DIR.glob("*.html"))
    total_kb = sum(f.stat().st_size for f in files) // 1024
    print(f"Total: {total_kb} KB ({len(files)} files)")

if __name__ == "__main__":
    make_standalone()
