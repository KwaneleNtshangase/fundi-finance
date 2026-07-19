#!/usr/bin/env python3
"""
NOTHO lockup composition.

Every dimension derives from one unit: H, the wordmark cap height. Change H and
the whole lockup scales coherently. Tracking values are solved from real font
metrics rather than eyeballed, and the tagline's tracking is computed so it
optically spans the lockup above it.
"""
import os
from fontTools.ttLib import TTFont
import mark

FDIR = os.path.expanduser('~/.local/share/fonts')
EB = TTFont(os.path.join(FDIR, 'Montserrat-ExtraBold.ttf'))
SB = TTFont(os.path.join(FDIR, 'Montserrat-SemiBold.ttf'))
CAP = 0.700                      # Montserrat cap height, in em

WORD = 'NOTHO'
TAG = 'LEARN • GROW • BUILD WEALTH'

INK = dict(
    bg_top='#010611', bg_bot='#071425',
    white='#FFFFFF',
    tag_teal='#20D3CF', tag_gold='#F6BE3C', tag_blue='#2C55D4',
)


def advance(font, text):
    cmap, hmtx = font.getBestCmap(), font['hmtx']
    upm = font['head'].unitsPerEm
    return sum(hmtx[cmap[ord(c)]][0] for c in text) / upm


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def compose(H=280.0,
            wm_track=0.085,
            icon_scale=1.38,
            gap=0.26,
            tag_cap=0.150,
            tag_gap=0.60,
            pad_x=0.42, pad_y=0.46,
            background=True,
            glow=True,
            keyline='#040c18',
            outlined_text=None):
    """
    H          master unit = wordmark cap height
    wm_track   wordmark tracking, in em
    icon_scale icon height as a multiple of H  (>1 = optical overshoot)
    gap        icon-to-wordmark gap, in units of H
    tag_cap    tagline cap height, as a multiple of H
    tag_gap    wordmark baseline -> tagline baseline, in units of H
    """
    wm_size = H / CAP
    wm_w = advance(EB, WORD) * wm_size + wm_track * wm_size * (len(WORD) - 1)

    icon_h = H * icon_scale
    icon_w = icon_h * (mark.MARK_W / mark.MARK_H)
    gap_px = H * gap
    lock_w = icon_w + gap_px + wm_w

    tag_size = H * tag_cap / CAP
    tag_nat = advance(SB, TAG) * tag_size
    tag_track = (lock_w - tag_nat) / (tag_size * (len(TAG) - 1))

    padx, pady = H * pad_x, H * pad_y
    baseline = pady + H
    tag_base = baseline + H * tag_gap
    total_w = lock_w + 2 * padx
    total_h = (tag_base + pady * 0.80) if tag_gap else (baseline + pady)

    icon_x = padx
    icon_y = baseline - H / 2 - icon_h / 2
    wm_x = icon_x + icon_w + gap_px
    sc = icon_h / mark.MARK_H

    # ---- tagline: coloured runs laid out by advancing the pen manually
    runs = [('LEARN', INK['tag_teal']), (' ', None), ('•', INK['tag_gold']),
            (' ', None), ('GROW', INK['tag_gold']), (' ', None),
            ('•', INK['tag_gold']), (' ', None),
            ('BUILD WEALTH', INK['tag_blue'])]
    tspans, cursor = [], 0.0
    for txt, col in runs:
        if col:
            tspans.append(
                f'    <text x="{padx + cursor:.2f}" y="{tag_base:.2f}" fill="{col}"'
                f' font-family="Montserrat" font-weight="600"'
                f' font-size="{tag_size:.2f}"'
                f' letter-spacing="{tag_track * tag_size:.3f}"'
                f' xml:space="preserve">{esc(txt)}</text>')
        cursor += advance(SB, txt) * tag_size + tag_track * tag_size * len(txt)

    wm = (f'  <text x="{wm_x:.2f}" y="{baseline:.2f}" fill="{INK["white"]}"'
          f' font-family="Montserrat" font-weight="800"'
          f' font-size="{wm_size:.2f}"'
          f' letter-spacing="{wm_track * wm_size:.3f}">{WORD}</text>')
    if outlined_text:
        wm = outlined_text

    bg = (f'  <rect width="{total_w:.2f}" height="{total_h:.2f}" fill="url(#bgGrad)"/>'
          if background else '')

    glow_el = ''
    if glow:
        glow_el = (f'  <g transform="translate({icon_x:.2f},{icon_y:.2f}) '
                   f'scale({sc:.5f})" filter="url(#soften)" opacity="0.16">'
                   f'{mark.body("m")}</g>')

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{total_w:.1f}" height="{total_h:.1f}" viewBox="0 0 {total_w:.1f} {total_h:.1f}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="{INK['bg_top']}"/>
      <stop offset="1" stop-color="{INK['bg_bot']}"/>
    </linearGradient>
    <filter id="soften" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="{H * 0.085:.2f}"/>
    </filter>{mark.defs('m')}
  </defs>
{bg}
{glow_el}
  <g transform="translate({icon_x:.2f},{icon_y:.2f}) scale({sc:.5f})">{mark.body("m", keyline=keyline)}</g>
{wm}
{chr(10).join(tspans)}
</svg>'''

    info = dict(total_w=total_w, total_h=total_h, lock_w=lock_w,
                icon_w=icon_w, icon_h=icon_h, wm_w=wm_w, wm_size=wm_size,
                gap_px=gap_px, tag_size=tag_size, tag_track_em=tag_track,
                tag_track_px=tag_track * tag_size,
                wm_track_px=wm_track * wm_size,
                icon_x=icon_x, icon_y=icon_y, wm_x=wm_x, baseline=baseline)
    return svg, info


if __name__ == '__main__':
    import cairosvg, json
    svg, info = compose()
    open('/tmp/lockup.svg', 'w').write(svg)
    cairosvg.svg2png(url='/tmp/lockup.svg', write_to='/tmp/lockup.png',
                     output_width=1500)
    for k, v in info.items():
        print(f'{k:14s} {v:10.2f}')
