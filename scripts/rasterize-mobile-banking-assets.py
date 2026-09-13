"""One-off script: prepare the assets for the Mobile Banking flow (Figma
nodes 6212:7700 picker, 6212:7767 bKash hand-off, 6212:7543 amount,
6212:7574 review) in assets/images/withdraw/.

Two passes, same approach as scripts/rasterize-withdraw-bank-assets.py:

1. **Rasterize** the SVG exports to PNG (expo-image does not render SVG) at
   ~4x their on-screen size.
2. **Trim + downscale** the bitmap exports. Each wallet logo ships with a
   wide white margin baked in - the bKash export is a 3840x2160 slide with
   the mark centered, and the Rocket export is a 320x320 square that Figma
   crops to a 49x34 banner. Figma hides those margins with a negative-inset
   `object-cover` fill that a single `contentFit` can't express, so the
   margins are cropped here instead, letting WithdrawMethodRow render each
   logo with a plain `contentFit="contain"` in its Figma-sized box.

The bKash checkout card and the payer avatar are full-bleed artwork, so
they are only downscaled.
"""

import os
import resvg_py
from PIL import Image, ImageChops

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "withdraw")

# (filename stem, output width, output height)
SVG_JOBS = [
    ("chevron-right-active", 96, 96),  # 24x24 pink chevron, selected row
    ("chevron-right-muted", 96, 96),  # 24x24 gray chevron, unselected row
    ("radio-selected", 80, 80),  # 20x20 filled check on the saved wallet
]

# relative path -> max(width, height) cap in px (~4x display size)
BITMAP_JOBS = {
    "logo-bkash.png": 240,  # 57x32 on the Withdraw Method picker
    "logo-nagad.png": 210,  # 51x32
    "logo-rocket.png": 200,  # 49x34
    "bkash-checkout.png": 900,  # 300x513 flattened provider checkout card
    "avatar-36.png": 144,  # 36x36 payer avatar overlaid on that card
}

NO_TRIM = {"bkash-checkout.png", "avatar-36.png"}


def trim(im: Image.Image) -> Image.Image:
    """Crop the uniform border (transparent, or the corner pixel's color)."""
    rgba = im.convert("RGBA")
    alpha = rgba.split()[-1]
    box = alpha.getbbox() if alpha.getextrema()[0] < 255 else None
    if box is None:
        rgb = rgba.convert("RGB")
        bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
        box = ImageChops.difference(rgb, bg).getbbox()
    return rgba.crop(box) if box else rgba


for stem, width, height in SVG_JOBS:
    svg_path = os.path.join(DIR, f"{stem}.svg")
    png_path = os.path.join(DIR, f"{stem}.png")
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{stem}.svg -> {stem}.png ({width}x{height}, {os.path.getsize(png_path)}B)")

for rel, cap in BITMAP_JOBS.items():
    path = os.path.join(DIR, rel)
    im = Image.open(path)
    before, before_kb = im.size, os.path.getsize(path) // 1024

    im = im.convert("RGBA") if os.path.basename(rel) in NO_TRIM else trim(im)

    w, h = im.size
    scale = cap / max(w, h)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    im.save(path, "PNG", optimize=True)
    print(
        f"{rel}: {before[0]}x{before[1]} ({before_kb}KB)"
        f" -> {im.size[0]}x{im.size[1]} ({os.path.getsize(path) // 1024}KB)"
    )
