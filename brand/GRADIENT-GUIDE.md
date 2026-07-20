# Finishing the teal gradient by hand — Figma

The shapes, colours, spacing and typography in `svg/notho-logo-full.svg` are
traced from your artwork and correct. The only thing not fully reproduced is the
teal's shading.

**Why automation stalled:** your teal shades in two directions at once — light
falls across the ribbon *and* along its length. A single SVG linear gradient only
shades in one direction, so it flattens out. Measured, your teal spans a
luminance range of 89; the best single-gradient fit reaches 76.

**Why doing it by hand works:** Figma lets you stack *multiple fills* on one
layer. Two gradients at different angles produce the two-directional shading a
single gradient can't. It takes about ten minutes.

---

## Setup

1. figma.com → **New design file**
2. Drag `svg/notho-icon-mark.svg` onto the canvas
3. Right-click it → **Ungroup** (`Ctrl/Cmd + Shift + G`) until you see three
   layers: `N / teal ribbon`, `Leaf / gold + dot`, `Leaf / blue`
4. Drag `public/notho-icon.png` in beside it, same size — this is your reference
   to check against. Select it and press `Ctrl/Cmd + Shift + L` to lock it.

---

## The teal — two stacked fills

Select the **`N / teal ribbon`** layer. In the right panel under **Fill** you'll
see one linear gradient already there.

### Fill 1 — the base (already correct, leave it)

Ten stops running `#25A3AA` → `#0A646E`, angled down-right. This is the ramp
along the ribbon's length.

### Fill 2 — the cross-shading (this is the missing piece)

1. In the **Fill** section click **+** to add a second fill
2. Set its type to **Linear**
3. Click the fill's colour swatch. Set **two stops**:
   - Left stop: `#003B42`, opacity **55%**
   - Right stop: `#003B42`, opacity **0%**
4. Set the fill's blend mode (the icon beside the opacity field) to **Normal**
5. On the canvas, drag the gradient handles so the dark end sits at the
   **left edge of the vertical stem** and the transparent end reaches about
   **one third across** — roughly horizontal, left to right

That second fill darkens the left flank without touching the ramp underneath.
Two directions, two fills.

### Fill 3 — optional, the lower diagonal

If the bottom of the diagonal still looks too light next to your reference:

1. Add a third fill, Linear
2. Stops: `#02575F` at **40%** opacity → same colour at **0%**
3. Drag the handles so the dark end sits at the **bottom-right** where the teal
   meets the blue leaf, fading up and left

---

## Checking your work

Toggle the reference PNG's visibility on and off (`Ctrl/Cmd + Shift + H`) and
watch the teal. You're looking for the darkest and lightest points to land in the
same places. Ignore the mottled patches in the reference — those are compression
artefacts in the PNG, not design.

If a fill looks like a visible band rather than a fade, its two stops are too
close together on the canvas. Drag them further apart.

---

## Gold and blue

Both are close already. If you want to match them more tightly, the same
two-fill technique applies:

| Layer | Base gradient | Add if needed |
|---|---|---|
| Gold leaf | `#F1BE56` → `#E2A335` | `#B87D14` at 35% → 0%, from the lower-right |
| Blue leaf | `#274E9B` → `#0C2A5B` | `#06183C` at 40% → 0%, from the bottom |

---

## Exporting

Select the frame → **Export** panel (bottom right) → **+** for each format:

- **SVG** — for web and for keeping as source
- **PNG @2x and @4x** — for anything raster
- **PDF** — for print

Tick **Include "id" attribute** on the SVG export so the layer names survive.

---

## What not to do

Don't apply a drop shadow or an inner shadow to fake the depth. It will look
correct on white and wrong on every other background, and it won't survive
conversion to PDF or embroidery files.

Don't use Canva for this step. It doesn't support multiple fills per shape,
which is the whole technique here.
