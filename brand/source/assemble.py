#!/usr/bin/env python3
"""Assemble the traced NOTHO layers into a finished, gradient-shaded icon."""
import json, re

TMP = '/tmp/tclean'
D = json.load(open(f'{TMP}/layers.json'))
LAYERS, SW, SH = D['layers'], D['w'], D['h']

ORDER = ['teal_dark', 'teal_light', 'gold', 'blue']
LABEL = {
    'teal_dark':  'N / teal underside',
    'teal_light': 'N / teal face',
    'gold':       'Leaf / gold',
    'blue':       'Leaf / blue',
}
# Gradients reinstate the depth the flat trace discarded. Angles follow the
# light direction in the source: upper-left key light, shadow to lower-right.
GRAD = {
    'teal_dark':  ('#2C8E93', '#04616B', 0.15, 0, 0.6, 1),
    'teal_light': ('#22B9C0', '#017B84', 0.10, 0, 0.55, 1),
    'gold':       ('#F5C55E', '#D9911F', 0.20, 0, 0.65, 1),
    'blue':       ('#2C55A8', '#07234F', 0.70, 0, 0.25, 1),
}


def bbox(ds):
    xs, ys = [], []
    for d in ds:
        n = [float(v) for v in re.findall(r'-?\d+\.?\d*', d)]
        xs += n[0::2]; ys += n[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def build(box=512.0, margin=0.0, gradients=True, prefix='n'):
    allds = [d for c in ORDER for d in LAYERS[c]]
    x0, y0, x1, y1 = bbox(allds)
    w, h = x1 - x0, y1 - y0
    s = (box - 2 * margin) / max(w, h)
    tx = (box - w * s) / 2 - x0 * s
    ty = (box - h * s) / 2 - y0 * s

    defs = []
    if gradients:
        for c in ORDER:
            a, b, gx1, gy1, gx2, gy2 = GRAD[c]
            defs.append(
                f'    <linearGradient id="{prefix}_{c}" x1="{gx1}" y1="{gy1}" '
                f'x2="{gx2}" y2="{gy2}">\n'
                f'      <stop offset="0" stop-color="{a}"/>\n'
                f'      <stop offset="1" stop-color="{b}"/>\n'
                f'    </linearGradient>')

    FLAT = {'teal_dark': '#017B84', 'teal_light': '#049DA7',
            'gold': '#EAAC3E', 'blue': '#0A3A71'}
    body = []
    for c in ORDER:
        fill = f'url(#{prefix}_{c})' if gradients else FLAT[c]
        d = ' '.join(LAYERS[c])
        body.append(f'    <path id="{prefix}-{c}" d="{d}" fill="{fill}" '
                    f'fill-rule="evenodd"><title>{LABEL[c]}</title></path>')

    defsblock = f'  <defs>\n' + '\n'.join(defs) + '\n  </defs>\n' if defs else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{box:.0f}" '
            f'height="{box:.0f}" viewBox="0 0 {box:.0f} {box:.0f}">\n'
            f'{defsblock}'
            f'  <g transform="translate({tx:.3f},{ty:.3f}) scale({s:.6f})">\n'
            + '\n'.join(body) + '\n  </g>\n</svg>\n')


if __name__ == '__main__':
    import cairosvg
    for tag, kw in [('grad', dict(gradients=True)), ('flat', dict(gradients=False))]:
        svg = build(**kw)
        open(f'{TMP}/icon_{tag}.svg', 'w').write(svg)
        cairosvg.svg2png(url=f'{TMP}/icon_{tag}.svg',
                         write_to=f'{TMP}/icon_{tag}.png', output_width=420)
        print(tag, len(svg) // 1024, 'KB')
