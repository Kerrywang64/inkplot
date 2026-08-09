# Anti-patterns

Every entry has the same shape: **symptom → why it fails → fix**.

An agent that reads this should come away knowing **what not to do**. A list of prohibitions changes output more than a list of recommendations does — recommendations are optional, prohibitions are not.

---

## 1 · Rules specific to this style

### ✗ Using clay `#C66042` for body links or button fills

It measures only 3.53:1 on the paper ground, and white text on it is 4.08:1. Both are under 4.5:1.
**Fix**: use rust `#A33F2D` for body emphasis and button fills (5.50 / 6.35). Clay is for plates, large display headings, and purely decorative icons.

### ✗ A paper ground with a dark-mode toggle

The whole logic of this style is that it imitates paper. Paper has no dark mode. A forced dark variant loses every bit of the material quality and leaves an ordinary dark site behind.
**Fix**: no dark mode. If night reading really has to be supported, drop the ground to `#EAE3D6` and reduce accent saturation — still in the warm family.

### ✗ Stacking shadows to build hierarchy

`box-shadow` is skeuomorphic vocabulary and conflicts with the flat logic of print. A pile of floating cards makes a page look like Material Design circa 2015.
**Fix**: build hierarchy with rules (`--rule`), whitespace, and steps in background colour (`paper` / `paper-2`). Only things that genuinely float — a lightbox, a dropdown, a toast — get a shadow.

### ✗ Pill radii

`border-radius: 999px` belongs to modern SaaS vocabulary. Paper-editorial uses square corners, or 2–4px.
**Fix**: buttons, inputs and cards get 0 or 2px. The only exceptions are avatars and status dots.

### ✗ Font weights above 700

Bold looks dirty on a warm paper ground and breaks the low-contrast character of the whole thing.
**Fix**: to emphasise, change size (jump two steps) or change family (sans body → serif italic for emphasis). Keep weight between 200 and 500.

### ✗ Three or more pattern layers on one plate

The output goes cluttered — every image starts to look like the same stew, and they stop being distinguishable from each other.
**Fix**: one primary structure per plate, plus at most one masked secondary. Use `--density 2` to force minimalism.

### ✗ Titles pulled from a random word list

"Tidal Line" or "Dusk" attached to a grid pattern means the name and the image have nothing to do with each other, and both lose their meaning.
**Fix**: derive the title from the image — `primary colour · primary structure` (Ochre Ripple).

---

## 2 · General prohibitions

### ✗ `outline: none`

Deleting the focus ring evicts every keyboard and screen-reader user. This is the most common and most serious accessibility failure there is.
**Fix**: do not delete it. To restyle, use `outline: 2px solid var(--accent); outline-offset: 2px`.

### ✗ Placeholder as label

The label disappears the moment the user starts typing, and halfway through the form they no longer know what the field was.
**Fix**: put the label above the input, permanently. Placeholders hold format examples only (`2024-01-31`).

### ✗ Body text under 16px

Below 16px, iOS Safari zooms the whole page when an input receives focus, which breaks the experience. Small text is also simply harder to read.
**Fix**: body text starts at 16px, and input font size must be 16px or larger.

### ✗ Bar charts whose y-axis does not start at zero

Truncating the axis draws a 3% difference as a 3× one. The data is true and the conclusion is false.
**Fix**: bar chart y-axes must start at 0. Line charts may be truncated, but say so on the axis.

### ✗ Colour as the only means of distinction

Roughly 8% of men have a colour vision deficiency. A legend, status, or required-field marker that relies on colour alone does not exist for them.
**Fix**: colour plus shape, position, or a text label — at least two cues.

### ✗ Infinite scroll

It kills the footer, and it kills the feeling of having finished. The user never reaches the bottom, so they never find the contact details or the copyright.
**Fix**: pagination, or a "load more" button with a permanent footer.

### ✗ Fake progress bars

