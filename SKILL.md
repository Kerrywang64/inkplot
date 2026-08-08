---
name: inkplot
description: Draws editorial-style abstract artwork in the browser out of real charts — pie, histogram, network, Sankey, Voronoi, attention matrix and 37 more — laid over flat colour areas with print-like texture. No image files, no image model, no network calls; the same seed always produces the same picture. Also includes a design reference (layout patterns, font pairings, a colour palette with measured contrast ratios, spacing and motion values, 30+ things not to do) and two scripts that measure generated artwork instead of guessing at it. Use when the user needs blog headers, card thumbnails, section dividers, placeholder art, or an editorial or magazine-style visual system; when they ask whether a colour pair passes contrast, which fonts to pair, or what spacing scale to use; or when generated artwork keeps coming out repetitive and needs measuring rather than eyeballing.
license: MIT
---

# inkplot

Abstract artwork that still means something. Every image is built out of a real chart, so
it reads as information rather than as decoration.

No image model. No asset files. No network. A browser canvas draws every layer. Same seed,
same picture, every time.

---

## Quick start

```html
<script src="scripts/collage.js"></script>
<script>
  COLLAGE.init({ count: 24, seed: 20260808 });
  document.querySelectorAll('[data-plate]').forEach((el, i) => COLLAGE.attach(el, i));
</script>
```

Check what came out:

```bash
node measure.mjs      # line weight and ink coverage, against a measured baseline
node diversity.mjs    # how different the plates are from each other
```

---

## Six words used throughout

These are the only invented terms. Everything below depends on them.

| Word | What it means |
|---|---|
| **plate** | one finished image |
| **ground** | the background colour, filled corner to corner |
| **field** | a second colour laid over part of the ground, with a torn-paper edge |
| **specimen** | the chart drawn on top — the part that carries the meaning |
| **skeleton** | how the frame is divided between ground and field |
| **material** | the texture applied to one field |

A plate is a ground, one field, one specimen. Three things, and that cap is a rule, not a
default.

Drawing order:

```
ground → field with torn edge → specimen → halftone (rarely) → dry stroke → paper fibre
```

| Layer | What it does |
|---|---|
| Ground | Flat saturated colour, corner to corner |
| Field | One of 7 skeletons, torn edge, brightness gap of 62 enforced |
| Specimen | One of 43 charts, filling 55–75% of its slot |
| Halftone | Dots, only for charts that are a solid fill to begin with |
| Dry stroke | One heavy charcoal-weight line. 62% of plates get none |
| Paper fibre | Barely visible, whole sheet |

---

## Why charts instead of patterns

Generative abstract patterns fail in a way that is invisible in one image and obvious in
twenty: pull any single one out of the set and there is nothing to say about it.

A chart is *about* something before it is *shaped* like anything. A pie chart is about
proportion. An attention matrix is about what a model looked at. A calendar heatmap is
about which days were busy. Crop it, rotate it, cover half of it — the meaning survives.

That is also why these images still work at 120 pixels wide. At that size nobody is reading
detail; they are recognising a silhouette they already know.

---

## The 43 charts

| Family | Charts |
|---|---|
| Distribution | histogram · lollipop · box plot · violin · beeswarm · ridgeline · waffle |
| Proportion | pie · donut · rose · treemap · circle pack · Venn |
| Relationship | network · tree · dendrogram · chord · Sankey · arc diagram · matrix · parallel coordinates |
| Change over time | line · area · stream · loss curve · bump · slope · timeline · spiral |
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
| `COLLAGE.render(i, scale)` | Hands back a `<canvas>` |
| `COLLAGE.meta(i)` | `{ skeleton, viz, zh, en, screened, kit, kitEn }` — use it for captions |
| `COLLAGE.materials([{ img }])` | Swaps the charts out for your own cut-out images |
| `COLLAGE.kits()` | The list of material names |

---

## The rules

These are enforced in code, not suggested.

### A plate gets three things and then stops

Ground, one field, one specimen.

The temptation is always a fourth thing — one more shape, one more line, one more colour.
It never makes a picture richer. It makes every plate look like every other plate, because
the clutter drowns out the one thing that actually differs between them: the composition
underneath.

### The two colours must be 62 apart in brightness

62 steps on the 0–255 scale, measured as luminance.

