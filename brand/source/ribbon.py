#!/usr/bin/env python3
"""
Variable-width ribbon geometry.

Builds an organic tapered stroke by offsetting a bezier centreline along its
normal by a width profile, then refitting the resulting offset points as smooth
cubic beziers (Catmull-Rom -> Bezier). Output is real bezier path data, so the
result stays fully editable as nodes in Figma or Illustrator.
"""
import math


# ---------------------------------------------------------------- bezier
def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
            u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1])


def bez_d(p0, p1, p2, p3, t):
    """First derivative (tangent)."""
    u = 1 - t
    return (3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0]),
            3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1]))


class Spine:
    """A chain of cubic bezier segments forming one continuous centreline."""

    def __init__(self, segments):
        # segments: list of (p0,p1,p2,p3)
        self.segs = segments

    def sample(self, n_per_seg=40):
        pts, tans = [], []
        for si, s in enumerate(self.segs):
            # skip t=0 on later segments to avoid duplicate points
            start = 0 if si == 0 else 1
            for i in range(start, n_per_seg + 1):
                t = i / n_per_seg
                pts.append(bez(*s, t))
                tans.append(bez_d(*s, t))
        return pts, tans


def smoothstep(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def width_profile(t, w_start, w_max, w_end, peak=0.45, ease=1.0):
    """
    Taper -> swell -> taper. `peak` is where the widest point sits along the
    stroke (0..1). Uses smoothstep on each side so the joins are C1-continuous,
    which is what stops a ribbon from looking kinked.
    """
    if t <= peak:
        k = smoothstep((t / peak) ** ease) if peak > 0 else 1.0
        return w_start + (w_max - w_start) * k
    k = smoothstep((((t - peak) / (1 - peak)) ** ease)) if peak < 1 else 0.0
    return w_max + (w_end - w_max) * k


def catmull_to_bezier(pts, closed=True, tension=1.0):
    """Fit a smooth cubic bezier path through `pts`."""
    n = len(pts)
    if n < 3:
        return ''
    d = [f'M {pts[0][0]:.2f} {pts[0][1]:.2f}']
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n]
        p1 = pts[i % n]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / (6 * tension),
              p1[1] + (p2[1] - p0[1]) / (6 * tension))
        c2 = (p2[0] - (p3[0] - p1[0]) / (6 * tension),
              p2[1] - (p3[1] - p1[1]) / (6 * tension))
        d.append(f'C {c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} '
                 f'{p2[0]:.2f} {p2[1]:.2f}')
    if closed:
        d.append('Z')
    return ' '.join(d)


def _arc(centre, r, a0, a1, steps):
    d = a1 - a0
    while d <= -math.pi: d += 2*math.pi
    while d > math.pi:   d -= 2*math.pi
    return [(centre[0] + r*math.cos(a0 + d*i/steps),
             centre[1] + r*math.sin(a0 + d*i/steps))
            for i in range(1, steps + 1)]


def _cap(centre, a, b, outward, steps=4):
    """
    Round cap from `a` to `b` around `centre`, forced to bulge along the
    `outward` direction. Routing through the outward point is what stops the
    arc from taking the short way round and curling back into the stroke.
    """
    ax, ay = a[0]-centre[0], a[1]-centre[1]
    bx, by = b[0]-centre[0], b[1]-centre[1]
    r = (math.hypot(ax, ay) + math.hypot(bx, by)) / 2
    if r < 1e-6:
        return []
    a0 = math.atan2(ay, ax)
    a1 = math.atan2(by, bx)
    am = math.atan2(outward[1], outward[0])
    return _arc(centre, r, a0, am, steps) + _arc(centre, r, am, a1, steps)[:-1]


