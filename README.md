<p align="center">
  <img src="assets/banner.png?v=4" width="100%" alt="inkplot">
</p>

<h1 align="center">inkplot</h1>

<p align="center">
  <b>Abstract images that still mean something.</b><br>
  43 charts · 7 ways to split the frame · 9 materials · no image files, no image model
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1A1815?style=flat-square" alt="MIT"></a>
  <img src="https://img.shields.io/badge/dependencies-0-1A1815?style=flat-square" alt="zero dependencies">
  <img src="https://img.shields.io/badge/charts-43-C66042?style=flat-square" alt="43 charts">
  <img src="https://img.shields.io/badge/image%20model-none-1A1815?style=flat-square" alt="no image model">
</p>

---

<img src="assets/gallery.png?v=4" width="100%" alt="gallery">

---

## Install

```bash
git clone https://github.com/Kerrywang64/inkplot ~/.claude/skills/inkplot
```

```html
<script src="scripts/collage.js"></script>
<script>
  COLLAGE.init({ count: 24, seed: 20260808 });
  document.querySelectorAll('[data-plate]').forEach((el, i) => COLLAGE.attach(el, i));
</script>
```

That is the whole API for normal use. `COLLAGE.meta(i)` returns a label if you want captions.

---

## What this is

inkplot draws editorial artwork: blog headers, card thumbnails, section dividers.

Every image is built from a real chart — pie, histogram, network, Sankey. Abstract, but
never only a pattern. There is something in it to read.

Nothing is downloaded. No image model is called. A canvas draws every layer in a few
hundred milliseconds. Same seed, same picture, pixel for pixel.

---

## The words

Six invented, five borrowed from printing. Everything below uses them bare.

| Word | What it means |
|---|---|
| **plate** | one finished image |
| **ground** | the background colour, corner to corner |
| **field** | a second colour over part of the ground, with a torn edge |
| **specimen** | the chart on top — the part that carries the meaning |
| **skeleton** | how the frame is divided between ground and field |
| **material** | the texture applied to one field |
| halftone | a solid tone printed as a field of small dots |
| registration | each colour is a separate pass on the press; land one a hair off and a sliver of a third colour shows |
| bleed | zoomed past the frame edge, so the frame cuts the image off |
| anti-aliasing | the soft grey pixels a browser paints along an edge |
| luminance | brightness weighted the way the eye sees it — green counts far more than blue |

A plate is a ground, one field, one specimen. Three things. That is the whole recipe.

---

## Why charts and not patterns

Generative patterns fail in a way you cannot see in one image and cannot miss in twenty:
pull any single one out and there is nothing to say about it. It is decoration, and
decoration all looks alike.

A chart is *about* something before it is *shaped* like anything. Proportion. Who is
connected to whom. Which days were busy. Crop it, rotate it, cover half of it — that
survives.

Which is also why these hold up small. At 120 pixels nobody reads detail. They recognise an
outline they already know.

---

## What you get

**43 charts.** Histogram, lollipop, box plot, violin, beeswarm, ridgeline, waffle, pie,
donut, rose, treemap, circle pack, Venn, network, tree, dendrogram, chord, Sankey, arc
diagram, matrix, parallel coordinates, line, area, stream, loss curve, bump, slope,
timeline, spiral, scatter, contour, hexbin, Voronoi, vector field, nebula, calendar
heatmap, embedding projection, attention matrix, top-k, persistence diagram, radar,
ternary, gauge.

**7 skeletons.** Diagonal, vertical split, horizontal split, quartered, inset panel,
scalloped edge, band.

**9 materials.** Film grain, matte, plaster, linen, ink roller, wood grain, brushed metal,
foil, crease.

**A design reference.** Layout patterns, font pairings, a palette with measured contrast
ratios, spacing and motion values, 30+ anti-patterns as *symptom → why it fails → fix*.

**Two scripts that measure the output**, so "this looks wrong" becomes a number.

---

## Three rules

### Three things per plate, then stop

Ground, one field, one specimen.

A fourth thing does not make the picture richer. It makes every plate look like every other
plate: the clutter drowns out the composition, and the composition is the only thing that
differs between them.

### The two colours must be 62 apart in brightness

