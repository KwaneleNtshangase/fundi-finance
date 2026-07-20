#!/usr/bin/env python3
"""
Build the NOTHO flat-colour system.

Solid fills only -- no gradients anywhere. This is the reproduction-safe set:
it survives embroidery, screen print, vinyl, engraving, fax and photocopy
without any judgement call at the point of use.

Colour choices are the measured medians of each region in the source artwork,
not arbitrary picks. Flat colour reads slightly duller than the same hue under
a gradient, so each is taken from the middle of its region's range rather than
its darkest point.
"""
import os, re, json, shutil
import cairosvg

ROOT = '/sessions/zen-amazing-hypatia/mnt/notho'
OUT = f'{ROOT}/brand'
ICON = json.load(open('/tmp/tclean/layers.json'))
WORD = json.load(open('/tmp/tword/word.json'))
ORDER = ['teal', 'gold', 'blue']

# --------------------------------------------------------------- palette
TEAL = '#0C9098'      # median of the teal ribbon
GOLD = '#E8A838'      # dominant gold, matches the tagline gold exactly
LEAF = '#0A3A71'      # deep navy of the blue leaf
NAVY = '#083088'      # brand navy, used for the wordmark and tagline
WHITE = '#FFFFFF'

FLAT_LIGHT = {'teal': TEAL, 'gold': GOLD, 'blue': LEAF}
# On dark grounds the leaf navy disappears; lift it and the teal.
FLAT_DARK = {'teal': '#17A8B0', 'gold': '#F0B849', 'blue': '#2B58B4'}

INK_LIGHT = dict(word=NAVY, teal='#109898', gold=GOLD, navy='#083080')
INK_DARK = dict(word=WHITE, teal='#2ED6D2', gold='#F6BE3C', navy='#8FA9F0')

G = dict(icon_x=1, icon_y=1, icon_w=209, icon_h=202, cap=205)


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


def icon_placed():
    L = ICON['layers']
    flat = [d for c in ORDER for d in L[c]]
    x0, y0, x1, y1 = bbox(flat)
    s = min(G['icon_w'] / (x1 - x0), G['icon_h'] / (y1 - y0))
    dx = G['icon_x'] - x0 * s + (G['icon_w'] - (x1 - x0) * s) / 2
    dy = G['icon_y'] - y0 * s + (G['icon_h'] - (y1 - y0) * s) / 2
    return {c: xform(L[c], s, dx, dy) for c in ORDER}


def svg(mode='light', tagline=True, icon_only=False, mono=None, pad=0.38):
    """mono: a single colour string paints every shape in it (one-ink use)."""
    ic = icon_placed()
    pal = FLAT_DARK if mode == 'dark' else FLAT_LIGHT
    ink = INK_DARK if mode == 'dark' else INK_LIGHT
    parts, boxes = [], []

    for c in ORDER:
        fill = mono or pal[c]
        parts.append(f'  <path id="{c}" d="{" ".join(ic[c])}" fill="{fill}"/>')
        boxes += ic[c]

    if not icon_only:
        wc = mono or ink['word']
        parts.append('  <g id="wordmark">' + ''.join(
            f'<path d="{d}" fill="{wc}"/>' for d in WORD['word']) + '</g>')
        boxes += WORD['word']
        if tagline:
            g = ''.join(f'<path d="{d}" fill="{mono or ink[k]}"/>'
                        for k in ('teal', 'gold', 'navy') for d in WORD['tag'][k])
            parts.append(f'  <g id="tagline">{g}</g>')
            boxes += [d for k in WORD['tag'] for d in WORD['tag'][k]]

    x0, y0, x1, y1 = bbox(boxes)
    w, h = x1 - x0, y1 - y0
    m = G['cap'] * pad
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{x0-m:.2f} {y0-m:.2f} {w+2*m:.2f} {h+2*m:.2f}" '
            f'width="{w+2*m:.0f}" height="{h+2*m:.0f}">\n'
            + '\n'.join(parts) + '\n</svg>\n')


