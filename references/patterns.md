# Pattern structures

Ten structures, one function each, signature `fn(draw, color, rng)`, drawing onto a 900×900 canvas.

## Index

| key | Name | Visual weight | Good for |
|---|---|---|---|
| `halftone` | Halftone | medium | Primary. The gradient direction is random; this is the one that reads most like print |
| `hatch` | Hatch | medium | Primary or secondary. Four random angles, wide range of densities |
| `rings` | Ripple | light | Primary. The centre can sit outside the frame, giving partial arcs |
| `scatter` | Scatter | light | Mostly secondary. Goes messy when it fills the frame |
| `waves` | Wave | medium | Primary. Random amplitude and frequency; the most organic of the set |
| `grid` | Grid | medium | Primary. Fill rate 14–30%; above that it turns into a solid block |
| `bars` | Stripe | heavy | Primary. Unequal widths, the strongest typographic feel |
| `block` | Block | heavy | Primary. Five geometric motifs, the simplest image |
| `trace` | Trace | light | Best as secondary. Too empty when it fills the frame |
| `horizon` | Horizon | heavy | Primary. The strongest suggestion of landscape |

## Pairing, from experience

**Heavy + light** is the safe combination: `block` with `trace`, `bars` with `scatter`, `horizon` with `rings`.

**Heavy + heavy** fights: `bars` with `block`, `horizon` with `grid` — both want to be the subject, and no mask rescues it.

**Do not stack the same family**: `halftone` with `grid` are both regular grids, and stacking them produces moiré rather than composition.

In the code the secondary structure is picked at random, excluding the primary. For stricter control over pairings, replace the choice of `sk` inside `compose()` with a lookup table.

## Masks

The secondary structure must pass through a mask. There are three:

- `torn_mask` — torn paper. Four diagonal-cut motifs, edge jitter of ±13px, 1.1px blur. The most used, and the closest to a hand-torn scrap.
- `band_mask` — colour band. One horizontal or vertical band, 16–40% of the frame wide. Creates layering.
- `disc_mask` — disc. Radius 20–38% of the frame. Creates a "window" effect.

All three hold the secondary structure to roughly 40% of the frame. This is what keeps the image from going cluttered; be conservative when changing it.

## Post-processing

`riso()` has three steps and the order cannot change:

1. **Misregistration.** The red channel shifts 2–3px overall, the blue channel shifts half that in the opposite direction. It simulates plates that did not line up. This is the main source of the printmaking feel — remove it and the output becomes a vector image immediately.
2. **Paper grain.** Gaussian noise σ=10, added to luminance (the same amount on all three channels), not colour noise.
3. **Uneven ink.** A multiplicative field of sine × cosine at 13% amplitude, simulating uneven roller pressure.

Finally a 0.7px Gaussian blur removes the hard digital edges. **Do not skip this step** — sharp edges and grain existing at the same time look fake.

## Adding a structure

```python
def mypattern(d, c, R):
    # d: ImageDraw, c: RGB tuple, R: random.Random
    # draw within 0..CANVAS
    ...

PATTERNS["mypattern"] = (mypattern, "Display Name")
```

Two checks:

1. Run it once on a paper ground and once on a dark ground. Both have to work.
2. Shrink to 240px and look at the contact sheet. A structure only passes if it is still recognisable small. A pattern whose detail all sits below 4px is a grey smear in the gallery.
