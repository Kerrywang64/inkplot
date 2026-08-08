---
name: inkplot
description: Generates editorial-grade abstract artwork from data-visualization primitives — pie, Venn, Sankey, Voronoi, attention matrix, persistence diagram, and 37 more — composed onto flat color fields with riso-print texture. Zero assets, zero image models, fully deterministic from a seed. Also ships a design-decision library (layout skeletons, font pairings, a palette with measured WCAG contrast, spacing and motion tokens, 30+ anti-patterns) and two scripts that numerically self-check any visual output. Use when the user needs blog headers, card thumbnails, section dividers, placeholder art, or an editorial/magazine/publication visual system; when they ask whether a color pair passes contrast, which font pairing to use, or what spacing scale to follow; or when generated artwork looks repetitive and needs to be measured rather than guessed at.
license: MIT
---

# inkplot

Abstract artwork that means something. Every plate is built from a real
data-visualization primitive, so it reads as information rather than decoration.

No image model. No asset files. No network. Canvas draws every layer.
Same seed, same output, every time.

---

## Quick start

```html
<script src="scripts/collage.js"></script>
<script>
  COLLAGE.init({ count: 24, seed: 20260808 });
  document.querySelectorAll('[data-plate]').forEach((el, i) => COLLAGE.attach(el, i));
</script>
```

Self-check any run:

```bash
node measure.mjs      # stroke weight + ink coverage vs a measured baseline
node diversity.mjs    # pairwise structural distance, catches repetition
```

---

## What a plate is

One ground color, one second color field, one specimen. Three elements, hard cap.

```
ground fill → torn-edge color field → specimen → halftone screen → dry stroke → paper grain
```

| Layer | What it does |
|---|---|
| Ground | Flat saturated fill, edge to edge |
| Second field | One of 7 skeletons, torn edge, luminance delta ≥ 62 enforced |
| Specimen | One of 43 data-viz primitives, 55–75% of its slot |
| Screen | Halftone, tonal specimens only |
| Dry stroke | Charcoal-weight line, 62% of plates get none |
| Grain | Paper fiber, laid lines, wide unevenness |

---

## Texture has an address

Texture is not a filter you drop on the finished image. On a real press it appears in
specific places for specific mechanical reasons, and copying the placement is what makes
it read as print instead of as a Photoshop overlay.

| Where | What happens | Coverage | Frequency |
|---|---|---|---|
| Field boundary | Ink squeezes and pools on the inner side | Band = 1.2% of the short edge, clipped inside the field | Every plate with a second field |
| Registration | The plate lands off-mark, a third color shows in a sliver | Offset = 1.2% of the short edge × level | Every plate with a second field |
| **One field** | **A material from the library below** | **One field only, ~40% of the frame** | **26 / 42 / 66% of plates by level** |
| Specimen ink | Density drifts, fiber eats the edges | Ink pixels only | Every plate |
| Whole sheet | Paper fiber | 100% | Amplitude ≤ 3/255 |

**The third row is the only one anybody sees, and it is the only one that must stay local.**
A grain layer over the whole frame cancels itself out — if everything is textured, nothing
is. The effect lives in the *seam* between a flat field and a material one. One textured
zone per plate, never two.

### The material library

Nine materials, all procedural, no bitmaps. Each is a pair of fields: one that darkens
through `multiply`, one that brightens through `lighter`. Splitting them is the whole
trick — **metal without a highlight is just gray noise, and matte with a highlight is not
matte.**

| Material | Signature | Highlight |
|---|---|---|
| `grit` | Film grain: low-frequency clumping carries it, high frequency is only the speckle | — |
| `matte` | Ultra-fine, near-even, low contrast. Powder coat | — |
| `plaster` | Broad soft patches under fine pitting | — |
| `linen` | Two crossed ridge frequencies, low-frequency modulation to break the moiré | — |
| `roller` | Horizontal drag plus density bands at the drum period | — |
| `vein` | Domain-warped fbm — long parallel bands, wood or marble | — |
| `brushed` | Anisotropic streaks, stretched ~80:1 along one axis, one broad sheen | yes |
| `foil` | Two or three smooth angled sheen bands, plus paper fiber on top | yes |
| `crease` | Signed distance to a few random lines: dark on one side, light on the other | yes |

`foil` and `crease` carry a fine grain layer on purpose. A pure smooth ramp slides into
looking like a 3D specular highlight, and that is a different medium.

```js
COLLAGE.init({ texture: 3 });         // 0 off · 1 light · 2 mid · 3 heavy (default)
COLLAGE.init({ kit: 'brushed' });     // lock every plate to one material, for review
COLLAGE.meta(i).kitEn                 // which material this plate drew
```

### Two rules the texture may never break

**Never cover the chart.** The specimen is the reason the plate means anything. Before
placing a material, measure how much of the specimen slot falls inside the field; if it is
over a third, put the material on the *other* side, then soft-erase the slot from the mask
anyway. Texture belongs beside the subject, not on top of it — which is also where it sits
in the reference material.

**Never build a field out of repeated dots.** A dot-screen gradient across a whole color
field is the cheapest way to fake print and it is unpleasant to look at up close. Halftone
is reserved for specimens that are genuinely a continuous fill — `nebula`, `stream`,
`area`. Screening a matrix, a calendar, or a waffle turns a grid of cells into a grid of
dots; screening a contour or a scatter breaks the lines into dashes and the chart is gone.

Two more failures worth naming, because both shipped and both looked wrong:

- **Do not erode alpha to fake uneven ink.** Punching holes in a solid field lets the
  ground show through in clouds. That reads as mold, not printing. Vary luminance
  additively inside the ink instead, and never touch alpha on a solid.
