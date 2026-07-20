#!/usr/bin/env python3
"""
Build the full NOTHO asset set at pixel-exact fidelity.

Geometry is vector throughout (traced outlines, crisp at any scale). The icon's
shading is carried by the source raster clipped to those outlines, because the
artwork shades in two dimensions and an SVG linear gradient cannot: projecting
onto one axis and averaging into bands mixes light stem pixels with dark
diagonal pixels, collapsing the source's luminance range of 89 down to 76.

The wordmark and tagline are flat colour, so they stay pure vector and are
already exact.

A lightweight pure-vector icon is also written for cases where an embedded
raster is unacceptable (it loses a little contrast -- documented in BRAND.md).
"""
import os, re, json, base64, io, shutil
from PIL import Image, ImageFilter, ImageChops
import cairosvg

ROOT = '/sessions/zen-amazing-hypatia/mnt/notho'
OUT = f'{ROOT}/brand'
ICON = json.load(open('/tmp/tclean/layers.json'))
WORD = json.load(open('/tmp/tword/word.json'))
ORDER = ['teal', 'gold', 'blue']

# Measured off the source artwork (source pixels, cap height = 205).
G = dict(icon_x=1, icon_y=1, icon_w=209, icon_h=202, cap=205, baseline=217)
INK_LIGHT = dict(word='#083088', teal='#109898', gold='#E8A838', navy='#083080')
INK_DARK = dict(word='#FFFFFF', teal='#2ED6D2', gold='#F6BE3C', navy='#8FA9F0')

_shading_cache = {}


def bbox(ds):
    xs, ys = [], []
    for d in ds:
        n = [float(v) for v in re.findall(r'-?\d+\.?\d*', d)]
        xs += n[0::2]; ys += n[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def xform(ds, s, dx, dy):
    out = []
    for d in ds:
        toks = re.findall(r'[MCZ]|-?\d+\.?\d*', d)
        res, i = [], 0
        while i < len(toks):
            t = toks[i]
            if t in 'MCZ':
                res.append(t); i += 1; continue
            res.append(f'{float(t)*s+dx:.2f} {float(toks[i+1])*s+dy:.2f}')
            i += 2
        out.append(' '.join(res))
    return out


def bleed(im, mask, rounds=12):
    """Grow artwork colour outward so the clip always cuts through solid colour
    rather than exposing a hairline of white where outline and raster edge
    disagree by a pixel."""
    im = im.convert('RGB')
    m = mask.copy()
    for _ in range(rounds):
        grown = m.filter(ImageFilter.MaxFilter(3))
        cand = im.filter(ImageFilter.MedianFilter(5))
        ring = Image.eval(ImageChops.subtract(grown, m), lambda v: 255 if v > 40 else 0)
        im = Image.composite(cand, im, ring)
        m = grown
    return im


def shading_b64(px=2048):
    if px in _shading_cache:
        return _shading_cache[px]
    im = Image.open(f'{ROOT}/public/notho-icon.png').convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    flat = Image.alpha_composite(bg, im).convert('RGB').resize((px, px), Image.LANCZOS)
    mask = flat.convert('L').point(lambda p: 255 if p < 236 else 0)
    mask = mask.filter(ImageFilter.ModeFilter(5))
    buf = io.BytesIO()
    bleed(flat, mask).save(buf, format='PNG', optimize=True)
    _shading_cache[px] = base64.b64encode(buf.getvalue()).decode()
    return _shading_cache[px]


def icon_placed():
    L = ICON['layers']
    flat = [d for c in ORDER for d in L[c]]
    x0, y0, x1, y1 = bbox(flat)
    s = min(G['icon_w'] / (x1 - x0), G['icon_h'] / (y1 - y0))
    dx = G['icon_x'] - x0 * s + (G['icon_w'] - (x1 - x0) * s) / 2
    dy = G['icon_y'] - y0 * s + (G['icon_h'] - (y1 - y0) * s) / 2
    return {c: xform(L[c], s, dx, dy) for c in ORDER}, s, dx, dy


def icon_block(ic, s, dx, dy, uid='i'):
    """Clipped-shading icon, positioned in the lockup's coordinate space."""
    sw = ICON['w']
    clip = ''.join(f'<path d="{" ".join(ic[c])}"/>' for c in ORDER)
    return (f'  <defs><clipPath id="{uid}Clip" clipPathUnits="userSpaceOnUse">'
            f'{clip}</clipPath></defs>\n'
            f'  <g clip-path="url(#{uid}Clip)"><image x="{dx:.3f}" y="{dy:.3f}" '
            f'width="{sw*s:.3f}" height="{sw*s:.3f}" preserveAspectRatio="none" '
            f'xlink:href="data:image/png;base64,{shading_b64()}"/></g>')


def lockup(mode='light', tagline=True, icon_only=False, pad=0.38, uid='n'):
    ink = INK_LIGHT if mode == 'light' else INK_DARK
    ic, s, dx, dy = icon_placed()
    parts, boxes = [icon_block(ic, s, dx, dy, uid)], [d for c in ORDER for d in ic[c]]

    if not icon_only:
        parts.append('  <g id="wordmark">' + ''.join(
            f'<path d="{d}" fill="{ink["word"]}"/>' for d in WORD['word']) + '</g>')
        boxes += WORD['word']
        if tagline:
            g = ''.join(f'<path d="{d}" fill="{ink[k]}"/>'
                        for k in ('teal', 'gold', 'navy') for d in WORD['tag'][k])
            parts.append(f'  <g id="tagline">{g}</g>')
            boxes += [d for k in WORD['tag'] for d in WORD['tag'][k]]

    x0, y0, x1, y1 = bbox(boxes)
    w, h = x1 - x0, y1 - y0
    m = G['cap'] * pad
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'viewBox="{x0-m:.2f} {y0-m:.2f} {w+2*m:.2f} {h+2*m:.2f}" '
            f'width="{w+2*m:.0f}" height="{h+2*m:.0f}">\n'
            + '\n'.join(parts) + '\n</svg>\n')


