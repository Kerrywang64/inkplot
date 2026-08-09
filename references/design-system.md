# Paper-editorial · design decisions

This file does not explain principles. It hands you **decisions that have already been made**. Copy them; you do not need to weigh them again.

Every contrast figure here is measured (WCAG 2.1 relative luminance), not estimated.

---

## First decide: what this style is for

**Good for**: longform reading, portfolios, documentation sites, independent publishing, research reports, galleries, brand-story pages, newsletter landing pages.

**Bad for**: data-dense dashboards (a paper ground cannot carry high-density tables), children's products, games, e-commerce promo pages that need a hard conversion push (the restraint of this style works against impulse), developer tools that are dark-mode-first.

If it does not fit, do not force it. Forcing it produces something that "looks elegant and is completely unusable".

---

## 1 · Palette tokens

```css
:root{
  /* ground */
  --paper:    #F3EEE5;   /* primary ground */
  --paper-2:  #EBE4D7;   /* secondary blocks, table zebra stripes */
  --paper-3:  #E3DBCB;   /* input ground, code block ground */

  /* type */
  --ink:      #1A1815;   /* body, headings          15.33:1 */
  --ink-2:    #4A463E;   /* secondary text, captions 8.12:1 */
  --ink-3:    #6E6A61;   /* meta, placeholders       4.66:1 */
  --ink-4:    #8A8478;   /* decorative only, must never carry information 3.21:1 */

  /* rules */
  --rule:     rgba(26,24,21,.13);   /* ordinary dividers */
  --rule-2:   rgba(26,24,21,.28);   /* emphasised dividers, input borders */

  /* accent (one per page) */
  --accent:   #A33F2D;   /* rust · links and body emphasis  5.50:1 ✓ */
  --accent-bg:#A33F2D;   /* button fill with white text     6.35:1 ✓ */
  --decor:    #C66042;   /* clay · decorative only          3.53:1 ✗ */
}
```

### Accent candidates (look up by intended use)

| Colour | Hex | As text on paper | As button fill, white text | Verdict |
|---|---|---|---|---|
| rust | `#A33F2D` | 5.50:1 ✓ | 6.35:1 ✓ | **Default accent.** Passes for both uses |
| forest | `#365242` | 7.44:1 ✓ | 8.60:1 ✓ | Calm, institutional. Suits docs and research |
| denim | `#465E84` | 5.69:1 ✓ | 6.57:1 ✓ | Suits finance and legal |
| wine | `#723244` | 8.06:1 ✓ | 9.31:1 ✓ | Highest contrast. Suits formal publishing |
| olive | `#687648` | 4.25:1 ✗ | 4.91:1 ✓ | Button fill only. **Not for body links** |
| clay | `#C66042` | 3.53:1 ✗ | 4.08:1 ✗ | **Purely decorative**: plates, display headings, icons |

**Rule: one accent per page.** When a second semantic colour is needed, use a status colour — do not introduce a second brand colour.

### Status colours

```css
--ok:   #3F6B4A;   /* success */
--warn: #8A6410;   /* warning */
--bad:  #9B2F28;   /* error */
```

All are ≥ 4.5:1 on the paper ground. **Do not use pure red `#FF0000` or pure green `#00FF00`** — they glare against a paper ground and break the low-saturation logic of the whole system.

---

## 2 · Font pairings

Four sets, chosen by character. All Google Fonts, free for commercial use.

### A · Editorial default (recommended starting point)

Display `Newsreader` (serif, optical size variable) · UI `Inter` · CJK `Noto Serif SC`

Character: warm, readable, unpretentious. Suits longform and portfolios.

### B · High-contrast publishing

Display `Playfair Display` · UI `Inter` · CJK `Noto Serif SC`

Playfair has extreme thick–thin contrast; it only looks right above 48px. **Do not use it below 32px.** Suits covers, display headings, fashion and beauty.

### C · Academic and documentation

Display `Source Serif 4` · UI `IBM Plex Sans` · mono `IBM Plex Mono` · CJK `Noto Serif SC`

Character: neutral, credible, durable to read. Suits research reports, technical docs, white papers.

### D · Modern sans (when you do not want a serif)

Display `Instrument Sans` · UI `Inter` · CJK `Noto Sans SC`

Keeps the paper ground but drops the serif; the result reads more contemporary. Suits marketing sites for tools.

