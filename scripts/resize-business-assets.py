"""One-off script: flatten transparent PNGs onto white (matching Figma's
white circular avatar backdrop) and downscale + JPEG-compress the raw Figma
business-logo exports in assets/images/businesses/, same approach and 200px cap as
scripts/resize-home-assets.py's business-logo-*.
"""

import os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "businesses")
CAP = 200

for fname in sorted(os.listdir(DIR)):
    if not fname.endswith(".png"):
        continue
    src = os.path.join(DIR, fname)
    im = Image.open(src)
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        flattened = Image.new("RGB", im.size, "white")
        flattened.paste(im, mask=im.split()[-1])
        im = flattened
    else:
        im = im.convert("RGB")
    w, h = im.size
    scale = CAP / max(w, h)
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    dst = os.path.join(DIR, fname.replace(".png", ".jpg"))
    im.save(dst, "JPEG", quality=85, optimize=True)
    os.remove(src)
    print(f"{fname}: {w}x{h} -> {im.size[0]}x{im.size[1]}, {os.path.getsize(dst)//1024}KB -> {dst}")
