#!/usr/bin/env bash
# riso-press install script
# Usage: curl -fsSL https://raw.githubusercontent.com/Kerrywang64/inkplot/main/skill.sh | bash
set -euo pipefail

REPO="https://github.com/Kerrywang64/taste-ui-design---art.git"
DIR="${1:-riso-press}"

say() { printf '\033[1m%s\033[0m\n' "$*"; }
die() { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

command -v git >/dev/null || die "git is required"
command -v python3 >/dev/null || die "Python 3.8+ is required"

python3 - <<'PY' || die "Missing dependencies. Install them yourself: pip install pillow numpy"
import sys
try:
    import PIL, numpy
except ImportError as e:
    sys.exit(1)
PY

say "-> cloning into ./$DIR"
[ -d "$DIR" ] && die "directory $DIR already exists"
git clone --depth 1 "$REPO" "$DIR" >/dev/null 2>&1
cd "$DIR"

say "-> rendering 6 sample plates to verify the environment"
python3 scripts/generate.py --count 6 --seed 7 --size 400 --colors 20 \
    --out /tmp/riso-check.json --contact sample.png >/dev/null
rm -f /tmp/riso-check.json

say ""
say "OK. Samples written to $DIR/sample.png"
say ""
say "  python3 scripts/generate.py --count 24 --seed 7 --contact sheet.png"
say "  python3 scripts/gallery.py --art art.json --out gallery.html"
