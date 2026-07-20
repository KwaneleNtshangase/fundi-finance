# NOTHO — flat colour system

Solid fills only. This is the reproduction-safe set: it survives embroidery,
screen print, vinyl cutting, engraving, embossing, fax and photocopy with no
judgement call needed at the point of use.

Files live in `brand/flat/`. The gradient set stays in `brand/svg/` as an
approved digital-only variant.

---

## Palette

| Role | Hex | RGB | CMYK (approx) | Pantone (starting point) |
|---|---|---|---|---|
| Teal | `#0C9098` | 12, 144, 152 | 92 / 5 / 0 / 40 | 321 C |
| Gold | `#E8A838` | 232, 168, 56 | 0 / 28 / 76 / 9 | 143 C |
| Leaf navy | `#0A3A71` | 10, 58, 113 | 91 / 49 / 0 / 56 | 288 C |
| Brand navy | `#083088` | 8, 48, 136 | 94 / 65 / 0 / 47 | 287 C |

**CMYK values are conversions, not measurements.** Ask your printer to proof
before a long run. **Pantone references are starting points only** — match them
against a physical swatch book, never a screen.

On dark grounds the palette lifts, otherwise the leaf navy disappears:
teal `#17A8B0`, gold `#F0B849`, leaf `#2B58B4`.

---

## Files

| Path | Use |
|---|---|
| `flat/svg/notho-logo-flat.svg` | Primary flat lockup, light backgrounds |
| `flat/svg/notho-logo-flat-on-dark.svg` | Dark backgrounds |
| `flat/svg/notho-logo-flat-no-tagline.svg` | Below ~400px wide |
| `flat/svg/notho-icon-flat.svg` | Icon alone |
| `flat/svg/notho-logo-mono-navy.svg` | One ink, navy |
| `flat/svg/notho-logo-mono-white.svg` | One ink, reversed |
| `flat/svg/notho-logo-mono-black.svg` | One ink, black — fax, stamps, legal |
| `flat/svg/notho-icon-mono-*.svg` | One-ink icon, three inks |
| `flat/app-icon/` | Four grounds × six sizes |

---

## Findings from testing

These came out of putting the mark on real surfaces rather than a white square.

**The teal ground fails and has been corrected.** On a teal background the teal
N vanishes into it, leaving only the gold figure and blue leaf — a different
mark entirely. The teal-ground app icon now uses the reversed white version.
Never place the full-colour mark on teal.

**Below 32px, use the one-ink version.** At 16px the three-colour mark turns to
mud. Ship `notho-icon-mono-navy` as the 16px favicon.

**White ground is the recommended app icon.** It stays legible on any wallpaper
and doesn't compete with the OS. Dark and navy both work; teal only reversed.

**The mark survives one ink well.** The N, the figure and the leaf all stay
legible in a single colour, which is what makes embroidery and engraving safe.

---

## Embroidery

Three thread colours plus the garment. Give your embroiderer this:

- **Minimum size 45mm wide.** Below that the white gap between the stem and the
  ribbon closes up and the fold is lost. Test one before committing to a run.
- **The white gap is a real element, not a gap in the artwork.** On a coloured
  garment it should be left as the garment showing through, not stitched white,
  unless the garment is dark — then stitch it.
- On navy or black garments use `notho-icon-mono-white`. Three colours on a
  dark garment goes muddy.
- Ask for a **sew-out sample** before the full run. Digitising is interpretive
  and every shop does it differently.

## Screen print

Three screens for full colour, one for the mono version. No halftones needed
anywhere — that's the whole point of this set.

## Engraving, embossing, vinyl

Use `notho-icon-mono-black.svg`. Single closed paths, no overlaps.

---

## Clear space and minimum sizes

| | Minimum |
|---|---|
| Full lockup with tagline | 400px wide / 60mm |
| Lockup without tagline | 160px wide / 25mm |
| Icon alone | 24px / 8mm |
| Icon, embroidered | 45mm |

Clear space on all sides is 0.38 × the wordmark cap height — already built into
the SVG viewBoxes, so placing the file flush is correct.

---

## When to use gradient instead

The gradient set is approved for: app splash screens, the website hero, pitch
decks, social cover images. Anywhere you control the rendering and it will be
seen large and on screen.

Everywhere else, use flat. If you are unsure, use flat — that is the point of
having it as the primary.
