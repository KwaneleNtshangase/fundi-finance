#!/usr/bin/env python3
"""
Build the NOTHO asset set from traced geometry.

Structure note that drives everything: the icon IS the letter N, so the
wordmark is "OTHO", not "NOTHO". Icon, wordmark and tagline are all traced
from the client's own artwork, then reassembled at the proportions measured
off that artwork -- so the output is the existing logo in vector form, not an
interpretation of it.
"""
import os, re, json, shutil
import cairosvg

OUT = '/sessions/zen-amazing-hypatia/mnt/notho/brand'
ICON = json.load(open('/tmp/tclean/layers.json'))
WORD = json.load(open('/tmp/tword/word.json'))

# The teal is a single shape. Splitting it by tone put a hard trace edge
# through a smooth gradient, and that edge tracked the classifier's noise --
# which read as a torn seam. One shape, one gradient.
# One shape per colour, one gradient each. Any attempt to add shading as an
# extra traced region -- hard-edged or faded -- shows its own outline as a
# blotch, because the outline follows the classifier rather than the artwork.
# Measured scanlines confirm the teal simply darkens along one axis, so a
# single many-stop gradient is both the smoothest and the most accurate option.
ICON_ORDER = ['teal', 'gold', 'blue']
ICON_LABEL = {'teal': 'N / teal ribbon',
              'gold': 'Leaf / gold + dot', 'blue': 'Leaf / blue'}
SOFT = set()
# Axis and stops fitted to the source pixels by fit_gradient.py, not eyeballed.
GRAD = json.load(open('/tmp/tclean/gradients.json'))
FLAT = {'teal': '#049DA7', 'gold': '#EAAC3E', 'blue': '#0A3A71'}


def grad_def(gid, c):
    g = GRAD[c]
    n = len(g['stops'])
    out = []
    for i, (o, col) in enumerate(g['stops']):
        if c in SOFT:
            # transparent at the lit end, opaque in the shadow core
            a = round((i / (n - 1)) ** 0.85, 3)
            out.append(f'<stop offset="{o}" stop-color="{col}" stop-opacity="{a}"/>')
        else:
            out.append(f'<stop offset="{o}" stop-color="{col}"/>')
    return (f'    <linearGradient id="{gid}" x1="{g["x1"]}" y1="{g["y1"]}" '
            f'x2="{g["x2"]}" y2="{g["y2"]}">{"".join(out)}</linearGradient>')

# Measured off the source artwork (source pixels, cap height = 205).
G = dict(icon_x=1, icon_y=1, icon_w=209, icon_h=202,
         cap=205, cap_top=13, baseline=217,
         word_x0=245, word_x1=1198, tag_y1=297)

INK_LIGHT = dict(word='#083088', teal='#109898', gold='#E8A838', navy='#083080')
INK_DARK  = dict(word='#FFFFFF', teal='#2ED6D2', gold='#F6BE3C', navy='#8FA9F0')


def bbox(ds):
    xs, ys = [], []
    for d in ds:
        n = [float(v) for v in re.findall(r'-?\d+\.?\d*', d)]
        xs += n[0::2]; ys += n[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def xform(ds, sx, sy, dx, dy):
    out = []
    for d in ds:
        toks = re.findall(r'[MCZ]|-?\d+\.?\d*', d)
        res, i = [], 0
        while i < len(toks):
            t = toks[i]
            if t in 'MCZ':
                res.append(t); i += 1; continue
            res.append(f'{float(t)*sx+dx:.2f} {float(toks[i+1])*sy+dy:.2f}')
            i += 2
        out.append(' '.join(res))
    return out


def icon_placed():
    """Icon paths mapped into the logo's coordinate space."""
    L = ICON['layers']
    flat = [d for c in ICON_ORDER for d in L[c]]
    x0, y0, x1, y1 = bbox(flat)
    s = min(G['icon_w'] / (x1 - x0), G['icon_h'] / (y1 - y0))
    dx = G['icon_x'] - x0 * s + (G['icon_w'] - (x1 - x0) * s) / 2
    dy = G['icon_y'] - y0 * s + (G['icon_h'] - (y1 - y0) * s) / 2
    return {c: xform(L[c], s, s, dx, dy) for c in ICON_ORDER}


def svg(mode='light', tagline=True, icon_only=False, word_only=False,
        gradients=True, pad=0.38, pid='n'):
    ink = INK_LIGHT if mode == 'light' else INK_DARK
    ic = icon_placed()

    parts, boxes = [], []
    if not word_only:
        for c in ICON_ORDER:
            fill = f'url(#{pid}_{c})' if gradients else FLAT[c]
            parts.append(f'    <path id="{pid}-{c}" d="{" ".join(ic[c])}" '
                         f'fill="{fill}"><title>{ICON_LABEL[c]}</title></path>')
            boxes += ic[c]
    if not icon_only:
        parts.append(f'    <g id="{pid}-wordmark">' + ''.join(
            f'<path d="{d}" fill="{ink["word"]}"/>' for d in WORD['word']) + '</g>')
        boxes += WORD['word']
        if tagline:
            g = [f'<path d="{d}" fill="{ink[k]}"/>'
                 for k, col in (('teal', 'teal'), ('gold', 'gold'), ('navy', 'navy'))
                 for d in WORD['tag'][k]]
            parts.append(f'    <g id="{pid}-tagline">' + ''.join(g) + '</g>')
            boxes += [d for k in WORD['tag'] for d in WORD['tag'][k]]

    x0, y0, x1, y1 = bbox(boxes)
    w, h = x1 - x0, y1 - y0
    # Clear space is a ratio of cap height, not of the bounding box -- keying
    # it to width would balloon the vertical margin on a wide lockup.
    m = G['cap'] * pad
    vb = f'{x0-m:.2f} {y0-m:.2f} {w+2*m:.2f} {h+2*m:.2f}'

    defs = ''
    if gradients and not word_only:
        gs = [grad_def(f'{pid}_{c}', c) for c in ICON_ORDER]
        defs = '  <defs>\n' + '\n'.join(gs) + '\n  </defs>\n'

    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" '
            f'width="{w+2*m:.0f}" height="{h+2*m:.0f}">\n{defs}'
            + '\n'.join(parts) + '\n</svg>\n')