The test to keep in mind: **print the plate in black and white. Can you still tell it is
two colours?** If not, the two areas fight and the image goes muddy. Two mid-tone colours
that look clearly different on screen very often fail this — which is exactly why the
number is hardcoded and the random number generator does not get a vote.

### Vary how you draw, not what you draw

Take one pie chart. Rotate it, mirror it, zoom in until it runs off the edge, redraw its
lines heavier. That is ten images that do not look alike.

Now take ten *different* charts and draw each once, same size, same position. That is ten
images that all feel the same, because the only thing that changed was a small shape inside
an unchanged layout.

So adding chart types does not fix repetition. It only makes repetition rarer. What fixes
it is transforming each instance: rotation, mirroring, a zoomed-in crop that bleeds off the
frame, one of five line treatments.

### Bold colour, once per plate

Thirty colours in six families — earth, green, teal-blue, purple-pink, high-saturation
accent, neutral. Pick a family for the ground, then jump to a different family for the
second colour about a third of the time. Never two loud colours in one plate.

### Measure instead of guessing

"It looks wrong but I can't say why" is the most expensive place to be, because you cannot
tell whether a change helped.

`measure.mjs` works out line weight from **area divided by edge length**. A stroke `l` long
and `w` wide covers `w × l` pixels and has roughly `2l` pixels of edge, so `w ≈ 2 × area ÷
edge`. The obvious alternative — measure runs of dark pixels, take the most common length —
is destroyed by anti-aliasing and compression. This is not.

`diversity.mjs` shrinks each plate to 24×24 grey pixels, subtracts the average brightness
so a dark plate and a light plate are not counted as different just for being dark and
light, then measures the distance between every pair. **Watch the smallest number**, since
that is your most repetitive pair.

Watch both together. Ink coverage is a single number, so it can be optimised on its own —
and doing that produces twenty plates that all hit the target and all look the same. That
is not hypothetical; it happened here, and it is why the second script exists.

### Reproducible beats surprising

Same seed plus same settings equals an identical picture. "Run it again, it might come out
better" is a lottery, not a process.

---

## Texture has an address

On a press, texture is not spread evenly. Ink pools where two colours meet. The plate lands
slightly off-mark and a sliver of a third colour shows. Paper has a grain. Each of those
happens somewhere specific, and copying the *placement* is what makes an image read as
printed instead of as filtered.

| Where | What happens | How much | How often |
|---|---|---|---|
| Where two colours meet | Ink pools on the inner side | Band of 1.2% of the short edge, clipped inside the field | Every plate that has a field |
| Registration | Colour lands off-mark, sliver of a third colour shows | Offset 1.2% of the short edge × level | Every plate that has a field |
| **One field** | **A material from the library below** | **That field only, about 40% of the frame** | **26 / 42 / 66% of plates, by level** |
| The chart's ink | Density drifts, fibre eats the edges | Only pixels that have ink | Every plate |
| Whole sheet | Paper fibre | Everywhere | Amplitude 3 out of 255 |

**Row three is the only one anybody notices, and it is the only one that has to stay
local.** A grain layer over the whole frame cancels itself out — if everything is textured,
nothing is. The effect lives in the seam between a flat area and a textured one. One
textured area per plate, never two.

### The material library

Nine materials, all drawn procedurally, no bitmaps. Each one is two layers: one that
darkens (multiply) and one that brightens (lighter). Splitting them is the whole trick —
**metal without a highlight is just grey noise, and matte with a highlight is not matte.**

| Material | What it looks like | Highlight |
|---|---|---|
| `grit` | Film grain. Low-frequency clumping carries it; the fine speckle is only the surface | — |
| `matte` | Very fine, very even, low contrast. Powder coating | — |
| `plaster` | Broad soft patches with fine pitting on top | — |
| `linen` | Two crossed ridge patterns, wobbled slightly so it does not moiré | — |
| `roller` | Horizontal drag marks plus density bands at the roller's circumference | — |
| `vein` | Wood grain. Noise bends the coordinates before the stripes are drawn, so they wander | — |
| `brushed` | Brushed metal. Streaks stretched about 80:1 along one axis, with one broad sheen | yes |
| `foil` | Two or three smooth angled bands of reflection, with paper fibre over the top | yes |
| `crease` | Folded paper. Distance to a few random fold lines: dark on one side, light on the other | yes |

`foil` and `crease` carry that fine grain layer on purpose. A perfectly smooth gradient
slides into looking like a 3D specular highlight, which is a different medium entirely.