62 steps on the 0–255 scale, measured as luminance.

The test: print the plate in black and white. Can you still tell it is two colours? If not,
the two areas fight and the image goes muddy. Two mid-tones that look obviously different
on screen fail this constantly. So it is hardcoded. The random number generator does not
get a vote.

### Vary how you draw, not what you draw

One pie chart — rotated, mirrored, zoomed to bleed, redrawn heavier: ten images that do not
look alike.

Ten different charts, each drawn once, same size, same place: ten images that all feel the
same. Only a small shape changed. The layout never did.

So more chart types does not fix repetition. It makes repetition rarer. Transforming each
instance fixes it: rotation, mirror, a crop zoomed to bleed, one of five line treatments.

Full rules in [`SKILL.md`](SKILL.md).

---

## Texture goes in one place

On a press, texture is not spread evenly. Ink pools where two colours meet. Registration
slips and a third colour shows. Paper has a grain. Each happens somewhere specific, and
copying the *placement* is what makes an image read as printed instead of filtered.

Five places. One of them is meant to be noticed.

| Where | What happens | How much |
|---|---|---|
| Where two colours meet | Ink pools on the inner side | Band of 1.2% of the short edge |
| Registration | A sliver of a third colour along the join | Offset 1.2% of the short edge |
| **One field** | **A material — grain, linen, brushed metal…** | **That field only, ~40% of the frame** |
| The chart's ink | Density drifts, fibre eats the edges | Ink pixels only |
| The whole sheet | Paper fibre | Barely visible on purpose |

Row three is the one people see, and the only one that has to stay local. **Grain over the
whole frame cancels itself out.** If everything is textured, nothing is. The effect lives in
the seam between a flat area and a textured one. One textured area per plate, never two.

Two things texture may never do:

- **Cover the chart.** The chart is why the image means anything. inkplot measures how much
  of the chart sits inside that field; over a third, the material goes on the other side.
  Texture belongs beside the subject, not on it.
- **Build a field out of repeated dots.** A dot gradient across a whole colour area is the
  cheapest way to fake print and it is unpleasant up close.

```js
COLLAGE.init({ texture: 3 });      // 0 off · 1 light · 2 mid · 3 heavy (default)
COLLAGE.init({ kit: 'brushed' });  // lock every plate to one material, for review
```

Level 0 is not a broken mode. Flat is correct for interface elements, favicons, and
anything under 80 pixels, where texture is only noise.

---

## Checking the output

```bash
node measure.mjs      # line weight, ink coverage
node diversity.mjs    # how different the plates actually are
```

**Line weight** comes from area divided by edge length. A stroke `l` long and `w` wide
covers `w × l` pixels and has about `2l` pixels of edge, so `w ≈ 2 × area ÷ edge`. The
obvious alternative — measure runs of dark pixels, take the most common length — dies to
anti-aliasing and compression. This does not.

**Diversity** shrinks each plate to 24×24 grey pixels, subtracts the average brightness so
a dark plate and a light plate do not count as different for being dark and light, then
measures every pair. Watch the smallest number. That is your most repetitive pair.

Watch both. Ink coverage is one number, so it can be optimised alone — and that produces
twenty plates that all hit the target and all look the same. That happened here. It is why
the second script exists.

Against 14 editorial illustrations:

| | 25th | median | 75th |
|---|---|---|---|
| Line weight, as a fraction of frame width | 1/80 | 1/106 | 1/122 |
| Share of the page covered in ink | 1.3% | 4.3% | 8.6% |

---

## Your own images instead

```js
COLLAGE.materials([{ img: someImageElement }, ...]);
```

They take the place of the charts. Colour split, torn edges and texture still apply.

What works: cut out or on white; one object, not a scene; black and white or nearly. Colour
comes from the fields. The image only supplies a shape.

---

## License

MIT — use it, fork it, ship it commercially, no permission needed. Halftone screening, torn
edges, dry-media strokes and misregistration are printing traditions in the public domain.
So is the grammar of statistical charts. Output is generated locally, has no training data
behind it, and is free for commercial use.

If inkplot ends up in something you ship, a link back is appreciated — a request, not a
condition. The licence is unmodified MIT and nothing on this page adds to it.