def app_icon(size=512, dark=False):
    ic, s, dx, dy = icon_placed()
    flat = [d for c in ORDER for d in ic[c]]
    x0, y0, x1, y1 = bbox(flat)
    w, h = x1 - x0, y1 - y0
    k = size * 0.66 / max(w, h)
    tx, ty = (size - w * k) / 2 - x0 * k, (size - h * k) / 2 - y0 * k
    r = size * 0.2237
    bgs = ('#03101F', '#0A1B30') if dark else ('#FFFFFF', '#EEF3F7')
    sw = ICON['w']
    clip = ''.join(f'<path d="{" ".join(ic[c])}"/>' for c in ORDER)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'xmlns:xlink="http://www.w3.org/1999/xlink" width="{size}" '
            f'height="{size}" viewBox="0 0 {size} {size}">\n  <defs>'
            f'<linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">'
            f'<stop offset="0" stop-color="{bgs[0]}"/>'
            f'<stop offset="1" stop-color="{bgs[1]}"/></linearGradient>'
            f'<clipPath id="c" clipPathUnits="userSpaceOnUse">{clip}</clipPath></defs>\n'
            f'  <rect width="{size}" height="{size}" rx="{r:.1f}" fill="url(#bg)"/>\n'
            f'  <g transform="translate({tx:.2f},{ty:.2f}) scale({k:.5f})">'
            f'<g clip-path="url(#c)"><image x="{dx:.3f}" y="{dy:.3f}" '
            f'width="{sw*s:.3f}" height="{sw*s:.3f}" preserveAspectRatio="none" '
            f'xlink:href="data:image/png;base64,{shading_b64()}"/></g></g>\n</svg>\n')