def app_icon(size=512, rounded=True):
    ic = icon_placed()
    flat = [d for c in ICON_ORDER for d in ic[c]]
    x0, y0, x1, y1 = bbox(flat)
    w, h = x1 - x0, y1 - y0
    s = size * 0.66 / max(w, h)
    tx, ty = (size - w * s) / 2 - x0 * s, (size - h * s) / 2 - y0 * s
    r = size * 0.2237 if rounded else 0
    gs = ''.join(grad_def(f'a_{c}', c) for c in ICON_ORDER)
    body = ''.join(f'<path d="{" ".join(ic[c])}" fill="url(#a_{c})"/>' for c in ICON_ORDER)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
            f'viewBox="0 0 {size} {size}">\n  <defs>'
            f'<linearGradient id="a_bg" x1="0" y1="0" x2="0.4" y2="1">'
            f'<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF3F7"/>'
            f'</linearGradient>{gs}</defs>\n'
            f'  <rect width="{size}" height="{size}" rx="{r:.1f}" fill="url(#a_bg)"/>\n'
            f'  <g transform="translate({tx:.2f},{ty:.2f}) scale({s:.5f})">{body}</g>\n</svg>\n')


def app_icon_dark(size=512):
    s = app_icon(size)
    return (s.replace('<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF3F7"/>',
                      '<stop offset="0" stop-color="#03101F"/><stop offset="1" stop-color="#0A1B30"/>'))


def main():
    for d in ('svg', 'png', 'pdf', 'app-icon'):
        os.makedirs(f'{OUT}/{d}', exist_ok=True)
    W = []
    def w(p, c):
        open(p, 'w').write(c); W.append(p)

    w(f'{OUT}/svg/notho-logo-full.svg',           svg('light'))
    w(f'{OUT}/svg/notho-logo-full-on-dark.svg',   svg('dark'))
    w(f'{OUT}/svg/notho-logo-no-tagline.svg',     svg('light', tagline=False))
    w(f'{OUT}/svg/notho-logo-no-tagline-on-dark.svg', svg('dark', tagline=False))
    w(f'{OUT}/svg/notho-icon-mark.svg',           svg('light', icon_only=True, pad=0.10))
    w(f'{OUT}/svg/notho-icon-flat.svg',           svg('light', icon_only=True, gradients=False, pad=0.10))
    w(f'{OUT}/svg/notho-wordmark-otho.svg',       svg('light', word_only=True, tagline=False, pad=0.18))
    w(f'{OUT}/svg/notho-app-icon-light.svg',      app_icon(512))
    w(f'{OUT}/svg/notho-app-icon-dark.svg',       app_icon_dark(512))

    jobs = [('notho-logo-full', 'notho-logo-full', [2400, 1200, 600]),
            ('notho-logo-on-dark', 'notho-logo-full-on-dark', [2400, 1200]),
            ('notho-logo-no-tagline', 'notho-logo-no-tagline', [1600, 800]),
            ('notho-icon-mark', 'notho-icon-mark', [1024, 512, 256])]
    for name, src, widths in jobs:
        for wd in widths:
            p = f'{OUT}/png/{name}-{wd}w.png'
            cairosvg.svg2png(url=f'{OUT}/svg/{src}.svg', write_to=p, output_width=wd)
            W.append(p)

    for tag, src in (('light', 'notho-app-icon-light'), ('dark', 'notho-app-icon-dark')):
        for s in (1024, 512, 180, 120, 64, 32):
            p = f'{OUT}/app-icon/notho-appicon-{tag}-{s}.png'
            cairosvg.svg2png(url=f'{OUT}/svg/{src}.svg', write_to=p,
                             output_width=s, output_height=s)
            W.append(p)

    for nm, src in (('notho-logo-full', 'notho-logo-full'),
                    ('notho-logo-on-dark', 'notho-logo-full-on-dark')):
        p = f'{OUT}/pdf/{nm}.pdf'
        cairosvg.svg2pdf(url=f'{OUT}/svg/{src}.svg', write_to=p); W.append(p)

    os.makedirs(f'{OUT}/source', exist_ok=True)
    for f in ('trace_clean.py', 'trace_word.py', 'build_final.py', 'assemble.py'):
        src = f'/sessions/zen-amazing-hypatia/mnt/outputs/{f}'
        if os.path.exists(src):
            shutil.copy(src, f'{OUT}/source/{f}'); W.append(f'{OUT}/source/{f}')
    return W


if __name__ == '__main__':
    files = main()
    print(f'{len(files)} files')
    for f in files[:12]:
        print('  ', f.replace(OUT + '/', ''))
