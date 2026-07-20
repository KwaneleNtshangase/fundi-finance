#!/usr/bin/env python3
"""
Trace the OTHO wordmark and the tagline out of the real logo raster.

The icon carries the letter N, so the wordmark is only "OTHO" -- this is the
structural fact the earlier rebuild got wrong. Wordmark and tagline are flat
colour, so they trace cleanly without the colour-classification pass the
gradient-shaded icon needed.
"""
import os, re
from PIL import Image, ImageFilter
import vtracer

SRC = '/sessions/zen-amazing-hypatia/mnt/fundi-finance/public/notho-logo.png'
TMP = '/tmp/tword'
SCALE = 4
os.makedirs(TMP, exist_ok=True)

# Measured from the source, in source pixels.
GEO = dict(word_x=(245, 1198), word_y=(0, 240), cap=205, cap_top=13, baseline=217,
           icon_x=(1, 210), icon_y=(1, 202),
           tag_y=(250, 297), gap=36)

# Sampled brand colours.
INK = dict(navy='#083088', teal='#109898', gold='#E8A838')

# Tagline colour runs, as x-ranges in source pixels.
# Split between words, not through them. Measured group edges:
# LEARN 15-237 | dot 292-307 | GROW 359-554 | dot 609-623 | BUILD WEALTH 678-1189
# Both dots are gold, so they belong to the middle run.
TAG_RUNS = [('teal', 0, 270), ('gold', 270, 650), ('navy', 650, 1200)]


def bake(d, dx, dy, s=1.0):
    toks = re.findall(r'[MCZmcz]|-?\d+\.?\d*', d)
    res, i = [], 0
    while i < len(toks):
        t = toks[i]
        if t in 'MCZmcz':
            res.append(t.upper()); i += 1; continue
        res.append(f'{(float(t) + dx) * s:.2f} {(float(toks[i+1]) + dy) * s:.2f}')
        i += 2
    return ' '.join(res)


def trace(mask, tag, speckle=8):
    src, dst = f'{TMP}/{tag}.png', f'{TMP}/{tag}.svg'
    mask.convert('RGB').save(src)
    vtracer.convert_image_to_svg_py(
        src, dst, colormode='binary', mode='spline', hierarchical='stacked',
        filter_speckle=int(speckle * SCALE), corner_threshold=66,
        length_threshold=6.0, splice_threshold=45, path_precision=2,
        max_iterations=10)
    s = open(dst).read()
    out = []
    for el in re.finditer(r'<path\b[^>]*?>', s):
        t = el.group(0)
        dm = re.search(r'\sd="([^"]+)"', t)
        if not dm or len(dm.group(1)) < 90:
            continue
        tm = re.search(r'translate\(([-\d.]+)[,\s]+([-\d.]+)\)', t)
        dx, dy = (float(tm.group(1)), float(tm.group(2))) if tm else (0.0, 0.0)
        out.append(bake(dm.group(1), dx, dy, 1.0 / SCALE))
    return out


def region(box):
    im = Image.open(SRC).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(bg, im).convert('RGB').crop(box)
    return im.resize((im.width * SCALE, im.height * SCALE), Image.LANCZOS)


def to_mask(im, thresh=200):
    g = im.convert('L').point(lambda p: 0 if p < thresh else 255)
    return g.filter(ImageFilter.ModeFilter(5))


def main():
    out = {}
    # ---- wordmark OTHO
    wx, wy = GEO['word_x'], GEO['word_y']
    im = region((wx[0], wy[0], wx[1], wy[1]))
    ds = trace(to_mask(im), 'word')
    out['word'] = [bake(d, wx[0], wy[0]) for d in ds]

    # ---- tagline, split into its three colour runs
    ty = GEO['tag_y']
    out['tag'] = {}
    for name, x0, x1 in TAG_RUNS:
        im = region((x0, ty[0], x1, ty[1]))
        ds = trace(to_mask(im), f'tag_{name}', speckle=3)
        out['tag'][name] = [bake(d, x0, ty[0]) for d in ds]
    return out


if __name__ == '__main__':
    import json
    r = main()
    print('word subpaths:', len(r['word']), 'nodes:', sum(d.count('C') for d in r['word']))
    for k, v in r['tag'].items():
        print(f'tag {k:5s} subpaths={len(v):3d} nodes={sum(d.count("C") for d in v)}')
    json.dump({**r, 'geo': GEO, 'ink': INK}, open(f'{TMP}/word.json', 'w'))
    print('saved', f'{TMP}/word.json')
