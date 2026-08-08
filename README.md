<p align="center">
  <img src="assets/banner.png?v=4" width="100%" alt="inkplot">
</p>

<h1 align="center">inkplot</h1>

<p align="center">
  <b>Abstract images that still mean something.</b><br>
  43 kinds of chart · 7 ways to split the frame · 9 materials · no image files, no image model
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

## What this is

inkplot draws the kind of artwork that sits at the top of a blog post, on a card thumbnail,
or between sections of a long page. Editorial artwork — abstract, printed-looking, a bit
severe.

The difference from most generative art is that every image is built out of a **real
chart**. A pie chart, a histogram, a network diagram, a Sankey flow. So the result is
abstract, but it is never only a pattern. There is something in it to read.

Nothing gets downloaded and no image model gets called. A browser `<canvas>` draws every
layer in a few hundred milliseconds. Hand it the same seed number twice and you get back
the same picture, pixel for pixel.

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

That is the whole API for normal use. `COLLAGE.meta(i)` hands back a label for each image
if you want captions.

---

## Six words this project uses

Everything below depends on these. They are the only invented words in the documentation.

| Word | What it means |
|---|---|
| **plate** | one finished image |
| **ground** | the background colour, filled corner to corner |
| **field** | a second colour laid over part of the ground, with a torn-paper edge |
| **specimen** | the chart drawn on top — the part that carries the meaning |
| **skeleton** | how the frame gets divided between ground and field: diagonally, split down the middle, a horizontal band, and four more |
| **material** | the texture applied to one field: film grain, linen, brushed metal, and six more |

So a plate is a ground, one field on top of it, and one specimen on top of that. Three
things. That is the entire recipe.

---

## Why charts instead of random patterns

Generative abstract art has a failure mode that is hard to see in one image and obvious in
twenty: pull any single picture out of the set and there is nothing to say about it. It is
decoration, and decoration all looks alike.

A chart does not have that problem, because a chart is *about* something before it is
*shaped* like anything. A pie chart is about proportion. A network diagram is about who is
connected to whom. A calendar heatmap is about which days were busy. Crop it, rotate it,
cover half of it with a colour field — the shape still carries that.

This is also why the images survive being shrunk. At 120 pixels wide you are not reading
detail, you are recognising a silhouette you already know.

---

## What you get

**43 charts.** Histogram, lollipop, box plot, violin, beeswarm, ridgeline, waffle, pie,
donut, rose, treemap, circle pack, Venn, network, tree, dendrogram, chord, Sankey, arc
diagram, matrix, parallel coordinates, line, area, stream, loss curve, bump, slope,
timeline, spiral, scatter, contour, hexbin, Voronoi, vector field, nebula, calendar
heatmap, embedding projection, attention matrix, top-k, persistence diagram, radar,
ternary, gauge.

**7 skeletons.** Diagonal, split vertically, split horizontally, quartered, inset panel,
scalloped edge, horizontal band.

**9 materials.** Film grain, matte, plaster, linen, ink roller, wood grain, brushed metal,
foil, crease.

**A design reference.** Layout patterns, font pairings, a colour palette with contrast
ratios that were actually measured, spacing and motion values, and 30-plus things not to
do — each written as *symptom → why it fails → what to do instead*.

**Two scripts that measure your own output**, so "this looks wrong" can become a number you
can compare against last week's number.

---

## Three rules, and the reason each one exists

### A plate gets three things and then stops

Ground, one field, one specimen. Nothing else.

The temptation is always to add a fourth thing — one more shape, one more line, one more
colour. It never makes the picture richer. It makes every plate look like every other
plate, because the added clutter drowns out the one thing that actually differs between
them, which is the composition underneath.

### The two colours must be far apart in brightness

Specifically 62 steps apart on the 0–255 scale.

The test worth keeping in your head: **print the plate in black and white. Can you still
tell it is two colours?** If not, the two areas fight each other and the picture goes
muddy — this happens constantly with two mid-tone colours that look different on screen but
are the same weight. The rule is enforced in code. The random number generator does not get
a vote on it.

### Vary how you draw, not what you draw

Take one pie chart. Rotate it. Mirror it. Zoom in until it runs off the edge of the frame.
Redraw its lines heavier. You now have ten images that do not look alike.

