#!/usr/bin/env python3
"""
Derive each layer's gradient from the source pixels instead of guessing it.

For every pixel belonging to a layer we have a position and a colour. Fitting
colour against position gives the axis along which the artwork actually shades,
and sampling the mean colour in bands along that axis gives the stops. The
result is a smooth gradient that matches the original's light direction rather
than an approximation someone eyeballed.
"""
import json, math
from PIL import Image, ImageFilter

SRC = '/sessions/zen-amazing-hypatia/mnt/notho/public/notho-icon.png'

BASE = {
    'white':      (0xFF, 0xFF, 0xFF),
    'teal_hi':    (0x40, 0xBE, 0xC0),
    'teal_light': (0x04, 0x9D, 0xA7),
    'teal_dark':  (0x01, 0x7B, 0x84),
    'teal_shade': (0x03, 0x46, 0x49),
    'gold':       (0xEA, 0xAC, 0x3E),
    'gold_dark':  (0xC5, 0x8F, 0x34),
    'blue':       (0x0A, 0x33, 0x86),
    'blue_dark':  (0x09, 0x23, 0x61),
}
GROUP = {'teal_hi': 'teal', 'teal_light': 'teal', 'teal_dark': 'teal',
         'teal_shade': 'teal', 'gold': 'gold', 'gold_dark': 'gold',
         'blue': 'blue', 'blue_dark': 'blue', 'white': None}
# The shaded back face is fitted on its own so the overlay carries the right
# colour ramp, independent of the base ribbon it sits on top of.
SHADOW = {'teal_dark', 'teal_shade'}


def load():
    im = Image.open(SRC).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    return Image.alpha_composite(bg, im).convert('RGB')


def collect(im):
    """Per layer: list of (x_norm, y_norm, r, g, b)."""
    W, H = im.size
    px = im.load()
    names = list(BASE)
    cols = [BASE[n] for n in names]
    out = {'teal': [], 'gold': [], 'blue': [], 'teal_shadow': []}
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            if r > 238 and g > 238 and b > 238:
                continue
            best, bi = 1e18, 0
            for i, (cr, cg, cb) in enumerate(cols):
                d = 2*(r-cr)**2 + 4*(g-cg)**2 + 3*(b-cb)**2
                if d < best:
                    best, bi = d, i
            nm = names[bi]
            grp = GROUP[nm]
            if grp:
                out[grp].append((x / W, y / H, r, g, b))
            if nm in SHADOW:
                out['teal_shadow'].append((x / W, y / H, r, g, b))
    return out


def fit(samples, nstops=10):
    """
    Find the axis along which luminance varies most, then sample mean colour in
    bands along it. Returns gradient endpoints in objectBoundingBox coords plus
    the stop list.
    """
    if len(samples) < 50:
        return None
    # Renormalise to THIS layer's own bounding box. SVG objectBoundingBox
    # gradient coords are relative to the shape, not to the whole artwork --
    # normalising against the image would skew the axis.
    xs = [s[0] for s in samples]; ys = [s[1] for s in samples]
    bx0, bx1, by0, by1 = min(xs), max(xs), min(ys), max(ys)
    bw = (bx1 - bx0) or 1e-9; bh = (by1 - by0) or 1e-9
    samples = [((s[0]-bx0)/bw, (s[1]-by0)/bh, s[2], s[3], s[4]) for s in samples]
    lum = [0.2126*r + 0.7152*g + 0.0722*b for _, _, r, g, b in samples]
    mx = sum(s[0] for s in samples) / len(samples)
    my = sum(s[1] for s in samples) / len(samples)
    ml = sum(lum) / len(lum)

    # covariance of position with luminance gives the shading direction
    cxl = sum((s[0]-mx)*(l-ml) for s, l in zip(samples, lum))
    cyl = sum((s[1]-my)*(l-ml) for s, l in zip(samples, lum))
    n = math.hypot(cxl, cyl) or 1e-9
    # point the axis from light -> dark so stop 0 is the highlight
    ux, uy = -cxl/n, -cyl/n

    proj = [s[0]*ux + s[1]*uy for s in samples]
    p0, p1 = min(proj), max(proj)
    # trim the extreme 2% each end: anti-aliased edge pixels sit there and drag
    # the endpoint colours toward the background
    sp = sorted(proj)
    p0 = sp[int(0.02*len(sp))]
    p1 = sp[int(0.98*len(sp))-1]
    span = (p1 - p0) or 1e-9

    bands = [[] for _ in range(nstops)]
    for s, p in zip(samples, proj):
        t = (p - p0) / span
        k = min(nstops-1, max(0, int(t * nstops)))
        bands[k].append(s)

    stops = []
    for k, band in enumerate(bands):
        if not band:
            continue
        r = sum(s[2] for s in band)/len(band)
        g = sum(s[3] for s in band)/len(band)
        b = sum(s[4] for s in band)/len(band)
        off = (k + 0.5) / nstops
        stops.append((round(off, 3), f'#{int(r):02X}{int(g):02X}{int(b):02X}'))

    # extend the first/last stop to the ends so the fill covers the whole shape
    if stops:
        stops[0] = (0.0, stops[0][1])
        stops[-1] = (1.0, stops[-1][1])

    # express the axis as two points on the unit box, centred on the shape
    cx, cy = 0.5, 0.5
    x1, y1 = cx - ux*0.5, cy - uy*0.5
    x2, y2 = cx + ux*0.5, cy + uy*0.5
    return dict(x1=round(x1, 3), y1=round(y1, 3), x2=round(x2, 3), y2=round(y2, 3),
                stops=stops, n=len(samples))


if __name__ == '__main__':
    im = load()
    data = collect(im)
    res = {}
    for k, v in data.items():
        f = fit(v)
        res[k] = f
        print(f'{k:5s} px={f["n"]:7d}  axis=({f["x1"]},{f["y1"]})->({f["x2"]},{f["y2"]})')
        print('       stops:', '  '.join(f'{o}:{c}' for o, c in f['stops']))
    json.dump(res, open('/tmp/tclean/gradients.json', 'w'), indent=1)
    print('saved /tmp/tclean/gradients.json')
