"""One-off script: prepare the assets for the Withdraw to Bank flow (Figma
nodes 6212:7623 / 7801 / 7849) and its success screen (6407:5772), in
assets/images/withdraw/ and assets/images/withdraw/banks/.

Two passes:

1. **Rasterize** the SVG exports to PNG (expo-image does not render SVG),
   the same approach scripts/rasterize-icons.py established. Targets are
   ~4x their on-screen size, except the confetti burst, which is wide
   artwork rather than a glyph and goes at 4x its 337.77x198.25 frame.
2. **Trim + downscale** the bitmap exports. Every bank logo ships with a
   wide white/transparent margin baked in (the Agrani export is 1200x630
   with the seal centered). Figma hides that margin by cropping the fill -
   a fitted `object-cover` - which a single `contentFit` can't express, so
   the margin is cropped out here instead, letting BankRow render every
   logo with a plain `contentFit="contain"` in one uniform 30x30 box.

The 113px green tick is exported whole (circle + glyph together, Figma's
"Check" node) rather than composed from assets/images/icons/success-check.png,
which is the bare tick only.
"""

import os
import resvg_py
from PIL import Image, ImageChops

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "withdraw")

# (filename stem, output width, output height)
SVG_JOBS = [
    ("account-user", 80, 80),  # 20x20 account-number field icon
    ("hint-bulb", 128, 128),  # 32x32 OTP hint card icon
    ("success-confetti", 1351, 793),  # 337.77x198.25 confetti burst
    ("success-check", 452, 452),  # 113x113 green circle + tick
]

# relative path -> max(width, height) cap in px (~4x display size)
BITMAP_JOBS = {
    "avatar-48.png": 192,  # 48x48 receipt avatar
    "banks/city-bank.png": 120,  # every bank logo renders in a 30x30 box
    "banks/social-islami-1.png": 120,
    "banks/social-islami-2.png": 120,
    "banks/social-islami-3.png": 120,
    "banks/eastern-bank.png": 120,
    "banks/dhaka-bank.png": 120,
    "banks/first-security-islami.png": 120,
    "banks/uttora-bank.png": 120,
    "banks/bangladesh-agriculture.png": 120,
    "banks/rupali-bank.png": 120,
    "banks/sonali-bank.png": 120,
    "banks/janata-bank.png": 120,
    "banks/pubali-bank.png": 120,
    "banks/agrani-bank.png": 120,
}

# The avatar is full-bleed artwork, and the SIBL red tile's "border" is its
# own red background - trimming either would eat real pixels (the tile would
# be left as just its knocked-out white lettering).
NO_TRIM = {"avatar-48.png", "social-islami-2.png"}


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
