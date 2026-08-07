#!/usr/bin/env bash
# riso-press 安装脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/Kerrywang64/taste-ui-design---art/main/skill.sh | bash
set -euo pipefail

REPO="https://github.com/Kerrywang64/taste-ui-design---art.git"
DIR="${1:-riso-press}"

say() { printf '\033[1m%s\033[0m\n' "$*"; }
die() { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

command -v git >/dev/null || die "需要 git"
command -v python3 >/dev/null || die "需要 Python 3.8+"

python3 - <<'PY' || die "缺少依赖。请自行安装：pip install pillow numpy"
import sys
try:
    import PIL, numpy
except ImportError as e:
    sys.exit(1)
PY

say "→ 克隆到 ./$DIR"
[ -d "$DIR" ] && die "目录 $DIR 已存在"
git clone --depth 1 "$REPO" "$DIR" >/dev/null 2>&1
cd "$DIR"

say "→ 生成 6 幅样张验证环境"
python3 scripts/generate.py --count 6 --seed 7 --size 400 --colors 20 \
    --out /tmp/riso-check.json --contact sample.png >/dev/null
rm -f /tmp/riso-check.json

say ""
say "✓ 装好了。样张见 $DIR/sample.png"
say ""
say "  python3 scripts/generate.py --count 24 --seed 7 --contact sheet.png"
say "  python3 scripts/gallery.py --art art.json --out gallery.html"
