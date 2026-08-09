#!/usr/bin/env python3
"""
riso-press · printmaking collage generator

Design rules (rewritten from what went wrong in v1):
  1. Restraint — two pattern layers per plate at most, and the second must pass
     through a mask that limits its area.
  2. Traceable naming — the title is derived from "primary colour + primary
     structure", never from a random word list.
  3. One subject — one primary structure per plate; the second layer accents it
     and never competes with it.

Usage:
  python3 generate.py --count 24 --out art.json
  python3 generate.py --count 12 --size 720 --palette warm --seed 42
  python3 generate.py --count 6 --pattern rings --contact sheet.png
"""
import argparse, base64, io, json, math, random, sys

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Pillow and numpy are required: pip install pillow numpy")

CANVAS = 900
PAPER = (243, 238, 229)
INK = (26, 24, 21)

# ── Palette: every colour carries a name, and titles are built from it ──────
PAL = {
    "clay":   ((198, 96, 66),   "Clay",   "warm"),
    "rust":   ((163, 63, 45),   "Rust",   "warm"),
    "coral":  ((216, 126, 98),  "Coral",  "warm"),
    "brick":  ((178, 84, 60),   "Brick",  "warm"),
    "ochre":  ((206, 158, 78),  "Ochre",  "warm"),
    "sand":   ((222, 200, 164), "Sand",   "warm"),
    "wine":   ((114, 50, 68),   "Wine",   "warm"),
    "sage":   ((130, 152, 126), "Sage",   "cool"),
    "olive":  ((104, 118, 72),  "Olive",  "cool"),
    "forest": ((54, 82, 66),    "Forest", "cool"),
    "moss":   ((150, 168, 118), "Moss",   "cool"),
    "teal":   ((84, 136, 134),  "Teal",   "cool"),
    "slate":  ((102, 124, 150), "Slate",  "cool"),
    "denim":  ((70, 94, 132),   "Denim",  "cool"),
    "sky":    ((160, 188, 206), "Sky",    "cool"),
    "navy":   ((42, 58, 88),    "Navy",   "cool"),
    "plum":   ((130, 108, 148), "Plum",   "cool"),
    "lilac":  ((170, 158, 192), "Lilac",  "cool"),
}

# ── Patterns: every structure carries a name ────────────────────────────────
def halftone(d, c, R):
    step = R.choice([26, 34, 44])
    ang = R.uniform(0, math.pi)
    for y in range(-CANVAS, CANVAS * 2, step):
        for x in range(-CANVAS, CANVAS * 2, step):
            u = (x * math.cos(ang) + y * math.sin(ang)) / (CANVAS * 1.5)
            r = max(0, 1 - u) * step * 0.52
            if r > 1.4:
                px = x + (step * 0.5 if (y // step) % 2 else 0)
                d.ellipse([px - r, y - r, px + r, y + r], fill=c)

def hatch(d, c, R):
    gap = R.choice([16, 24, 34]); w = R.choice([2, 3, 5])
    a = R.choice([0, 45, -45, 90])
    for i in range(-CANVAS * 2, CANVAS * 2, gap):
        if a == 0:    d.line([(0, i), (CANVAS, i)], fill=c, width=w)
        elif a == 90: d.line([(i, 0), (i, CANVAS)], fill=c, width=w)
        elif a == 45: d.line([(i, 0), (i + CANVAS, CANVAS)], fill=c, width=w)
        else:         d.line([(i, CANVAS), (i + CANVAS, 0)], fill=c, width=w)

def rings(d, c, R):
    cx, cy = R.uniform(.15, .85) * CANVAS, R.uniform(.15, .85) * CANVAS
    gap = R.choice([32, 46, 62])
    for r in range(gap, int(CANVAS * 1.5), gap):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=R.choice([4, 6, 9]))

def scatter(d, c, R):
    for _ in range(R.randint(24, 70)):
        x, y = R.uniform(0, CANVAS), R.uniform(0, CANVAS)
        r = R.uniform(6, 30)
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)

def waves(d, c, R):
    amp = R.uniform(30, 80); f = R.uniform(.005, .013); gap = R.choice([36, 52, 72])
    for y0 in range(-70, CANVAS + 130, gap):
        pts = [(x, y0 + math.sin(x * f + y0 * .01) * amp) for x in range(0, CANVAS + 10, 8)]
        d.line(pts, fill=c, width=R.choice([4, 6, 10]))

def grid(d, c, R):
    n = R.choice([6, 8, 12]); cell = CANVAS / n
    for i in range(n):
        for j in range(n):
            if R.random() < R.uniform(.14, .3):
                d.rectangle([j * cell, i * cell, (j + 1) * cell, (i + 1) * cell], fill=c)

def bars(d, c, R):
    x = 0
    while x < CANVAS:
        w = R.choice([22, 46, 84, 140])
        if R.random() < .5:
            d.rectangle([x, 0, x + w, CANVAS], fill=c)
        x += w

