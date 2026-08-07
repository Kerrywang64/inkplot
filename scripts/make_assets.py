#!/usr/bin/env python3
"""生成 README 用的展示图（确定性，同种子同结果）。

    python3 scripts/make_assets.py

产出 assets/banner.png 与 assets/sheet.png。CI 会自动跑这个并提交回仓库，
所以改了图案或色板之后，README 的展示图会自己跟着更新。
"""
import base64, io, json, os, subprocess, sys

try:
    from PIL import Image
except ImportError:
    sys.exit("需要 Pillow：pip install pillow numpy")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets")
PAPER = (241, 236, 227)
SEED = "1024"          # 固定，换了这个展示图就会变


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

    # 横幅：6 张一排
    cell, gap = 112, 8
    b = Image.new("RGB", (6 * cell + 7 * gap, cell + 2 * gap), PAPER)
    for i in range(6):
        b.paste(px(art[i]).resize((cell, cell), Image.LANCZOS), (gap + i * (cell + gap), gap))
    b.convert("P", palette=Image.ADAPTIVE, colors=16).save(
        os.path.join(OUT, "banner.png"), optimize=True)

    # 联系样张：12 张 6×2
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