```js
COLLAGE.init({ texture: 3 });      // 0 off · 1 light · 2 mid · 3 heavy (default)
COLLAGE.init({ kit: 'brushed' });  // lock every plate to one material, for reviewing
COLLAGE.meta(i).kitEn              // which material this plate used
```

Level 0 is not a broken mode. Flat output is correct for interface elements, favicons, and
anything under 80 pixels, where texture is only noise.

### Two rules texture may never break

**Never cover the chart.** The chart is the reason the plate means anything. Before placing
a material, measure how much of the chart's slot falls inside that field; if it is more
than a third, put the material on the other side instead, then softly erase the slot out of
the mask anyway as a backstop. Texture belongs beside the subject, not on top of it — which
is also where it sits in the reference material this style comes from.

**Never build a field out of repeated dots.** A dot-screen gradient across a whole colour
area is the cheapest possible way to fake print and it is unpleasant to look at close up.
Halftone dots are reserved for charts that are a continuous fill to begin with — `nebula`,
`stream`, `area`. Screening a matrix, a calendar or a waffle turns a grid of cells into a
grid of dots; screening a contour or a scatter breaks the lines into dashes, and the chart
is gone.

### Two things that were shipped and looked wrong

- **Do not erase transparency to fake uneven ink.** Punching holes in a solid colour lets
  the background show through in clouds. That reads as mould, not as printing. Vary the
  brightness inside the ink instead, and never touch transparency on a solid area.
- **Do not multiply grey noise over a colour.** Grey drains the saturation and the colour
  goes dirty. Blend from white toward *that colour mixed halfway to ink*, then multiply.
  Same hue, more ink.

### One thing to get right when changing the dial

The texture level must change nothing except texture. Same seed at level 0 and level 3
should give the same composition, the same colours, the same chart in the same place —
otherwise there is no way to judge what the dial did. In practice that means **drawing
every random number unconditionally**, whether or not the current level uses it. Skipping a
random draw inside an `if` shifts everything downstream and silently produces a different
picture.

---

## Baselines

Measured against 14 editorial illustrations.

| | 25th pct | median | 75th pct |
|---|---|---|---|
| Line weight, as a fraction of frame width | 1/80 | 1/106 | 1/122 |
| Share of the page covered in ink | 1.3% | 4.3% | 8.6% |
| Distance between two plates using the same chart | should be no smaller than between plates using different charts | | |

`measure.mjs` prints your numbers next to these.

---

## Design reference

Separate from the artwork. Read it before building an interface, not during.

| File | What is in it |
|---|---|
| `references/design-system.md` | Colour tokens with measured contrast ratios, font pairings, type and spacing scales, motion values, 6 layout patterns, a delivery checklist |
| `references/anti-patterns.md` | 30+ prohibitions, each written as *symptom → why it fails → what to do instead* |

The five that get broken most often:

1. **Clay `#C66042` is never a body link or a button fill.** It measures 3.53:1 against
   paper, and 4.08:1 for white text sitting on it. Both are under the 4.5:1 minimum. Use
   rust `#A33F2D` instead — 5.50 and 6.35.
2. **No dark mode.** This system imitates paper, and paper does not have a dark mode.
3. **No shadows for hierarchy.** Use rules, whitespace, and steps in background colour.
   Shadows are for things that genuinely float: a lightbox, a dropdown, a toast.
4. **No pill-shaped corners, no font weight above 700.** The first is SaaS vocabulary; the
   second goes muddy on warm paper.
5. **Never remove the focus outline.** Deleting it evicts every keyboard user from the
   interface.

---

## Using your own images instead

```js
COLLAGE.materials([{ img: someImageElement }, ...]);
```

Your images take the place of the charts. The colour split, the torn edges and the texture
all still happen.

What works: cut out or on a white background; a single object, not a scene; black and white
or nearly so. Colour comes from the fields — the image only has to supply a shape.

---

## License

MIT — use it, fork it, ship it commercially, no permission needed. Halftone screening, torn
edges, dry-media strokes and misregistration are printing traditions in the public domain,
and the grammar of statistical charts is public domain too. Output is generated locally, has
no training data behind it, and is free for commercial use.

If inkplot ends up in something you ship, a link back is appreciated — but that is a
request, not a condition. The licence is unmodified MIT and nothing here adds to it.

Use your own brand name, mark and copy if you ship this publicly.
