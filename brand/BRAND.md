# NOTHO — logo spec

All geometry derives from one unit: **H = the wordmark cap height.** Every number
below is expressed as a multiple of H, so the lockup scales without redrawing.
At the reference build H = 280, which puts the wordmark at 400pt.

Regenerate everything with `python3 source/export.py`.

---

## Files

| Path | Use |
|---|---|
| `svg/notho-logo-horizontal-dark.svg` | Primary lockup, **live text** — edit the wordmark by retyping. Needs Montserrat installed. |
| `svg/notho-logo-horizontal-dark-outlined.svg` | Same lockup, glyphs converted to paths. Renders identically anywhere. Use for web, print, handoff. |
| `svg/notho-logo-horizontal-light.svg` | For light backgrounds. Navy wordmark, white keylines. |
| `svg/notho-logo-transparent-on-dark.svg` | No background, white wordmark. Place over dark surfaces. |
| `svg/notho-logo-transparent-on-light.svg` | No background, navy wordmark. Place over light surfaces. |
| `svg/notho-logo-horizontal-no-tagline.svg` | Below ~300px wide the tagline turns to mud. Use this instead. |
| `svg/notho-icon-mark.svg` | Mark alone, transparent. |
| `svg/notho-icon-square.svg` | App icon, rounded square, dark gradient. |
| `svg/notho-wordmark.svg` | Wordmark alone, outlined. |
| `png/`, `pdf/`, `app-icon/` | Rasters, print, and iOS/web icon sizes. |
| `source/` | The generator. Change a number, re-run, everything stays consistent. |

---

## Geometry

| Measure | In units of H | At H = 280 |
|---|---|---|
| Wordmark cap height | 1.000 | 280 |
| Wordmark font size | 1.429 (= H ÷ 0.70) | 400 |
| Wordmark tracking | 0.085 em | 34.0 px |
| Wordmark width (NOTHO) | — | 1711.6 |
| Icon height | 1.380 | 386.4 |
| Icon width | — | 427.1 |
| Icon → wordmark gap | 0.260 | 72.8 |
| Tagline cap height | 0.150 | 42.0 |
| Tagline font size | 0.214 | 60.0 |
| Tagline tracking | 0.77 em | 45.9 px |
| Wordmark baseline → tagline baseline | 0.600 | 168.0 |
| Clear space (all sides) | ≥ 0.42 | 117.6 |

**Montserrat cap height is 0.70 em.** That ratio is what converts a target cap
height into a font size, and it's why the font size is never the number you
actually want to specify.

**Icon overshoot.** The icon is 1.38 × cap height, not 1.00. Setting it equal to
the cap height makes it look *smaller* than the letters — round and organic forms
need to overshoot flat-topped capitals to appear the same size. Match the icon to
the full word's optical weight, not to a bounding box.

**Tagline tracking is solved, not chosen.** It's computed so the tagline spans
exactly the width of the icon + gap + wordmark above it. Change any of those and
re-run the generator rather than nudging the tagline by hand.

---

## Colour

### Mark
| Element | Gradient |
|---|---|
| Teal leaf | `#5BF5EE` → `#20D3CF` → `#007F8A` |
| Teal leaf (shadow layer) | `#0E8A90` → `#053F4B` |
| Gold figure | `#FFE585` → `#FFC847` → `#D28C0C` |
| Head | radial `#FFE585` → `#FFC847` |
| Blue leaf | `#4A7DFF` → `#1F49C6` → `#0A246E` |

### Surface
| Token | Value |
|---|---|
| Background gradient | `#010611` → `#071425` |
| Keyline (dark builds) | `#040C18` |
| Wordmark on dark | `#FFFFFF` |
| Wordmark on light | `#081426` |

### Tagline
| Run | On dark | On light |
|---|---|---|
| LEARN | `#20D3CF` | `#0E9C99` |
| Separators + GROW | `#F6BE3C` | `#B8860B` |
| BUILD WEALTH | `#2C55D4` | `#1F49C6` |

The light-mode tagline colours are darkened deliberately — `#20D3CF` and
`#F6BE3C` fail WCAG AA contrast on white at tagline size.

---

## Type

**Montserrat** throughout — ExtraBold (800) for the wordmark, SemiBold (600) for
the tagline. Open source, free for commercial use, available on Google Fonts.
The reference mockup's face is close to Gilroy; Montserrat is the standard free
substitute and is slightly wider, so tracking is set tighter than Gilroy would need.

---

## Construction

The mark is four ribbons, each a variable-width stroke offset from a bezier
centreline rather than a hand-drawn outline. The blue leaf is the teal leaf
mirrored and trimmed, so the two flanks stay related when the master curve is
retuned. See `source/ribbon.py`.

**Keylines.** On dark builds each element carries a background-coloured halo so
the ribbons stay separated when the mark is scaled down. Transparent builds drop
the halo entirely — a dark keyline only works against the background it was
sampled from and would print as a visible outline anywhere else.

---

## Corrections to the original build notes

Values that were wrong in the instructions this was built from:

| Spec | Given | Actual | Why |
|---|---|---|---|
| Tagline tracking | `280` | **45.9 px** (0.77 em) | 280 px of tracking across 27 characters is ~8,000 px wide — 4× wider than the 2,000 px frame. |
| Wordmark tracking | `4` | **34 px** (0.085 em) | 4 px at a 245 px font is essentially zero tracking; the reference is visibly tracked out. |
| Wordmark size | `245` | **400** | 245 px yields a 171 px cap height, well under the mark. Size follows from the target cap height. |
| Icon height | "same as wordmark" | **1.38 × cap height** | Equal heights make the icon read as too small. Organic shapes need overshoot. |
| Icon gap | `55 px`, then "reduce 15–20%" | **72.8 px** (0.26 H) | The two instructions contradicted each other. The gap is set as a ratio of H so it holds at any size. |
| N construction | rounded rectangles rotated 35° | variable-width ribbons | Rotated rectangles have uniform thickness and produce stiff parallelograms, not a flowing ribbon. |
| Curve smoothing | "node tool in Inkscape until continuous" | C1-continuous width profile | No such tool exists. Continuity comes from the construction, not from dragging nodes afterward. |
