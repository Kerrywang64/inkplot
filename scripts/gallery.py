#!/usr/bin/env python3
"""
riso-press · gallery page builder
Packs the art.json produced by generate.py into a self-contained HTML gallery.

Usage:
  python3 gallery.py --art art.json --out gallery.html
  python3 gallery.py --art art.json --title "Editions No.2" --sub "Subtitle" --layout quad
"""
import argparse, json, os, sys

TPL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "gallery.tpl.html")


def main():
    ap = argparse.ArgumentParser(description="riso-press gallery builder")
    ap.add_argument("--art", default="art.json")
    ap.add_argument("--out", default="gallery.html")
    ap.add_argument("--title", default="<i>Several</i> ways of saying paper")
    ap.add_argument("--sub", default="Printed entirely by algorithm: halftone, hatching, torn-paper masks, misregistration and paper grain. Not one image asset.")
    ap.add_argument("--brand", default="Pressroom")
    ap.add_argument("--edition", default="Editions № 01")
    ap.add_argument("--layout", choices=["mosaic", "quad", "solo"], default="mosaic")
    a = ap.parse_args()

    if not os.path.exists(TPL):
        sys.exit(f"template not found: {TPL}")
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
    print(f"✓ {len(items)} plates → {a.out}   ({len(html)/1024/1024:.2f} MB)")


if __name__ == "__main__":
    main()
