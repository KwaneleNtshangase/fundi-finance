#!/usr/bin/env python3
"""
The NOTHO monogram.

Structure: two flanking leaves with a figure rising between them.

The teal leaf is the master gesture. The blue leaf is that same gesture
mirrored and trimmed shorter, so the two flanks are demonstrably siblings
rather than two independent guesses -- retune the master and both follow.
The gold figure is authored separately because it carries different meaning
(a person, not foliage) and needs its own rhythm.
"""
from ribbon import (Spine, ribbon, trim, mirror, translate, offset,
                    path_bbox, fit_transform)

MARK_W, MARK_H = 420.0, 380.0
AXIS = 190.0

PALETTE = dict(
    teal_hi='#5BF5EE', teal_mid='#20D3CF', teal_lo='#007F8A',
    tsh_hi='#0E8A90',  tsh_lo='#053F4B',
    gold_hi='#FFE585', gold_mid='#FFC847', gold_lo='#D28C0C',
    blue_hi='#4A7DFF', blue_mid='#1F49C6', blue_lo='#0A246E',
)

# --------------------------------------------------------------- master leaf
# Up the left flank, through the shoulder, tapering to a tip at upper right.
TEAL = Spine([
    ((104, 322), (74, 258), (76, 168), (114, 112)),
    ((114, 112), (138, 76), (168, 56), (196, 48)),
])

# The figure: a slimmer S rising through the centre.
FIGURE = Spine([
    ((182, 326), (184, 262), (198, 200), (220, 158)),
    ((220, 158), (230, 138), (238, 126), (246, 116)),
])

HEAD = dict(cx=258, cy=76, r=32)


def blue_spine():
    """Mirror of the teal leaf, trimmed shorter and nudged clear of the figure."""
    return translate(trim(mirror(TEAL, AXIS), 0.0, 0.62), 62, 6)


def paths():
    # Stroke weights sit alongside Montserrat ExtraBold: the widest point of
    # the teal roughly matches the wordmark's stem width, so the mark holds its
    # own next to the letters without going so heavy that the gaps close up.
    teal = ribbon(TEAL, 44, 96, 20, peak=0.44, ease=0.9, bias=0.10)
    # Shadow sits OUTSIDE the teal, not between teal and figure. Inside, it
    # reads as a seam or a rendering artifact; outside, it reads as a second
    # leaf layered behind the first, which is what gives the mark its depth.
    shadow = ribbon(trim(translate(offset(TEAL, -30), 2, 10), 0.04, 0.80),
                    40, 84, 26, peak=0.46, ease=0.9)
    blue = ribbon(blue_spine(), 46, 84, 26, peak=0.52, ease=0.95, bias=-0.04)
    gold = ribbon(FIGURE, 38, 60, 30, peak=0.40, ease=1.0, bias=0.04)
    return dict(shadow=shadow, blue=blue, teal=teal, gold=gold)


def defs(p='m'):
    C = PALETTE
    return f'''
    <linearGradient id="{p}_teal" x1="0.15" y1="0" x2="0.55" y2="1">
      <stop offset="0"    stop-color="{C['teal_hi']}"/>
      <stop offset="0.45" stop-color="{C['teal_mid']}"/>
      <stop offset="1"    stop-color="{C['teal_lo']}"/>
    </linearGradient>
    <linearGradient id="{p}_tsh" x1="0.2" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="{C['tsh_hi']}"/>
      <stop offset="1" stop-color="{C['tsh_lo']}"/>
    </linearGradient>
    <linearGradient id="{p}_blue" x1="0.75" y1="0" x2="0.25" y2="1">
      <stop offset="0"   stop-color="{C['blue_hi']}"/>
      <stop offset="0.5" stop-color="{C['blue_mid']}"/>
      <stop offset="1"   stop-color="{C['blue_lo']}"/>
    </linearGradient>
    <linearGradient id="{p}_gold" x1="0.25" y1="0" x2="0.6" y2="1">
      <stop offset="0"    stop-color="{C['gold_hi']}"/>
      <stop offset="0.45" stop-color="{C['gold_mid']}"/>
      <stop offset="1"    stop-color="{C['gold_lo']}"/>
    </linearGradient>
    <radialGradient id="{p}_head" cx="0.34" cy="0.28" r="0.9">
      <stop offset="0" stop-color="{C['gold_hi']}"/>
      <stop offset="1" stop-color="{C['gold_mid']}"/>
    </radialGradient>'''


def body(p="m", margin=4, keyline=None, keyline_w=13.0):
    """
    Icon artwork.

    `keyline` paints a background-coloured halo behind each element before its
    fill, guaranteeing visible separation between overlapping shapes. Without
    it the ribbons merge into one silhouette once the mark is scaled down to a
    favicon. Pass None for a flat, halo-free version.
    """
    P = paths()
    h = HEAD
    hd = (f'M {h["cx"]-h["r"]} {h["cy"]-h["r"]} '
          f'C {h["cx"]+h["r"]} {h["cy"]-h["r"]} {h["cx"]+h["r"]} {h["cy"]+h["r"]} '
          f'{h["cx"]-h["r"]} {h["cy"]+h["r"]} Z')
    bbox = path_bbox(P['shadow'], P['blue'], P['teal'], P['gold'], hd)
    tf, _ = fit_transform(bbox, MARK_W, MARK_H, margin)

    def el(d, fill, halo_on=True):
        halo = ''
        if keyline and halo_on:
            halo = (f'<path d="{d}" fill="none" stroke="{keyline}" '
                    f'stroke-width="{keyline_w * 2:.1f}" stroke-linejoin="round"/>')
        return f'{halo}<path d="{d}" fill="{fill}"/>'

    head_halo = ''
    if keyline:
        head_halo = (f'<circle cx="{h["cx"]}" cy="{h["cy"]}" r="{h["r"]}" '
                     f'fill="none" stroke="{keyline}" '
                     f'stroke-width="{keyline_w * 2:.1f}"/>')

    return f'''
      <g transform="{tf}">
        {el(P['shadow'], f'url(#{p}_tsh)', halo_on=False)}
        {el(P['blue'],   f'url(#{p}_blue)')}
        {el(P['teal'],   f'url(#{p}_teal)')}
        {el(P['gold'],   f'url(#{p}_gold)')}
        {head_halo}<circle cx="{h['cx']}" cy="{h['cy']}" r="{h['r']}" fill="url(#{p}_head)"/>
      </g>'''


if __name__ == '__main__':
    import cairosvg
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{MARK_W}" height="{MARK_H}"
     viewBox="0 0 {MARK_W} {MARK_H}">
  <defs>{defs()}</defs>
  <rect width="{MARK_W}" height="{MARK_H}" fill="#050d1a"/>
  {body()}
</svg>'''
    open('/tmp/mark.svg', 'w').write(svg)
    cairosvg.svg2png(url='/tmp/mark.svg', write_to='/tmp/mark.png', output_width=560)
    print('ok')
