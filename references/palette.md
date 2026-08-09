# Palette and colour rules

## Base

| Name | Hex | Used for |
|---|---|---|
| Paper | `#F3EEE5` | First choice of ground colour, appears on roughly 50% of plates |
| Ink | `#1A1815` | Emphasis on the secondary structure, roughly 40% (secondary layer only) |

For page backgrounds use one step lighter: `#F1ECE3`. Text: `#1A1815` / `#605B52` / `#948D80`.

## The 18 colours

### Warm axis
| key | Hex | Name |
|---|---|---|
| clay | `#C66042` | Clay |
| rust | `#A33F2D` | Rust |
| coral | `#D87E62` | Coral |
| brick | `#B2543C` | Brick |
| ochre | `#CE9E4E` | Ochre |
| sand | `#DEC8A4` | Sand |
| wine | `#723244` | Wine |

### Cool axis
| key | Hex | Name |
|---|---|---|
| sage | `#84987E` | Sage |
| olive | `#687648` | Olive |
| forest | `#365242` | Forest |
| moss | `#96A876` | Moss |
| teal | `#548886` | Teal |
| slate | `#667C96` | Slate |
| denim | `#465E84` | Denim |
| sky | `#A0BCCE` | Sky |
| navy | `#2A3A58` | Navy |
| plum | `#826C94` | Plum |
| lilac | `#AA9EC0` | Lilac |

## Hard colour rules

1. **Ground and primary colour must differ by at least 110 in brightness** (the difference of the summed RGB channels). Below that the pattern smears into the background and riso grain eats the edges. The code filters this automatically.

2. **Three colours per plate, maximum**: ground + primary + secondary. A fourth colour is where the image stops holding together.

3. **Ink black is a secondary layer only.** A full black ground destroys the paper feel and makes that one plate look like an outsider in the set.

4. **Do not mix warm and cool at large areas.** A set produced with `--palette warm` or `--palette cool` is visibly more coherent than one produced with `all`. When building a series, lock to one side.

5. **Saturation is already turned down.** Every value sits in the low-to-mid sRGB saturation range. Do not push it up — high saturation immediately leaves the printmaking register and turns the output into vector illustration.

## Extending the palette

Add a line to the `PAL` dictionary in `generate.py`:

```python
"key": ((r, g, b), "Display Name", "warm"),  # or "cool"
```

The naming system (title = colour name · structure name) picks it up automatically, and the new entry appears in the gallery filter bar on its own.

Check for a new colour: convert it to greyscale, and the brightness should land between 25% and 75%. Anything brighter disappears on the paper ground; anything darker approaches ink black and loses its point.
