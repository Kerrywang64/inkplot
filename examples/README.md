# Recipes

Every one of these can be copied and run as-is. `--seed` is fixed, so the output is reproducible.

## Magazine interior · minimal

Lots of whitespace, mostly single-layer compositions. Good as section artwork inside longform.

```bash
python3 scripts/generate.py --count 12 --seed 108 \
  --density 2 --contrast 4 --texture 3 \
  --palette cool --size 480 --colors 24 \
  --out zine.json --contact zine-sheet.png

python3 scripts/gallery.py --art zine.json --out zine.html \
  --title '<i>Twelve</i> quiet pages' --layout quad
```

## Vintage poster · aged

Misregistration and grain pushed to the top, layers dense — like a screen print pulled out of the bottom of a drawer.

```bash
python3 scripts/generate.py --count 18 --seed 1930 \
  --density 8 --contrast 9 --texture 10 \
  --palette warm --size 560 \
  --out poster.json --contact poster-sheet.png

python3 scripts/gallery.py --art poster.json --out poster.html \
  --brand 'Press No.9' --edition 'Series 1930' --layout mosaic
```

## One-structure series · ripple

Lock to a single pattern and let only the colour change. Use this for a set of covers with one clear theme.

```bash
python3 scripts/generate.py --count 9 --seed 3 \
  --pattern rings --density 3 --contrast 7 \
  --out ripples.json --contact ripples-sheet.png

python3 scripts/gallery.py --art ripples.json --out ripples.html \
  --title '<i>Nine</i> ripples' --layout solo
```

## UI placeholders · lightweight

Small, few colours, ready to drop straight into a prototype page.

```bash
python3 scripts/generate.py --count 40 --seed 2026 \
  --size 320 --colors 16 --density 3 \
  --out placeholders.json
```

Every item in the resulting `art.json` carries `src` (a data URI), a `title`, and `pattern` (the structure name), so it can be fed to the front end directly:

```js
const art = await fetch('placeholders.json').then(r => r.json());
document.querySelector('img').src = art[0].src;
document.querySelector('figcaption').textContent = art[0].title;  // Ochre Ripple
```

## Changing the palette

Add a line to `PAL` at the top of `scripts/generate.py`:

```python
PAL["indigo"] = ((58, 74, 122), "Indigo", "cool")
```

The naming system and the gallery filter bar pick it up automatically. Nothing else needs changing.