def block(d, c, R):
    k = R.randint(0, 4); m = CANVAS * R.uniform(.08, .2)
    if k == 0:
        d.pieslice([m, m, CANVAS - m, CANVAS - m + CANVAS * .2], 180, 360, fill=c)
        d.rectangle([m, CANVAS * .55, CANVAS - m, CANVAS - m], fill=c)
    elif k == 1:
        d.polygon([(CANVAS / 2, m), (CANVAS - m, CANVAS - m), (m, CANVAS - m)], fill=c)
    elif k == 2:
        d.ellipse([m, m, CANVAS - m, CANVAS - m], fill=c)
    elif k == 3:
        d.pieslice([-CANVAS * .2, m, CANVAS * 1.2, CANVAS * 1.3], 200, 340, fill=c)
    else:
        d.pieslice([m, m, CANVAS - m, CANVAS - m], 0, 180, fill=c)
        d.pieslice([m, m, CANVAS - m, CANVAS - m], 180, 360, fill=c)

def trace(d, c, R):
    x, y = R.uniform(.25, .75) * CANVAS, R.uniform(.25, .75) * CANVAS
    pts = [(x, y)]
    for _ in range(R.randint(6, 12)):
        x += R.uniform(-250, 250); y += R.uniform(-250, 250)
        x, y = max(60, min(CANVAS - 60, x)), max(60, min(CANVAS - 60, y))
        pts.append((x, y))
    d.line(pts, fill=c, width=R.choice([5, 8, 12]), joint="curve")
    for p in pts[::2]:
        r = R.uniform(10, 20)
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=c)

def horizon(d, c, R):
    for _ in range(R.randint(1, 2)):
        e = R.uniform(.25, .8) * CANVAS; amp = R.uniform(0, 55)
        pts = [(x, e + math.sin(x * R.uniform(.002, .007)) * amp) for x in range(0, CANVAS + 10, 10)]
        d.polygon(pts + [(CANVAS, CANVAS), (0, CANVAS)], fill=c)

PATTERNS = {
    "halftone": (halftone, "Halftone"),
    "hatch":    (hatch,    "Hatch"),
    "rings":    (rings,    "Ripple"),
    "scatter":  (scatter,  "Scatter"),
    "waves":    (waves,    "Wave"),
    "grid":     (grid,     "Grid"),
    "bars":     (bars,     "Stripe"),
    "block":    (block,    "Block"),
    "trace":    (trace,    "Trace"),
    "horizon":  (horizon,  "Horizon"),
}

# ── Masks: they cap the area of the second layer, never above roughly 45% ───
def torn_mask(R):
    m = Image.new("L", (CANVAS, CANVAS), 0); d = ImageDraw.Draw(m)
    base = R.choice([
        [(0, CANVAS), (0, CANVAS * .48), (CANVAS, CANVAS * .74), (CANVAS, CANVAS)],
        [(0, 0), (CANVAS, 0), (CANVAS, CANVAS * .38), (0, CANVAS * .6)],
        [(0, 0), (CANVAS * .5, 0), (CANVAS * .26, CANVAS), (0, CANVAS)],
        [(CANVAS, 0), (CANVAS, CANVAS), (CANVAS * .52, CANVAS), (CANVAS * .74, 0)],
    ])
    jag = []
    for k in range(len(base)):
        a, b = base[k], base[(k + 1) % len(base)]
        jag.append(a)
        for t in [i / 15 for i in range(1, 15)]:
            jag.append((a[0] + (b[0] - a[0]) * t + R.uniform(-13, 13),
                        a[1] + (b[1] - a[1]) * t + R.uniform(-13, 13)))
    d.polygon(jag, fill=255)
    return m.filter(ImageFilter.GaussianBlur(1.1))

def band_mask(R):
    m = Image.new("L", (CANVAS, CANVAS), 0); d = ImageDraw.Draw(m)
    if R.random() < .5:
        y = R.uniform(0, CANVAS * .6); h = R.uniform(CANVAS * .16, CANVAS * .4)
        d.rectangle([0, y, CANVAS, y + h], fill=255)
    else:
        x = R.uniform(0, CANVAS * .6); w = R.uniform(CANVAS * .16, CANVAS * .4)
        d.rectangle([x, 0, x + w, CANVAS], fill=255)
    return m

def disc_mask(R):
    m = Image.new("L", (CANVAS, CANVAS), 0); d = ImageDraw.Draw(m)
    cx, cy = R.uniform(.3, .7) * CANVAS, R.uniform(.3, .7) * CANVAS
    r = R.uniform(.2, .38) * CANVAS
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    return m

MASKS = [torn_mask, band_mask, disc_mask]


