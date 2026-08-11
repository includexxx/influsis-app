"""One-off script: downscale + JPEG-compress the raw Figma photo exports in
assets/images/onboarding/ so they're reasonably sized for a mobile bundle.
Run once after extracting assets from Figma, then delete this script (or keep
for future re-extraction runs).
"""

import os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "onboarding")

# filename -> max(width, height) cap in px
TARGETS = {
    "slide1-hero.png": 900,
    "slide2-photo1.png": 500,
    "slide2-photo2.png": 500,
    "slide2-photo3.png": 500,
    "slide3-card1.png": 500,
    "slide3-card2.png": 500,
    "slide3-card3.png": 500,
    "slide3-card4.png": 500,
    "slide3-hero.png": 700,
    "landing-collage1.png": 500,
    "landing-collage2.png": 500,
    "landing-collage3.png": 500,
    "landing-collage4.png": 500,
    "landing-hero.png": 700,
}

for fname, cap in TARGETS.items():
    src = os.path.join(DIR, fname)
    if not os.path.exists(src):
        print(f"skip (missing): {fname}")
        continue
    im = Image.open(src).convert("RGB")
    w, h = im.size
    scale = cap / max(w, h)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    dst = os.path.join(DIR, fname.replace(".png", ".jpg"))
    im.save(dst, "JPEG", quality=82, optimize=True)
    os.remove(src)
    print(f"{fname}: {w}x{h} -> {im.size[0]}x{im.size[1]}, {os.path.getsize(dst)//1024}KB -> {dst}")
