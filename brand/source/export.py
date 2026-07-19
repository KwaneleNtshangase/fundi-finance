#!/usr/bin/env python3
"""
Build the full NOTHO asset set.

Two flavours of every lockup:
  * live text   - smallest files, fully re-typeable, needs Montserrat installed
  * outlined    - glyphs converted to bezier paths, renders identically anywhere

Both are real vectors. The outlined set is what you hand to a printer or embed
in a site; the live-text set is what you keep for editing.
"""
import os, shutil
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import cairosvg

import mark, lockup

OUT = '/sessions/zen-amazing-hypatia/mnt/fundi-finance/brand'
FDIR = os.path.expanduser('~/.local/share/fonts')

FONTS = {
    800: TTFont(os.path.join(FDIR, 'Montserrat-ExtraBold.ttf')),
    600: TTFont(os.path.join(FDIR, 'Montserrat-SemiBold.ttf')),
}


# ------------------------------------------------------------ text -> paths
def text_paths(text, weight, size, x, y, track_px, fill):
    """Render `text` as bezier <path> elements, one per glyph."""
    font = FONTS[weight]
    upm = font['head'].unitsPerEm
    cmap, hmtx, gs = font.getBestCmap(), font['hmtx'], font.getGlyphSet()
    s = size / upm
    out, cursor = [], 0.0
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            continue
        pen = SVGPathPen(gs)
        gs[gname].draw(pen)
        d = pen.getCommands()
        if d.strip():
            out.append(
                f'    <path d="{d}" fill="{fill}" '
                f'transform="translate({x + cursor:.3f},{y:.3f}) scale({s:.6f},{-s:.6f})"/>')
        cursor += hmtx[gname][0] * s + track_px
    return '\n'.join(out), cursor - track_px


def outlined_lockup(**kw):
    """Compose a lockup with the wordmark and tagline as outlines."""
    kw = dict(kw)
    theme = kw.pop('theme', 'dark')
    svg, info = lockup.compose(**kw)
    ink = '#FFFFFF' if theme == 'dark' else '#081426'

    wm, _ = text_paths(lockup.WORD, 800, info['wm_size'],
                       info['wm_x'], info['baseline'],
                       info['wm_track_px'], ink)

    # rebuild the tagline runs as outlines, advancing the pen the same way
    H = kw.get('H', 280.0)
    padx = H * kw.get('pad_x', 0.42)
    tag_base = info['baseline'] + H * kw.get('tag_gap', 0.60)
    tcol = (lockup.INK['tag_teal'], lockup.INK['tag_gold'], lockup.INK['tag_blue'])
    if theme == 'light':
        tcol = ('#0E9C99', '#B8860B', '#1F49C6')
    runs = [('LEARN', tcol[0]), (' ', None), ('•', tcol[1]), (' ', None),
            ('GROW', tcol[1]), (' ', None), ('•', tcol[1]), (' ', None),
            ('BUILD WEALTH', tcol[2])]
    tg, cursor = [], 0.0
    for txt, col in runs:
        if col:
            p, _ = text_paths(txt, 600, info['tag_size'], padx + cursor,
                              tag_base, info['tag_track_px'], col)
            tg.append(p)
        cursor += (lockup.advance(lockup.SB, txt) * info['tag_size']
                   + info['tag_track_px'] * len(txt))

    body = f'  <g id="wordmark">\n{wm}\n  </g>\n  <g id="tagline">\n' + '\n'.join(tg) + '\n  </g>'

    # splice the outlines in place of the <text> elements
    head = svg.split('<text')[0].rstrip()
    return head + '\n' + body + '\n</svg>', info


# ------------------------------------------------------------------ variants
def light_theme(svg):
    """Recolour a dark lockup for light backgrounds."""
    return (svg
            .replace('<stop offset="0" stop-color="#010611"/>',
                     '<stop offset="0" stop-color="#FFFFFF"/>')
            .replace('<stop offset="1" stop-color="#071425"/>',
                     '<stop offset="1" stop-color="#F2F5F9"/>')
            .replace('fill="#FFFFFF"\n', 'fill="#081426"\n')
            .replace('fill="#FFFFFF" font-family', 'fill="#081426" font-family')
            .replace('stroke="#040c18"', 'stroke="#FFFFFF"')
            .replace('#2C55D4', '#1F49C6'))


def icon_svg(size=512, rounded=True, background=True, keyline='#040c18'):
    r = size * 0.2237 if rounded else 0            # iOS squircle-ish radius
    sc = size * 0.72 / mark.MARK_H
    w = mark.MARK_W * sc
    tx, ty = (size - w) / 2, (size - mark.MARK_H * sc) / 2
    bg = ''
    if background:
        bg = (f'  <rect width="{size}" height="{size}" rx="{r:.1f}" ry="{r:.1f}" '
              f'fill="url(#bgGrad)"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#010611"/>
      <stop offset="1" stop-color="#0A1B30"/>
    </linearGradient>{mark.defs('i')}
  </defs>
{bg}
  <g transform="translate({tx:.2f},{ty:.2f}) scale({sc:.5f})">{mark.body('i', keyline=keyline if background else None)}</g>
</svg>'''


def mark_only_svg(size=512):
    sc = size / mark.MARK_H
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{mark.MARK_W*sc:.0f}" height="{size}" viewBox="0 0 {mark.MARK_W} {mark.MARK_H}">
  <defs>{mark.defs('i')}</defs>
  {mark.body('i')}
</svg>'''


def wordmark_svg(H=280.0, track=0.085, ink='#FFFFFF'):
    size = H / lockup.CAP
    track_px = track * size
    pad = H * 0.18
    d, w = text_paths(lockup.WORD, 800, size, pad, pad + H, track_px, ink)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w+2*pad:.1f}" height="{H+2*pad:.1f}" viewBox="0 0 {w+2*pad:.1f} {H+2*pad:.1f}">
  <g id="wordmark">
{d}
  </g>