Now take ten *different* charts and draw each one once, always the same size, always in the
same place. You get ten images that all feel the same, because the only thing that changed
was a small shape in the middle of an unchanged layout.

That is why adding more chart types does not fix repetition — it only makes repetition
rarer. What fixes repetition is transforming every instance: rotation, mirroring, a
zoomed-in crop, one of five line treatments.

Full rules in [`SKILL.md`](SKILL.md).

---

## Texture goes in one place, not everywhere

On a real press, texture is not spread evenly. Ink pools where two colours meet. The plate
lands slightly off-register and a sliver of a third colour shows. The paper has a grain you
can barely see. Each of those happens somewhere specific, and copying the *placement* is
what makes an image read as printed rather than as filtered.

So inkplot puts texture in five places, and only one of them is meant to be noticed:

| Where | What happens | How much |
|---|---|---|
| Where two colours meet | Ink pools on the inner side | A band 1.2% of the short edge |
| Registration | The colour lands off-mark, a sliver of a third colour shows | Offset 1.2% of the short edge |
| **One field** | **A material — grain, linen, brushed metal…** | **That field only, about 40% of the frame** |
| The chart's own ink | Density drifts, paper fibre eats the edges | Only where there is ink |
| The whole sheet | Paper fibre | Barely visible on purpose |

The third row is the one people see, and it is the one that has to stay local. **A grain
layer over the whole image cancels itself out** — if everything is textured, nothing is.
The effect lives in the seam between a flat area and a textured one. One textured area per
plate, never two.

Two rules the texture is never allowed to break:

- **Never cover the chart.** The chart is the reason the image means anything. Before
  placing a material, inkplot measures how much of the chart sits inside that field, and if
  it is more than a third, the material goes on the other side instead. Texture belongs
  beside the subject, not on top of it.
- **Never build a field out of repeated dots.** A dot-screen gradient across a whole colour
  area is the cheapest way to fake print, and it is unpleasant to look at close up.

```js
COLLAGE.init({ texture: 3 });      // 0 off · 1 light · 2 mid · 3 heavy (default)
COLLAGE.init({ kit: 'brushed' });  // lock every plate to one material, for reviewing
```

Level 0 is not a broken mode. Flat output is the right answer for interface elements,
favicons, and anything under 80 pixels, where texture is just noise.

---

## Checking your own output

```bash
node measure.mjs      # line weight and how much ink is on the page
node diversity.mjs    # how different the plates actually are from each other
```

**Line weight** is worked out from area divided by edge length. A stroke that is `l` long
and `w` wide covers `w × l` pixels and has about `2l` pixels of edge, so `w ≈ 2 × area ÷
edge`. The obvious alternative — measuring runs of dark pixels and taking the most common
length — gets ruined by anti-aliasing and JPEG artefacts. This one does not.

**Diversity** shrinks each plate to 24×24 grey pixels, subtracts the average brightness so
that a dark plate and a light plate aren't counted as different just for being dark and
light, and then measures the distance between every pair. The number to watch is the
*smallest* distance, because that is your most repetitive pair.

Watch both numbers together. Ink coverage is a single number, which means it can be
optimised on its own — and if you do that, you end up with twenty plates that all hit the
target and all look identical. That happened here. It is why the second script exists.

Measured against 14 editorial illustrations for comparison:

| | 25th pct | median | 75th pct |
|---|---|---|---|
| Line weight, as a fraction of frame width | 1/80 | 1/106 | 1/122 |
| Share of the page covered in ink | 1.3% | 4.3% | 8.6% |

---

## Using your own images instead

```js
COLLAGE.materials([{ img: someImageElement }, ...]);
```

Your images take the place of the charts. Everything else still happens: the colour split,
the torn edges, the texture.

What works: something cut out or on a white background, a single object rather than a
scene, black and white or nearly so. The colour comes from the fields — your image only
needs to supply a shape.

---

## License

MIT — use it, fork it, ship it commercially, no permission needed. Halftone screening, torn
edges, dry-media strokes and misregistration are printing traditions in the public domain,
and the grammar of statistical charts is public domain too. Output is generated on your own
machine, has no training data behind it, and is free for commercial use.

If inkplot ends up in something you ship, a link back is appreciated — but that is a
request, not a condition. The licence is unmodified MIT and nothing on this page adds to it.