The exact Google Fonts import strings live in `PAIRINGS` inside `scripts/scaffold.py`; run `--list` to see them all.

### Hard rules

- **Two families per page, maximum** (a CJK companion face does not count as the third). From the third onwards the page falls apart.
- Display faces are for h1/h2 and the standfirst only. **Body text always uses the UI face** — a serif body is tiring to read at length on screen.
- When mixing CJK with Latin, set the CJK 1–2px larger: CJK glyphs fill more of the em box, so at the same size they look smaller.
- Numbers always get `font-variant-numeric: tabular-nums`. Digits that jitter in a table are a typesetting accident.

---

## 3 · Type scale

A modular scale based on 16px (ratio 1.25):

```css
--t-xs:  11px;   /* meta, copyright, labels    letter-spacing:.16em; uppercase */
--t-sm:  13px;   /* captions, secondary notes */
--t-base:16px;   /* body — never go below this */
--t-lg:  20px;   /* standfirst, lede */
--t-xl:  25px;   /* h3 */
--t-2xl: 31px;   /* h2 */
--t-3xl: 48px;   /* h1 */
--t-4xl: 76px;   /* cover-scale display */
```

Line height: body `1.7`, headings `1.15`, display `1.0`.

Weight: four steps are enough for this style — `200/300/400/500`. **Do not go above 700** — bold looks dirty on a paper ground; to emphasise, change size or change family.

---

## 4 · Spacing and measure

An 8px base:

```css
--s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px;
--s-6:32px; --s-7:48px; --s-8:64px; --s-9:96px; --s-10:128px;
```

**Measure is set by line length, not by a percentage of the screen width.**

| Content | Measure | Reason |
|---|---|---|
| Longform body | `max-width: 68ch` | 45–75 characters is the band where the eye does not lose its line |
| Mixed text and image | `max-width: 860px` | |
| Gallery / grid | `max-width: 1320px` | |
| Full-bleed sections | Unbounded, but the text inside still obeys the above | |

Section spacing starts at `--s-9` (96px). This style builds rhythm out of whitespace; **being stingy with space reads as cheap immediately**.

---

## 5 · Motion spec

```css
--ease: cubic-bezier(.22,.9,.24,1);   /* default easing, fast in, slow out */
--t-fast:   160ms;   /* hover, focus, colour change */
--t-normal: 240ms;   /* expand/collapse, displacement */
--t-slow:   420ms;   /* page-level transitions, overlays */
```

**Past 400ms the user thinks it has frozen.** Only a full-page transition may reach 420ms.

### Things that should move

- Element entrance: `opacity` + `translateY(20px)` → resting position, `--t-slow`, staggered 60–90ms within a group
- hover: `translateY(-2px)` or a border-colour change, `--t-fast`
- Drawing a rule: `stroke-dashoffset` to zero — good for constellation and flow diagrams

### Things that should not move

- Body text that is being read
- A form that is being filled in
- Error messages (they must appear instantly, never fade in)
- Permanent animation on table rows or list items

### Performance

Animate `transform` and `opacity` only. Use `translate` for displacement, not `top/left`; `scale` for size, not `width/height`. Trigger entrances with `IntersectionObserver`, not a `scroll` listener.

### The floor

```css
@media (prefers-reduced-motion: reduce){
  *{ animation:none !important; transition-duration:.01ms !important }
  .reveal{ opacity:1 !important; transform:none !important }
}
```

**This is not optional.** Once a user with vestibular sensitivity has set the system switch, this page must be completely static.

---

## 6 · Six layout skeletons

Pick one and build to it; do not invent your own. The first four can be generated directly with `python3 scripts/scaffold.py --skeleton <name>`.

### 1 · Masthead longform (`longform`)

Hairline nav → oversized serif title (48–76px, weight 200) → standfirst 20px ink-2, max 42ch → meta line (author · date · reading time) → rule → body at 68ch, `--s-5` between paragraphs, a plate every 3–4 paragraphs → byline and corrections → three related reads → footer

Above the fold you must have: title + standfirst + date. **An article with no date has no credibility.**

### 2 · Image gallery (`gallery`)

Minimal top bar (brand + count + layout switch) → opening headline + one line of explanation + meta line (count / medium / year) → filter bar (**derived from the content automatically, never hard-coded**) → three layouts: masonry, two-column, single-plate → lightbox (← → to page, Esc to close, caption carries metadata)