- **Do not multiply gray noise over a color field.** Gray desaturates and the field turns
  dirty. Interpolate white → *the field's own color mixed 50% toward ink*, then multiply.
  Same hue, more ink.

Level 0 is not a degraded mode — flat output is correct for UI, favicons, and anything
under 80px, where texture is noise.

The dial changes nothing but texture. Same seed at level 0 and level 3 gives the same
composition, the same colors, and the same specimen in the same place. If that is not true
of a change you make, the comparison is worthless — draw every random number
unconditionally, whether or not the level uses it.

---

## The 43 specimens

| Family | Specimens |
|---|---|
| Distribution | histogram · lollipop · box plot · violin · beeswarm · ridgeline · waffle |
| Proportion | pie · donut · rose · treemap · circle pack · Venn |
| Relation | network · tree · dendrogram · chord · Sankey · arc diagram · matrix · parallel coords |
| Trend | line · area · stream · loss curve · bump · slope · timeline · spiral |
| Space | scatter · contour · hexbin · Voronoi · vector field · nebula · calendar heatmap |
| Modern | embedding projection · attention matrix · top-k · persistence diagram · radar · ternary · gauge |

## The 7 skeletons

`diagonal` · `vsplit` · `hsplit` · `quad` · `inset` · `scallop` · `band`

---

## API

| Call | Returns |
|---|---|
| `COLLAGE.init({ count, seed, scale, texture })` | Self, after generating specs |
| `COLLAGE.attach(el, i)` | Renders plate `i` into an `<img>` or container |
| `COLLAGE.render(i, scale)` | A `<canvas>` |
| `COLLAGE.meta(i)` | `{ skeleton, viz, zh, en, screened }` — use it for captions |
| `COLLAGE.materials([{ img }])` | Replaces specimens with your own cut-out images |

---

## Design rules

These are enforced in code, not suggested.

**Three elements per plate.** Ground, one field, one specimen. A fourth element does
not add richness — it hides the structural difference between plates, and every plate
starts looking the same.

**Luminance delta ≥ 62 between color fields.** Two colors of similar lightness splitting
a frame fight each other. The constraint is hardcoded; the random number generator does
not get a vote.

**Variation comes from instances, not from inventory.** One specimen appearing ten times
in ten different forms beats ten specimens appearing once each. Every instance gets a
transform: rotation, mirror, zoom-to-bleed crop, one of five stroke modes.

Adding more specimens only lowers the frequency of repetition. It does not fix repetition.

**Bold color, once per plate.** Thirty fields across six families — earth, green, teal-blue,
purple-pink, high-saturation accent, neutral. Pick a family, then jump out of it 34% of
the time. Never twice.

**Measure instead of guessing.** "Looks wrong but I can't say why" is the most expensive
state to be in.

`measure.mjs` estimates stroke weight by **area-to-edge ratio** — a stroke of length `l`
and width `w` has area `w·l` and roughly `2l` edge pixels, so `w ≈ 2·area ÷ edge`. This is
robust against antialiasing and compression noise; run-length mode is not.

`diversity.mjs` downsamples each plate to 24×24, subtracts the mean to remove ground
brightness, and takes pairwise L2 distance. Optimizing ink coverage alone silently
destroys diversity — both numbers have to be watched together.

**Reproducible over surprising.** Same seed plus same parameters equals identical output.
"Run it again, it might be better" is a lottery, not a design process.

---

## Baselines

Measured against 14 line-art editorial illustrations sampled from a production site.

| Metric | Reference (q25/median/q75) |
|---|---|
| Stroke weight, as 1/N of frame width | 80 / 106 / 122 |
| Ink coverage % | 1.3 / 4.3 / 8.6 |
| Same-specimen pairwise distance | ≥ cross-specimen distance |

`measure.mjs` prints your numbers next to these.

---

## Design decisions

Separate from artwork. Read before building an interface, not while.

| File | Contents |
|---|---|
| `references/design-system.md` | Palette tokens with measured contrast ratios, font pairings, type and spacing scales, motion specs, 6 layout skeletons, delivery checklist |
| `references/anti-patterns.md` | 30+ prohibitions, each as `symptom → why it fails → fix` |

Five that get violated most:

1. **Clay `#C66042` is never body-link or button-fill.** 3.53:1 on paper, 4.08:1 for white
   text on it. Both fail 4.5:1. Use rust `#A33F2D` (5.50 / 6.35).
2. **No dark mode.** This system simulates paper. Paper has no dark mode.
3. **No shadows for hierarchy.** Use rules, whitespace, and background steps. Shadows are
   for things that genuinely float — lightbox, dropdown, toast.
4. **No pill radii, no weights above 700.** The first is SaaS vocabulary; the second reads
   dirty on warm paper.
5. **Never remove `outline`.** Deleting focus rings evicts every keyboard user.

---

## Bring your own material

```js
COLLAGE.materials([{ img: someImageElement }, ...]);
```

Supplied images replace specimens. Field splitting, torn edges, and halftone screening
still apply.

Selection criteria: cut out or white background; single object, not a scene; black and
white or very low saturation — color comes from the fields, the material supplies only
shape and texture.

---

## License

MIT — use it, fork it, ship it commercially, no permission needed. Halftone screening,
torn edges, dry-media strokes, and misregistration are printing traditions in the public
domain. The grammar of statistical graphics is likewise public domain. Output is generated
locally with no training-data provenance and is free for commercial use.

If inkplot ends up in something you ship, a link back is appreciated — but that is a
request, not a condition. The license is unmodified MIT and nothing here adds to it.

Use your own brand name, mark, and copy if you ship this publicly.
