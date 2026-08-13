"""One-off script: downscale + JPEG-compress the raw Figma photo exports for
the Top Gigs screen (Figma node 6028:7350) in assets/images/gigs/, same
800px cap scripts/resize-home-assets.py already uses for gig-1/gig-2.
"""

import os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "gigs")
CAP = 800

for fname in sorted(os.listdir(DIR)):
    if not fname.endswith(".png"):
        continue
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
