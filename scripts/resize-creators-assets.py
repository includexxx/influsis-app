"""One-off script: downscale + JPEG-compress the raw Figma photo exports for
the Top Creators screen (Figma node 6028:7456) in
assets/images/creators/, same 900px cap scripts/resize-home-assets.py
uses for campaign-list-*.
"""

import os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "creators")
CAP = 900

# Explicit filenames only - this directory also holds icon PNGs
# (verified-check/star/location-pin, rasterized by
# rasterize-creators-assets.py) that must stay untouched raster PNGs,
# not get swept up by a blanket "every .png" glob and flattened to JPEG.
PHOTOS = [
    "sunehra-tasnim.png",
    "salman-muqtadir-1.png",
    "salman-muqtadir-2.png",
    "creator-4.png",
]

for fname in PHOTOS:
    src = os.path.join(DIR, fname)
    im = Image.open(src).convert("RGB")
    w, h = im.size
    scale = CAP / max(w, h)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    dst = os.path.join(DIR, fname.replace(".png", ".jpg"))
    im.save(dst, "JPEG", quality=82, optimize=True)
    os.remove(src)
    print(f"{fname}: {w}x{h} -> {im.size[0]}x{im.size[1]}, {os.path.getsize(dst)//1024}KB -> {dst}")