If you do not know how long it will take, do not pretend you do. A bar that reaches 90% and sits there for five minutes is more infuriating than a spinner.
**Fix**: use an indeterminate state (spinner or skeleton) for unknown durations. Past three seconds, replace the skeleton with an explicit explanation of the wait.

### ✗ Errors that say "invalid operation" or "something went wrong"

They tell the user neither what is wrong nor how to fix it, which makes them no message at all.
**Fix**: name **which field**, **which rule**, and **how to fix it**. "Password needs at least 8 characters, currently 5" beats "invalid password".

### ✗ "Are you sure you want to delete?"

A confirmation dialog pushes responsibility onto the user, and users click confirm reflexively.
**Fix**: delete immediately and offer undo (an "undo" in the toast, held for 10 seconds). Reversible beats confirmed.

### ✗ Emoji as icons

They render inconsistently across platforms, screen readers announce strange names for them, and they break visual consistency.
**Fix**: use an SVG icon set (Lucide, Heroicons) with a consistent stroke width.

### ✗ Empty states that only say "no data"

That sentence is the first thing a user sees when they open the product, and it wastes the best teaching moment there is.
**Fix**: an empty state is one line explaining what will be here, plus one action that gets them there.

### ✗ Welcome messages, "let's get started", "great job!"

A calculator does not need a welcome message. What does the user lose if that sentence is deleted? If nothing, delete it.
**Fix**: give them the function. Copy appears only where something genuinely needs explaining.

### ✗ Elements that look identical but behave differently

Users assume things that look the same behave the same. Something that looks like a button and cannot be clicked destroys trust outright.
**Fix**: clickable and non-clickable must be visually distinguishable. A disabled state should not just be grey — say why it cannot be used.

### ✗ Technical articles without a date

A tutorial from three years ago looks exactly like one from yesterday, and the reader cannot tell whether it is stale.
**Fix**: publication date and last-updated date, both at the top of the body, not in small print in the footer.

---

## 3 · By domain

A few high-frequency cases only; this is not an attempt to cover every industry.

### Finance / legal

- ✗ AI purple-pink gradients — already a visual signal for "unserious product"
- ✗ Rounded cartoon illustration
- ✗ Animated counting-up of a balance
- ✓ Denim `#465E84` or wine `#723244` for accent, restrained serifs, `tabular-nums` on every number, and every rate must have a clickable source

### Medical / health

- ✗ Pure red as a primary colour (it reads as emergency and danger)
- ✗ An anthropomorphised AI assistant character
- ✗ Progress bars or achievement badges to drive medication adherence — gamifying treatment raises real ethical problems
- ✓ Forest `#365242`, neutral typography, and dosage and side-effect information must be more prominent than any marketing copy

### Children / education

- ✗ Do not use this paper style directly — low-contrast warm colours are not distinguishable enough for children
- ✓ Switch to a high-saturation, high-contrast palette, raise every type size two steps, touch targets 60px and up

### Research / publishing

- ✓ This is where the style belongs
- ✗ But do not sacrifice citation formatting for looks; set the reference section in a monospace face, and line length may exceed 68ch there

---

## 4 · Order of operations for an agent

Work through these in order once you have the brief. **Do not skip steps.**

1. **Decide whether this style applies at all** — see the opening of `design-system.md`. If it does not, say so and propose something else.
2. **Pick a skeleton** — one of the six. Do not invent one.
3. **Pick a font pairing** — one of the four.
4. **Pick an accent colour** — check the contrast table and confirm the intended use passes. **One per page.**
5. **Apply the tokens** — copy the spacing, type scale and motion durations directly. Do not invent values.
6. **Artwork** — when abstract artwork is needed, run `scripts/generate.py`, choosing parameters by character (minimal: `--density 2`; aged: `--texture 9`).
7. **Run the self-check** — section 8 of `design-system.md`, line by line.
8. **Run this anti-pattern list** — confirm line by line that none are violated.

Steps 7 and 8 cannot be skipped. Output that is never checked ends up indistinguishable from default output, because the difference lives entirely in the details.