def app_icon(size=512, ground='light', mono=None):
    ic = icon_placed()
    flat = [d for c in ORDER for d in ic[c]]
    x0, y0, x1, y1 = bbox(flat)
    w, h = x1 - x0, y1 - y0
    k = size * 0.66 / max(w, h)
    tx, ty = (size - w * k) / 2 - x0 * k, (size - h * k) / 2 - y0 * k
    bgc = {'light': '#FFFFFF', 'dark': '#08182C', 'teal': TEAL, 'navy': NAVY}[ground]
    # On a teal ground the teal N disappears into the background, leaving only
    # the gold figure and blue leaf -- a different mark. Teal ground therefore
    # always uses the reversed one-ink white version.
    if ground == 'teal':
        mono = mono or WHITE
    pal = FLAT_DARK if ground in ('dark', 'navy') else FLAT_LIGHT
    body = ''.join(f'<path d="{" ".join(ic[c])}" fill="{mono or pal[c]}"/>' for c in ORDER)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
            f'viewBox="0 0 {size} {size}">\n'
            f'  <rect width="{size}" height="{size}" rx="{size*0.2237:.1f}" fill="{bgc}"/>\n'
            f'  <g transform="translate({tx:.2f},{ty:.2f}) scale({k:.5f})">{body}</g>\n</svg>\n')


def main():
    d = f'{OUT}/flat'
    for sub in ('svg', 'png', 'app-icon'):
        os.makedirs(f'{d}/{sub}', exist_ok=True)
    W = []
    def w(p, c):
        open(p, 'w').write(c); W.append(p)

    w(f'{d}/svg/notho-logo-flat.svg', svg('light'))
    w(f'{d}/svg/notho-logo-flat-on-dark.svg', svg('dark'))
    w(f'{d}/svg/notho-logo-flat-no-tagline.svg', svg('light', tagline=False))
    w(f'{d}/svg/notho-logo-flat-no-tagline-on-dark.svg', svg('dark', tagline=False))
    w(f'{d}/svg/notho-icon-flat.svg', svg('light', icon_only=True, pad=0.10))
    w(f'{d}/svg/notho-icon-flat-on-dark.svg', svg('dark', icon_only=True, pad=0.10))

    # one-ink versions
    w(f'{d}/svg/notho-logo-mono-navy.svg', svg('light', mono=NAVY))
    w(f'{d}/svg/notho-logo-mono-white.svg', svg('light', mono=WHITE))
    w(f'{d}/svg/notho-logo-mono-black.svg', svg('light', mono='#000000'))
    w(f'{d}/svg/notho-icon-mono-navy.svg', svg('light', icon_only=True, mono=NAVY, pad=0.10))
    w(f'{d}/svg/notho-icon-mono-white.svg', svg('light', icon_only=True, mono=WHITE, pad=0.10))
    w(f'{d}/svg/notho-icon-mono-black.svg', svg('light', icon_only=True, mono='#000000', pad=0.10))

    for ground in ('light', 'dark', 'teal', 'navy'):
        w(f'{d}/app-icon/notho-appicon-flat-{ground}.svg', app_icon(512, ground))

    for name, src, widths in [
            ('notho-logo-flat', 'notho-logo-flat', [2400, 1200, 600]),
            ('notho-logo-flat-on-dark', 'notho-logo-flat-on-dark', [2400, 1200]),
            ('notho-logo-flat-no-tagline', 'notho-logo-flat-no-tagline', [1600, 800]),
            ('notho-icon-flat', 'notho-icon-flat', [1024, 512, 256]),
            ('notho-logo-mono-navy', 'notho-logo-mono-navy', [1600]),
            ('notho-logo-mono-white', 'notho-logo-mono-white', [1600]),
            ('notho-icon-mono-navy', 'notho-icon-mono-navy', [512]),
            ('notho-icon-mono-white', 'notho-icon-mono-white', [512])]:
        for wd in widths:
            p = f'{d}/png/{name}-{wd}w.png'
            cairosvg.svg2png(url=f'{d}/svg/{src}.svg', write_to=p, output_width=wd)
            W.append(p)

    for ground in ('light', 'dark', 'teal', 'navy'):
        for s in (1024, 512, 180, 120, 64, 32):
            p = f'{d}/app-icon/notho-appicon-flat-{ground}-{s}.png'
            cairosvg.svg2png(url=f'{d}/app-icon/notho-appicon-flat-{ground}.svg',
                             write_to=p, output_width=s, output_height=s)
            W.append(p)

    shutil.copy('/sessions/zen-amazing-hypatia/mnt/outputs/build_flat.py',
                f'{OUT}/source/build_flat.py')
    return W


if __name__ == '__main__':
    print(len(main()), 'flat files written')
