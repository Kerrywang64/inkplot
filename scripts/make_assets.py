#!/usr/bin/env python3
"""Render the showcase images used by the README (deterministic: same seed, same result).

    python3 scripts/make_assets.py

Writes assets/banner.png and assets/sheet.png. CI runs this and commits the result
back, so once a pattern or the palette changes, the README images follow on their own.
"""
import base64, io, json, os, subprocess, sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip install pillow numpy")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets")
PAPER = (241, 236, 227)
SEED = "1024"          # fixed; change this and the showcase images change


def build():
    tmp = os.path.join(ROOT, ".assets-tmp.json")
    subprocess.run([sys.executable, os.path.join(HERE, "generate.py"),
                    "--count", "18", "--seed", SEED, "--size", "400",
                    "--colors", "24", "--out", tmp],
                   check=True, stdout=subprocess.DEVNULL)
    art = [a["src"] for a in json.load(open(tmp))]
    os.remove(tmp)

    def px(u):
        return Image.open(io.BytesIO(base64.b64decode(u.split(",")[1]))).convert("RGB")

    os.makedirs(OUT, exist_ok=True)

    # Banner: six in a row
    cell, gap = 112, 8
    b = Image.new("RGB", (6 * cell + 7 * gap, cell + 2 * gap), PAPER)
    for i in range(6):
        b.paste(px(art[i]).resize((cell, cell), Image.LANCZOS), (gap + i * (cell + gap), gap))
    b.convert("P", palette=Image.ADAPTIVE, colors=16).save(
        os.path.join(OUT, "banner.png"), optimize=True)

    # Contact sheet: twelve, 6×2
    cell, gap = 92, 6
    s = Image.new("RGB", (6 * cell + 7 * gap, 2 * cell + 3 * gap), PAPER)
    for i in range(12):
        s.paste(px(art[i + 3]).resize((cell, cell), Image.LANCZOS),
                (gap + (i % 6) * (cell + gap), gap + (i // 6) * (cell + gap)))
    s.convert("P", palette=Image.ADAPTIVE, colors=16).save(
        os.path.join(OUT, "sheet.png"), optimize=True)

    for f in ("banner.png", "sheet.png"):
        p = os.path.join(OUT, f)
        print(f"✓ assets/{f}  {os.path.getsize(p) // 1024} KB")


if __name__ == "__main__":
    build()