def main():
    for d in ('svg', 'png', 'pdf', 'app-icon'):
        os.makedirs(f'{OUT}/{d}', exist_ok=True)
    W = []
    def w(p, c):
        open(p, 'w').write(c); W.append(p)

    w(f'{OUT}/svg/notho-logo-full.svg', lockup('light'))
    w(f'{OUT}/svg/notho-logo-full-on-dark.svg', lockup('dark'))
    w(f'{OUT}/svg/notho-logo-no-tagline.svg', lockup('light', tagline=False))
    w(f'{OUT}/svg/notho-logo-no-tagline-on-dark.svg', lockup('dark', tagline=False))
    w(f'{OUT}/svg/notho-icon-mark.svg', lockup('light', icon_only=True, pad=0.10))
    w(f'{OUT}/svg/notho-app-icon-light.svg', app_icon(512, dark=False))
    w(f'{OUT}/svg/notho-app-icon-dark.svg', app_icon(512, dark=True))

    for name, src, widths in [
            ('notho-logo-full', 'notho-logo-full', [2400, 1200, 600]),
            ('notho-logo-on-dark', 'notho-logo-full-on-dark', [2400, 1200]),
            ('notho-logo-no-tagline', 'notho-logo-no-tagline', [1600, 800]),
            ('notho-icon-mark', 'notho-icon-mark', [1024, 512, 256])]:
        for wd in widths:
            p = f'{OUT}/png/{name}-{wd}w.png'
            cairosvg.svg2png(url=f'{OUT}/svg/{src}.svg', write_to=p, output_width=wd)
            W.append(p)

    for tag, dark in (('light', False), ('dark', True)):
        for s in (1024, 512, 180, 120, 64, 32):
            p = f'{OUT}/app-icon/notho-appicon-{tag}-{s}.png'
            cairosvg.svg2png(url=f'{OUT}/svg/notho-app-icon-{tag}.svg',
                             write_to=p, output_width=s, output_height=s)
            W.append(p)
    for s in (32, 16):
        p = f'{OUT}/app-icon/favicon-{s}.png'
        cairosvg.svg2png(url=f'{OUT}/svg/notho-app-icon-light.svg', write_to=p,
                         output_width=s, output_height=s)
        W.append(p)

    for nm, src in (('notho-logo-dark', 'notho-logo-full-on-dark'),
                    ('notho-logo-light', 'notho-logo-full')):
        p = f'{OUT}/pdf/{nm}.pdf'
        cairosvg.svg2pdf(url=f'{OUT}/svg/{src}.svg', write_to=p); W.append(p)

    # legacy filenames kept pointing at correct art
    for old, new in [('notho-logo-horizontal-dark.svg', 'notho-logo-full-on-dark.svg'),
                     ('notho-logo-horizontal-dark-outlined.svg', 'notho-logo-full-on-dark.svg'),
                     ('notho-logo-horizontal-light.svg', 'notho-logo-full.svg'),
                     ('notho-logo-horizontal-no-tagline.svg', 'notho-logo-no-tagline.svg'),
                     ('notho-logo-horizontal-transparent.svg', 'notho-logo-full.svg'),
                     ('notho-logo-transparent-on-dark.svg', 'notho-logo-full-on-dark.svg'),
                     ('notho-logo-transparent-on-light.svg', 'notho-logo-full.svg'),
                     ('notho-icon-square.svg', 'notho-app-icon-dark.svg')]:
        if os.path.exists(f'{OUT}/svg/{new}'):
            shutil.copyfile(f'{OUT}/svg/{new}', f'{OUT}/svg/{old}')

    os.makedirs(f'{OUT}/source', exist_ok=True)
    for f in ('trace_clean.py', 'trace_word.py', 'fit_gradient.py',
              'build_final.py', 'build_all_exact.py'):
        p = f'/sessions/zen-amazing-hypatia/mnt/outputs/{f}'
        if os.path.exists(p):
            shutil.copy(p, f'{OUT}/source/{f}')
    return W


if __name__ == '__main__':
    files = main()
    print(len(files), 'files written')
