---
name: inkplot
description: Draws editorial abstract artwork in the browser out of real charts — pie, histogram, network, Sankey, Voronoi, attention matrix and 37 more — laid over flat colour fields with print texture. No image files, no image model, no network; the same seed always gives the same picture. Also ships a design reference (layout patterns, font pairings, a palette with measured contrast ratios, spacing and motion values, 30+ anti-patterns) and two scripts that measure generated artwork instead of guessing at it. Use when the user needs blog headers, card thumbnails, section dividers, placeholder art, or an editorial or magazine visual system; when they ask whether a colour pair passes contrast, which fonts to pair, or what spacing scale to use; or when generated artwork keeps coming out repetitive and needs measuring rather than eyeballing.
license: MIT
---

# inkplot

Abstract artwork that still means something. Every image is built from a real chart, so it
reads as information rather than decoration.

No image model. No asset files. No network. A canvas draws every layer. Same seed, same
picture, every time.

---

## Quick start

```html
<script src="scripts/collage.js"></script>
<script>
  COLLAGE.init({ count: 24, seed: 20260808 });
  document.querySelectorAll('[data-plate]').forEach((el, i) => COLLAGE.attach(el, i));
</script>
```

```bash
node measure.mjs      # line weight, ink coverage, against a measured baseline
node diversity.mjs    # how different the plates actually are
```

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

A plate is a ground, one field, one specimen. Three things, and the cap is a rule.

```
ground → field with torn edge → specimen → halftone (rarely) → dry stroke → paper fibre
```

| Layer | What it does |
|---|---|
| Ground | Flat saturated colour, corner to corner |
| Field | One of 7 skeletons, torn edge, brightness gap of 62 enforced |
| Specimen | One of 43 charts, filling 55–75% of its slot |
| Halftone | Only for charts that are a solid fill to begin with |
| Dry stroke | One heavy line, dragging like charcoal on rough paper. 62% of plates get none |
| Paper fibre | Barely visible, whole sheet |

---

## Why charts and not patterns

Generative patterns fail in a way you cannot see in one image and cannot miss in twenty:
pull any single one out and there is nothing to say about it.

A chart is *about* something before it is *shaped* like anything. Proportion. What a model
looked at. Which days were busy. Crop it, rotate it, cover half of it — that survives.

Which is also why these hold up small. At 120 pixels nobody reads detail. They recognise an
outline they already know.

---

## The 43 charts

| Family | Charts |
|---|---|
| Distribution | histogram · lollipop · box plot · violin · beeswarm · ridgeline · waffle |
| Proportion | pie · donut · rose · treemap · circle pack · Venn |
| Relationship | network · tree · dendrogram · chord · Sankey · arc diagram · matrix · parallel coordinates |
| Over time | line · area · stream · loss curve · bump · slope · timeline · spiral |
| Space | scatter · contour · hexbin · Voronoi · vector field · nebula · calendar heatmap |
| Machine learning | embedding projection · attention matrix · top-k · persistence diagram · radar · ternary · gauge |

## The 7 skeletons

`diagonal` · `vsplit` · `hsplit` · `quad` · `inset` · `scallop` · `band`

---

## API

| Call | What it does |
|---|---|
| `COLLAGE.init({ count, seed, scale, texture, kit })` | Works out every plate up front. Returns itself |
| `COLLAGE.attach(el, i)` | Draws plate `i` into an `<img>` or a container |
| `COLLAGE.render(i, scale)` | Returns a `<canvas>` |
| `COLLAGE.meta(i)` | `{ skeleton, viz, name, screened, kit, kitName }` — for captions |
| `COLLAGE.materials([{ img }])` | Swaps the charts for your own cut-out images |
| `COLLAGE.kits()` | The material names |

---

## The rules

Enforced in code, not suggested.

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

### Bold colour, once per plate

Thirty colours in six families: earth, green, teal-blue, purple-pink, one loud accent
family, neutral. Pick a family for the ground, then jump families for the second colour
about a third of the time. Never two loud colours in one plate.

### Measure, do not guess

"It looks wrong but I can't say why" is the most expensive place to be. You cannot tell
whether a change helped.

`measure.mjs` gets line weight from **area divided by edge length**. A stroke `l` long and
`w` wide covers `w × l` pixels and has about `2l` pixels of edge, so `w ≈ 2 × area ÷ edge`.
The obvious alternative — measure runs of dark pixels, take the most common length — dies
to anti-aliasing and compression. This does not.

`diversity.mjs` shrinks each plate to 24×24 grey pixels, subtracts the average brightness
so a dark plate and a light plate do not count as different for being dark and light, then
measures every pair. Watch the smallest number. That is your most repetitive pair.

Watch both. Ink coverage is one number, so it can be optimised alone — and that produces
twenty plates that all hit the target and all look the same. That happened here. It is why
the second script exists.

### Reproducible beats surprising

Same seed plus same settings, identical picture. "Run it again, it might come out better"
is a lottery, not a process.

---

## Texture has an address

On a press, texture is not spread evenly. Ink pools where two colours meet. Registration
slips and a third colour shows. Paper has a grain. Each happens somewhere specific, and
copying the *placement* is what makes an image read as printed instead of filtered.