</svg>'''


# ---------------------------------------------------------------------- main
def main():
    os.makedirs(f'{OUT}/svg', exist_ok=True)
    os.makedirs(f'{OUT}/png', exist_ok=True)
    os.makedirs(f'{OUT}/pdf', exist_ok=True)
    os.makedirs(f'{OUT}/app-icon', exist_ok=True)

    written = []

    def w(path, content):
        open(path, 'w').write(content)
        written.append(path)

    # ---- horizontal lockups
    live, info = lockup.compose()
    w(f'{OUT}/svg/notho-logo-horizontal-dark.svg', live)

    out_dark, _ = outlined_lockup()
    w(f'{OUT}/svg/notho-logo-horizontal-dark-outlined.svg', out_dark)

    # Transparent builds drop the keyline entirely -- a dark halo only works
    # against the dark background it was sampled from, and would print as an
    # outline anywhere else. Two versions, one per background polarity.
    t_dark, _ = outlined_lockup(background=False, glow=False, keyline=None)
    w(f'{OUT}/svg/notho-logo-transparent-on-dark.svg', t_dark)
    # overwrite the earlier, keyline-flawed build sitting under the old name
    w(f'{OUT}/svg/notho-logo-horizontal-transparent.svg', t_dark)

    t_light, _ = outlined_lockup(background=False, glow=False,
                                 keyline=None, theme='light')
    w(f'{OUT}/svg/notho-logo-transparent-on-light.svg',
      t_light.replace('#2C55D4', '#1F49C6'))

    lite, _ = outlined_lockup(theme='light')
    w(f'{OUT}/svg/notho-logo-horizontal-light.svg', light_theme(lite))

    # no-tagline variant for small placements
    notag, _ = outlined_lockup(tag_gap=0.0)
    notag = notag.split('<g id="tagline">')[0].rstrip() + '\n</svg>'
    w(f'{OUT}/svg/notho-logo-horizontal-no-tagline.svg', notag)

    # ---- marks
    w(f'{OUT}/svg/notho-icon-mark.svg', mark_only_svg())
    w(f'{OUT}/svg/notho-icon-square.svg', icon_svg(512))
    w(f'{OUT}/svg/notho-wordmark.svg', wordmark_svg())

    # ---- rasters
    png_jobs = [
        ('notho-logo-dark', f'{OUT}/svg/notho-logo-horizontal-dark-outlined.svg',
         [2400, 1200, 600]),
        ('notho-logo-transparent-on-dark',
         f'{OUT}/svg/notho-logo-transparent-on-dark.svg', [2400, 1200, 600]),
        ('notho-logo-transparent-on-light',
         f'{OUT}/svg/notho-logo-transparent-on-light.svg', [2400, 1200]),
        ('notho-logo-transparent',
         f'{OUT}/svg/notho-logo-transparent-on-dark.svg', [2400, 1200, 600]),
        ('notho-logo-light', f'{OUT}/svg/notho-logo-horizontal-light.svg', [2400, 1200]),
        ('notho-icon-mark', f'{OUT}/svg/notho-icon-mark.svg', [1024, 512]),
    ]
    for name, src, widths in png_jobs:
        for wd in widths:
            dst = f'{OUT}/png/{name}-{wd}w.png'
            cairosvg.svg2png(url=src, write_to=dst, output_width=wd)
            written.append(dst)

    # ---- app icons
    for s in (1024, 512, 180, 120, 64, 32):
        src = f'/tmp/icon_{s}.svg'
        open(src, 'w').write(icon_svg(512))
        dst = f'{OUT}/app-icon/notho-appicon-{s}.png'
        cairosvg.svg2png(url=src, write_to=dst, output_width=s, output_height=s)
        written.append(dst)

    # favicon (square, no rounding - browsers mask it themselves)
    open('/tmp/fav.svg', 'w').write(icon_svg(512, rounded=False))
    for s in (32, 16):
        dst = f'{OUT}/app-icon/favicon-{s}.png'
        cairosvg.svg2png(url='/tmp/fav.svg', write_to=dst,
                         output_width=s, output_height=s)
        written.append(dst)

    # ---- print
    for nm, src in (('notho-logo-dark', 'notho-logo-horizontal-dark-outlined'),
                    ('notho-logo-light', 'notho-logo-horizontal-light')):
        dst = f'{OUT}/pdf/{nm}.pdf'
        cairosvg.svg2pdf(url=f'{OUT}/svg/{src}.svg', write_to=dst)
        written.append(dst)

    # ---- keep the generator alongside the output so it stays regenerable
    os.makedirs(f'{OUT}/source', exist_ok=True)
    for f in ('ribbon.py', 'mark.py', 'lockup.py', 'export.py'):
        shutil.copy(f'/sessions/zen-amazing-hypatia/mnt/outputs/{f}',
                    f'{OUT}/source/{f}')
        written.append(f'{OUT}/source/{f}')

    return written, info


if __name__ == '__main__':
    files, info = main()
    print(f'{len(files)} files written')
    for f in files:
        print('  ', f.replace(OUT + '/', ''))
