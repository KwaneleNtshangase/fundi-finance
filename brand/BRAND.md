# NOTHO — logo spec

These assets are **traced from your own artwork** (`public/notho-logo.png`,
`public/notho-icon.png`), not redrawn. The geometry is your logo in vector form.

Regenerate with `python3 source/build_final.py` (requires `trace_clean.py` and
`trace_word.py` to have run first).

---

## The structural rule

**The icon is the letter N.** The wordmark is therefore **OTHO**, not NOTHO.
Setting the icon next to the word "NOTHO" makes the logo read *N-NOTHO*. If you
need the name as plain text with no icon, type the full word — but never place
the full word beside the mark.

---

## Files

| Path | Use |
|---|---|
| `svg/notho-logo-full.svg` | Primary lockup — icon + OTHO + tagline, navy on light. |
| `svg/notho-logo-full-on-dark.svg` | Same, recoloured for dark backgrounds. |
| `svg/notho-logo-no-tagline.svg` | Below ~400px wide the tagline turns to mud. Use this. |
| `svg/notho-logo-no-tagline-on-dark.svg` | Dark-background version of the above. |
| `svg/notho-icon-mark.svg` | Icon alone, gradient-shaded. |
| `svg/notho-icon-flat.svg` | Icon alone, flat colour — for embroidery, single-colour print, or anywhere gradients won't reproduce. |
| `svg/notho-wordmark-otho.svg` | OTHO alone. |
| `svg/notho-app-icon-light.svg` / `-dark.svg` | Square app icon, iOS corner radius. |
| `png/`, `pdf/`, `app-icon/` | Rasters, print, and icon sizes. |
| `source/` | The tracing and assembly pipeline. |

All SVGs carry one editable path per colour region, with `<title>` labels —
they open in Figma or Illustrator as named, selectable layers.

---

## Geometry

Measured from the source artwork. Cap height **H = 205px** at source scale;
every ratio below holds at any size.

| Measure | Source px | In units of H |
|---|---|---|
| Wordmark cap height (T, H) | 205 | 1.000 |
| Round-letter height (O) | 214 | 1.044 — optical overshoot |
| Icon height | 202 | 0.985 |
| Icon width | 209 | 1.020 |
| Gap: icon → O | 36 | 0.176 |
| Wordmark width (OTHO) | 953 | 4.649 |
| Tagline cap height | 35 | 0.171 |
| Wordmark baseline → tagline baseline | 79 | 0.385 |
| Clear space (all sides) | 78 | 0.380 |

The icon's optical centre sits **13px above** the cap-band centre — it is not
centred on the letters mathematically. Keep that offset when rescaling.

---

## Colour

| Element | Value |
|---|---|
| Wordmark | `#083088` |
| Tagline — LEARN | `#109898` |
| Tagline — dots + GROW | `#E8A838` |
| Tagline — BUILD WEALTH | `#083080` |

Icon, as flat colour (`notho-icon-flat.svg`):

| Region | Value |
|---|---|
| N — teal ribbon | `#049DA7` |
| Leaf — gold + dot | `#EAAC3E` |
| Leaf — blue | `#0A3A71` |

## How the icon's shading works — read this before editing

The artwork shades in **two dimensions**: light falls across the ribbon and
along its length. An SVG linear gradient is one-dimensional. Projecting the
artwork onto a single axis and averaging into bands mixes light stem pixels
with dark diagonal pixels sitting at the same projection distance, so contrast
collapses. Measured: the source teal spans a luminance range of **89**; the
best possible 1-D gradient fit reproduces **76**. That gap is inherent to the
model — it is why adding stops, splitting the shape, or layering a soft shading
overlay all failed in turn.

The shipping icon therefore keeps **traced vector outlines** for geometry
(crisp at any scale, editable as paths) and takes its **shading from the source
raster, clipped to those outlines**. Measured against the source:

| | mean pixel difference | teal luminance range |
|---|---|---|
| Source artwork | — | 89 |
| Shipping icon (clipped shading) | **0.53 / 255** | **90** |
| Pure-vector alternate | 6.22 / 255 | 76 |
| Full lockup vs your logo file | **0.92 / 255** | — |

Artwork colour is bled outward past the outline before clipping, so the clip
always cuts through solid colour instead of exposing a hairline of white where
the vector edge and raster edge disagree by a pixel.

### If you need a raster-free file

`svg/notho-icon-mark-purevector.svg` (29 KB vs 701 KB) and
`svg/notho-logo-full-purevector.svg` (99 KB vs 771 KB) are pure vector with no
embedded image. They are visibly flatter — the shading loses roughly 15% of its
contrast — so use them only where an embedded raster is genuinely unacceptable.

For flat single-colour reproduction (embroidery, one-colour print) use
`svg/notho-icon-flat.svg`.

**Dark-background tagline** uses lifted values — `#2ED6D2`, `#F6BE3C`, `#8FA9F0`.
The light-mode navy fails contrast on dark, and the light-mode teal and gold
fail WCAG AA on white at tagline size, which is worth knowing if the tagline
ever gets used as live text.

---

## Type

The wordmark closest match is **Outfit Bold (700)** — free, on Google Fonts.
Verified against the artwork: the O width ratio (1.051 vs 1.049 measured) and
the stem weight (0.222 vs 0.222) both match. The T is slightly narrower in
Outfit than in your original, so Outfit is a very close substitute rather than
a confirmed identification.

The shipping files use **traced outlines**, so they need no font installed and
match your artwork exactly. Use Outfit only if you need to set new text in the
brand voice.

Montserrat — recommended in the original build notes — is **not** the font. Its
O is 6% too wide and its H 10% too wide.

---

## How these were made

1. Classify every pixel of the source icon to one of the brand base colours.
   A direct colour trace produces ~37 overlapping shading bands in near
   identical hues — technically vector, useless to edit.
2. Clean the resulting masks, trace each as one flat region.
3. Re-apply shading as real SVG gradients, so depth survives but geometry
   stays editable.
4. Trace the wordmark and tagline separately (flat colour, no classification
   needed), splitting the tagline between words so both dots stay gold.
5. Reassemble at the proportions measured off the original.

---

## Superseded

`source/ribbon.py`, `mark.py`, `lockup.py` and `export.py` are stubs. They
belonged to an earlier from-scratch rebuild that drew the wrong mark and set
the wordmark as "NOTHO". Nothing in the shipping set depends on them.
