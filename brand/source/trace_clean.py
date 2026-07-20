#!/usr/bin/env python3
"""
Trace the NOTHO icon into one clean vector layer per brand colour.

A direct colour trace of the source produces ~37 overlapping shading bands in
near-identical hues -- technically vector, useless to edit. Instead: classify
every pixel to the nearest of the mark's four base colours, clean the resulting
masks, and trace each as a single flat region. Shading is re-applied as real SVG
gradients afterwards, so the depth survives but the geometry stays editable.
"""
import os, re
from PIL import Image, ImageFilter
import vtracer

SRC = '/sessions/zen-amazing-hypatia/mnt/fundi-finance/public/notho-icon.png'
TMP = '/tmp/tclean'
SCALE = 4
os.makedirs(TMP, exist_ok=True)

# Sampled from the source via median-cut quantisation.
BASE = {
    'white':      (0xFF, 0xFF, 0xFF),
    'teal_hi':    (0x40, 0xBE, 0xC0),
    'teal_light': (0x04, 0x9D, 0xA7),
    'teal_dark':  (0x01, 0x7B, 0x84),
    # The ribbon's shaded underside. Without its own target it gets pulled to
    # blue -- deep teal and navy sit close together in RGB, and the fold at the
    # top of the stem was landing in the blue layer.
    'teal_shade': (0x03, 0x46, 0x49),
    'gold':       (0xEA, 0xAC, 0x3E),
    'gold_dark':  (0xC5, 0x8F, 0x34),
    'blue':       (0x0A, 0x33, 0x86),
    'blue_dark':  (0x09, 0x23, 0x61),
}

# Extra classification targets exist only to keep pixels away from the wrong
# layer; they collapse back into the four real brand colours before tracing.
MERGE = {
    'teal_hi': 'teal_light', 'teal_shade': 'teal_dark',
    'gold_dark': 'gold', 'blue_dark': 'blue',
}
# Painted back-to-front. The blue leaf sits in front of the gold; both sit in
# front of the teal N.
ORDER = ['teal_dark', 'teal_light', 'gold', 'blue']


def load():
    im = Image.open(SRC).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(bg, im).convert('RGB')
    return im.resize((im.width * SCALE, im.height * SCALE), Image.LANCZOS)


def classify(im):
    """Nearest-base-colour label per pixel, weighted toward human luma."""
    px = list(im.getdata())
    names = list(BASE)
    cols = [BASE[n] for n in names]
    out = []
    for r, g, b in px:
        best, bi = 1e18, 0
        for i, (cr, cg, cb) in enumerate(cols):
            # weighted euclidean - green carries most perceived luminance
            d = 2 * (r - cr) ** 2 + 4 * (g - cg) ** 2 + 3 * (b - cb) ** 2
            if d < best:
                best, bi = d, i
        out.append(bi)
    return out, names


def mask_for(labels, names, target, size, grow=2):
    members = {target} | {k for k, v in MERGE.items() if v == target}
    idxs = {names.index(m) for m in members if m in names}
    """Binary mask (black shape on white), speckle-cleaned and slightly grown
    so adjacent colour regions butt together instead of leaving hairline gaps."""
    m = Image.new('L', size, 255)
    m.putdata([0 if l in idxs else 255 for l in labels])
    m = m.filter(ImageFilter.ModeFilter(7))          # kill speckle
    m = m.filter(ImageFilter.MinFilter(3))           # grow the black shape
    if grow > 1:
        m = m.filter(ImageFilter.MinFilter(grow * 2 + 1))
    return m


def trace_mask(m, tag):
    src = f'{TMP}/{tag}_mask.png'
    dst = f'{TMP}/{tag}.svg'
    m.convert('RGB').save(src)
    vtracer.convert_image_to_svg_py(
        src, dst, colormode='binary', mode='spline', hierarchical='stacked',
        filter_speckle=int(10 * SCALE), corner_threshold=68,
        length_threshold=9.0, splice_threshold=45, path_precision=2,
        max_iterations=10)
    s = open(dst).read()
    # vtracer emits every subpath starting at M0 0 and places it with a
    # per-element transform. Bake that translate into the coordinates so the
    # paths are self-contained and can be concatenated.
    out = []
    for el in re.finditer(r'<path\b[^>]*?>', s):
        tag = el.group(0)
        dm = re.search(r'\sd="([^"]+)"', tag)
        if not dm or len(dm.group(1)) < 120:
            continue
        tm = re.search(r'translate\(([-\d.]+)[,\s]+([-\d.]+)\)', tag)
        dx, dy = (float(tm.group(1)), float(tm.group(2))) if tm else (0.0, 0.0)
        out.append(bake(dm.group(1), dx, dy))
    return out


def bake(d, dx, dy):
    """Apply a translate to every coordinate pair in an M/C/Z path."""
    toks = re.findall(r'[MCZmcz]|-?\d+\.?\d*', d)
    res, i, flip = [], 0, 0
    while i < len(toks):
        t = toks[i]
        if t in 'MCZmcz':
            res.append(t.upper()); flip = 0; i += 1; continue
        x = float(t) + dx
        y = float(toks[i + 1]) + dy
        res.append(f'{x:.2f} {y:.2f}')
        i += 2
    return ' '.join(res)


def main():
    im = load()
    labels, names = classify(im)
    W, H = im.size
    layers = {}
    for c in ORDER:
        ds = trace_mask(mask_for(labels, names, c, (W, H)), c)
        layers[c] = ds
        print(f'{c:11s} subpaths={len(ds):2d} nodes={sum(d.count("C") for d in ds)}')
    return layers, (W, H)


if __name__ == '__main__':
    layers, size = main()
    import json
    json.dump({'layers': layers, 'w': size[0], 'h': size[1]},
              open(f'{TMP}/layers.json', 'w'))
    print('saved', f'{TMP}/layers.json')
