"""One-off script: prepare the two provider glyphs for the Transaction
screen (Figma node 6212:7410) in assets/images/withdraw/.

`paypal.svg` is rasterized the same way scripts/rasterize-balance-assets.py
does (expo-image does not render SVG). `bkash-bird.png` ships as a 1024px
bitmap and is only downscaled - both land at ~4x their on-screen size,
matching every other icon extraction's retina convention in this project.

The 32px tinted disc behind each glyph (Figma "Ellipse 1307", node
6212:7441) is a single flat `primary[50]` fill, so it is drawn as a `View`
in components/elements/WalletAvatar rather than shipped as a raster.
"""

import os
import resvg_py
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "withdraw")

# SVG -> PNG: (stem, width, height). PayPal renders at 20x20.
SVG_JOBS = [("paypal", 80, 80)]

# Already a PNG, just downscale: filename -> max(width, height) cap.
# The bKash bird renders at 18x18.
PNG_JOBS = {"bkash-bird.png": 80}

for stem, width, height in SVG_JOBS:
    svg_path = os.path.join(DIR, f"{stem}.svg")
    png_path = os.path.join(DIR, f"{stem}.png")
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=width, height=height)
    with open(png_path, "wb") as f:
        f.write(bytearray(data))
    os.remove(svg_path)
    print(f"{stem}.svg -> {stem}.png ({width}x{height}, {os.path.getsize(png_path)}B)")

for fname, cap in PNG_JOBS.items():
    path = os.path.join(DIR, fname)
    im = Image.open(path).convert("RGBA")
    before = im.size
    w, h = im.size
    scale = cap / max(w, h)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    im.save(path, "PNG", optimize=True)
    print(f"{fname}: {before[0]}x{before[1]} -> {im.size[0]}x{im.size[1]} ({os.path.getsize(path)}B)")
