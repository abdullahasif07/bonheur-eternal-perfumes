#!/usr/bin/env python3
"""
BONHEURETERNAL — static site builder.

Reads src/template.html, expands every
    <!-- @include path/to/fragment.html -->
directive with that file's contents (paths resolved relative to src/),
and writes the result to ./index.html.

Usage:
    python3 build.py            # build once
    python3 build.py --watch    # rebuild on change (stdlib only, polling)
"""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
import time
from pathlib import Path

ROOT      = Path(__file__).resolve().parent
SRC       = ROOT / "src"
TEMPLATE  = SRC / "template.html"
OUTPUT    = ROOT / "index.html"
STYLES    = ROOT / "styles"
SCRIPTS   = ROOT / "scripts"

# Matches: <!-- @include path/to/file.html -->   (leading indent preserved)
INCLUDE_RE = re.compile(
    r"^(?P<indent>[ \t]*)<!--\s*@include\s+(?P<path>[^\s]+)\s*-->\s*$",
    re.MULTILINE,
)

# Matches @import url("./foo.css") or @import "./foo.css" inside CSS files.
CSS_IMPORT_RE = re.compile(
    r'''@import\s+url\(\s*["']?(?P<path>[^"')]+)["']?\s*\)\s*;?''',
    re.MULTILINE,
)

# <link rel="stylesheet" href="styles/main.css" /> — replaced with inline CSS.
LINK_MAIN_CSS_RE = re.compile(
    r'<link\s+rel="stylesheet"\s+href="styles/main\.css"\s*/?>',
)

# <script ... src="scripts/main.js"> — version-stamped so module updates
# always bust the browser cache on rebuild.
SCRIPT_MAIN_JS_RE = re.compile(
    r'(<script[^>]*\bsrc=")scripts/main\.js(")',
)


def render(template_path: Path, seen: set[Path] | None = None) -> str:
    """Recursively expand @include directives inside a template file."""
    seen = seen or set()
    resolved = template_path.resolve()
    if resolved in seen:
        raise RuntimeError(f"circular include detected: {resolved}")
    seen = seen | {resolved}

    text = template_path.read_text(encoding="utf-8")

    def replace(match: re.Match[str]) -> str:
        indent = match.group("indent")
        include_path = (SRC / match.group("path")).resolve()
        if not include_path.exists():
            raise FileNotFoundError(
                f"included file not found: {include_path} "
                f"(from {template_path.relative_to(ROOT)})"
            )
        content = render(include_path, seen)
        # Re-indent each line with the leading whitespace of the directive
        # so nested structure stays readable in the generated file.
        if indent:
            content = "\n".join(
                (indent + line) if line else line
                for line in content.splitlines()
            )
        return content

    return INCLUDE_RE.sub(replace, text)


def inline_css(entry: Path, seen: set[Path] | None = None) -> str:
    """Recursively expand CSS @import directives into a single concatenated string."""
    seen = seen or set()
    resolved = entry.resolve()
    if resolved in seen:
        return ""
    seen = seen | {resolved}

    if not entry.exists():
        raise FileNotFoundError(f"css file not found: {entry}")

    text = entry.read_text(encoding="utf-8")

    def replace(match: re.Match[str]) -> str:
        ref = match.group("path")
        target = (entry.parent / ref).resolve()
        return f"/* ↪ inlined {target.relative_to(ROOT)} */\n" + inline_css(target, seen)

    return CSS_IMPORT_RE.sub(replace, text)


def hash_tree(root: Path, suffixes: tuple[str, ...]) -> str:
    """Short content hash over every file in `root` whose suffix matches."""
    h = hashlib.sha1()
    for p in sorted(root.rglob("*")):
        if p.is_file() and p.suffix in suffixes:
            h.update(p.read_bytes())
    return h.hexdigest()[:8]


def build() -> None:
    if not TEMPLATE.exists():
        raise SystemExit(f"missing template: {TEMPLATE}")

    html = render(TEMPLATE)

    css_bundle = inline_css(STYLES / "main.css")
    html = LINK_MAIN_CSS_RE.sub(
        lambda _m: f'<style>\n{css_bundle}\n</style>',
        html,
        count=1,
    )

    js_version = hash_tree(SCRIPTS, (".js",))
    html = SCRIPT_MAIN_JS_RE.sub(
        lambda m: f"{m.group(1)}scripts/main.js?v={js_version}{m.group(2)}",
        html,
        count=1,
    )

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"built {OUTPUT.relative_to(ROOT)} ({len(html):,} chars) · js v={js_version}")


def iter_sources() -> list[Path]:
    """Files that should trigger a rebuild in watch mode."""
    sources: list[Path] = []
    sources.extend(SRC.rglob("*.html"))
    sources.extend(STYLES.rglob("*.css"))
    sources.extend(SCRIPTS.rglob("*.js"))
    return sources


def watch(poll: float = 0.6) -> None:
    print(f"watching {SRC.relative_to(ROOT)}/ for changes (Ctrl-C to stop)…")
    mtimes: dict[Path, float] = {p: p.stat().st_mtime for p in iter_sources()}
    build()
    try:
        while True:
            time.sleep(poll)
            current = iter_sources()
            changed = False
            for p in current:
                mt = p.stat().st_mtime
                if mtimes.get(p) != mt:
                    mtimes[p] = mt
                    changed = True
            # Detect deletions
            if set(mtimes) - set(current):
                for p in list(mtimes):
                    if p not in current:
                        mtimes.pop(p, None)
                changed = True
            if changed:
                try:
                    build()
                except Exception as e:
                    print(f"build error: {e}", file=sys.stderr)
    except KeyboardInterrupt:
        print("\nstopped.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--watch", action="store_true", help="rebuild on source change")
    args = parser.parse_args()

    try:
        if args.watch:
            watch()
        else:
            build()
    except Exception as e:
        print(f"build failed: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