def ribbon(spine, w_start, w_max, w_end, peak=0.45, ease=1.0,
           n=60, simplify=2, tension=1.0, bias=0.0, caps=True):
    """
    Offset `spine` by the width profile on both sides and return closed path
    data. `bias` shifts the stroke off-centre (-1..1) for asymmetric weight,
    which reads as a ribbon catching the light on one edge. `caps` closes each
    end with a semicircle instead of a flat chord, so the stroke terminates
    like a drawn mark rather than a cropped one.
    """
    pts, tans = spine.sample(n)
    # Normalise node count regardless of how dense the source spine is, so the
    # exported path has an editable number of nodes rather than hundreds.
    if len(pts) > n:
        idx = [round(i * (len(pts) - 1) / (n - 1)) for i in range(n)]
        pts = [pts[i] for i in idx]
        tans = [tans[i] for i in idx]
    m = len(pts)
    left, right = [], []
    for i, (p, tg) in enumerate(zip(pts, tans)):
        t = i / (m - 1)
        L = math.hypot(*tg) or 1e-9
        nx, ny = -tg[1] / L, tg[0] / L          # unit normal
        w = width_profile(t, w_start, w_max, w_end, peak, ease) / 2.0
        off = w * bias
        left.append((p[0] + nx * (w + off), p[1] + ny * (w + off)))
        right.append((p[0] - nx * (w - off), p[1] - ny * (w - off)))

    if simplify > 1:
        left = left[::simplify] + [left[-1]]
        right = right[::simplify] + [right[-1]]

    if caps:
        te, ts = tans[-1], tans[0]
        Le = math.hypot(*te) or 1e-9
        Ls = math.hypot(*ts) or 1e-9
        out_e = (te[0]/Le, te[1]/Le)            # forward at the tip
        out_s = (-ts[0]/Ls, -ts[1]/Ls)          # backward at the tail
        outline = (left
                   + _cap(pts[-1], left[-1], right[-1], out_e)
                   + right[::-1]
                   + _cap(pts[0], right[0], left[0], out_s))
    else:
        outline = left + right[::-1]
    return catmull_to_bezier(outline, closed=True, tension=tension)


# ---------------------------------------------------------------- bounds
import re

def path_bbox(*d_strings):
    """Bounding box over the control points of one or more path strings.
    Control-point hull is a slight over-estimate of the true curve bounds,
    which is the safe direction for fitting."""
    xs, ys = [], []
    for d in d_strings:
        nums = [float(n) for n in re.findall(r'-?\d+\.?\d*', d)]
        xs += nums[0::2]
        ys += nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def fit_transform(bbox, box_w, box_h, margin):
    """Uniform scale+translate that fits bbox inside box with `margin` padding."""
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    s = min((box_w - 2*margin) / w, (box_h - 2*margin) / h)
    tx = (box_w - w*s) / 2 - x0*s
    ty = (box_h - h*s) / 2 - y0*s
    return f'translate({tx:.3f},{ty:.3f}) scale({s:.5f})', s


# ------------------------------------------------- derived / nested spines
class PolySpine:
    """A spine defined by dense samples rather than control points.
    Lets us trim and laterally offset a master gesture so every element in the
    mark is a variation on the same curve instead of an independent guess."""

    def __init__(self, pts, tans):
        self.pts, self.tans = pts, tans

    def sample(self, n_per_seg=None):
        return self.pts, self.tans


def resample(spine, n=400):
    return PolySpine(*spine.sample(n // max(1, len(getattr(spine, 'segs', [1])))))


def trim(spine, t0=0.0, t1=1.0, n=400):
    pts, tans = spine.sample(n)
    m = len(pts)
    i0, i1 = int(t0 * (m - 1)), int(t1 * (m - 1))
    i0, i1 = max(0, i0), min(m, max(i0 + 4, i1))
    return PolySpine(pts[i0:i1], tans[i0:i1])


def offset(spine, d, n=400):
    """Shift a spine sideways by `d` along its normal (positive = left)."""
    pts, tans = spine.sample(n)
    out = []
    for p, tg in zip(pts, tans):
        L = math.hypot(*tg) or 1e-9
        nx, ny = -tg[1] / L, tg[0] / L
        out.append((p[0] + nx * d, p[1] + ny * d))
    # recompute tangents from the offset curve so widths stay perpendicular
    tans2 = []
    for i in range(len(out)):
        a = out[max(0, i - 1)]
        b = out[min(len(out) - 1, i + 1)]
        tans2.append((b[0] - a[0], b[1] - a[1]))
    return PolySpine(out, tans2)


def scale_about(spine, s, pivot, n=400):
    pts, tans = spine.sample(n)
    px, py = pivot
    out = [((p[0] - px) * s + px, (p[1] - py) * s + py) for p in pts]
    return PolySpine(out, tans)


def mirror(spine, axis_x, n=400):
    """Reflect a spine about a vertical axis (keeps the gesture, flips the hand)."""
    pts, tans = spine.sample(n)
    return PolySpine([(2*axis_x - p[0], p[1]) for p in pts],
                     [(-t[0], t[1]) for t in tans])


def translate(spine, dx, dy, n=400):
    pts, tans = spine.sample(n)
    return PolySpine([(p[0]+dx, p[1]+dy) for p in pts], list(tans))