### 3 · Index (`index`)

Top bar → title + one line of explanation → item rows separated by hairlines: 20px thumbnail | name (serif) | category | number (tabular-nums, right-aligned), row height `--s-6`, hover fills the whole row with `paper-2` → group headings in 11px uppercase ink-3 with `--s-7` of space above

Past 20 items you must add search. **Beyond four levels of hierarchy, replace clicking with search.**

### 4 · Single-column landing (`landing`)

Top bar (brand + 2–3 items + one primary CTA) → hero: headline + subhead + primary CTA + **one line of verifiable evidence** (a specific number or a specific name, not "industry-leading") → one paragraph stating the problem → three solution points (subhead + two lines + a plate) → evidence section (a real quote with a name and a role, or a clickable data source) → second CTA (same copy as the first) → footer

CTA copy **starts with a verb**: "Start a free quote" beats "Learn more".

### 5 · Docs / reference (`docs`)

Fixed contents on the left (current item highlighted, second level indented `--s-4`) → body on the right at 68ch, h2 with `--s-8` above and a hairline below, code blocks on `paper-3` in the mono face with square or 4px corners, callouts marked by a 2px solid accent rule on the left (no icon, no fill) → an "on this page" list on the right, desktop only

### 6 · Portfolio (`portfolio`)

Opening: name (oversized) + one-line positioning + contact → project list, each with a large plate (full width or 2/3) + project name (serif, 31px) + role + year + two lines of description (**write what problem you solved, not a list of responsibilities**) → CV download + contact

---

## 7 · Component specs

### Buttons

```css
.btn{
  min-height:48px;            /* 44px is the touch floor; this leaves margin */
  padding:0 26px;
  border-radius:0;            /* this style uses square or 2px, never pills */
  font-size:15px; font-weight:500;
  transition:.16s var(--ease);
}
.btn-primary{ background:var(--accent-bg); color:#fff }   /* 6.35:1 */
.btn-ghost{ background:transparent; border:1px solid var(--ink); color:var(--ink) }
.btn-ghost:hover{ background:var(--ink); color:var(--paper) }
```

One primary button per screen. The second action is a ghost button; the third is a plain text link.

### Inputs

```css
.input{
  min-height:48px; padding:0 16px;
  background:var(--paper-3);
  border:1px solid var(--rule-2);
  border-radius:0;
  font-size:16px;             /* below 16px iOS zooms the page automatically */
}
.input:focus{
  outline:2px solid var(--accent);
  outline-offset:2px;
  border-color:var(--accent);
}
```

**Never delete `outline`.** Removing the focus ring evicts every keyboard user.

Put the label **above** the input. Do not use a placeholder as a label — it disappears the moment typing starts.

### Cards

This style **does not build hierarchy with shadows**; it uses borders and whitespace. Only when something genuinely needs to float does it get one very faint shadow: `0 14px 34px rgba(26,24,21,.08)`.

### Tables

```css
th{ font-size:11px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--ink-3); font-weight:600; text-align:left }
td{ font-size:14px; padding:var(--s-3) var(--s-4);
    border-bottom:1px solid var(--rule) }
td.num{ font-variant-numeric:tabular-nums; text-align:right }
```

The fainter the grid lines the better — the grid is a reference, not the subject. Zebra stripes use `paper-2`, and only past 8 rows.

### Dividers

- A solid `--rule` is an assertion; use it to separate structure
- A dashed line is hesitation, and **this style essentially never uses one**
- Whitespace is trust; reach for whitespace first, and add a rule only when it is not enough

---

## 8 · Pre-delivery self-check

```
[ ] Body contrast ≥ 4.5:1, large text ≥ 3:1 (measured, not estimated)
[ ] Touch targets ≥ 44px
[ ] Focus ring visible, not killed by outline:none
[ ] Body ≥ 16px, line length 45–75 characters
[ ] Numbers use tabular-nums
[ ] One accent colour per page, two font families at most
[ ] Images have alt text describing content, not keywords
[ ] prefers-reduced-motion degrades correctly
[ ] Checked at all four breakpoints: 375 / 768 / 1024 / 1440
[ ] Print stylesheet (@media print) — content in this style is very likely to be printed
[ ] No emoji used as icons (use SVG)
[ ] Every clickable element has cursor:pointer and a hover state
```

The anti-pattern list lives in [`anti-patterns.md`](anti-patterns.md).
