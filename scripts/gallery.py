#!/usr/bin/env python3
"""
riso-press · 画廊页构建器
把 generate.py 产出的 art.json 装进一个自包含的 HTML 画廊。

用法:
  python3 gallery.py --art art.json --out gallery.html
  python3 gallery.py --art art.json --title "Editions No.2" --sub "副标题" --layout quad
"""
import argparse, json, os, sys

TPL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "gallery.tpl.html")


def main():
    ap = argparse.ArgumentParser(description="riso-press 画廊构建器")
    ap.add_argument("--art", default="art.json")
    ap.add_argument("--out", default="gallery.html")
    ap.add_argument("--title", default="纸的<i>若干</i>种说法")
    ap.add_argument("--sub", default="全部由算法印制：半调、排线、撕纸遮罩、套印错位与纸张颗粒。无一张图片素材。")
    ap.add_argument("--brand", default="Pressroom")
    ap.add_argument("--edition", default="Editions № 01")
    ap.add_argument("--layout", choices=["mosaic", "quad", "solo"], default="mosaic")
    a = ap.parse_args()

    if not os.path.exists(TPL):
        sys.exit(f"找不到模板：{TPL}")
    items = json.load(open(a.art, encoding="utf-8"))

    html = open(TPL, encoding="utf-8").read()
    for k, v in {
        "__ART__": json.dumps(items, ensure_ascii=False),
        "__TITLE__": a.title,
        "__SUB__": a.sub,
        "__BRAND__": a.brand,
        "__EDITION__": a.edition,
        "__LAYOUT__": a.layout,
    }.items():
        html = html.replace(k, v)

    open(a.out, "w", encoding="utf-8").write(html)
    print(f"✓ {len(items)} 幅 → {a.out}   ({len(html)/1024/1024:.2f} MB)")


if __name__ == "__main__":
    main()
