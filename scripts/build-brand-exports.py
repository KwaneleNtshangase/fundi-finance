#!/usr/bin/env python3
"""
Build the full Notho asset set from brand/svg.

Why both transparent and opaque
-------------------------------
"Make everything transparent" is the wrong rule. Platforms disagree, and each
rejects the other's format:

  - Meta app icon  : REJECTS a white background. Needs alpha.
  - Apple iOS icon : REJECTS alpha. Needs opaque; a transparent PNG renders
                     black on the home screen.
  - PWA maskable   : needs opaque. The mask crops to a shape, and alpha inside
                     the safe zone shows the wallpaper through the icon.
  - Open Graph     : opaque. Several clients composite alpha onto black.
  - favicon        : transparent, so it sits on any browser chrome.
  - Print / PDF    : opaque, unless deliberately overprinting.

So every mark is emitted twice, and the README says which to reach for.

Flat vs gradient
----------------
The gradient mark bands badly below ~128px: the mid-stop puts a muddy dark
streak through the teal stroke. Anything icon-sized uses the flat mark; the
large lockups keep the gradient.

Run: python3 scripts/build-brand-exports.py
"""
import os
import shutil

import cairosvg
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG = os.path.join(ROOT, "brand", "svg")
OUT = os.path.join(ROOT, "brand-exports")

WHITE = (255, 255, 255, 255)
NAVY = (10, 32, 78, 255)
CLEAR = (0, 0, 0, 0)


def render(name, width=4096):
    """SVG -> supersampled RGBA, trimmed to its own ink."""
    tmp = os.path.join(OUT, "_tmp.png")
    cairosvg.svg2png(url=os.path.join(SVG, name), write_to=tmp, output_width=width)
    im = Image.open(tmp).convert("RGBA")
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 4)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    os.remove(tmp)
    return im


def square(mark, size, bg=CLEAR, pad=0.16):
    c = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * pad))
    s = min(inner / mark.width, inner / mark.height)
    r = mark.resize((max(1, round(mark.width * s)), max(1, round(mark.height * s))),
                    Image.LANCZOS)
    c.alpha_composite(r, ((size - r.width) // 2, (size - r.height) // 2))
    return c


def wide(master, w, bg=CLEAR):
    h = round(master.height * w / master.width)
    c = Image.new("RGBA", (w, h), bg)
    c.alpha_composite(master.resize((w, h), Image.LANCZOS))
    return c


def save(im, rel):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] == 255:
        im.convert("RGB").save(p, quality=95)   # fully opaque -> drop the channel
    else:
        im.save(p)
    return rel


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    flat = render("notho-icon-flat.svg")
    grad = render("notho-icon-mark.svg")
    on_light = render("notho-logo-transparent-on-light.svg")
    on_dark = render("notho-logo-transparent-on-dark.svg")
    wordmark = render("notho-wordmark.svg")

    made = []

    # ── icon, transparent ────────────────────────────────────────────────
    for s in (1024, 512, 256, 192, 128, 64, 48, 32, 16):
        made.append(save(square(flat, s, CLEAR), f"icon/transparent/notho-icon-{s}.png"))

    # ── icon, opaque: white and navy grounds ─────────────────────────────
    for s in (1024, 512, 256, 192, 128, 64):
        made.append(save(square(flat, s, WHITE), f"icon/opaque-white/notho-icon-{s}.png"))
        made.append(save(square(flat, s, NAVY), f"icon/opaque-navy/notho-icon-{s}.png"))

    # ── platform-specific, named for where they go ───────────────────────
    made.append(save(square(flat, 1024, CLEAR, pad=0.20), "platform/meta-app-icon-1024.png"))
    made.append(save(square(flat, 1024, WHITE, pad=0.12), "platform/ios-app-icon-1024.png"))
    made.append(save(square(flat, 180, WHITE, pad=0.10), "platform/apple-touch-icon-180.png"))
    made.append(save(square(flat, 512, WHITE, pad=0.20), "platform/pwa-maskable-512.png"))
    made.append(save(square(flat, 192, WHITE, pad=0.20), "platform/pwa-maskable-192.png"))
    made.append(save(square(flat, 512, CLEAR, pad=0.10), "platform/pwa-any-512.png"))

    ico = square(flat, 64, CLEAR)
    p = os.path.join(OUT, "platform", "favicon.ico")
    ico.save(p, sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    made.append("platform/favicon.ico")

    # Open Graph: 1200x630, opaque, lockup centred
    og = Image.new("RGBA", (1200, 630), WHITE)
    lock = wide(on_light, 820)
    og.alpha_composite(lock, ((1200 - lock.width) // 2, (630 - lock.height) // 2))
    made.append(save(og, "platform/og-image-1200x630.png"))

    og_d = Image.new("RGBA", (1200, 630), NAVY)
    lock_d = wide(on_dark, 820)
    og_d.alpha_composite(lock_d, ((1200 - lock_d.width) // 2, (630 - lock_d.height) // 2))
    made.append(save(og_d, "platform/og-image-dark-1200x630.png"))

    # ── lockups ──────────────────────────────────────────────────────────
    for w in (2400, 1200, 600):
        made.append(save(wide(on_light, w, CLEAR), f"lockup/transparent-on-light/notho-logo-{w}w.png"))
        made.append(save(wide(on_dark, w, CLEAR), f"lockup/transparent-on-dark/notho-logo-{w}w.png"))
        made.append(save(wide(on_light, w, WHITE), f"lockup/opaque-white/notho-logo-{w}w.png"))
        made.append(save(wide(on_dark, w, NAVY), f"lockup/opaque-navy/notho-logo-{w}w.png"))

    # ── wordmark ─────────────────────────────────────────────────────────
    for w in (1600, 800):
        made.append(save(wide(wordmark, w, CLEAR), f"wordmark/transparent/notho-wordmark-{w}w.png"))

    # ── gradient mark, large only ────────────────────────────────────────
    for s in (1024, 512):
        made.append(save(square(grad, s, CLEAR), f"icon-gradient/notho-icon-gradient-{s}.png"))

    # ── copy the vector sources alongside ────────────────────────────────
    os.makedirs(os.path.join(OUT, "svg"), exist_ok=True)
    for f in sorted(os.listdir(SVG)):
        if f.endswith(".svg"):
            shutil.copy2(os.path.join(SVG, f), os.path.join(OUT, "svg", f))
            made.append(f"svg/{f}")

    # ── verify the alpha promise actually holds ──────────────────────────
    bad = []
    for rel in made:
        if rel.endswith(".svg") or rel.endswith(".ico"):
            continue
        im = Image.open(os.path.join(OUT, rel))
        has_alpha = im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255
        should = "transparent" in rel or rel.endswith("pwa-any-512.png") \
                 or "meta-app-icon" in rel or "icon-gradient" in rel
        if should != has_alpha:
            bad.append((rel, "expected alpha" if should else "expected opaque"))

    print(f"{len(made)} files written to brand-exports/")
    if bad:
        print(f"\n!! {len(bad)} files have the wrong alpha:")
        for r, why in bad:
            print(f"   {r}: {why}")
        raise SystemExit(1)
    print("alpha verified: every file matches what its folder promises")


if __name__ == "__main__":
    main()
