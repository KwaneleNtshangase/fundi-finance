# Illustrator brief — Fundi becomes Cosmo

The app rebranded from Fundi Finance to **Notho**. The coach character is now
**Cosmo**. Her artwork still carries the old branding and needs redrawing.

## Files

`public/characters/` — four poses, 676 × 369 px, RGBA with transparency:

- `cosmo-default.png`
- `cosmo-thinking.png`
- `cosmo-sad.png`
- `cosmo-celebrating.png`

They are already renamed and the app already loads them at these paths, so
dropping replacements in at the same names and dimensions is all that's needed.
No code change.

## What has to change

Four instances of the old brand are painted into her school uniform. Vest bounding
box is roughly **x 304–375, y 144–223** in all four poses (the torso shifts a few
pixels between them, so check each rather than reusing one set of coordinates).

1. **Left chest** — "FUNDI" plus a small tagline underneath, in gold
2. **Centre chest** — large "F" monogram, gold with a dark outline
3. **Below the monogram** — "FUNDI" in gold caps
4. **Backpack strap, right shoulder** — circular gold badge with an "F"

Nothing else about her changes. Same character, same four expressions, same pose,
same linework and flat-colour cel style with the heavy dark outline.

## What to put there instead

Replace the "F" monogram and both wordmarks with either a **"C"** monogram or
the Notho mark. Your call which reads better at small sizes — she renders as
small as 80 px tall in the app, so the chest detail is often only a few pixels.
If the wordmarks are illegible at that size, dropping them entirely and keeping
just the monogram is the better result. A clean vest beats unreadable text.

## Palette

The uniform is currently purple and orange, which no longer relates to anything.
Moving it onto the brand palette would be good, though it is not essential — her
existing purple/gold does sit acceptably against the new navy and gold.

| Role | Hex |
|---|---|
| Teal, bright | `#01A0AA` |
| Teal, deep | `#007A85` |
| Gold | `#EFB343` |
| Navy | `#0D368D` |

Navy vest with gold monogram would echo the logo most directly. Keep her skin
tone, hair and the SA coin exactly as they are.

## Constraints

- **676 × 369 px, PNG with alpha.** Same canvas, same position within it, so the
  four expressions stay registered with each other.
- Must read at **80 px tall**. Check before delivering.
- Transparent background, no baked-in white.
- Keep the four expressions clearly distinguishable: default, thinking, sad,
  celebrating. They're used for correct answers, wrong answers and lesson
  completion, so the emotional read has to survive at small sizes.

## Why this wasn't done in code

It was attempted. The lettering is rasterised into the illustration, not a
separate layer, so removing it means reconstructing the knit texture underneath.
Automated fill produced chewed glyph edges, left "FUNDI" still legible, and
damaged the collar and skirt pleats. It was reverted rather than shipped.
