# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## [1.1.0]

### Added
- **Three dials** — `--density` / `--contrast` / `--texture` (1–10, default 5). They control, in order: how often a secondary structure appears, the minimum brightness gap between ground and primary colour, and the strength of misregistration and grain.
- The contact sheet `--contact` is now documented as the recommended review step.
- `skill.sh`, a one-line install script. It checks dependencies and installs nothing on your behalf.
- Showcase images under `assets/`; README rewritten with a pattern table, a dial comparison, and an FAQ.
- GitHub Actions smoke test: three dial combinations, each rendered once and its output verified.
- `examples/` with ready-to-run recipes.

### Changed
- Every entry in `art.json` gains a `dials` field recording the dial values used, so a plate can be reproduced.

## [1.0.0]

First release.

### Added
- 10 pattern structures: halftone · hatch · ripple · scatter · wave · grid · stripe · block · trace · horizon
- An 18-colour palette split into a warm and a cool axis, every colour named.
- 3 masks — torn paper, colour band, disc — which hold the secondary structure to roughly 40% of the frame.
- Riso post-processing: misregistration + paper grain + uneven ink + softening.
- Titles derived automatically from "primary colour · primary structure".
- `gallery.py`, a gallery page builder: three layouts, a lightbox, and structure filtering, in one self-contained file.
- Full parameter documentation in `references/palette.md` and `references/patterns.md`.