def riso(im, R, texture=5):
    """Misregistration + paper grain + uneven ink. texture 1-10 sets the strength."""
    t = texture / 5.0
    a = np.array(im).astype(np.int16)
    sh = max(1, round(3 * t))
    dx, dy = R.choice([(sh, 0), (0, sh), (sh, sh), (-sh, sh)])
    a[:, :, 0] = np.roll(np.roll(a[:, :, 0], dy, 0), dx, 1)
    a[:, :, 2] = np.roll(a[:, :, 2], -max(1, sh // 2), 1)
    a = a + np.random.normal(0, 10 * t, (CANVAS, CANVAS, 1))
    yy, xx = np.mgrid[0:CANVAS, 0:CANVAS]
    a = a * (1 - .13 * np.sin(xx / CANVAS * math.pi) * np.cos(yy / CANVAS * math.pi * 1.2))[:, :, None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))


def compose(R, pool, force_pattern=None, dials=None):
    """One plate = ground + primary structure (full frame) + optional secondary
    structure (inside a mask, area-limited).

    dials: (density, contrast, texture), each 1-10
      density   how often a secondary structure appears, and how dense patterns are
      contrast  the minimum brightness gap between ground and primary colour
      texture   misregistration and grain strength (used inside riso())
    """
    D, C, _ = dials or (5, 5, 5)
    pk = force_pattern or R.choice(list(PATTERNS))
    fn, name_p = PATTERNS[pk]

    # Primary colour = the colour of the structure; the title is taken from it
    main_key = R.choice(pool)
    main_rgb, name_c, _ = PAL[main_key]

    # Ground: paper, or a colour from the same pool (the gap widens with contrast)
    gap = 60 + C * 14                      # C=1→74, C=5→130, C=10→200
    if R.random() < .5:
        bg = PAPER
    else:
        cands = [k for k in pool if k != main_key and abs(sum(PAL[k][0]) - sum(main_rgb)) > gap]
        bg = PAL[R.choice(cands)][0] if cands else PAPER

    im = Image.new("RGB", (CANVAS, CANVAS), bg)
    d = ImageDraw.Draw(im)
    fn(d, main_rgb, R)

    # Secondary structure: probability follows density, always masked, and drawn
    # in a third colour or in ink black
    second = None
    if R.random() < D / 12:                # D=1→8%, D=5→42%, D=10→83%
        sk = R.choice([k for k in PATTERNS if k != pk])
        sfn, name_s = PATTERNS[sk]
        sc = INK if R.random() < .4 else PAL[R.choice(pool)][0]
        sub = Image.new("RGB", (CANVAS, CANVAS), bg)
        sfn(ImageDraw.Draw(sub), sc, R)
        im = Image.composite(sub, im, R.choice(MASKS)(R))
        second = name_s

    title = f"{name_c} {name_p}"
    meta = {
        "pattern": pk, "color": main_key,
        "second": second,
        "inks": 3 if second else 2,
    }
    return im, title, meta


def to_uri(im, size, colors):
    q = im.resize((size, size), Image.LANCZOS).convert("P", palette=Image.ADAPTIVE, colors=colors)
    b = io.BytesIO(); q.save(b, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()


def main():
    ap = argparse.ArgumentParser(description="riso-press printmaking collage generator")
    ap.add_argument("--count", type=int, default=24)
    ap.add_argument("--size", type=int, default=560, help="output edge length in px")
    ap.add_argument("--colors", type=int, default=40, help="quantised colour count; lower means a smaller file")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--palette", choices=["all", "warm", "cool"], default="all")
    ap.add_argument("--pattern", choices=list(PATTERNS), default=None, help="lock to a single structure")
    ap.add_argument("--density",  type=int, default=5, choices=range(1,11), metavar="1-10",
                    help="how often a secondary structure appears. low = minimal, high = layered")
    ap.add_argument("--contrast", type=int, default=5, choices=range(1,11), metavar="1-10",
                    help="minimum brightness gap between ground and primary. low = soft, high = strong")
    ap.add_argument("--texture",  type=int, default=5, choices=range(1,11), metavar="1-10",
                    help="misregistration and grain strength. low = clean, high = aged")
    ap.add_argument("--out", default="art.json")
    ap.add_argument("--contact", default=None, help="also write a contact sheet PNG")
    a = ap.parse_args()

    R = random.Random(a.seed)
    np.random.seed(a.seed if a.seed is not None else random.randrange(1 << 30))

    pool = [k for k, v in PAL.items() if a.palette == "all" or v[2] == a.palette]

    dials = (a.density, a.contrast, a.texture)
    items, ims = [], []
    for i in range(a.count):
        im, title, meta = compose(R, pool, a.pattern, dials)
        im = riso(im, R, a.texture)
        ims.append(im)
        items.append({"src": to_uri(im, a.size, a.colors),
                      "title": title, "no": i + 1,
                      "dials": {"density": a.density, "contrast": a.contrast, "texture": a.texture},
                      **meta})

    json.dump(items, open(a.out, "w"), ensure_ascii=False)
    kb = sum(len(x["src"]) for x in items) / 1024
    print(f"✓ {a.count} plates → {a.out}   ≈ {kb/1024:.2f} MB")

    if a.contact:
        cols = min(6, a.count); cell = 240
        rows = (a.count + cols - 1) // cols
        sh = Image.new("RGB", (cols * (cell + 10) + 10, rows * (cell + 10) + 10), PAPER)
        for i, im in enumerate(ims):
            sh.paste(im.resize((cell, cell), Image.LANCZOS),
                     (10 + (i % cols) * (cell + 10), 10 + (i // cols) * (cell + 10)))
        sh.save(a.contact)
        print(f"✓ contact sheet → {a.contact}")


if __name__ == "__main__":
    main()
