<p align="center">
  <img src="assets/banner.png?v=3" width="100%" alt="inkplot">
</p>

<h1 align="center">inkplot</h1>

<p align="center">
  <b>Abstract artwork that means something.</b><br>
  43 data-visualization primitives · 7 compositions · zero assets · deterministic from a seed
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1A1815?style=flat-square" alt="MIT"></a>
  <img src="https://img.shields.io/badge/dependencies-0-1A1815?style=flat-square" alt="zero dependencies">
  <img src="https://img.shields.io/badge/specimens-43-C66042?style=flat-square" alt="43 specimens">
  <img src="https://img.shields.io/badge/image%20model-none-1A1815?style=flat-square" alt="no image model">
</p>

---

<img src="assets/gallery.png?v=3" width="100%" alt="gallery">

---

## Install

```bash
git clone https://github.com/Kerrywang64/inkplot ~/.claude/skills/inkplot
```

## Use

```html
<script src="scripts/collage.js"></script>
<script>
  COLLAGE.init({ count: 24, seed: 20260808 });
  document.querySelectorAll('[data-plate]').forEach((el, i) => COLLAGE.attach(el, i));
</script>
```

That is the whole API surface for basic use. `COLLAGE.meta(i)` returns
`{ skeleton, viz, zh, en, screened }` if you want captions.

---

## Why data visualizations

Generative abstract patterns fail for one reason: pull any single frame out and it means
nothing. A pie chart means proportion. An attention matrix means what a model looked at.
A persistence diagram means topological features that survived.

The image is legible at 120px because the underlying form is a real chart.

---

## What you get

**43 specimens.** Histogram, box plot, violin, beeswarm, ridgeline, waffle, pie, donut,
rose, treemap, circle pack, Venn, network, tree, dendrogram, chord, Sankey, arc diagram,
matrix, parallel coordinates, line, area, stream, loss curve, bump, slope, timeline,
spiral, scatter, contour, hexbin, Voronoi, vector field, nebula, calendar heatmap,
embedding projection, attention matrix, top-k, persistence diagram, radar, ternary, gauge.

**7 compositions.** Diagonal, vertical split, horizontal split, quadrant, inset, scallop, band.

**A design-decision library.** Layout skeletons, font pairings, a palette with measured
WCAG contrast, spacing and motion tokens, 30+ anti-patterns.

**Two self-check scripts.** Turn "looks wrong" into a number you can compare.

---

## Self-check

```bash
node measure.mjs      # stroke weight + ink coverage
node diversity.mjs    # pairwise structural distance
```

Stroke weight is estimated by **area-to-edge ratio**: a stroke of length `l` and width `w`
has area `w·l` and about `2l` edge pixels, so `w ≈ 2·area ÷ edge`. Robust against
antialiasing and compression noise, unlike run-length mode.

Diversity downsamples each plate to 24×24, subtracts the mean to strip ground brightness,
and takes pairwise L2 distance. **Optimizing ink coverage alone silently destroys
diversity.** Both numbers have to be watched together.

Measured against 14 line-art editorial illustrations:

| | q25 | median | q75 |
|---|---|---|---|
| Stroke weight, 1/N of frame width | 80 | 106 | 122 |
| Ink coverage % | 1.3 | 4.3 | 8.6 |

---

## Three rules that are enforced in code

**Three elements per plate.** Ground, one color field, one specimen. A fourth element does
not add richness — it hides the structural difference between plates.

**Luminance delta ≥ 62 between color fields.** Two colors of similar lightness splitting a
frame fight each other. Hardcoded, not left to chance.

**Variation comes from instances, not inventory.** One specimen appearing ten times in ten
different forms beats ten specimens appearing once. Every instance gets rotation, mirror,
zoom-to-bleed crop, and one of five stroke modes. Adding specimens only lowers the
frequency of repetition — it does not fix repetition.

Full rules in [`SKILL.md`](SKILL.md).

---

## Bring your own material

```js
COLLAGE.materials([{ img: someImageElement }, ...]);
```

Your images replace the specimens. Field splitting, torn edges, and halftone screening
still apply.

---

## License

MIT. Halftone screening, torn edges, dry-media strokes, and misregistration are public
domain printing traditions. The grammar of statistical graphics is likewise public domain.
Output is generated locally with no training-data provenance and is free for commercial use.