| Where | What happens | How much | How often |
|---|---|---|---|
| Where two colours meet | Ink pools on the inner side | Band of 1.2% of the short edge, clipped inside the field | Every plate with a field |
| Registration | A sliver of a third colour along the join | Offset 1.2% of the short edge × level | Every plate with a field |
| **One field** | **A material from the library below** | **That field only, ~40% of the frame** | **26 / 42 / 66% of plates, by level** |
| The chart's ink | Density drifts, fibre eats the edges | Ink pixels only | Every plate |
| Whole sheet | Paper fibre | Everywhere | A swing of 3 levels out of 255 |

**Row three is the only one anybody notices, and the only one that has to stay local.**
Grain over the whole frame cancels itself out. If everything is textured, nothing is. The
effect lives in the seam between a flat area and a textured one. One textured area per
plate, never two.

### The material library

Nine materials, every one computed, no bitmaps. Each is two layers: one that darkens, one
that adds light. Keeping them separate is the whole trick — **metal without a highlight is
grey noise, and matte with a highlight is not matte.**

| Material | What it looks like | Highlight |
|---|---|---|
| `grit` | Film grain. The low-frequency clumping carries it; the fine speckle is only surface | — |
| `matte` | Very fine, very even, low contrast. Powder coating | — |
| `plaster` | Broad soft patches, fine pitting on top | — |
| `linen` | Two crossed ridge patterns, wobbled so they do not shimmer against each other | — |
| `roller` | Horizontal drag marks, plus density bands at the roller's circumference | — |
| `vein` | Wood grain. Noise bends the coordinates before the stripes are drawn, so they wander | — |
| `brushed` | Brushed metal. Streaks stretched about 80:1 along one axis, one broad sheen | yes |
| `foil` | Two or three smooth angled bands of reflection, paper fibre over the top | yes |
| `crease` | Folded paper. Distance to a few fold lines: dark one side, light the other | yes |

`foil` and `crease` carry that fibre layer on purpose. A perfectly smooth gradient slides
into looking like a shiny 3D reflection, which is a different medium.

```js
COLLAGE.init({ texture: 3 });      // 0 off · 1 light · 2 mid · 3 heavy (default)
COLLAGE.init({ kit: 'brushed' });  // lock every plate to one material, for review
COLLAGE.meta(i).kitName            // which material this plate used
```

Level 0 is not a broken mode. Flat is correct for interface elements, favicons, and
anything under 80 pixels, where texture is only noise.

### Two things texture may never do

**Cover the chart.** The chart is why the plate means anything. Before placing a material,
measure how much of the chart's slot falls inside that field. Over a third, put the
material on the other side, then soft-erase the slot from the mask as a backstop. Texture
belongs beside the subject, not on it — which is where it sits in the reference material
this style comes from.

**Build a field out of repeated dots.** A dot gradient across a whole colour area is the
cheapest way to fake print and it is unpleasant up close. Halftone is reserved for charts
that are a continuous fill to begin with: `nebula`, `stream`, `area`. Screen a matrix, a
calendar or a waffle and a grid of cells becomes a grid of dots. Screen a contour or a
scatter and the lines break into dashes. The chart is gone.

### Two things that shipped and looked wrong

- **Do not erase transparency to fake uneven ink.** Holes punched in a solid colour let the
  background through in clouds. That reads as mould, not print. Vary brightness inside the
  ink instead. Never touch transparency on a solid.
- **Do not darken a colour with grey noise.** Grey pulls the colour out and the area goes
  dirty. Blend from white toward *that colour mixed halfway to ink*, then darken with it.
  Same colour, more ink.

### One thing to get right when changing the dial

The texture level must change nothing but texture. Same seed at level 0 and level 3, same
composition, same colours, same chart in the same place. Otherwise there is no way to judge
what the dial did.

In practice: **draw every random number unconditionally**, whether or not the current level
uses it. A skipped draw inside an `if` shifts everything downstream and silently produces a
different picture.

---

## Baselines

Against 14 editorial illustrations.

| | 25th | median | 75th |
|---|---|---|---|
| Line weight, as a fraction of frame width | 1/80 | 1/106 | 1/122 |
| Share of the page covered in ink | 1.3% | 4.3% | 8.6% |

Two plates using the same chart should be no closer than two plates using different charts.
`measure.mjs` prints your numbers next to these.

---

## Design reference

Separate from the artwork. Read before building an interface, not during.

| File | What is in it |
|---|---|
| `references/design-system.md` | Named colour values with measured contrast ratios, font pairings, type and spacing scales, motion values, 6 layout patterns, a delivery checklist |
| `references/anti-patterns.md` | 30+ prohibitions, each as *symptom → why it fails → fix* |

The five broken most often:

1. **Clay `#C66042` is never a body link or a button fill.** 3.53:1 on paper, 4.08:1 for
   white text on it. Both under the 4.5:1 minimum. Use rust `#A33F2D` — 5.50 and 6.35.
2. **No dark mode.** This system imitates paper. Paper has no dark mode.
3. **No shadows for hierarchy.** Use rules, whitespace, steps in background colour. Shadows
   are for things that genuinely float: lightbox, dropdown, toast.
4. **No pill corners, no weight above 700.** The first is SaaS vocabulary. The second goes
   muddy on warm paper.
5. **Never remove the focus outline.** Deleting it evicts every keyboard user.

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
condition. The licence is unmodified MIT and nothing here adds to it.

Use your own brand name, mark and copy if you ship this publicly.
